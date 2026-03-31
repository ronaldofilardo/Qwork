/**
 * PATCH /api/representante/dados-bancarios
 * Atualiza dados cadastrais e/ou bancários do representante logado.
 * CPF, CNPJ e tipo_pessoa são imutáveis e rejeitados com 400.
 * Ao salvar qualquer campo bancário, marca dados_bancarios_status = 'confirmado'.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';

export const dynamic = 'force-dynamic';

const CAMPOS_IMUTAVEIS = ['cpf', 'cnpj', 'tipo_pessoa'] as const;

const dadosBancariosSchema = z
  .object({
    // Dados cadastrais editáveis
    nome: z.string().min(2).max(200).optional(),
    email: z.string().email().max(254).optional(),
    telefone: z.string().max(20).nullable().optional(),
    // Dados bancários
    banco_codigo: z.string().max(10).nullable().optional(),
    agencia: z.string().max(20).nullable().optional(),
    conta: z.string().max(30).nullable().optional(),
    tipo_conta: z.enum(['corrente', 'poupanca']).nullable().optional(),
    titular_conta: z.string().max(200).nullable().optional(),
    pix_chave: z.string().max(150).nullable().optional(),
    pix_tipo: z
      .enum(['cpf', 'cnpj', 'email', 'telefone', 'aleatoria'])
      .nullable()
      .optional(),
  })
  .strict(); // rejeita campos desconhecidos (inclui cpf/cnpj/tipo_pessoa)

const CAMPOS_BANCARIOS = [
  'banco_codigo',
  'agencia',
  'conta',
  'tipo_conta',
  'titular_conta',
  'pix_chave',
  'pix_tipo',
] as const;

export async function PATCH(request: NextRequest) {
  try {
    const sess = requireRepresentante();

    // Bloquear campos imutáveis explicitamente (defesa em profundidade)
    const rawBody = await request.json();
    for (const campo of CAMPOS_IMUTAVEIS) {
      if (campo in rawBody) {
        return NextResponse.json(
          { error: `O campo "${campo}" não pode ser alterado.` },
          { status: 400 }
        );
      }
    }

    const parsed = dadosBancariosSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', detalhes: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const dados = parsed.data;
    if (Object.keys(dados).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo enviado para atualização.' },
        { status: 400 }
      );
    }

    // Verificar se rep existe e pertence à sessão
    const repResult = await query(
      `SELECT id, status FROM representantes WHERE id = $1 LIMIT 1`,
      [sess.representante_id]
    );
    if (repResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Representante não encontrado.' },
        { status: 404 }
      );
    }

    const rep = repResult.rows[0] as { id: number; status: string };

    // Rep desativado não pode editar dados (deve ser redirecionado pelo front,
    // mas defendemos também na API)
    if (rep.status === 'desativado') {
      return NextResponse.json(
        { error: 'Conta desativada. Não é possível editar dados.' },
        { status: 403 }
      );
    }

    // Montar UPDATE dinâmico
    const setClauses: string[] = ['atualizado_em = NOW()'];
    const params: unknown[] = [sess.representante_id];
    let i = 2;

    for (const [campo, valor] of Object.entries(dados)) {
      setClauses.push(`${campo} = $${i++}`);
      params.push(valor ?? null);
    }

    // Se algum campo bancário foi enviado, marca confirmação
    const temCampoBancario = CAMPOS_BANCARIOS.some((c) => c in dados);
    if (temCampoBancario) {
      setClauses.push(
        `dados_bancarios_status = 'confirmado'`,
        `dados_bancarios_confirmado_em = NOW()`
      );
    }

    const result = await query(
      `UPDATE representantes
       SET ${setClauses.join(', ')}
       WHERE id = $1
       RETURNING id, nome, email, telefone,
                 banco_codigo, agencia, conta, tipo_conta, titular_conta,
                 pix_chave, pix_tipo,
                 dados_bancarios_status, dados_bancarios_confirmado_em`,
      params
    );

    return NextResponse.json({ representante: result.rows[0] });
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    return NextResponse.json(r.body, { status: r.status });
  }
}
