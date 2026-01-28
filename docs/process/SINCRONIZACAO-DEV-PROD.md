# Guia de Sincronização - Desenvolvimento para Produção

## 📋 Visão Geral

Este guia explica como garantir que o ambiente de **produção** funcione exatamente como o ambiente de **desenvolvimento**, com os mesmos dados, usuários, clínicas, empresas e avaliações.

## 🎯 Objetivo

Sincronizar completamente os dados do banco de desenvolvimento (PostgreSQL local) para o banco de produção (Neon Database), garantindo que:

1. ✅ As tabelas tenham a mesma estrutura (schema)
2. ✅ Os dados sejam idênticos (clínicas, empresas, funcionários, avaliações)
3. ✅ As APIs funcionem da mesma forma em ambos os ambientes
4. ✅ Os mesmos logins e senhas funcionem em produção

---

## 🔧 Configuração Atual

### Desenvolvimento (.env.development)

```env
NODE_ENV=development
LOCAL_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db
SESSION_SECRET=bps-brasil-dev-secret-32-chars-here
```

### Produção (.env.production)

```env
NODE_ENV=production
DATABASE_URL=postgresql://neondb_owner:npg_NfJGO8vck9ob@ep-steep-credit-acckkvg4-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SESSION_SECRET=seu-secret-super-seguro-aqui-com-32-caracteres
```

---

## 📦 Scripts Disponíveis

### 1. `scripts/powershell/verify-environments.ps1` - Verificação de Ambientes

**Uso:**

```powershell
.\scripts\powershell\verify-environments.ps1
```

**O que faz:**

- ✅ Verifica arquivos de configuração (.env.development, .env.production)
- ✅ Testa conexões com bancos de dados (local e Neon)
- ✅ Compara quantidade de registros em cada tabela
- ✅ Lista usuários padrão em ambos os ambientes

**Quando usar:** Antes de sincronizar, para ver o estado atual dos ambientes.

---

### 2. `scripts/powershell/sync-dev-to-prod.ps1` - Sincronização Completa

**Uso:**

```powershell
.\scripts\powershell\sync-dev-to-prod.ps1
```

**O que faz:**

1. 📤 Exporta o schema do banco de desenvolvimento
2. 📤 Exporta todos os dados (clínicas, empresas, funcionários, avaliações)
3. 🗑️ Remove dados antigos do banco de produção
4. 📥 Aplica o schema no banco de produção
5. 📥 Importa todos os dados para produção
6. 🔄 Atualiza as sequences (IDs auto-incrementais)
7. ✅ Verifica a sincronização

**Quando usar:** Quando você quer copiar TODOS os dados de dev para prod.

**⚠️ ATENÇÃO:** Este script substitui TODOS os dados em produção!

---

### 3. `scripts/powershell/sync-neon-db.ps1` - Aplicar Schema

**Uso:**

```powershell
.\scripts\powershell\sync-neon-db.ps1
```

**O que faz:**

- Aplica apenas o arquivo `schema-clean-final.sql` no banco Neon
- Útil para atualizar a estrutura das tabelas sem alterar dados

**Quando usar:** Quando você altera a estrutura das tabelas (adiciona colunas, índices, etc.)

---

## 🚀 Passo a Passo: Sincronizar Dev → Prod

### 1️⃣ Verificar Estado Atual

```powershell
.\scripts\powershell\verify-environments.ps1
```

Você verá:

- Status das conexões
- Quantidade de registros em cada tabela
- Diferenças entre dev e prod

### 2️⃣ Fazer Backup (Opcional mas Recomendado)

Antes de sincronizar, você pode fazer um dump do banco de produção:

```powershell
$env:PGPASSWORD = "npg_NfJGO8vck9ob"
pg_dump "postgresql://neondb_owner:npg_NfJGO8vck9ob@ep-steep-credit-acckkvg4-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" > backup_prod_$(Get-Date -Format 'yyyy-MM-dd_HH-mm').sql
```

### 3️⃣ Executar Sincronização

```powershell
.\scripts\powershell\sync-dev-to-prod.ps1
```

O script irá:

- Exportar dados de desenvolvimento
- Limpar banco de produção
- Importar todos os dados
- Verificar a sincronização

### 4️⃣ Verificar Resultado

```powershell
.\scripts\powershell\verify-environments.ps1
```

Agora, as quantidades de registros devem ser IGUAIS em dev e prod.

### 5️⃣ Testar em Produção

Acesse a aplicação em produção:

```
https://nr-bps-popup-clean.vercel.app
```

Faça login com as mesmas credenciais de desenvolvimento:

- **Admin:** CPF `11111111111` | Senha: `admin123`
- **RH:** CPF `22222222222` | Senha: `rh123`

---

## 🔍 Como as APIs Funcionam

### Detecção Automática de Ambiente

O arquivo `lib/db.ts` detecta automaticamente o ambiente:

```typescript
const environment = process.env.NODE_ENV || "development";
const isDevelopment = environment === "development";
const isProduction = environment === "production";
```

### Conexão Correta

