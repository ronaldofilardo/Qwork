// Arquivo necessário para que o Next.js gere o trace de .nft.json
// corretamente ao usar output: 'standalone' com App Router.
// O projeto usa apenas App Router (app/); este arquivo evita o erro:
//   ENOENT: no such file or directory, open '.next/server/pages/_app.js.nft.json'
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
