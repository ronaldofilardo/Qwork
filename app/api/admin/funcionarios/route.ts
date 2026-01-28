import _bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await requireRole('rh');
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresa_id');

    // Obter a clínica do RH logado
    const rhResult = await query(
      'SELECT clinica_id FROM funcionarios WHERE cpf = $1',
      [session.cpf]
    );

    if (rhResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Gestor RH não encontrado' },
        { status: 404 }
      );
    }

    const clinicaId = rhResult.rows[0].clinica_id;

    // Consulta todos os funcionários e suas avaliações apenas das empresas da clínica
    let queryText = `
      SELECT
        f.cpf, f.nome, f.setor, f.funcao, f.email, f.perfil, f.ativo,
        f.matricula, f.turno, f.escala, f.nivel_cargo,
        f.empresa_id, ec.nome as empresa_nome,
        f.criado_em, f.atualizado_em,
        a.id as avaliacao_id, a.inicio as avaliacao_inicio, a.envio as avaliacao_envio, a.status as avaliacao_status,
        la.id as lote_id, la.codigo as lote_codigo
      FROM funcionarios f
      LEFT JOIN empresas_clientes ec ON f.empresa_id = ec.id
      LEFT JOIN avaliacoes a ON a.funcionario_cpf = f.cpf
      LEFT JOIN lotes_avaliacao la ON a.lote_id = la.id
      WHERE f.clinica_id = $1
      AND ec.clinica_id = $1
    `;
    const params = [clinicaId];
    if (empresaId) {
      // Validar se a empresa pertence à clínica do RH
      const empresaCheck = await query(
        'SELECT id FROM empresas_clientes WHERE id = $1 AND clinica_id = $2',
        [empresaId, clinicaId]
      );
      if (empresaCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Empresa não encontrada ou sem permissão' },
          { status: 403 }
        );
      }
      queryText += ' AND f.empresa_id = $2';
      params.push(empresaId);
    }
    queryText += ' ORDER BY f.nome, a.inicio DESC';
    const result = await query(queryText, params);

    // Agrupar avaliações por funcionário
    const funcionariosMap = new Map();
    for (const row of result.rows) {
      if (!funcionariosMap.has(row.cpf)) {
        funcionariosMap.set(row.cpf, {
          cpf: row.cpf,
          nome: row.nome,
          setor: row.setor,
          funcao: row.funcao,
          email: row.email,
          matricula: row.matricula,
          nivel_cargo: row.nivel_cargo,
          turno: row.turno,
          escala: row.escala,
          empresa_nome: row.empresa_nome,
          empresa_id: row.empresa_id,
          ativo: row.ativo,
          criado_em: row.criado_em,
          atualizado_em: row.atualizado_em,
          avaliacoes: [],
        });
      }
      if (row.avaliacao_id) {
        funcionariosMap.get(row.cpf).avaliacoes.push({
          id: row.avaliacao_id,
          inicio: row.avaliacao_inicio,
          envio: row.avaliacao_envio,
          status: row.avaliacao_status,
          lote_id: row.lote_id,
          lote_codigo: row.lote_codigo,
        });
      }
    }
    return NextResponse.json({
      funcionarios: Array.from(funcionariosMap.values()),
    });
  } catch (error) {
    console.error('Erro ao listar funcionários:', error);
    return NextResponse.json({ error: 'Erro ao listar' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireRole('rh');

    const {
      cpf,
      nome,
      setor,
      funcao,
      email,
      matricula,
      turno,
      escala,
      empresa_id,
    } = await request.json();

    // Validações básicas de segurança
    if (!cpf || !nome || !setor || !funcao || !email || !empresa_id) {
      return NextResponse.json(
        {
          error:
            'CPF, nome, setor, função, email e empresa_id são obrigatórios',
        },
        { status: 400 }
      );
    }

    // Validar formato CPF
    if (!/^\d{11}$/.test(cpf)) {
      return NextResponse.json(
        { error: 'CPF deve conter 11 dígitos' },
        { status: 400 }
      );
    }

    // Validar email
    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // Registrar usuário atual no contexto para auditoria
    await query(`SET LOCAL app.current_user_cpf = '${session.cpf}'`);
    await query(`SET LOCAL app.current_user_perfil = '${session.perfil}'`);

    // Obter clínica do RH logado
    const rhResult = await query(
      'SELECT clinica_id FROM funcionarios WHERE cpf = $1',
      [session.cpf]
    );

    if (rhResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Gestor RH não encontrado' },
        { status: 404 }
      );
    }

    const clinicaId = rhResult.rows[0].clinica_id;

    // Verificar se a empresa pertence à clínica do RH
    const empresaCheck = await query(
      'SELECT id FROM empresas_clientes WHERE id = $1 AND clinica_id = $2',
      [empresa_id, clinicaId]
    );

    if (empresaCheck.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Empresa não encontrada ou sem permissão de acesso',
        },
        { status: 403 }
      );
    }

    // Verificar se funcionário existe e pertence à empresa/clínica
    const funcCheck = await query(
      `SELECT f.cpf FROM funcionarios f
       INNER JOIN empresas_clientes ec ON f.empresa_id = ec.id
       WHERE f.cpf = $1 AND f.empresa_id = $2 AND ec.clinica_id = $3`,
      [cpf, empresa_id, clinicaId]
    );

    if (funcCheck.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Funcionário não encontrado ou sem permissão de acesso',
        },
        { status: 404 }
      );
    }

    // Atualizar funcionário com validações de segurança
    await query(
      `UPDATE funcionarios
       SET nome = $1, setor = $2, funcao = $3, email = $4,
           matricula = $5, turno = $6, escala = $7,
           atualizado_em = NOW()
       WHERE cpf = $8 AND empresa_id = $9`,
      [
        nome.trim(),
        setor.trim(),
        funcao.trim(),
        email.trim().toLowerCase(),
        matricula?.trim() || null,
        turno?.trim() || null,
        escala?.trim() || null,
        cpf,
        empresa_id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Funcionário atualizado com sucesso',
      funcionario: { cpf, nome, empresa_id },
    });
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error);

    if (error instanceof Error && error.message.includes('permissão')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
