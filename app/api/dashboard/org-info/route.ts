/**
 * GET /api/dashboard/org-info
 * Retorna informações da organização (nome + logo) para exibir no dashboard do funcionário.
 * Auth: perfil funcionario (consulta clinica_id ou entidade_id da sessão)
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface OrgInfoResponse {
  nome: string;
  logo_url: string | null;
  tipo: 'clinica' | 'entidade';
}

export async function GET(): Promise<NextResponse> {
  try {
    const session = getSession();

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (session.perfil !== 'funcionario') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Funcionários da tabela `funcionarios` não têm clinica_id/entidade_id
    // diretamente — vínculo é por join tables. Usar session.cpf.
    const cpf = session.cpf?.trim();

    console.log(
      '[org-info] Buscando org para CPF:',
      cpf?.replace(/\d(?=\d{4})/g, '*')
    );

    // 1. Tentar via clínica/empresa (funcionarios_clinicas) — prioridade sobre entidade
    // pois um funcionário pode estar vinculado a ambos (entidade-mãe + clínica filha),
    // e a clínica/empresa é a organização direta onde trabalha.
    // URL slug = nome da empresa (quando há empresa_id), senão nome da clínica
    // Logo = sempre da clínica
    const clinResult = await query(
      `SELECT
         CASE WHEN ec.nome IS NOT NULL THEN ec.nome ELSE c.nome END AS nome,
         cc.logo_url
       FROM funcionarios f
       JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id AND fc.ativo = true
       JOIN clinicas c ON c.id = fc.clinica_id
       LEFT JOIN clinica_configuracoes cc ON cc.clinica_id = c.id
       LEFT JOIN empresas_clientes ec ON ec.id = fc.empresa_id
       WHERE TRIM(f.cpf) = $1
       LIMIT 1`,
      [cpf]
    );

    console.log(
      '[org-info] Clinica rows:',
      clinResult.rows.length,
      clinResult.rows[0]?.nome ?? ''
    );

    if (clinResult.rows.length > 0) {
      const row = clinResult.rows[0];
      console.log(
        '[org-info] Retornando clinica:',
        row.nome,
        '| logo:',
        !!row.logo_url
      );
      return NextResponse.json({
        nome: row.nome,
        logo_url: row.logo_url || null,
        tipo: 'clinica',
      } satisfies OrgInfoResponse);
    }

    // 2. Tentar via entidade (funcionarios_entidades) — fallback para workers sem clínica
    const entResult = await query(
      `SELECT e.nome, ec.logo_url
       FROM funcionarios f
       JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id AND fe.ativo = true
       JOIN entidades e ON e.id = fe.entidade_id
       LEFT JOIN entidade_configuracoes ec ON ec.entidade_id = e.id
       WHERE TRIM(f.cpf) = $1
       LIMIT 1`,
      [cpf]
    );

    console.log('[org-info] Entidade rows:', entResult.rows.length);

    if (entResult.rows.length > 0) {
      const row = entResult.rows[0];
      console.log(
        '[org-info] Retornando entidade:',
        row.nome,
        '| logo:',
        !!row.logo_url
      );
      return NextResponse.json({
        nome: row.nome,
        logo_url: row.logo_url || null,
        tipo: 'entidade',
      } satisfies OrgInfoResponse);
    }

    // 3. Fallback: session.entidade_id / session.clinica_id (usuários na tabela `usuarios`)
    if (session.entidade_id) {
      const result = await query(
        `SELECT e.nome, ec.logo_url
         FROM entidades e
         LEFT JOIN entidade_configuracoes ec ON ec.entidade_id = e.id
         WHERE e.id = $1 LIMIT 1`,
        [session.entidade_id]
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return NextResponse.json({
          nome: row.nome,
          logo_url: row.logo_url || null,
          tipo: 'entidade',
        } satisfies OrgInfoResponse);
      }
    }

    if (session.clinica_id) {
      const result = await query(
        `SELECT c.nome, cc.logo_url
         FROM clinicas c
         LEFT JOIN clinica_configuracoes cc ON cc.clinica_id = c.id
         WHERE c.id = $1 LIMIT 1`,
        [session.clinica_id]
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return NextResponse.json({
          nome: row.nome,
          logo_url: row.logo_url || null,
          tipo: 'clinica',
        } satisfies OrgInfoResponse);
      }
    }

    // Se funcionário não tem vínculo com org: retornar sem erro
    return NextResponse.json({
      nome: 'QWork',
      logo_url: null,
      tipo: 'clinica',
    } satisfies OrgInfoResponse);
  } catch (erro: unknown) {
    console.error('[API dashboard/org-info] Erro:', erro);
    return NextResponse.json(
      { error: 'Erro ao buscar informações da organização' },
      { status: 500 }
    );
  }
}
