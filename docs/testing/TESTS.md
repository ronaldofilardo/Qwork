# 🧪 Testes - QWork

## 🚀 Início Rápido

**Novo por aqui?** Comece com: [`__tests__/QUICKSTART.md`](__tests__/QUICKSTART.md)

## 📚 Documentação

Toda a documentação de testes está em [`__tests__/`](__tests__/):

| Arquivo                                                        | Descrição                  | Para Quem          |
| -------------------------------------------------------------- | -------------------------- | ------------------ |
| **[QUICKSTART.md](__tests__/QUICKSTART.md)**                   | Guia rápido de início      | 🚀 Todos           |
| **[INDEX.md](__tests__/INDEX.md)**                             | Índice master de navegação | 📚 Desenvolvedores |
| **[README.md](__tests__/README.md)**                           | Estrutura completa         | 📖 Desenvolvedores |
| **[SUMMARY.md](__tests__/SUMMARY.md)**                         | Sumário executivo          | 🎯 Gestores        |
| **[SANITIZATION-GUIDE.md](__tests__/SANITIZATION-GUIDE.md)**   | Como sanitizar testes      | 🔧 Desenvolvedores |
| **[SANITIZATION-REPORT.md](__tests__/SANITIZATION-REPORT.md)** | Relatório de métricas      | 📊 Gestores        |
| **[INVENTORY.md](__tests__/INVENTORY.md)**                     | Inventário completo        | 📋 Analistas       |

## 🛠️ Comandos Principais

```bash
# Executar testes
pnpm test

# Analisar qualidade
pnpm quality:tests-analyze

# Com cobertura
pnpm test:coverage

# Validar mocks
pnpm validate:mocks
```

## ✨ Exemplo de Referência (100/100)

**[tests/api/emissor/laudos/hash-sha256-laudo.test.ts](tests/api/emissor/laudos/hash-sha256-laudo.test.ts)**

Este arquivo é um exemplo perfeito de teste sanitizado. Use-o como template!

## 📊 Status Atual

```
Total de Testes: 494
Score Médio: 55/100
Meta: 75+/100

✅ JSDoc:        48%
⚠️ Type Imports: 0.6%
✅ beforeEach:   62%
```

**Detalhes**: Ver [SANITIZATION-REPORT.md](__tests__/SANITIZATION-REPORT.md)

## 🎯 Estrutura

```
__tests__/               # Testes gerais
├── api/                 # Testes de API
├── components/          # Testes de componentes
├── hooks/               # Testes de hooks
├── lib/                 # Testes de utilitários
├── visual-regression/   # Testes visuais
└── [docs...]            # Documentação

tests/                   # Testes de API isolados
└── api/
    └── emissor/
        └── laudos/
```

## 📖 Links Úteis

### Documentação

- 🚀 [Guia Rápido](__tests__/QUICKSTART.md) - Comece aqui
- 📚 [Índice Master](__tests__/INDEX.md) - Navegação completa
- 🔧 [Como Sanitizar](__tests__/SANITIZATION-GUIDE.md) - Passo a passo

### Código

- ✨ [Exemplo 100/100](tests/api/emissor/laudos/hash-sha256-laudo.test.ts)
- 🛠️ [Ferramenta de Análise](scripts/analyze-test-quality.cjs)

### Políticas

- 📋 [Política de Mocks](docs/testing/MOCKS_POLICY.md)
- 📋 [Política de Qualidade](../quality/QUALITY_SOLUTION_README.md)

---

**Documentação completa**: [`__tests__/`](__tests__/)  
**Última atualização**: 31 de Janeiro de 2026
