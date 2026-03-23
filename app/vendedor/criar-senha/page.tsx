/**
 * Página pública para vendedor criar sua própria senha via link de convite.
 * Rota: /vendedor/criar-senha?token=XXX
 */
import type { Metadata } from 'next';
import CriarSenhaVendedorForm from './CriarSenhaVendedorForm';

export const metadata: Metadata = {
  title: 'Criar Senha — QWork',
  description: 'Crie sua senha de acesso ao portal do vendedor',
};

export default function CriarSenhaVendedorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">Q</span>
          </div>
        </div>
        <h2 className="text-center text-2xl font-semibold text-gray-900">
          Criar senha de acesso
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Portal do Vendedor — QWork
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-gray-100">
          <CriarSenhaVendedorForm />
        </div>
      </div>
    </div>
  );
}
