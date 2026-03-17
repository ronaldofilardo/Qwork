# 📊 DIAGRAMA DE FLUXO - Validação de Data de Nascimento

## Fluxo Atual (❌ COM BUG)

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Login Page)                       │
├─────────────────────────────────────────────────────────────────┤
│  Input: "31021990" (formattarDataNascimento remove caracteres)  │
│         ❌ NÃO valida se é data real!                           │
│         ✅ Remove tudo exceto números                           │
│         ✅ Limita a 8 dígitos                                   │
│         ❌ FALHA: aceita 31/02/1990!                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
            POST /api/auth/login { cpf, data_nascimento }
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Login Route)                         │
├─────────────────────────────────────────────────────────────────┤
│  1. Busca usuário na tabela funcionarios                         │
│  2. Recupera senhaHash armazenado                                │
│  3. Chama: gerarSenhaDeNascimento("31021990")                   │
│     ❌ PROBLEMA: Aceita data inválida!                           │
│     └─ Valida: dia (1-31)? ✅ → 31 está ok                     │
│     └─ Valida: mês (1-12)? ✅ → 02 está ok                     │
│     └─ Valida: ano (1900-2026)? ✅ → 1990 está ok              │
│     └─ ❌ FALTA: Validar se 31/fev existe!                      │
│  4. Gera senha: "31021990"                                       │
│  5. bcrypt.compare("31021990", senhaHash)                        │
│     └─ Se senhaHash = hash("31021990") → ✅ Login aceito!       │
│     └─ Se senhaHash = hash("28021990") → ❌ Login rejeitado     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
                    ✅ Login Aceito ou ❌ Rejeitado
```

---

## Fluxo Corrigido (✅ SEM BUG)

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Login Page)                       │
├─────────────────────────────────────────────────────────────────┤
│  Input: "31021990"                                              │
│  1. formatarDataNascimento("31021990") ✅                        │
│     └─ Remove caracteres especiais                              │
│     └─ Retorna: "31021990"                                      │
│  2. ✅ NOVO: validarDataNascimento("31021990")                  │
│     └─ Valida: length === 8? ✅                                 │
│     └─ Extrai: dia=31, mês=02, ano=1990                        │
│     └─ ✅ Chama: isDataValida(31, 2, 1990)                      │
│        └─ Teste: new Date(1990, 1, 31)                          │
│        └─ Resultado: getDate()=3, getDayOfMonth()≠31             │
│        └─ ❌ INVÁLIDA!                                           │
│     └─ Retorna erro: "Data impossível (ex: 31/02 não existe)"   │
│  3. Mostra erro no frontend (não envia para API)                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ❌ Requisição bloqueada
                           │
                    Usuário vê: "Data impossível"
                           │
                    Clica em voltar e corrige

```

---

## Validação Detalhada: `isDataValida(dia, mes, ano)`

```javascript
function isDataValida(dia: number, mes: number, ano: number): boolean {

  // Passo 1: Validação de limites (rápido)
  if (dia < 1 || dia > 31 || mes < 1 || mes > 12) {
    return false;  // Rápido demais → falso negativo!
  }

  // Passo 2: ✅ Teste de data REAL (a mágica do JavaScript)
  const data = new Date(ano, mes - 1, dia);
  //     ▲                         └─ -1 porque janeiro é 0
  //     └─ Cria data no calendário

  // Passo 3: Validar se a data criada é a que solicitamos
  return (
    data.getFullYear() === ano &&        // Ano bate?
    data.getMonth() === mes - 1 &&       // Mês bate?
    data.getDate() === dia               // Dia bate?
  );
  //  └─ ✅ Se 31/02 foi criado, getDate() retorna 3 (março)!
  //  └─ ❌ 3 !== 31 → INVÁLIDA!
}

// Exemplos:
isDataValida(31, 2, 1990) → {
  data = new Date(1990, 1, 31)  // Cria → 3 de março
  getFullYear() === 1990        // ✅ true
  getMonth() === 1              // ✅ true (fevereiro = 1)
  getDate() === 31              // ❌ false (retorna 3, não 31!)
  return false                  // ❌ INVÁLIDA!
}

isDataValida(29, 2, 2000) → {
  data = new Date(2000, 1, 29)  // Criar → 29 de fevereiro
  getFullYear() === 2000        // ✅ true
  getMonth() === 1              // ✅ true (fevereiro = 1)
  getDate() === 29              // ✅ true (2000 é bissexto!)
  return true                   // ✅ VÁLIDA!
}
```

---

## 🎯 Caso de Estudo: Funcionário Não Consegue Fazer Login

### Cenário Real

**Funcionário:** João Silva, CPF: 987.654.321-00

**Data de nascimento real:** 28 de fevereiro de 1990

### ❌ Cenário Problemático (ANTES da correção)

```
Tempo T0: CRIAÇÃO DO FUNCIONÁRIO
──────────────────────────────────
Formulário de criação recebe: "31/02/1990" (digitação errada!)
Validação: ❌ NENHUMA!
Sistema aceita: ✅
Gera senha: "31021990"
Armazena hash: bcrypt("31021990", 10) = "$2a$10$...abc"

Tempo T1: JOÃO TENTA FAZER LOGIN (1 dia depois)
───────────────────────────────────────────
João lembra: Nasci em 28/02/1990
Digite login:
  CPF: 987.654.321-00
  Data: 28/02/1990

Sistema gera: "28021990"
Compara: bcrypt.compare("28021990", "$2a$10$...abc")
Resultado: ❌ false (não bate com 31021990!)
Login: ❌ FALHA

João pensa: "Minha data está errada?" e tenta:
  - 28/02/1991 → ❌ falha
  - 01/03/1990 → ❌ falha
  - 29/02/1990 → ❌ falha (1990 não é bissexto!)
  - ...

Resultado: João FICA BLOQUEADO!
```

