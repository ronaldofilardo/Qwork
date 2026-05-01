export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { queryAsGestorEntidade } from '@/lib/db-gestor';
import { requireEntity } from '@/lib/session';
import { validarCPF, limparCPF } from '@/lib/cpf-utils';
import bcrypt from 'bcryptjs';
import { gerarSenhaDeNascimento } from '@/lib/auth/password-generator';

/**
 * GET /api/entidade/funcionarios
 * Retorna lista de funcionários da entidade
 */
export async function GET() {
  try {
    const session = await requireEntity();
    const entidadeId = session.entidade_id;

    // Query com isolamento: apenas funcionários vinculados à entidade via funcionarios_entidades
    // ARQUITETURA SEGREGADA: usa tabela intermediária funcionarios_entidades
    // ISOLAMENTO DE AVALIAÇÕES: LEFT JOIN filtrado por lotes desta entidade para evitar
    // misturar status/resultados de avaliações feitas em outras entidades ou clínicas
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
        f.ultimo_motivo_inativacao,
        f.data_nascimento,
        f.indice_avaliacao,
        -- Status/dados de avaliação isolados por ESTA entidade
        (
          SELECT a_ult.id FROM avaliacoes a_ult
          JOIN lotes_avaliacao l_ult ON a_ult.lote_id = l_ult.id
          WHERE a_ult.funcionario_cpf = f.cpf
            AND l_ult.entidade_id = $1
            AND a_ult.status NOT IN ('inativada')
          ORDER BY COALESCE(a_ult.envio, a_ult.criado_em) DESC NULLS LAST
          LIMIT 1
        ) as ultima_avaliacao_id,
        (
          SELECT a_ult.envio FROM avaliacoes a_ult
          JOIN lotes_avaliacao l_ult ON a_ult.lote_id = l_ult.id
          WHERE a_ult.funcionario_cpf = f.cpf
            AND l_ult.entidade_id = $1
            AND a_ult.status IN ('concluida', 'concluido')
          ORDER BY a_ult.envio DESC NULLS LAST
          LIMIT 1
        ) as ultima_avaliacao_data_conclusao,
        (
          SELECT a_ult.status FROM avaliacoes a_ult
          JOIN lotes_avaliacao l_ult ON a_ult.lote_id = l_ult.id
          WHERE a_ult.funcionario_cpf = f.cpf
            AND l_ult.entidade_id = $1
            AND a_ult.status NOT IN ('inativada')
          ORDER BY COALESCE(a_ult.envio, a_ult.criado_em) DESC NULLS LAST
          LIMIT 1
        ) as ultima_avaliacao_status,
        (
          SELECT l_ult.emitido_em FROM avaliacoes a_ult
          JOIN lotes_avaliacao l_ult ON a_ult.lote_id = l_ult.id
          WHERE a_ult.funcionario_cpf = f.cpf
            AND l_ult.entidade_id = $1
            AND a_ult.status IN ('concluida', 'concluido')
          ORDER BY a_ult.envio DESC NULLS LAST
          LIMIT 1
        ) as data_ultimo_lote,
        -- Verificar se tem avaliação concluída nesta entidade há menos de 12 meses
        CASE
          WHEN EXISTS (
            SELECT 1 FROM avaliacoes a_rec
            JOIN lotes_avaliacao l_rec ON a_rec.lote_id = l_rec.id
            WHERE a_rec.funcionario_cpf = f.cpf
              AND l_rec.entidade_id = $1
              AND a_rec.status IN ('concluida', 'concluido')
              AND a_rec.envio >= NOW() - INTERVAL '1 year'
          ) THEN true
          ELSE false
        END as tem_avaliacao_recente,
        -- Contagens isoladas por esta entidade
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'concluida' OR a.status = 'concluido') as avaliacoes_concluidas,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('iniciada', 'em_andamento')) as avaliacoes_pendentes,
        MAX(a.envio) as ultima_avaliacao,
        MAX(a.inativada_em) FILTER (WHERE a.status = 'inativada') as ultima_inativacao_em,
        -- ID do lote da última inativação nesta entidade
        (
          SELECT l.id FROM avaliacoes a2
          JOIN lotes_avaliacao l ON a2.lote_id = l.id
          WHERE a2.funcionario_cpf = f.cpf
            AND l.entidade_id = $1
            AND a2.status = 'inativada'
            AND a2.inativada_em IS NOT NULL
          ORDER BY a2.inativada_em DESC
          LIMIT 1
        ) as ultima_inativacao_lote,
        -- Número de ordem do lote da última avaliação não-inativada nesta entidade
        -- (mesmo critério/ordem de ultima_avaliacao_status para garantir coerência)
        (
          SELECT l.id FROM avaliacoes a3
          JOIN lotes_avaliacao l ON a3.lote_id = l.id
          WHERE a3.funcionario_cpf = f.cpf
            AND l.entidade_id = $1
            AND a3.status NOT IN ('inativada')
          ORDER BY COALESCE(a3.envio, a3.criado_em) DESC NULLS LAST
          LIMIT 1
        ) as ultimo_lote_numero,
        -- Avaliação ativa (iniciada/em_andamento) mais recente nesta entidade
        (
          SELECT l_at.id FROM avaliacoes a_at
          JOIN lotes_avaliacao l_at ON a_at.lote_id = l_at.id
          WHERE a_at.funcionario_cpf = f.cpf
            AND l_at.entidade_id = $1
            AND a_at.status IN ('iniciada', 'em_andamento')
          ORDER BY a_at.criado_em DESC NULLS LAST
          LIMIT 1
        ) as lote_ativo_numero,
        -- Status da avaliação ativa mais recente nesta entidade
        (
          SELECT a_at.status FROM avaliacoes a_at
          JOIN lotes_avaliacao l_at ON a_at.lote_id = l_at.id
          WHERE a_at.funcionario_cpf = f.cpf
            AND l_at.entidade_id = $1
            AND a_at.status IN ('iniciada', 'em_andamento')
          ORDER BY a_at.criado_em DESC NULLS LAST
          LIMIT 1
        ) as avaliacao_ativa_status
      FROM funcionarios f
      INNER JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
      -- Avaliações isoladas: apenas de lotes desta entidade
      LEFT JOIN (
        SELECT av.* FROM avaliacoes av
        JOIN lotes_avaliacao la ON la.id = av.lote_id
        WHERE la.entidade_id = $1
      ) a ON a.funcionario_cpf = f.cpf
      WHERE fe.entidade_id = $1
        AND f.perfil <> 'gestor'
      GROUP BY f.id, f.cpf, f.nome, f.email, f.setor, f.funcao, f.matricula, f.nivel_cargo, f.turno, f.escala, f.ativo, f.criado_em,
               f.ultimo_motivo_inativacao, f.indice_avaliacao
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
      _senha, // Ignorado: a senha é gerada automaticamente da data de nascimento
      perfil = 'funcionario',
      matricula,
      nivel_cargo,
      turno,
      escala,
    } = await request.json();

    // Validações básicas
    if (!cpf || !nome || !data_nascimento || !setor || !funcao) {
      return NextResponse.json(
        {
          error:
            'CPF, nome, data de nascimento, setor e função são obrigatórios',
        },
        { status: 400 }
      );
    }

    // Validar CPF
    const cpfLimpo = limparCPF(cpf);
    if (!validarCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }

    // Validar email (opcional, mas se fornecido deve ser válido)
    if (email && !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // VALIDAÇÃO: Gestor não pode ser cadastrado como funcionário da própria entidade
    if (cpfLimpo === session.cpf) {
      return NextResponse.json(
        {
          error:
            'Responsável não pode ser cadastrado como funcionário da própria entidade',
        },
        { status: 409 }
      );
    }

    // MULTI-ENTIDADE: Verificar se CPF já existe na tabela base
    const existingFunc = await queryAsGestorEntidade(
      'SELECT id, cpf FROM funcionarios WHERE cpf = $1',
      [cpfLimpo]
    );

    if (existingFunc.rows.length > 0) {
      // CPF já existe globalmente — verificar se já tem vínculo com ESTA entidade
      const funcionarioId = existingFunc.rows[0].id;
      const vinculoExistente = await queryAsGestorEntidade(
        `SELECT id, ativo FROM funcionarios_entidades 
         WHERE funcionario_id = $1 AND entidade_id = $2`,
        [funcionarioId, entidadeId]
      );

      if (vinculoExistente.rows.length > 0) {
        if (vinculoExistente.rows[0].ativo) {
          return NextResponse.json(
            { error: 'Funcionário já vinculado a esta entidade' },
            { status: 409 }
          );
        }
        // Vínculo inativo — reativar
        await queryAsGestorEntidade(
          `UPDATE funcionarios_entidades 
           SET ativo = true, data_desvinculo = NULL, atualizado_em = NOW()
           WHERE id = $1`,
          [vinculoExistente.rows[0].id]
        );
      } else {
        // Criar novo vínculo com esta entidade (CPF existe em outra entidade)
        await queryAsGestorEntidade(
          `INSERT INTO funcionarios_entidades (
            funcionario_id, entidade_id, ativo
          ) VALUES ($1, $2, true)
          ON CONFLICT (funcionario_id, entidade_id) 
          DO UPDATE SET ativo = true, data_desvinculo = NULL`,
          [funcionarioId, entidadeId]
        );
      }

      console.log(
        `[AUDIT] Funcionário ${cpfLimpo} vinculado à entidade ${entidadeId} por ${session.cpf} (CPF já existia)`
      );

      return NextResponse.json({
        success: true,
        message: 'Funcionário vinculado com sucesso',
        funcionario: {
          cpf: cpfLimpo,
          nome: existingFunc.rows[0].nome || nome,
          entidade_id: entidadeId,
          vinculo_criado: true,
        },
      });
    }

    // Hash da senha baseada na data de nascimento
    // ✅ VALIDAR data de nascimento antes de gerar senha
    let senhaPlaintext: string;
    let senhaHash: string;
    try {
      senhaPlaintext = gerarSenhaDeNascimento(data_nascimento);
      senhaHash = await bcrypt.hash(senhaPlaintext, 10);
    } catch (error) {
      console.error('[FUNCIONÁRIO] Erro ao validar data de nascimento:', error);
      return NextResponse.json(
        {
          error: 'Data de nascimento inválida. Verifique dia e mês.',
          details: error instanceof Error ? error.message : 'Data impossível',
        },
        { status: 400 }
      );
    }

    // ARQUITETURA SEGREGADA: Inserir em 2 etapas
    // 1. Inserir funcionário base (sem FK direta — migration 605 removeu colunas obsoletas)
    const result = await queryAsGestorEntidade(
      `INSERT INTO funcionarios (
        cpf, nome, data_nascimento, setor, funcao, email, senha_hash, perfil,
        matricula, nivel_cargo, turno, escala, ativo, usuario_tipo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, 'funcionario_entidade'::usuario_tipo_enum)
      RETURNING id, cpf, nome, email, setor, funcao, data_nascimento`,
      [
        cpfLimpo,
        nome,
        data_nascimento,
        setor,
        funcao,
        email,
        senhaHash,
        perfil,
        matricula || null,
        nivel_cargo || null,
        turno || null,
        escala || null,
      ]
    );

    // 2. Criar relacionamento em funcionarios_entidades
    const funcionarioId = result.rows[0].id;
    await queryAsGestorEntidade(
      `INSERT INTO funcionarios_entidades (
        funcionario_id, entidade_id, ativo
      ) VALUES ($1, $2, true)
      ON CONFLICT (funcionario_id, entidade_id) 
      DO UPDATE SET ativo = true`,
      [funcionarioId, entidadeId]
    );

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

/**
 * PUT /api/entidade/funcionarios
 * Atualiza dados de um funcionário da entidade
 */
export async function PUT(request: Request) {
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
      matricula,
      nivel_cargo,
      turno,
      escala,
    } = await request.json();

    // Validações básicas
    if (!cpf || !nome || !data_nascimento || !setor || !funcao) {
      return NextResponse.json(
        {
          error:
            'CPF, nome, data de nascimento, setor e função são obrigatórios',
        },
        { status: 400 }
      );
    }

    // Validar CPF
    const cpfLimpo = limparCPF(cpf);
    if (!validarCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }

    // Validar email (opcional, mas se fornecido deve ser válido)
    if (email && !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // Verificar se funcionário existe E pertence à entidade (isolamento por entidade)
    // Buscar também a data_nascimento atual para comparação
    const funcCheck = await queryAsGestorEntidade(
      `SELECT f.cpf, f.data_nascimento as data_nascimento_atual FROM funcionarios f
       INNER JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
       WHERE f.cpf = $1 AND fe.entidade_id = $2 AND fe.ativo = true`,
      [cpfLimpo, entidadeId]
    );

    if (funcCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado ou sem permissão de acesso' },
        { status: 404 }
      );
    }

    // Recalcular senha se a data de nascimento mudou
    // (a senha padrão é gerada a partir da data de nascimento: DDMMYYYY)
    const dataNascimentoAtual = funcCheck.rows[0].data_nascimento_atual as
      | string
      | null;
    const dataNascimentoNova = data_nascimento;
    const dataMudou =
      dataNascimentoAtual &&
      new Date(dataNascimentoAtual).toISOString().split('T')[0] !==
        new Date(dataNascimentoNova).toISOString().split('T')[0];

    let novaSenhaHash: string | null = null;
    if (dataMudou) {
      const novaSenha = gerarSenhaDeNascimento(dataNascimentoNova);
      novaSenhaHash = await bcrypt.hash(novaSenha, 10);
      console.log(
        `[AUDIT] Senha de ${cpfLimpo} recalculada devido à alteração de data de nascimento pela entidade ${entidadeId}`
      );
    }

    // Atualizar funcionário (incluindo senha_hash se data mudou)
    if (novaSenhaHash) {
      await queryAsGestorEntidade(
        `UPDATE funcionarios
         SET nome=$1, data_nascimento=$2, setor=$3, funcao=$4, email=$5,
             matricula=$6, nivel_cargo=$7, turno=$8, escala=$9,
             senha_hash=$11, atualizado_em=NOW()
         WHERE cpf=$10`,
        [
          nome,
          data_nascimento,
          setor,
          funcao,
          email,
          matricula || null,
          nivel_cargo || null,
          turno || null,
          escala || null,
          cpfLimpo,
          novaSenhaHash,
        ]
      );
    } else {
      await queryAsGestorEntidade(
        `UPDATE funcionarios
         SET nome=$1, data_nascimento=$2, setor=$3, funcao=$4, email=$5,
             matricula=$6, nivel_cargo=$7, turno=$8, escala=$9,
             atualizado_em=NOW()
         WHERE cpf=$10`,
        [
          nome,
          data_nascimento,
          setor,
          funcao,
          email,
          matricula || null,
          nivel_cargo || null,
          turno || null,
          escala || null,
          cpfLimpo,
        ]
      );
    }

    console.log(
      `[AUDIT] Funcionário ${cpfLimpo} (${nome}) atualizado pela entidade ${entidadeId} por ${session.cpf}`
    );

    return NextResponse.json({
      success: true,
      message: 'Funcionário atualizado com sucesso',
      funcionario: { cpf: cpfLimpo, nome },
      senha_atualizada: !!novaSenhaHash,
    });
  } catch (error) {
    console.error('Erro ao atualizar funcionário da entidade:', error);

    if (error instanceof Error && error.message.includes('Acesso restrito')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar funcionário' },
      { status: 500 }
    );
  }
}
