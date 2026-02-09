# Documentação: Acesso Admin a tomadores

**Data**: 04/02/2026  
**Versão**: 4.0.0  
**Status**: ✅ Implementado

---

## 📋 Contexto e Justificativa

### Decisão Anterior (REVERTIDA)

Inicialmente, seguindo o princípio de menor privilégio, foi decidido que **Admin não deveria ter acesso à tabela `tomadores`**, pois:

- Admin gerencia apenas RBAC (usuarios, roles, permissions)
- tomadores são gerenciados por RH e Gestor Entidade

### Nova Decisão (ATUAL)

**Admin PRECISA visualizar tomadores** pelos seguintes motivos:

1. **Gestão de Usuários Gestores**: Admin precisa saber quais tomadores (clínicas/entidades) existem para vincular usuários com perfis `rh` e `gestor`
2. **Auditoria**: Admin precisa verificar quais gestores estão vinculados a quais tomadores
3. **Suporte**: Admin precisa visualizar informações básicas de tomadores para suporte técnico
4. **Aprovação de Cadastros**: Admin aprova novos cadastros de clínicas/entidades e precisa ver seus dados

### Princípio Aplicado

- ✅ **VISUALIZAÇÃO**: Admin pode **SELECT** em `tomadores`
- ❌ **MODIFICAÇÃO**: Admin **NÃO PODE** INSERT/UPDATE/DELETE em `tomadores`
- ❌ **DADOS OPERACIONAIS**: Admin continua **SEM ACESSO** a funcionários, avaliações, lotes

---

## 🔐 Políticas RLS Necessárias

### 1. Criar Policy de SELECT para Admin

```sql
-- Permite admin visualizar todos os tomadores
CREATE POLICY "tomadores_admin_select" ON public.tomadores
FOR SELECT TO PUBLIC
USING (current_user_perfil() = 'admin');
```

### 2. Verificar Ausência de Policies de Modificação

```sql
-- NÃO DEVE EXISTIR:
-- tomadores_admin_insert
-- tomadores_admin_update
-- tomadores_admin_delete
```

---

## 📊 Estrutura de Dados

### Tipo tomador

```typescript
type Tipotomador = 'clinica' | 'entidade';

interface tomador {
  id: string;
  tipo: Tipotomador;
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

**Arquivo**: `app/api/admin/tomadores/route.ts`

**Funcionalidades**:

- `GET /api/admin/tomadores` - Lista todos os tomadores
- `GET /api/admin/tomadores?tipo=clinica` - Filtra apenas clínicas
- `GET /api/admin/tomadores?tipo=entidade` - Filtra apenas entidades

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
FROM tomadores c
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
  "tomadores": [
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

**Arquivo**: `components/admin/tomadoresContent.tsx`

**Recursos**:

- ✅ Grid de cards responsivo (1/2/3 colunas)
- ✅ Filtro por tipo (todos/clínica/entidade)
- ✅ Indicadores visuais por tipo (azul=clínica, roxo=entidade)
- ✅ Status ativo/inativo
- ✅ Modal de detalhes ao clicar no card
- ✅ Visualização de gestor vinculado
- ✅ Alerta quando tomador não tem gestor

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
  label="tomadores"
  isActive={activeSection === 'tomadores'}
  onClick={() => {
    toggleSection('tomadores');
    onSectionChange('tomadores', 'lista');
  }}
  hasSubMenu
  isExpanded={isExpanded('tomadores')}
/>;

{
  isExpanded('tomadores') && (
    <div className="border-l-2 border-gray-200 ml-4">
      <SubMenuItem
        label="Clínicas"
        count={counts.clinicas}
        onClick={() => onSectionChange('tomadores', 'clinicas')}
      />
      <SubMenuItem
        label="Entidades"
        count={counts.entidades}
        onClick={() => onSectionChange('tomadores', 'entidades')}
      />
    </div>
  );
}
```

### 4. Integração na Página Admin

**Arquivo**: `app/admin/page.tsx`

```tsx
// Import
import { tomadoresContent } from '@/components/admin/tomadoresContent';

// Fetch contadores
const clinicasRes = await fetch('/api/admin/tomadores?tipo=clinica');
if (clinicasRes.ok) {
  const data = await clinicasRes.json();
  setClinicasCount(data.total || 0);
}

const entidadesRes = await fetch('/api/admin/tomadores?tipo=entidade');
if (entidadesRes.ok) {
  const data = await entidadesRes.json();
  setEntidadesCount(data.total || 0);
}

// Renderização
if (activeSection === 'tomadores') {
  return <tomadoresContent />;
}
```

---

## ✅ Checklist de Implementação

### Banco de Dados

- [ ] Criar policy `tomadores_admin_select`
- [ ] Verificar ausência de policies admin_insert/update/delete
- [ ] Testar query com LEFT JOIN para gestores

### Backend

- [x] Criar endpoint `/api/admin/tomadores`
- [x] Implementar filtro por tipo (query param)
- [x] Retornar dados de gestor vinculado
- [x] Tratar casos de tomador sem gestor

### Frontend

