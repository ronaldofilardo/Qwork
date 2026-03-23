/**
 * POST /api/representante/equipe/cadastrar
 * Cria um novo vendedor e já o vincula à equipe do representante logado.
 *
 * Fluxo:
 *   1. Autentica representante
 *   2. Valida CPF único em `usuarios`
 *   3. Insere usuário com tipo_usuario='vendedor'
 *   4. Gera código único VND-XXXXX e insere em `vendedores_perfil`
 *   5. Insere vínculo em `hierarquia_comercial`
 *   6. Retorna { vendedor_id, codigo, vinculo_id }
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import type { Session } from '@/lib/session';
import {
  gerarTokenConviteVendedor,
  logEmailConviteVendedor,
} from '@/lib/vendedores/gerar-convite';

export const dynamic = 'force-dynamic';

const CadastrarSchema = z.object({
  nome: z.string().min(2).max(200).trim(),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos numéricos'),
  sexo: z.enum(['masculino', 'feminino']).optional(),
  email: z.string().email().max(100).optional().nullable(),
  endereco: z.string().max(500).optional().nullable(),
  cidade: z.string().max(100).optional().nullable(),
  estado: z.string().length(2).optional().nullable(),
  cep: z.string().max(9).optional().nullable(),
});

// Gera código VND-XXXXX (5 chars alfanumérico maiúsculo)
function gerarCodigoVendedor(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem I, O, 0, 1 (ambíguos)
  const parte = Array.from(
    { length: 5 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `VND-${parte}`;
}

export async function POST(request: NextRequest) {
  try {
    const sess = requireRepresentante();

    const body = await request.json();
    const parsed = CadastrarSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );

    const { nome, cpf, sexo, email, endereco, cidade, estado, cep } =
      parsed.data;

    // Sessão para RLS
    const rlsSess: Session = {
      cpf: sess.cpf ?? '',
      nome: sess.nome,
      perfil: 'representante',
      representante_id: sess.representante_id,
    };

    // Verificar CPF duplicado em usuarios
    const cpfExistente = await query<{ id: number }>(
      `SELECT id FROM public.usuarios WHERE cpf = $1 LIMIT 1`,
      [cpf],
      rlsSess
    );
    if (cpfExistente.rows.length > 0)
      return NextResponse.json(
        { error: 'Já existe um usuário cadastrado com este CPF.' },
        { status: 409 }
      );

    // Inserir usuário (sem senha — login será implementado depois)
    const userResult = await query<{ id: number }>(
      `INSERT INTO public.usuarios (cpf, nome, email, tipo_usuario)
       VALUES ($1, $2, $3, 'vendedor')
       RETURNING id`,
      [cpf, nome, email ?? null],
      rlsSess
    );
    const vendedorId = userResult.rows[0].id;

    // Gerar código único (retry em caso de colisão)
    let codigo: string = '';
    for (let tentativa = 0; tentativa < 10; tentativa++) {
      const candidato = gerarCodigoVendedor();
      const colisao = await query<{ id: number }>(
        `SELECT id FROM public.vendedores_perfil WHERE codigo = $1 LIMIT 1`,
        [candidato],
        rlsSess
      );
      if (colisao.rows.length === 0) {
        codigo = candidato;
        break;
      }
    }
    if (!codigo) {
      // Fallback improvável mas seguro
      codigo = `VND-${Date.now().toString(36).toUpperCase().slice(-5)}`;
    }

    // Inserir perfil do vendedor
    await query(
      `INSERT INTO public.vendedores_perfil (usuario_id, codigo, sexo, endereco, cidade, estado, cep)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        vendedorId,
        codigo,
        sexo ?? null,
        endereco ?? null,
        cidade ?? null,
        estado ?? null,
        cep ?? null,
      ],
      rlsSess
    );

    // Vincular ao representante
    const vinculoResult = await query<{ id: number }>(
      `INSERT INTO public.hierarquia_comercial (vendedor_id, representante_id, ativo)
       VALUES ($1, $2, true)
       RETURNING id`,
      [vendedorId, sess.representante_id],
      rlsSess
    );
    const vinculoId = vinculoResult.rows[0].id;

    // Gerar token de convite para o vendedor criar sua senha
    const convite = await gerarTokenConviteVendedor(vendedorId, {
      query: (sql: string, params?: unknown[]) => query(sql, params, rlsSess),
    } as never);
    logEmailConviteVendedor(nome, email ?? '', convite.link, convite.expira_em);

    return NextResponse.json(
      {
        vendedor_id: vendedorId,
        codigo,
        vinculo_id: vinculoId,
        convite_url: convite.link,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    return NextResponse.json(r.body, { status: r.status });
  }
}
