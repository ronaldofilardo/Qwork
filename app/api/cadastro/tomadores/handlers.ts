/**
 * app/api/cadastro/tomadores/handlers.ts
 *
 * Lógica de negócio do cadastro de tomadores (entidades/clínicas).
 * Separados da rota para facilitar testes e manutenção.
 */

import { StatusAprovacao } from '@/lib/db';
import type { CadastroTomadorInput, CadastroArquivos } from './schemas';

// ============================================================================
// TYPES
// ============================================================================

export interface CadastroTomadorResult {
  entidade: { id: number; nome: string; status: string };
  requiresPayment: boolean;
  simuladorUrl: string | null;
  contratoIdCreated: number | null;
  valorPorFuncionario: number | null;
  numeroFuncionarios: number | null;
  valorTotal: number | null;
}

// ============================================================================
// SALVAR ARQUIVO
// ============================================================================

/** Salva arquivo usando storage compartilhado (detecta DEV/PROD) */
export async function salvarArquivo(
  file: File,
  tipo: 'cartao_cnpj' | 'contrato_social' | 'doc_identificacao',
  cnpjLimpo: string,
  tipoTomador: 'entidade' | 'clinica' = 'entidade'
): Promise<string> {
  try {
    console.debug('salvarArquivo chamado', {
      name: (file as any).name,
      type: (file as any).type,
      size: (file as any).size,
      hasArrayBuffer: typeof (file as any).arrayBuffer === 'function',
    });

    if (typeof (file as any).arrayBuffer !== 'function') {
      throw new Error('file.arrayBuffer não disponível');
    }

    const bytes = await (file as any).arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { uploadArquivoCadastro } =
      await import('@/lib/storage/cadastro-storage');
    const result = await uploadArquivoCadastro(
      buffer,
      tipo,
      cnpjLimpo,
      tipoTomador
    );

    return result.path;
  } catch (error) {
    console.error('Erro ao salvar arquivo:', error);
    throw new Error('Erro ao salvar arquivo');
  }
}

// ============================================================================
// SALVAR TODOS OS ARQUIVOS
// ============================================================================

interface ArquivosPaths {
  cartaoCnpjPath: string;
  contratoSocialPath: string;
  docIdentificacaoPath: string;
}

export async function salvarTodosArquivos(
  files: CadastroArquivos,
  cnpjLimpo: string,
  tipoTomador: 'entidade' | 'clinica' = 'entidade'
): Promise<ArquivosPaths> {
  const cartaoCnpjPath = await salvarArquivo(
    files.cartao_cnpj,
    'cartao_cnpj',
    cnpjLimpo,
    tipoTomador
  );
  const contratoSocialPath = await salvarArquivo(
    files.contrato_social,
    'contrato_social',
    cnpjLimpo,
    tipoTomador
  );
  const docIdentificacaoPath = await salvarArquivo(
    files.doc_identificacao,
    'doc_identificacao',
    cnpjLimpo,
    tipoTomador
  );
  return { cartaoCnpjPath, contratoSocialPath, docIdentificacaoPath };
}

// ============================================================================
// VALIDAÇÃO DE LIMITE DO PLANO
// ============================================================================

/**
 * Valida se número de funcionários não excede o limite do plano.
 * Retorna mensagem de erro ou null se OK.
 */
export async function validarLimitePlano(
  planoId: number,
  numFuncionarios: number
): Promise<string | null> {
  const { query } = await import('@/lib/db');
  const limiteRes = await query(
    'SELECT limite_funcionarios as limite FROM planos WHERE id = $1',
    [planoId]
  );
  const limiteRaw = limiteRes.rows[0]?.limite;
  const limite = limiteRaw ? parseInt(limiteRaw) : null;
  if (limite && numFuncionarios > limite) {
    return `Número de funcionários excede o limite do plano (máx: ${limite})`;
  }
  return null;
}

// ============================================================================
// HANDLER PRINCIPAL: CADASTRO DO TOMADOR
// ============================================================================

