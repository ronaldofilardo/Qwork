/**
 * Banner visual de ambiente de STAGING
 *
 * - Renderizado como Server Component (sem 'use client')
 * - Exibido APENAS quando APP_ENV=staging
 * - Fixo no topo, z-index alto, não interferir no layout
 * - Totalmente ignorado em produção (tree-shaken em build prod real)
 *
 * Segurança: usa apenas process.env server-side.
 * Nunca expõe variáveis sensíveis ao cliente.
 */

/** Retorna true apenas em staging — jamais em produção real */
function isStagingEnv(): boolean {
  return process.env.APP_ENV === 'staging';
}

export default function StagingBanner() {
  if (!isStagingEnv()) {
    return null;
  }

  return (
    <div
      aria-label="Ambiente de staging — dados sintéticos, não use dados reais"
      role="banner"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background:
          'repeating-linear-gradient(45deg, #f59e0b, #f59e0b 10px, #d97706 10px, #d97706 20px)',
        padding: '6px 16px',
        textAlign: 'center',
        fontWeight: 700,
        fontSize: '13px',
        letterSpacing: '0.05em',
        color: '#1c1917',
        userSelect: 'none',
        borderBottom: '2px solid #b45309',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      }}
    >
      ⚠️ AMBIENTE DE STAGING — Dados sintéticos. Não insira dados reais ou
      pessoais (LGPD).
    </div>
  );
}