- **Desenvolvimento:** Usa `LOCAL_DATABASE_URL` com PostgreSQL local
- **Produção:** Usa `DATABASE_URL` com Neon Database

### Todas as APIs Usam a Mesma Função

```typescript
import { query } from "@/lib/db";

// Funciona em dev e prod automaticamente
const result = await query("SELECT * FROM funcionarios WHERE cpf = $1", [cpf]);
```

**Não há hardcode de URLs ou configurações específicas nas APIs!**

---

## 📊 Estrutura de Dados

### Tabelas Principais

1. **clinicas** - Clínicas cadastradas no sistema
2. **empresas_clientes** - Empresas vinculadas às clínicas
3. **funcionarios** - Usuários do sistema (admin, rh, funcionario)
4. **avaliacoes** - Avaliações COPSOQ iniciadas
5. **respostas** - Respostas às questões
6. **resultados** - Scores calculados por domínio
7. **lotes_avaliacao** - Ciclos de Coletas Avaliativas em massa
8. **laudos** - Laudos emitidos

---

## ⚙️ Requisitos

### Ferramentas Necessárias

- ✅ PowerShell (já vem com Windows)
- ✅ PostgreSQL Client Tools (psql, pg_dump)

### Instalar PostgreSQL Client Tools

Se você não tem o `psql` instalado:

1. Baixe o instalador: https://www.postgresql.org/download/windows/
2. Durante a instalação, selecione apenas "Command Line Tools"
3. Reinicie o PowerShell após a instalação

### Verificar Instalação

```powershell
psql --version
pg_dump --version
```

---

## 🐛 Solução de Problemas

### Erro: "psql não encontrado"

**Solução:** Instale o PostgreSQL Client Tools (veja seção acima)

### Erro ao conectar no banco local

**Solução:**

1. Verifique se o PostgreSQL está rodando: `Get-Service postgresql*`
2. Se não estiver, inicie: `Start-Service postgresql-x64-XX`

### Erro ao conectar no Neon

**Solução:**

1. Verifique sua conexão com a internet
2. Confirme as credenciais no `.env.production`
3. Teste manualmente:

```powershell
$env:PGPASSWORD = "npg_NfJGO8vck9ob"
psql "postgresql://neondb_owner:npg_NfJGO8vck9ob@ep-steep-credit-acckkvg4-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT NOW();"
```

### Dados não sincronizaram

**Solução:**

1. Execute `.\scripts\powershell\verify-environments.ps1` para ver o estado
2. Execute `.\scripts\powershell\sync-dev-to-prod.ps1` novamente
3. Verifique os logs do script para mensagens de erro

---

## 📝 Checklist de Sincronização

Antes de sincronizar:

- [ ] ✅ Banco de desenvolvimento tem os dados corretos
- [ ] ✅ Fez backup do banco de produção (opcional)
- [ ] ✅ PostgreSQL Client Tools está instalado
- [ ] ✅ Conexões com ambos os bancos estão funcionando

Durante a sincronização:

- [ ] ✅ Executou `verify-environments.ps1`
- [ ] ✅ Executou `sync-dev-to-prod.ps1`
- [ ] ✅ Script finalizou sem erros

Após a sincronização:

- [ ] ✅ Executou `verify-environments.ps1` novamente
- [ ] ✅ Quantidades de registros são iguais
- [ ] ✅ Testou login em produção
- [ ] ✅ APIs estão funcionando corretamente

---

## 🎓 Dicas Importantes

### 1. Sincronização Periódica

Se você adiciona dados no desenvolvimento e quer atualizá-los em produção:

```powershell
.\scripts\powershell\sync-dev-to-prod.ps1
```

### 2. Apenas Atualizar Schema

Se você só alterou a estrutura das tabelas (sem novos dados):

```powershell
.\scripts\powershell\sync-neon-db.ps1
```

### 3. Deploy Automático no Vercel

Sempre que você faz `git push` para o repositório, o Vercel:

1. Detecta o ambiente de produção
2. Usa automaticamente o `.env.production`
3. Conecta no banco Neon
4. As APIs funcionam com os dados de produção

### 4. Variáveis de Ambiente no Vercel

O Vercel já tem as variáveis configuradas:

- `NODE_ENV=production`
- `DATABASE_URL=[string de conexão Neon]`
- `SESSION_SECRET=[secret de produção]`

**Não é necessário configurar nada manualmente no Vercel!**

---

## 📞 Suporte

Se algo não funcionar:

1. Execute `.\scripts\powershell\verify-environments.ps1` e anote os erros
2. Verifique os logs do PowerShell
3. Confirme que os arquivos `.env` estão corretos
4. Teste as conexões manualmente com `psql`

---

## ✅ Resultado Esperado

Após seguir este guia:

✅ Banco de produção tem os mesmos dados que desenvolvimento  
✅ Mesmos usuários, clínicas, empresas e avaliações  
✅ APIs funcionam identicamente em ambos os ambientes  
✅ Login funciona com as mesmas credenciais  
✅ Todos os testes passam em produção

**Produção = Desenvolvimento! 🎉**

