# 🛠️ Scripts Utilitários

## 📁 Organização

### `/checks` - Verificações de Integridade

Scripts que consultam o banco **sem modificar dados**:

- `check-db.ts` - Status geral do banco
- `check-clinicas.ts` - Validação de clínicas
- `check-entidades.ts` - Validação de entidades

**Uso:**

```bash
pnpm tsx scripts/checks/check-db.ts
```

---

### `/debug` - Troubleshooting

Scripts para investigar problemas específicos:

- `debug-cobranca.cjs` - Análise de pagamentos
- `debug-rh-parcelas.ts` - Issues de RH

**Uso:**

```bash
pnpm tsx scripts/debug/[script-name].ts
```

---

### `/diagnostics` - Diagnósticos Profundos

Scripts para análise detalhada do sistema:

- `diagnose-avaliacao.cjs` - Estado de avaliações
- `diagnose-lote.mts` - Análise de lotes

**Uso:**

```bash
pnpm tsx scripts/diagnostics/[script-name].ts
```

---

### `/tests` - Testes Manuais

Scripts para testar fluxos específicos:

- `test-login.ts` - Validação de login
- `test-funcionario-query.ts` - Queries de funcionários

**Uso:**

```bash
pnpm tsx scripts/tests/[script-name].ts
```

---

### `/fixes` - Correções

Scripts que aplicam correções no banco:

- SQL fixes seletivos
- Sincronização de dados
- Cleanup de registros órfãos

⚠️ **Usar com cuidado - alteram dados**

---

### `/cleanup` - Higienização

Scripts para limpeza e manutenção:

- Remoção de registros antigos
- Backup antes de operações
- Sanitização de dados sensíveis

---

## 📊 Categorização

| Diretório   | Destrutivo? | Propósito            |
| ----------- | ----------- | -------------------- |
| checks      | ❌          | Consulta e validação |
| debug       | ❌          | Investigação         |
| diagnostics | ❌          | Análise              |
| tests       | ⚠️          | Teste em dev         |
| fixes       | ✅          | Correção de dados    |
| cleanup     | ✅          | Limpeza e manutenção |

---

## 🔒 Boas Práticas

1. **Sempre** testar scripts em dev antes
2. **Backup** antes de usar scripts em operações
3. **Logs** são mantidos para auditoria
4. **Validar** output antes de confirmar

---

**Última atualização**: 7 de fevereiro de 2026
