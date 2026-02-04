'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <h1>Erro Global</h1>
          <p>Ocorreu um erro inesperado.</p>
          <button onClick={reset}>Tentar novamente</button>
        </div>
      </body>
    </html>
  );
}
