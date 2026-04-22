/**
 * POST /api/representante/cadastro
 * Auto-cadastro público de representante comercial.
 * Status inicial: 'ativo' (comissões só fluem após virar 'apto').
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { checkCpfUnicoSistema } from '@/lib/validators/cpf-unico';
import { validarCPF } from '@/lib/cpf-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      nome,
      email,
      tipo_pessoa,
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
    if (tipo_pessoa !== 'pj')
      return NextResponse.json(
        { error: 'Apenas representantes PJ (CNPJ) são aceitos' },
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
    if (!validarCPF(cpf_responsavel_pj))
      return NextResponse.json(
        { error: 'CPF do responsável inválido' },
        { status: 400 }
      );

    // Verificar CPF do responsável único no sistema
    const cpfCheck = await checkCpfUnicoSistema(cpf_responsavel_pj);
    if (!cpfCheck.disponivel) {
      return NextResponse.json(
        {
          error:
            cpfCheck.message ?? 'CPF do responsável já cadastrado no sistema',
        },
        { status: 409 }
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

    // Buscar o único comercial ativo para auto-vincular
    const comercialRes = await query<{ cpf: string }>(
      `SELECT cpf FROM usuarios
       WHERE perfil = 'gestor_comercial' AND ativo = true
       LIMIT 1`
    );
    const gestorComercialCpf = comercialRes.rows[0]?.cpf ?? null;

    // Status inicial: 'ativo'
    const statusInicial = 'ativo';

    const result = await query(
      `INSERT INTO representantes (
         tipo_pessoa, nome, email, telefone,
         cpf, cnpj, cpf_responsavel_pj,
         banco_codigo, agencia, conta, tipo_conta, titular_conta,
         pix_chave, pix_tipo,
         status,
         gestor_comercial_cpf,
         aceite_termos, aceite_termos_em,
         aceite_disclaimer_nv, aceite_disclaimer_nv_em
       ) VALUES (
         $1,$2,$3,$4,
         $5,$6,$7,
         $8,$9,$10,$11,$12,
         $13,$14,
         $15,
         $16,
         $17, CASE WHEN $17 THEN NOW() END,
         $18, CASE WHEN $18 THEN NOW() END
       )
       RETURNING id, email, nome, status, tipo_pessoa, criado_em`,
      [
        tipo_pessoa,
        nome.trim(),
        email.toLowerCase().trim(),
        telefone ?? null,
        null, // cpf: apenas PJ, sem CPF próprio
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
        gestorComercialCpf,
        !!aceite_termos,
        !!aceite_disclaimer_nv,
      ]
    );

    const representante = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        representante: {
          id: representante.id,
          nome: representante.nome,
          email: representante.email,
          status: representante.status,
          tipo_pessoa: representante.tipo_pessoa,
          criado_em: representante.criado_em,
        },
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