### ✅ Cenário Corrigido (DEPOIS da correção)

```
Tempo T0: CRIAÇÃO DO FUNCIONÁRIO
──────────────────────────────────
Formulário recebe: "31/02/1990"
Validação FRONTEND: ❌ Rejeita
  Mensagem: "Data impossível: 31/02 não existe"
Usuário corrige: "28/02/1990"
Validação FRONTEND: ✅ Aceita
Envia para API: { cpf, data_nascimento: "28/02/1990" }

Validação BACKEND: ✅ Aceita
Gera senha: "28021990"
Armazena hash: bcrypt("28021990", 10) = "$2a$10$...def"

Tempo T1: JOÃO FAZ LOGIN
────────────────────────
João digita:
  CPF: 987.654.321-00
  Data: 28/02/1990

Validação FRONTEND: ✅ Aceita
Envia para API

Sistema gera: "28021990"
Compara: bcrypt.compare("28021990", "$2a$10$...def")
Resultado: ✅ true (bate!)
Login: ✅ SUCESSO

João acessa dashboard normalmente!
```

---

## 📉 Comparação: Testes

### Testes ANTES (❌ Insuficientes)

```typescript
describe('gerarSenhaDeNascimento', () => {
  it('deve gerar senha correta', () => {
    expect(gerarSenhaDeNascimento('1974-10-24')).toBe('24101974');
  });

  it('deve gerar sempre 8 dígitos', () => {
    expect(gerarSenhaDeNascimento('24101974')).toHaveLength(8);
  });

  // ❌ FALTAM testes de data inválida!
  // Ninguém testa 31/02, 31/04, 29/02 em 1900, etc.
});
```

### Testes DEPOIS (✅ Completos)

```typescript
describe('gerarSenhaDeNascimento', () => {
  // ... testes anteriores ...

  // ✅ Novos testes de validação rigorosa

  it('deve REJEITAR 31/02/1990', () => {
    expect(() => gerarSenhaDeNascimento('31021990')).toThrow();
  });

  it('deve REJEITAR 31/04/1990', () => {
    expect(() => gerarSenhaDeNascimento('31041990')).toThrow();
  });

  it('deve ACEITAR 29/02/2000 (bissexto)', () => {
    expect(gerarSenhaDeNascimento('29022000')).toBe('29022000');
  });

  it('deve REJEITAR 29/02/1900 (não bissexto)', () => {
    expect(() => gerarSenhaDeNascimento('29021900')).toThrow();
  });

  // ... 20+ outros testes críticos ...
});
```

---

## 🔐 Matriz de Segurança

### Antes da Correção

```
┌─────────────────┬────────────┬────────────┬────────────┐
│ Teste           │ Frontend   │ Backend    │ Resultado  │
├─────────────────┼────────────┼────────────┼────────────┤
│ Data inválida   │ ✅ Entrada │ ❌ Aceita  │ ❌ FALHA   │
│ 31/02/1990      │   sem flag │            │            │
├─────────────────┼────────────┼────────────┼────────────┤
│ Data válida     │ ✅ Entrada │ ✅ Aceita  │ ✅ OK      │
│ 28/02/1990      │   sem flag │            │            │
├─────────────────┼────────────┼────────────┼────────────┤
│ Bypass Data     │ ❌ Nada    │ ❌ Aceita  │ ❌ CRÍTICO │
│ Impossível      │            │            │            │
└─────────────────┴────────────┴────────────┴────────────┘
```

### Depois da Correção

```
┌─────────────────┬────────────┬────────────┬────────────┐
│ Teste           │ Frontend   │ Backend    │ Resultado  │
├─────────────────┼────────────┼────────────┼────────────┤
│ Data inválida   │ ❌ Rejeita │ -          │ ✅ BLOQ.   │
│ 31/02/1990      │   + erro   │            │            │
├─────────────────┼────────────┼────────────┼────────────┤
│ Data válida     │ ✅ Aceita  │ ✅ Aceita  │ ✅ OK      │
│ 28/02/1990      │            │            │            │
├─────────────────┼────────────┼────────────┼────────────┤
│ Bypass Data     │ ❌ Bloqueado│ ❌ Rejeita │ ✅ SEGURO  │
│ Impossível      │ + erro      │ + erro     │            │
└─────────────────┴────────────┴────────────┴────────────┘
```

---

## 📝 Resumo em 1 Página

| Aspecto               | Problema              | Solução                                                |
| --------------------- | --------------------- | ------------------------------------------------------ |
| **Datas Impossíveis** | Aceitas sem validação | `isDataValida()` rejeita                               |
| **Leap Years**        | Ignorados             | JavaScript `Date` valida automaticamente               |
| **Frontend**          | Sem validação         | `validarDataNascimento()` com mensagem de erro         |
| **Backend**           | Aceita tudo           | `isDataValida()` chamado em `gerarSenhaDeNascimento()` |
| **Testes**            | ~5 casos cobertos     | 30+ testes de validação rigorosa                       |
| **Auditoria**         | Sem verificação       | Script SQL identifica problemas no BD                  |
| **Segurança**         | 🔴 CRÍTICA            | ✅ Validação em 3 camadas                              |

---

**Fim do diagrama de fluxo**

Para implementação detalhada, veja: `GUIA_IMPLEMENTACAO_CORRECAO_DATA_NASCIMENTO.md`
