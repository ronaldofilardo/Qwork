# Documentação: Acesso Admin a Contratantes

**Data**: 04/02/2026  
**Versão**: 4.0.0  
**Status**: ✅ Implementado

---

## 📋 Contexto e Justificativa

### Decisão Anterior (REVERTIDA)

Inicialmente, seguindo o princípio de menor privilégio, foi decidido que **Admin não deveria ter acesso à tabela `contratantes`**, pois:

- Admin gerencia apenas RBAC (usuarios, roles, permissions)
- Contratantes são gerenciados por RH e Gestor Entidade

### Nova Decisão (ATUAL)

**Admin PRECISA visualizar contratantes** pelos seguintes motivos:

1. **Gestão de Usuários Gestores**: Admin precisa saber quais contratantes (clínicas/entidades) existem para vincular usuários com perfis `rh` e `gestor`
2. **Auditoria**: Admin precisa verificar quais gestores estão vinculados a quais contratantes
3. **Suporte**: Admin precisa visualizar informações básicas de contratantes para suporte técnico
4. **Aprovação de Cadastros**: Admin aprova novos cadastros de clínicas/entidades e precisa ver seus dados

### Princípio Aplicado

- ✅ **VISUALIZAÇÃO**: Admin pode **SELECT** em `contratantes`
- ❌ **MODIFICAÇÃO**: Admin **NÃO PODE** INSERT/UPDATE/DELETE em `contratantes`
- ❌ **DADOS OPERACIONAIS**: Admin continua **SEM ACESSO** a funcionários, avaliações, lotes

---

## 🔐 Políticas RLS Necessárias

### 1. Criar Policy de SELECT para Admin

```sql
-- Permite admin visualizar todos os contratantes
CREATE POLICY "contratantes_admin_select" ON public.contratantes
FOR SELECT TO PUBLIC
USING (current_user_perfil() = 'admin');
```

### 2. Verificar Ausência de Policies de Modificação

```sql
-- NÃO DEVE EXISTIR:
-- contratantes_admin_insert
-- contratantes_admin_update
-- contratantes_admin_delete
```

---

## 📊 Estrutura de Dados

### Tipo Contratante

```typescript
type TipoContratante = 'clinica' | 'entidade';

interface Contratante {
  id: string;
  tipo: TipoContratante;
  nome: string;
  cnpj: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  email?: string;
  gestor: {
    nome: string;
    cpf: string;
    email: string;
    perfil: 'rh' | 'gestor';
  } | null;
  ativo: boolean;
  created_at: string;
}
```

---

## 🛠️ Implementação

### 1. Endpoint API

**Arquivo**: `app/api/admin/contratantes/route.ts`

**Funcionalidades**:

- `GET /api/admin/contratantes` - Lista todos os contratantes
- `GET /api/admin/contratantes?tipo=clinica` - Filtra apenas clínicas
- `GET /api/admin/contratantes?tipo=entidade` - Filtra apenas entidades

**Query SQL**:

```sql
SELECT
  c.id, c.tipo, c.nome, c.cnpj,
  c.endereco, c.cidade, c.estado,
  c.telefone, c.email, c.ativo, c.created_at,
  u.cpf as gestor_cpf,
  u.nome as gestor_nome,
  u.email as gestor_email,
  u.perfil as gestor_perfil
FROM contratantes c
LEFT JOIN usuarios u ON (
  (c.tipo = 'clinica' AND u.clinica_id = c.id AND u.perfil = 'rh') OR
  (c.tipo = 'entidade' AND u.entidade_id = c.id AND u.perfil = 'gestor')
)
ORDER BY c.tipo, c.nome;
```

**Resposta**:

```json
{
  "success": true,
  "contratantes": [
    {
      "id": "uuid",
      "tipo": "clinica",
      "nome": "Clínica Exemplo",
      "cnpj": "12.345.678/0001-90",
      "cidade": "São Paulo",
      "estado": "SP",
      "gestor": {
        "cpf": "123.456.789-00",
        "nome": "João Silva",
        "email": "joao@clinica.com",
        "perfil": "rh"
      },
      "ativo": true
    }
  ]
}
```

### 2. Componente Frontend

**Arquivo**: `components/admin/ContratantesContent.tsx`

**Recursos**:

