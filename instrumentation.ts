/**
 * Next.js Instrumentation Hook
 *
 * Executado uma vez na inicialização do servidor.
 *
 * Comportamento por ambiente (APP_ENV):
 *   - 'production' : suprime log/debug/info — evita vazamento de dados sensíveis
 *   - 'staging'    : mantém todos os logs — debugging de preview/staging facilitado
 *   - 'development': mantém todos os logs
 *   - 'test'       : mantém todos os logs
 *
 * Nota: NODE_ENV=production é compartilhado entre 'staging' e 'production'.
 * Usar APP_ENV para distinguir comportamento correto em cada um.
 *
 * console.warn e console.error NUNCA são suprimidos (independente do ambiente).
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Sentry server-side initialization
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }

  // Suprimir logs apenas em produção real — NÃO em staging (APP_ENV=staging)
  const isLiveProduction =
    process.env.NODE_ENV === 'production' &&
    process.env.APP_ENV === 'production';

  if (isLiveProduction) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const noop = () => {};
    console.log = noop;
    console.debug = noop;
    console.info = noop;
  }
}
