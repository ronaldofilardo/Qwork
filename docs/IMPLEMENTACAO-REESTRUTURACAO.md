# Implementação da Reestruturação QWork - Status e Guia

## 📋 Resumo Executivo

Este documento consolida a implementação da grande reestruturação do sistema QWork para suportar dois fluxos de contratação:
1. **Clínicas** (Medicina Ocupacional): Admin → Clínica → Empresa → Funcionários
2. **Entidades** (Empresas Privadas): Admin → Entidade → Funcionários

## ✅ Componentes Implementados

### 1. **Banco de Dados**

#### Arquivos Criados:
- `database/migration-001-contratantes.sql` - Migration completa
- `database/run-migration-001.sql` - Script de execução
- `database/seed-contratantes.sql` - Dados de teste

#### Estruturas Criadas:
- **Tabela `contratantes`**: Unifica clínicas e entidades
  - Campos comuns: nome, CNPJ, email, telefone, endereço
  - Campos de responsável: nome, CPF, cargo, email, celular
  - Anexos: cartão CNPJ, contrato social, doc identificação
  - Controle: tipo, status, motivo_rejeição, observações_reanalise

- **Tabela `contratantes_funcionarios`**: Relacionamento polimórfico
  - funcionario_id, contratante_id, tipo_contratante
  - vinculo_ativo, data_inicio, data_fim

- **ENUMs**:
  - `tipo_contratante_enum`: 'clinica' | 'entidade'
  - `status_aprovacao_enum`: 'pendente' | 'aprovado' | 'rejeitado' | 'em_reanalise'

- **Views e Funções**:
  - `v_contratantes_stats`: Estatísticas agregadas
  - `get_contratante_funcionario()`: Buscar contratante de funcionário

### 2. **Backend (APIs)**

#### Arquivos Criados:
- `app/api/cadastro/contratante/route.ts` - Cadastro via modais
  - POST com upload de arquivos (FormData)
  - Validações: CNPJ, CPF, email, arquivos (tipo/tamanho)
  - Armazena em `/public/uploads/contratantes/[cnpj]/`

- `app/api/admin/novos-cadastros/route.ts` - Gerenciamento admin
  - GET: Listar pendentes (com filtro por tipo)
  - POST: Aprovar/rejeitar/solicitar reanálise

#### Helpers em `lib/db.ts`:
- `getContratantesByTipo()`
- `getContratanteById()`
- `getContratantesPendentes()`
- `createContratante()`
- `aprovarContratante()`
- `rejeitarContratante()`
- `solicitarReanalise()`
- `vincularFuncionarioContratante()`
- `getContratanteDeFuncionario()`
- `getFuncionariosDeContratante()`

### 3. **Frontend (Componentes)**

#### Arquivos Criados:
- `components/admin/AdminSidebar.tsx` - Menu lateral
  - Seções: Novos Cadastros, Contratantes, Financeiro, Geral
  - Subseções: Clínicas/Entidades, Cobrança/Pagamentos, Emissores
  - Estado expandível, badges de contagem

- `components/modals/ModalCadastroContratante.tsx` - Modal multi-etapa
  - Etapa 1: Dados da empresa + anexos (CNPJ, Contrato Social)
  - Etapa 2: Dados do responsável + doc identificação
  - Etapa 3: Confirmação e envio
  - Validações inline, formatação automática (CNPJ, CPF, etc.)
  - Integrado com API `/api/cadastro/contratante`

## 🚧 Componentes Pendentes (Para Continuação)

### 4. **Frontend - Página de Login**
- [ ] Adicionar botões "Sou empresa privada" e "Sou Serviço de Medicina Ocupacional"
- [ ] Integrar modais de cadastro
- [ ] Ajustar layout para acomodar novos botões

**Arquivo:** `app/login/page.tsx`

