/**
 * /representante/login foi unificado com o login principal em /login.
 * Esta rota é mantida apenas para compatibilidade com links antigos.
 */
import { redirect } from 'next/navigation';

export default function LoginRepresentanteLegado() {
  redirect('/login');
}
