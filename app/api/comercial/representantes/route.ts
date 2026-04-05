/**
 * POST /api/comercial/representantes
 * Cria um novo representante (PF ou PJ) diretamente pelo Comercial, com upload de documentos.
 * Aceita multipart/form-data com dados cadastrais + arquivos obrigatórios.
 *
 * PF: documento_identificacao obrigatório
 * PJ: documento_identificacao (CPF do responsável) + cartao_cnpj obrigatórios
 *
 * Fluxo: cria lead com status='pendente_verificacao' (aparece na fila de Candidatos).
 * O comercial verifica o lead → converte → link de convite gerado no momento da conversão.
 * Retorna: { lead_id, nome }
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
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
      (formData.get('documento_cpf_responsavel') as File | null);
    const valDoc = await validarArquivo(docFile, 'Documento de identificação');
    if (!valDoc.valid)
      return NextResponse.json(
        { error: valDoc.error, field: 'documento_identificacao' },
        { status: 400 }
      );

    // PJ: validar cartao_cnpj obrigatório
    if (tipoPessoa === 'pj') {
      const cartaoFile = formData.get('cartao_cnpj') as File | null;
      const valCartao = await validarArquivo(cartaoFile, 'Cartão CNPJ');
      if (!valCartao.valid)
        return NextResponse.json(
          { error: valCartao.error, field: 'cartao_cnpj' },
          { status: 400 }
        );
    }

    // Verificar duplicata de CPF em representantes e em leads ativos
    const [cpfRepResult, cpfLeadResult] = await Promise.all([
      query<{ id: number }>(
        `SELECT id FROM public.representantes WHERE cpf = $1 LIMIT 1`,
        [cpfRaw]
      ),
      query<{ id: string }>(
        `SELECT id FROM public.representantes_cadastro_leads WHERE cpf = $1 AND status NOT IN ('rejeitado','convertido') LIMIT 1`,
        [cpfRaw]
      ),
    ]);
    if (cpfRepResult.rows.length > 0 || cpfLeadResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Já existe um representante cadastrado com este CPF.' },
        { status: 409 }
      );
    }

    // Verificar duplicata de email em representantes e em leads ativos
    const [emailRepResult, emailLeadResult] = await Promise.all([
      query<{ id: number }>(
        `SELECT id FROM public.representantes WHERE email = $1 LIMIT 1`,
        [email]
      ),
      query<{ id: string }>(
        `SELECT id FROM public.representantes_cadastro_leads WHERE email = $1 AND status NOT IN ('rejeitado','convertido') LIMIT 1`,
        [email]
      ),
    ]);
    if (emailRepResult.rows.length > 0 || emailLeadResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Já existe um representante cadastrado com este email.' },
        { status: 409 }
      );
    }

    // Verificar duplicata de CNPJ (PJ)
    if (tipoPessoa === 'pj' && cnpjRaw) {
      const [cnpjRepResult, cnpjLeadResult] = await Promise.all([
        query<{ id: number }>(
          `SELECT id FROM public.representantes WHERE cnpj = $1 LIMIT 1`,
          [cnpjRaw]
        ),
        query<{ id: string }>(
          `SELECT id FROM public.representantes_cadastro_leads WHERE cnpj = $1 AND status NOT IN ('rejeitado','convertido') LIMIT 1`,
          [cnpjRaw]
        ),
      ]);
      if (cnpjRepResult.rows.length > 0 || cnpjLeadResult.rows.length > 0) {
        return NextResponse.json(
          { error: 'Já existe um representante cadastrado com este CNPJ.' },
          { status: 409 }
        );
      }
    }

    // Upload de documentos antes de criar o lead
    const identificador = tipoPessoa === 'pj' && cnpjRaw ? cnpjRaw : cpfRaw;

    // PF: documento_identificacao → doc_cpf_key
    // PJ: documento_identificacao → doc_cpf_resp_key  |  cartao_cnpj → doc_cnpj_key
    const arquivoDocId =
      (formData.get('documento_identificacao') as File | null) ??
      (tipoPessoa === 'pf'
        ? (formData.get('documento_cpf') as File | null)
        : (formData.get('documento_cpf_responsavel') as File | null));

    const arquivoCartaoCnpj = formData.get('cartao_cnpj') as File | null;

    // Upload do documento de identificação
    let docIdKey: string | null = null;
    let docIdFilename: string | null = null;
    let docIdUrl: string | null = null;

    if (arquivoDocId) {
      const val = await validarArquivo(
        arquivoDocId,
        'Documento de identificação'
      );
      const tipoUpload = tipoPessoa === 'pf' ? 'cpf' : 'cpf_responsavel';
      const resultado = await uploadDocumentoRepresentante(
        val.buffer!,
        tipoUpload,
        identificador,
        val.contentType!,
        tipoPessoa,
        'CAD'
      );
      docIdKey = resultado.arquivo_remoto?.key ?? resultado.path;
      docIdUrl = resultado.arquivo_remoto?.url ?? resultado.path;
      docIdFilename = arquivoDocId.name;
    }

    // Upload do cartão CNPJ (apenas PJ)
    let docCnpjKey: string | null = null;
    let docCnpjFilename: string | null = null;
    let docCnpjUrl: string | null = null;

    if (tipoPessoa === 'pj' && arquivoCartaoCnpj) {
      const val = await validarArquivo(arquivoCartaoCnpj, 'Cartão CNPJ');
      const resultado = await uploadDocumentoRepresentante(
        val.buffer!,
        'cnpj',
        identificador,
        val.contentType!,
        'pj',
        'CAD'
      );
      docCnpjKey = resultado.arquivo_remoto?.key ?? resultado.path;
      docCnpjUrl = resultado.arquivo_remoto?.url ?? resultado.path;
      docCnpjFilename = arquivoCartaoCnpj.name;
    }

    // Obter IP e user-agent para auditoria do lead
    const ipOrigem =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'comercial';
    const userAgent = request.headers.get('user-agent') ?? null;

    // Criar lead com status='pendente_verificacao' — aparece na fila de Candidatos para verificação
    const leadResult = await query<{ id: string }>(
      `INSERT INTO public.representantes_cadastro_leads (
        tipo_pessoa, nome, email, telefone,
        cpf, cnpj, razao_social, cpf_responsavel,
        doc_cpf_key, doc_cpf_filename, doc_cpf_url,
        doc_cnpj_key, doc_cnpj_filename, doc_cnpj_url,
        doc_cpf_resp_key, doc_cpf_resp_filename, doc_cpf_resp_url,
        status, ip_origem, user_agent
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14,
        $15, $16, $17,
        'pendente_verificacao', $18, $19
      ) RETURNING id`,
      [
        tipoPessoa,
        nome,
        email,
        telefone,
        tipoPessoa === 'pf' ? cpfRaw : null,
        tipoPessoa === 'pj' ? cnpjRaw : null,
        tipoPessoa === 'pj' ? razaoSocial : null,
        tipoPessoa === 'pj' ? cpfRaw : null, // cpf_responsavel para PJ
        tipoPessoa === 'pf' ? docIdKey : null, // doc_cpf_key (PF)
        tipoPessoa === 'pf' ? docIdFilename : null, // doc_cpf_filename (PF)
        tipoPessoa === 'pf' ? docIdUrl : null, // doc_cpf_url (PF)
        tipoPessoa === 'pj' ? docCnpjKey : null, // doc_cnpj_key (PJ)
        tipoPessoa === 'pj' ? docCnpjFilename : null, // doc_cnpj_filename (PJ)
        tipoPessoa === 'pj' ? docCnpjUrl : null, // doc_cnpj_url (PJ)
        tipoPessoa === 'pj' ? docIdKey : null, // doc_cpf_resp_key (PJ)
        tipoPessoa === 'pj' ? docIdFilename : null, // doc_cpf_resp_filename (PJ)
        tipoPessoa === 'pj' ? docIdUrl : null, // doc_cpf_resp_url (PJ)
        ipOrigem,
        userAgent,
      ]
    );

    console.log(
      `[COMERCIAL] Lead ${leadResult.rows[0].id} (${nome}) criado por ${session.cpf} — aguardando verificação`
    );

    return NextResponse.json(
      { lead_id: leadResult.rows[0].id, nome },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/comercial/representantes]', err);
    const msg = (err as Error).message;
    if (msg === 'Sem permissão') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }
    if (msg.includes('Já existe representante')) {
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
