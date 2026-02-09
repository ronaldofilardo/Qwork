# Qwork - Sistema de Avaliação Psicossocial

Sistema de avaliação psicossocial baseado no questionário COPSOQ III (versão média), com módulos integrados de Jogos de Apostas e Endividamento Financeiro.

## 🚀 Características

- **Progressive Web App (PWA)** - Funciona offline
- **100% Serverless** - Deploy na Vercel
- **Autenticação Segura** - Sessão via cookies httpOnly
- **Multi-perfil** - Funcionário, RH, Admin, Emissor, Gestor Entidade
- **10 Grupos de Avaliação** - 37 itens (COPSOQ III reduzido + módulos JZ e EF)
- **Dashboard Analítico** - Gráficos e semáforo de riscos
- **Exportação** - PDF e Excel
- **Sistema de Contratação Completo** - Planos, Contratos, Pagamentos
- **Auditoria Avançada** - Registro completo de ações críticas
- **Banco de Dados** - Neon (produção) e PostgreSQL local (desenvolvimento)

## 📦 Novidades - Sistema de Contratação

> **NOTICE:** File storage now uses local storage paths by default (`storage/` and `public/uploads/`). If you relied on external buckets, please consult the docs or open an issue to plan migration to your desired storage provider.

## 📦 Novidades - Sistema de Contratação

O sistema agora possui um fluxo completo de contratação automatizado com **separação de contrato e recibo**:

### 🎯 Fluxo de Contratação

1. **Cadastro** - Formulário com dados da empresa e responsável
2. **Seleção de Plano** - Plano Fixo ou Personalizado
3. **Geração de Contrato Neutro** - Focado em prestação de serviço (sem valores)
4. **Aceite Digital** - Com registro de IP e timestamp
5. **Pagamento** - PIX, Boleto ou Cartão (simulado)
6. **Emissão Automática de Recibo** - Documento financeiro completo:
   - Vigência calculada (data pagamento + 364 dias)
   - Valores totais e por funcionário
   - Forma de pagamento detalhada (parcelas, vencimentos)
7. **Login Liberado** - Acesso ao sistema

### 📄 Novidade: Separação Contrato/Recibo

**Implementação:** 22/12/2025 ✨

O sistema agora separa claramente:

- **Contrato:** Documento de prestação de serviço (neutro, sem valores)
- **Recibo:** Documento financeiro (valores, vigência, parcelas)

**Benefícios:**

- ✅ Maior clareza contratual
- ✅ Rastreabilidade financeira completa
- ✅ Flexibilidade para reemitir recibos
- ✅ Conformidade legal melhorada

**Acesso ao recibo:** `/recibo/[id]` (após confirmação de pagamento)

### 📚 Documentação Completa

- [Guia de Contratação](docs/GUIA-CONTRATACAO.md) - Fluxo completo
- [Separação Contrato/Recibo](docs/SEPARACAO-CONTRATO-RECIBO.md) - Documentação técnica (8000+ linhas)
- [Resumo Executivo](docs/RESUMO-EXECUTIVO-RECIBOS.md) - Visão geral da implementação

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 14+ (para desenvolvimento local)
- Conta Vercel (para deploy)
- Conta Neon Console (para produção)

## 🔧 Instalação

### 1. Instalar dependências

```powershell
pnpm install
```

### 2. Configurar Bancos de Dados

#### 🚀 Setup Automático (Recomendado)

Execute o script PowerShell que configura automaticamente os bancos:

```powershell
# Execute no PowerShell como Administrador
.\scripts\powershell\setup-databases.ps1
```

O script irá:

- ✅ Criar banco `nr-bps_db` (desenvolvimento)
- ✅ Criar banco `nr-bps_db_test` (testes)
- ✅ Aplicar schema completo em ambos
- ✅ Inserir usuários de teste
- ✅ Configurar arquivo `.env` automaticamente

#### 🔧 Setup Manual

Se preferir configurar manualmente:

```sql
-- No pgAdmin 4 ou psql, crie os bancos:
CREATE DATABASE nr-bps_db;        -- Desenvolvimento
CREATE DATABASE nr-bps_db_test;   -- Testes
```

Execute o schema em ambos:

