# 📁 Estrutura de Arquivos - Qwork

## 📋 Índice do Projeto

### 📄 Raiz do Projeto

```
/
├── 📝 README.md                 # Documentação principal
├── 🚀 INICIO-RAPIDO.md          # Guia de início rápido
├── 📊 RESUMO-EXECUTIVO.md       # Visão executiva do projeto
├── ✅ CHECKLIST.md              # Lista de verificação para deploy
├── 🔧 DEPLOY.md                 # Instruções de deploy
├── 📖 GUIA-DE-USO.md            # Manual do usuário
├── 🐛 TROUBLESHOOTING.md        # Solução de problemas
├── 📚 SOBRE-COPSOQ.md           # Fundamentação científica
├── ⚙️ setup.ps1                 # Script de configuração PowerShell
└── 📁 [pastas técnicas...]
```

---

## 🏗️ Estrutura Técnica

### `/app` - Aplicação Next.js

```
app/
├── 🎨 globals.css               # Estilos globais
├── 📄 layout.tsx                # Layout raiz (PWA setup)
├── 🏠 page.tsx                  # Página inicial (redirect para login)
│
├── 🔐 login/
│   └── page.tsx                 # Página de login
│
├── 📊 dashboard/
│   └── page.tsx                 # Dashboard do funcionário
│
├── 📝 avaliacao/
│   ├── grupo/[id]/page.tsx      # Páginas dos grupos (1-10)
│   └── concluida/page.tsx       # Página de conclusão
│
├── 👔 rh/
│   └── page.tsx                 # Dashboard RH com gráficos
│
├── 🔧 admin/
│   └── page.tsx                 # Área administrativa
│
└── 🌐 api/
    ├── auth/
    │   ├── login/route.ts       # API de login
    │   ├── logout/route.ts      # API de logout
    │   └── session/route.ts     # API de sessão
    │
    ├── avaliacao/
    │   ├── save/route.ts        # Salvar respostas
    │   ├── respostas/route.ts   # Buscar respostas
    │   └── finalizar/route.ts   # Finalizar avaliação
    │
    ├── rh/
    │   └── dashboard/route.ts   # Dados do dashboard RH
    │
    └── admin/
        ├── funcionarios/route.ts # Listar funcionários
        └── (import endpoint removed)   # Importação removida
```

### `/components` - Componentes React

```
components/
├── 📋 FormGroup.tsx             # Grupo de perguntas
├── ⚪ RadioScale.tsx            # Escala de 5 opções
├── 📊 ProgressBar.tsx           # Barra de progresso
├── 🎯 Header.tsx                # Cabeçalho com logout
└── 📱 PWAInitializer.tsx        # Inicialização do PWA
```

### `/lib` - Bibliotecas e Utilitários

```
lib/
├── 🗄️ db.ts                     # Conexão banco (Neon + PostgreSQL)
├── 🔐 session.ts                # Gestão de sessões
├── 🧮 calculate.ts              # Cálculos de scores
├── 📝 questoes.ts               # Dados dos questionários
└── 📱 offline.ts                # IndexedDB e Service Worker
```

### `/database` - Banco de Dados

```
database/
├── 🗃️ schema.sql                # Schema PostgreSQL completo
└── (exemplo de importação removido)  # Exemplo de importação removido - import descontinuado
```

### `/public` - Arquivos Estáticos

```
public/
├── 📱 manifest.json             # Manifesto PWA
└── ⚙️ sw.js                     # Service Worker
```

### Configurações

```
/
├── ⚙️ package.json              # Dependências e scripts
├── 📝 tsconfig.json             # Configuração TypeScript
├── 🎨 tailwind.config.ts        # Configuração Tailwind CSS
├── 📮 postcss.config.js         # Configuração PostCSS
├── ⚡ next.config.js            # Configuração Next.js
├── 🚀 vercel.json               # Configuração deploy Vercel
├── 🔍 .eslintrc.js              # Regras de lint
├── 🚫 .gitignore                # Arquivos ignorados pelo Git
└── 📋 .env.example              # Exemplo de variáveis ambiente
```

---

## 🎯 Arquivos por Funcionalidade

### 🔐 Autenticação

- `app/login/page.tsx` - Interface de login
- `app/api/auth/login/route.ts` - API de autenticação
- `app/api/auth/logout/route.ts` - API de logout
- `app/api/auth/session/route.ts` - Verificação de sessão
- `lib/session.ts` - Gestão de cookies e sessões

### 📝 Avaliação COPSOQ