### 5. **Frontend - Dashboard Admin Refatorado**
- [ ] Substituir abas horizontais por sidebar (usar `AdminSidebar.tsx`)
- [ ] Criar seção "Novos Cadastros" com:
  - Cards de contratantes pendentes
  - Visualização de anexos
  - Botões: Aprovar, Reanalise, Rejeitar
- [ ] Migrar seção "Clínicas" para "Contratantes > Clínicas"
- [ ] Criar seção "Contratantes > Entidades"
- [ ] Criar seções "Financeiro" (Cobrança/Pagamentos) - estrutura base
- [ ] Mover "Emissores" para "Geral"

**Arquivo:** `app/admin/page.tsx`

### 6. **Frontend - Componente de Auditorias Genérico**
- [ ] Adaptar `AuditoriasContent` para aceitar props de tipo (clinica/entidade)
- [ ] Queries condicionais por tipo
- [ ] Reutilizar para ambas subseções

**Arquivo:** `components/admin/AuditoriasContent.tsx`

### 7. **Backend - Adaptação de APIs Existentes**
- [ ] Refatorar `/api/admin/clinicas` para usar `contratantes` com filtro `tipo='clinica'`
- [ ] Adaptar `/api/admin/clinicas/{id}/gestores` para responsáveis
- [ ] Atualizar auditorias para filtrar por tipo
- [ ] Criar aliases/redirects para compatibilidade

**Arquivos:** `app/api/admin/clinicas/`, `app/api/admin/auditorias/`

### 8. **Backend - Integrações Externas**
- [ ] Envio de emails (aprovação, rejeição, reanálise)
  - Lib: nodemailer ou Resend
- [ ] Assinatura de contratos digitais
  - Integração: DocuSign ou similar
- [ ] Gateway de pagamento
  - Integração: Stripe ou Mercado Pago
- [ ] Armazenamento de arquivos em cloud (S3/Cloudflare R2)
  - Migrar de `/public/uploads` para cloud storage

### 9. **Testes**
- [ ] Testes unitários para novos endpoints
  - `__tests__/api/cadastro/contratante.test.ts`
  - `__tests__/api/admin/novos-cadastros.test.ts`
- [ ] Atualizar testes existentes para novo schema
  - Adaptar `clinicas.test.ts`, `gestores-rh.test.ts`
- [ ] Testes de integração para modais
  - Cypress para fluxo completo de cadastro
- [ ] Seeds com dados mistos (clínicas + entidades)

### 10. **Documentação**
- [ ] README de migração
  - Instruções de execução da migration
  - Comandos SQL para verificação
- [ ] Diagrama de arquitetura
  - ER Diagram do novo schema
  - Fluxogramas de cadastro/aprovação
- [ ] Breaking changes
  - APIs descontinuadas/alteradas
  - Guia de compatibilidade

## 🚀 Como Executar a Migration

### Passo 1: Backup (se necessário)
```bash
# Caso tenha dados que queira preservar
pg_dump -U postgres nr-bps_db > backup_pre_migration.sql
```

### Passo 2: Aplicar Migration
```bash
# Conectar ao banco de desenvolvimento
psql -U postgres -d nr-bps_db

# Executar migration
\i database/run-migration-001.sql

# Verificar tabelas criadas
\dt contratantes*

# Ver estrutura
\d contratantes
\d contratantes_funcionarios
```

### Passo 3: Inserir Dados de Teste
```bash
# No psql
\i database/seed-contratantes.sql

# Verificar dados
SELECT tipo, nome, status FROM contratantes ORDER BY tipo, status;
```

### Passo 4: Testar APIs
```powershell
# Testar cadastro (PowerShell)
$formData = @{
    tipo = 'entidade'
    nome = 'Empresa Teste LTDA'
    cnpj = '12345678000100'
    # ... demais campos
}

Invoke-RestMethod -Uri 'http://localhost:3000/api/cadastro/contratante' `
    -Method POST -Form $formData

# Testar listagem admin
Invoke-RestMethod -Uri 'http://localhost:3000/api/admin/novos-cadastros?tipo=entidade' `
    -Method GET
```