- ✅ Grid de cards responsivo (1/2/3 colunas)
- ✅ Filtro por tipo (todos/clínica/entidade)
- ✅ Indicadores visuais por tipo (azul=clínica, roxo=entidade)
- ✅ Status ativo/inativo
- ✅ Modal de detalhes ao clicar no card
- ✅ Visualização de gestor vinculado
- ✅ Alerta quando contratante não tem gestor

**Layout do Card**:

```
┌─────────────────────────────┐
│ 🏢 CLÍNICA        [Ativo]   │
│                             │
│ Nome da Clínica             │
│ CNPJ: 12.345.678/0001-90    │
│                             │
│ 📍 São Paulo/SP             │
│ 📞 (11) 1234-5678           │
│ ✉️  contato@clinica.com     │
│                             │
│ ─────────────────────────   │
│ 👤 Gestor:                  │
│    João Silva               │
│    joao@clinica.com         │
│    [RH]                     │
└─────────────────────────────┘
```

### 3. Integração no AdminSidebar

**Arquivo**: `components/admin/AdminSidebar.tsx`

```tsx
<MenuItem
  icon={Building2}
  label="Contratantes"
  isActive={activeSection === 'contratantes'}
  onClick={() => {
    toggleSection('contratantes');
    onSectionChange('contratantes', 'lista');
  }}
  hasSubMenu
  isExpanded={isExpanded('contratantes')}
/>;

{
  isExpanded('contratantes') && (
    <div className="border-l-2 border-gray-200 ml-4">
      <SubMenuItem
        label="Clínicas"
        count={counts.clinicas}
        onClick={() => onSectionChange('contratantes', 'clinicas')}
      />
      <SubMenuItem
        label="Entidades"
        count={counts.entidades}
        onClick={() => onSectionChange('contratantes', 'entidades')}
      />
    </div>
  );
}
```

### 4. Integração na Página Admin

**Arquivo**: `app/admin/page.tsx`

```tsx
// Import
import { ContratantesContent } from '@/components/admin/ContratantesContent';

// Fetch contadores
const clinicasRes = await fetch('/api/admin/contratantes?tipo=clinica');
if (clinicasRes.ok) {
  const data = await clinicasRes.json();
  setClinicasCount(data.total || 0);
}

const entidadesRes = await fetch('/api/admin/contratantes?tipo=entidade');
if (entidadesRes.ok) {
  const data = await entidadesRes.json();
  setEntidadesCount(data.total || 0);
}

// Renderização
if (activeSection === 'contratantes') {
  return <ContratantesContent />;
}
```

---

## ✅ Checklist de Implementação

### Banco de Dados

- [ ] Criar policy `contratantes_admin_select`
- [ ] Verificar ausência de policies admin_insert/update/delete
- [ ] Testar query com LEFT JOIN para gestores

### Backend

- [x] Criar endpoint `/api/admin/contratantes`
- [x] Implementar filtro por tipo (query param)
- [x] Retornar dados de gestor vinculado
- [x] Tratar casos de contratante sem gestor

### Frontend

- [x] Criar componente `ContratantesContent`
- [x] Implementar grid de cards responsivo
- [x] Adicionar filtro por tipo
- [x] Criar modal de detalhes
- [x] Indicadores visuais por tipo
- [x] Alerta para contratantes sem gestor

### Integração

- [x] Restaurar seção no AdminSidebar
- [x] Restaurar chamadas de API no page.tsx
- [x] Adicionar import do componente
- [x] Renderizar componente na seção correta

---

## 🔍 Casos de Uso

### 1. Admin Visualiza Todas as Clínicas

**Objetivo**: Ver lista de clínicas cadastradas com seus gestores RH

**Fluxo**:

1. Admin acessa dashboard admin
2. Clica em "Contratantes" no sidebar
3. Clica em "Clínicas" no submenu
4. Vê grid de cards apenas com clínicas (filtro azul)
5. Clica em um card para ver detalhes completos

### 2. Admin Identifica Contratante Sem Gestor

**Objetivo**: Encontrar contratantes que não têm usuário gestor vinculado

**Fluxo**:

1. Admin acessa "Contratantes"
2. Vê cards com alerta "⚠️ Sem gestor vinculado"
3. Clica no card para ver detalhes
4. Vai para "Usuários" criar/vincular gestor