- `app/avaliacao/grupo/[id]/page.tsx` - Interface dos grupos
- `app/avaliacao/concluida/page.tsx` - Página de sucesso
- `components/FormGroup.tsx` - Renderização do formulário
- `components/RadioScale.tsx` - Componente de resposta
- `components/ProgressBar.tsx` - Progresso da avaliação
- `lib/questoes.ts` - Perguntas e estrutura
- `app/api/avaliacao/save/route.ts` - Salvar respostas
- `app/api/avaliacao/finalizar/route.ts` - Concluir avaliação

### 📊 Dashboard e Relatórios

- `app/rh/page.tsx` - Dashboard RH com gráficos
- `app/dashboard/page.tsx` - Dashboard do funcionário
- `app/api/rh/dashboard/route.ts` - Dados para gráficos
- `lib/calculate.ts` - Cálculos de scores e categorias

### 🔧 Administração

- `app/admin/page.tsx` - Interface administrativa
- `app/api/admin/funcionarios/route.ts` - Listar usuários

### 📱 PWA e Offline

- `public/sw.js` - Service Worker
- `public/manifest.json` - Manifesto PWA
- `components/PWAInitializer.tsx` - Registro do SW
- `lib/offline.ts` - IndexedDB e sincronização
- `app/layout.tsx` - Setup PWA no HTML

### 🗄️ Banco de Dados

- `database/schema.sql` - Estrutura completa
- `lib/db.ts` - Conexões Neon e PostgreSQL
- Tabelas: `funcionarios`, `avaliacoes`, `respostas`, `resultados`

---

## 🔧 Scripts Disponíveis

### Desenvolvimento

```powershell
npm run dev          # Servidor desenvolvimento (localhost:3000)
npm run build        # Build de produção
npm run start        # Servidor produção (após build)
npm run lint         # Verificar código
```

### Setup e Deploy

```powershell
.\setup.ps1          # Setup automático (Windows)
vercel --prod        # Deploy produção
vercel logs          # Ver logs produção
```

### Banco de Dados

```sql
-- Conectar local
psql -U postgres -d bps_brasil

-- Executar schema
psql -U postgres -d bps_brasil -f database/schema.sql

-- Backup
pg_dump -U postgres bps_brasil > backup.sql
```

---

## 📏 Métricas do Projeto

### Código

- **Total de arquivos**: ~40 arquivos
- **Linhas de código**: ~3.500 linhas
- **Componentes React**: 5 componentes
- **API Routes**: 8 endpoints
- **Páginas**: 6 páginas principais

### Documentação

- **Guias**: 8 documentos
- **Palavras**: ~15.000 palavras
- **Cobertura**: 100% funcionalidades documentadas

---

## 🎨 Padrões de Código

### Nomenclatura

- **Arquivos**: kebab-case (`avaliacao-grupo.tsx`)
- **Componentes**: PascalCase (`FormGroup`)
- **Funções**: camelCase (`calcularScore`)
- **Constantes**: UPPER_CASE (`SESSION_SECRET`)

### Estrutura de Componentes

```tsx
'use client'; // Se usar hooks

import { useState } from 'react';
import type { Props } from './types';

export default function Component({ prop }: Props) {
  const [state, setState] = useState();

  return <div className="tailwind-classes">{/* JSX */}</div>;
}
```

### Estrutura de APIs

```ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    // Lógica da API
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Mensagem' }, { status: 500 });
  }
}
```

---

## 🔍 Como Navegar no Código

### 1. **Comece pelo README.md**

- Visão geral do sistema
- Instruções de instalação

### 2. **Entenda a estrutura de dados**

- `database/schema.sql` - Estrutura do banco
- `lib/questoes.ts` - Perguntas e grupos

### 3. **Explore o fluxo de usuário**

- `app/login/page.tsx` → Login
- `app/dashboard/page.tsx` → Dashboard
- `app/avaliacao/grupo/[id]/page.tsx` → Avaliação

### 4. **Veja as APIs**

- `app/api/auth/` - Autenticação
- `app/api/avaliacao/` - Avaliação
- `app/api/rh/` - Dashboard RH

### 5. **Componentes reutilizáveis**

- `components/` - UI Components
- `lib/` - Utilitários

---

## 🎯 Próximos Passos

1. **Explore o código**: Comece pelos arquivos principais
2. **Rode localmente**: Use o `INICIO-RAPIDO.md`
3. **Customize**: Adapte às necessidades da sua organização
4. **Deploy**: Siga o `DEPLOY.md`
5. **Monitore**: Use o `CHECKLIST.md`

---

**Estrutura completa mapeada!** 🗺️
Agora você sabe exatamente onde encontrar cada funcionalidade.
