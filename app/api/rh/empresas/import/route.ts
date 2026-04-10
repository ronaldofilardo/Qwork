import { NextResponse } from 'next/server';
import { requireClinica } from '@/lib/session';
import { query } from '@/lib/db';
import { withTransaction } from '@/lib/db-transaction';
import {
  parseEmpresaFuncionarioXlsx,
  validarLinhaEmpresaFuncionario,
  validarCPFsUnicos,
  validarEmailsUnicos,
  validarCNPJsEmpresaBulk,
  parseDateCell,
  type EmpresaFuncionarioImportRow,
} from '@/lib/xlsxParser';
import { normalizeCNPJ } from '@/lib/validators';
import bcrypt from 'bcryptjs';
import { gerarSenhaDeNascimento } from '@/lib/auth/password-generator';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireClinica();
    const clinicaId = session.clinica_id!;

    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type deve ser multipart/form-data' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: 'Arquivo não enviado' },
        { status: 400 }
      );
    }

    const allowedMime =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (
      file.type !== allowedMime &&
      !file.name.toLowerCase().endsWith('.xlsx')
    ) {
      return NextResponse.json(
        { error: 'Apenas arquivos .xlsx são permitidos' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo não pode exceder 10 MB' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const parsed = parseEmpresaFuncionarioXlsx(buffer);
    if (!parsed.success || !parsed.data) {
      return NextResponse.json(
        { error: parsed.error ?? 'Erro ao processar arquivo' },
        { status: 400 }
      );
    }

    const rows = parsed.data;

    // Batch validations (usando funções legadas que aceitam tipos diferentes)
    const cpfCheck = validarCPFsUnicos(
      rows as unknown as Parameters<typeof validarCPFsUnicos>[0]
    );
    if (!cpfCheck.valido) {
      return NextResponse.json(
        {
          error: `CPFs duplicados no arquivo: ${cpfCheck.duplicados.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const emailCheck = validarEmailsUnicos(
      rows as unknown as Parameters<typeof validarEmailsUnicos>[0]
    );
    if (!emailCheck.valido) {
      return NextResponse.json(
        {
          error: `Emails duplicados no arquivo: ${emailCheck.duplicados.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const cnpjCheck = validarCNPJsEmpresaBulk(rows);
    if (!cnpjCheck.valido) {
      return NextResponse.json(
        { error: 'Inconsistências no arquivo', details: cnpjCheck.erros },
        { status: 400 }
      );
    }

    // Validate individual rows
    const rowErrors: string[] = [];
    const toInsert: EmpresaFuncionarioImportRow[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const { valido, erros } = validarLinhaEmpresaFuncionario(row, i + 2);
      if (!valido) {
        rowErrors.push(`Linha ${i + 2}: ${erros.join('; ')}`);
      } else {
        toInsert.push(row);
      }
    }

    if (rowErrors.length > 0) {
      return NextResponse.json(
        { error: 'Erros no arquivo', details: rowErrors },
        { status: 400 }
      );
    }

    // Normalize and validate dates
    const dateErrors: string[] = [];
    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < toInsert.length; i++) {
      const r = toInsert[i];
      const iso = parseDateCell(r.data_nascimento);
      if (!iso || !isoPattern.test(iso)) {
        dateErrors.push(
          `Linha ${i + 2}: Data de nascimento inválida (${String(r.data_nascimento)})`
        );
        continue;
      }
      const year = parseInt(iso.slice(0, 4), 10);
      if (isNaN(year) || year < 1900 || year > currentYear) {
        dateErrors.push(
          `Linha ${i + 2}: Data de nascimento inválida (ano fora do intervalo)`
        );
      } else {
        r.data_nascimento = iso;
      }
    }

    if (dateErrors.length > 0) {
      return NextResponse.json(
        { error: 'Erros no arquivo', details: dateErrors },
        { status: 400 }
      );
    }

    // Group rows by empresa_cnpj
    const empresaMap = new Map<
      string,
      { empresa_nome: string; rows: EmpresaFuncionarioImportRow[] }
    >();

    for (const row of toInsert) {
      const cnpj = normalizeCNPJ(row.empresa_cnpj);
      const existing = empresaMap.get(cnpj);
      if (existing) {
        existing.rows.push(row);
      } else {
        empresaMap.set(cnpj, {
          empresa_nome: row.empresa_nome.trim(),
          rows: [row],
        });
      }
    }

    // Verificar bloqueios de CNPJ: entidades + empresas de outra clínica
    const cnpjsParaVerificar = [...empresaMap.keys()];
    const cnpjsBloqueados = new Map<string, string>();
    const avisosBloqueio: string[] = [];

    if (cnpjsParaVerificar.length > 0) {
      const conflictResult = await query<{ cnpj: string; origem: string }>(
        `SELECT cnpj::text, 'entidade' AS origem FROM entidades WHERE cnpj = ANY($1)
         UNION ALL
         SELECT cnpj::text, 'outra_clinica' AS origem FROM empresas_clientes WHERE cnpj = ANY($1) AND clinica_id != $2`,
        [cnpjsParaVerificar, clinicaId]
      );
      for (const row of conflictResult.rows) {
        const msg =
          row.origem === 'entidade'
            ? `CNPJ ${row.cnpj} pertence a uma Entidade cadastrada — não é possível criar como empresa de clínica`
            : `CNPJ ${row.cnpj} já está cadastrado em outra clínica`;
        cnpjsBloqueados.set(row.cnpj, msg);
      }
    }

    for (const [cnpj, { empresa_nome }] of empresaMap) {
      const motivo = cnpjsBloqueados.get(cnpj);
      if (motivo) {
        avisosBloqueio.push(`Empresa "${empresa_nome}": ${motivo}`);
        empresaMap.delete(cnpj);
      }
    }

    if (empresaMap.size === 0) {
      return NextResponse.json(
        {
          error:
            'Nenhuma empresa pôde ser importada devido a conflitos de CNPJ',
          details: avisosBloqueio,
        },
        { status: 409 }
      );
    }

    // Execute everything in a single transaction
    const result = await withTransaction(async (client) => {
      let empresasCriadas = 0;
      let empresasExistentes = 0;
      let funcionariosCriados = 0;
      let funcionariosVinculados = 0;

      for (const [cnpj, { empresa_nome, rows: empresaRows }] of empresaMap) {
        // Find or create empresa — busca global para detectar conflitos restantes
        const empresaExist = await client.query(
          'SELECT id, clinica_id FROM empresas_clientes WHERE cnpj = $1',
          [cnpj]
        );

        let empresaId: number;

        if (empresaExist.rows.length > 0) {
          const empresaRow = empresaExist.rows[0];
          if (Number(empresaRow.clinica_id) === clinicaId) {
            empresaId = empresaRow.id as number;
            empresasExistentes++;
          } else {
            // CNPJ de outra clínica (race condition — já filtrado no pré-check, mas por segurança)
            continue;
          }
        } else {
          const insertEmpresa = await client.query(
            `INSERT INTO empresas_clientes (nome, cnpj, clinica_id, ativa, limite_primeira_cobranca_manutencao)
             VALUES ($1, $2, $3, true, NOW() + INTERVAL '90 days')
             RETURNING id`,
            [empresa_nome, cnpj, clinicaId]
          );
          empresaId = insertEmpresa.rows[0].id as number;
          empresasCriadas++;
        }

        // Insert or link funcionarios
        for (const r of empresaRows) {
          const senhaPlaintext = gerarSenhaDeNascimento(r.data_nascimento);
          const senhaHash = await bcrypt.hash(senhaPlaintext, 10);

          // Check if CPF already exists
          const existFunc = await client.query(
            'SELECT id FROM funcionarios WHERE cpf = $1',
            [r.cpf]
          );

          if (existFunc.rows.length > 0) {
            const funcionarioId = existFunc.rows[0].id as number;

            // Check if already linked to this empresa
            const vinculo = await client.query(
              `SELECT id, ativo FROM funcionarios_clinicas
               WHERE funcionario_id = $1 AND empresa_id = $2`,
              [funcionarioId, empresaId]
            );

            if (vinculo.rows.length > 0) {
              // Reactivate if inactive
              if (!vinculo.rows[0].ativo) {
                await client.query(
                  `UPDATE funcionarios_clinicas
                   SET ativo = true, data_desvinculo = NULL, atualizado_em = NOW()
                   WHERE id = $1`,
                  [vinculo.rows[0].id]
                );
              }
              funcionariosVinculados++;
            } else {
              // New link for existing CPF
              await client.query(
                `INSERT INTO funcionarios_clinicas (funcionario_id, clinica_id, empresa_id, ativo, data_vinculo)
                 VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)`,
                [funcionarioId, clinicaId, empresaId]
              );
              funcionariosVinculados++;
            }
          } else {
            // New funcionario
            const insertFunc = await client.query(
              `INSERT INTO funcionarios (
                cpf, nome, data_nascimento, setor, funcao, email,
                senha_hash, perfil, ativo, matricula, nivel_cargo, turno, escala, usuario_tipo
              ) VALUES ($1,$2,$3,$4,$5,$6,$7,'funcionario',true,$8,$9,$10,$11,'funcionario_clinica'::usuario_tipo_enum)
              RETURNING id`,
              [
                r.cpf,
                r.nome,
                r.data_nascimento,
                r.setor,
                r.funcao,
                r.email || null,
                senhaHash,
                r.matricula || null,
                r.nivel_cargo || null,
                r.turno || null,
                r.escala || null,
              ]
            );
            const funcionarioId = insertFunc.rows[0].id as number;

            await client.query(
              `INSERT INTO funcionarios_clinicas (funcionario_id, clinica_id, empresa_id, ativo, data_vinculo)
               VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)`,
              [funcionarioId, clinicaId, empresaId]
            );
            funcionariosCriados++;
          }
        }
      }

      return {
        empresasCriadas,
        empresasExistentes,
        funcionariosCriados,
        funcionariosVinculados,
      };
    });

    const maskedCpf =
      typeof session.cpf === 'string'
        ? `***${String(session.cpf).slice(-4)}`
        : session.cpf;

    console.log(
      `[AUDIT] Importação bulk (empresas+funcionários): ${result.empresasCriadas} empresas criadas, ` +
        `${result.empresasExistentes} existentes, ${result.funcionariosCriados} funcionários criados, ` +
        `${result.funcionariosVinculados} vinculados. Clínica ${clinicaId} por ${maskedCpf}`
    );

    return NextResponse.json({
      success: true,
      empresas_criadas: result.empresasCriadas,
      empresas_existentes: result.empresasExistentes,
      funcionarios_criados: result.funcionariosCriados,
      funcionarios_vinculados: result.funcionariosVinculados,
      total_linhas: toInsert.length,
      ...(avisosBloqueio.length > 0 ? { avisos: avisosBloqueio } : {}),
    });
  } catch (error: unknown) {
    console.error('Erro ao importar empresas+funcionários:', error);

    if (
      error instanceof Error &&
      (error.message.includes('Clínica não identificada') ||
        error.message.includes('tomador não é do tipo clínica') ||
        error.message.includes('Clínica inativa'))
    ) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const pgError = error as {
      code?: string;
      constraint?: string;
      detail?: string;
    };

    if (pgError.code === '23505') {
      if (pgError.constraint?.includes('cpf')) {
        const match = pgError.detail?.match(/Key \(cpf\)=\(([^)]+)\)/);
        const cpf = match ? match[1] : 'desconhecido';
        return NextResponse.json(
          { error: `CPF ${cpf} já existe no sistema` },
          { status: 409 }
        );
      }
      if (pgError.constraint?.includes('cnpj')) {
        return NextResponse.json(
          { error: 'CNPJ já cadastrado para outra clínica' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
