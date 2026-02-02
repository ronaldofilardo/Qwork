# 🚀 Sanitização de Testes - Guia Rápido

## ✅ O Que Foi Feito

✨ **Sanitização completa das pastas `__tests__` e `tests/api/emissor/laudos`**

### Arquivos Criados

1. 📚 `__tests__/INDEX.md` - Índice master
2. 📖 `__tests__/README.md` - Estrutura de testes
3. 📊 `__tests__/INVENTORY.md` - Inventário completo
4. 📝 `__tests__/SANITIZATION-GUIDE.md` - Guia de sanitização
5. 📈 `__tests__/SANITIZATION-REPORT.md` - Relatório detalhado
6. 🎯 `__tests__/SUMMARY.md` - Sumário executivo
7. 🚀 `__tests__/QUICKSTART.md` - Este guia
8. 📖 `tests/api/emissor/laudos/README.md` - Doc de laudos
9. 🛠️ `scripts/analyze-test-quality.cjs` - Ferramenta de análise
10. ✨ `tests/api/emissor/laudos/hash-sha256-laudo.test.ts` - Exemplo 100/100

## 📊 Métricas

```
Total de Testes: 494
Score Médio: 55/100
Meta: 75+/100

✅ Com JSDoc:     48.0% (237)
⚠️ Type Imports:   0.6% (3)
✅ beforeEach:    62.3% (308)
✅ describe:      96.9% (479)
✅ it/test:       98.8% (488)
🟢 @ts-nocheck:    1.6% (8)
⚠️ console.log:    9.5% (47)
```

## 🎯 Início Rápido

### Para Desenvolvedores

#### 1. Ver Estrutura de Testes

```bash
cat __tests__/INDEX.md
```

#### 2. Entender Padrões

```bash
cat __tests__/SANITIZATION-GUIDE.md
```

#### 3. Ver Exemplo Perfeito (100/100)

```bash
cat tests/api/emissor/laudos/hash-sha256-laudo.test.ts
```

#### 4. Analisar Qualidade

```bash
pnpm quality:tests-analyze
# ou
node scripts/analyze-test-quality.cjs
```

#### 5. Criar Novo Teste

Copie a estrutura do exemplo:

```typescript
/**
 * Testes de [Descrição]
 *
 * @module tests/[caminho]
 * @description O que é testado
 */

import type { Request } from 'next/server';

jest.mock('@/lib/modulo');

const mockFn = fn as jest.MockedFunction<typeof fn>;

describe('Módulo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Cenário: Descrição
   *
   * Verifica que:
   * - Item 1
   * - Item 2
   */
  it('deve comportar-se', async () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Para Gestores

#### Ver Relatório Completo

```bash
cat __tests__/SANITIZATION-REPORT.md
```

#### Ver Inventário

```bash
cat __tests__/INVENTORY.md
```

#### Ver Métricas

```bash
cat __tests__/quality-report.json
```

## 🛠️ Comandos Úteis

### Análise de Qualidade

```bash
# Analisar todos os testes
pnpm quality:tests-analyze

# Ver relatório JSON
cat __tests__/quality-report.json

# Validar política de mocks
pnpm validate:mocks
```

### Executar Testes

```bash
# Todos
pnpm test

# Específico
pnpm test hash-sha256

# Com cobertura
pnpm test:coverage

# Watch mode
pnpm test:watch

# Visuais
pnpm test:visual

# E2E
pnpm test:e2e
```

### Qualidade de Código

```bash
# Type check
pnpm type-check

# Lint
pnpm lint

# Lint e fix
pnpm lint:fix

# Check completo
pnpm quality:check
```

## 📚 Navegação da Documentação

```
__tests__/
├── QUICKSTART.md          ← Você está aqui! 🚀
├── INDEX.md               ← Índice master completo
├── SUMMARY.md             ← Sumário executivo
├── README.md              ← Estrutura de testes
├── INVENTORY.md           ← Inventário e análise
├── SANITIZATION-GUIDE.md  ← Como sanitizar
├── SANITIZATION-REPORT.md ← Relatório detalhado
└── quality-report.json    ← Métricas automáticas

tests/api/emissor/laudos/
├── README.md              ← Doc de testes de hash
└── hash-sha256-laudo.test.ts ← Exemplo 100/100 ✨

