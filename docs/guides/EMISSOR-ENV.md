# Uso de `.env.emissor.local`

Este documento descreve como configurar variáveis de ambiente específicas para o papel _emissor_ em ambiente de desenvolvimento.

## Arquivos

- `.env.emissor.sample` — arquivo de exemplo (commitar).
- `.env.emissor.local` — arquivo local com segredos (NÃO commitar; adicione ao `.gitignore` ou garanta que esteja coberto por regras existentes).

## Passos

1. Copie `.env.emissor.sample` para `.env.emissor.local`:

```bash
cp .env.emissor.sample .env.emissor.local
# Edite .env.emissor.local e preencha segredos
```

2. Opcional: Para apontar o seu ambiente local ao banco de produção (use com CAUTELA):

```env
# Dentro de .env.emissor.local
ALLOW_PROD_DB_LOCAL=true
DATABASE_URL=postgresql://neondb_owner:***@.../neondb?sslmode=require&channel_binding=require
```

3. Os scripts e utilitários do `scripts/` preferirão `.env.emissor.local` quando presente. Se não existir, será carregado `.env.local`.

## Segurança

- Nunca comite `*.local` com segredos.
- Em produção, configure variáveis via secret manager da plataforma (Vercel, Neon, etc.).

## Teste rápido

- Inicie seu servidor local (`pnpm dev`) e execute um script de geração de PDF, por exemplo:

```bash
pnpm tsx scripts/run-pdf-full-steps.ts
```

Você verá logs indicando se `.env.emissor.local` ou `.env.local` foi carregado.