export async function handleCadastroTomador(
  input: CadastroTomadorInput,
  arquivosPaths: ArquivosPaths
): Promise<CadastroTomadorResult> {
  const db = await import('@/lib/db');

  const {
    tipo,
    nome,
    cnpj,
    inscricao_estadual,
    email,
    telefone,
    endereco,
    cidade,
    estado,
    cep,
    plano_id: planoId,
    numero_funcionarios_estimado: numeroFuncionarios,
    responsavel_nome: responsavelNome,
    responsavel_cpf: responsavelCpf,
    responsavel_cargo: responsavelCargo,
    responsavel_email: responsavelEmail,
    responsavel_celular: responsavelCelular,
  } = input;

  const cnpjLimpo = cnpj.replace(/[^\d]/g, '');

  const result = await db.transaction(async (txClient) => {
    // ---- Determinar status inicial baseado no plano ----
    let statusToUse: StatusAprovacao = 'pendente' as StatusAprovacao;
    let requiresPersonalizadoSetup = false;

    if (planoId) {
      const planoRes = await txClient.query(
        'SELECT tipo FROM planos WHERE id = $1',
        [planoId]
      );
      const plano = planoRes.rows[0];

      if (plano?.tipo === 'personalizado') {
        statusToUse = 'pendente' as StatusAprovacao;
        requiresPersonalizadoSetup = true;
      } else {
        statusToUse = 'aguardando_pagamento' as StatusAprovacao;
      }
    }

    // ---- Verificar duplicatas (email + CNPJ) ----
    const tableName = tipo === 'clinica' ? 'clinicas' : 'entidades';

    const emailCheck = await txClient.query(
      `SELECT id FROM ${tableName} WHERE email = $1`,
      [email]
    );
    if (emailCheck.rows.length > 0) {
      throw new Error('Email já cadastrado no sistema');
    }

    const cnpjCheck = await txClient.query(
      `SELECT id FROM ${tableName} WHERE cnpj = $1`,
      [cnpjLimpo]
    );
    if (cnpjCheck.rows.length > 0) {
      throw new Error('CNPJ já cadastrado no sistema');
    }

    console.info(
      JSON.stringify({
        event: 'cadastro_cnpj_check',
        found: cnpjCheck.rows.length,
      })
    );

    // ---- Inserir na tabela correta ----
    const insertParams = [
      nome,
      cnpjLimpo,
      inscricao_estadual || null,
      email,
      telefone,
      endereco,
      cidade,
      estado.toUpperCase(),
      cep,
      responsavelNome,
      responsavelCpf.replace(/[^\d]/g, ''),
      responsavelCargo || null,
      responsavelEmail,
      responsavelCelular,
      arquivosPaths.cartaoCnpjPath,
      arquivosPaths.contratoSocialPath,
      arquivosPaths.docIdentificacaoPath,
      statusToUse,
      planoId || null,
      tipo === 'clinica' ? 'clinica' : tipo,
    ];

    const entidadeResult = await txClient.query<{
      id: number;
      nome: string;
      status: StatusAprovacao;
    }>(
      `INSERT INTO ${tableName} (
        nome, cnpj, inscricao_estadual, email, telefone,
        endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular,
        cartao_cnpj_path, contrato_social_path, doc_identificacao_path,
        status, ativa, plano_id, pagamento_confirmado, tipo
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17, $18, false, $19, false, $20
      ) RETURNING id, nome, status`,
      insertParams
    );

    const entidade = entidadeResult.rows[0];

    console.info(
      JSON.stringify({
        event: `cadastro_${tipo}_inserted_success`,
        id: entidade?.id,
        nome: entidade?.nome,
        tipo,
      })
    );

    // ---- Persistir numero_funcionarios_estimado ----
    if (numeroFuncionarios && Number(numeroFuncionarios) > 0) {
      await txClient.query(
        `UPDATE ${tableName} SET numero_funcionarios_estimado = $1 WHERE id = $2`,
        [numeroFuncionarios, entidade.id]
      );
      console.log('[CADASTRO] numero_funcionarios_estimado persistido', {
        entidadeId: entidade.id,
        numeroFuncionarios,
      });
    }

    // ---- Determinar pagamento ----
    let requiresPayment = false;
    let simuladorUrl: string | null = null;
    let valorTotal: number | null = null;
    let valorPorFuncionario: number | null = null;
    let contratoIdCreated: number | null = null;

    try {
      let statusContrato = 'aguardando_aceite';

      if (planoId) {
        const planoRes = await txClient.query(
          'SELECT preco, tipo, nome FROM planos WHERE id = $1',
          [planoId]
        );
        const p = planoRes.rows[0];
        if (p) {
          valorPorFuncionario = p.tipo === 'fixo' ? 20.0 : Number(p.preco || 0);

          if (p.tipo === 'fixo' && numeroFuncionarios) {
            valorTotal = valorPorFuncionario * numeroFuncionarios;
            requiresPayment = valorTotal > 0;
            if (requiresPayment) {
              statusContrato = 'aguardando_pagamento';
            }
          } else if (p.tipo === 'personalizado') {
            requiresPayment = valorPorFuncionario > 0;
            valorTotal = valorPorFuncionario;
            statusContrato = 'aguardando_pagamento';
          }

          if (requiresPersonalizadoSetup) {
            console.info(
              JSON.stringify({
                event: 'cadastro_entidade_personalizado_pending',
                entidade_id: entidade.id,
                plano_id: planoId,
                numero_funcionarios: numeroFuncionarios,
                status: 'aguardando_valor_admin',
                note: 'Tabela contratacao_personalizada será criada em migração futura',
              })
            );
          } else if (requiresPayment) {
            simuladorUrl = `/pagamento/simulador?entidade_id=${entidade.id}&plano_id=${planoId}&numero_funcionarios=${numeroFuncionarios || 0}`;
          }

          console.info(
            JSON.stringify({
              event: 'cadastro_entidade_payment_check',
              entidade_id: entidade.id,
              plano_id: planoId,
              plano_tipo: p?.tipo,
              plano_nome: p?.nome,
              valor_por_funcionario: valorPorFuncionario,
              numero_funcionarios: numeroFuncionarios,
              valor_total: valorTotal,
              requiresPayment,
              simuladorUrl,
              novo_fluxo: 'contract-first',
            })
          );
        }
      }

      // ---- Criar contrato SEMPRE ----
      const contratoIns = await txClient.query<{ id: number }>(
        `INSERT INTO contratos (tomador_id, plano_id, numero_funcionarios, valor_total, status, aceito, tipo_tomador)
         VALUES ($1, $2, $3, $4, $5, false, $6) RETURNING id`,
        [
          entidade.id,
          planoId || null,
          numeroFuncionarios || null,
          valorTotal,
          statusContrato,
          tipo,
        ]
      );
      contratoIdCreated = contratoIns.rows[0].id;

      console.info(
        JSON.stringify({
          event: 'cadastro_contract_created',
          entidade_id: entidade.id,
          contrato_id: contratoIdCreated,
          plano_id: planoId || null,
          status: statusContrato,
          tipo_tomador: tipo,
          requiresPayment,
        })
      );
    } catch (contratoError) {
      console.error('[CADASTRO] Erro ao criar contrato:', contratoError);
      throw contratoError;
    }

    return {
      entidade,
      requiresPayment,
      simuladorUrl,
      contratoIdCreated,
      valorPorFuncionario,
      numeroFuncionarios: numeroFuncionarios ?? null,
      valorTotal,
    };
  });

  return result;
}

