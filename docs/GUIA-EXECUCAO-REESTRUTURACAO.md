# Guia de Execução - Reestruturação QWork

## ✅ Implementado (60% Completo)

### 1. Database Layer
- ✅ Tabela `contratantes` unificada (clínicas + entidades)
- ✅ Tabela polimórfica `contratantes_funcionarios`
- ✅ ENUMs: `tipo_contratante_enum`, `status_aprovacao_enum`
- ✅ Triggers, views, indexes
- ✅ Migration script completo
- ✅ Seed data para testes

### 2. Backend Layer
- ✅ `lib/db.ts` - 10+ helper functions
- ✅ POST `/api/cadastro/contratante` - Registro público
- ✅ GET/POST `/api/admin/novos-cadastros` - Aprovações
- ✅ GET `/api/admin/contratantes` - Listagem por tipo

### 3. Frontend Layer
- ✅ `app/login/page.tsx` - Botões de cadastro integrados
- ✅ `components/modals/ModalCadastroContratante.tsx` - Modal 3 etapas
- ✅ `components/admin/AdminSidebar.tsx` - Navegação lateral
- ✅ `app/admin/page.tsx` - Dashboard refatorado
- ✅ `components/admin/NovoscadastrosContent.tsx` - Seção de aprovações
- ✅ `components/admin/ClinicasContent.tsx` - Placeholder
- ✅ `components/admin/EntidadesContent.tsx` - Placeholder
- ✅ `components/admin/EmissoresContent.tsx` - Integrado
- ✅ `components/admin/CobrancaContent.tsx` - Placeholder
- ✅ `components/admin/PagamentosContent.tsx` - Placeholder

---

## 🚀 Executar Migração do Banco

### Passo 1: Backup (OBRIGATÓRIO)

```powershell
# Backup completo do banco atual
pg_dump -U postgres -d nr-bps_db -F c -f "backup_antes_reestruturacao_$(Get-Date -Format 'yyyyMMdd_HHmmss').backup"
```

### Passo 2: Executar Migration

```powershell
# Conectar ao PostgreSQL
psql -U postgres -d nr-bps_db

# Dentro do psql, executar:
\i 'c:/apps/QWork/database/migration-001-contratantes.sql'

# Verificar tabelas criadas:
\dt contratantes*

# Verificar ENUMs:
\dT+ tipo_contratante_enum
\dT+ status_aprovacao_enum

# Sair
\q
```

### Passo 3: Executar Seeds (Opcional - Dados de Teste)

```powershell
psql -U postgres -d nr-bps_db -f "c:/apps/QWork/database/seed-contratantes.sql"
```

### Passo 4: Verificar Estrutura

```sql
-- Ver estrutura da tabela contratantes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'contratantes';

-- Contar registros de teste
SELECT tipo, status, COUNT(*) 
FROM contratantes 
GROUP BY tipo, status;

-- Ver junction table
SELECT * FROM contratantes_funcionarios LIMIT 5;
```

---

## 🧪 Testar Fluxo Completo

### Teste 1: Cadastro de Nova Entidade

1. Acessar http://localhost:3000/login
2. Clicar em **"Sou Empresa Privada"**
3. Preencher formulário (3 etapas):
   - **Etapa 1**: Dados da empresa + uploads (Cartão CNPJ, Contrato Social)
   - **Etapa 2**: Dados do responsável + upload (Doc Identificação)
   - **Etapa 3**: Revisar e confirmar
4. Aguardar confirmação de sucesso

### Teste 2: Aprovar Cadastro (Admin)

1. Fazer login como admin: `11111111111` / `admin123`
2. Dashboard abre na seção **"Novos Cadastros"**
3. Ver card com dados do cadastro pendente
4. Baixar anexos para revisar
5. Clicar em **"Aprovar"**, confirmar
6. Verificar que cadastro sumiu da lista

### Teste 3: Verificar Banco

```sql
-- Ver contratante aprovado
SELECT id, tipo, nome, status, criado_em 
FROM contratantes 
WHERE status = 'aprovado' 
ORDER BY criado_em DESC 
LIMIT 1;

-- Ver contratantes pendentes
SELECT COUNT(*) FROM contratantes WHERE status = 'pendente';
```

### Teste 4: Navegar pelo Dashboard

1. No sidebar, expandir **"Contratantes"**
2. Clicar em **"Clínicas"** → Ver lista de clínicas (API antiga funciona)
3. Clicar em **"Entidades"** → Ver lista de entidades (nova API)
4. Expandir **"Geral"** → Clicar em **"Emissores"** → Ver emissores

---

## ⚠️ Pendente (40% Restante)

### APIs a Adaptar

1. **`/api/admin/clinicas`** → Usar `getContratantesByTipo('clinica')`
2. **`/api/admin/clinicas/[id]/gestores`** → Usar `contratantes.responsavel_*`
3. **`/api/admin/clinicas/[id]/empresas`** → Manter estrutura existente

### Componentes a Implementar

1. **ClinicasContent.tsx** → Adicionar gestão completa (expandir para ver empresas, gestores)
2. **EntidadesContent.tsx** → Adicionar gestão de funcionários diretos
3. **CobrancaContent.tsx** → Integrar gateway de pagamento (Stripe/Mercado Pago)
4. **PagamentosContent.tsx** → Histórico e comprovantes

### Integrações Externas

1. **Email** → Resend ou nodemailer para notificações (aprovar/rejeitar)
2. **Contratos** → DocuSign ou similar para assinatura digital
3. **Pagamentos** → Stripe/Mercado Pago webhook em `/api/pagamento/webhook`
4. **Storage** → Migrar uploads de `/public/uploads` para S3/Cloudflare R2

