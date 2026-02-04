/** @type {import('next').NextConfig} */
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
};

module.exports = nextConfig;
