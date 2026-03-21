import { NextResponse } from 'next/server';
import { requireClinica } from '@/lib/session';
import { query } from '@/lib/db';
import { withTransaction } from '@/lib/db-transaction';
import {
  parseXlsxBufferToRows,
  validarLinhaFuncionario,
  localizarLinhaPorCPF,
  localizarLinhaPorMatricula,
  localizarLinhaPorEmail,
  validarCPFsUnicosDetalhado,
  validarEmailsUnicosDetalhado,
  validarMatriculasUnicasDetalhado,
  type FuncionarioImportRow,
} from '@/lib/xlsxParser';
import bcrypt from 'bcryptjs';
import { gerarSenhaDeNascimento } from '@/lib/auth/password-generator';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await requireClinica();

    // Para clínicas, precisamos do empresa_id da query string
    const url = new URL(request.url);
    const empresaIdParam = url.searchParams.get('empresa_id');

    if (!empresaIdParam) {
      return NextResponse.json(
        { error: 'empresa_id é obrigatório' },
        { status: 400 }
      );
    }

    const empresaId = parseInt(empresaIdParam, 10);
    if (isNaN(empresaId)) {
      return NextResponse.json(
        { error: 'empresa_id inválido' },
        { status: 400 }
      );
    }

    // Validar que a empresa pertence à clínica do usuário
    const empresaCheck = await query(
      'SELECT id, clinica_id FROM empresas_clientes WHERE id = $1',
      [empresaId]
    );

    if (empresaCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    const empresa = empresaCheck.rows[0];
    if (empresa.clinica_id !== session.clinica_id) {
      return NextResponse.json(
        { error: 'Acesso negado à empresa de outra clínica' },
        { status: 403 }
      );
    }

    // Espera multipart/form-data com campo 'file'
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não enviado' },
        { status: 400 }
      );
    }

    // Validar MIME type e extensão - aceitar somente .xlsx
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

    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(
      arrayBuf instanceof ArrayBuffer ? new Uint8Array(arrayBuf) : arrayBuf
    );

    // Parsear XLSX
    const parsed = parseXlsxBufferToRows(buffer);
    if (!parsed.success || !parsed.data) {
      return NextResponse.json(
        { error: parsed.error || 'Erro ao processar arquivo' },
        { status: 400 }
      );
    }

    const rows = parsed.data as FuncionarioImportRow[];

    // Validações de lote
    const cpfUniqueCheck = validarCPFsUnicosDetalhado(rows);
    if (!cpfUniqueCheck.valido) {
      return NextResponse.json(
        {
          error: 'CPFs duplicados no arquivo',
          details: cpfUniqueCheck.details,
        },
        { status: 400 }
      );
    }

    const emailUniqueCheck = validarEmailsUnicosDetalhado(rows);
    if (!emailUniqueCheck.valido) {
      return NextResponse.json(
        {
          error: 'Emails duplicados no arquivo',
          details: emailUniqueCheck.details,
        },
        { status: 400 }
      );
    }

    // Validar matrículas únicas no arquivo (ignorar valores nulos/vazios)
    const matriculaUniqueCheck = validarMatriculasUnicasDetalhado(rows);
    if (!matriculaUniqueCheck.valido) {
      return NextResponse.json(
        {
          error: 'Matrículas duplicadas no arquivo',
          details: matriculaUniqueCheck.details,
        },
        { status: 400 }
      );
    }

    // Validar linhas individualmente e montar inserts
    const errors: string[] = [];
    const toInsert: FuncionarioImportRow[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const { valido, erros } = validarLinhaFuncionario(row, i + 2);
      if (!valido) {
        errors.push(`Linha ${i + 2}: ${erros.join('; ')}`);
      } else {
        toInsert.push(row);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Erros no arquivo', details: errors },
        { status: 400 }
      );
    }

    // Verificar CPFs já existentes no banco — funcionário pode ter múltiplos empregos
    // Nesse caso vincula o funcionário existente à nova empresa sem criar novo registro
    const cpfs = toInsert.map((r) => r.cpf);
    const existResult = await query(
      'SELECT id, cpf FROM funcionarios WHERE cpf = ANY($1)',
      [cpfs]
    );
    const existingByCpf = new Map<string, number>(
      existResult.rows.map((r: any) => [r.cpf as string, r.id as number])
    );
    const toInsertNew = toInsert.filter((r) => !existingByCpf.has(r.cpf));
    const toLink = toInsert.filter((r) => existingByCpf.has(r.cpf));

    // Verificar matrículas já existentes no banco (apenas para funcionários novos)
    const matriculasParaVerificar = toInsertNew
      .map((r) => r.matricula)
      .filter((m) => m && m.trim().length > 0);

    if (matriculasParaVerificar.length > 0) {
      const existMatriculaResult = await query(
        'SELECT matricula FROM funcionarios WHERE matricula = ANY($1) AND matricula IS NOT NULL',
        [matriculasParaVerificar]
      );
      if (existMatriculaResult.rows.length > 0) {
        const details = existMatriculaResult.rows.map((r: any) => {
          const linha = localizarLinhaPorMatricula(r.matricula, rows);
          return linha
            ? `Linha ${linha}: Matrícula ${r.matricula} já está cadastrada no sistema`
            : `Matrícula ${r.matricula} já está cadastrada no sistema`;
        });
        return NextResponse.json(
          { error: 'Matrículas já existentes no sistema', details },
          { status: 409 }
        );
      }
    }

    // Inserir em transação com isolamento por empresa e auditoria Neon
    try {
      const result = await withTransaction(async (client) => {
        let created = 0;
        let linked = 0;
        const skippedAlreadyLinked: string[] = [];

        // Inserir funcionários novos
        for (const r of toInsertNew) {
          const senhaPlaintext = gerarSenhaDeNascimento(r.data_nascimento);
          const senhaHash = await bcrypt.hash(senhaPlaintext, 10);

          // ARQUITETURA SEGREGADA: Inserir em 2 etapas
          // 1. Inserir funcionário (sem FKs diretas)
          const insertResult = await client.query(
            `INSERT INTO funcionarios (cpf, nome, data_nascimento, setor, funcao, email, senha_hash, perfil, ativo, matricula, nivel_cargo, turno, escala)
             VALUES ($1,$2,$3,$4,$5,$6,$7,'funcionario',true,$8,$9,$10,$11)
             RETURNING id`,
            [
              r.cpf,
              r.nome,
              r.data_nascimento,
              r.setor,
              r.funcao,
              r.email,
              senhaHash,
              r.matricula || null,
              r.nivel_cargo || null,
              r.turno || null,
              r.escala || null,
            ]
          );

          const funcionarioId = insertResult.rows[0].id;

          // 2. Criar relacionamento na tabela funcionarios_clinicas
          await client.query(
            `INSERT INTO funcionarios_clinicas (funcionario_id, clinica_id, empresa_id, ativo, data_vinculo)
             VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)`,
            [funcionarioId, session.clinica_id, empresaId]
          );

          created++;
        }

        // Vincular funcionários existentes a esta empresa (múltiplos empregos)
        for (const r of toLink) {
          const funcionarioId = existingByCpf.get(r.cpf)!;

          const alreadyLinked = await client.query(
            'SELECT 1 FROM funcionarios_clinicas WHERE funcionario_id = $1 AND empresa_id = $2',
            [funcionarioId, empresaId]
          );

          if (alreadyLinked.rows.length === 0) {
            await client.query(
              `INSERT INTO funcionarios_clinicas (funcionario_id, clinica_id, empresa_id, ativo, data_vinculo)
               VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)`,
              [funcionarioId, session.clinica_id, empresaId]
            );
            linked++;
          } else {
            const linha = localizarLinhaPorCPF(r.cpf, rows);
            skippedAlreadyLinked.push(
              linha
                ? `Linha ${linha}: CPF ${r.cpf} já está vinculado a esta empresa`
                : `CPF ${r.cpf} já está vinculado a esta empresa`
            );
          }
        }

        return { created, linked, skippedAlreadyLinked };
      });

      const maskedCpf =
        typeof session.cpf === 'string'
          ? `***${String(session.cpf).slice(-4)}`
          : session.cpf;
      console.log(
        `[AUDIT] Importação em massa: ${result.created} criados, ${result.linked} vinculados para empresa ${empresaId} da clínica ${session.clinica_id} por ${maskedCpf}`
      );

      return NextResponse.json({
        success: true,
        created: result.created,
        linked: result.linked,
        ...(result.skippedAlreadyLinked.length > 0
          ? { warnings: result.skippedAlreadyLinked }
          : {}),
      });
    } catch (err) {
      console.error(
        'Erro ao inserir funcionários em massa:',
        err && (err as any).message ? (err as any).message : err
      );

      // Tratar erros específicos de constraint
      const error = err as any;

      // Erro de CPF duplicado
      if (error.code === '23505' && error.constraint?.includes('cpf')) {
        const match = error.detail?.match(/Key \(cpf\)=\(([^)]+)\)/);
        const cpf = match ? match[1] : 'desconhecido';
        const linha =
          cpf !== 'desconhecido' ? localizarLinhaPorCPF(cpf, rows) : null;
        const detail = linha
          ? `Linha ${linha}: CPF ${cpf} já está cadastrado no sistema`
          : `CPF ${cpf} já está cadastrado no sistema`;
        return NextResponse.json(
          { error: 'CPF duplicado', details: [detail] },
          { status: 409 }
        );
      }

      // Erro de matrícula duplicada
      if (error.code === '23505' && error.constraint?.includes('matricula')) {
        const match = error.detail?.match(/Key \(matricula\)=\(([^)]+)\)/);
        const matricula = match ? match[1] : 'desconhecida';
        const linha =
          matricula !== 'desconhecida'
            ? localizarLinhaPorMatricula(matricula, rows)
            : null;
        const detail = linha
          ? `Linha ${linha}: Matrícula ${matricula} já está cadastrada no sistema`
          : `Matrícula ${matricula} já está cadastrada no sistema`;
        return NextResponse.json(
          { error: 'Matrícula duplicada', details: [detail] },
          { status: 409 }
        );
      }

      // Erro de email duplicado
      if (error.code === '23505' && error.constraint?.includes('email')) {
        const match = error.detail?.match(/Key \(email\)=\(([^)]+)\)/);
        const email = match ? match[1] : 'desconhecido';
        const linha =
          email !== 'desconhecido' ? localizarLinhaPorEmail(email, rows) : null;
        const detail = linha
          ? `Linha ${linha}: Email ${email} já está cadastrado no sistema`
          : `Email ${email} já está cadastrado no sistema`;
        return NextResponse.json(
          { error: 'Email duplicado', details: [detail] },
          { status: 409 }
        );
      }

      // Outros erros
      return NextResponse.json(
        { error: 'Erro ao inserir funcionários' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro importando arquivo XLSX:', error);
    return NextResponse.json(
      { error: 'Erro ao processar importação' },
      { status: 500 }
    );
  }
}