## 📐 Arquitetura do Sistema

### Fluxo de Cadastro (Novo)
```
1. Usuário acessa /login
2. Clica em botão "Sou empresa privada" ou "Sou Medicina Ocupacional"
3. Modal multi-etapa abre
4. Usuário preenche dados + anexos
5. POST /api/cadastro/contratante
6. Registro criado com status='pendente'
7. Admin recebe notificação
```

### Fluxo de Aprovação (Admin)
```
1. Admin acessa dashboard > Novos Cadastros
2. Visualiza cards de contratantes pendentes
3. Abre detalhes + anexos
4. Decisão:
   a) Aprovar: Email → Contrato → Pagamento → Liberação
   b) Reanalise: Email com observações → Aguarda correção
   c) Rejeitar: Email com motivo → Marca status
```

### Fluxo de Funcionários
```
# Para Clínicas (existente, com adaptação)
Admin → contratantes(tipo='clinica') → clinicas_empresas → empresas_clientes → funcionarios

# Para Entidades (novo)
Admin → contratantes(tipo='entidade') → contratantes_funcionarios → funcionarios
```

## 🔧 Tecnologias e Padrões

### Backend
- Next.js 14 App Router (API Routes)
- PostgreSQL 17.5
- pg (node-postgres)
- FormData para uploads

### Frontend
- React 19
- TypeScript
- Tailwind CSS
- Lucide React (ícones)

### Padrões
- Tabela polimórfica para relacionamentos flexíveis
- ENUMs para tipos/status consistentes
- Triggers para timestamps automáticos
- Views para queries complexas
- Helpers tipados em TypeScript

## 🎯 Próximos Passos Imediatos

1. **Atualizar página de login** com botões e modais
2. **Refatorar dashboard admin** para usar sidebar
3. **Criar seção "Novos Cadastros"** com cards e ações
4. **Adaptar APIs de clínicas** para contratantes
5. **Implementar envio de emails** (aprovação/rejeição)

## 📞 Observações Importantes

- **Uploads**: Atualmente salvos em `/public/uploads`. Para produção, migrar para S3/R2.
- **Emails**: TODOs marcados em `novos-cadastros/route.ts`. Implementar com Resend ou nodemailer.
- **Pagamentos**: Gateway a definir (Stripe/Mercado Pago). Criar endpoint `/api/pagamento/webhook`.
- **Contratos**: Integração DocuSign pendente. Alternativa: geração PDF + assinatura eletrônica simples.
- **Responsividade**: Sidebar otimizada para desktop (admin não usa mobile).
- **Segurança**: Validar malware em arquivos (lib: file-type + antivirus).

## 📝 Arquivos Criados Nesta Implementação

1. `database/migration-001-contratantes.sql`
2. `database/run-migration-001.sql`
3. `database/seed-contratantes.sql`
4. `lib/db.ts` (atualizado com helpers)
5. `app/api/cadastro/contratante/route.ts`
6. `app/api/admin/novos-cadastros/route.ts`
7. `components/admin/AdminSidebar.tsx`
8. `components/modals/ModalCadastroContratante.tsx`
9. `IMPLEMENTACAO-REESTRUTURACAO.md` (este arquivo)

## 🏁 Status Final

**Implementados: 40% da demanda total**
- ✅ Schema de banco completo
- ✅ APIs de cadastro e gerenciamento
- ✅ Componentes base (sidebar, modal)
- ✅ Helpers e validações

**Pendentes: 60%**
- ⏳ Integração frontend (login, dashboard)
- ⏳ APIs adaptadas (clínicas, auditorias)
- ⏳ Integrações externas (email, pagamento)
- ⏳ Testes completos
- ⏳ Documentação final

A base estrutural está sólida e pronta para os próximos passos. Os componentes criados seguem boas práticas e são escaláveis para crescimento rápido do sistema.
