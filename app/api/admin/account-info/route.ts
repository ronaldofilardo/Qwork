import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { assertRoles, ROLES } from '@/lib/authorization/policies';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = getSession();
    assertRoles(session, [ROLES.ADMIN]);

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

    // Buscar contrato ativo da clínica
    const contratoQuery = `
      SELECT
        c.id,
        c.numero_contrato,
        c.valor_total,
        c.numero_funcionarios,
        c.aceito,
        c.data_aceite,
        c.tipo_tomador
      FROM contratos c
      WHERE c.clinica_id = $1 AND c.aceito = true
      ORDER BY c.data_aceite DESC
      LIMIT 1
    `;

    const contratoResult = await query(contratoQuery, [clinica.id]);
    const contrato = contratoResult.rows[0] || null;

    // Buscar pagamentos relacionados ao tomador
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
        WHERE p.clinica_id = $1
        ORDER BY p.data_solicitacao DESC
        LIMIT 10
      `;

      const pagamentosResult = await query(pagamentosQuery, [clinica.id]);
      pagamentos = pagamentosResult.rows;
    }

    // Buscar estatísticas gerais do sistema
    const statsQuery = `
      SELECT
        COUNT(DISTINCT c.id) as total_clinicas,
        COUNT(DISTINCT e.id) as total_entidades
      FROM clinicas c
      CROSS JOIN empresas_clientes e
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

      // Contrato ativo
      contrato: contrato
        ? {
            numero_contrato: contrato.numero_contrato || String(contrato.id),
            valor_total: parseFloat(contrato.valor_total || '0'),
            qtd_funcionarios_contratada: contrato.numero_funcionarios,
            vigencia_inicio: contrato.data_aceite,
            vigencia_fim: null,
            status: contrato.aceito ? 'ativo' : 'pendente',
            criado_em: contrato.data_aceite,
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
