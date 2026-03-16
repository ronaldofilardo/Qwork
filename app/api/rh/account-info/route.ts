import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = async () => {
  try {
    const session = await requireRole(['rh']);

    // Determinar clinica_id ou entidade_id: preferir sessão, senão buscar pelo CPF
    let clinicaId = session.clinica_id;
    let entidadeId = session.entidade_id;

    if (!clinicaId && !entidadeId) {
      // Buscar vínculo nas tabelas de relacionamento
      const vinculoClinicaRes = await query(
        `SELECT fc.clinica_id 
         FROM funcionarios f
         INNER JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
         WHERE f.cpf = $1 AND f.ativo = true AND fc.ativo = true
         LIMIT 1`,
        [session.cpf]
      );

      if (vinculoClinicaRes.rows.length > 0) {
        clinicaId = vinculoClinicaRes.rows[0].clinica_id;
      } else {
        // Tentar buscar vínculo com entidade
        const vinculoEntidadeRes = await query(
          `SELECT fe.entidade_id 
           FROM funcionarios f
           INNER JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
           WHERE f.cpf = $1 AND f.ativo = true AND fe.ativo = true
           LIMIT 1`,
          [session.cpf]
        );

        if (vinculoEntidadeRes.rows.length > 0) {
          entidadeId = vinculoEntidadeRes.rows[0].entidade_id;
        }
      }
    }

    if (!clinicaId && !entidadeId) {
      return NextResponse.json(
        { error: 'Você não está vinculado a uma clínica ou entidade' },
        { status: 403 }
      );
    }

    // Buscar informações da clínica ou entidade
    let organizacao = null;

    if (clinicaId) {
      // Buscar na tabela clinicas
      const clinicaQuery = await query(
        `SELECT
          id,
          nome,
          cnpj,
          email,
          telefone,
          endereco,
          ativa,
          criado_em,
          EXISTS(
            SELECT 1 FROM contratos c
            WHERE c.tomador_id = clinicas.id AND c.aceito = true
          ) AS tem_contrato_aceito
        FROM clinicas
        WHERE id = $1`,
        [clinicaId]
      );

      if (clinicaQuery.rows.length > 0) {
        organizacao = clinicaQuery.rows[0];
      }
    }

    if (!organizacao && entidadeId) {
      // Buscar na tabela entidades
      const entidadeQuery = await query(
        `SELECT 
          id, 
          nome, 
          cnpj, 
          email, 
          telefone, 
          endereco, 
          cidade, 
          estado, 
          responsavel_nome, 
          criado_em, 
          status,
          EXISTS(
            SELECT 1 FROM contratos c
            WHERE c.tomador_id = entidades.id AND c.aceito = true
          ) AS tem_contrato_aceito
        FROM entidades 
        WHERE id = $1`,
        [entidadeId]
      );

      if (entidadeQuery.rows.length > 0) {
        organizacao = entidadeQuery.rows[0];
      }
    }

    // Se ainda não encontrou, retornar erro
    if (!organizacao) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      );
    }

    // Buscar gestores RH da clínica/entidade
    // Buscar representante vinculado à clínica ou entidade
    let representante = null;
    if (clinicaId) {
      const repQuery = await query(
        `SELECT r.nome, r.email, r.telefone
         FROM vinculos_comissao vc
         JOIN representantes r ON r.id = vc.representante_id
         WHERE vc.clinica_id = $1
         ORDER BY vc.criado_em DESC
         LIMIT 1`,
        [clinicaId]
      );
      if (repQuery.rows.length > 0) {
        representante = repQuery.rows[0];
      }
    } else if (entidadeId) {
      const repQuery = await query(
        `SELECT r.nome, r.email, r.telefone
         FROM vinculos_comissao vc
         JOIN representantes r ON r.id = vc.representante_id
         WHERE vc.entidade_id = $1
         ORDER BY vc.criado_em DESC
         LIMIT 1`,
        [entidadeId]
      );
      if (repQuery.rows.length > 0) {
        representante = repQuery.rows[0];
      }
    }

    let gestoresQuery;

    if (clinicaId) {
      // Buscar gestores RH da clínica
      gestoresQuery = await query(
        `SELECT DISTINCT
          f.id,
          f.cpf,
          f.nome,
          f.email,
          f.perfil
        FROM funcionarios f
        LEFT JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
        WHERE f.ativo = true 
          AND f.perfil = 'rh'
          AND (
            (fc.clinica_id = $1 AND fc.ativo = true)
            OR f.cpf = $2
          )
        ORDER BY f.nome`,
        [clinicaId, session.cpf]
      );
    } else if (entidadeId) {
      // Buscar gestores RH da entidade
      gestoresQuery = await query(
        `SELECT DISTINCT
          f.id,
          f.cpf,
          f.nome,
          f.email,
          f.perfil
        FROM funcionarios f
        LEFT JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
        WHERE f.ativo = true 
          AND f.perfil = 'rh'
          AND (
            (fe.entidade_id = $1 AND fe.ativo = true)
            OR f.cpf = $2
          )
        ORDER BY f.nome`,
        [entidadeId, session.cpf]
      );
    } else {
      gestoresQuery = { rows: [] };
    }

    return NextResponse.json({
      clinica: {
        id: organizacao.id,
        nome: organizacao.nome,
        cnpj: organizacao.cnpj,
        email: organizacao.email,
        telefone: organizacao.telefone,
        endereco: organizacao.endereco,
        cidade: organizacao.cidade || null,
        estado: organizacao.estado || null,
        responsavel_nome: organizacao.responsavel_nome || null,
        criado_em: organizacao.criado_em || null,
        status: organizacao.status || organizacao.ativa || null,
        tem_contrato_aceito: organizacao.tem_contrato_aceito ?? false,
        representante: representante
          ? {
              nome: representante.nome,
              email: representante.email,
              telefone: representante.telefone,
            }
          : null,
      },
      gestores: gestoresQuery.rows.map((gestor) => ({
        id: gestor.id,
        cpf: gestor.cpf,
        nome: gestor.nome,
        email: gestor.email,
        perfil: gestor.perfil,
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar informações da conta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
};
