import type { DestinatarioTipo } from '@/lib/notification-service';
import type { Session } from '@/lib/session';

/**
 * Derives the DestinatarioTipo from the user's perfil.
 * Centralised to avoid duplicated ternary chains across notification routes.
 */
export function getDestinatarioTipo(session: Session): DestinatarioTipo {
  if (session.perfil === 'admin') return 'admin';
  if (session.perfil === 'rh') return 'gestor';
  return 'funcionario';
}
