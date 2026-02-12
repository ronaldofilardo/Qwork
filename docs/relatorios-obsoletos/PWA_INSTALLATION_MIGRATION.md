# 📱 Migração da Instalação PWA: Flutuante → Sidebar

## 🎯 Objetivo

Mover a opção de instalação do PWA de um prompt flutuante (UX ruim) para um item no sidebar, disponível apenas para usuários do tipo **emissor**, **rh** e **gestor**.

## ✅ Mudanças Implementadas

### 1. **Novo Hook: `usePWAInstall`**

📁 `hooks/usePWAInstall.ts`

- Hook customizado para gerenciar o estado da instalação do PWA
- Detecta automaticamente se o PWA já está instalado
- Expõe funções: `canInstall`, `handleInstallClick`, `dismissPrompt`
- Tipagem segura com interface `NavigatorWithStandalone`

### 2. **Novo Componente: `PWAMenuItem`**

📁 `components/PWAMenuItem.tsx`

- Componente reutilizável para exibir opção de instalar PWA
- Usando o hook `usePWAInstall`
- Suporta modo colapsado (para sidebars colapsáveis)
- Renderiza condicionalmente apenas quando PWA pode ser instalado

### 3. **Modificado: `PWAInitializer`**

📁 `components/PWAInitializer.tsx`

- ✅ **Removido:** Prompt flutuante no bottom
- ✅ **Mantido:** Indicador de status offline
- ✅ **Mantido:** Service Worker e sincronização
- Agora é apenas responsável por setup de PWA (sem UI)

### 4. **Modificado: `ClinicaSidebar`** (Para usuários `rh`)

📁 `components/clinica/ClinicaSidebar.tsx`

- ✅ Adicionado import do `PWAMenuItem`
- ✅ Adicionado separador visual
- ✅ Adicionado `<PWAMenuItem isCollapsed={isCollapsed} />` no final do menu
- Disponível para **Gestores de Clínica (RH)**

### 5. **Modificado: `EntidadeSidebar`** (Para usuários `gestor`)

📁 `components/entidade/EntidadeSidebar.tsx`

- ✅ Adicionado import do `PWAMenuItem`
- ✅ Adicionado separador visual
- ✅ Adicionado `<PWAMenuItem isCollapsed={isCollapsed} />` no final do menu
- Disponível para **Gestores de Entidade**

### 6. **Modificado: `app/emissor/page.tsx`** (Para usuários `emissor`)

📁 `app/emissor/page.tsx`

- ✅ Adicionado import do `usePWAInstall`
- ✅ Adicionado botão "Instalar App" no header
- ✅ Botão aparece entre "Atualizar" e "Sair"
- Disponível para **Emissores de Laudos**

## 🚫 NÃO Recebem a Opção PWA

- ❌ **Funcionários** (`funcionario_clinica`, `funcionario_entidade`) - não têm sidebar
- ❌ **Admin** - não precisam dessa opção

## 🎨 Estilos e UX

### Sidebars (RH e Gestor)

- Ícone: Download (lucide-react)
- Cor: Azul (`text-blue-600`)
- Hover: `hover:bg-blue-50`
- Comportamento: Torna invisível quando PWA já está instalado

### Header Emissor

- Botão azul com ícone de adição
- Posicionado entre "Atualizar" e "Sair"
- Torna invisível quando PWA já está instalado

## 🔄 Comportamento

1. **Ao carregar a página:**
   - Hook `usePWAInstall` detecta se PWA pode ser instalado
   - Se não for mobile ou já estiver instalado → não mostra a opção

2. **Ao clicar em "Instalar App":**
   - Dispara o evento `beforeinstallprompt`
   - Navegador exibe seu próprio prompt de instalação
   - Após confirmação ou rejeição → opção desaparece

3. **Após instalação:**
   - PWA funciona offline (Service Worker já configurado)
   - Indicador de status offline continue funcionando

## 📦 Arquivos Criados

```
hooks/usePWAInstall.ts          (novo)
components/PWAMenuItem.tsx       (novo)
```

## 📝 Arquivos Modificados

```
components/PWAInitializer.tsx        (removido prompt flutuante)
components/clinica/ClinicaSidebar.tsx  (adicionado PWAMenuItem)
components/entidade/EntidadeSidebar.tsx (adicionado PWAMenuItem)
app/emissor/page.tsx                 (adicionado botão PWA no header)
```

## ✨ Benefícios

✅ Interface limpa sem popups intrusivos
✅ Opção acessível para usuários que querem instalar
✅ Apenas para roles apropriados (emissor, rh, gestor)
✅ Reutilizável em outras páginas se necessário
✅ Tipagem TypeScript segura
✅ Sem quebra das funcionalidades offline existentes

## 🧪 Como Testar

1. Acesso com usuário `rh` → Sidebar mostra "Instalar App"
2. Acesso com usuário `gestor` → Sidebar mostra "Instalar App"
3. Acesso com usuário `emissor` → Header mostra botão azul "Instalar App"
4. Em mobile/desktop com suporte PWA → Click abre prompt nativo do navegador
5. Após instalação → Opção desaparece automaticamente
6. PWA instalado → Funciona offline com Service Worker
