# 🚀 Guia Rápido - Verificação e Correção de Senhas de Gestores

## ⚡ TL;DR (Para Pressa)

```bash
# Verificar se todos os gestores têm senhas
node scripts/verify-gestores-senhas.cjs

# Se encontrar problemas, o script cria as senhas automaticamente
```

---

## 📋 Cenários Comuns

### Cenário 1: Gestor não consegue fazer login

**Sintoma:** CPF e senha aparentemente corretos, mas login falha.

**Solução Rápida:**

```bash
# 1. Verificar se senha existe no banco
node -e "
const {Client} = require('pg');
const client = new Client({connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db'});
client.connect().then(() => {
  return client.query('SELECT * FROM entidades_senhas WHERE cpf = \$1', ['SEU_CPF_AQUI']);
}).then(res => {
  console.log(res.rows.length > 0 ? '✅ Senha existe' : '❌ Senha não existe');
  process.exit(0);
});
"

# 2. Se não existir, rodar verificação geral
node scripts/verify-gestores-senhas.cjs
```

---

### Cenário 2: Contratante aprovado recentemente

**Ação Preventiva:**

```bash
# Após aprovar um contratante, sempre executar:
node scripts/verify-gestores-senhas.cjs
```

**Isso garante que:**

- Senha foi criada corretamente
- Hash está no formato bcrypt correto (60 caracteres)
- Funcionário está vinculado ao contratante

---

### Cenário 3: Verificação Periódica

**Recomendação:** Executar semanalmente (ou após lote de aprovações)

```bash
# Verificação manual
node scripts/verify-gestores-senhas.cjs

# OU criar job no cron/task scheduler
# Windows: criar tarefa agendada
# Linux/Mac: adicionar ao crontab
# 0 9 * * 1  cd /caminho/QWork && node scripts/verify-gestores-senhas.cjs
```

---

## 🔍 Comandos de Diagnóstico

### Verificar senha específica

```bash
# Criar arquivo temporário: check-senha.cjs
cat > check-senha.cjs << 'EOF'
const {Client} = require('pg');
const bcrypt = require('bcryptjs');

const CPF = process.argv[2];
const SENHA = process.argv[3];

if (!CPF || !SENHA) {
  console.log('Uso: node check-senha.cjs CPF SENHA');
  process.exit(1);
}

const client = new Client({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db'
});

client.connect()
  .then(() => client.query(
    'SELECT senha_hash FROM entidades_senhas WHERE cpf = $1',
    [CPF]
  ))
  .then(async res => {
    if (res.rows.length === 0) {
      console.log('❌ CPF não encontrado');
      return;
    }
    const valida = await bcrypt.compare(SENHA, res.rows[0].senha_hash);
    console.log(valida ? '✅ Senha CORRETA' : '❌ Senha INCORRETA');
  })
  .finally(() => client.end());
EOF

# Executar
node check-senha.cjs 87545772920 000170
```

---

### Listar todos os contratantes e status de senha

```bash
node -e "
const {Client} = require('pg');
const client = new Client({connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db'});
client.connect().then(() => {
  return client.query(\`
    SELECT c.id, c.cnpj, c.responsavel_nome, c.responsavel_cpf,
           CASE WHEN cs.senha_hash IS NULL THEN '❌' ELSE '✅' END as senha
    FROM contratantes c
    LEFT JOIN entidades_senhas cs ON cs.contratante_id = c.id
    WHERE c.status = 'aprovado' AND c.ativa = true
    ORDER BY c.id
  \`);
}).then(res => {
  console.table(res.rows);
  process.exit(0);
});
"
```

---

## 🛠️ Correção Manual (Caso Necessário)

### Criar senha para gestor específico

```javascript
// fix-senha-manual.cjs
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const CONTRATANTE_ID = 39;
const CPF = '87545772920';
const CNPJ = '02494916000170';

const cnpjLimpo = CNPJ.replace(/[./-]/g, '');
const senha = cnpjLimpo.slice(-6);

const client = new Client({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

async function fix() {
  await client.connect();

  const hash = await bcrypt.hash(senha, 10);

  // Inserir/atualizar senha
  await client.query(
    `
    INSERT INTO entidades_senhas (contratante_id, cpf, senha_hash)
    VALUES ($1, $2, $3)
    ON CONFLICT (contratante_id, cpf) 
    DO UPDATE SET senha_hash = EXCLUDED.senha_hash
  `,
    [CONTRATANTE_ID, CPF, hash]
  );

  // Atualizar funcionarios
  await client.query(
    `
    UPDATE funcionarios 
    SET contratante_id = $1, senha_hash = $2 
    WHERE cpf = $3
  `,
    [CONTRATANTE_ID, hash, CPF]
  );

  console.log(`✅ Senha criada: ${senha}`);

  await client.end();
}

fix();
```

---

## 📊 Validação Pós-Correção

```bash
# 1. Verificar no banco
node check-gestor-02494916000170.cjs

# 2. Testar login via API (se servidor estiver rodando)
node test-login-gestor-87545772920.cjs

# 3. Verificar integridade geral
node scripts/verify-gestores-senhas.cjs
```

---

## 🔄 Workflow Recomendado

### Após Cadastro de Novo Contratante

```
1. Aprovar contratante via admin
2. Executar: node scripts/verify-gestores-senhas.cjs
3. Informar gestor da senha (últimos 6 dígitos do CNPJ)
4. Gestor faz primeiro login
5. Gestor altera senha (futuro: implementar troca obrigatória)
```

---

## 🚨 Troubleshooting

### "Erro: Connection timeout"

```bash
# Verificar se PostgreSQL está rodando
psql -U postgres -d nr-bps_db -c "SELECT version();"
```

### "Senha não confere"

```bash
# Verificar qual senha está sendo usada
node -e "console.log('02494916000170'.replace(/[./-]/g, '').slice(-6));"
# Output esperado: 000170
```

### "Contratante não encontrado"

```bash
# Listar todos os contratantes
psql -U postgres -d nr-bps_db -c "SELECT id, cnpj, responsavel_cpf FROM contratantes WHERE ativa = true;"
```

---

## 📚 Documentação Completa

- **Análise Técnica:** [docs/ANALISE-AUTENTICACAO-GESTOR-02494916000170.md](./ANALISE-AUTENTICACAO-GESTOR-02494916000170.md)
- **Boas Práticas:** [docs/GUIA-BOAS-PRATICAS-TESTES.md](./GUIA-BOAS-PRATICAS-TESTES.md)
- **Resumo Executivo:** [docs/RESUMO-CORRECAO-AUTENTICACAO-2025-12-24.md](./RESUMO-CORRECAO-AUTENTICACAO-2025-12-24.md)

---

## ✅ Checklist Rápido

Antes de reportar problema de autenticação:

- [ ] Senha é os 6 últimos dígitos do CNPJ? (sem formatação)
- [ ] CPF está correto? (11 dígitos)
- [ ] Executou `node scripts/verify-gestores-senhas.cjs`?
- [ ] Contratante está com status 'aprovado' e ativa = true?
- [ ] Consultou os logs do servidor?

---

**💡 Dica:** Sempre que aprovar contratantes, rode `verify-gestores-senhas.cjs` para prevenir problemas!
