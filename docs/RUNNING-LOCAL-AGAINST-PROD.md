# Rodando localmente contra o banco de produção (Neon)

WARNING: The development configuration (`.env.development`) is set to use the Neon production database via `LOCAL_DATABASE_URL` by default. This means local development will operate on production data — use this only if you are the sole operator and explicitly accept the risks (data loss, test pollution, security exposure).

Use este guia somente se:

- Você é o único usuário acessando o sistema localmente, e
- Os dados no banco de produção são de teste / não sensíveis, e
- Você aceita o risco de alterações nos dados de produção.

Passos rápidos

1. Crie um arquivo `.env.local` na raiz do projeto (não commitar):

```
# Copie dos valores reais (não deixe no git)
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@.../neondb?sslmode=require&channel_binding=require"
ALLOW_PROD_DB_LOCAL=true
NODE_ENV=development
```

2. Instale dependências (se necessário):

```
pnpm install
```

3. Rode o app em modo desenvolvimento:

```
pnpm dev
```

4. Teste os fluxos:

- Faça uploads pelo fluxo de pré-cadastro e verifique os arquivos em `public/uploads/contratantes` (ou no diretório configurado localmente).
- Gere laudos e confirme arquivos em `storage/laudos/laudo-<id>.pdf`.
- Use os endpoints de download para validar que os downloads funcionam para arquivos disponíveis localmente (em `storage/` ou `public/uploads/`).

Dicas de segurança e recomendações

- Evite rodar testes (`pnpm test`) apontando para este DB de produção.
- Quando terminar, remova `ALLOW_PROD_DB_LOCAL` ou defina para `false`.

Se quiser, posso criar automaticamente o `.env.local` a partir das variáveis já configuradas no Vercel (preciso que confirme para eu prosseguir e/ou me forneça as chaves).