// ============================================================================
// MAPEAR ERROS PARA STATUS HTTP
// ============================================================================

export interface HttpErrorResult {
  body: { error: string; details?: string };
  status: number;
}

/** Converte erros de negócio em status HTTP adequados */
export function mapCadastroError(error: unknown): HttpErrorResult {
  if (error instanceof Error) {
    // Erros de duplicação conhecidos
    if (error.message === 'Email já cadastrado no sistema') {
      return { body: { error: error.message }, status: 409 };
    }
    if (error.message === 'CNPJ já cadastrado no sistema') {
      return { body: { error: error.message }, status: 409 };
    }

    // PostgreSQL: violação de unicidade
    if ((error as any).code === '23505') {
      const constraint = (error as any).constraint;
      if (constraint === 'entidades_email_key') {
        return {
          body: { error: 'Email já cadastrado no sistema' },
          status: 409,
        };
      }
      if (constraint === 'entidades_cnpj_key') {
        return {
          body: { error: 'CNPJ já cadastrado no sistema' },
          status: 409,
        };
      }
      if (constraint?.includes('key') || constraint?.includes('unique')) {
        return { body: { error: 'Dados duplicados no sistema' }, status: 409 };
      }
    }

    // PostgreSQL: violação de FK
    if ((error as any).code === '23503') {
      return {
        body: { error: 'Dados de referência inválidos' },
        status: 400,
      };
    }

    // RLS
    if (error.message.includes('violates row level security policy')) {
      return { body: { error: 'Erro de permissão no cadastro' }, status: 403 };
    }
  }

  return { body: { error: 'Erro interno ao processar cadastro' }, status: 500 };
}