```powershell
# Banco de desenvolvimento
psql -U postgres -d nr-bps_db -f database/schema-complete.sql

# Banco de testes
psql -U postgres -d nr-bps_db_test -f database/schema-complete.sql
```

### 3. Configuração de Ambientes

O sistema usa diferentes bancos para cada ambiente:

```bash
# Desenvolvimento (usa nr-bps_db)
NODE_ENV=development
cp .env.development .env

# Testes (usa nr-bps_db_test)
NODE_ENV=test

# Produção (usa Neon)
NODE_ENV=production

# Observação sobre emissão imediata
# Por padrão o sistema executa a emissão imediata dos lotes assim que ficam 'concluido'.
# Para pular essa emissão (apenas em casos de desenvolvimento) defina:
# SKIP_IMMEDIATE_EMISSION=1
# IMPORTANTE: Em produção o valor SKIP_IMMEDIATE_EMISSION será IGNORADO — o sistema sempre tenta emitir imediatamente.
```

#### 🔐 Credenciais do Banco de Dados

Para desenvolvimento e testes locais, use as seguintes credenciais padrão:

- **Usuário:** `postgres`
- **Senha:** `123456`
- **Host:** `localhost`
- **Porta:** `5432`

**Banco de Desenvolvimento:** `nr-bps_db`

```
postgresql://postgres:123456@localhost:5432/nr-bps_db
```

**Banco de Testes:** `nr-bps_db_test`

```
postgresql://postgres:123456@localhost:5432/nr-bps_db_test
```

> **Importante:** Os testes exigem que a variável `TEST_DATABASE_URL` esteja definida e **não** aponte para o banco de desenvolvimento `nr-bps_db`. Se `TEST_DATABASE_URL` não estiver configurada, os testes falharão com erro claro para evitar alterações acidentais no banco de desenvolvimento.

#### Rodando testes localmente

- Recomendado: defina a variável `TEST_DATABASE_URL` em sua sessão PowerShell antes de rodar os testes:

```powershell
$env:TEST_DATABASE_URL = "postgresql://postgres:123456@localhost:5432/nr-bps_db_test"
pnpm test
```

> **Nota:** O usuário padrão do PostgreSQL é `postgres` e a senha é `123456` tanto para o banco de desenvolvimento (`nr-bps_db`) quanto para testes (`nr-bps_db_test`).

- Alternativa rápida (conveniência local): `pnpm run test:local` — este script carrega variáveis de ambiente do arquivo `.env.local` (via `dotenv-cli`) e executa os testes.

```powershell
# Exemplo de `.env.local` (NÃO comite este arquivo)
TEST_DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/nr-bps_db_test"
```

> **Importante:** não existe fallback automático. Se `TEST_DATABASE_URL` não estiver definida, `pnpm test` irá falhar com erro claro para evitar alterações acidentais no banco de desenvolvimento. Em CI, configure `TEST_DATABASE_URL` como secret (ex.: seu provedor CI -> Settings -> Secrets).

### 4. Executar Aplicação

```powershell
# Desenvolvimento
pnpm dev

# Testes
pnpm test

# Build para produção
pnpm build
pnpm start
```

**Acesse:** http://localhost:3000

## 👥 Usuários de Teste

Após o setup dos bancos, estão disponíveis:

| Perfil      | CPF           | Senha | Descrição                                                |
| ----------- | ------------- | ----- | -------------------------------------------------------- |
| **admin**   | `00000000000` | `123` | Administrador - gerencia clínicas e usuários RH/Emissor  |
| **rh**      | `11111111111` | `123` | Gestor RH - gerencia empresas, funcionários e avaliações |
| **emissor** | `33333333333` | `123` | Emissor de Laudos - emite relatórios técnicos            |

> **Nota:** O perfil `funcionario` realiza avaliações e não tem acesso ao painel administrativo.

## 🗄️ Estrutura do Banco

- `funcionarios` - Cadastro de usuários
- `avaliacoes` - Registros de avaliações
- `respostas` - Respostas individuais
- `resultados` - Scores calculados

## 📊 Grupos de Avaliação

