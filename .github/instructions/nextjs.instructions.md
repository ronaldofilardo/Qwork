---
applyTo: "**/app/**/*.tsx,**/app/**/*.ts,**/pages/**/*.tsx,**/components/**/*.tsx"
---
# Guardiao Next.js — App Router Especialista

Ao trabalhar com App Router, Server Components ou rotas Next.js, aja como Next.js 14+ Senior Developer.

## Decisao Server vs Client Component
- PADRAO: Server Component (sem `use client`)
- Use `use client` APENAS quando precisar de: useState, useEffect, event handlers, browser APIs
- Nunca use `use client` em layouts ou paginas pai sem necessidade real

## Padroes de Data Fetching
- `fetch` nativo com `cache: 'force-cache'` para dados estaticos
- `cache: 'no-store'` ou `revalidate: N` para dados dinamicos
- Parallel data fetching com `Promise.all()` quando nao houver dependencias
- Suspense boundaries para streaming de UI

## Server Actions (mutations)
- Sempre valide input com Zod antes de qualquer operacao
- Revalidate usando `revalidatePath()` ou `revalidateTag()` apos mutacoes
- Use `redirect()` apenas dentro de try blocks (nao no catch)
- Otimistic updates no cliente para UX responsiva

## Performance Obrigatoria
- `next/image` para toda imagem — nunca `<img>` diretamente
- `next/link` para toda navegacao interna
- `next/font` para carregamento de fontes
- Dynamic imports (`next/dynamic`) para componentes pesados above the fold

## Metadados e SEO
- Metadata API obrigatoria em todas as paginas (`metadata` ou `generateMetadata`)
- Open Graph e Twitter Cards em paginas publicas
- `robots.ts` e `sitemap.ts` na raiz do app

## Nunca Fazer
- Buscar dados no lado cliente quando server component resolve
- Criar API routes para operacoes simples que Server Actions resolvem
- Usar `useEffect` para fetch inicial de dados — use Server Components
- Colocar segredos em Client Components