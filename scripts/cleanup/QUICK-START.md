# ⚡ Quick Start - Higienização de Scripts

## 🎯 Início Rápido (5 minutos)

### 1️⃣ Backup (30 segundos)

```powershell
cd c:\apps\QWork
Copy-Item -Path "scripts" -Destination "scripts-backup-$(Get-Date -Format 'yyyyMMdd')" -Recurse
```

### 2️⃣ Analisar Duplicados (1 minuto)

```powershell
.\scripts\cleanup\identificar-duplicados.ps1
```

### 3️⃣ Simular Higienização (1 minuto)

```powershell
.\scripts\cleanup\higienizar-scripts.ps1 -DryRun
```

### 4️⃣ Executar Higienização (2 minutos)

```powershell
.\scripts\cleanup\higienizar-scripts.ps1
```

### 5️⃣ Verificar Resultado (30 segundos)

```powershell
Get-ChildItem scripts -Directory | Select-Object Name
```

## 📚 Documentação Completa

- 📋 [Análise Detalhada](./ANALISE-HIGIENIZACAO.md)
- 📘 [Guia Completo](./GUIA-HIGIENIZACAO.md)
- 📖 [README Principal](../README-ORGANIZACAO.md)
- 📝 [Resumo de Criação](./RESUMO-CRIACAO.md)

## ⚠️ Importante

- ✅ **SEMPRE** faça backup primeiro
- ✅ **SEMPRE** execute dry run antes
- ✅ **REVISE** a saída cuidadosamente
- ✅ **TESTE** scripts críticos após

## 🆘 Problemas?

1. Restaurar backup: `Remove-Item scripts -Recurse -Force; Copy-Item scripts-backup-YYYYMMDD scripts -Recurse`
2. Consultar [GUIA-HIGIENIZACAO.md](./GUIA-HIGIENIZACAO.md)
3. Ver FAQ no [README-ORGANIZACAO.md](../README-ORGANIZACAO.md)

## 📊 O Que Será Feito

- ✅ ~100+ arquivos organizados
- ✅ 11 categorias criadas/populadas
- ✅ Duplicados identificados
- ✅ Estrutura limpa e mantível

**Tempo estimado:** 5-10 minutos  
**Risco:** 🟢 Baixo (com backup)  
**Impacto:** 🟢 Alto (grande melhoria)

---

**Versão:** 1.0  
**Data:** 31 de janeiro de 2026  
**Status:** ✅ Pronto para uso