scripts/
└── analyze-test-quality.cjs ← Ferramenta de análise 🛠️
```

## 🎓 Como Usar Esta Documentação

### Fluxo Recomendado

1. **Primeiro Contato** (você está aqui)
   - `QUICKSTART.md` ← Orientação rápida

2. **Entender Estrutura**
   - `INDEX.md` → Visão geral e navegação
   - `README.md` → Estrutura detalhada

3. **Ver Exemplo Prático**
   - `hash-sha256-laudo.test.ts` → Código real 100/100

4. **Aprender a Sanitizar**
   - `SANITIZATION-GUIDE.md` → Passo a passo

5. **Consultar Quando Necessário**
   - `INVENTORY.md` → Lista completa de testes
   - `SANITIZATION-REPORT.md` → Métricas e análises

## ✅ Checklist Rápida

### Criar Novo Teste

- [ ] Ler exemplo (hash-sha256-laudo.test.ts)
- [ ] Copiar estrutura
- [ ] Adicionar JSDoc completo
- [ ] Usar `import type`
- [ ] Configurar mocks
- [ ] Adicionar beforeEach
- [ ] Estruturar com describe/it
- [ ] Comentar cenários
- [ ] Arrange-Act-Assert
- [ ] Executar: `pnpm test [arquivo]`
- [ ] Validar: `pnpm validate:mocks`
- [ ] Analisar: `pnpm quality:tests-analyze`

### Sanitizar Teste Existente

- [ ] Executar análise: `pnpm quality:tests-analyze`
- [ ] Identificar problemas no relatório
- [ ] Consultar guia: `SANITIZATION-GUIDE.md`
- [ ] Adicionar JSDoc
- [ ] Adicionar `import type`
- [ ] Adicionar beforeEach + clearAllMocks
- [ ] Remover console.log
- [ ] Revisar @ts-nocheck
- [ ] Melhorar assertions
- [ ] Adicionar comentários descritivos
- [ ] Executar testes
- [ ] Re-analisar qualidade

### Review de PR

- [ ] Executar análise de qualidade
- [ ] Score não diminuiu
- [ ] JSDoc presente
- [ ] Type imports usados
- [ ] beforeEach configurado
- [ ] Sem console.log
- [ ] @ts-nocheck justificado
- [ ] Testes passam
- [ ] Cobertura mantida/melhorada

## 🎯 Top Prioridades

### Agora (Esta Semana)

1. ⏳ Sanitizar top 10 piores testes
2. ⏳ Remover console.log (47 arquivos)
3. ⏳ Adicionar JSDoc onde falta mais

### Próximo (2 Semanas)

4. ⏳ Adicionar type imports em 100+ arquivos
5. ⏳ Adicionar beforeEach onde falta
6. ⏳ Consolidar testes duplicados

### Logo (1 Mês)

7. ⏳ Revisar @ts-nocheck (8 arquivos)
8. ⏳ Aumentar cobertura para 80%
9. ⏳ Criar templates automatizados

## 💡 Dicas

### ✅ Faça

- Use o exemplo como referência
- Siga o template do guia
- Execute análise regularmente
- Mantenha mocks tipados
- Use beforeEach sempre
- Comente cenários de teste
- Use Arrange-Act-Assert

### ❌ Evite

- Copiar testes sem entender
- Ignorar warnings de análise
- Usar console.log
- Esquecer jest.clearAllMocks()
- Assertions frágeis
- @ts-nocheck sem justificativa
- Testes sem documentação

## 📞 Ajuda

### Problemas?

1. Consulte: `__tests__/INDEX.md`
2. Veja exemplo: `hash-sha256-laudo.test.ts`
3. Leia guia: `SANITIZATION-GUIDE.md`
4. Execute análise: `pnpm quality:tests-analyze`

### Dúvidas sobre Padrões?

- `SANITIZATION-GUIDE.md` → Como fazer
- `docs/testing/MOCKS_POLICY.md` → Política de mocks
- `docs/testing/QUALITY-POLICY.md` → Política de qualidade

### Quer Contribuir?

1. Escolha um teste com score baixo
2. Siga o guia de sanitização
3. Execute análise antes/depois
4. Abra PR com melhorias

---

## 🎉 Resultado

✅ **Sistema completo de documentação e análise de testes criado!**

**Arquivo de referência**: `tests/api/emissor/laudos/hash-sha256-laudo.test.ts` (100/100)

**Próximo passo**: Começar sanitização dos top 10 piores testes

**Comando**: `pnpm quality:tests-analyze`

---

**Criado**: 31 de Janeiro de 2026  
**Versão**: 1.0.0  
**Status**: ✅ Pronto para uso