### 3. Admin Verifica Gestor de Entidade

**Objetivo**: Confirmar qual usuário é gestor de determinada entidade

**Fluxo**:

1. Admin acessa "Contratantes"
2. Filtra por "Entidades" (filtro roxo)
3. Localiza entidade desejada
4. Vê nome, email e CPF do gestor no card
5. Clica para ver detalhes completos no modal

---

## ⚠️ Limitações e Restrições

### Admin PODE:

- ✅ Visualizar lista de contratantes
- ✅ Ver dados cadastrais (nome, CNPJ, endereço, contato)
- ✅ Ver qual usuário é gestor de cada contratante
- ✅ Filtrar por tipo (clínica/entidade)
- ✅ Identificar contratantes sem gestor

### Admin NÃO PODE:

- ❌ Criar novos contratantes (feito via aprovação de cadastro)
- ❌ Editar dados de contratantes (apenas RH/Gestor Entidade)
- ❌ Excluir contratantes
- ❌ Acessar funcionários dos contratantes
- ❌ Acessar avaliações ou lotes
- ❌ Modificar empresas clientes

---

## 🧪 Validação e Testes

### Teste 1: Policy SELECT

```sql
SET LOCAL app.current_user_perfil = 'admin';
SELECT * FROM contratantes; -- DEVE FUNCIONAR
```

### Teste 2: Policy INSERT (deve falhar)

```sql
SET LOCAL app.current_user_perfil = 'admin';
INSERT INTO contratantes (tipo, nome, cnpj)
VALUES ('clinica', 'Teste', '12345678000190'); -- DEVE FALHAR
```

### Teste 3: Query com Gestores

```sql
SELECT
  c.nome, c.tipo,
  u.nome as gestor, u.perfil
FROM contratantes c
LEFT JOIN usuarios u ON (
  (c.tipo = 'clinica' AND u.clinica_id = c.id AND u.perfil = 'rh') OR
  (c.tipo = 'entidade' AND u.entidade_id = c.id AND u.perfil = 'gestor')
)
ORDER BY c.tipo, c.nome;
```

### Teste 4: Endpoint API

```bash
# Todos os contratantes
curl http://localhost:3000/api/admin/contratantes

# Apenas clínicas
curl http://localhost:3000/api/admin/contratantes?tipo=clinica

# Apenas entidades
curl http://localhost:3000/api/admin/contratantes?tipo=entidade
```

---

## 📝 Migração Necessária

**Arquivo**: `database/migrations/302_allow_admin_select_contratantes.sql`

```sql
-- ==========================================
-- MIGRATION 302: Permitir Admin SELECT em Contratantes
-- Descrição: Admin precisa visualizar contratantes para gerenciar usuários gestores
-- Data: 2026-02-04
-- Versão: 1.0.0
-- ==========================================

BEGIN;

\echo '✅ Criando policy para admin visualizar contratantes...'

-- Admin pode visualizar contratantes (mas não modificar)
CREATE POLICY "contratantes_admin_select" ON public.contratantes
FOR SELECT TO PUBLIC
USING (current_user_perfil() = 'admin');

\echo '✅ Admin agora pode visualizar contratantes (somente leitura)'

COMMENT ON POLICY "contratantes_admin_select" ON public.contratantes IS
'Admin pode visualizar contratantes para gerenciar usuários gestores (rh/gestor)';

COMMIT;

-- ==========================================
-- VALIDAÇÃO PÓS-MIGRAÇÃO
-- ==========================================
-- SET LOCAL app.current_user_perfil = 'admin';
-- SELECT * FROM contratantes; -- DEVE FUNCIONAR
```

---

## 🔄 Atualização do Relatório de Permissões

### ADMIN - Atualização

| Tabela           | SELECT | INSERT | UPDATE | DELETE | Observações                                   |
| ---------------- | ------ | ------ | ------ | ------ | --------------------------------------------- |
| **contratantes** | ✅ ALL | ❌     | ❌     | ❌     | **SOMENTE LEITURA** - para gerenciar gestores |

**Justificativa**: Admin precisa ver contratantes para vincular usuários `rh` e `gestor`, mas não pode modificar dados operacionais.

---

**Assinatura**:

```
Implementado por: GitHub Copilot
Data: 04/02/2026
Versão: 4.0.0
```
