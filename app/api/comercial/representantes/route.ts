/**
 * POST /api/comercial/representantes
 * Cria um novo representante diretamente pelo Comercial e gera convite de criação de senha.
 *
 * Body: { nome, cpf, email, telefone, tipo_pessoa }
 * Retorna: { representante_id, codigo, convite_url }
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import {
  gerarTokenConvite,
  logEmailConvite,
} from '@/lib/representantes/gerar-convite';

export const dynamic = 'force-dynamic';

const CriarRepresentanteSchema = z.object({
  nome: z.string().min(2).max(200).trim(),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos numéricos'),
  email: z.string().email().max(100).trim(),
  telefone: z.string().max(20).optional().nullable(),
  tipo_pessoa: z.enum(['pf', 'pj']),
});

function gerarCodigoRepresentante(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole(['comercial', 'admin'], false);

    const body = await request.json();
    const parsed = CriarRepresentanteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { nome, cpf, email, telefone, tipo_pessoa } = parsed.data;

    // Verificar duplicata de CPF em representantes
    const cpfExistente = await query<{ id: number }>(
      `SELECT id FROM public.representantes WHERE cpf = $1 LIMIT 1`,
      [cpf]
    );
    if (cpfExistente.rows.length > 0) {
      return NextResponse.json(
        { error: 'Já existe um representante cadastrado com este CPF.' },
        { status: 409 }
      );
    }

    // Verificar duplicata de email em representantes
    const emailExistente = await query<{ id: number }>(
      `SELECT id FROM public.representantes WHERE email = $1 LIMIT 1`,
      [email.toLowerCase()]
    );
    if (emailExistente.rows.length > 0) {
      return NextResponse.json(
        { error: 'Já existe um representante cadastrado com este email.' },
        { status: 409 }
      );
    }

    // Gerar código único (retry em caso de colisão)
    let codigo = '';
    for (let tentativa = 0; tentativa < 10; tentativa++) {
      const candidato = gerarCodigoRepresentante();
      const colisao = await query<{ id: number }>(
        `SELECT id FROM public.representantes WHERE codigo = $1 LIMIT 1`,
        [candidato]
      );
      if (colisao.rows.length === 0) {
        codigo = candidato;
        break;
      }
    }
    if (!codigo) {
      codigo = Date.now().toString(36).toUpperCase().slice(-8);
    }

    // Inserir representante com status 'aguardando_senha'
    const insertResult = await query<{ id: number }>(
      `INSERT INTO public.representantes
        (nome, cpf, email, telefone, tipo_pessoa, codigo, status, aceite_termos, aceite_disclaimer_nv, aceite_politica_privacidade)
       VALUES ($1, $2, $3, $4, $5, $6, 'aguardando_senha', FALSE, FALSE, FALSE)
       RETURNING id`,
      [nome, cpf, email.toLowerCase(), telefone ?? null, tipo_pessoa, codigo]
    );

    const representanteId = insertResult.rows[0].id;

    // Criar entrada vazia em representantes_senhas (sem senha ainda)
    await query(
      `INSERT INTO public.representantes_senhas (representante_id, cpf, primeira_senha_alterada)
       VALUES ($1, $2, FALSE)`,
      [representanteId, cpf]
    );

    // Gerar token de convite (7 dias de validade)
    // Usar query como TransactionClient (compatível com a interface)
    const convite = await gerarTokenConvite(representanteId, { query } as any);

    // Log fake email (padrão do projeto)
    logEmailConvite(nome, email, convite.link, convite.expira_em);

    console.log(
      `[COMERCIAL] Representante #${representanteId} (${nome}) criado por ${session.cpf} — convite gerado`
    );

    return NextResponse.json(
      {
        representante_id: representanteId,
        codigo,
        convite_url: convite.link,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/comercial/representantes]', err);
    const msg = (err as Error).message;
    if (msg === 'Sem permissão') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
