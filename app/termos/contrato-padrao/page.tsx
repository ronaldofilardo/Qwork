import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Contrato — QWork',
  description: 'Redirecionando para o contrato padrão (agora em /termos/contrato)',
};

export default function RedirectToContrato() {
  redirect('/termos/contrato');
}