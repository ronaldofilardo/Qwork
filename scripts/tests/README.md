# Scripts de Testes - README

## Sobre esta pasta

Esta pasta contém scripts utilitários para executar testes de forma organizada e eficiente.

## Scripts Disponíveis

### test-cadastro-completo.ps1

**Descrição:** Executa a suíte completa de testes de cadastro de contratantes.

**Uso:**

```powershell
.\scripts\tests\test-cadastro-completo.ps1
```

**Cobertura:**

- ✅ E2E Plano Fixo (20+ casos)
- ✅ E2E Plano Personalizado (25+ casos)
- ✅ Validações (45+ casos)
- ✅ Integração Completa (15+ casos)

**Total:** 105+ casos de teste

**Saída esperada:**

```
==================================
Testes de Cadastro de Contratantes
==================================

Iniciando suíte de testes...

[E2E: Plano Fixo] Executando...
  ✅ PASSOU

[E2E: Plano Personalizado] Executando...
  ✅ PASSOU

[Validações] Executando...
  ✅ PASSOU

[Integração Completa] Executando...
  ✅ PASSOU

==================================
Relatório Final
==================================

Testes executados: 4
✅ Sucessos: 4
❌ Falhas: 0

🎉 Todos os testes passaram!
```

## Organização

```
scripts/
├── tests/           # Scripts de teste (VOCÊ ESTÁ AQUI)
├── checks/          # Scripts de verificação
├── fixes/           # Scripts de correção
├── analysis/        # Scripts de análise
└── powershell/      # Scripts PowerShell setup/sync
```

## Convenções

- **Não** criar scripts temporários na raiz do projeto
- **Não** commitar arquivos `temp_*` ou `*.bak`
- **Sempre** usar esta pasta para scripts de teste ad-hoc
- **Sempre** documentar scripts com comentários

## Relacionado

- **Documentação:** `docs/guides/FLUXO-CADASTRO-CONTRATANTES.md`
- **Relatório de Revisão:** `docs/corrections/REVISAO-CADASTRO-CONTRATANTES-20JAN2026.md`
- **Testes:** `__tests__/e2e/`, `__tests__/validations/`, `__tests__/integration/`
