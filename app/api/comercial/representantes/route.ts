/**
 * POST /api/comercial/representantes
 * Cria um novo representante (PF ou PJ) diretamente pelo Comercial, com upload de documentos.
 * Aceita multipart/form-data com dados cadastrais + arquivos obrigatórios.
 *
 * PF: documento_cpf obrigatório
 * PJ: documento_cnpj + documento_cpf_responsavel obrigatórios
 *
 * Retorna: { representante_id, codigo, convite_url }
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import {
  gerarTokenConvite,
  logEmailConvite,
} from '@/lib/representantes/gerar-convite';
import {
  validarArquivo,
  validarCPF,
  validarCNPJ,
  validarEmail,
  sanitizarString,
  limparNumeros,
} from '@/app/api/public/representantes/cadastro/helpers';
import { uploadDocumentoRepresentante } from '@/lib/storage/representante-storage';

export const dynamic = 'force-dynamic';

function gerarCodigoRepresentante(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole(['comercial', 'admin'], false);

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
    const nome = sanitizarString((formData.get('nome') as string) ?? '');
    const tipoPessoa = (
      (formData.get('tipo_pessoa') as string) ?? 'pf'
    ).toLowerCase() as 'pf' | 'pj';
    const email = ((formData.get('email') as string) ?? '')
      .trim()
      .toLowerCase();
    const telefone =
      limparNumeros((formData.get('telefone') as string) ?? '') || null;

    // Campos PF
    const cpfRaw = limparNumeros((formData.get('cpf') as string) ?? '');

    // Campos PJ
    const cnpjRaw =
      limparNumeros((formData.get('cnpj') as string) ?? '') || null;
    const razaoSocial =
      sanitizarString((formData.get('razao_social') as string) ?? '') || null;
    const cpfResponsavelRaw =
      limparNumeros((formData.get('cpf_responsavel') as string) ?? '') || null;

    // Validações
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

    if (!email || !validarEmail(email))
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });

    if (tipoPessoa === 'pf') {
      if (!cpfRaw || !validarCPF(cpfRaw))
        return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 });
    } else {
      // PJ
      if (!cnpjRaw || !validarCNPJ(cnpjRaw))
        return NextResponse.json({ error: 'CNPJ inválido.' }, { status: 400 });
      if (!razaoSocial || razaoSocial.length < 3)
        return NextResponse.json(
          { error: 'Razão social obrigatória para PJ.' },
          { status: 400 }
        );
      if (!cpfResponsavelRaw || !validarCPF(cpfResponsavelRaw))
        return NextResponse.json(
          { error: 'CPF do responsável PJ inválido.' },
          { status: 400 }
        );
      // CPF do responsável também vai para coluna cpf do representante
      if (!cpfRaw || !validarCPF(cpfRaw))
        return NextResponse.json(
          { error: 'CPF do representante legal obrigatório.' },
          { status: 400 }
        );
    }

    // Validar arquivo obrigatório (campo unificado 'documento_identificacao')
    const docFile =
      (formData.get('documento_identificacao') as File | null) ??
      (formData.get('documento_cpf') as File | null) ??
      (formData.get('documento_cnpj') as File | null);
    const valDoc = await validarArquivo(docFile, 'Documento de identificação');
    if (!valDoc.valid)
      return NextResponse.json(
        { error: valDoc.error, field: 'documento_identificacao' },
        { status: 400 }
      );

    // Verificar duplicata de CPF em representantes
    const cpfExistente = await query<{ id: number }>(
      `SELECT id FROM public.representantes WHERE cpf = $1 LIMIT 1`,
      [cpfRaw]
    );
    if (cpfExistente.rows.length > 0) {
      return NextResponse.json(
        { error: 'Já existe um representante cadastrado com este CPF.' },
        { status: 409 }
      );
    }

    // Verificar duplicata de email em representantes
    const emailExistente = await query<{ id: number }>(
      `SELECT id FROM public.representantes WHERE email = $1 LIMIT 1`,
      [email]
    );
    if (emailExistente.rows.length > 0) {
      return NextResponse.json(
        { error: 'Já existe um representante cadastrado com este email.' },
        { status: 409 }
      );
    }

    // Verificar duplicata de CNPJ (PJ)
    if (tipoPessoa === 'pj' && cnpjRaw) {
      const cnpjExistente = await query<{ id: number }>(
        `SELECT id FROM public.representantes WHERE cnpj = $1 LIMIT 1`,
        [cnpjRaw]
      );
      if (cnpjExistente.rows.length > 0) {
        return NextResponse.json(
          { error: 'Já existe um representante cadastrado com este CNPJ.' },
          { status: 409 }
        );
      }
    }

    // Gerar código único (retry em caso de colisão)
    let codigo = '';
    for (let tentativa = 0; tentativa < 10; tentativa++) {
      const candidato = gerarCodigoRepresentante();
      const colisao = await query<{ id: number }>(
        `SELECT id FROM public.representantes WHERE codigo = $1 LIMIT 1`,
        [candidato]
      );
      if (colisao.rows.length === 0) {
        codigo = candidato;
        break;
      }
    }
    if (!codigo) {
      codigo = Date.now().toString(36).toUpperCase().slice(-8);
    }

    // Inserir representante com status 'aguardando_senha'
    const insertResult = await query<{ id: number }>(
      `INSERT INTO public.representantes
        (nome, cpf, cnpj, cpf_responsavel_pj, email, telefone, tipo_pessoa, codigo, status, aceite_termos, aceite_disclaimer_nv, aceite_politica_privacidade)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'aguardando_senha', FALSE, FALSE, FALSE)
       RETURNING id`,
      [
        nome,
        cpfRaw,
        tipoPessoa === 'pj' ? cnpjRaw : null,
        tipoPessoa === 'pj' ? cpfResponsavelRaw : null,
        email,
        telefone,
        tipoPessoa,
        codigo,
      ]
    );

    const representanteId = insertResult.rows[0].id;

    // Criar entrada vazia em representantes_senhas (sem senha ainda)
    await query(
      `INSERT INTO public.representantes_senhas (representante_id, cpf, primeira_senha_alterada)
       VALUES ($1, $2, FALSE)`,
      [representanteId, cpfRaw]
    );

    // Upload de documentos (mesmo fluxo da landing page)
    const identificador = tipoPessoa === 'pj' && cnpjRaw ? cnpjRaw : cpfRaw;
    const docPaths: string[] = [];

    // Campo unificado: documento_identificacao (com fallback para nomes específicos)
    const arquivoDoc =
      (formData.get('documento_identificacao') as File | null) ??
      (tipoPessoa === 'pf'
        ? (formData.get('documento_cpf') as File | null)
        : (formData.get('documento_cnpj') as File | null));

    if (arquivoDoc) {
      const valDocUpload = await validarArquivo(
        arquivoDoc,
        'Documento de identificação'
      );
      const subpasta = tipoPessoa === 'pj' ? 'cnpj' : 'cpf';
      const resultado = await uploadDocumentoRepresentante(
        valDocUpload.buffer!,
        subpasta,
        identificador,
        valDocUpload.contentType!,
        tipoPessoa,
        'CAD'
      );
      docPaths.push(resultado.arquivo_remoto?.key ?? resultado.path);
    }

    // Para PJ, se enviou documento_cpf_responsavel separadamente, fazer upload adicional
    const arquivoCpfResp = formData.get(
      'documento_cpf_responsavel'
    ) as File | null;
    if (tipoPessoa === 'pj' && arquivoCpfResp) {
      const valCpfResp = await validarArquivo(
        arquivoCpfResp,
        'CPF do Responsável'
      );
      const resultCpfResp = await uploadDocumentoRepresentante(
        valCpfResp.buffer!,
        'cpf_responsavel',
        identificador,
        valCpfResp.contentType!,
        'pj',
        'CAD'
      );
      docPaths.push(resultCpfResp.arquivo_remoto?.key ?? resultCpfResp.path);
    }

    // Atualizar doc_identificacao_path
    if (docPaths.length > 0) {
      await query(
        `UPDATE public.representantes SET doc_identificacao_path = $1 WHERE id = $2`,
        [docPaths.join(';'), representanteId]
      );
    }

    // Gerar token de convite (7 dias de validade)
    const convite = await gerarTokenConvite(representanteId, { query } as any);

    // Log fake email (padrão do projeto)
    logEmailConvite(nome, email, convite.link, convite.expira_em);

    console.log(
      `[COMERCIAL] Representante #${representanteId} (${nome}) criado por ${session.cpf} — convite gerado`
    );

    return NextResponse.json(
      {
        representante_id: representanteId,
        codigo,
        convite_url: convite.link,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/comercial/representantes]', err);
    const msg = (err as Error).message;
    if (msg === 'Sem permissão') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
