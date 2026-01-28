import { NextResponse } from 'next/server';
import { requireEntity } from '@/lib/session';
import { query } from '@/lib/db';
import {
  parseXlsxBufferToRows,
  parseDateCell,
  validarLinhaFuncionario,
  validarEmailsUnicos,
  validarCPFsUnicos,
  type FuncionarioImportRow,
} from '@/lib/xlsxParser';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await requireEntity();
    const contratanteId = session.contratante_id;

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
    const existResult = await query(
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

    // Inserir em transação
    await query('BEGIN');
    try {
      let created = 0;
      for (const r of toInsert) {
        const senhaHash = await bcrypt.hash(r.senha || '123456', 10);
        await query(
          `INSERT INTO funcionarios (cpf, nome, data_nascimento, setor, funcao, email, senha_hash, perfil, contratante_id, ativo, matricula, nivel_cargo, turno, escala)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'funcionario',$8,true,$9,$10,$11,$12)`,
          [
            r.cpf,
            r.nome,
            r.data_nascimento,
            r.setor,
            r.funcao,
            r.email,
            senhaHash,
            contratanteId,
            r.matricula || null,
            r.nivel_cargo || null,
            r.turno || null,
            r.escala || null,
          ]
        );
        created++;
      }

      await query('COMMIT');

      const maskedCpf =
        typeof session.cpf === 'string'
          ? `***${String(session.cpf).slice(-4)}`
          : session.cpf;
      console.log(
        `[AUDIT] Importação em massa: ${created} funcionários importados pela entidade ${contratanteId} por ${maskedCpf}`
      );

      return NextResponse.json({ success: true, created });
    } catch (err) {
      await query('ROLLBACK');
      console.error(
        'Erro ao inserir funcionários em massa:',
        err && err.message ? err.message : err
      );
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
