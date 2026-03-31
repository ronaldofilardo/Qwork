/**
 * POST /api/representante/cadastro
 * Auto-cadastro público de representante comercial.
 * Status inicial: 'ativo' (comissões só fluem após virar 'apto').
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      nome,
      email,
      tipo_pessoa,
      cpf,
      cnpj,
      cpf_responsavel_pj,
      telefone,
      banco_codigo,
      agencia,
      conta,
      tipo_conta,
      titular_conta,
      pix_chave,
      pix_tipo,
      aceite_termos,
      aceite_disclaimer_nv,
    } = body;

    // Validações básicas
    if (!nome?.trim())
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    if (!email?.trim())
      return NextResponse.json(
        { error: 'E-mail é obrigatório' },
        { status: 400 }
      );
    if (!tipo_pessoa || !['pf', 'pj'].includes(tipo_pessoa))
      return NextResponse.json(
        { error: 'tipo_pessoa deve ser "pf" ou "pj"' },
        { status: 400 }
      );
    if (!aceite_termos)
      return NextResponse.json(
        { error: 'Aceite dos termos é obrigatório' },
        { status: 400 }
      );
    if (!aceite_disclaimer_nv)
      return NextResponse.json(
        {
          error:
            'Aceite do disclaimer de não-vínculo empregatício é obrigatório',
        },
        { status: 400 }
      );

    if (tipo_pessoa === 'pf') {
      if (!cpf || !/^\d{11}$/.test(cpf))
        return NextResponse.json(
          { error: 'CPF inválido (11 dígitos)' },
          { status: 400 }
        );
    } else {
      if (!cnpj || !/^\d{14}$/.test(cnpj))
        return NextResponse.json(
          { error: 'CNPJ inválido (14 dígitos)' },
          { status: 400 }
        );
      if (!cpf_responsavel_pj || !/^\d{11}$/.test(cpf_responsavel_pj))
        return NextResponse.json(
          { error: 'CPF do responsável PJ é obrigatório (11 dígitos)' },
          { status: 400 }
        );
    }

    // Verificar se e-mail já existe
    const emailExiste = await query(
      `SELECT id FROM representantes WHERE email = $1 LIMIT 1`,
      [email.toLowerCase().trim()]
    );
    if (emailExiste.rows.length > 0)
      return NextResponse.json(
        { error: 'E-mail já cadastrado' },
        { status: 409 }
      );

    // Verificar conflito PJ: cpf_responsavel_pj = CPF de representante PF existente
    let conflictoPfId: number | null = null;
    if (tipo_pessoa === 'pj' && cpf_responsavel_pj) {
      const pfConflito = await query(
        `SELECT id FROM representantes WHERE cpf = $1 AND tipo_pessoa = 'pf' LIMIT 1`,
        [cpf_responsavel_pj]
      );
      if (pfConflito.rows.length > 0) {
        conflictoPfId = pfConflito.rows[0].id;
      }
    }

    // Status inicial: se houver conflito PF/PJ → 'apto_bloqueado', senão 'ativo'
    const statusInicial = conflictoPfId ? 'apto_bloqueado' : 'ativo';

    const result = await query(
      `INSERT INTO representantes (
         tipo_pessoa, nome, email, telefone,
         cpf, cnpj, cpf_responsavel_pj,
         banco_codigo, agencia, conta, tipo_conta, titular_conta,
         pix_chave, pix_tipo,
         status,
         aceite_termos, aceite_termos_em,
         aceite_disclaimer_nv, aceite_disclaimer_nv_em,
         bloqueio_conflito_pf_id
       ) VALUES (
         $1,$2,$3,$4,
         $5,$6,$7,
         $8,$9,$10,$11,$12,
         $13,$14,
         $15,
         $16, CASE WHEN $16 THEN NOW() END,
         $17, CASE WHEN $17 THEN NOW() END,
         $18
       )
       RETURNING id, codigo, email, nome, status, tipo_pessoa, criado_em`,
      [
        tipo_pessoa,
        nome.trim(),
        email.toLowerCase().trim(),
        telefone ?? null,
        cpf ?? null,
        cnpj ?? null,
        cpf_responsavel_pj ?? null,
        banco_codigo ?? null,
        agencia ?? null,
        conta ?? null,
        tipo_conta ?? null,
        titular_conta ?? null,
        pix_chave ?? null,
        pix_tipo ?? null,
        statusInicial,
        !!aceite_termos,
        !!aceite_disclaimer_nv,
        conflictoPfId,
      ]
    );

    const representante = result.rows[0];

    // Notificar admin sobre conflito PF/PJ se houver
    if (conflictoPfId) {
      await query(
        `INSERT INTO comissionamento_auditoria (tabela, registro_id, status_anterior, status_novo, triggador, motivo, dados_extras)
         VALUES ('representantes', $1, NULL, 'apto_bloqueado', 'sistema',
                 'PJ cadastrada com CPF de PF existente — aguarda decisão Admin',
                 $2::jsonb)`,
        [
          representante.id,
          JSON.stringify({
            pf_conflito_id: conflictoPfId,
            cnpj,
            cpf_responsavel_pj,
          }),
        ]
      );
    }

    return NextResponse.json(
      {
        success: true,
        representante: {
          id: representante.id,
          codigo: representante.codigo,
          nome: representante.nome,
          email: representante.email,
          status: representante.status,
          tipo_pessoa: representante.tipo_pessoa,
          criado_em: representante.criado_em,
        },
        aviso: conflictoPfId
          ? 'Cadastro PJ criado com conflito de CPF. Admin será notificado para resolver.'
          : null,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('[/api/representante/cadastro] Erro:', err);
    const msg = err instanceof Error ? err.message : 'Erro interno';
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json(
        { error: 'CPF, CNPJ ou e-mail já cadastrado' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
