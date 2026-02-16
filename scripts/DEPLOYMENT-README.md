# 📁 Scripts de Deployment PRODUÇÃO

Este diretório contém todos os scripts necessários para fazer deployment das alterações das últimas 72h em produção.

---

## 📋 ARQUIVOS DE DEPLOYMENT

| Arquivo                      | Tipo       | Propósito                                    |
| ---------------------------- | ---------- | -------------------------------------------- |
| `deploy-prod-migrations.sql` | SQL        | **PRINCIPAL** - Todas as migrações para PROD |
| `validacao-pos-deploy.sql`   | SQL        | Validações automáticas pós-deployment        |
| `restart-servidor-prod.md`   | Doc        | Instruções de restart (5 métodos)            |
| `deploy-prod.ps1`            | PowerShell | Script automatizado (Windows)                |
| `deploy-prod.sh`             | Bash       | Script automatizado (Linux/Mac)              |

---

## 🚀 INÍCIO RÁPIDO

### Windows (PowerShell)

```powershell
cd C:\apps\QWork
.\scripts\deploy-prod.ps1
```

### Linux/Mac (Bash)

```bash
chmod +x scripts/deploy-prod.sh
./scripts/deploy-prod.sh
```

---

## 📖 DOCUMENTAÇÃO COMPLETA

Ver `README.md` principal ou arquivos na raiz:

- `DEPLOYMENT-PRODUCAO-72H.md` → Guia completo
- `DEPLOYMENT-QUICK-REFERENCE.md` → Checklist rápido
- `DEPLOYMENT-PROD-RESUMO-EXECUTIVO.md` → Resumo executivo

---

**Status:** ✅ Pronto para deployment  
**Build:** ✅ Concluído (pnpm build - 0 erros)
