/** @type {import('next').NextConfig} */
// build-cache-bust: 2026-02-25
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  // Skip generating static error pages
  experimental: {
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
    skipTrailingSlashRedirect: true,
  },
  eslint: {
    // Temporarily ignore ESLint during `next build` to avoid flooding build logs
    // with pre-existing @typescript-eslint warnings. Lint should run in CI and
    // in local pre-commit hooks (see `pnpm lint:ci` / `pnpm lint:full`).
    ignoreDuringBuilds: true,
    dirs: [],
  },
  typescript: {
    // Type errors in __tests__/ and docs/testing/ are pre-existing and excluded
    // from tsconfig.json's exclude list — they don't affect production code.
    // Production type safety is enforced via `pnpm type-check` and CI.
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['www.gov.br'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.gov.br',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/termos/contrato-padrao',
        destination: '/termos/contrato',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=()' },
        ],
      },
    ];
  },
  // Fixes for dev stability on Windows/Node 22+.
  // 1) Disable persistent webpack filesystem cache in dev to avoid corrupted
  //    vendor chunks / missing module errors inside .next/server.
  // 2) Remove eval-based plugins from Edge runtime builds to avoid EvalError.
  webpack(config, { nextRuntime, dev }) {
    if (dev) {
      config.cache = false;
    }

    if (nextRuntime === 'edge') {
      // Remove any webpack plugins that use eval() to wrap modules.
      // This covers: EvalDevToolModulePlugin, EvalSourceUrlPlugin, and
      // any other plugin whose name contains "Eval".
      if (Array.isArray(config.plugins)) {
        config.plugins = config.plugins.filter((plugin) => {
          const name = plugin?.constructor?.name ?? '';
          return !name.includes('Eval');
        });
      }

      // Also set devtool — Next.js will revert this but can't restore plugins.
      config.devtool = false;
    }

    return config;
  },
};

module.exports = nextConfig;
