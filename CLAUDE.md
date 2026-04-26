# QWork — Instruções de Repositório para Claude Code

Este arquivo define o comportamento padrão esperado para qualquer tarefa neste repositório.

---

## Resposta e comunicação

- Responda em português do Brasil.
- Seja curto, direto e profissional.
- Antes de alterar arquivos, diga brevemente o que será feito e quais arquivos serão tocados.
- Se uma mudança puder afetar múltiplos arquivos, cite os principais impactados.
- Se houver risco, ofereça caminho de rollback simples.

---

## Contexto do sistema

**QWork** é um sistema de gestão de avaliações de saúde ocupacional com emissão **100% manual** de laudos médicos.

### Fluxo principal de laudos

```text
RH → POST /api/lotes/[id]/liberar → avaliações → POST /api/lotes/[id]/solicitar-emissao
→ Emissor → POST /api/emissor/laudos/[id] → gerarLaudoCompletoEmitirPDF() → emitido
```

- A trigger `fn_reservar_id_laudo_on_lote_insert` cria laudo em `rascunho` automaticamente.
- Constraint crítica: `lote.id = laudo.id` sempre.
- O cron de auto-emissão está desabilitado e não deve ser reativado sem aprovação explícita.

### Perfis de usuário

| Perfil      | Base principal              |
| ----------- | --------------------------- |
| admin       | /admin e /api/admin         |
| rh          | /rh e /api/rh               |
| gestor      | /entidade e /api/entidade   |
| suporte     | /suporte e /api/suporte     |
| comercial   | /comercial e /api/comercial |
| vendedor    | /vendedor e /api/vendedor   |
| emissor     | /emissor e /api/emissor     |
| funcionario | /dashboard e /avaliacao     |

- Gestores não acessam rotas de funcionário.
- A sessão é lida do cookie `bps-session`.
- Nunca logar CPF completo; mascarar sempre que necessário.

---

## Stack do projeto

- Next.js 14 com App Router
- TypeScript em modo strict
- PostgreSQL local e Neon Cloud
- Tailwind CSS
- Zod para validação
- Zustand para estado global no cliente
- React Query para cache e fetch no cliente
- Sentry para monitoramento de erros
- Backblaze S2 para storage privado de laudos
- Asaas para pagamentos
- ZapSign desabilitado por padrão
- Puppeteer para geração de PDF
- Package manager oficial: pnpm

---

## Política de banco de dados

| Ambiente        | Banco          | Variável principal |
| --------------- | -------------- | ------------------ |
| Desenvolvimento | nr-bps_db      | LOCAL_DATABASE_URL |
| Testes          | nr-bps_db_test | TEST_DATABASE_URL  |
| Staging         | Neon           | DATABASE_URL       |
| Produção        | neondb_v2      | DATABASE_URL       |

- Nunca apontar desenvolvimento local para produção.
- Nunca definir `NODE_ENV=production` em `.env.local`.
- Nunca usar `ALLOW_PROD_DB_LOCAL` localmente.
- O banco de testes deve permanecer isolado do banco de desenvolvimento e produção.
- Ao alterar schema, manter sincronizados código, migrations e arquivos de blueprint em `database/schemas`.

---

## Regras obrigatórias

1. Nunca quebre código existente.
2. Sempre investigue a causa raiz antes de corrigir sintomas.
3. Valide a mudança antes de dizer que concluiu.
4. Reutilize padrões já existentes no codebase.
5. Em caso de dúvida entre duas abordagens, escolha a mais conservadora.
6. Nunca exponha segredos, tokens ou variáveis sensíveis em Client Components.
7. Nunca altere testes que já passam sem motivo claro.
8. Nunca use npm ou yarn; use sempre pnpm.
9. Nunca reative fluxos automáticos de auto-emissão sem autorização explícita.

---

## Fluxo obrigatório para qualquer mudança

1. Ler o arquivo e o contexto ao redor antes de editar.
2. Entender a causa raiz do problema.
3. Fazer a menor mudança segura possível.
4. Validar com testes, lint ou type-check relevantes.
5. Só então afirmar que a tarefa foi concluída.