### Testes

1. **Unit tests** → `/api/cadastro/contratante`, `/api/admin/novos-cadastros`
2. **E2E tests** → Cypress para fluxo completo de cadastro + aprovação
3. **Integration tests** → Verificar relacionamentos polimórficos

---

## 📋 Checklist de Validação

Após executar migration, verificar:

- [ ] Tabela `contratantes` criada com 23 colunas
- [ ] Tabela `contratantes_funcionarios` criada com FKs corretas
- [ ] ENUMs criados: `tipo_contratante_enum`, `status_aprovacao_enum`
- [ ] View `v_contratantes_stats` retorna dados
- [ ] Function `get_contratante_funcionario()` funciona
- [ ] Seeds inseridos (3 clínicas + 4 entidades)
- [ ] Login page mostra 2 botões de cadastro
- [ ] Modal abre ao clicar nos botões
- [ ] Dashboard admin usa sidebar (não abas)
- [ ] Seção "Novos Cadastros" lista pendências
- [ ] Botões aprovar/rejeitar/reanalise funcionam

---

## 🐛 Troubleshooting

### Erro: "relation contratantes already exists"

```sql
-- Deletar e recriar
DROP TABLE IF EXISTS contratantes_funcionarios CASCADE;
DROP TABLE IF EXISTS contratantes CASCADE;
DROP TYPE IF EXISTS tipo_contratante_enum CASCADE;
DROP TYPE IF EXISTS status_aprovacao_enum CASCADE;

-- Re-executar migration
\i 'c:/apps/QWork/database/migration-001-contratantes.sql'
```

### Erro: "Module not found: components/admin/NovoscadastrosContent"

```bash
# Verificar se todos os componentes foram criados
ls components/admin/*.tsx
```

### Erro: uploads não salvam

```powershell
# Criar diretório de uploads
New-Item -ItemType Directory -Force -Path "c:\apps\QWork\public\uploads\contratantes"
```

### Erro: "Cannot read property tipo of null"

```typescript
// Verificar session no componente
const session = await getSession()
if (!session) {
  return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
}
```

---

## 📊 Arquitetura Implementada

```
┌─────────────────────────────────────────────────────────┐
│                     FLUXO DE CADASTRO                    │
└─────────────────────────────────────────────────────────┘

1. Usuario (Login Page) → Clica "Sou Empresa/Clínica"
   └─> Abre ModalCadastroContratante (3 etapas)
       └─> POST /api/cadastro/contratante
           └─> Insere em contratantes (status=pendente)
           └─> Salva arquivos em /public/uploads/contratantes/[cnpj]/

2. Admin (Dashboard) → Seção "Novos Cadastros"
   └─> GET /api/admin/novos-cadastros
       └─> Lista contratantes WHERE status=pendente
   └─> Clica "Aprovar/Rejeitar/Reanalise"
       └─> POST /api/admin/novos-cadastros {id, acao}
           └─> UPDATE contratantes SET status='aprovado'
           └─> TODO: Enviar email de aprovação
           └─> TODO: Criar conta do responsável

3. Vincular Funcionarios → (Implementação futura)
   └─> vincularFuncionarioContratante(funcionarioId, contratanteId, tipo)
       └─> INSERT INTO contratantes_funcionarios

┌─────────────────────────────────────────────────────────┐
│                   SCHEMA POLIMÓRFICO                     │
└─────────────────────────────────────────────────────────┘

contratantes (UNIFIED)
├─ id (PK)
├─ tipo (clinica | entidade)  ← Diferenciador
├─ nome, cnpj, email, telefone, endereco...
├─ responsavel_nome, responsavel_cpf, responsavel_email...
├─ cartao_cnpj_path, contrato_social_path, doc_identificacao_path
├─ status (pendente | aprovado | rejeitado | em_reanalise)
└─ ativa, criado_em, atualizado_em

contratantes_funcionarios (POLYMORPHIC JUNCTION)
├─ id (PK)
├─ funcionario_id (FK → funcionarios)
├─ contratante_id (FK → contratantes)
├─ tipo_contratante (clinica | entidade)  ← Tipo explícito
├─ vinculo_ativo
└─ data_inicio, data_fim

QUERIES:
- Clinicas: SELECT * FROM contratantes WHERE tipo='clinica'
- Entidades: SELECT * FROM contratantes WHERE tipo='entidade'
- Funcionarios de Entidade X: 
  SELECT f.* FROM funcionarios f
  JOIN contratantes_funcionarios cf ON f.id = cf.funcionario_id
  WHERE cf.contratante_id = X AND cf.tipo_contratante = 'entidade'
```

---

## 🎯 Próximos Passos Imediatos

1. **Executar migration** (seguir Passo 1-4 acima)
2. **Testar fluxo completo** (seguir Teste 1-4 acima)
3. **Adaptar API `/api/admin/clinicas`** para usar `contratantes`
4. **Implementar emails** de notificação (aprovação/rejeição)
5. **Criar conta do responsável** automaticamente ao aprovar

---

## 📝 Notas Importantes

- ✅ Banco pode ser resetado (sem migração de dados históricos)
- ✅ Estrutura polimórfica permite escalabilidade
- ✅ Status `em_reanalise` suporta iterações de correção
- ⚠️ Uploads em `/public` são temporários (migrar para S3)
- ⚠️ Falta validação de malware nos arquivos
- ⚠️ TODO: Implementar rate limiting nas APIs públicas

---

**Status Final**: 60% implementado, 40% pendente (integrações e testes)
