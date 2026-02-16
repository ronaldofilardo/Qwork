# 🚀 GUIA DE IMPLEMENTAÇÃO - Correção de Validação de Data de Nascimento

**Data:** 14/02/2026  
**Prioridade:** 🔴 CRÍTICA  
**Estimativa:** 2-3 horas

---

## 📊 Resumo Executivo

Este guia implementa validação rigorosa de datas impossíveis (como 31/02/1990) no sistema de login com data de nascimento.

**Status dos Arquivos Criados:**

- ✅ `lib/auth/date-validator.ts` - Validador de datas (CRIADO)
- ✅ `lib/auth/password-generator-corrigido.ts` - Versão melhorada (CRIADO)
- ✅ `__tests__/auth/password-generator-data-invalida.test.ts` - Testes (CRIADO)

---

## 🔧 PASSO 1: Atualizar o Arquivo Original

**Arquivo:** `lib/auth/password-generator.ts`

### ✅ O que fazer:

1. Importar o validador de datas
2. Adicionar a validação de data real após validar componentes

### Código a Adicionar (antes de linha 99):

```typescript
// INÍCIO: Adicionar import no topo do arquivo
import { isDataValida } from './date-validator';

// FIM do import

// ... código existente ...

// Logo DEPOIS da validação de limites (após linha 104):
// ✅ NOVO: Validação de data real (rejeita 31/02/1990, etc)
if (!isDataValida(diaNum, mesNum, anoNum)) {
  throw new Error(
    `Data de nascimento impossível: ${dia}/${mes}/${ano}. Verifique dia e mês.`
  );
}
```

### Localização Exata no Arquivo:

```typescript
// ANTES (usar este código como referência):
// ... validações existentes ...
if (isNaN(anoNum) || anoNum < 1900 || anoNum > new Date().getFullYear()) {
  throw new Error('Ano inválido na data de nascimento');
}

// ✅ ADICIONAR AQUI:
if (!isDataValida(diaNum, mesNum, anoNum)) {
  throw new Error(
    `Data de nascimento impossível: ${dia}/${mes}/${ano}. Verifique dia e mês.`
  );
}

// DEPOIS (este código já existe):
// Garantir 4 dígitos no ano
const anoFormatado = ano.padStart(4, '0');
```

---

## 🔧 PASSO 2: Validação no Frontend

**Arquivo:** `app/login/page.tsx`

### ✅ O que fazer:

1. Importar o validador
2. Validar a data antes de enviar para a API

### Código a Adicionar (após linha 37):

```typescript
// Adicionar import no topo
import { isDataValida } from '@/lib/auth/date-validator';

// ... resto do código ...

// Função de formatação (MANTER COMO ESTÁ):
const formatarDataNascimento = (valor: string) => {
  const apenasNumeros = valor.replace(/\D/g, '');
  return apenasNumeros.slice(0, 8); // ddmmaaaa
};

// ✅ ADICIONAR NOVA FUNÇÃO:
const validarDataNascimento = (ddmmaaaa: string): string | null => {
  if (!ddmmaaaa || ddmmaaaa.length !== 8) {
    return 'Data deve ter 8 dígitos (formato: ddmmaaaa)';
  }

  const dia = parseInt(ddmmaaaa.substring(0, 2), 10);
  const mes = parseInt(ddmmaaaa.substring(2, 4), 10);
  const ano = parseInt(ddmmaaaa.substring(4, 8), 10);

  if (isNaN(dia) || isNaN(mes) || isNaN(ano)) {
    return 'Data inválida';
  }

  if (!isDataValida(dia, mes, ano)) {
    return `Data impossível (ex: 31/02 não existe). Verifique dia e mês.`;
  }

  if (ano < 1900 || ano > new Date().getFullYear()) {
    return `Ano deve estar entre 1900 e ${new Date().getFullYear()}`;
  }

  return null; // Válido
};
```

### Modificar o handleSubmit (linha 100):

**ANTES:**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    // Enviar senha ou data de nascimento
    const body: any = { cpf };
    if (senha) {
      body.senha = senha;
    }
    if (dataNascimento) {
      body.data_nascimento = dataNascimento;
    }
    // ... resto
```

**DEPOIS:**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    // ✅ VALIDAR data de nascimento se fornecida
    if (dataNascimento) {
      const erroData = validarDataNascimento(dataNascimento);
      if (erroData) {
        setError(erroData);
        setLoading(false);
        return;
      }
    }

    // Enviar senha ou data de nascimento
    const body: any = { cpf };
    if (senha) {
      body.senha = senha;
    }
    if (dataNascimento) {
      body.data_nascimento = dataNascimento;
    }
    // ... resto
```

---

## 🔧 PASSO 3: Validação ao Criar Funcionário

**Arquivo:** `app/api/entidade/funcionarios/route.ts`

### ✅ O que fazer:

Adicionar validação antes de gerar a senha

### Localização (linha 161):

**ANTES:**

```typescript
const senhaPlaintext = gerarSenhaDeNascimento(data_nascimento);
const senhaHash = await bcrypt.hash(senhaPlaintext, 10);
```

**DEPOIS:**

```typescript
// ✅ VALIDAR data de nascimento antes de gerar senha
try {
  const senhaPlaintext = gerarSenhaDeNascimento(data_nascimento);
  const senhaHash = await bcrypt.hash(senhaPlaintext, 10);
  // ... continuar
} catch (error) {
  console.error('[FUNCIONÁRIO] Erro ao validar data de nascimento:', error);
  return NextResponse.json(
    {
      error: 'Data de nascimento inválida. Verifique dia e mês.',
      details: error instanceof Error ? error.message : 'Data impossível',
    },
    { status: 400 }
  );
}
```

