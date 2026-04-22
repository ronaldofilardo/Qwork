/**
 * POST /api/cadastro/verificar-representante
 * Verificação de representante durante o onboarding de clínica/entidade.
 * Determina qual representante receberá comissão pela indicação.
 *
 * Prioridade:
 * 1. token de link (token válido não expirado)
 * 2. id do representante (representante_id numérico + CNPJ na lista de leads ativos do rep)
 * 3. Verificação por CNPJ (CNPJ na lista de leads ativos de qualquer rep)
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cnpj, token, representante_id } = body;

    if (!cnpj || !/^\d{14}$/.test(cnpj)) {
      return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });
    }

    // === PRIORIDADE 1: Token de link ===
    if (token?.trim()) {
      const tokenResult = await query(
        `SELECT
           l.id            AS lead_id,
           l.representante_id,
           r.nome          AS representante_nome,
           l.status        AS lead_status,
           l.data_expiracao,
           l.token_expiracao
         FROM leads_representante l
         JOIN representantes r ON r.id = l.representante_id
         WHERE l.token_atual = $1
           AND l.status = 'pendente'
           AND l.data_expiracao > NOW()
           AND l.token_expiracao > NOW()
         LIMIT 1`,
        [token.trim()]
      );

      if (tokenResult.rows.length > 0) {
        const row = tokenResult.rows[0];
        // Verificar se o CNPJ bate com o lead (segurança)
        const leadCnpjCheck = await query(
          `SELECT cnpj FROM leads_representante WHERE id = $1`,
          [row.lead_id]
        );
        const leadCnpj = leadCnpjCheck.rows[0]?.cnpj;
        if (leadCnpj && leadCnpj !== cnpj) {
          return NextResponse.json({
            encontrado: false,
            aviso: 'Token não corresponde ao CNPJ informado.',
          });
        }
        return NextResponse.json({
          encontrado: true,
          tipo_vinculo: 'link_representante',
          lead_id: row.lead_id,
          representante_id: row.representante_id,
          representante_nome: row.representante_nome,
        });
      }
    }

    // === PRIORIDADE 2: Id numérico do representante ===
    if (representante_id != null) {
      const repIdNum = Number(representante_id);
      if (Number.isFinite(repIdNum) && repIdNum > 0) {
        const idResult = await query(
          `SELECT
             l.id            AS lead_id,
             l.representante_id,
             r.nome          AS representante_nome
           FROM leads_representante l
           JOIN representantes r ON r.id = l.representante_id
           WHERE r.id = $1
             AND l.cnpj   = $2
             AND l.status = 'pendente'
             AND l.data_expiracao > NOW()
           LIMIT 1`,
          [repIdNum, cnpj]
        );

        if (idResult.rows.length > 0) {
          const row = idResult.rows[0];
          return NextResponse.json({
            encontrado: true,
            tipo_vinculo: 'codigo_representante',
            lead_id: row.lead_id,
            representante_id: row.representante_id,
            representante_nome: row.representante_nome,
          });
        }
        // Id informado mas não encontrado: não cai para CNPJ (id errado)
        return NextResponse.json({
          encontrado: false,
          aviso:
            'Id de representante não encontrado ou CNPJ não está na lista de indicações deste representante.',
        });
      }
    }

    // === PRIORIDADE 3: Verificação por CNPJ ===
    const cnpjResult = await query(
      `SELECT
         l.id            AS lead_id,
         l.representante_id,
         r.nome          AS representante_nome
       FROM leads_representante l
       JOIN representantes r ON r.id = l.representante_id
       WHERE l.cnpj = $1
         AND l.status = 'pendente'
         AND l.data_expiracao > NOW()
       LIMIT 1`,
      [cnpj]
    );

    if (cnpjResult.rows.length > 0) {
      const row = cnpjResult.rows[0];
      return NextResponse.json({
        encontrado: true,
        tipo_vinculo: 'verificacao_cnpj',
        lead_id: row.lead_id,
        representante_id: row.representante_id,
        representante_nome: row.representante_nome,
      });
    }

    // Nenhum representante encontrado
    return NextResponse.json({ encontrado: false });
  } catch (err) {
    console.error('[POST /api/cadastro/verificar-representante]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
