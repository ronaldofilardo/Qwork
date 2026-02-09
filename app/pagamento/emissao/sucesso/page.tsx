'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle, Home } from 'lucide-react';

export default function PagamentoSucessoPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-6 mb-4">
              <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Pagamento Confirmado!
            </h2>
          </div>
        </div>
        <div className="px-6 pb-6 text-center space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Seu pagamento foi confirmado com sucesso e foi registrado no
            sistema.
          </p>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">📋 Próximos passos</p>
            <ul className="text-sm text-left space-y-2 text-gray-600 dark:text-gray-400">
              <li>✓ O emissor foi notificado automaticamente</li>
              <li>✓ Seu laudo será processado em breve</li>
              <li>✓ Você receberá uma notificação quando estiver pronto</li>
            </ul>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Você pode fechar esta janela ou retornar ao sistema.
          </p>

          <button
            onClick={() => router.push('/')}
            className="w-full inline-flex items-center justify-center px-6 py-3 text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Home className="mr-2 h-4 w-4" />
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  );
}