---

## Regras para APIs e segurança

- Verifique autenticação antes de qualquer lógica de negócio.
- Verifique autorização logo em seguida, com base em perfil e escopo.
- Valide entradas externas com Zod sempre que fizer sentido.
- Retorne erros estruturados e sem vazar detalhes internos.
- Nunca logue senha, token, CPF completo ou dados sensíveis.
- Mantenha rate limit e auditoria em fluxos críticos.
- Rotas de emissão, pagamento, autenticação e contratos exigem validação extra antes de qualquer mudança.
- Em áreas administrativas, respeite controles adicionais como MFA e restrição por IP quando aplicável.

### Rate limiting

- Login: 10 requisições por 5 minutos por IP.
- Usuário autenticado: limites mais altos por usuário e por IP.
- Público não autenticado: limite próprio por IP.

---

## Regras para Next.js

- Prefira Server Components por padrão.
- Use `use client` apenas quando estritamente necessário.
- Evite fetch inicial em `useEffect` quando um Server Component resolver melhor.
- Para dados dinâmicos, use estratégias coerentes com `cache`, `revalidate` e server boundaries.

---

## Regras para TypeScript

- Não desabilite o strict mode.
- Evite `any`; prefira `unknown` com narrowing.
- Tipos explícitos em APIs e funções públicas.
- Não usar `ts-ignore` sem justificativa real.

---

## Regras para logs

- `warn` e `error` sempre podem aparecer.
- Logs verbosos só quando flags de debug estiverem ativas.
- Evite ruído em caminhos de sucesso do login, middleware e banco.
- Nunca logar CPF completo, senha, token ou dados sensíveis.

---

## Convenções importantes do QWork

- `database/schemas/` contém blueprints da estrutura e deve refletir o estado atual do sistema.
- Ao renomear colunas ou entidades, atualizar código, migration e schema file.
- Mudanças em pagamento, autenticação, emissão de laudos, contratos e storage exigem validação extra.
- O storage de laudos deve permanecer no backend, por streaming, com bucket privado.
- ZapSign permanece desabilitado por padrão, salvo contexto explícito para habilitação.

### Requisito de sistema: CPF único cross-perfil (migration 1229)

Um CPF **não pode** ser registrado simultaneamente em mais de um dos seguintes perfis:

| Tabela                          | Campo                | Condição                                                      |
| ------------------------------- | -------------------- | ------------------------------------------------------------- |
| `representantes`                | `cpf`                | qualquer status                                               |
| `representantes`                | `cpf_responsavel_pj` | qualquer status                                               |
| `representantes_cadastro_leads` | `cpf`                | `status NOT IN ('rejeitado', 'convertido')`                   |
| `representantes_cadastro_leads` | `cpf_responsavel`    | `status NOT IN ('rejeitado', 'convertido')`                   |
| `usuarios`                      | `cpf`                | `tipo_usuario IN ('vendedor','gestor','rh') AND ativo = true` |

**Exclusões explícitas**: `funcionarios`, `admin`, `emissor`, `suporte`, `comercial`.

**Camadas de enforcement** (ambas devem ser mantidas sincronizadas):

1. **Aplicação**: `lib/validators/cpf-unico.ts` → `checkCpfUnicoSistema()` — chamada antes de qualquer INSERT/UPDATE que crie/altere esses registros. Retorna erro amigável ao usuário.
2. **Banco de dados**: triggers `tg_representante_cpf_unico`, `tg_lead_cpf_unico`, `tg_usuario_cpf_unico` (migration 1229) — última linha de defesa para todos os ambientes (DEV, TEST, STAGING, PROD).

**Regras de modificação**:

- Nunca remova ou desabilite esses triggers sem aprovação explícita.
- Ao criar novas rotas que inserem/alteram `representantes`, `representantes_cadastro_leads` ou `usuarios` (tipos bloqueantes), SEMPRE chamar `checkCpfUnicoSistema` antes do INSERT.
- A migration 1229 deve ser aplicada em **todos** os ambientes antes de qualquer dado novo.

