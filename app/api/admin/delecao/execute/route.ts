import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { transaction, type TransactionClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/delecao/execute
 *
 * Executa hard-delete de um tomador (entidade ou clínica) e toda a cascata
 * de dados relacionados. Implementa TODAS as 9 fases do plano de deleção.
 *
 * Body: { cnpj: string (14 dígitos), fase: number }
 *   fase 1: Comissões e vínculos (RESTRICT tables)
 *   fase 2: Laudos e artefatos
 *   fase 3: Avaliações e dados
 *   fase 4: Lotes e jobs
 *   fase 5: Financeiro (contratos, pagamentos, recibos)
 *   fase 6: Funcionários e vínculos
 *   fase 7: Senhas e usuários
 *   fase 8: Leads e comercial
 *   fase 9: Entidade/Clínica (root)
 *
 * Cada fase é executada em transação independente para progresso incremental.
 * O admin confirma cada fase no frontend antes de prosseguir.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole('admin', false);

    const body = await request.json();
    const { cnpj, fase } = body as { cnpj: unknown; fase: unknown };

    if (typeof cnpj !== 'string' || !/^\d{14}$/.test(cnpj)) {
      return NextResponse.json(
        { error: 'CNPJ inválido. Informe 14 dígitos numéricos.' },
        { status: 400 }
      );
    }

    if (typeof fase !== 'number' || fase < 1 || fase > 9) {
      return NextResponse.json(
        { error: 'Fase inválida. Informe um número de 1 a 9.' },
        { status: 400 }
      );
    }

    const deletados: Record<string, number> = {};

    await transaction(async (client: TransactionClient) => {
      // ═══════════════════════════════════════════════════════════
      // LOOKUP: Buscar tomador e coletar IDs auxiliares
      // ═══════════════════════════════════════════════════════════
      const tomadorRes = await client.query<{
        id: number;
        nome: string;
        cnpj: string;
        tipo: string;
      }>(`SELECT id, nome, cnpj, tipo FROM tomadores WHERE cnpj = $1 LIMIT 1`, [
        cnpj,
      ]);

      if (tomadorRes.rows.length === 0) {
        throw Object.assign(
          new Error('Tomador não encontrado com este CNPJ.'),
          { status: 404 }
        );
      }

      const tomador = tomadorRes.rows[0];
      const tomadorId = tomador.id;
      const isEntidade = tomador.tipo === 'entidade';

      // Coletar empresas_clientes (só clínica)
      const empresasRes = isEntidade
        ? { rows: [] as { id: number }[] }
        : await client.query<{ id: number }>(
            `SELECT id FROM empresas_clientes WHERE clinica_id = $1`,
            [tomadorId]
          );
      const empresaIds = empresasRes.rows.map((r) => r.id);

      // Coletar lote IDs
      let lotesRes: { rows: { id: number }[] };
      if (isEntidade) {
        lotesRes = await client.query<{ id: number }>(
          `SELECT id FROM lotes_avaliacao WHERE entidade_id = $1`,
          [tomadorId]
        );
      } else {
        lotesRes = await client.query<{ id: number }>(
          `SELECT id FROM lotes_avaliacao WHERE clinica_id = $1 OR empresa_id = ANY($2::int[])`,
          [tomadorId, empresaIds]
        );
      }
      const loteIds = lotesRes.rows.map((r) => r.id);

      // Coletar funcionário IDs/CPFs
      let funcRes: { rows: { id: number; cpf: string }[] };
      if (isEntidade) {
        funcRes = await client.query<{ id: number; cpf: string }>(
          `SELECT DISTINCT f.id, f.cpf FROM funcionarios f
           INNER JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
           WHERE fe.entidade_id = $1`,
          [tomadorId]
        );
      } else {
        funcRes = await client.query<{ id: number; cpf: string }>(
          `SELECT DISTINCT f.id, f.cpf FROM funcionarios f
           INNER JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
           WHERE fc.clinica_id = $1`,
          [tomadorId]
        );
      }
      const funcIds = funcRes.rows.map((r) => r.id);
      const funcCpfs = funcRes.rows.map((r) => r.cpf);

      // Coletar laudo IDs
      let laudoIds: number[] = [];
      if (loteIds.length > 0) {
        const laudoRes = await client.query<{ id: number }>(
          `SELECT id FROM laudos WHERE lote_id = ANY($1::int[])`,
          [loteIds]
        );
        laudoIds = laudoRes.rows.map((r) => r.id);
      }

      // Coletar contrato IDs
      let contratoIds: number[] = [];
      if (isEntidade) {
        const cRes = await client.query<{ id: number }>(
          `SELECT id FROM contratos WHERE entidade_id = $1`,
          [tomadorId]
        );
        contratoIds = cRes.rows.map((r) => r.id);
      } else {
        const cRes = await client.query<{ id: number }>(
          `SELECT id FROM contratos WHERE clinica_id = $1`,
          [tomadorId]
        );
        contratoIds = cRes.rows.map((r) => r.id);
      }

      // Coletar pagamento IDs
      let pagamentoIds: number[] = [];
      if (!isEntidade) {
        const pRes = await client.query<{ id: number }>(
          `SELECT id FROM pagamentos WHERE clinica_id = $1`,
          [tomadorId]
        );
        pagamentoIds = pRes.rows.map((r) => r.id);
      } else if (contratoIds.length > 0) {
        const pRes = await client.query<{ id: number }>(
          `SELECT id FROM pagamentos WHERE contrato_id = ANY($1::int[])`,
          [contratoIds]
        );
        pagamentoIds = pRes.rows.map((r) => r.id);
      }

      // Coletar recibo IDs
      let reciboIds: number[] = [];
      if (!isEntidade) {
        const rRes = await client.query<{ id: number }>(
          `SELECT id FROM recibos WHERE clinica_id = $1`,
          [tomadorId]
        );
        reciboIds = rRes.rows.map((r) => r.id);
      } else if (contratoIds.length > 0) {
        const rRes = await client.query<{ id: number }>(
          `SELECT id FROM recibos WHERE contrato_id = ANY($1::int[])`,
          [contratoIds]
        );
        reciboIds = rRes.rows.map((r) => r.id);
      }

      // Coletar avaliacao IDs
      let avalIds: number[] = [];
      if (loteIds.length > 0 || funcCpfs.length > 0) {
        const aRes = await client.query<{ id: number }>(
          `SELECT id FROM avaliacoes
           WHERE lote_id = ANY($1::int[]) OR funcionario_cpf = ANY($2::varchar[])`,
          [loteIds, funcCpfs]
        );
        avalIds = aRes.rows.map((r) => r.id);
      }

      // Helper para delete e contar
      const del = async (
        label: string,
        sql: string,
        params: unknown[]
      ): Promise<void> => {
        const result = await client.query(sql, params);
        deletados[label] = (deletados[label] || 0) + result.rowCount;
      };

      // ═══════════════════════════════════════════════════════════
      // FASE 1: Comissões e vínculos (RESTRICT constraints)
      // ═══════════════════════════════════════════════════════════
      if (fase === 1) {
        // Desabilitar triggers de imutabilidade para permitir deleção
        await client.query(`ALTER TABLE laudos DISABLE TRIGGER ALL`);
        await client.query(`ALTER TABLE avaliacoes DISABLE TRIGGER ALL`);
        await client.query(`ALTER TABLE lotes_avaliacao DISABLE TRIGGER ALL`);

        // comissoes_laudo (RESTRICT em entidade_id E laudo_id)
        if (isEntidade) {
          await del(
            'comissoes_laudo',
            `DELETE FROM comissoes_laudo WHERE entidade_id = $1`,
            [tomadorId]
          );
        }
        if (laudoIds.length > 0) {
          await del(
            'comissoes_laudo',
            `DELETE FROM comissoes_laudo WHERE laudo_id = ANY($1::int[])`,
            [laudoIds]
          );
        }

        // vinculos_comissao (RESTRICT em entidade_id/clinica_id)
        await del(
          'vinculos_comissao',
          isEntidade
            ? `DELETE FROM vinculos_comissao WHERE entidade_id = $1`
            : `DELETE FROM vinculos_comissao WHERE clinica_id = $1`,
          [tomadorId]
        );

        // emissor_cpf de laudos EXTERNOS: SET NULL
        // (quando funcionário do tomador é emissor em laudos de outro tomador)
        if (funcCpfs.length > 0 && loteIds.length > 0) {
          const extRes = await client.query(
            `UPDATE laudos SET emissor_cpf = NULL
             WHERE emissor_cpf = ANY($1::varchar[])
               AND lote_id IS NOT NULL
               AND lote_id != ALL($2::int[])`,
            [funcCpfs, loteIds]
          );
          deletados['laudos_emissor_desvinculado'] = extRes.rowCount;
        } else if (funcCpfs.length > 0) {
          const extRes = await client.query(
            `UPDATE laudos SET emissor_cpf = NULL
             WHERE emissor_cpf = ANY($1::varchar[])`,
            [funcCpfs]
          );
          deletados['laudos_emissor_desvinculado'] = extRes.rowCount;
        }

        // Reabilitar triggers
        await client.query(`ALTER TABLE laudos ENABLE TRIGGER ALL`);
        await client.query(`ALTER TABLE avaliacoes ENABLE TRIGGER ALL`);
        await client.query(`ALTER TABLE lotes_avaliacao ENABLE TRIGGER ALL`);
      }

      // ═══════════════════════════════════════════════════════════
      // FASE 2: Laudos e artefatos
      // ═══════════════════════════════════════════════════════════
      if (fase === 2) {
        await client.query(`ALTER TABLE laudos DISABLE TRIGGER ALL`);
        await client.query(`ALTER TABLE avaliacoes DISABLE TRIGGER ALL`);
        await client.query(`ALTER TABLE lotes_avaliacao DISABLE TRIGGER ALL`);

        if (laudoIds.length > 0) {
          // laudo_downloads
          await del(
            'laudo_downloads',
            `DELETE FROM laudo_downloads WHERE laudo_id = ANY($1::int[])`,
            [laudoIds]
          );
          // laudo_arquivos_remotos
          await del(
            'laudo_arquivos_remotos',
            `DELETE FROM laudo_arquivos_remotos WHERE laudo_id = ANY($1::int[])`,
            [laudoIds]
          );
          // pdf_jobs via laudo_id
          await del(
            'pdf_jobs',
            `DELETE FROM pdf_jobs WHERE laudo_id = ANY($1::int[])`,
            [laudoIds]
          );
          // laudos
          await del(
            'laudos',
            `DELETE FROM laudos WHERE lote_id = ANY($1::int[])`,
            [loteIds]
          );
        }

        await client.query(`ALTER TABLE laudos ENABLE TRIGGER ALL`);
        await client.query(`ALTER TABLE avaliacoes ENABLE TRIGGER ALL`);
        await client.query(`ALTER TABLE lotes_avaliacao ENABLE TRIGGER ALL`);
      }

      // ═══════════════════════════════════════════════════════════
      // FASE 3: Avaliações e dados de avaliação
      // ═══════════════════════════════════════════════════════════
      if (fase === 3) {
        await client.query(`ALTER TABLE avaliacoes DISABLE TRIGGER ALL`);

        if (avalIds.length > 0) {
          // analise_estatistica
          await del(
            'analise_estatistica',
            `DELETE FROM analise_estatistica WHERE avaliacao_id = ANY($1::int[])`,
            [avalIds]
          );
          // avaliacao_resets
          await del(
            'avaliacao_resets',
            `DELETE FROM avaliacao_resets WHERE avaliacao_id = ANY($1::int[])`,
            [avalIds]
          );
          // resultados
          await del(
            'resultados',
            `DELETE FROM resultados WHERE avaliacao_id = ANY($1::int[])`,
            [avalIds]
          );
          // respostas
          await del(
            'respostas',
            `DELETE FROM respostas WHERE avaliacao_id = ANY($1::int[])`,
            [avalIds]
          );
          // avaliacoes
          await del(
            'avaliacoes',
            `DELETE FROM avaliacoes WHERE id = ANY($1::int[])`,
            [avalIds]
          );
        }

        await client.query(`ALTER TABLE avaliacoes ENABLE TRIGGER ALL`);
      }

      // ═══════════════════════════════════════════════════════════
      // FASE 4: Lotes, jobs e filas
      // ═══════════════════════════════════════════════════════════
      if (fase === 4) {
        await client.query(`ALTER TABLE lotes_avaliacao DISABLE TRIGGER ALL`);

        if (loteIds.length > 0) {
          await del(
            'laudo_generation_jobs',
            `DELETE FROM laudo_generation_jobs WHERE lote_id = ANY($1::int[])`,
            [loteIds]
          );
          await del(
            'emissao_queue',
            `DELETE FROM emissao_queue WHERE lote_id = ANY($1::int[])`,
            [loteIds]
          );
          await del(
            'fila_emissao',
            `DELETE FROM fila_emissao WHERE lote_id = ANY($1::int[])`,
            [loteIds]
          );
          await del(
            'auditoria_laudos',
            `DELETE FROM auditoria_laudos WHERE lote_id = ANY($1::int[])`,
            [loteIds]
          );
          await del(
            'notificacoes_admin',
            `DELETE FROM notificacoes_admin WHERE lote_id = ANY($1::int[])`,
            [loteIds]
          );

          // Deletar lotes
          await del(
            'lotes_avaliacao',
            `DELETE FROM lotes_avaliacao WHERE id = ANY($1::int[])`,
            [loteIds]
          );
        }

        // notificacoes_admin via clinica_id (sem lote)
        if (!isEntidade) {
          await del(
            'notificacoes_admin',
            `DELETE FROM notificacoes_admin WHERE clinica_id = $1 AND lote_id IS NULL`,
            [tomadorId]
          );
        }

        await client.query(`ALTER TABLE lotes_avaliacao ENABLE TRIGGER ALL`);
      }

      // ═══════════════════════════════════════════════════════════
      // FASE 5: Financeiro (recibos, pagamentos, contratos)
      // ═══════════════════════════════════════════════════════════
      if (fase === 5) {
        // pdf_jobs via recibo_id (antes de deletar recibos)
        if (reciboIds.length > 0) {
          await del(
            'pdf_jobs',
            `DELETE FROM pdf_jobs WHERE recibo_id = ANY($1::int[])`,
            [reciboIds]
          );
          await del(
            'auditoria_recibos',
            `DELETE FROM auditoria_recibos WHERE recibo_id = ANY($1::int[])`,
            [reciboIds]
          );
          // recibos (antes de pagamentos — RESTRICT)
          await del(
            'recibos',
            `DELETE FROM recibos WHERE id = ANY($1::int[])`,
            [reciboIds]
          );
        }

        // pagamentos
        if (pagamentoIds.length > 0) {
          // notificacoes_admin via pagamento_id
          await del(
            'notificacoes_admin',
            `DELETE FROM notificacoes_admin WHERE pagamento_id = ANY($1::int[])`,
            [pagamentoIds]
          );
          await del(
            'pagamentos',
            `DELETE FROM pagamentos WHERE id = ANY($1::int[])`,
            [pagamentoIds]
          );
        }

        // tokens_retomada_pagamento via contrato_id
        if (contratoIds.length > 0) {
          await del(
            'tokens_retomada_pagamento',
            `DELETE FROM tokens_retomada_pagamento WHERE contrato_id = ANY($1::int[])`,
            [contratoIds]
          );
          // notificacoes_admin via contrato_id
          await del(
            'notificacoes_admin',
            `DELETE FROM notificacoes_admin WHERE contrato_id = ANY($1::int[])`,
            [contratoIds]
          );
          // contratos
          await del(
            'contratos',
            `DELETE FROM contratos WHERE id = ANY($1::int[])`,
            [contratoIds]
          );
        }
      }

      // ═══════════════════════════════════════════════════════════
      // FASE 6: Funcionários e vínculos
      // ═══════════════════════════════════════════════════════════
      if (fase === 6) {
        // mfa_codes
        if (funcCpfs.length > 0) {
          await del(
            'mfa_codes',
            `DELETE FROM mfa_codes WHERE cpf = ANY($1::varchar[])`,
            [funcCpfs]
          );
        }

        // vínculos intermediários
        if (isEntidade) {
          await del(
            'funcionarios_entidades',
            `DELETE FROM funcionarios_entidades WHERE entidade_id = $1`,
            [tomadorId]
          );
          // Também limpar vínculos clinicas dos mesmos funcionários
          if (funcIds.length > 0) {
            await del(
              'funcionarios_clinicas',
              `DELETE FROM funcionarios_clinicas
               WHERE funcionario_id = ANY($1::int[])
                 AND NOT EXISTS (
                   SELECT 1 FROM funcionarios_entidades fe
                   WHERE fe.funcionario_id = funcionarios_clinicas.funcionario_id
                     AND fe.entidade_id != $2
                 )`,
              [funcIds, tomadorId]
            );
          }
        } else {
          await del(
            'funcionarios_clinicas',
            `DELETE FROM funcionarios_clinicas WHERE clinica_id = $1`,
            [tomadorId]
          );
          // Também limpar vínculos entidades dos mesmos funcionários
          if (funcIds.length > 0) {
            await del(
              'funcionarios_entidades',
              `DELETE FROM funcionarios_entidades
               WHERE funcionario_id = ANY($1::int[])
                 AND NOT EXISTS (
                   SELECT 1 FROM funcionarios_clinicas fc
                   WHERE fc.funcionario_id = funcionarios_entidades.funcionario_id
                     AND fc.clinica_id != $2
                 )`,
              [funcIds, tomadorId]
            );
          }
        }

        // Funcionários SEM vínculos em outros tomadores → deletar
        // Funcionários COM vínculos em outros → preservar
        if (funcIds.length > 0) {
          await del(
            'funcionarios',
            `DELETE FROM funcionarios
             WHERE id = ANY($1::int[])
               AND NOT EXISTS (
                 SELECT 1 FROM funcionarios_entidades fe WHERE fe.funcionario_id = funcionarios.id
               )
               AND NOT EXISTS (
                 SELECT 1 FROM funcionarios_clinicas fc WHERE fc.funcionario_id = funcionarios.id
               )`,
            [funcIds]
          );
        }
      }

      // ═══════════════════════════════════════════════════════════
      // FASE 7: Senhas e usuários
      // ═══════════════════════════════════════════════════════════
      if (fase === 7) {
        if (isEntidade) {
          await del(
            'entidades_senhas',
            `DELETE FROM entidades_senhas WHERE entidade_id = $1`,
            [tomadorId]
          );
        } else {
          await del(
            'clinicas_senhas',
            `DELETE FROM clinicas_senhas WHERE clinica_id = $1`,
            [tomadorId]
          );
        }

        await del(
          'usuarios',
          isEntidade
            ? `DELETE FROM usuarios WHERE entidade_id = $1`
            : `DELETE FROM usuarios WHERE clinica_id = $1`,
          [tomadorId]
        );
      }

      // ═══════════════════════════════════════════════════════════
      // FASE 8: Leads e comercial (SET NULL, não bloqueiam)
      // ═══════════════════════════════════════════════════════════
      if (fase === 8) {
        if (isEntidade) {
          const leadsRes = await client.query(
            `UPDATE leads_representante SET entidade_id = NULL WHERE entidade_id = $1`,
            [tomadorId]
          );
          deletados['leads_desvinculados'] = leadsRes.rowCount;
        }
      }

      // ═══════════════════════════════════════════════════════════
      // FASE 9: Entidade/Clínica (root) — registrar auditoria
      // ═══════════════════════════════════════════════════════════
      if (fase === 9) {
        if (!isEntidade) {
          // Tabelas auxiliares de clínica
          await del(
            'importacoes_clinica',
            `DELETE FROM importacoes_clinica WHERE clinica_id = $1`,
            [tomadorId]
          );
          await del(
            'empresas_clientes',
            `DELETE FROM empresas_clientes WHERE clinica_id = $1`,
            [tomadorId]
          );
        }

        // Deletar a entidade ou clínica
        if (isEntidade) {
          await del('entidades', `DELETE FROM entidades WHERE id = $1`, [
            tomadorId,
          ]);
        } else {
          await del('clinicas', `DELETE FROM clinicas WHERE id = $1`, [
            tomadorId,
          ]);
        }

        // Registrar na tabela de auditoria
        await client.query(
          `INSERT INTO audit_delecoes_tomador (cnpj, nome, tipo, tomador_id, admin_cpf, admin_nome, resumo)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            tomador.cnpj,
            tomador.nome,
            tomador.tipo,
            tomadorId,
            session.cpf,
            session.nome,
            JSON.stringify(deletados),
          ]
        );
      }
    }, session);

    return NextResponse.json({
      ok: true,
      fase,
      deletados,
    });
  } catch (err) {
    console.error('[admin/delecao/execute] Erro:', err);
    if (err instanceof Error) {
      if (err.message === 'Sem permissão') {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
      }
      if (err.message === 'MFA_REQUIRED') {
        return NextResponse.json({ error: 'MFA_REQUIRED' }, { status: 403 });
      }
      const statusErr = (err as Error & { status?: number }).status;
      if (statusErr === 404) {
        return NextResponse.json({ error: err.message }, { status: 404 });
      }
    }
    return NextResponse.json(
      { error: 'Erro ao executar deleção. Transação revertida.' },
      { status: 500 }
    );
  }
}
