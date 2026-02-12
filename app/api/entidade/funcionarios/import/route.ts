import { NextResponse } from 'next/server';
import { requireEntity } from '@/lib/session';
import { queryAsGestorEntidade } from '@/lib/db-gestor';
import { withTransactionAsGestor } from '@/lib/db-transaction';
import {
  parseXlsxBufferToRows,
  parseDateCell,
  validarLinhaFuncionario,
  validarEmailsUnicos,
  validarCPFsUnicos,
  type FuncionarioImportRow,
} from '@/lib/xlsxParser';
import bcrypt from 'bcryptjs';
import { gerarSenhaDeNascimento } from '@/lib/auth/password-generator';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await requireEntity();
    const entidadeId = session.entidade_id;

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
    const cpfUniqueCheck = validarCPFsUnicos(rows);
    if (!cpfUniqueCheck.valido) {
      return NextResponse.json(
        {
          error: `CPFs duplicados no arquivo: ${cpfUniqueCheck.duplicados.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const emailUniqueCheck = validarEmailsUnicos(rows);
    if (!emailUniqueCheck.valido) {
      return NextResponse.json(
        {
          error: `Emails duplicados no arquivo: ${emailUniqueCheck.duplicados.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validar matrículas únicas no arquivo (ignorar valores nulos/vazios)
    const matriculas = rows
      .map((r) => r.matricula)
      .filter((m) => m && m.trim().length > 0);
    const matriculasDuplicadas = matriculas.filter(
      (m, i) => matriculas.indexOf(m) !== i
    );
    if (matriculasDuplicadas.length > 0) {
      const uniqueDups = Array.from(new Set(matriculasDuplicadas));
      return NextResponse.json(
        {
          error: `Matrículas duplicadas no arquivo: ${uniqueDups.join(', ')}`,
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

    // Verificar CPFs já existentes no banco
    const cpfs = toInsert.map((r) => r.cpf);
    const existResult = await queryAsGestorEntidade(
      'SELECT cpf FROM funcionarios WHERE cpf = ANY($1)',
      [cpfs]
    );
    if (existResult.rows.length > 0) {
      const exists = existResult.rows.map((r: any) => r.cpf).join(', ');
      return NextResponse.json(
        { error: `CPFs já existentes no sistema: ${exists}` },
        { status: 409 }
      );
    }

    // Verificar matrículas já existentes no banco (ignorar valores nulos/vazios)
    const matriculasParaVerificar = toInsert
      .map((r) => r.matricula)
      .filter((m) => m && m.trim().length > 0);

    if (matriculasParaVerificar.length > 0) {
      const existMatriculaResult = await queryAsGestorEntidade(
        'SELECT matricula FROM funcionarios WHERE matricula = ANY($1) AND matricula IS NOT NULL',
        [matriculasParaVerificar]
      );
      if (existMatriculaResult.rows.length > 0) {
        const existsMatriculas = existMatriculaResult.rows
          .map((r: any) => r.matricula)
          .join(', ');
        return NextResponse.json(
          { error: `Matrículas já existentes no sistema: ${existsMatriculas}` },
          { status: 409 }
        );
      }
    }

    // Normalizar e validar datas antes de inserir
    const dateErrors: string[] = [];
    try {
      for (let i = 0; i < toInsert.length; i++) {
        const r = toInsert[i];
        const iso = parseDateCell(r.data_nascimento);
        const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!iso || !isoPattern.test(iso)) {
          dateErrors.push(
            `Linha ${i + 2}: Data de nascimento inválida (${String(r.data_nascimento)})`
          );
        } else {
          const year = parseInt(iso.slice(0, 4), 10);
          const currentYear = new Date().getFullYear();
          if (isNaN(year) || year < 1900 || year > currentYear) {
            dateErrors.push(
              `Linha ${i + 2}: Data de nascimento inválida (ano fora do intervalo)`
            );
          } else {
            r.data_nascimento = iso;
          }
        }
      }
    } catch (err) {
      console.error('Erro ao validar datas:', err);
      const msg =
        err && (err as Error).message ? (err as Error).message : String(err);
      return NextResponse.json(
        { error: 'Erro ao validar datas do arquivo', details: [msg] },
        { status: 400 }
      );
    }

    if (dateErrors.length > 0) {
      return NextResponse.json(
        { error: 'Erros no arquivo', details: dateErrors },
        { status: 400 }
      );
    }

    // Inserir em transação usando client dedicado (solução robusta para auditoria)
    try {
      const result = await withTransactionAsGestor(async (client) => {
        let created = 0;

        for (const r of toInsert) {
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

          // 2. Criar relacionamento na tabela funcionarios_entidades
          await client.query(
            `INSERT INTO funcionarios_entidades (funcionario_id, entidade_id, ativo, data_vinculo)
             VALUES ($1, $2, true, CURRENT_TIMESTAMP)`,
            [funcionarioId, entidadeId]
          );

          created++;
        }

        return { created };
      });

      const maskedCpf =
        typeof session.cpf === 'string'
          ? `***${String(session.cpf).slice(-4)}`
          : session.cpf;
      console.log(
        `[AUDIT] Importação em massa: ${result.created} funcionários importados pela entidade ${entidadeId} por ${maskedCpf}`
      );

      return NextResponse.json({ success: true, created: result.created });
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
        return NextResponse.json(
          { error: `CPF ${cpf} já existe no sistema` },
          { status: 409 }
        );
      }

      // Erro de matrícula duplicada
      if (error.code === '23505' && error.constraint?.includes('matricula')) {
        const match = error.detail?.match(/Key \(matricula\)=\(([^)]+)\)/);
        const matricula = match ? match[1] : 'desconhecida';
        return NextResponse.json(
          { error: `Matrícula ${matricula} já existe no sistema` },
          { status: 409 }
        );
      }

      // Erro de email duplicado
      if (error.code === '23505' && error.constraint?.includes('email')) {
        const match = error.detail?.match(/Key \(email\)=\(([^)]+)\)/);
        const email = match ? match[1] : 'desconhecido';
        return NextResponse.json(
          { error: `Email ${email} já existe no sistema` },
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
