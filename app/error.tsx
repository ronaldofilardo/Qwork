'use client';

export default function Error({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Erro Interno</h1>
      <p>Ocorreu um erro inesperado.</p>
      <button onClick={reset}>Tentar novamente</button>
    </div>
  );
}