---

## Comandos de validação

Execute apenas o que for relevante para a mudança:

```bash
pnpm dev
pnpm type-check
pnpm lint
pnpm quality:check
pnpm test:unit
pnpm test:api
pnpm test:regression
pnpm test:integration
pnpm test:security
pnpm test
pnpm test:e2e
```

> Atenção: os testes dependem de ambiente isolado e devem usar o banco local de testes.

---

## Preferências de trabalho

- Priorize mudanças pequenas, verificáveis e reversíveis.
- Para bugs, adicione ou atualize teste de regressão quando fizer sentido.
- Preserve acessibilidade, responsividade e consistência visual ao tocar UI.
- Em áreas sensíveis, prefira evidência e verificação a suposições.
- Ao tocar o middleware, valide se as rotas públicas e o mapa de roles continuam corretos.

---

## AI Skills de Design e Qualidade

Skills instaladas em `.agents/skills/`. Lidas automaticamente por Cursor, Claude Code e GitHub Copilot.

### Como usar no chat (VS Code Copilot / Claude Code)

**Taste Skill — design anti-slop (ativa ao gerar UI)**
Basta pedir: `"cria um componente de tabela com Taste Skill"` ou `"use design-taste-frontend"`

**Impeccable — 18 comandos explícitos de design:**

| Comando | O que faz | Quando usar |
|---------|-----------|-------------|
| `/audit <area>` | Detecta issues A11y, performance, responsive | Antes de qualquer mudança visual |
| `/critique <area>` | Revisão UX: hierarchy, clarity, resonance | Quando quiser feedback de design |
| `/normalize <area>` | Alinha com design system | Após audit, para fixar inconsistências |
| `/polish <area>` | Último passo antes de deploy | Antes de mergear feature visual |
| `/distill <area>` | Remove complexidade | Quando UI está sobrecarregada |
| `/clarify <area>` | Melhora UX copy e mensagens | Em forms, erros, empty states |
| `/harden <area>` | Error handling, edge cases, i18n | Em fluxos críticos |
| `/animate <area>` | Adiciona motion intencional | Quando precisar de transições |
| `/colorize <area>` | Introdução estratégica de cor | Dashboard monocromático |
| `/typeset <area>` | Corrige hierarquia de fontes | Quando titulação estiver confusa |
| `/layout <area>` | Corrige spacing e ritmo | Quando alinhamento estiver irregular |
| `/bolder <area>` | Amplifica designs fracos | Quando UI estiver "sem personalidade" |
| `/quieter <area>` | Reduz excesso visual | Quando houver muito ruído visual |

Combinado: `/audit /normalize /polish components/lotes`

**Impeccable CLI (sem agent, detecta anti-patterns no código):**
```bash
npx impeccable detect app/          # escanear diretório
npx impeccable detect app/rh        # focar em área
npx impeccable detect --json app/   # output JSON para CI
```

### Regras de design obrigatórias (Taste Skill)

- Nunca usar `Inter` como fonte. Usar Geist, Outfit, Cabinet Grotesk ou Satoshi.
- Nunca usar fundo puro `#000000`. Usar zinc-950 ou charcoal tintado.
- Nunca gradientes purple/blue "AI aesthetic". Usar neutrals + 1 accent.
- Nunca `h-screen`. Usar `min-h-[100dvh]` (iOS Safari viewport bug).
- Nunca emojis em código. Substituir por ícones Phosphor/Radix.
- Animações: spring physics (`stiffness: 100, damping: 20`), nunca linear.
- Motion: animar somente `transform` e `opacity`.
- Loading, empty e error states são **obrigatórios** em componentes interativos.

### Code Review automático (GitHub PRs)

Configurar em: `claude.ai/admin-settings/claude-code`

```
Comentar na PR:
  @claude review       — review + subscribe pushes futuras
  @claude review once  — review única sem subscribe
```

Regras customizadas em: `REVIEW.md`
Para re-instalar skills: `scripts/setup-skills.bat` (Windows) ou `bash scripts/setup-skills.sh`
