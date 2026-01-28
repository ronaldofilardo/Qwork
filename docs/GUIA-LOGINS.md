# 🔐 GUIA DE LOGINS - QWORK COPSOQ III

## 📋 **HIERARQUIA DO SISTEMA**

### 🔧 **ADMIN CLÍNICA** (Administrador da Clínica)

- **Função:** Gerencia funcionários de UMA clínica específica
- **CPF:** Configurado durante setup inicial
- **Senha:** Configurada no primeiro acesso
- **Acesso:** `/admin` - Tela "Administração"
- **Visibilidade:** ✅ Aparece na lista (pode ser funcionário da própria clínica)
- **Responsabilidade:**
  - Upload/importar funcionários
  - Gerenciar perfis (funcionário, RH, admin)
  - Administração interna da clínica

> ⚠️ **Nota de Segurança:** As credenciais de admin devem ser alteradas imediatamente após o primeiro login em ambiente de produção.

---

### 👥 **RH GESTOR** (Gestor de Recursos Humanos)

- **Função:** Libera avaliações e visualiza resultados
- **CPF:** Configurado pela administração da clínica
- **Senha:** Configurada no primeiro acesso
- **Acesso:** `/rh` - Dashboard RH
- **Visibilidade:** ✅ Aparece na lista (funcionário da clínica)
- **Responsabilidade:**
  - Liberar avaliações para funcionários
  - Ver dashboard com resultados
  - Gerar relatórios

> ⚠️ **Nota de Segurança:** Nunca compartilhe credenciais entre usuários. Cada RH deve ter seu próprio CPF e senha.

---

### 👤 **FUNCIONÁRIO** (Usuário final)

- **Função:** Responde questionários de avaliação psicossocial
- **CPF:** Cadastrado pela clínica
- **Senha:** Definida no cadastro
- **Acesso:** `/dashboard` - Responder avaliação
- **Visibilidade:** ✅ Aparece na lista
- **Responsabilidade:**
  - Responder questionário COPSOQ III
  - Ver seu próprio resultado

---

## ⚠️ **IMPORTANTE - SEPARAÇÃO DE RESPONSABILIDADES**

### 🔒 **Perfil Admin com Restrições:**

- **Admin:** Administrador com acesso limitado
- **Restrições implementadas:** Não acessa avaliações, respostas ou resultados diretos
- **Foco:** Gerenciamento de usuários e infraestrutura
- **Credenciais:** Devem ser geradas de forma segura e únicas por instalação

### 🔒 **Isolamento Multi-tenant:**

- Cada clínica só vê seus próprios funcionários
- Dados completamente isolados por clínica
- Admin tem acesso apenas aos dados permitidos por políticas RLS

---

## ✅ **STATUS ATUAL - SISTEMA OPERACIONAL**

**Implementado:**

- ✅ Tabela de clínicas
- ✅ Perfil "admin" com restrições de segurança
- ✅ Políticas RLS implementadas
- ✅ Isolamento multi-tenant por clínica
- ✅ Separação de responsabilidades

**Teste de Aceitação:**

- ✅ Login Admin → Tela de administração com restrições
- ✅ Admin não acessa dados sensíveis diretamente
- ✅ Sistema operacional e seguro