1. **Demandas no Trabalho** (11 itens)
2. **Organização e Conteúdo** (8 itens)
3. **Relações Interpessoais** (9 itens)
4. **Interface Trabalho-Indivíduo** (6 itens)
5. **Valores no Trabalho** (8 itens)
6. **Personalidade** (5 itens - opcional)
7. **Saúde e Bem-Estar** (8 itens)
8. **Comportamentos Ofensivos** (3 itens)
9. **Jogos de Apostas** (6 itens)
10. **Endividamento** (6 itens)

## 🧪 Testes e Qualidade

### Estratégia de Testes

O projeto utiliza uma abordagem abrangente de testes com foco em qualidade:

- **Testes Unitários**: Componentes, hooks, utilitários
- **Testes de Integração**: APIs, fluxos completos
- **Testes E2E**: Cypress para fluxos críticos
- **Cobertura**: > 80% alvo

### Scripts de Teste

```bash
pnpm test              # Todos os testes unitários/integração
pnpm test:watch        # Modo watch para desenvolvimento
pnpm test:coverage     # Com relatório de cobertura
pnpm test:e2e          # Testes end-to-end
pnpm test:all          # Unitários + E2E
```

### 🛡️ Política de Mocks

O sistema segue uma **Política de Mocks** padronizada para garantir consistência e qualidade nos testes:

- **Padrão Documentado**: `docs/testing/MOCKS_POLICY.md`
- **Helpers Padronizados**: `__tests__/lib/test-helpers.ts`
- **Validador Automático**: `pnpm validate:mocks`

**Benefícios:**

- ✅ Diagnóstico rápido de falhas
- ✅ Mocks consistentes e confiáveis
- ✅ Processo padronizado de correção
- ✅ Qualidade garantida nos testes

**Validação:**

```bash
# Validar todos os testes
pnpm validate:mocks

# Validar arquivo específico
pnpm validate:mocks __tests__/login.test.tsx
```

## 🚀 Deploy na Vercel

### 1. Conectar repositório

```powershell
git init
git add .
git commit -m "Initial commit"
git remote add origin seu_repositorio
git push -u origin main
```

### 2. Configurar Vercel

1. Acesse https://vercel.com
2. Importe o repositório
3. Configure as variáveis de ambiente:
   - `DATABASE_URL` (URL do Neon)
   - `SESSION_SECRET`
   - `NODE_ENV=production`

### 3. Deploy

```powershell
vercel --prod
```

## 📚 Documentação Adicional

- [🗄️ Configuração dos Bancos de Dados](docs/DATABASE_SETUP.md)
- [🛠️ Guia de Desenvolvimento](docs/DEVELOPMENT_GUIDE.md)
- [📋 Questionário COPSOQ III](docs/SOBRE-COPSOQ.md)
- [🎰 Módulos JZ e EF](docs/SOBRE-COPSOQ.md)
- [📖 Guia de Uso](docs/GUIA-DE-USO.md)
- [🚀 Guia de Deploy](docs/DEPLOY-INSTRUCOES.md)
- [🔧 Troubleshooting](docs/INDEX.md)
- [📋 Checklist do Projeto](docs/checklists/CHECKLIST.md)
- [📚 Índice de Documentação](docs/INDEX.md)
- [⚙️ Configuração de Anexos em Produção](docs/CONFIGURACAO-PRODUCAO-ANEXOS.md)

## 🔐 Variáveis de Ambiente Importantes

### NEXT_PUBLIC_DISABLE_ANEXOS

**Status:** ⚠️ Temporariamente habilitado  
**Propósito:** Desabilitar upload obrigatório de anexos no cadastro de tomadores

- **Desenvolvimento:** Configurada em `.env.local`
- **Produção:** Deve ser configurada na Vercel (Settings → Environment Variables)

⚠️ **IMPORTANTE:** Após alterar variáveis `NEXT_PUBLIC_*` na Vercel, é **obrigatório fazer um novo deploy** para que as mudanças tenham efeito (essas variáveis são incorporadas no bundle durante o build).

📖 [Ver documentação completa sobre configuração de anexos](docs/CONFIGURACAO-PRODUCAO-ANEXOS.md)

## 📱 PWA - Instalação

O aplicativo pode ser instalado em dispositivos móveis e desktops:

