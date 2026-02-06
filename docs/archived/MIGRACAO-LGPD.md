# 🔒 Migração de Conformidade LGPD

## 📋 Visão Geral

Esta migração implementa 5 melhorias críticas de conformidade LGPD no sistema QWork:

1. **Separação de Perfis Administrativos** - Administradores e Emissores em tabelas próprias
2. **Validação Rigorosa de CPF** - Verificação completa dos dígitos verificadores
3. **Mascaramento de CPF** - Proteção de dados pessoais em interfaces e logs
4. **Base Legal Explícita** - Registro de consentimento e base legal para cada tratamento
5. **Política de Retenção** - Anonimização e exclusão automática de dados vencidos

---

## 🚀 Passos de Execução

### 1️⃣ **BACKUP DO BANCO DE DADOS** (CRÍTICO)

```powershell
# Criar backup completo antes da migração
pg_dump -U postgres -h localhost -p 5432 nr-bps_db > backup-pre-lgpd-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql
```

### 2️⃣ **Executar Script SQL de Migração**

```powershell
# Ambiente de desenvolvimento (local)
psql -U postgres -h localhost -p 5432 -d nr-bps_db -f database/lgpd-compliance-migration.sql

# Produção (Neon Cloud) - ajuste a connection string
psql "postgresql://user:pass@host/dbname?sslmode=require" -f database/lgpd-compliance-migration.sql
```

**O que este script faz:**

- ✅ Cria tabelas `administradores` e `emissores`
- ✅ Migra dados existentes de `funcionarios` onde `perfil IN ('admin', 'emissor')`
- ✅ Adiciona colunas de conformidade LGPD em `avaliacoes`
- ✅ Cria função `executar_politica_retencao()`
- ✅ Cria função `validar_cpf_completo()`
- ✅ Cria view `cpfs_invalidos` para auditoria

### 3️⃣ **Auditar CPFs Existentes**

```powershell
# Executar script de auditoria
pnpm tsx scripts/auditar-cpfs.ts
```

**Saída esperada:**

- Lista de CPFs inválidos (se houver)
- Estatísticas gerais
- Arquivo de log em `logs/auditoria-cpf-[timestamp].json`

**Se houver CPFs inválidos:**

1. Contate RH/Administração para obter dados corretos
2. Atualize manualmente no banco de dados
3. Execute novamente o script de auditoria

### 4️⃣ **Verificar Migração de Perfis Administrativos**

```sql
-- Verificar quantos administradores foram migrados
SELECT COUNT(*) FROM administradores;

-- Verificar quantos emissores foram migrados
SELECT COUNT(*) FROM emissores;

-- Verificar se ainda existem admin/emissor em funcionarios (deve retornar 0 após limpeza)
SELECT COUNT(*) FROM funcionarios WHERE perfil IN ('admin', 'emissor');
```

**⚠️ IMPORTANTE:** Não execute os comandos de limpeza até confirmar que a migração está correta!

### 5️⃣ **Atualizar Código da Aplicação**

As seguintes APIs já foram atualizadas para usar as novas funções:

- ✅ `/api/admin/gestores-rh` - Validação rigorosa de CPF
- ✅ `/api/rh/funcionarios` - Validação rigorosa de CPF
- ✅ `/api/consentimento` - Nova API para registro de consentimento

**Funções disponíveis em `lib/cpf-utils.ts`:**

```typescript
import {
  validarCPF, // Valida CPF completo
  mascararCPF, // Mascara CPF para UI: ***.***.*23-45
  mascararCPFParaLog, // Mascara para logs: *******2345
  limparCPF, // Remove formatação
  validarELimparCPF, // Valida e retorna limpo ou null
  extrairIP, // Extrai IP do Request (Next.js)
} from '@/lib/cpf-utils';
```

### 6️⃣ **Configurar Cron Job de Retenção**

#### Opção A: Windows Task Scheduler

```powershell
# Criar tarefa agendada (executar como Administrador)
$action = New-ScheduledTaskAction -Execute "pnpm" -Argument "tsx scripts/cron-retencao-lgpd.ts" -WorkingDirectory "C:\apps\QWork"
$trigger = New-ScheduledTaskTrigger -Monthly -At 2am -DaysOfMonth 1
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName "QWork-Retencao-LGPD" -Action $action -Trigger $trigger -Principal $principal -Description "Executa política de retenção LGPD mensal"
```

#### Opção B: Vercel Cron (Produção)

Adicione ao `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/retencao-lgpd",
      "schedule": "0 2 1 * *"
    }
  ]
}
```