---

## 🔧 PASSO 4: Adicionar Testes

### ✅ O que fazer:

1. Executar os novos testes
2. Adicionar ao CI/CD

### Arquivos de Teste:

```bash
# Rodar APENAS os testes de data inválida
npm test -- password-generator-data-invalida.test.ts

# Rodar TODOS os testes de password generator
npm test -- password-generator.test.ts

# Rodar COM coverage
npm test -- --coverage password-generator
```

---

## 🗄️ PASSO 5: Verificar Banco de Dados

### ⚠️ CRÍTICO: Procurar por datas impossíveis existentes

```sql
-- Query para encontrar datas impossíveis no banco
SELECT
  id,
  cpf,
  nome,
  data_nascimento,
  EXTRACT(DAY FROM data_nascimento) as dia,
  EXTRACT(MONTH FROM data_nascimento) as mes,
  EXTRACT(YEAR FROM data_nascimento) as ano
FROM funcionarios
WHERE
  -- Fevereiro com dia > 28 (respeitando bissextos)
  (EXTRACT(MONTH FROM data_nascimento) = 2 AND EXTRACT(DAY FROM data_nascimento) > 29)
  OR
  -- Abril, Junho, Setembro, Novembro com dia = 31
  (EXTRACT(MONTH FROM data_nascimento) IN (4, 6, 9, 11)
   AND EXTRACT(DAY FROM data_nascimento) = 31)
ORDER BY data_nascimento DESC;
```

### Se encontrar resultados:

1. **Contatar usuário** para confirmar data real
2. **Corrigir no banco:**
   ```sql
   -- Exemplo: Corrigir 31/02/1990 para 28/02/1990
   UPDATE funcionarios
   SET data_nascimento = '1990-02-28'
   WHERE cpf = '123.456.789-00';
   ```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### HOJE:

- [ ] Ler este guia completamente
- [ ] Criar arquivo `lib/auth/date-validator.ts` ✅ (PRONTO)
- [ ] Atualizar `lib/auth/password-generator.ts`
- [ ] Rodar testes: `npm test -- password-generator-data-invalida.test.ts`

### AMANHÃ:

- [ ] Implementar validação no frontend (`app/login/page.tsx`)
- [ ] Implementar validação ao criar funcionário
- [ ] Rodar testes de integração
- [ ] Teste manual: Tentar logar com data inválida (deve falhar)

### SEMANA:

- [ ] Executar queries no banco PROD
- [ ] Corrigir any datas impossíveis encontradas
- [ ] Deploy em DEV → QA → PROD
- [ ] Comunicar ao time sobre a mudança

---

## 🧪 TESTES MANUAIS PARA VALIDAR

### Teste 1: Frontend rejeita data inválida

1. Abrir página de login
2. Preencher: CPF + Data de nascimento
3. Digitar: `31021990` (31 de fevereiro)
4. Esperado: ❌ Mensagem de erro: "Data impossível"
5. ✅ PASS se não enviar para a API

### Teste 2: Backend rejeita data inválida via API Direct

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678900",
    "data_nascimento": "31021990"
  }'

# Esperado: 401 ou 400 com mensagem de erro
```

### Teste 3: Login funciona com data válida

1. Funcionário: CPF 12345678900, Data nascimento: 15/03/1990
2. Login com: CPF + `15031990`
3. Esperado: ✅ Login bem-sucedido

### Teste 4: Leap year (29/02 em bissexto)

1. Funcionário: Data nascimento: 29/02/2000
2. Login com: CPF + `29022000`
3. Esperado: ✅ Login bem-sucedido

### Teste 5: Leap year (29/02 em NÃO-bissexto)

1. Tentar criar funcionário com: Data nascimento: 29/02/1900
2. Esperado: ❌ Erro de validação

---

## 📚 REFERÊNCIAS

### Documentação Criada:

- `ANALISE_PROFUNDA_SENHA_DATA_NASCIMENTO.md` - Análise completa do problema
- `lib/auth/date-validator.ts` - Validador de datas
- `lib/auth/password-generator-corrigido.ts` - Versão melhorada do gerador
- `__tests__/auth/password-generator-data-invalida.test.ts` - Suite de testes

### Leap Years (Anos Bissextos):

- Divisível por 4 E (não divisível por 100 OU divisível por 400)
- Exemplos:
  - 2000: ✅ Bissexto (divisível por 400)
  - 1900: ❌ Não-bissexto (divisível por 100, não por 400)
  - 2004: ✅ Bissexto (divisível por 4, não por 100)
  - 2100: ❌ Não-bissexto (divisível por 100, não por 400)

---

## 🔐 IMPLICAÇÕES DE SEGURANÇA

✅ Após esta implementação:

- Datas impossíveis serão REJEITADAS em frontend e backend
- Novo funcionário não pode ter data inválida
- Login será bloqueado se data for impossível
- Senhas geradas sempre correspondem a datas reais

---

## 💬 SUPORTE

Se encontrar erros durante a implementação:

1. **Erro de import:** Verificar se `date-validator.ts` foi criado
2. **Erro de validação:** Rodar `npm test -- date-validator` primeiro
3. **Erro ao criar funcionário:** Validar data no backend está funcionando

---

**FIM DO GUIA**

Próximas etapas: Implementar conforme checklist acima.
