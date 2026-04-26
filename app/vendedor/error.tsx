'use client';

export default function DomainError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-8">
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <h2 className="mb-2 text-xl font-semibold text-red-800">
          Ocorreu um erro
        </h2>
        <p className="mb-4 text-sm text-red-600">
          Algo deu errado ao carregar esta página.
        </p>
        <button
          onClick={reset}
          className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
