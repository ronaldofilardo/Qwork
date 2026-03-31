/**
 * POST /api/representante/equipe/cadastrar
 * Cria um novo vendedor (PF ou PJ) e já o vincula à equipe do representante logado.
 * Aceita multipart/form-data com dados pessoais + upload de documentos obrigatórios.
 *
 * PF: arquivo documento_cpf obrigatório
 * PJ: documento_cnpj + documento_cpf_responsavel obrigatórios
 *
 * Fluxo:
 *   1. Autentica representante
 *   2. Valida campos + arquivos
 *   3. Insere usuário com tipo_usuario='vendedor'
 *   4. Gera código único VND-XXXXX e insere em `vendedores_perfil`
 *   5. Upload de documentos para storage (local DEV / Backblaze PROD)
 *   6. Insere vínculo em `hierarquia_comercial`
 *   7. Retorna { vendedor_id, codigo, vinculo_id, convite_url }
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import type { Session } from '@/lib/session';
import {
  gerarTokenConviteVendedor,
  logEmailConviteVendedor,
} from '@/lib/vendedores/gerar-convite';
import {
  validarArquivo,
  validarCPF,
  validarCNPJ,
} from '@/app/api/public/representantes/cadastro/helpers';
import { uploadDocumentoVendedor } from '@/lib/storage/representante-storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const sess = requireRepresentante();

    // Parse multipart
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: 'Envie os dados como multipart/form-data' },
        { status: 400 }
      );
    }

    // Extrair campos texto
    const nome = (formData.get('nome') as string | null)?.trim() ?? '';
    const cpfRaw =
      (formData.get('cpf') as string | null)?.replace(/\D/g, '') ?? '';
    const tipoPessoa = (
      (formData.get('tipo_pessoa') as string | null) ?? 'pf'
    ).toLowerCase() as 'pf' | 'pj';
    const sexo = (formData.get('sexo') as string | null) ?? null;
    const email = (formData.get('email') as string | null)?.trim() ?? null;
    const endereco =
      (formData.get('endereco') as string | null)?.trim() ?? null;
    const cidade = (formData.get('cidade') as string | null)?.trim() ?? null;
    const estado = (formData.get('estado') as string | null)?.trim() ?? null;
    const cep =
      (formData.get('cep') as string | null)?.replace(/\D/g, '') ?? null;

    // Campos PJ
    const cnpjRaw =
      (formData.get('cnpj') as string | null)?.replace(/\D/g, '') ?? null;
    const razaoSocial =
      (formData.get('razao_social') as string | null)?.trim() ?? null;
    const cpfResponsavelRaw =
      (formData.get('cpf_responsavel') as string | null)?.replace(/\D/g, '') ??
      null;

    // Validação de campos obrigatórios
    if (!nome || nome.length < 2 || nome.length > 200)
      return NextResponse.json(
        { error: 'Nome deve ter entre 2 e 200 caracteres.' },
        { status: 400 }
      );

    if (tipoPessoa !== 'pf' && tipoPessoa !== 'pj')
      return NextResponse.json(
        { error: 'tipo_pessoa deve ser pf ou pj.' },
        { status: 400 }
      );

    if (tipoPessoa === 'pf') {
      if (!cpfRaw || cpfRaw.length !== 11 || !validarCPF(cpfRaw))
        return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 });
    } else {
      // PJ
      if (!cnpjRaw || cnpjRaw.length !== 14 || !validarCNPJ(cnpjRaw))
        return NextResponse.json({ error: 'CNPJ inválido.' }, { status: 400 });
      if (!razaoSocial || razaoSocial.length < 3)
        return NextResponse.json(
          { error: 'Razão social é obrigatória para PJ (mín. 3 caracteres).' },
          { status: 400 }
        );
      if (
        !cpfResponsavelRaw ||
        cpfResponsavelRaw.length !== 11 ||
        !validarCPF(cpfResponsavelRaw)
      )
        return NextResponse.json(
          { error: 'CPF do responsável PJ inválido.' },
          { status: 400 }
        );
      // PJ também precisa de CPF do vendedor para identificação no sistema de usuários
      if (!cpfRaw || cpfRaw.length !== 11 || !validarCPF(cpfRaw))
        return NextResponse.json(
          { error: 'CPF do representante legal é obrigatório mesmo para PJ.' },
          { status: 400 }
        );
    }

    if (sexo && !['masculino', 'feminino'].includes(sexo))
      return NextResponse.json({ error: 'Sexo inválido.' }, { status: 400 });

    // Validar arquivos obrigatórios
    if (tipoPessoa === 'pf') {
      const valCpf = await validarArquivo(
        formData.get('documento_cpf') as File | null,
        'Documento CPF'
      );
      if (!valCpf.valid)
        return NextResponse.json(
          { error: valCpf.error, field: 'documento_cpf' },
          { status: 400 }
        );
    } else {
      const valCnpj = await validarArquivo(
        formData.get('documento_cnpj') as File | null,
        'Cartão CNPJ'
      );
      if (!valCnpj.valid)
        return NextResponse.json(
          { error: valCnpj.error, field: 'documento_cnpj' },
          { status: 400 }
        );
      const valCpfResp = await validarArquivo(
        formData.get('documento_cpf_responsavel') as File | null,
        'CPF do Responsável'
      );
      if (!valCpfResp.valid)
        return NextResponse.json(
          { error: valCpfResp.error, field: 'documento_cpf_responsavel' },
          { status: 400 }
        );
    }

    // Sessão RLS
    const rlsSess: Session = {
      cpf: sess.cpf ?? '',
      nome: sess.nome,
      perfil: 'representante',
      representante_id: sess.representante_id,
    };

    // Buscar dados do representante-pai para montar path de storage
    const repData = await query<{
      tipo_pessoa: string;
      cpf: string | null;
      cnpj: string | null;
    }>(
      `SELECT tipo_pessoa, cpf, cnpj FROM public.representantes WHERE id = $1`,
      [sess.representante_id],
      rlsSess
    );
    if (repData.rows.length === 0)
      return NextResponse.json(
        { error: 'Representante não encontrado.' },
        { status: 404 }
      );

    const rep = repData.rows[0];
    const repTipoPessoa = rep.tipo_pessoa as 'pf' | 'pj';
    const repIdentificador =
      repTipoPessoa === 'pj' ? (rep.cnpj ?? rep.cpf ?? '') : (rep.cpf ?? '');

    // Verificar CPF duplicado em usuarios
    const cpfExistente = await query<{ id: number }>(
      `SELECT id FROM public.usuarios WHERE cpf = $1 LIMIT 1`,
      [cpfRaw],
      rlsSess
    );
    if (cpfExistente.rows.length > 0)
      return NextResponse.json(
        { error: 'Já existe um usuário cadastrado com este CPF.' },
        { status: 409 }
      );

    // Verificar CNPJ duplicado em vendedores_perfil (PJ)
    if (tipoPessoa === 'pj' && cnpjRaw) {
      const cnpjExistente = await query<{ id: number }>(
        `SELECT id FROM public.vendedores_perfil WHERE cnpj = $1 LIMIT 1`,
        [cnpjRaw],
        rlsSess
      );
      if (cnpjExistente.rows.length > 0)
        return NextResponse.json(
          { error: 'Já existe um vendedor cadastrado com este CNPJ.' },
          { status: 409 }
        );
    }

    // Inserir usuário
    const userResult = await query<{ id: number }>(
      `INSERT INTO public.usuarios (cpf, nome, email, tipo_usuario)
       VALUES ($1, $2, $3, 'vendedor')
       RETURNING id`,
      [cpfRaw, nome, email ?? null],
      rlsSess
    );
    const vendedorId = userResult.rows[0].id;

    // Gerar código sequencial via sequência do banco
    const codigoResult = await query<{ codigo: string }>(
      `SELECT nextval('public.seq_vendedor_codigo')::text AS codigo`,
      [],
      rlsSess
    );
    const codigo = codigoResult.rows[0].codigo;

    // Inserir perfil do vendedor (com novos campos PJ)
    await query(
      `INSERT INTO public.vendedores_perfil
         (usuario_id, codigo, sexo, endereco, cidade, estado, cep, tipo_pessoa, cnpj, cpf_responsavel_pj, razao_social)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        vendedorId,
        codigo,
        sexo ?? null,
        endereco ?? null,
        cidade ?? null,
        estado ?? null,
        cep ?? null,
        tipoPessoa,
        tipoPessoa === 'pj' ? cnpjRaw : null,
        tipoPessoa === 'pj' ? cpfResponsavelRaw : null,
        tipoPessoa === 'pj' ? razaoSocial : null,
      ],
      rlsSess
    );

    // Upload de documentos
    const vendedorIdentificador =
      tipoPessoa === 'pj' && cnpjRaw ? cnpjRaw : cpfRaw;
    const docPaths: string[] = [];

    if (tipoPessoa === 'pf') {
      const fileCpf = formData.get('documento_cpf') as File;
      const valCpf = await validarArquivo(fileCpf, 'Documento CPF');
      const resultCpf = await uploadDocumentoVendedor({
        buffer: valCpf.buffer!,
        tipo: 'cpf',
        repIdentificador,
        repTipoPessoa,
        vendedorIdentificador,
        subpasta: 'CAD',
        contentType: valCpf.contentType!,
      });
      docPaths.push(resultCpf.arquivo_remoto?.key ?? resultCpf.path);
    } else {
      const fileCnpj = formData.get('documento_cnpj') as File;
      const valCnpj = await validarArquivo(fileCnpj, 'Cartão CNPJ');
      const resultCnpj = await uploadDocumentoVendedor({
        buffer: valCnpj.buffer!,
        tipo: 'cnpj',
        repIdentificador,
        repTipoPessoa,
        vendedorIdentificador,
        subpasta: 'CAD',
        contentType: valCnpj.contentType!,
      });
      docPaths.push(resultCnpj.arquivo_remoto?.key ?? resultCnpj.path);

      const fileCpfResp = formData.get('documento_cpf_responsavel') as File;
      const valCpfResp = await validarArquivo(
        fileCpfResp,
        'CPF do Responsável'
      );
      const resultCpfResp = await uploadDocumentoVendedor({
        buffer: valCpfResp.buffer!,
        tipo: 'cpf_responsavel',
        repIdentificador,
        repTipoPessoa,
        vendedorIdentificador,
        subpasta: 'CAD',
        contentType: valCpfResp.contentType!,
      });
      docPaths.push(resultCpfResp.arquivo_remoto?.key ?? resultCpfResp.path);
    }

    // Atualizar doc_cad_path
    if (docPaths.length > 0) {
      await query(
        `UPDATE public.vendedores_perfil SET doc_cad_path = $1 WHERE usuario_id = $2`,
        [docPaths.join(';'), vendedorId],
        rlsSess
      );
    }

    // Vincular ao representante
    const vinculoResult = await query<{ id: number }>(
      `INSERT INTO public.hierarquia_comercial (vendedor_id, representante_id, ativo)
       VALUES ($1, $2, true)
       RETURNING id`,
      [vendedorId, sess.representante_id],
      rlsSess
    );
    const vinculoId = vinculoResult.rows[0].id;

    // Gerar token de convite para o vendedor criar sua senha
    const convite = await gerarTokenConviteVendedor(vendedorId, {
      query: (sql: string, params?: unknown[]) => query(sql, params, rlsSess),
    } as never);
    logEmailConviteVendedor(nome, email ?? '', convite.link, convite.expira_em);

    return NextResponse.json(
      {
        vendedor_id: vendedorId,
        codigo,
        vinculo_id: vinculoId,
        convite_url: convite.link,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    return NextResponse.json(r.body, { status: r.status });
  }
}
