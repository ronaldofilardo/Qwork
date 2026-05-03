/**
 * app/api/cadastro/tomadores/handlers.ts
 *
 * Lógica de negócio do cadastro de tomadores (entidades/clínicas).
 * Extraída de route.ts para manutenibilidade (<500 linhas).
 */

import { StatusAprovacao } from '@/lib/db';
import { autoConvertirLeadPorCnpj } from '@/lib/db/comissionamento';
import type { CadastroTomadorInput } from './schemas';

// ============================================================================
// TYPES
// ============================================================================

export interface CadastroArquivosPaths {
  cartaoCnpjPath: string;
  contratoSocialPath: string;
  docIdentificacaoPath: string;
}

export interface CadastroResult {
  entidade: { id: number; nome: string; status: StatusAprovacao };
  contratoIdCreated: number | null;
  numeroFuncionarios: number | null;
  representanteVinculado: {
    representante_id: number;
    representante_nome: string;
    lead_id: number | null;
  } | null;
}

export interface HttpErrorResult {
  body: { error: string; details?: string };
  status: number;
}

// ============================================================================
// FILE SAVING
// ============================================================================

/** Salva arquivo usando storage compartilhado (detecta DEV/PROD) */
export async function salvarArquivo(
  file: File,
  tipo: 'cartao_cnpj' | 'contrato_social' | 'doc_identificacao',
  cnpj: string,
  tipoTomador?: 'entidade' | 'clinica'
): Promise<string> {
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
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '');

  const { uploadArquivoCadastro } =
    await import('@/lib/storage/cadastro-storage');
  const result = await uploadArquivoCadastro(
    buffer,
    tipo,
    cnpjLimpo,
    tipoTomador
  );
  return result.path;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function handleCadastroTomador(
  data: CadastroTomadorInput,
  arquivos: CadastroArquivosPaths
): Promise<CadastroResult> {
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
    numero_funcionarios_estimado: numeroFuncionarios,
    responsavel_nome: responsavelNome,
    responsavel_cpf: responsavelCpf,
    responsavel_cargo: responsavelCargo,
    responsavel_email: responsavelEmail,
    responsavel_celular: responsavelCelular,
  } = data;

  const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
  const tableName = tipo === 'clinica' ? 'clinicas' : 'entidades';

  const result = await db.transaction(async (txClient) => {
    // Status padrão para novos cadastros
    const statusToUse: StatusAprovacao = 'pendente' as StatusAprovacao;

    // Verificar duplicatas de email
    const emailCheck = await txClient.query(
      `SELECT id FROM ${tableName} WHERE email = $1`,
      [email]
    );
    if (emailCheck.rows.length > 0) {
      throw new Error('Email já cadastrado no sistema');
    }

    // Verificar duplicatas de CNPJ
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

    // Inserir entidade/clínica
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
        status, ativa, tipo
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17, $18, false, $19
      ) RETURNING id, nome, status`,
      [
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
        arquivos.cartaoCnpjPath,
        arquivos.contratoSocialPath,
        arquivos.docIdentificacaoPath,
        statusToUse,
        tipo === 'clinica' ? 'clinica' : tipo,
      ]
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

    // Persistir numero_funcionarios_estimado
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

    // Criar contrato
    let contratoIdCreated: number | null = null;

    try {
      const statusContrato = 'aguardando_aceite';

      // CRIAR CONTRATO SEMPRE
      const contratoIns = await txClient.query<{ id: number }>(
        `INSERT INTO contratos (tomador_id, numero_funcionarios, valor_total, status, aceito, tipo_tomador)
         VALUES ($1, $2, $3, $4, false, $5) RETURNING id`,
        [entidade.id, numeroFuncionarios || null, null, statusContrato, tipo]
      );
      contratoIdCreated = contratoIns.rows[0].id;

      console.info(
        JSON.stringify({
          event: 'cadastro_contract_created',
          entidade_id: entidade.id,
          contrato_id: contratoIdCreated,
          status: statusContrato,
          tipo_tomador: tipo,
        })
      );
    } catch (contratoError) {
      console.error('[CADASTRO] Erro ao criar contrato:', contratoError);
      throw contratoError;
    }

    // Auto-vincular representante por CNPJ
    let representanteVinculado: CadastroResult['representanteVinculado'] = null;

    // Auto-converter leads pendentes por match de CNPJ
    if (!representanteVinculado && cnpjLimpo) {
      try {
        const autoResult = await autoConvertirLeadPorCnpj(
          cnpjLimpo,
          tipo === 'clinica' ? null : entidade.id,
          tipo === 'clinica' ? entidade.id : null
        );
        if (autoResult) {
          representanteVinculado = {
            representante_id: autoResult.representante_id,
            representante_nome: 'Representante vinculado por CNPJ',
            lead_id: autoResult.lead_id,
          };
        }
      } catch (autoErr) {
        console.error(
          '[CADASTRO] Erro no auto-link por CNPJ (não-bloqueante):',
          autoErr
        );
      }
    }

    return {
      entidade,
      contratoIdCreated,
      numeroFuncionarios: numeroFuncionarios ?? null,
      representanteVinculado,
    };
  });

  return result;
}

// ============================================================================
// ERROR MAPPING
// ============================================================================

/** Converte erros de negócio em status HTTP adequados */
export function mapCadastroError(error: unknown): HttpErrorResult {
  if (error instanceof Error) {
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

  return {
    body: { error: 'Erro interno ao processar cadastro' },
    status: 500,
  };
}
