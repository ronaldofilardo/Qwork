# CORRECAO_EMISSOR_LOCAL_BANCO_PROD.md — Emissor Local → Banco de Produção

## Contexto

Laudos NR são gerados com Puppeteer (headless Chrome). Em PRODUÇÃO (Vercel), o Puppeteer não roda adequadamente por limitações de ambiente. A solução é emitir os laudos **localmente** usando dados do banco de **produção** (Neon).

## Fluxo

```
1. Pagamento processado (Asaas Webhook → Neon PROD)
2. Emissor acessa localhost:3000 com CPF 53051173991
3. Sistema detecta ALLOW_PROD_DB_LOCAL=true + EMISSOR_CPF → conecta ao Neon
4. Emissor vê lote pago no dashboard → clica "Iniciar Laudo"
5. Puppeteer local gera PDF → salva em storage/laudos/
6. Status do laudo: rascunho → emitido
7. Emissor clica "Enviar ao Bucket" → upload para Backblaze
8. Status do laudo: emitido → enviado (+ enviado_em preenchido)
9. RH/Gestor acessa laudo online via URL do bucket
```

## COMO TESTAR

### Pré-requisitos

Certifique-se de que `.env.local` contém:

```env
ALLOW_PROD_DB_LOCAL=true
EMISSOR_CPF=53051173991
```

E que `.env` (base) contém `DATABASE_URL` apontando para Neon.

### Passos

1. Inicie o servidor: `pnpm dev`
2. Acesse `http://localhost:3000`
3. Faça login com o CPF do emissor: `53051173991`
4. No Dashboard do Emissor, localize o lote pago
5. Clique em **Iniciar Laudo** — Puppeteer gera o PDF localmente
6. Após geração, o lote aparece na aba **Laudo Emitido**
7. Clique em **Enviar ao Bucket** — PDF sobe para o Backblaze
8. Status final: `enviado` com `enviado_em` preenchido

## Segurança

- Apenas o CPF `53051173991` pode executar queries quando `ALLOW_PROD_DB_LOCAL=true`
- Qualquer outra sessão recebe erro `🚨 ACESSO BLOQUEADO`
- `jest.setup.js` remove `ALLOW_PROD_DB_LOCAL` antes de todos os testes
- Testes NUNCA acessam Neon PROD

## Arquivos Modificados

| Arquivo                                           | Mudança                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------- |
| `lib/db.ts`                                       | Guard CPF em `query()` + `getDatabaseUrl()` suporta modo emissor |
| `app/api/emissor/laudos/[loteId]/upload/route.ts` | `status='enviado'` + `enviado_em=NOW()` após upload              |
| `.env.local`                                      | `ALLOW_PROD_DB_LOCAL=true` + `EMISSOR_CPF=53051173991`           |

## Neon

O banco de produção é `neondb` hospedado no Neon Cloud. O Pagamento via Asaas grava diretamente no Neon via webhook. O Emissor precisa do Neon para ver lotes pagos.
