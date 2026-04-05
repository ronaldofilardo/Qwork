import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRHWithEmpresaAccess, requireAuth } from '@/lib/session';
import { assertRoles, ROLES, isApiError } from '@/lib/authorization/policies';
import { validarCPF, limparCPF } from '@/lib/cpf-utils';
import bcrypt from 'bcryptjs';
import { gerarSenhaDeNascimento } from '@/lib/auth/password-generator';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Extrair empresa_id da query
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresa_id');
    if (!empresaId) {
      return NextResponse.json(
        { error: 'empresa_id é obrigatório' },
        { status: 400 }
      );
    }

    // Validar acesso do RH à empresa
    const session = await requireRHWithEmpresaAccess(Number(empresaId));
    // Obter clínica do RH da sessão
    const clinicaId = session.clinica_id;
    if (!clinicaId) {
      return NextResponse.json(
        { error: 'Clínica não identificada na sessão do RH' },
        { status: 403 }
      );
    }

    // Buscar funcionários ativos e inativos da empresa e clínica
    // ARQUITETURA SEGREGADA: usa tabela intermediária funcionarios_clinicas
    // Todos os campos de avaliação são filtrados por empresa_id ($1) para evitar
    // que avaliações feitas em outros CNPJs "contaminem" o status desta empresa.
    const funcionariosResult = await query(
      `SELECT f.cpf, f.nome, f.data_nascimento, f.setor, f.funcao, f.email, f.matricula, 
              f.nivel_cargo, f.turno, f.escala, (f.ativo AND fc.ativo) as ativo, f.criado_em, f.atualizado_em,
              fc.indice_avaliacao, fc.data_ultimo_lote,
              -- Última avaliação DESTA empresa (não global)
              (
                SELECT a_ua.id FROM avaliacoes a_ua
                JOIN lotes_avaliacao la_ua ON la_ua.id = a_ua.lote_id
                WHERE a_ua.funcionario_cpf = f.cpf AND la_ua.empresa_id = $1
                  AND a_ua.status IN ('concluida', 'inativada')
                ORDER BY COALESCE(a_ua.envio, a_ua.inativada_em, a_ua.criado_em) DESC NULLS LAST
                LIMIT 1
              ) as ultima_avaliacao_id,
              (
                SELECT CASE WHEN a_ua.status = 'concluida' THEN a_ua.envio ELSE NULL END
                FROM avaliacoes a_ua
                JOIN lotes_avaliacao la_ua ON la_ua.id = a_ua.lote_id
                WHERE a_ua.funcionario_cpf = f.cpf AND la_ua.empresa_id = $1
                  AND a_ua.status IN ('concluida', 'inativada')
                ORDER BY COALESCE(a_ua.envio, a_ua.inativada_em, a_ua.criado_em) DESC NULLS LAST
                LIMIT 1
              ) as ultima_avaliacao_data_conclusao,
              (
                SELECT a_ua.status FROM avaliacoes a_ua
                JOIN lotes_avaliacao la_ua ON la_ua.id = a_ua.lote_id
                WHERE a_ua.funcionario_cpf = f.cpf AND la_ua.empresa_id = $1
                  AND a_ua.status IN ('concluida', 'inativada')
                ORDER BY COALESCE(a_ua.envio, a_ua.inativada_em, a_ua.criado_em) DESC NULLS LAST
                LIMIT 1
              ) as ultima_avaliacao_status,
              (
                SELECT a_ua.motivo_inativacao FROM avaliacoes a_ua
                JOIN lotes_avaliacao la_ua ON la_ua.id = a_ua.lote_id
                WHERE a_ua.funcionario_cpf = f.cpf AND la_ua.empresa_id = $1
                  AND a_ua.status = 'inativada'
                ORDER BY a_ua.inativada_em DESC NULLS LAST
                LIMIT 1
              ) as ultimo_motivo_inativacao,
              fc.ativo as vinculo_ativo, fc.data_desvinculo,
              -- Data e lote da última inativação DESTA empresa
              (
                SELECT MAX(a2.inativada_em) FROM avaliacoes a2
                JOIN lotes_avaliacao la2 ON la2.id = a2.lote_id
                WHERE a2.funcionario_cpf = f.cpf AND a2.status = 'inativada' AND la2.empresa_id = $1
              ) as ultima_inativacao_em,
              (
                SELECT l.id FROM avaliacoes a2 JOIN lotes_avaliacao l ON a2.lote_id = l.id
                WHERE a2.funcionario_cpf = f.cpf AND a2.status = 'inativada'
                  AND a2.inativada_em IS NOT NULL AND l.empresa_id = $1
                ORDER BY a2.inativada_em DESC LIMIT 1
              ) as ultima_inativacao_lote,
              -- Número do último lote DESTA empresa em que concluiu ou foi inativado
              (
                SELECT l.id FROM avaliacoes a3
                JOIN lotes_avaliacao l ON a3.lote_id = l.id
                WHERE a3.funcionario_cpf = f.cpf
                  AND a3.status IN ('concluida', 'inativada')
                  AND l.empresa_id = $1
                ORDER BY COALESCE(a3.envio, a3.inativada_em, a3.criado_em) DESC NULLS LAST
                LIMIT 1
              ) as ultimo_lote_numero,
              -- Avaliação ativa (iniciada/em_andamento) mais recente DESTA empresa
              (
                SELECT l_at.id FROM avaliacoes a_at
                JOIN lotes_avaliacao l_at ON a_at.lote_id = l_at.id
                WHERE a_at.funcionario_cpf = f.cpf
                  AND l_at.empresa_id = $1
                  AND a_at.status IN ('iniciada', 'em_andamento')
                ORDER BY a_at.criado_em DESC NULLS LAST
                LIMIT 1
              ) as lote_ativo_numero,
              -- Status da avaliação ativa mais recente DESTA empresa
              (
                SELECT a_at.status FROM avaliacoes a_at
                JOIN lotes_avaliacao l_at ON a_at.lote_id = l_at.id
                WHERE a_at.funcionario_cpf = f.cpf
                  AND l_at.empresa_id = $1
                  AND a_at.status IN ('iniciada', 'em_andamento')
                ORDER BY a_at.criado_em DESC NULLS LAST
                LIMIT 1
              ) as avaliacao_ativa_status,
              -- Avaliação válida (<12 meses) baseada em dados empresa-scoped
              CASE 
                WHEN fc.data_ultimo_lote IS NOT NULL AND fc.data_ultimo_lote >= NOW() - INTERVAL '1 year' 
                  THEN true 
                ELSE false 
              END as tem_avaliacao_recente
       FROM funcionarios f
       INNER JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
       WHERE fc.empresa_id = $1 AND fc.clinica_id = $2
       ORDER BY f.nome`,
      [empresaId, clinicaId],
      session
    );

    // Buscar avaliações de todos os funcionários FILTRANDO por empresa (SEGREGAÇÃO)
    // Sem este filtro, RH da Empresa A veria avaliações de João feitas na Empresa B
    const funcionariosCpfs = funcionariosResult.rows.map((f) => f.cpf);
    type AvaliacaoFuncionario = {
      id: number;
      inicio: string;
      envio: string | null;
      status: string;
      lote_id?: number;
    };
    const avaliacoesMap: Record<string, AvaliacaoFuncionario[]> = {};
    if (funcionariosCpfs.length > 0) {
      const avaliacoesResult = await query(
        `SELECT a.id, a.funcionario_cpf, a.inicio, a.envio, a.status, a.lote_id
         FROM avaliacoes a
         INNER JOIN lotes_avaliacao la ON la.id = a.lote_id
         WHERE a.funcionario_cpf = ANY($1) AND la.empresa_id = $2`,
        [funcionariosCpfs, empresaId],
        session
      );
      // Agrupar avaliações por cpf (convertendo para string)
      avaliacoesResult.rows.forEach((av) => {
        const cpfStr = String(av.funcionario_cpf).trim();
        if (!avaliacoesMap[cpfStr]) avaliacoesMap[cpfStr] = [];
        avaliacoesMap[cpfStr].push({
          id: av.id,
          inicio: av.inicio,
          envio: av.envio,
          status: av.status,
          lote_id: av.lote_id,
        });
      });
    }

    // Montar resposta incluindo avaliações
    const funcionarios = funcionariosResult.rows.map((f) => ({
      ...f,
      avaliacoes: avaliacoesMap[String(f.cpf).trim()] || [],
    }));

    return NextResponse.json({ funcionarios });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error('Erro ao listar funcionários:', error);
    return NextResponse.json(
      { error: 'Erro ao listar funcionários' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const {
      cpf,
      nome,
      data_nascimento,
      setor,
      funcao,
      email,
      _senha, // Ignorado: a senha é gerada automaticamente da data de nascimento
      perfil = 'funcionario',
      empresa_id,
      matricula,
      nivel_cargo,
      turno,
      escala,
    } = await request.json();

    // Validações básicas
    if (!cpf || !nome || !data_nascimento || !setor || !funcao || !empresa_id) {
      return NextResponse.json(
        {
          error:
            'CPF, nome, data de nascimento, setor, função e empresa_id são obrigatórios',
        },
        { status: 400 }
      );
    }

    // Validar CPF completo (com dígitos verificadores)
    const cpfLimpo = limparCPF(cpf);
    if (!validarCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }

    // Validar email (opcional, mas se fornecido deve ser válido)
    if (email && !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // Validar acesso do RH à empresa
    const session = await requireRHWithEmpresaAccess(empresa_id);

    // Obter clínica do RH da sessão
    const clinicaId = session.clinica_id;
    if (!clinicaId) {
      return NextResponse.json(
        { error: 'Clínica não identificada na sessão do RH' },
        { status: 403 }
      );
    }

    // MULTI-EMPRESA: Verificar se CPF já existe na tabela base
    const existingFunc = await query(
      'SELECT id, cpf FROM funcionarios WHERE cpf = $1',
      [cpf],
      session
    );

    if (existingFunc.rows.length > 0) {
      // CPF já existe globalmente — verificar se já tem vínculo com ESTA empresa
      const funcionarioId = existingFunc.rows[0].id;
      const vinculoExistente = await query(
        `SELECT id, ativo FROM funcionarios_clinicas 
         WHERE funcionario_id = $1 AND empresa_id = $2`,
        [funcionarioId, empresa_id],
        session
      );

      if (vinculoExistente.rows.length > 0) {
        if (vinculoExistente.rows[0].ativo) {
          return NextResponse.json(
            { error: 'Funcionário já vinculado a esta empresa' },
            { status: 409 }
          );
        }
        // Vínculo inativo — reativar
        await query(
          `UPDATE funcionarios_clinicas 
           SET ativo = true, data_desvinculo = NULL, atualizado_em = NOW()
           WHERE id = $1`,
          [vinculoExistente.rows[0].id],
          session
        );
      } else {
        // Criar novo vínculo com esta empresa (CPF existe em outra empresa)
        await query(
          `INSERT INTO funcionarios_clinicas (
            funcionario_id, clinica_id, empresa_id, ativo
          ) VALUES ($1, $2, $3, true)`,
          [funcionarioId, clinicaId, empresa_id],
          session
        );
      }

      console.log(
        `[AUDIT] Funcionário ${cpf} vinculado à empresa ${empresa_id} da clínica ${clinicaId} por ${session.cpf} (CPF já existia)`
      );

      return NextResponse.json({
        success: true,
        message: 'Funcionário vinculado com sucesso',
        funcionario: {
          cpf,
          nome: existingFunc.rows[0].nome || nome,
          empresa_id,
          clinica_id: clinicaId,
          vinculo_criado: true,
        },
      });
    }

    // Hash da senha baseada na data de nascimento
    const senhaPlaintext = gerarSenhaDeNascimento(data_nascimento);
    const senhaHash = await bcrypt.hash(senhaPlaintext, 10);

    // ARQUITETURA SEGREGADA: Inserir em 2 etapas
    // 1. Inserir funcionário com clinica_id (para satisfazer constraint)
    const insertFuncResult = await query(
      `INSERT INTO funcionarios (
        cpf, nome, data_nascimento, setor, funcao, email, senha_hash, perfil,
        matricula, nivel_cargo, turno, escala, ativo, clinica_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13)
      RETURNING id`,
      [
        cpf,
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
        session.clinica_id,
      ],
      session
    );

    const funcionarioId = insertFuncResult.rows[0].id;

    // 2. Criar relacionamento em funcionarios_clinicas
    await query(
      `INSERT INTO funcionarios_clinicas (
        funcionario_id, clinica_id, empresa_id, ativo
      ) VALUES ($1, $2, $3, true)`,
      [funcionarioId, clinicaId, empresa_id],
      session
    );

    console.log(
      `[AUDIT] Funcionário ${cpf} (${nome}) criado pela clínica ${clinicaId} para empresa ${empresa_id} por ${session.cpf}`
    );

    return NextResponse.json({
      success: true,
      message: 'Funcionário criado com sucesso',
      funcionario: {
        cpf,
        nome,
        setor,
        funcao,
        email,
        empresa_id,
        clinica_id: clinicaId,
      },
    });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error('Erro ao criar funcionário:', error);

    if (error instanceof Error && error.message.includes('permissão')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireAuth();
    assertRoles(session, [ROLES.RH]);

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

    // Validar CPF completo (com dígitos verificadores)
    const cpfLimpo = limparCPF(cpf);
    if (!validarCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }

    // Validar email (opcional, mas se fornecido deve ser válido)
    if (email && !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // Verificar se o RH tem clinica_id na sessão
    const clinicaId = session.clinica_id;
    if (!clinicaId) {
      return NextResponse.json(
        { error: 'Clínica não identificada na sessão do RH' },
        { status: 403 }
      );
    }

    // Verificar se funcionário existe E pertence à clínica do RH (isolamento por clínica)
    // Buscar também a data_nascimento atual para comparação
    const funcResult = await query(
      `SELECT f.cpf, f.data_nascimento as data_nascimento_atual FROM funcionarios f
       INNER JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
       WHERE f.cpf = $1 AND fc.clinica_id = $2 AND fc.ativo = true`,
      [cpfLimpo, clinicaId],
      session
    );
    if (funcResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado ou sem permissão de acesso' },
        { status: 404 }
      );
    }

    // Recalcular senha se a data de nascimento mudou
    // (a senha padrão é gerada a partir da data de nascimento: DDMMYYYY)
    const dataNascimentoAtual = funcResult.rows[0].data_nascimento_atual as
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
        `[AUDIT] Senha de ${cpfLimpo} recalculada devido à alteração de data de nascimento pela clínica ${clinicaId}`
      );
    }

    // Atualizar funcionário (incluindo senha_hash se data mudou)
    if (novaSenhaHash) {
      await query(
        `UPDATE funcionarios SET nome=$1, data_nascimento=$2, setor=$3, funcao=$4, email=$5, matricula=$6, nivel_cargo=$7, turno=$8, escala=$9, senha_hash=$11 WHERE cpf=$10`,
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
        ],
        session
      );
    } else {
      await query(
        `UPDATE funcionarios SET nome=$1, data_nascimento=$2, setor=$3, funcao=$4, email=$5, matricula=$6, nivel_cargo=$7, turno=$8, escala=$9 WHERE cpf=$10`,
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
        ],
        session
      );
    }

    console.log(
      `[AUDIT] Funcionário ${cpfLimpo} (${nome}) atualizado pela clínica ${clinicaId} por ${session.cpf}`
    );

    return NextResponse.json({
      success: true,
      message: 'Funcionário atualizado com sucesso',
      funcionario: { cpf: cpfLimpo, nome },
      senha_atualizada: !!novaSenhaHash,
    });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error('Erro ao atualizar funcionário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