- [x] Criar componente `tomadoresContent`
- [x] Implementar grid de cards responsivo
- [x] Adicionar filtro por tipo
- [x] Criar modal de detalhes
- [x] Indicadores visuais por tipo
- [x] Alerta para tomadores sem gestor

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
2. Clica em "tomadores" no sidebar
3. Clica em "Clínicas" no submenu
4. Vê grid de cards apenas com clínicas (filtro azul)
5. Clica em um card para ver detalhes completos

### 2. Admin Identifica tomador Sem Gestor

**Objetivo**: Encontrar tomadores que não têm usuário gestor vinculado

**Fluxo**:

1. Admin acessa "tomadores"
2. Vê cards com alerta "⚠️ Sem gestor vinculado"
3. Clica no card para ver detalhes
4. Vai para "Usuários" criar/vincular gestor

### 3. Admin Verifica Gestor de Entidade

**Objetivo**: Confirmar qual usuário é gestor de determinada entidade

**Fluxo**:

1. Admin acessa "tomadores"
2. Filtra por "Entidades" (filtro roxo)
3. Localiza entidade desejada
4. Vê nome, email e CPF do gestor no card
5. Clica para ver detalhes completos no modal

---

## ⚠️ Limitações e Restrições

### Admin PODE:

- ✅ Visualizar lista de tomadores
- ✅ Ver dados cadastrais (nome, CNPJ, endereço, contato)
- ✅ Ver qual usuário é gestor de cada tomador
- ✅ Filtrar por tipo (clínica/entidade)
- ✅ Identificar tomadores sem gestor

### Admin NÃO PODE:

- ❌ Criar novos tomadores (feito via aprovação de cadastro)
- ❌ Editar dados de tomadores (apenas RH/Gestor Entidade)
- ❌ Excluir tomadores
- ❌ Acessar funcionários dos tomadores
- ❌ Acessar avaliações ou lotes
- ❌ Modificar empresas clientes

---

## 🧪 Validação e Testes

### Teste 1: Policy SELECT

```sql
SET LOCAL app.current_user_perfil = 'admin';
SELECT * FROM tomadores; -- DEVE FUNCIONAR
```

### Teste 2: Policy INSERT (deve falhar)

```sql
SET LOCAL app.current_user_perfil = 'admin';
INSERT INTO tomadores (tipo, nome, cnpj)
VALUES ('clinica', 'Teste', '12345678000190'); -- DEVE FALHAR
```

### Teste 3: Query com Gestores

```sql
SELECT
  c.nome, c.tipo,
  u.nome as gestor, u.perfil
FROM tomadores c
LEFT JOIN usuarios u ON (
  (c.tipo = 'clinica' AND u.clinica_id = c.id AND u.perfil = 'rh') OR
  (c.tipo = 'entidade' AND u.entidade_id = c.id AND u.perfil = 'gestor')
)
ORDER BY c.tipo, c.nome;
```

### Teste 4: Endpoint API

```bash
# Todos os tomadores
curl http://localhost:3000/api/admin/tomadores

# Apenas clínicas
curl http://localhost:3000/api/admin/tomadores?tipo=clinica

# Apenas entidades
curl http://localhost:3000/api/admin/tomadores?tipo=entidade
```

---

## 📝 Migração Necessária

**Arquivo**: `database/migrations/302_allow_admin_select_tomadores.sql`

```sql
-- ==========================================
-- MIGRATION 302: Permitir Admin SELECT em tomadores
-- Descrição: Admin precisa visualizar tomadores para gerenciar usuários gestores
-- Data: 2026-02-04
-- Versão: 1.0.0
-- ==========================================

BEGIN;

\echo '✅ Criando policy para admin visualizar tomadores...'

-- Admin pode visualizar tomadores (mas não modificar)
CREATE POLICY "tomadores_admin_select" ON public.tomadores
FOR SELECT TO PUBLIC
USING (current_user_perfil() = 'admin');

\echo '✅ Admin agora pode visualizar tomadores (somente leitura)'

COMMENT ON POLICY "tomadores_admin_select" ON public.tomadores IS
'Admin pode visualizar tomadores para gerenciar usuários gestores (rh/gestor)';

COMMIT;

-- ==========================================
-- VALIDAÇÃO PÓS-MIGRAÇÃO
-- ==========================================
-- SET LOCAL app.current_user_perfil = 'admin';
-- SELECT * FROM tomadores; -- DEVE FUNCIONAR
```

---

## 🔄 Atualização do Relatório de Permissões

### ADMIN - Atualização

| Tabela        | SELECT | INSERT | UPDATE | DELETE | Observações                                   |
| ------------- | ------ | ------ | ------ | ------ | --------------------------------------------- |
| **tomadores** | ✅ ALL | ❌     | ❌     | ❌     | **SOMENTE LEITURA** - para gerenciar gestores |

**Justificativa**: Admin precisa ver tomadores para vincular usuários `rh` e `gestor`, mas não pode modificar dados operacionais.

---

**Assinatura**:

```
Implementado por: GitHub Copilot
Data: 04/02/2026
Versão: 4.0.0
```
