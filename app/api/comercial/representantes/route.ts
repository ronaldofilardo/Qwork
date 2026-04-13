/**
 * POST /api/comercial/representantes
 * Cria um novo representante PJ diretamente pelo Comercial, com upload de documentos.
 * Aceita multipart/form-data com dados cadastrais + arquivos obrigatórios.
 *
 * Campos obrigatórios: documento_identificacao (CPF responsável) + cartao_cnpj
 * Campos opcionais: asaas_wallet_id
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
    const email = ((formData.get('email') as string) ?? '')
      .trim()
      .toLowerCase();
    const telefone =
      limparNumeros((formData.get('telefone') as string) ?? '') || null;
    const cpfRaw = limparNumeros((formData.get('cpf') as string) ?? '');
    const cnpjRaw =
      limparNumeros((formData.get('cnpj') as string) ?? '') || null;
    const razaoSocial =
      sanitizarString((formData.get('razao_social') as string) ?? '') || null;
    const asaasWalletId =
      ((formData.get('asaas_wallet_id') as string) ?? '').trim() || null;

    // Validações
    if (!nome || nome.length < 2 || nome.length > 200)
      return NextResponse.json(
        { error: 'Nome deve ter entre 2 e 200 caracteres.' },
        { status: 400 }
      );

    if (!email || !validarEmail(email))
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });

    if (!cnpjRaw || !validarCNPJ(cnpjRaw))
      return NextResponse.json({ error: 'CNPJ inválido.' }, { status: 400 });
    if (!razaoSocial || razaoSocial.length < 3)
      return NextResponse.json(
        { error: 'Razão social obrigatória.' },
        { status: 400 }
      );
    if (!cpfRaw || !validarCPF(cpfRaw))
      return NextResponse.json(
        { error: 'CPF do responsável legal obrigatório.' },
        { status: 400 }
      );

    // Validar documento_identificacao (CPF do responsável)
    const docFile =
      (formData.get('documento_identificacao') as File | null) ??
      (formData.get('documento_cpf_responsavel') as File | null);
    const valDoc = await validarArquivo(docFile, 'Documento de identificação');
    if (!valDoc.valid)
      return NextResponse.json(
        { error: valDoc.error, field: 'documento_identificacao' },
        { status: 400 }
      );

    // Validar cartao_cnpj obrigatório
    const cartaoFile = formData.get('cartao_cnpj') as File | null;
    const valCartao = await validarArquivo(cartaoFile, 'Cartão CNPJ');
    if (!valCartao.valid)
      return NextResponse.json(
        { error: valCartao.error, field: 'cartao_cnpj' },
        { status: 400 }
      );

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

    // Verificar duplicata de CNPJ
    if (cnpjRaw) {
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

    // Upload de documentos antes de criar o lead (sempre PJ)
    const identificador = cnpjRaw ?? cpfRaw;

    const arquivoDocId =
      (formData.get('documento_identificacao') as File | null) ??
      (formData.get('documento_cpf_responsavel') as File | null);
    const arquivoCartaoCnpj = formData.get('cartao_cnpj') as File | null;

    // Upload do documento do responsável
    let docIdKey: string | null = null;
    let docIdFilename: string | null = null;
    let docIdUrl: string | null = null;

    if (arquivoDocId) {
      const val = await validarArquivo(
        arquivoDocId,
        'Documento de identificação'
      );
      const resultado = await uploadDocumentoRepresentante(
        val.buffer!,
        'cpf_responsavel',
        identificador,
        val.contentType!,
        'pj',
        'CAD'
      );
      docIdKey = resultado.arquivo_remoto?.key ?? resultado.path;
      docIdUrl = resultado.arquivo_remoto?.url ?? resultado.path;
      docIdFilename = arquivoDocId.name;
    }

    // Upload do cartão CNPJ
    let docCnpjKey: string | null = null;
    let docCnpjFilename: string | null = null;
    let docCnpjUrl: string | null = null;

    if (arquivoCartaoCnpj) {
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
        asaas_wallet_id,
        status, ip_origem, user_agent
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14,
        $15, $16, $17,
        $18,
        'pendente_verificacao', $19, $20
      ) RETURNING id`,
      [
        'pj',
        nome,
        email,
        telefone,
        null, // cpf (PF) — não usado
        cnpjRaw,
        razaoSocial,
        cpfRaw, // cpf_responsavel
        null, // doc_cpf_key (PF) — não usado
        null, // doc_cpf_filename (PF)
        null, // doc_cpf_url (PF)
        docCnpjKey,
        docCnpjFilename,
        docCnpjUrl,
        docIdKey, // doc_cpf_resp_key
        docIdFilename,
        docIdUrl,
        asaasWalletId,
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
