import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRHWithEmpresaAccess, requireAuth } from '@/lib/session';
import { validarCPF, limparCPF } from '@/lib/cpf-utils';
import bcrypt from 'bcryptjs';

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
    // ISOLAMENTO: Apenas funcionários vinculados à empresa/clínica (sem contratante_id)
    const funcionariosResult = await query(
      `SELECT cpf, nome, data_nascimento, setor, funcao, email, matricula, nivel_cargo, turno, escala, ativo, criado_em, atualizado_em,
              indice_avaliacao, data_ultimo_lote,
              ultima_avaliacao_id, ultimo_lote_codigo, ultima_avaliacao_data_conclusao, ultima_avaliacao_status, ultimo_motivo_inativacao,
              -- Data e lote da última inativação
              (
                SELECT MAX(a2.inativada_em) FROM avaliacoes a2 WHERE a2.funcionario_cpf = f.cpf AND a2.status = 'inativada'
              ) as ultima_inativacao_em,
              (
                SELECT l.codigo FROM avaliacoes a2 JOIN lotes_avaliacao l ON a2.lote_id = l.id WHERE a2.funcionario_cpf = f.cpf AND a2.status = 'inativada' AND a2.inativada_em IS NOT NULL ORDER BY a2.inativada_em DESC LIMIT 1
              ) as ultima_inativacao_lote,
              -- Verificar se tem avaliação concluída há menos de 12 meses (mesmo critério da função de elegibilidade)
              CASE 
                WHEN COALESCE(data_ultimo_lote, ultima_avaliacao_data_conclusao) IS NOT NULL AND COALESCE(data_ultimo_lote, ultima_avaliacao_data_conclusao) >= NOW() - INTERVAL '1 year' 
                  THEN true 
                ELSE false 
              END as tem_avaliacao_recente
       FROM funcionarios f
       WHERE f.empresa_id = $1 AND f.clinica_id = $2 AND f.contratante_id IS NULL
       ORDER BY f.nome`,
      [empresaId, clinicaId]
    );

    // Buscar avaliações de todos os funcionários da empresa/lote
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
        `SELECT id, funcionario_cpf, inicio, envio, status, lote_id
         FROM avaliacoes
         WHERE funcionario_cpf = ANY($1)`,
        [funcionariosCpfs]
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
      senha,
      perfil = 'funcionario',
      empresa_id,
      matricula,
      nivel_cargo,
      turno,
      escala,
    } = await request.json();

    // Validações básicas
    if (
      !cpf ||
      !nome ||
      !data_nascimento ||
      !setor ||
      !funcao ||
      !email ||
      !empresa_id
    ) {
      return NextResponse.json(
        {
          error:
            'CPF, nome, data de nascimento, setor, função, email e empresa_id são obrigatórios',
        },
        { status: 400 }
      );
    }

    // Validar CPF completo (com dígitos verificadores)
    const cpfLimpo = limparCPF(cpf);
    if (!validarCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }

    // Validar email básico
    if (!email.includes('@')) {
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

    // Verificar se funcionário já existe
    const existingFunc = await query(
      'SELECT cpf FROM funcionarios WHERE cpf = $1',
      [cpf]
    );

    if (existingFunc.rows.length > 0) {
      return NextResponse.json(
        {
          error: 'Funcionário com este CPF já existe',
        },
        { status: 409 }
      );
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha || '123456', 10);

    // Inserir funcionário vinculado à clínica/empresa (sem contratante_id)
    // ISOLAMENTO: funcionários de clínica pertencem a empresa_id + clinica_id, não a contratante
    await query(
      `INSERT INTO funcionarios (
        cpf, nome, data_nascimento, setor, funcao, email, senha_hash, perfil,
        clinica_id, empresa_id, contratante_id, matricula, nivel_cargo, turno, escala, ativo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, $11, $12, $13, $14, true)`,
      [
        cpf,
        nome,
        data_nascimento,
        setor,
        funcao,
        email,
        senhaHash,
        perfil,
        clinicaId,
        empresa_id,
        matricula || null,
        nivel_cargo || null,
        turno || null,
        escala || null,
      ]
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
    if (!cpf || !nome || !data_nascimento || !setor || !funcao || !email) {
      return NextResponse.json(
        {
          error:
            'CPF, nome, data de nascimento, setor, função e email são obrigatórios',
        },
        { status: 400 }
      );
    }

    // Validar CPF completo (com dígitos verificadores)
    const cpfLimpo = limparCPF(cpf);
    if (!validarCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }

    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // Registrar usuário atual no contexto da transação para triggers/auditoria
    await query(`SET LOCAL app.current_user_cpf = '${session.cpf}'`);
    await query(`SET LOCAL app.current_user_perfil = '${session.perfil}'`);

    // Verificar se o RH tem clinica_id na sessão
    const clinicaId = session.clinica_id;
    if (!clinicaId) {
      return NextResponse.json(
        { error: 'Clínica não identificada na sessão do RH' },
        { status: 403 }
      );
    }

    // Somente perfis RH podem editar
    if (session.perfil !== 'rh') {
      return NextResponse.json(
        { error: 'Apenas gestores RH podem editar funcionários' },
        { status: 403 }
      );
    }

    // Verificar se funcionário existe
    const funcResult = await query(
      'SELECT cpf, empresa_id FROM funcionarios WHERE cpf = $1',
      [cpf]
    );
    if (funcResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar funcionário
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
        cpf,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Funcionário atualizado com sucesso',
      funcionario: { cpf, nome },
    });
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