1. Acesse o site
2. Clique em "Instalar" no navegador
3. O app funcionará offline após a primeira visita

---

## ⚙️ Configurações Técnicas

### Ambientes de Banco de Dados

| Ambiente            | Banco            | URL                                                          | Uso                           |
| ------------------- | ---------------- | ------------------------------------------------------------ | ----------------------------- |
| **Desenvolvimento** | `nr-bps_db`      | `postgresql://postgres:123456@localhost:5432/nr-bps_db`      | Desenvolvimento local         |
| **Testes**          | `nr-bps_db_test` | `postgresql://postgres:123456@localhost:5432/nr-bps_db_test` | Testes automatizados          |
| **Produção**        | Neon Cloud       | Via `DATABASE_URL`                                           | Deploy (plataforma escolhida) |

### Scripts Disponíveis

```bash
pnpm dev          # Servidor desenvolvimento (porta 3000)
pnpm test            # Executar testes (usa banco de testes)
pnpm build       # Build para produção
pnpm start           # Executar build local
pnpm run lint        # Verificar código
```

## 🔒 Segurança

- Senhas com hash bcrypt
- Sessões via cookies httpOnly
- Sem JWT no MVP (simplificado)
- SQL preparado (previne injection)
- HTTPS obrigatório em produção

> **⚠️ Nota sobre segredos:** Recentemente valores sensíveis (URLs de banco e chaves) foram encontrados em arquivos de ambiente e substituídos por _placeholders_ no repositório. Se você utilizou chaves reais que foram commitadas, _rote suas chaves imediatamente_ e mova valores sensíveis para o provedor de segredos do seu CI/CD (ex.: Vercel, GitHub Secrets). Use ` .env.example` como template e mantenha arquivos locais (ex.: `.env.local`) fora do controle de versão.

## 📄 Importar Funcionários (Excel)

Formato do arquivo Excel (.xlsx):

```
cpf,nome,setor,funcao,email,perfil
12345678901,João Silva,TI,Desenvolvedor,joao@empresa.com,funcionario
98765432100,Maria Santos,RH,Gestora,maria@empresa.com,rh
```

Acesse: `/admin` → "Escolher Arquivo Excel (.xlsx)"

## 🛠️ Tecnologias

- **Frontend**: React 19 + Next.js 14 + TypeScript
- **Styling**: Tailwind CSS
- **Estado**: Zustand
- **Offline**: IndexedDB + Service Worker
- **Backend**: Vercel API Routes (Serverless)
- **Banco**: Neon PostgreSQL / PostgreSQL Local
- **Gráficos**: Chart.js + react-chartjs-2
- **PDF/Excel**: jsPDF + XLSX

## � Organização do Projeto

O projeto foi reorganizado em **24/12/2025** para melhor manutenibilidade:

### Estrutura de Pastas

```
QWork/
├── app/              # Next.js App Router
├── components/       # Componentes React
├── lib/              # Utilitários e bibliotecas
├── database/         # Schema e migrations
├── scripts/          # Scripts organizados por categoria
│   ├── checks/      # Verificações e diagnóstico
│   ├── tests/       # Testes ad-hoc
│   ├── fixes/       # Correções pontuais
│   ├── analysis/    # Análises e relatórios
│   └── powershell/  # Scripts PowerShell principais
├── docs/             # Documentação organizada
│   ├── policies/    # Políticas e convenções
│   ├── guides/      # Guias práticos
│   └── corrections/ # Relatórios de correções
├── __tests__/        # Testes Jest
└── cypress/          # Testes E2E
```

**Documentação completa da organização:** [LIMPEZA-2025-12-24.md](LIMPEZA-2025-12-24.md)

### Scripts Úteis

```bash
# Verificações
node scripts/checks/check-db-status.cjs
node scripts/checks/check-full-state.cjs

# Setup inicial (PowerShell Admin)
.\scripts\powershell\setup-databases.ps1

# Sync Dev → Prod (PowerShell)
.\scripts\powershell\sync-dev-to-prod.ps1
```

## �📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de TI.

---

**Qwork** © 2024 - Sistema de Avaliação Psicossocial COPSOQ III
