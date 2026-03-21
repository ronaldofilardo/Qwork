import { NextRequest, NextResponse } from 'next/server';
import {
  CadastroTomadorSchema,
  extractFormDataFields,
  validarArquivos,
} from './schemas';
import {
  salvarArquivo,
  handleCadastroTomador,
  mapCadastroError,
} from './handlers';

export async function POST(request: NextRequest): Promise<NextResponse> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'FormData inválido' }, { status: 400 });
  }

  // Extrair e validar campos com Zod
  const fields = extractFormDataFields(formData);
  const parsed = CadastroTomadorSchema.safeParse(fields);

  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    console.info(
      JSON.stringify({
        event: 'cadastro_validation_failed',
        errors: parsed.error.errors.map((e) => e.message),
      })
    );
    return NextResponse.json(
      { error: firstError?.message || 'Dados inválidos' },
      { status: 400 }
    );
  }

  // Validar arquivos obrigatórios
  const arquivosResult = validarArquivos(
    formData.get('cartao_cnpj') as File | null,
    formData.get('contrato_social') as File | null,
    formData.get('doc_identificacao') as File | null
  );

  if (!arquivosResult.success) {
    console.info(
      JSON.stringify({
        event: 'cadastro_validation_failed',
        reason: 'anexos_invalidos',
      })
    );
    return NextResponse.json({ error: arquivosResult.error }, { status: 400 });
  }

  // Salvar arquivos
  const cnpjLimpo = parsed.data.cnpj.replace(/[^\d]/g, '');
  let cartaoCnpjPath: string;
  let contratoSocialPath: string;
  let docIdentificacaoPath: string;

  try {
    cartaoCnpjPath = await salvarArquivo(
      arquivosResult.files!.cartao_cnpj,
      'cartao_cnpj',
      cnpjLimpo
    );
    contratoSocialPath = await salvarArquivo(
      arquivosResult.files!.contrato_social,
      'contrato_social',
      cnpjLimpo
    );
    docIdentificacaoPath = await salvarArquivo(
      arquivosResult.files!.doc_identificacao,
      'doc_identificacao',
      cnpjLimpo
    );
  } catch (fileError) {
    console.error(
      JSON.stringify({
        event: 'cadastro_file_save_error',
        error: String(fileError),
      })
    );
    return NextResponse.json(
      { error: 'Erro ao salvar os anexos', details: String(fileError) },
      { status: 500 }
    );
  }

  // Executar business logic
  try {
    const result = await handleCadastroTomador(parsed.data, {
      cartaoCnpjPath,
      contratoSocialPath,
      docIdentificacaoPath,
    });

    console.info(
      JSON.stringify({
        event: 'cadastro_entidade_success',
        entidade_id: result.entidade.id,
        requiresPayment: result.requiresPayment,
        simuladorUrl: result.simuladorUrl,
        valor_total: result.valorTotal,
        numero_funcionarios: result.numeroFuncionarios,
        novo_fluxo: 'contract-first',
      })
    );

    return NextResponse.json(
      {
        success: true,
        id: result.entidade.id,
        requires_payment: result.requiresPayment,
        simulador_url: result.simuladorUrl,
        contrato_id: result.contratoIdCreated,
        requires_contract_acceptance: result.contratoIdCreated !== null,
        payment_info: result.requiresPayment
          ? {
              valor_por_funcionario: result.valorPorFuncionario,
              numero_funcionarios: result.numeroFuncionarios,
              valor_total: result.valorTotal,
            }
          : null,
        representante_vinculado: result.representanteVinculado,
        message: result.contratoIdCreated
          ? 'Cadastro e contrato realizado! Revise os termos e clique em aceitar.'
          : result.requiresPayment
            ? 'Cadastro realizado! Prossiga para o simulador de pagamento.'
            : 'Cadastro realizado com sucesso! Aguarde análise do administrador.',
        entidade: {
          id: result.entidade.id,
          nome: result.entidade.nome,
          status: result.entidade.status || 'pendente',
          tipo: parsed.data.tipo,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error(
      JSON.stringify({
        event: 'cadastro_entidade_error',
        error: String(error),
        code: (error as any)?.code,
        constraint: (error as any)?.constraint,
        detail: (error as any)?.detail,
        hint: (error as any)?.hint,
        stack: error instanceof Error ? error.stack : undefined,
      })
    );

    const mapped = mapCadastroError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
