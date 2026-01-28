import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = getSession();
    if (!session || session.perfil !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Para admin, buscar informações do funcionário admin
    const adminQuery = `
      SELECT
        f.cpf,
        f.nome,
        f.email,
        f.criado_em,
        f.clinica_id
      FROM funcionarios f
      WHERE f.cpf = $1
    `;

    const adminResult = await query(adminQuery, [session.cpf]);

    if (adminResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado' },
        { status: 404 }
      );
    }

    const admin = adminResult.rows[0];

    // Buscar informações da clínica do admin
    const clinicaQuery = `
      SELECT
        c.id,
        c.nome,
        c.cnpj,
        c.email,
        c.telefone,
        c.endereco,
        c.cidade,
        c.estado,
        c.cep,
        c.ativa,
        c.criado_em
      FROM clinicas c
      WHERE c.id = $1
    `;

    const clinicaResult = await query(clinicaQuery, [admin.clinica_id]);

    if (clinicaResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Clínica não encontrada' },
        { status: 404 }
      );
    }

    const clinica = clinicaResult.rows[0];

    // Buscar contrato ativo do plano da clínica
    const contratoQuery = `
      SELECT
        cp.id,
        cp.numero_contrato,
        cp.valor_total,
        cp.numero_funcionarios_contratados,
        cp.vigencia_inicio,
        cp.vigencia_fim,
        cp.status,
        cp.created_at,
        p.nome as plano_nome,
        p.tipo as plano_tipo
      FROM contratos_planos cp
      JOIN planos p ON cp.plano_id = p.id
      WHERE cp.clinica_id = $1 AND cp.status = 'ativo'
      ORDER BY cp.created_at DESC
      LIMIT 1
    `;

    const contratoResult = await query(contratoQuery, [clinica.id]);
    const contrato = contratoResult.rows[0] || null;

    // Buscar pagamentos relacionados ao contrato
    let pagamentos = [];
    if (contrato) {
      const pagamentosQuery = `
        SELECT
          p.id,
          p.valor,
          p.status,
          p.data_solicitacao,
          p.numero_parcelas,
          p.detalhes_parcelas
        FROM pagamentos p
        WHERE p.contratante_id = $1
        ORDER BY p.data_solicitacao DESC
        LIMIT 10
      `;

      const pagamentosResult = await query(pagamentosQuery, [contrato.id]);
      pagamentos = pagamentosResult.rows;
    }

    // Buscar estatísticas gerais do sistema
    const statsQuery = `
      SELECT
        COUNT(DISTINCT c.id) as total_clinicas,
        COUNT(DISTINCT e.id) as total_entidades,
        COUNT(DISTINCT p.id) as total_planos_ativos,
        COUNT(DISTINCT co.id) as total_contratos_ativos
      FROM clinicas c
      CROSS JOIN empresas_clientes e
      LEFT JOIN planos p ON p.ativo = true
      LEFT JOIN contratos_planos co ON co.status = 'ativo'
      WHERE c.ativa = true AND e.ativa = true
    `;

    const statsResult = await query(statsQuery);
    const stats = statsResult.rows[0];

    const accountInfo = {
      // Informações cadastradas do admin
      nome: admin.nome,
      email: admin.email,
      perfil: session.perfil,

      // Dados da Empresa (Clínica)
      empresa: {
        nome: clinica.nome,
        cnpj: clinica.cnpj,
        email: clinica.email,
        telefone: clinica.telefone,
        endereco: clinica.endereco,
        cidade: clinica.cidade,
        estado: clinica.estado,
        cep: clinica.cep,
        ativa: clinica.ativa,
        criado_em: clinica.criado_em,
      },

      // Plano Cadastrado
      plano: contrato
        ? {
            numero_contrato: contrato.numero_contrato,
            plano_nome: contrato.plano_nome,
            plano_tipo: contrato.plano_tipo,
            valor_total: parseFloat(contrato.valor_total),
            qtd_funcionarios_contratada:
              contrato.numero_funcionarios_contratados,
            vigencia_inicio: contrato.vigencia_inicio,
            vigencia_fim: contrato.vigencia_fim,
            status: contrato.status,
            criado_em: contrato.created_at,
          }
        : null,

      // Pagamentos (parcelas)
      pagamentos: pagamentos.map((pagamento) => ({
        id: pagamento.id,
        valor: parseFloat(pagamento.valor),
        status: pagamento.status,
        data_solicitacao: pagamento.data_solicitacao,
        numero_parcelas: pagamento.numero_parcelas,
        detalhes_parcelas: pagamento.detalhes_parcelas,
      })),

      // Estatísticas do sistema
      estatisticas: {
        total_clinicas: parseInt(stats.total_clinicas),
        total_entidades: parseInt(stats.total_entidades),
        total_planos_ativos: parseInt(stats.total_planos_ativos),
        total_contratos_ativos: parseInt(stats.total_contratos_ativos),
      },
    };

    return NextResponse.json(accountInfo);
  } catch (error) {
    console.error('Erro ao buscar informações da conta admin:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
