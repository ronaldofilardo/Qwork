import type { FC } from 'react';

const MaintenancePage: FC = () => {
  const message =
    process.env.MAINTENANCE_MESSAGE ||
    'Sistema em manutenção programada. Retornamos na segunda-feira, 27 de abril, às 8h.';
  const contact =
    process.env.MAINTENANCE_CONTACT_EMAIL || 'suporte@qwork.app.br';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl font-bold text-white">
          Manutenção em Andamento
        </h1>
        <p className="text-lg text-gray-300">{message}</p>
        <p className="text-sm text-gray-400">
          Dúvidas? Contate:{' '}
          <a
            href={`mailto:${contact}`}
            className="text-blue-400 hover:underline"
          >
            {contact}
          </a>
        </p>
      </div>
    </div>
  );
};

export default MaintenancePage;
