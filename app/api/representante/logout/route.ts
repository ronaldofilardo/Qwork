/**
 * POST /api/representante/logout
 * Destrói tanto rep-session (legado) quanto bps-session (se perfil='representante')
 */
import { NextResponse } from 'next/server';
import { destruirSessaoRepresentante } from '@/lib/session-representante';

export const dynamic = 'force-dynamic';

export function POST() {
  destruirSessaoRepresentante();
  return NextResponse.json({ success: true });
}
