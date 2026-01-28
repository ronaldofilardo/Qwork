# Guia de Ambiente de Desenvolvimento - Qwork

Este documento fornece instruções completas para configurar o ambiente de desenvolvimento local.

## 🎯 Objetivos

- ✅ Configurar PostgreSQL local com 2 bancos (desenvolvimento e testes)
- ✅ Instalar dependências Node.js
- ✅ Configurar variáveis de ambiente
- ✅ Executar a aplicação em modo desenvolvimento
- ✅ Executar testes automatizados

## 📋 Checklist de Instalação

### ☑️ 1. Pré-requisitos

- [ ] **Node.js 18+** instalado ([download](https://nodejs.org/))
- [ ] **PostgreSQL 14+** instalado ([pgAdmin 4](https://www.pgadmin.org/download/))
- [ ] **PowerShell** (Windows - já incluído)
- [ ] **Git** instalado ([download](https://git-scm.com/))

### ☑️ 2. Clone e Dependências

```powershell
# Clone o repositório
git clone [URL_DO_REPO]
cd nr-bps

# Instalar dependências
npm install
```

### ☑️ 3. Setup Automático dos Bancos

**Opção Recomendada:**

```powershell
# Execute como Administrador no PowerShell
.\scripts\powershell\setup-databases.ps1
```

O script irá:

- ✅ Criar banco `nr-bps_db` (desenvolvimento)
- ✅ Criar banco `nr-bps_db_test` (testes)
- ✅ Aplicar schema em ambos
- ✅ Inserir usuários de teste
- ✅ Configurar `.env` automaticamente

### ☑️ 4. Verificação da Instalação

```powershell
# Verificar se bancos foram criados
psql -U postgres -l | findstr nr-bps

# Verificar tabelas
psql -U postgres -d nr-bps_db -c "\dt"

# Verificar usuários de teste
psql -U postgres -d nr-bps_db -c "SELECT cpf, nome, perfil FROM funcionarios;"
```

### ☑️ 5. Executar Aplicação

```powershell
# Modo desenvolvimento (nr-bps_db)
npm run dev
```

**Acesse:** http://localhost:3000

### ☑️ 6. Testar Login

> ⚠️ **IMPORTANTE:** As credenciais abaixo são apenas para ambiente de DESENVOLVIMENTO.
> Em produção, utilize credenciais únicas e seguras.

Consulte o banco de dados ou arquivo de configuração interno para as credenciais de teste.

| Perfil      | Acesso                        |
| ----------- | ----------------------------- |
| Admin       | Gestão de usuários e clínicas |
| RH          | Gestão + Relatórios           |
| Funcionário | Apenas avaliações             |

## 🛠️ Comandos de Desenvolvimento

### Desenvolvimento

```powershell
# Iniciar servidor de desenvolvimento
npm run dev

# Servidor estará em: http://localhost:3000
# Hot reload ativo (mudanças automáticas)
```

### Testes

```powershell
# Executar todos os testes (usa nr-bps_db_test)
npm test

# Executar testes específicos
npm test -- --testNamePattern="Login"

# Executar em modo watch
npm test -- --watch
```

### Build

```powershell
# Build para produção
npm run build

# Executar build local
npm start
```

### Linting

```powershell
# Verificar código
npm run lint

# Corrigir automaticamente
npm run lint:fix
```

## 📁 Estrutura do Projeto

```
nr-bps/
├── 📁 pages/               # Páginas Next.js
│   ├── api/               # API Routes
│   ├── auth/              # Autenticação
│   ├── dashboard/         # Dashboards
│   └── avaliacao/         # Sistema de avaliação
├── 📁 components/         # Componentes React
│   ├── ui/               # Componentes de interface
│   ├── forms/            # Formulários
│   └── charts/           # Gráficos
├── 📁 lib/               # Utilitários
│   ├── db.ts             # Conexão banco
│   ├── auth.ts           # Autenticação
│   └── copsoq.ts         # Questionário COPSOQ
├── 📁 database/          # Scripts SQL
├── 📁 docs/              # Documentação
├── 📄 .env.development   # Env desenvolvimento
├── 📄 .env.test          # Env testes
└── 📄 scripts/powershell/setup-databases.ps1 # Script setup
```

## 🔧 Configurações de Ambiente

### Arquivos `.env`

```bash
# .env (desenvolvimento - criado automaticamente)
NODE_ENV=development
LOCAL_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db
SESSION_SECRET=development_secret_key_32_chars

# .env.test (testes)
NODE_ENV=test
TEST_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db_test
SESSION_SECRET=test_secret_key_32_characters
```

### Seleção Automática do Banco

O sistema seleciona automaticamente o banco baseado em `NODE_ENV`:

- **development** → `nr-bps_db`
- **test** → `nr-bps_db_test`
- **production** → Neon (via `DATABASE_URL`)

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"

```powershell
# Verificar se PostgreSQL está rodando
Get-Service postgresql*

# Testar conexão manual
psql -U postgres -h localhost
```

### Erro: "Database does not exist"

```powershell
# Reexecutar setup
.\scripts\powershell\setup-databases.ps1

# Ou criar manualmente
psql -U postgres -c "CREATE DATABASE \"nr-bps_db\";"
```

### Erro: "Port 3000 already in use"

```powershell
# Verificar processo na porta
netstat -ano | findstr :3000

# Matar processo (substitua PID)
taskkill /PID <PID> /F

# Ou usar outra porta
npm run dev -- -p 3001
```

### Erro: "Authentication failed for user postgres"

```powershell
# Verificar senha no .env
type .env | findstr DATABASE_URL

# Reconfigurar senha PostgreSQL via pgAdmin
```

## 📊 Monitoramento de Performance

### Logs de Desenvolvimento

```powershell
# Logs do Next.js (terminal do npm run dev)
# Logs do banco (verificar conexões)
# Logs de erro (console do browser)
```

### Métricas de Banco

```sql
-- Verificar conexões ativas
SELECT datname, usename, state, query
FROM pg_stat_activity
WHERE datname IN ('nr-bps_db', 'nr-bps_db_test');

-- Tamanho dos bancos
SELECT datname, pg_size_pretty(pg_database_size(datname)) as size
FROM pg_database
WHERE datname LIKE 'nr-bps%';
```

## 🔄 Fluxo de Desenvolvimento

1. **Iniciar desenvolvimento:**

   ```powershell
   npm run dev
   ```

2. **Fazer alterações** no código

3. **Testar alterações:**

   ```powershell
   npm test
   ```

4. **Commit e push:**

   ```bash
   git add .
   git commit -m "feat: nova funcionalidade"
   git push origin main
   ```

5. **Deploy automático** no Vercel (produção)

## 🎨 Desenvolvimento de Interface

### Tailwind CSS

- Classes utilitárias para styling
- Responsivo por padrão
- Customização via `tailwind.config.js`

### Componentes

- Reutilizáveis em `components/ui/`
- Props tipadas com TypeScript
- Documentação inline

### Ícones

- **Lucide React** para ícones
- Import apenas necessários
- Consistência visual

## 📱 PWA Development

### Service Worker

```bash
# Arquivo gerado automaticamente
public/sw.js

# Registrado em pages/_app.tsx
# Cache de recursos offline
```

### Manifest

```bash
# Configuração PWA
public/manifest.json

# Ícones e configurações de instalação
```

---

**🚀 Pronto!** Seu ambiente de desenvolvimento está configurado e funcionando.

**Próximos passos:**

1. Explore o código em `pages/` e `components/`
2. Teste as funcionalidades com os usuários criados
3. Consulte a documentação em `docs/` para detalhes
