/**
 * POST /api/auth/emissor/selecionar-ambiente
 *
 * Rota exclusiva para emissores: recebe o ambiente de banco desejado
 * após autenticação e persiste na sessão.
 *
 * Segurança:
 * 1. Requer sessão ativa com perfil 'emissor'
 * 2. Valida dbEnvironment contra valores permitidos
 * 3. Produção requer CPF na whitelist ALLOWED_PROD_EMISSORES_CPFS
 * 4. Apenas emissores podem invocar esta rota
 */

import { NextResponse } from 'next/server';
import { getSession, persistSession } from '@/lib/session';
import { validateDbEnvironmentAccess } from '@/lib/db/environment-guard';
import { rateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const SelecionarAmbienteSchema = z.object({
  dbEnvironment: z.enum(['development', 'staging', 'production']),
});

export async function POST(request: Request) {
  // Rate limit: reutiliza config de auth
  const rateLimitResult = rateLimit(RATE_LIMIT_CONFIGS.auth)(request as any);
  if (rateLimitResult) return rateLimitResult;

  // 1. Verificar autenticação
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // 2. Verificar autorização — apenas emissores
  if (session.perfil !== 'emissor') {
    return NextResponse.json(
      { error: 'Apenas emissores podem selecionar ambiente de banco' },
      { status: 403 }
    );
  }

  // 3. Validar input com Zod
  let dbEnvironment: 'development' | 'staging' | 'production';
  try {
    const body = await request.json();
    const parsed = SelecionarAmbienteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ambiente inválido. Use: development, staging ou production' },
        { status: 400 }
      );
    }
    dbEnvironment = parsed.data.dbEnvironment;
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 });
  }

  // 4. Validar permissão de acesso ao ambiente
  const permResult = validateDbEnvironmentAccess(session.cpf, dbEnvironment);
  if (!permResult.allowed) {
    return NextResponse.json({ error: permResult.reason }, { status: 403 });
  }

  // 5. Persistir na sessão
  persistSession({ ...session, dbEnvironment });

  return NextResponse.json({ success: true, dbEnvironment });
}
