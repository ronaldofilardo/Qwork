export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { queryAsGestorEntidade } from '@/lib/db-gestor';
import { requireEntity } from '@/lib/session';
import { validarCPF, limparCPF } from '@/lib/cpf-utils';
import bcrypt from 'bcryptjs';

/**
 * GET /api/entidade/funcionarios
 * Retorna lista de funcionários da entidade
 */
export async function GET() {
  try {
    const session = await requireEntity();
    const entidadeId = session.entidade_id;

    // Query com isolamento: apenas funcionários vinculados ao entidade_id da entidade
    // IMPORTANTE: Não retornar funcionários de outras entidades ou de clínicas
    const funcionarios = await queryAsGestorEntidade(
      `
      SELECT
        f.id,
        f.cpf,
        f.nome,
        f.email,
        f.setor,
        f.funcao,
        f.matricula,
        f.nivel_cargo,
        f.turno,
        f.escala,
        f.ativo,
        f.criado_em,
        f.ultima_avaliacao_id,
        f.ultima_avaliacao_data_conclusao,
        f.ultima_avaliacao_status,
        f.ultimo_motivo_inativacao,
        f.data_nascimento,
        -- Campo índice e data da última avaliação válida (concluída)
        f.indice_avaliacao,
        f.data_ultimo_lote as data_ultimo_lote,
        -- Verificar se tem avaliação concluída há menos de 12 meses (usar data_ultimo_lote ou, se ausente, ultima_avaliacao_data_conclusao)
        CASE 
          WHEN COALESCE(f.data_ultimo_lote, f.ultima_avaliacao_data_conclusao) IS NOT NULL 
               AND COALESCE(f.data_ultimo_lote, f.ultima_avaliacao_data_conclusao) >= NOW() - INTERVAL '1 year' 
            THEN true 
          ELSE false 
        END as tem_avaliacao_recente,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'concluido') as avaliacoes_concluidas,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('iniciada', 'em_andamento')) as avaliacoes_pendentes,
        MAX(a.envio) as ultima_avaliacao,
        -- Data da última inativação (se houver)
        MAX(a.inativada_em) FILTER (WHERE a.status = 'inativada') as ultima_inativacao_em,
        -- ID do lote da última inativação (se houver)
        (
          SELECT l.id FROM avaliacoes a2
          JOIN lotes_avaliacao l ON a2.lote_id = l.id
          WHERE a2.funcionario_cpf = f.cpf AND a2.status = 'inativada' AND a2.inativada_em IS NOT NULL
          ORDER BY a2.inativada_em DESC
          LIMIT 1
        ) as ultima_inativacao_lote
      FROM funcionarios f
      LEFT JOIN avaliacoes a ON a.funcionario_cpf = f.cpf
      WHERE f.contratante_id = $1
        AND f.empresa_id IS NULL
        AND f.clinica_id IS NULL
        AND f.perfil <> 'gestor'
      GROUP BY f.id, f.cpf, f.nome, f.email, f.setor, f.funcao, f.matricula, f.nivel_cargo, f.turno, f.escala, f.ativo, f.criado_em,
               f.ultima_avaliacao_id, f.ultima_avaliacao_data_conclusao, f.ultima_avaliacao_status, f.ultimo_motivo_inativacao, f.data_ultimo_lote
      ORDER BY f.nome
    `,
      [entidadeId]
    );

    // Defense-in-depth: filter out gestor even if the SQL missed it
    const filteredRows = funcionarios.rows.filter(
      (f: any) => f.perfil !== 'gestor'
    );

    return NextResponse.json({
      success: true,
      funcionarios: filteredRows,
    });
  } catch (error) {
    console.error('Erro ao buscar funcionários da entidade:', error);

    if (error instanceof Error && error.message.includes('Acesso restrito')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro ao buscar funcionários' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/entidade/funcionarios
 * Cria novo funcionário vinculado à entidade
 */
export async function POST(request: Request) {
  try {
    const session = await requireEntity();
    const entidadeId = session.entidade_id;

    const {
      cpf,
      nome,
      data_nascimento,
      setor,
      funcao,
      email,
      senha,
      perfil = 'funcionario',
      matricula,
      nivel_cargo,
      turno,
      escala,
    } = await request.json();

    // Validações básicas
    if (!cpf || !nome || !data_nascimento || !setor || !funcao || !email) {
      return NextResponse.json(
        {
          error:
            'CPF, nome, data de nascimento, setor, função e email são obrigatórios',
        },
        { status: 400 }
      );
    }

    // Validar CPF
    const cpfLimpo = limparCPF(cpf);
    if (!validarCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }

    // Validar email
    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // Verificar se funcionário já existe
    const existingFunc = await queryAsGestorEntidade(
      'SELECT cpf FROM funcionarios WHERE cpf = $1',
      [cpfLimpo]
    );

    if (existingFunc.rows.length > 0) {
      return NextResponse.json(
        { error: 'Funcionário com este CPF já existe' },
        { status: 409 }
      );
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha || '123456', 10);

    // Inserir funcionário vinculado à entidade (entidade_id, sem empresa_id/clinica_id)
    // ISOLAMENTO: funcionários de entidade pertencem apenas à entidade, não a empresa/clínica
    const insertParams = [
      cpfLimpo,
      nome,
      data_nascimento,
      setor,
      funcao,
      email,
      senhaHash,
      perfil,
      entidadeId,
      matricula || null,
      nivel_cargo || null,
      turno || null,
      escala || null,
      'funcionario_entidade',
    ];

    const result = await queryAsGestorEntidade(
      `INSERT INTO funcionarios (
        cpf, nome, data_nascimento, setor, funcao, email, senha_hash, perfil,
        entidade_id, matricula, nivel_cargo, turno, escala, ativo,
        empresa_id, clinica_id, usuario_tipo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, NULL, NULL, $14)
      RETURNING id, cpf, nome, email, setor, funcao, data_nascimento, entidade_id`,
      insertParams
    );

    // Vincular explicitamente à entidade em entidades_funcionarios
    const newId = result.rows[0].id;
    try {
      const vinc = await queryAsGestorEntidade(
        'SELECT * FROM entidades_funcionarios WHERE funcionario_id = $1 AND entidade_id = $2',
        [newId, entidadeId]
      );

      if (vinc.rows.length > 0) {
        await queryAsGestorEntidade(
          'UPDATE entidades_funcionarios SET vinculo_ativo = true, atualizado_em = CURRENT_TIMESTAMP WHERE funcionario_id = $1 AND entidade_id = $2',
          [newId, entidadeId]
        );
      } else {
        await queryAsGestorEntidade(
          'INSERT INTO entidades_funcionarios (funcionario_id, entidade_id, tipo_entidade, vinculo_ativo) VALUES ($1, $2, $3, true)',
          [newId, entidadeId, 'entidade']
        );
      }
    } catch (err) {
      console.error('[ENTIDADE] Erro ao vincular funcionário à entidade:', err);
      // Não relançar para não impedir criação do funcionário; registrar para investigação
    }

    console.log(
      `[AUDIT] Funcionário ${cpfLimpo} (${nome}) criado pela entidade ${entidadeId} por ${session.cpf}`
    );

    return NextResponse.json({
      success: true,
      message: 'Funcionário criado com sucesso',
      funcionario: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao criar funcionário da entidade:', error);

    if (error instanceof Error && error.message.includes('Acesso restrito')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro ao criar funcionário' },
      { status: 500 }
    );
  }
}
