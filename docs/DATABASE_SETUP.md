# Configuração dos Bancos de Dados - Qwork

Este documento detalha a configuração dos bancos de dados PostgreSQL para o sistema Qwork.

## 📋 Visão Geral

O sistema utiliza **3 ambientes** diferentes com bancos separados:

| Ambiente            | Banco            | Variável ENV         | Uso                   |
| ------------------- | ---------------- | -------------------- | --------------------- |
| **Desenvolvimento** | `nr-bps_db`      | `LOCAL_DATABASE_URL` | Desenvolvimento local |
| **Testes**          | `nr-bps_db_test` | `TEST_DATABASE_URL`  | Execução de testes    |
| **Produção**        | Neon Cloud       | `DATABASE_URL`       | Deploy na plataforma de produção      |

## 🗄️ Configuração PostgreSQL Local

### Pré-requisitos

- PostgreSQL 14+ instalado
- pgAdmin 4 (interface gráfica)
- Usuário `postgres` com senha `123456`

### Bancos Criados

```sql
-- Banco de desenvolvimento
CREATE DATABASE "nr-bps_db";

-- Banco de testes
CREATE DATABASE "nr-bps_db_test";
```

### URLs de Conexão

```bash
# Desenvolvimento
LOCAL_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db

# Testes
TEST_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db_test

# Produção (Neon)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
```

## 📁 Arquivos de Configuração

### `.env.development`

```env
NODE_ENV=development
LOCAL_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db
SESSION_SECRET=development_secret_key_32_chars
```

### `.env.test`

```env
NODE_ENV=test
TEST_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db_test
SESSION_SECRET=test_secret_key_32_characters
```

### `.env.production` (produção)

```env
NODE_ENV=production
DATABASE_URL=sua_url_neon_aqui
SESSION_SECRET=production_secret_key_32_chars
```

## 🔄 Lógica de Seleção do Banco

O arquivo `lib/db.ts` detecta automaticamente o ambiente e seleciona o banco apropriado:

```typescript
// Detecção de ambiente
const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";
const isProduction = process.env.NODE_ENV === "production";

// Seleção da URL do banco
let databaseUrl: string;

if (isDevelopment && process.env.LOCAL_DATABASE_URL) {
  databaseUrl = process.env.LOCAL_DATABASE_URL;
} else if (isTest && process.env.TEST_DATABASE_URL) {
  databaseUrl = process.env.TEST_DATABASE_URL;
} else if (process.env.DATABASE_URL) {
  databaseUrl = process.env.DATABASE_URL;
} else {
  throw new Error("Nenhuma URL de banco configurada");
}
```

## 🚀 Setup Automático

### Script PowerShell

Execute `.\scripts\powershell\setup-databases.ps1` para:

1. **Verificar** PostgreSQL instalado
2. **Criar** bancos `nr-bps_db` e `nr-bps_db_test`
3. **Aplicar** schema completo em ambos
4. **Inserir** usuários de teste
5. **Configurar** arquivo `.env` automaticamente

### Comandos do Script

```powershell
# Criar bancos
psql -U postgres -c "CREATE DATABASE \"nr-bps_db\";"
psql -U postgres -c "CREATE DATABASE \"nr-bps_db_test\";"

# Aplicar schema
psql -U postgres -d nr-bps_db -f database/schema-complete.sql
psql -U postgres -d nr-bps_db_test -f database/schema-complete.sql

# Copiar configuração
Copy-Item ".env.development" ".env"
```

## 📊 Schema do Banco

### Tabelas Principais

- **funcionarios** - Usuários do sistema (admin, rh, funcionario)
- **avaliacoes** - Registros de avaliações COPSOQ III
- **respostas** - Respostas individuais para cada item
- **resultados** - Scores calculados por grupo

### Dados Iniciais

Cada banco recebe usuários de teste:

```sql
INSERT INTO funcionarios VALUES
('00000000000', 'Admin Sistema', 'admin@bps.com.br', '$2b$10$...', 'admin'),
('11111111111', 'Gerente RH', 'rh@bps.com.br', '$2b$10$...', 'rh'),
('22222222222', 'João Funcionário', 'funcionario@bps.com.br', '$2b$10$...', 'funcionario');
```

## 🧪 Executando Testes

```bash
# Testes usam automaticamente nr-bps_db_test
npm test

# Para rodar testes específicos
npm test -- --testNamePattern="Auth"
```

## 🔧 Comandos Úteis

### Verificar Conexões

```bash
# Listar bancos
psql -U postgres -l

# Conectar ao banco
psql -U postgres -d nr-bps_db

# Ver tabelas
\dt

# Ver usuários
SELECT cpf, nome, email, perfil FROM funcionarios;
```

### Reset dos Bancos

```bash
# Recriar banco de desenvolvimento
psql -U postgres -c "DROP DATABASE IF EXISTS \"nr-bps_db\";"
psql -U postgres -c "CREATE DATABASE \"nr-bps_db\";"
psql -U postgres -d nr-bps_db -f database/schema-complete.sql

# Recriar banco de testes
psql -U postgres -c "DROP DATABASE IF EXISTS \"nr-bps_db_test\";"
psql -U postgres -c "CREATE DATABASE \"nr-bps_db_test\";"
psql -U postgres -d nr-bps_db_test -f database/schema-complete.sql
```

## 📝 Troubleshooting

### Erro: "database does not exist"

```bash
# Verificar se os bancos existem
psql -U postgres -l | grep nr-bps

# Recriar se necessário
.\scripts\powershell\setup-databases.ps1
```

### Erro: "authentication failed"

```bash
# Verificar credenciais no .env
cat .env | grep DATABASE_URL

# Testar conexão manual
psql -U postgres -h localhost -p 5432
```

### Erro: "relation does not exist"

```bash
# Verificar se schema foi aplicado
psql -U postgres -d nr-bps_db -c "\dt"

# Reaplicar schema
psql -U postgres -d nr-bps_db -f database/schema-complete.sql
```

## 🔒 Segurança

- Senhas hasheadas com bcrypt (rounds: 10)
- Sessões com cookies httpOnly e secure
- Variáveis de ambiente para credenciais
- Separação de ambientes (dev/test/prod)
- SSL requerido em produção (Neon)

---

**Nota:** Mantenha sempre as senhas e secrets seguros. Nunca commit arquivos `.env` no repositório!
