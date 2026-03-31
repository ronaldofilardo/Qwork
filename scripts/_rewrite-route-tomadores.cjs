/**
 * Script CJS: Rewrite app/api/cadastro/tomadores/route.ts
 * Replaces 779L monolith with ~125L thin controller
 * delegating to schemas.ts + handlers.ts.
 */
const fs = require('fs');
const path = require('path');

const routePath = path.join(
  __dirname,
  '..',
  'app',
  'api',
  'cadastro',
  'tomadores',
  'route.ts'
);

// Backup
const backup = fs.readFileSync(routePath, 'utf-8');
fs.writeFileSync(routePath + '.bak', backup, 'utf-8');

const newContent = `/**
 * app/api/cadastro/tomadores/route.ts
 *
 * Thin controller: parse request → validate → delegate → respond.
 * Business logic lives in handlers.ts, validation in schemas.ts.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractFormDataFields,
  CadastroTomadorSchema,
  validarArquivos,
} from './schemas';
import {
  handleCadastroTomador,
  salvarTodosArquivos,
  validarLimitePlano,
  mapCadastroError,
} from './handlers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // 1. Extract & validate fields via Zod
    const raw = extractFormDataFields(formData);
    const parsed = CadastroTomadorSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Dados inválidos';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }
    const input = parsed.data;

    // 2. Validate required files
    const filesResult = validarArquivos(
      formData.get('cartao_cnpj') as File | null,
      formData.get('contrato_social') as File | null,
      formData.get('doc_identificacao') as File | null
    );
    if (!filesResult.success || !filesResult.files) {
      return NextResponse.json(
        { error: filesResult.error || 'Anexos inválidos' },
        { status: 400 }
      );
    }

    // 3. Optional: validate plan employee limit
    if (input.plano_id && input.numero_funcionarios_estimado) {
      const limiteError = await validarLimitePlano(
        input.plano_id,
        input.numero_funcionarios_estimado
      );
      if (limiteError) {
        return NextResponse.json({ error: limiteError }, { status: 400 });
      }
    }

    // Structured log: start
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    console.info(
      JSON.stringify({
        event: 'cadastro_tomador_start',
        cnpj: input.cnpj.replace(/(\\d{8})(\\d{4,})/, '********$2'),
        email: input.email,
        planoId: input.plano_id,
        ip,
      })
    );

    // 4. Save files
    const cnpjLimpo = input.cnpj.replace(/[^\\d]/g, '');
    let arquivosPaths;
    try {
      arquivosPaths = await salvarTodosArquivos(filesResult.files, cnpjLimpo);
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

    // 5. Execute business logic (transaction)
    const result = await handleCadastroTomador(input, arquivosPaths);

    // Structured log: success
    console.info(
      JSON.stringify({
        event: 'cadastro_entidade_success',
        entidade_id: result.entidade.id,
        requiresPayment: result.requiresPayment,
        simuladorUrl: result.simuladorUrl,
        plano_id: input.plano_id,
        valor_total: result.valorTotal,
        numero_funcionarios: result.numeroFuncionarios,
        novo_fluxo: 'contract-first',
      })
    );

    // 6. Build response (preserves exact shape for 12+ test files)
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
        message: result.contratoIdCreated
          ? 'Cadastro e contrato realizado! Revise os termos e clique em aceitar.'
          : result.requiresPayment
            ? 'Cadastro realizado! Prossiga para o simulador de pagamento.'
            : 'Cadastro realizado com sucesso! Aguarde análise do administrador.',
        entidade: {
          id: result.entidade.id,
          nome: result.entidade.nome,
          status: result.entidade.status || 'pendente',
          tipo: input.tipo,
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

    const { body, status } = mapCadastroError(error);
    return NextResponse.json(body, { status });
  }
}
`;

fs.writeFileSync(routePath, newContent, 'utf-8');

const lines = newContent.split('\n').length;
console.log('route.ts rewritten: 779L -> ' + lines + 'L');
console.log('Backup saved: route.ts.bak');
