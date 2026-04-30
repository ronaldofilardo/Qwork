import { NextResponse } from 'next/server';
import { requireEntity } from '@/lib/session';
import {
  parseSpreadsheetAllRows,
  type ColumnMapping,
} from '@/lib/importacao/dynamic-parser';
import { validarDadosImportacao } from '@/lib/importacao/data-validator';
import { withTransactionAsGestor } from '@/lib/db-transaction';
import { limparCPF } from '@/lib/cpf-utils';
import { parseDateCell } from '@/lib/xlsxParser';
import bcrypt from 'bcryptjs';
import { gerarSenhaDeNascimento } from '@/lib/auth/password-generator';

export const dynamic = 'force-dynamic';

/** Normaliza valor bruto da coluna nivel_cargo para o enum do sistema */
function normalizarNivelCargo(raw: string): 'gestao' | 'operacional' | null {
  const v = raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (v === 'gestao') return 'gestao';
  if (v === 'operacional') return 'operacional';
  return null;
}

/**
 * POST /api/entidade/importacao/execute
 * Executa importação direta de funcionários para a entidade autenticada.
 * Versão para Entidade — sem empresa/CNPJ, vínculos em funcionarios_entidades.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireEntity();
    const entidadeId = session.entidade_id;

    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type deve ser multipart/form-data' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const mapeamentoRaw = formData.get('mapeamento');

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: 'Arquivo não enviado' },
        { status: 400 }
      );
    }

    if (!mapeamentoRaw || typeof mapeamentoRaw !== 'string') {
      return NextResponse.json(
        { error: 'Mapeamento de colunas não enviado' },
        { status: 400 }
      );
    }

    let mapeamento: ColumnMapping[];
    try {
      mapeamento = JSON.parse(mapeamentoRaw);
      if (!Array.isArray(mapeamento) || mapeamento.length === 0) {
        throw new Error('Mapeamento vazio');
      }
    } catch {
      return NextResponse.json(
        { error: 'Mapeamento de colunas inválido' },
        { status: 400 }
      );
    }

    // Optional: nivel_cargo map per funcao { funcao: 'gestao' | 'operacional' | '' }
    // Optional: nivel_cargo map per funcao { funcao: 'gestao' | 'operacional' | '' }
    const nivelCargoMapRaw = formData.get('nivelCargoMap');
    let nivelCargoMap: Record<string, string> | null = null;
    if (nivelCargoMapRaw && typeof nivelCargoMapRaw === 'string') {
      try {
        nivelCargoMap = JSON.parse(nivelCargoMapRaw);
      } catch {
        /* ignore */
      }
    }

    // Optional: nivel_cargo map per CPF — classificação individual (prioridade sobre por função)
    const nivelCargoCpfMapRaw = formData.get('nivelCargoCpfMap');
    let nivelCargoCpfMap: Record<string, string> | null = null;
    if (nivelCargoCpfMapRaw && typeof nivelCargoCpfMapRaw === 'string') {
      try {
        nivelCargoCpfMap = JSON.parse(nivelCargoCpfMapRaw);
      } catch {
        /* ignore */
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse com mapeamento
    const parsed = parseSpreadsheetAllRows(buffer, mapeamento);
    if (!parsed.success || !parsed.data) {
      return NextResponse.json(
        { error: parsed.error ?? 'Erro ao processar arquivo' },
        { status: 400 }
      );
    }

    // Validação de formato — CNPJ ignorado para fluxo de Entidade
    const validacao = validarDadosImportacao(parsed.data, {
      ignorarCnpj: true,
    });

    // Validação de self-assignment: gestor não pode se cadastrar como funcionário
    const gestorCpfLimpo = limparCPF(session.cpf ?? '');
    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      const cpfLimpo = limparCPF(row.cpf ?? '');
      if (cpfLimpo === gestorCpfLimpo && cpfLimpo.length === 11) {
        validacao.erros.push({
          linha: i + 2,
          campo: 'cpf',
          valor: row.cpf ?? '',
          mensagem:
            'Você não pode se cadastrar como funcionário da própria entidade',
          severidade: 'erro',
        });
      }
    }

    // Filtrar apenas linhas sem erros críticos
    const linhasComErroSet = new Set(validacao.erros.map((e) => e.linha));
    const linhasValidas = parsed.data.filter(
      (_, i) => !linhasComErroSet.has(i + 2)
    );

    if (linhasValidas.length === 0) {
      return NextResponse.json(
        {
          error: 'Nenhuma linha válida para importar',
          details: validacao.erros,
        },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    const result = await withTransactionAsGestor(async (client) => {
      let funcionariosCriados = 0;
      let funcionariosAtualizados = 0;
      const nivelCargoAlterados = 0;
      const funcoesAlteradasList: Array<{
        nome: string;
        funcaoAnterior: string | null;
        funcaoNova: string;
      }> = [];
      let vinculosCriados = 0;
      let vinculosAtualizados = 0;
      let inativacoesRealizadas = 0;
      let readmissoesRealizadas = 0;
      const errosProcessamento: Array<{
        linha: number;
        cpf: string;
        mensagem: string;
      }> = [];
      const avisosProcessamento: Array<{
        linha: number;
        cpf: string;
        mensagem: string;
      }> = [];

      // Processar cada funcionário diretamente na entidade (sem loop de empresa)
      for (const row of linhasValidas) {
        const cpf = limparCPF(row.cpf ?? '');
        const nomeFunc = (row.nome ?? '').trim();
        const funcao = (row.funcao ?? 'Não informado').trim();
        const setor = (row.setor ?? 'Não informado').trim();
        // Prioridade: nivel por CPF (individual) > coluna nivel_cargo > classificação por função
        const nivelCargoFromRow = row.nivel_cargo
          ? normalizarNivelCargo(row.nivel_cargo)
          : null;
        const nivelCargo =
          ((nivelCargoCpfMap?.[cpf] ?? '') || null) ??
          nivelCargoFromRow ??
          ((nivelCargoMap?.[funcao] ?? '') || null);
        const dataNasc = row.data_nascimento
          ? (parseDateCell(row.data_nascimento) ?? null)
          : null;
        const dataAdm = row.data_admissao
          ? (parseDateCell(row.data_admissao) ?? null)
          : null;
        const dataDem = row.data_demissao
          ? (parseDateCell(row.data_demissao) ?? null)
          : null;
        const email = (row.email ?? '').trim() || null;
        const matricula = (row.matricula ?? '').trim() || null;
        const linhaNum = parsed.data.indexOf(row) + 2;

        const savepointName = `sp_ent_${cpf.replace(/\D/g, '')}_${linhaNum}`;
        try {
          await client.query(`SAVEPOINT ${savepointName}`);

          // Verificar se CPF já existe na tabela funcionarios
          const existFunc = await client.query(
            'SELECT id, funcao FROM funcionarios WHERE cpf = $1',
            [cpf]
          );

          let funcionarioId: number;

          if (existFunc.rows.length > 0) {
            funcionarioId = existFunc.rows[0].id as number;
            const oldFuncao = existFunc.rows[0].funcao as string | null;

            // Atualizar dados se necessário
            const updates: string[] = [];
            const params: unknown[] = [];
            let paramIdx = 1;

            if (dataNasc) {
              updates.push(`data_nascimento = $${paramIdx++}`);
              params.push(dataNasc);
            }

            if (funcao !== 'Não informado' && funcao !== oldFuncao) {
              updates.push(`funcao = $${paramIdx++}`);
              params.push(funcao);
              funcoesAlteradasList.push({
                nome: nomeFunc,
                funcaoAnterior: oldFuncao,
                funcaoNova: funcao,
              });
            }

            // NOTA: nivel_cargo NÃO é mais atualizado na tabela global 'funcionarios' para funcionários existentes.
            // A segregação por entidade ocorre via 'funcionarios_entidades.nivel_cargo', atualizado no vínculo abaixo.
            // Isso previne bleeding de nivel_cargo entre entidades para o mesmo CPF.

            if (updates.length > 0) {
              updates.push(`atualizado_em = NOW()`);
              params.push(funcionarioId);
              await client.query(
                `UPDATE funcionarios SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
                params
              );
              funcionariosAtualizados++;
            }
          } else {
            // Gerar senha com data de nascimento ou default
            let senhaHash: string;
            if (dataNasc) {
              const senhaPlaintext = gerarSenhaDeNascimento(dataNasc);
              senhaHash = await bcrypt.hash(senhaPlaintext, 10);
            } else {
              senhaHash = await bcrypt.hash('12345678', 10);
            }

            const insertFunc = await client.query(
              `INSERT INTO funcionarios (
                cpf, nome, data_nascimento, setor, funcao, email,
                senha_hash, perfil, ativo, matricula, nivel_cargo, usuario_tipo
              ) VALUES ($1,$2,$3,$4,$5,$6,$7,'funcionario',true,$8,$9,'funcionario_entidade'::usuario_tipo_enum)
              RETURNING id`,
              [
                cpf,
                nomeFunc,
                dataNasc,
                setor,
                funcao,
                email,
                senhaHash,
                matricula,
                nivelCargo,
              ]
            );
            funcionarioId = insertFunc.rows[0].id as number;
            funcionariosCriados++;
          }

          // Processar vínculo direto com a entidade (sem empresa)
          const vinculoExist = await client.query(
            `SELECT id, ativo, data_desvinculo FROM funcionarios_entidades
             WHERE funcionario_id = $1 AND entidade_id = $2`,
            [funcionarioId, entidadeId]
          );

          if (vinculoExist.rows.length > 0) {
            const vinculo = vinculoExist.rows[0];

            if (dataDem) {
              // Inativar vínculo
              if (vinculo.ativo) {
                await client.query(
                  `UPDATE funcionarios_entidades
                   SET ativo = false, data_desvinculo = $1, atualizado_em = NOW()
                   WHERE id = $2`,
                  [dataDem, vinculo.id]
                );
                inativacoesRealizadas++;
                vinculosAtualizados++;
              }
            } else if (!vinculo.ativo && dataAdm) {
              // Readmissão
              const dataDesvinculo = vinculo.data_desvinculo
                ? new Date(vinculo.data_desvinculo as string)
                : null;
              const isReadmissao =
                !dataDesvinculo || new Date(dataAdm) > dataDesvinculo;

              if (isReadmissao) {
                await client.query(
                  `UPDATE funcionarios_entidades
                   SET ativo = true, data_vinculo = $1, data_desvinculo = NULL,
                       nivel_cargo = COALESCE($3, nivel_cargo), atualizado_em = NOW()
                   WHERE id = $2`,
                  [dataAdm, vinculo.id, nivelCargo]
                );
                readmissoesRealizadas++;
                vinculosAtualizados++;
                avisosProcessamento.push({
                  linha: linhaNum,
                  cpf,
                  mensagem: 'Funcionário readmitido e vínculo reativado',
                });
              } else {
                vinculosAtualizados++;
                avisosProcessamento.push({
                  linha: linhaNum,
                  cpf,
                  mensagem:
                    'Funcionário inativo — não reativado (data de admissão não mais recente que a saída)',
                });
              }
            } else if (!vinculo.ativo) {
              // Já inativo, sem nova data de admissão — apenas docs
              avisosProcessamento.push({
                linha: linhaNum,
                cpf,
                mensagem: 'Funcionário inativo — não reativado automaticamente',
              });
            } else {
              // Vínculo ativo sem demissão — atualizar nivel_cargo se fornecido
              if (nivelCargo) {
                await client.query(
                  `UPDATE funcionarios_entidades
                   SET nivel_cargo = COALESCE($1, nivel_cargo), atualizado_em = NOW()
                   WHERE id = $2`,
                  [nivelCargo, vinculo.id]
                );
                vinculosAtualizados++;
              }
            }
          } else {
            // Novo vínculo com a entidade
            await client.query(
              `INSERT INTO funcionarios_entidades (
                funcionario_id, entidade_id, ativo, data_vinculo, data_desvinculo, nivel_cargo
              ) VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                funcionarioId,
                entidadeId,
                !dataDem, // ativo = true se sem demissão
                dataAdm ?? new Date().toISOString(),
                dataDem,
                nivelCargo,
              ]
            );
            vinculosCriados++;
            if (dataDem) {
              inativacoesRealizadas++;
            }
          }

          await client.query(`RELEASE SAVEPOINT ${savepointName}`);
        } catch (err: unknown) {
          // Rollback parcial — desfaz só este funcionário
          await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
          await client.query(`RELEASE SAVEPOINT ${savepointName}`);
          const msg = err instanceof Error ? err.message : 'Erro desconhecido';
          errosProcessamento.push({ linha: linhaNum, cpf, mensagem: msg });
        }
      }

      return {
        funcionariosCriados,
        funcionariosAtualizados,
        nivelCargoAlterados,
        funcoesAlteradas: funcoesAlteradasList,
        vinculosCriados,
        vinculosAtualizados,
        inativacoesRealizadas,
        readmissoesRealizadas,
        errosProcessamento,
        avisosProcessamento,
      };
    });

    const tempoMs = Date.now() - startTime;
    const maskedCpf = `***${String(session.cpf).slice(-4)}`;
    console.log(
      `[AUDIT] Importação entidade: ${result.funcionariosCriados} func criados, ` +
        `${result.inativacoesRealizadas} inativações, ` +
        `${result.readmissoesRealizadas} readmissões. Entidade ${entidadeId} por ${maskedCpf}`
    );

    return NextResponse.json({
      success: true,
      data: {
        resumo: {
          totalLinhasProcessadas: linhasValidas.length,
          totalLinhasComErroFormato: validacao.resumo.linhasComErros,
          funcionariosCriados: result.funcionariosCriados,
          funcionariosAtualizados: result.funcionariosAtualizados,
          nivelCargoAlterados: result.nivelCargoAlterados,
          funcoesAlteradas: result.funcoesAlteradas,
          vinculosCriados: result.vinculosCriados,
          vinculosAtualizados: result.vinculosAtualizados,
          inativacoesRealizadas: result.inativacoesRealizadas,
          readmissoesRealizadas: result.readmissoesRealizadas,
          tempoMs,
        },
        erros: [
          ...validacao.erros.map((e) => ({
            linha: e.linha,
            campo: e.campo,
            mensagem: e.mensagem,
          })),
          ...result.errosProcessamento,
        ],
        avisos: [
          ...validacao.avisos.map((a) => ({
            linha: a.linha,
            campo: a.campo,
            mensagem: a.mensagem,
          })),
          ...result.avisosProcessamento,
        ],
      },
    });
  } catch (error: unknown) {
    console.error('[entidade/importacao/execute] Erro:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('Entidade não encontrada') ||
        error.message.includes('Acesso restrito') ||
        error.message.includes('Entidade inativa')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (
        error.message.includes('Não autenticado') ||
        error.message.includes('não é gestor')
      ) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
