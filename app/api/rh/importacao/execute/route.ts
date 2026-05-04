import { NextResponse } from 'next/server';
import { requireClinica } from '@/lib/session';
import {
  parseSpreadsheetAllRows,
  type ColumnMapping,
} from '@/lib/importacao/dynamic-parser';
import { validarDadosImportacao } from '@/lib/importacao/data-validator';
import { withTransaction } from '@/lib/db-transaction';
import { limparCPF } from '@/lib/cpf-utils';
import { normalizeCNPJ } from '@/lib/validators';
import { parseDateCell } from '@/lib/xlsxParser';
import bcrypt from 'bcryptjs';
import { gerarSenhaDeNascimento } from '@/lib/auth/password-generator';

export const dynamic = 'force-dynamic';

/**
 * Retorna true se o nome da empresa é um placeholder gerado automaticamente
 * pelo sistema quando a planilha não continha o nome.
 * Padrões reconhecidos:
 *   "Empresa 12.345.678/0001-99"  (gerado por cnpjFmtFallback)
 *   "Empresa Desconhecida"         (gerado quando sem CNPJ)
 */
function isNomePlaceholder(nome: string): boolean {
  if (nome === 'Empresa Desconhecida') return true;
  if (/^Empresa \d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(nome)) return true;
  return false;
}

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
 * POST /api/rh/importacao/execute
 * Executa importação de empresas e funcionários em transação.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireClinica();
    const clinicaId = session.clinica_id;

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

    // Validação de formato (bloqueia se erros críticos)
    const validacao = validarDadosImportacao(parsed.data);

    // Validação de self-assignment: responsável não pode se cadastrar como funcionário
    const responsavelCpfLimpo = limparCPF(session.cpf ?? '');
    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      const cpfLimpo = limparCPF(row.cpf ?? '');
      if (cpfLimpo === responsavelCpfLimpo && cpfLimpo.length === 11) {
        validacao.erros.push({
          linha: i + 2,
          campo: 'cpf',
          valor: row.cpf ?? '',
          mensagem:
            'Você não pode se cadastrar como funcionário da própria clínica',
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

    // Agrupar por empresa
    const empresaMap = new Map<
      string,
      { nome: string; cnpj: string; rows: typeof linhasValidas }
    >();

    for (const row of linhasValidas) {
      const nomeEmpresa = (row.nome_empresa ?? '').trim();
      const cnpjEmpresa = row.cnpj_empresa
        ? normalizeCNPJ(row.cnpj_empresa)
        : '';
      // Agrupar por CNPJ se disponível, senão por nome uppercased
      const key = cnpjEmpresa || nomeEmpresa.toUpperCase();

      const existing = empresaMap.get(key);
      if (existing) {
        existing.rows.push(row);
      } else {
        empresaMap.set(key, {
          nome: nomeEmpresa,
          cnpj: cnpjEmpresa,
          rows: [row],
        });
      }
    }

    // Executar em transação
    const startTime = Date.now();

    const result = await withTransaction(async (client) => {
      let empresasCriadas = 0;
      let empresasExistentes = 0;
      let empresasBloqueadas = 0;
      let empresasNomeAtualizados = 0;
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

      for (const [, { nome: nomeRaw, cnpj, rows }] of empresaMap) {
        // Find or create empresa
        // Quando nome não mapeado, usar placeholder baseado no CNPJ
        const cnpjFmtFallback = cnpj
          ? cnpj.replace(
              /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
              '$1.$2.$3/$4-$5'
            )
          : '';
        const nome =
          nomeRaw.trim() ||
          (cnpjFmtFallback
            ? `Empresa ${cnpjFmtFallback}`
            : 'Empresa Desconhecida');
        let empresaId: number | undefined;

        if (cnpj) {
          // Busca global por CNPJ — constraint é única globalmente (não por clinica_id)
          const empresaExist = await client.query(
            'SELECT id, clinica_id, nome FROM empresas_clientes WHERE cnpj = $1',
            [cnpj]
          );

          if (empresaExist.rows.length > 0) {
            const empresaRow = empresaExist.rows[0];
            if (Number(empresaRow.clinica_id) === clinicaId) {
              // Mesma clínica — reutilizar
              empresaId = empresaRow.id as number;
              empresasExistentes++;
              // Atualizar nome se o banco tem placeholder e o import traz nome real
              const nomeNovo = nomeRaw.trim();
              if (
                nomeNovo &&
                isNomePlaceholder(empresaRow.nome as string) &&
                !isNomePlaceholder(nomeNovo)
              ) {
                await client.query(
                  'UPDATE empresas_clientes SET nome = $1, atualizado_em = NOW() WHERE id = $2',
                  [nomeNovo, empresaId]
                );
                empresasNomeAtualizados++;
              }
            } else {
              // Outra clínica — bloquear todos os funcionários desta empresa
              empresasBloqueadas++;
              const cnpjFmt = cnpj.replace(
                /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
                '$1.$2.$3/$4-$5'
              );
              for (const row of rows) {
                const linhaNum = parsed.data!.indexOf(row) + 2;
                errosProcessamento.push({
                  linha: linhaNum,
                  cpf: limparCPF(row.cpf ?? ''),
                  mensagem: `Empresa "${nome}" (CNPJ ${cnpjFmt || cnpj}) já está cadastrada em outra clínica — funcionário não importado`,
                });
              }
            }
          } else {
            // CNPJ não existe em empresas_clientes — verificar se pertence a uma Entidade
            const entidadeCheck = await client.query(
              'SELECT 1 FROM entidades WHERE cnpj = $1 LIMIT 1',
              [cnpj]
            );
            if (entidadeCheck.rows.length > 0) {
              // CNPJ pertence a uma Entidade — bloquear
              empresasBloqueadas++;
              const cnpjFmt = cnpj.replace(
                /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
                '$1.$2.$3/$4-$5'
              );
              for (const row of rows) {
                const linhaNum = parsed.data!.indexOf(row) + 2;
                errosProcessamento.push({
                  linha: linhaNum,
                  cpf: limparCPF(row.cpf ?? ''),
                  mensagem: `Empresa "${nome}" (CNPJ ${cnpjFmt || cnpj}) está cadastrada como Entidade no sistema — não é possível importar como empresa de clínica`,
                });
              }
            } else {
              const insertEmpresa = await client.query(
                `INSERT INTO empresas_clientes (nome, cnpj, clinica_id, ativa)
                 VALUES ($1, $2, $3, true)
                 RETURNING id`,
                [nome, cnpj, clinicaId]
              );
              empresaId = insertEmpresa.rows[0].id as number;
              empresasCriadas++;
            }
          }
        } else {
          // Sem CNPJ — buscar por nome
          const empresaExist = await client.query(
            'SELECT id FROM empresas_clientes WHERE UPPER(nome) = $1 AND clinica_id = $2',
            [nome.toUpperCase(), clinicaId]
          );

          if (empresaExist.rows.length > 0) {
            empresaId = empresaExist.rows[0].id as number;
            empresasExistentes++;
          } else {
            const insertEmpresa = await client.query(
              `INSERT INTO empresas_clientes (nome, clinica_id, ativa)
               VALUES ($1, $2, true)
               RETURNING id`,
              [nome, clinicaId]
            );
            empresaId = insertEmpresa.rows[0].id as number;
            empresasCriadas++;
          }
        }

        // Pular empresa bloqueada (CNPJ pertence a outra clínica)
        if (!empresaId) continue;

        // Processar funcionários desta empresa
        for (const row of rows) {
          const cpf = limparCPF(row.cpf ?? '');
          const nomeFunc = (row.nome ?? '').trim();
          const funcao = (row.funcao ?? 'Não informado').trim();
          const setor = (row.setor ?? 'Não informado').trim();
          // Prioridade: nivel por CPF (individual) > coluna nivel_cargo > classificação por função+empresa
          const nivelCargoFromRow = row.nivel_cargo
            ? normalizarNivelCargo(row.nivel_cargo)
            : null;
          // Chave composta funcao|cnpj para lookup no nivelCargoMap (segrega por empresa)
          const cnpjParaChave = normalizeCNPJ(row.cnpj_empresa ?? '');
          const chaveNivelCargo = `${funcao}|${cnpjParaChave}`;
          const nivelCargo =
            ((nivelCargoCpfMap?.[cpf] ?? '') || null) ??
            nivelCargoFromRow ??
            ((nivelCargoMap?.[chaveNivelCargo] ?? '') || null) ??
            ((nivelCargoMap?.[funcao] ?? '') || null); // fallback legacy (chave simples)
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

          const savepointName = `sp_func_${cpf.replace(/\D/g, '')}_${linhaNum}`;
          try {
            await client.query(`SAVEPOINT ${savepointName}`);

            // Check if CPF already exists
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
                // Regenerar senha_hash para manter sincronia com a nova data de nascimento
                const senhaPlaintextUpdate = gerarSenhaDeNascimento(dataNasc);
                const senhaHashUpdate = await bcrypt.hash(
                  senhaPlaintextUpdate,
                  10
                );
                updates.push(`senha_hash = $${paramIdx++}`);
                params.push(senhaHashUpdate);
              }

              // Atualizar funcao quando fornecida e diferente (troca de função/promoção)
              if (funcao !== 'Não informado' && funcao !== oldFuncao) {
                updates.push(`funcao = $${paramIdx++}`);
                params.push(funcao);
                funcoesAlteradasList.push({
                  nome: nomeFunc,
                  funcaoAnterior: oldFuncao,
                  funcaoNova: funcao,
                });
              }

              // NOTA: nivel_cargo NÃO é mais atualizado na tabela global 'funcionarios' para employees existentes.
              // A segregação por empresa ocorre via 'funcionarios_clinicas.nivel_cargo', atualizado nos VÍNCULOs abaixo.
              // Isso previne 'bleeding' de nivel_cargo entre empresas diferentes que compartilham o mesmo CPF.
              // Monitoramento de mudanças de nivel_cargo agora ocorre por vínculo (fc.nivel_cargo), não globalmente.

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
              // Gerar senha com data de nascimento
              let senhaHash: string;
              if (dataNasc) {
                const senhaPlaintext = gerarSenhaDeNascimento(dataNasc);
                senhaHash = await bcrypt.hash(senhaPlaintext, 10);
              } else {
                // Nunca deve chegar aqui: validate route bloqueia importação sem data_nascimento
                // Erro explícito para detectar desvios no fluxo de validação
                console.error(
                  `[importacao/execute] CPF ${cpf}: data_nascimento ausente após validação — abortando linha`
                );
                errosProcessamento.push({
                  linha: linhaNum,
                  cpf,
                  mensagem:
                    'data_nascimento obrigatória para gerar senha. Corrija a planilha e reimporte.',
                });
                continue;
              }

              // ARQUITETURA SEGREGADA: clinica_id removida de funcionarios pela migration 605
              // Relacionamento clínica↔funcionário está em funcionarios_clinicas (inserido abaixo)
              const insertFunc = await client.query(
                `INSERT INTO funcionarios (
                  cpf, nome, data_nascimento, setor, funcao, email,
                  senha_hash, perfil, ativo, matricula, nivel_cargo, usuario_tipo
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,'funcionario',true,$8,$9,'funcionario_clinica'::usuario_tipo_enum)
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

            // Processar vínculo com empresa
            const vinculoExist = await client.query(
              `SELECT id, ativo, data_desvinculo FROM funcionarios_clinicas
               WHERE funcionario_id = $1 AND empresa_id = $2`,
              [funcionarioId, empresaId]
            );

            if (vinculoExist.rows.length > 0) {
              const vinculo = vinculoExist.rows[0];

              if (dataDem) {
                // Inativar vínculo
                if (vinculo.ativo) {
                  await client.query(
                    `UPDATE funcionarios_clinicas
                     SET ativo = false, data_desvinculo = $1, funcao = $2, setor = $3, atualizado_em = NOW()
                     WHERE id = $4`,
                    [dataDem, funcao, setor, vinculo.id]
                  );
                  inativacoesRealizadas++;
                  vinculosAtualizados++;
                }
              } else if (!vinculo.ativo && dataAdm) {
                // Readmissão: nova data de admissão mais recente que a saída
                const dataDesvinculo = vinculo.data_desvinculo
                  ? new Date(vinculo.data_desvinculo as string)
                  : null;
                const isReadmissao =
                  !dataDesvinculo || new Date(dataAdm) > dataDesvinculo;

                if (isReadmissao) {
                  await client.query(
                    `UPDATE funcionarios_clinicas
                     SET ativo = true, data_vinculo = $1, data_desvinculo = NULL,
                         funcao = $2, setor = $3, matricula = $4,
                         nivel_cargo = COALESCE($5, nivel_cargo), atualizado_em = NOW()
                     WHERE id = $6`,
                    [dataAdm, funcao, setor, matricula, nivelCargo, vinculo.id]
                  );
                  readmissoesRealizadas++;
                  vinculosAtualizados++;
                  avisosProcessamento.push({
                    linha: linhaNum,
                    cpf,
                    mensagem: 'Funcionário readmitido e vínculo reativado',
                  });
                } else {
                  // data de admissão não mais recente — apenas atualiza dados, não reativa
                  await client.query(
                    `UPDATE funcionarios_clinicas
                     SET funcao = $1, setor = $2, matricula = $3,
                         nivel_cargo = COALESCE($4, nivel_cargo), atualizado_em = NOW()
                     WHERE id = $5`,
                    [funcao, setor, matricula, nivelCargo, vinculo.id]
                  );
                  vinculosAtualizados++;
                  avisosProcessamento.push({
                    linha: linhaNum,
                    cpf,
                    mensagem:
                      'Funcionário inativo — não reativado (data de admissão não mais recente que a saída)',
                  });
                }
              } else {
                // Atualizar dados do vínculo
                await client.query(
                  `UPDATE funcionarios_clinicas
                   SET funcao = $1, setor = $2, matricula = $3,
                       nivel_cargo = COALESCE($4, nivel_cargo), atualizado_em = NOW()
                   WHERE id = $5`,
                  [funcao, setor, matricula, nivelCargo, vinculo.id]
                );
                vinculosAtualizados++;

                if (!vinculo.ativo) {
                  avisosProcessamento.push({
                    linha: linhaNum,
                    cpf,
                    mensagem:
                      'Funcionário inativo — não reativado automaticamente',
                  });
                }
              }
            } else {
              // Novo vínculo
              await client.query(
                `INSERT INTO funcionarios_clinicas (
                  funcionario_id, clinica_id, empresa_id, ativo,
                  data_vinculo, data_desvinculo, funcao, setor, matricula, nivel_cargo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                  funcionarioId,
                  clinicaId,
                  empresaId,
                  !dataDem, // ativo = true se sem demissão
                  dataAdm ?? new Date().toISOString(),
                  dataDem,
                  funcao,
                  setor,
                  matricula,
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
            // Rollback parcial — desfaz só este funcionário, transação continua válida
            await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
            await client.query(`RELEASE SAVEPOINT ${savepointName}`);
            const msg =
              err instanceof Error ? err.message : 'Erro desconhecido';
            errosProcessamento.push({ linha: linhaNum, cpf, mensagem: msg });
          }
        }
      }

      // Registrar importação no histórico
      const tempoMs = Date.now() - startTime;
      await client.query(
        `INSERT INTO importacoes_clinica (
          clinica_id, usuario_cpf, arquivo_nome, total_linhas,
          empresas_criadas, empresas_existentes,
          funcionarios_criados, funcionarios_atualizados,
          vinculos_criados, vinculos_atualizados,
          inativacoes, total_erros,
          status, erros_detalhes, mapeamento_colunas, tempo_processamento_ms
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          clinicaId,
          session.cpf,
          file.name,
          linhasValidas.length,
          empresasCriadas,
          empresasExistentes,
          funcionariosCriados,
          funcionariosAtualizados,
          vinculosCriados,
          vinculosAtualizados,
          inativacoesRealizadas,
          errosProcessamento.length,
          errosProcessamento.length > 0 ? 'parcial' : 'concluida',
          errosProcessamento.length > 0
            ? JSON.stringify(errosProcessamento)
            : null,
          JSON.stringify(mapeamento),
          tempoMs,
        ]
      );

      return {
        empresasCriadas,
        empresasExistentes,
        empresasBloqueadas,
        empresasNomeAtualizados,
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

    const maskedCpf = `***${String(session.cpf).slice(-4)}`;
    console.log(
      `[AUDIT] Importação dinâmica: ${result.empresasCriadas} emp criadas, ` +
        `${result.funcionariosCriados} func criados, ` +
        `${result.inativacoesRealizadas} inativações, ` +
        `${result.readmissoesRealizadas} readmissões. Clínica ${clinicaId} por ${maskedCpf}`
    );

    return NextResponse.json({
      success: true,
      data: {
        resumo: {
          totalLinhasProcessadas: linhasValidas.length,
          totalLinhasComErroFormato: validacao.resumo.linhasComErros,
          empresasCriadas: result.empresasCriadas,
          empresasExistentes: result.empresasExistentes,
          empresasBloqueadas: result.empresasBloqueadas,
          empresasNomeAtualizados: result.empresasNomeAtualizados,
          funcionariosCriados: result.funcionariosCriados,
          funcionariosAtualizados: result.funcionariosAtualizados,
          nivelCargoAlterados: result.nivelCargoAlterados,
          funcoesAlteradas: result.funcoesAlteradas,
          vinculosCriados: result.vinculosCriados,
          vinculosAtualizados: result.vinculosAtualizados,
          inativacoesRealizadas: result.inativacoesRealizadas,
          readmissoesRealizadas: result.readmissoesRealizadas,
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
    console.error('[importacao/execute] Erro:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('Clínica não identificada') ||
        error.message.includes('Acesso restrito') ||
        error.message.includes('Clínica inativa')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
