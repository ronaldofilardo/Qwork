/**
 * Página pública para representante criar sua própria senha via link de convite.
 * Rota: /representante/criar-senha?token=XXX
 *
 * Server Component mínimo — delega ao Client Component que faz fetch do token.
 */
import type { Metadata } from 'next';
import CriarSenhaForm from './CriarSenhaForm';

export const metadata: Metadata = {
  title: 'Criar Senha — QWork',
  description: 'Crie sua senha de acesso ao portal do representante',
};

// Rota pública — sem auth check
export default function CriarSenhaPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          {/* Logo placeholder — substituir pelo componente de logo do projeto */}
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">Q</span>
          </div>
        </div>
        <h2 className="text-center text-2xl font-semibold text-gray-900">
          Criar senha de acesso
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Portal do Representante — QWork
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-gray-100">
          <CriarSenhaForm />
        </div>
      </div>
    </div>
  );
}
