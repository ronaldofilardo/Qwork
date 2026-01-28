# 📖 Guia de Uso - Qwork

## 👤 Para Funcionários

### Como fazer a avaliação:

1. **Login**
   - Acesse o sistema
   - Digite seu CPF (11 dígitos, sem pontos ou traços)
   - Digite sua senha (fornecida pelo RH)
   - Clique em "Entrar"

2. **Iniciar Avaliação**
   - Na tela inicial, leia as instruções
   - Clique em "Iniciar Avaliação"

3. **Responder aos Grupos**
   - A avaliação tem 10 grupos de perguntas
   - Para cada pergunta, escolha uma das 5 opções:
     - **Sempre** (100)
     - **Muitas vezes** (75)
     - **Às vezes** (50)
     - **Raramente** (25)
     - **Nunca** (0)
   - Pense nas **últimas 4 semanas** ao responder
   - Seja sincero - as respostas são confidenciais

4. **Navegar entre Grupos**
   - Use "Próximo" para avançar
   - Use "Voltar" se precisar revisar
   - Suas respostas são salvas automaticamente

5. **Modo Offline**
   - O sistema funciona sem internet
   - As respostas serão enviadas quando voltar online
   - Um indicador aparece quando você está offline

6. **Finalizar**
   - Ao terminar o último grupo, clique em "Finalizar"
   - Você verá uma mensagem de confirmação
   - Seus dados foram enviados com sucesso!

---

## 👔 Para Gestores RH

### Acessar Dashboard:

1. **Login**
   - Use suas credenciais de RH
   - Você será direcionado ao Dashboard automaticamente

2. **Visualizar Dados**
   - **Cards de Estatísticas**: Total de avaliações, concluídas e funcionários
   - **Gráfico de Barras**: Scores médios por domínio
   - **Gráfico de Pizza**: Distribuição por categoria (baixo/médio/alto)
   - **Tabela Detalhada**: Breakdown completo por domínio

3. **Interpretar Resultados**

   **Semáforo de Riscos:**
   - 🟢 **Verde (Baixo)**: Situação adequada, manter monitoramento
   - 🟡 **Amarelo (Médio)**: Atenção necessária, investigar causas
   - 🔴 **Vermelho (Alto)**: Ação imediata, intervenção necessária

   **Domínios Negativos** (quanto maior, pior):
   - Demandas no Trabalho
   - Saúde e Bem-Estar
   - Comportamentos Ofensivos
   - Jogos de Apostas
   - Endividamento

   **Domínios Positivos** (quanto maior, melhor):
   - Organização e Conteúdo
   - Relações Interpessoais
   - Valores no Trabalho
   - Personalidade

4. **Exportar Relatórios**
   - **PDF**: Relatório visual com gráficos
   - **Excel**: Dados brutos para análise aprofundada
   - Use para apresentações e registros

5. **Ações Recomendadas**

   **Para scores altos em domínios negativos:**
   - Investigar causas raiz
   - Entrevistar equipes afetadas
   - Criar plano de ação
   - Acompanhar evolução trimestral

   **Para scores baixos em domínios positivos:**
   - Reforçar práticas positivas
   - Promover treinamentos
   - Melhorar comunicação
   - Reconhecer boas práticas

---

## 🔧 Para Administradores

### Gerenciar Funcionários:

1. **Perfis Disponíveis**
   - `funcionario`: Acesso básico (apenas avaliação)
   - `rh`: Acesso ao dashboard e relatórios
   - `admin`: Acesso total (gestão + dashboard)

2. **Gerenciar Senhas**
   - Senha padrão na importação: `123456`
   - Oriente funcionários a alterarem após primeiro acesso
   - Reset manual via reimportação de dados (XLSX)

3. **Monitorar Sistema**
   - Verifique logs na Vercel
   - Monitore banco de dados no Neon Console
   - Acompanhe taxa de conclusão das avaliações

---

## 🚨 Solução de Problemas

### "CPF ou senha inválidos"

- Verifique se o CPF tem 11 dígitos
- Confirme a senha com o RH/Admin
- Certifique-se de estar cadastrado no sistema

### "Erro ao salvar respostas"

- Verifique sua conexão com a internet
- Se offline, os dados serão salvos localmente
- Recarregue a página e tente novamente

### "Página não carrega"

- Limpe o cache do navegador
- Tente outro navegador
- Entre em contato com o suporte de TI

### Sistema Offline

- É normal! O sistema funciona sem internet
- Suas respostas serão sincronizadas automaticamente
- Um ícone indica quando você está offline

---

## 📊 Interpretação dos Resultados

### Scores (0-100):

- **0-33**: Baixo
- **34-66**: Médio
- **67-100**: Alto

### Categorias por Tipo:

**Domínios Negativos (risco psicossocial):**

- Alto (67-100): 🔴 Risco elevado, intervenção urgente
- Médio (34-66): 🟡 Risco moderado, monitorar
- Baixo (0-33): 🟢 Risco baixo, situação adequada

**Domínios Positivos (fatores protetores):**

- Alto (67-100): 🟢 Excelente, manter práticas
- Médio (34-66): 🟡 Adequado, pode melhorar
- Baixo (0-33): 🔴 Insuficiente, ação necessária

---

## 🔒 Privacidade e Confidencialidade

- ✅ Respostas individuais são confidenciais
- ✅ RH vê apenas dados agregados (médias)
- ✅ Sem identificação individual nos relatórios
- ✅ Dados protegidos por criptografia
- ✅ Acesso restrito por perfil

---

## 📞 Suporte

Para dúvidas ou problemas:

- **Funcionários**: Entre em contato com o RH
- **RH/Admin**: Entre em contato com o TI
- **Emergências**: Consulte o manual técnico

---

**Qwork** - Sistema de Avaliação Psicossocial COPSOQ III