Crie `/app/api/cron/retencao-lgpd/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import executarPoliticaRetencao from '@/scripts/cron-retencao-lgpd';

export async function GET(request: Request) {
  // Verificar header de autorização do Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resultado = await executarPoliticaRetencao();
    return NextResponse.json(resultado);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao executar política de retenção' },
      { status: 500 }
    );
  }
}
```

### 7️⃣ **Teste Manual da Política de Retenção**

```powershell
# Executar manualmente para testar
pnpm tsx scripts/cron-retencao-lgpd.ts
```

**Saída esperada:**

- Número de avaliações anonimizadas
- Número de registros excluídos
- Estatísticas do banco
- Arquivo de log em `logs/retencao/retencao-[data].json`

---

## 🧪 Testes

### Teste 1: Validação de CPF

```typescript
import { validarCPF } from '@/lib/cpf-utils';

// Deve retornar true
console.assert(validarCPF('12345678909') === true);
console.assert(validarCPF('111.444.777-35') === true);

// Deve retornar false
console.assert(validarCPF('11111111111') === false);
console.assert(validarCPF('12345678900') === false);
console.assert(validarCPF('123456789') === false);
```

### Teste 2: Mascaramento de CPF

```typescript
import { mascararCPF, mascararCPFParaLog } from '@/lib/cpf-utils';

console.log(mascararCPF('12345678909')); // ***.***.*89-09
console.log(mascararCPFParaLog('12345678909')); // *******8909
```

### Teste 3: Registro de Consentimento

```bash
# POST /api/consentimento
curl -X POST http://localhost:3000/api/consentimento \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "avaliacao_id": 1,
    "base_legal": "obrigacao_legal"
  }'
```

---

## 📊 Monitoramento Pós-Migração

### Verificações Diárias (Primeiras 2 Semanas)

```sql
-- 1. CPFs inválidos (deve retornar 0)
SELECT * FROM cpfs_invalidos;

-- 2. Avaliações sem base legal (deve diminuir gradualmente)
SELECT COUNT(*) FROM avaliacoes WHERE base_legal IS NULL;

-- 3. Avaliações vencidas não anonimizadas
SELECT COUNT(*) FROM avaliacoes
WHERE data_validade < NOW()
AND anonimizada = false
AND status IN ('concluido', 'inativada');
```

### Verificações Mensais

```sql
-- 1. Histórico de exclusões
SELECT
  DATE_TRUNC('month', data_exclusao) as mes,
  tipo_registro,
  COUNT(*) as total
FROM historico_exclusoes
GROUP BY mes, tipo_registro
ORDER BY mes DESC;

-- 2. Taxa de anonimização
SELECT
  COUNT(*) FILTER (WHERE anonimizada = true) * 100.0 / COUNT(*) as taxa_anonimizacao
FROM avaliacoes
WHERE status IN ('concluido', 'inativada');
```

---

## 🔄 Rollback (Emergência)

**⚠️ Use apenas em caso de problemas críticos!**

```powershell
# Restaurar backup
psql -U postgres -h localhost -p 5432 -d nr-bps_db < backup-pre-lgpd-[timestamp].sql
```

**Após rollback:**

1. Investigue o problema
2. Corrija o script SQL ou código
3. Teste em ambiente de desenvolvimento
4. Execute novamente a migração

---

## 📝 Checklist de Conformidade

- [ ] Backup do banco de dados criado
- [ ] Script SQL de migração executado com sucesso
- [ ] Auditoria de CPFs executada (0 inválidos)
- [ ] Tabelas `administradores` e `emissores` criadas e populadas
- [ ] Colunas LGPD adicionadas em `avaliacoes`
- [ ] APIs atualizadas para validação rigorosa de CPF
- [ ] Funções de mascaramento implementadas
- [ ] API de consentimento testada
- [ ] Cron job de retenção configurado
- [ ] Política de retenção testada manualmente
- [ ] Documentação atualizada
- [ ] Equipe treinada sobre novas funcionalidades

---

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Verifique os logs em `logs/`
2. Consulte a documentação da LGPD (Art. 6º, 7º)
3. Entre em contato com a equipe de desenvolvimento

---

## 📚 Referências

- [LGPD - Lei 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [Guia ANPD - Boas Práticas](https://www.gov.br/anpd/pt-br)
- [Princípios da LGPD (Art. 6º)](https://www.gov.br/anpd/pt-br/assuntos/noticias/2021/principios-da-lgpd)

---

**Data da Migração:** 20 de dezembro de 2025  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para produção

