import { NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { queryAsGestorRH } from '@/lib/db-gestor';
import { withTransactionAsGestor } from '@/lib/db-transaction';
import { requireClinica } from '@/lib/session';

export const dynamic = 'force-dynamic';

// ─── Rate limit: máx 100 empresas por requisição ─────────────────────────────
const MAX_EMPRESAS_POR_REQUISICAO = 100;

const bodySchema = z.object({
  empresa_ids: z
    .array(z.number().int().positive())
    .min(1, 'Selecione ao menos uma empresa')
    .max(
      MAX_EMPRESAS_POR_REQUISICAO,
      `Máximo de ${MAX_EMPRESAS_POR_REQUISICAO} empresas por operação`
    ),
  motivo: z.string().max(500).optional(),
});

interface EmpresaCheck {
  id: number;
  nome: string;
  clinica_id: number;
}

interface NumeroOrdemResult {
  numero_ordem: number;
}

interface FuncionarioElegivel {
  funcionario_cpf: string;
  funcionario_nome: string;
  motivo_inclusao: string;
  indice_atual: number;
  dias_sem_avaliacao: number;
  prioridade: 'CRÍTICA' | 'ALTA' | 'MÉDIA' | 'NORMAL';
}

interface LoteResult {
  id: number;
  liberado_em: string;
  numero_ordem: number;
}

interface LoteStatusCheck {
  id: number;
  status: string;
  numero_ordem: number;
}

export interface DetalheLiberar {
  empresa_id: number;
  empresa_nome: string;
  novo_lote_id?: number;
  numero_ordem?: number;
  avaliacoes_criadas?: number;
  sucesso: boolean;
  erro?: string;
}

export interface BulkLiberarResponse {
  sucesso: boolean;
  total_processado: number;
  total_liberado: number;
  total_erros: number;
  detalhes: DetalheLiberar[];
}

/**
 * POST /api/rh/empresas-bulk/liberar-ciclos
 *
 * Libera novos ciclos de avaliação para múltiplas empresas em sequência.
 * Respeita isolamento de clínica: só processa empresas da clínica do RH logado.
 * Cada empresa é processada em sua própria transação; falha isolada não afeta as demais.
 *
 * Body: { empresa_ids: number[], motivo?: string }
 */
export async function POST(request: Request): Promise<NextResponse> {
  // 1. Autenticação e autorização
  let session;
  try {
    session = await requireClinica();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Clínica não identificada';
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const clinicaId = session.clinica_id!;
  const cpfOperador = session.cpf;

  // 2. Validar body
  let parsed: z.infer<typeof bodySchema>;
  try {
    const body: unknown = await request.json();
    parsed = bodySchema.parse(body);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { empresa_ids, motivo } = parsed;
  const detalhes: DetalheLiberar[] = [];

  // 3. Processar cada empresa sequencialmente (isolamento de falhas)
  for (const empresaId of empresa_ids) {
    try {
      // 3a. Verificar que a empresa pertence à clínica do RH logado
      const empresaCheckResult = await query<EmpresaCheck>(
        `SELECT ec.id, ec.nome, ec.clinica_id
         FROM empresas_clientes ec
         WHERE ec.id = $1 AND ec.ativa = true
           AND (
             ec.clinica_id = $2
             OR EXISTS (
               SELECT 1 FROM funcionarios_clinicas fc
               WHERE fc.empresa_id = ec.id AND fc.clinica_id = $2
             )
           )`,
        [empresaId, clinicaId],
        session
      );

      if (empresaCheckResult.rowCount === 0) {
        detalhes.push({
          empresa_id: empresaId,
          empresa_nome: '(desconhecida)',
          sucesso: false,
          erro: 'Empresa não encontrada ou sem acesso',
        });
        continue;
      }

      const empresa = empresaCheckResult.rows[0];

      // 3b. Verificar elegibilidade: lote atual deve ser 'finalizado', 'laudo_emitido', ou 'cancelado'
      const loteAtualResult = await query<LoteStatusCheck>(
        `SELECT id, status, numero_ordem
         FROM lotes_avaliacao
         WHERE empresa_id = $1
         ORDER BY numero_ordem DESC
         LIMIT 1`,
        [empresaId]
      );

      if (loteAtualResult.rowCount !== null && loteAtualResult.rowCount > 0) {
        const loteAtual = loteAtualResult.rows[0];
        const statusNaoElegivel = [
          'ativo',
          'emissao_solicitada',
          'emissao_em_andamento',
          'rascunho',
        ];

        if (statusNaoElegivel.includes(loteAtual.status)) {
          const labels: Record<string, string> = {
            rascunho: 'Lote atual em rascunho',
            ativo: 'Lote atual ainda em andamento',
            emissao_solicitada: 'Emissão de laudo já solicitada',
            emissao_em_andamento: 'Emissão de laudo em andamento',
          };

          detalhes.push({
            empresa_id: empresaId,
            empresa_nome: empresa.nome,
            sucesso: false,
            erro:
              labels[loteAtual.status] ??
              `Lote atual em estado bloqueante: ${loteAtual.status}`,
          });
          continue;
        }
      }

      // 3c. Obter próximo número de ordem
      const numeroOrdemResult = await queryAsGestorRH<NumeroOrdemResult>(
        `SELECT obter_proximo_numero_ordem($1) AS numero_ordem`,
        [empresaId]
      );
      const numeroOrdem = numeroOrdemResult.rows[0].numero_ordem;

      // 3d. Obter funcionários elegíveis via função do banco
      const elegibilidadeResult = await queryAsGestorRH<FuncionarioElegivel>(
        `SELECT * FROM calcular_elegibilidade_lote($1, $2)`,
        [empresaId, numeroOrdem]
      );
      const funcionarios = elegibilidadeResult.rows;

      if (funcionarios.length === 0) {
        detalhes.push({
          empresa_id: empresaId,
          empresa_nome: empresa.nome,
          sucesso: false,
          erro: 'Nenhum funcionário elegível encontrado',
        });
        continue;
      }

      // 3e. Criar lote + laudo rascunho + avaliações em transação isolada
      const resultado = await withTransactionAsGestor(async (client) => {
        const descricao =
          motivo ??
          `Lote ${numeroOrdem} liberado em massa para ${empresa.nome}. ${funcionarios.length} funcionário(s) elegíve(is).`;

        const loteResult = await client.query<LoteResult>(
          `INSERT INTO lotes_avaliacao
             (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
           VALUES ($1, $2, $3, 'completo', 'ativo', $4, $5)
           RETURNING id, liberado_em, numero_ordem`,
          [empresa.clinica_id, empresaId, descricao, cpfOperador, numeroOrdem]
        );

        const lote = loteResult.rows[0];

        // Reservar laudo (rascunho) com mesmo ID do lote
        try {
          await client.query('SAVEPOINT laudo_reserva');
          await client.query(
            `INSERT INTO laudos (id, lote_id, status, criado_em, atualizado_em)
             VALUES ($1, $1, 'rascunho', NOW(), NOW())`,
            [lote.id]
          );
          await client.query('RELEASE SAVEPOINT laudo_reserva');
        } catch {
          await client.query('ROLLBACK TO SAVEPOINT laudo_reserva');
        }

        // Criar avaliações
        const agora = new Date().toISOString();
        let avaliacoesCriadas = 0;

        for (const func of funcionarios) {
          try {
            await client.query(
              `INSERT INTO avaliacoes (funcionario_cpf, status, inicio, lote_id)
               VALUES ($1, 'iniciada', $2, $3)`,
              [func.funcionario_cpf, agora, lote.id]
            );
            avaliacoesCriadas++;
          } catch (err) {
            console.warn(
              `[bulk-liberar-ciclos] falha ao criar avaliação para ${func.funcionario_cpf}:`,
              err instanceof Error ? err.message : err
            );
          }
        }

        if (avaliacoesCriadas === 0) {
          throw new Error('Nenhuma avaliação foi criada para o lote');
        }

        return { lote, avaliacoesCriadas };
      });

      detalhes.push({
        empresa_id: empresaId,
        empresa_nome: empresa.nome,
        novo_lote_id: resultado.lote.id,
        numero_ordem: resultado.lote.numero_ordem,
        avaliacoes_criadas: resultado.avaliacoesCriadas,
        sucesso: true,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`[bulk-liberar-ciclos] erro na empresa ${empresaId}:`, msg);
      detalhes.push({
        empresa_id: empresaId,
        empresa_nome: `empresa #${empresaId}`,
        sucesso: false,
        erro: msg,
      });
    }
  }

  const total_liberado = detalhes.filter((d) => d.sucesso).length;
  const total_erros = detalhes.filter((d) => !d.sucesso).length;

  const response: BulkLiberarResponse = {
    sucesso: total_liberado > 0,
    total_processado: detalhes.length,
    total_liberado,
    total_erros,
    detalhes,
  };

  const status = total_liberado > 0 ? 200 : 422;
  return NextResponse.json(response, { status });
}
