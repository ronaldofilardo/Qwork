import { Suspense } from 'react';
import ResetarSenhaForm from './ResetarSenhaForm';

export const metadata = {
  title: 'Criar Nova Senha — QWork',
  description: 'Crie sua nova senha de acesso ao sistema QWork.',
  robots: { index: false, follow: false },
};

export default function ResetarSenhaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <ResetarSenhaForm />
    </Suspense>
  );
}
