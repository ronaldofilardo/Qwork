# Escopo para Landing Page do QWork

## 1. Contexto do Projeto

O QWork é um sistema de avaliação psicossocial baseado no questionário COPSOQ III (versão média), com módulos integrados de Jogos de Apostas e Endividamento Financeiro. A plataforma é um Progressive Web App (PWA) 100% serverless, com autenticação segura e multi-perfil (Funcionário, RH, Admin, Emissor, Gestor Entidade).

A landing page tem como objetivo principal capturar leads e converter visitantes em clientes, apresentando os benefícios do sistema de forma clara e atraente.

## 1.1 Arquitetura

A landing page será desenvolvida em uma pasta **completamente isolada** do sistema QWork principal:

- **Pasta de Desenvolvimento**: C:\apps\QWork-LP
- **Stack Tecnológica**: Next.js + Tailwind CSS (mesma do QWork, mas em projeto separado)
- **Integração**: Apenas para login e cadastro (via API do QWork)

## 2. Objetivos da Landing Page

### Principais Objetivos:

- Apresentar o valor proposition do QWork de forma impactante
- Capturar leads interessados no sistema
- Direcionar visitantes para o fluxo de cadastro
- Construir credibilidade com casos de uso e depoimentos
- Reduzir barreiras de entrada para novos clientes

### KPIs de Sucesso:

- Taxa de conversão para cadastro
- Número de leads capturados
- Tempo médio de permanência na página
- Taxa de clique nos botões de chamada para ação (CTAs)

## 3. Público-Alvo

### Perfis Principais:

1. **Gestores de RH**: Responsáveis por implementar programas de saúde ocupacional
2. **Diretores de Recursos Humanos**: Decisores de compra
3. **Profissionais de Saúde Ocupacional**: Especialistas que recomendam soluções
4. **Empresários de pequenas e médias empresas**: Buscam soluções de baixo custo

### Necessidades do Público:

- Ferramentas para prevenir riscos psicológicos no trabalho
- Relatórios detalhados para compliance
- Soluções escaláveis e fáceis de implementar
- Preços acessíveis

## 4. Estrutura da Landing Page

### 4.1 Layout Geral

- **Design Responsivo**: Adaptável a dispositivos móveis e desktops (inspirado em PawCare e Alivve)
- **Navegação Simples**: Menú com links para seções principais (Início, Funcionalidades, Preços, Dúvidas, Contato)
- **Header Fixo**: Logo do QWork, botão de login e CTA de cadastro (amarelo/verde contrastante)
- **Área de Login/Cadastro**:
  - Modal de login integrado na landing page
  - Formulário de login com CPF e senha
  - Botão para cadastro de empresa
  - Integração com o sistema de autenticação existente
- **Footer**: Links importantes, redes sociais e informações de contato
- **Espaçamento Adequado**: Uso de padding e margin para criar seções claramente definidas
- **Cards de Conteúdo**: Seções em forma de cards com sombras leves para destacar conteúdo

### 4.2 Seções Principais

#### 1. Hero Section (Seção Principal)

- **Título Principal**: "Avaliação de Saúde Mental no Trabalho e Riscos Psicossociais"
- **Subtítulo**: "Identifique riscos ocupacionais, previna absenteísmo e melhore a saúde mental da sua equipe com o QWork"
- **CTAs**:
  - "Comece agora" (direciona para cadastro - botão amarelo/verde contrastante com seta para direita)
- **Visual**: Imagem ou vídeo mostrando o laudo individual do QWork (inspirado no design de PawCare)
- **Características Destacadas**:
  - Laudo de Identificação e Mapeamento de Riscos Psicossociais (NR-1 / GRO)
  - PWA Offline
  - Multi-perfil
  - Relatórios em PDF/Excel
  - Contratação Automática
- **Estatísticas**: Cards com dados quantitativos (ex: "96% de satisfação", "+200 empresas atendidas", "4.9/5 avaliações")

#### 2. Por que Escolher o QWork?

- **Benefícios Clave (Cards com Ícones)**:
  - **Conformidade**: Laudo de Identificação e Mapeamento de Riscos Psicossociais conforme NR-1 / GRO e diretrizes do MTE
  - **Prevenção**: Identifique 10 grupos de fatores de risco psicossociais antes que se tornem problemas
  - **Compliance**: Gerencie riscos de acordo com a Legislação Trabalhista (NR-1, NR-10, NR-12)
  - **Eficiência**: Automatize processos e reduza custos operacionais
  - **Insights**: Nosso Laudo atende as exigências legais

- **Dados Quantitativos**: "Reduza absenteísmo em até 30%" ou "Aumente a produtividade em 20%"

#### 3. Funcionalidades Principais

- **Laudo de Identificação e Mapeamento de Riscos Psicossociais (NR-1 / GRO)**: Laudo técnico completo conforme normas regulamentadoras do MTE
- **Avaliação de Fatores de Risco Psicossociais**: 37 itens (COPSOQ III reduzido + módulos Jogos de Aposta e Endividamente Financeiro)
  - Demanda e sobrecarga de trabalho
  - Organização e conteúdo do trabalho
  - Relações interpessoais
  - Interface trabalho-indivíduo
  - Valores no trabalho
  - Personalidade
  - Saúde e bem-estar
  - Comportamentos ofensivos
  - Jogos de apostas
  - Endividamento financeiro
- **Gerenciamento de Equipe**: Cadastro de funcionários, importação via Excel
- **Processo de Contratação Automático**:
  - Seleção de planos (Fixo ou Personalizado)
  - Gerar contrato digital
  - Pagamento via PIX, Boleto ou Cartão
  - Emissão automática de recibo
- **Exportação de Relatórios**: PDF, Excel e relatórios por setor
- **Notificações**: Sistema de alertas e notificações em tempo real

#### 4. Planos e Preços

- **Planos Personalizados**: Opção para empresas com necessidades específicas (cards com sombras e destaque)
- **Preços Claros**: Mostrar valores por funcionário/month (destaque em cor amarelo/verde)
- **CTAs**: "Escolher Plano" ou "Contatar Vendas" (botões contrastantes com seta para direita)
- **Características dos Planos**: Lista de benefícios com ícones de check
- **Guarantee**: "Satisfação garantida" (se aplicável)

#### 6. Como Funciona?

- **Fluxo Simples em Passos**:
  1. Cadastre sua empresa
  2. Adicione os funcionários
  3. Envie os questionários
  4. Acompanhe os resultados
  5. Aja preventivamente
- **Ilustrações ou Vídeo**: Demonstração visual do fluxo

#### 7. FAQ (Perguntas Frequentes)

- **Dúvidas Comuns**:
  - Quanto custa o QWork?
  - Como funciona a implementação?
  - O sistema é compatível com dispositivos móveis?
  - Quais são os métodos de pagamento?
  - Como é o suporte técnico?
- **Respostas Claras**: Cada pergunta com resposta concisa

#### 8. Call to Action Final

- **Mensagem Persuasiva**: "Pronto para transformar a saúde da sua equipe?"
- **CTA Principai**: "Começar Agora"
- **CTA Secundário**: "Fale com um Especialista"
- **Formulário Simples**: Capturar e-mail e nome para contato

#### 9. Footer

- **Links Úteis**:
  - Sobre Nós
  - Blog
  - Termos de Serviço
  - Política de Privacidade
  - Contato
- **Redes Sociais**: LinkedIn, Facebook, Instagram
- **Informações de Contato**: Telefone, e-mail, endereço
- **Copyright**: "© 2026 QWork - Todos os direitos reservados"

## 5. Design e Identidade Visual

### 5.1 Paleta de Cores

- **Cor Primária**: Preto (#000000) - cor base/institucional
- **Cor de Ação**: Verde (#9ACD32) - para botões e elementos interativos
- **Cores Neutras**: Cinzas em diferentes tons (#F9FAFB, #F3F4F6, #E5E7EB, #D1D5DB, #9CA3AF, #6B7280, #4B5563, #374151, #1F2937, #111827)
- **Cores de Estado**: Verde (#9ACD32) para sucesso, Amarelo (#F59E0B) para aviso, Vermelho (#EF4444) para perigo

### 5.2 Tipografia

- **Fonte Primária**: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
- **Fonte de Títulos**: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
- **Fonte Mono**: "'Courier New', monospace"
- **Tamanhos de Fonte**: xs (12px), sm (14px), base (16px), lg (18px), xl (20px), 2xl (24px), 3xl (30px), 4xl (36px)

### 5.3 Elementos Visuais

- **Logo**: Imagem PNG otimizada em base64
- **Slogan**: "AVALIE. PREVINA. PROTEJA."
- **Ícones**: Lucide React (biblioteca já usada no projeto)
- **Imagens**: Screenshots do sistema, fotos de colaboradores em ambiente de trabalho
- **Vídeos**: Demo curta do sistema em funcionamento

### 5.4 Inspirações de Layout (PawCare e Alivve)

- **Hero Section**: Foco em um título claro e CTA destacado, com imagem/video de alta qualidade
- **Seções de Valor**: Cards com ícones e textos curtos, facilitando a leitura
- **CTAs**: Botões com cor de ação contrastante, posicionados estrategicamente
- **Conteúdo Escaneável**: Uso de títulos hierárquicos, listas e espaçamento adequado
- **Design Responsivo**: Adaptável a dispositivos móveis e desktops
- **Identidade Visual Consistente**: Cores, fontes e elementos repetidos em todas as seções

## 6. Tecnologias e Implementação

### 6.1 Stack Tecnológica

- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Styling**: Tailwind CSS (já configurado)
- **Estado**: Zustand (já configurado)
- **Icones**: Lucide React (já instalado)
- **Animações**: Framer Motion (para efeitos de entrada)
- **Formulários**: React Hook Form + Zod (para validação)
- **Email**: Resend ou SendGrid (para envio de emails de lead)

### 6.2 Estrutura de Arquivos

- `app/landing/page.tsx`: Página principal da landing page
- `app/landing/layout.tsx`: Layout específico para a landing page
- `components/landing/`: Componentes reutilizáveis para a landing page
  - `HeroSection.tsx`: Seção principal
  - `FeaturesSection.tsx`: Funcionalidades
  - `PricingSection.tsx`: Planos e preços
  - `TestimonialsSection.tsx`: Depoimentos
  - `HowItWorksSection.tsx`: Como funciona
  - `FAQSection.tsx`: Perguntas frequentes
  - `CTASection.tsx`: Call to Action final
- `lib/landing/`: Utilitários para a landing page
  - `pricing.ts`: Dados de planos e preços
  - `testimonials.ts`: Dados de depoimentos
  - `faq.ts`: Dados de perguntas frequentes

### 6.3 Otimizações

- **SEO**: Meta tags, schema markup, otimização de velocidade
- **Acessibilidade**: Semântica HTML, navegação por teclado, alto contraste
- **Performance**: Imagens otimizadas, carregamento lazy, code splitting
- **Analytics**: Google Analytics 4, Hotjar para heatmaps
- **Marketing**: Pixel do Facebook, Tag Manager

## 7. Funcionalidades Interativas

### 7.1 Formulários

- **Formulário de Cadastro Rápido**: Nome, e-mail, telefone, número de funcionários
- **Formulário de Contato**: Nome, e-mail, mensagem
- **Validação**: Zod para validação do lado do cliente
- **Envío**: API Route para enviar emails
- **Feedback**: Mensagem de sucesso ou erro

### 7.2 Modal de Demo

- **Video de Demo**: Vídeo curto (2-3 minutos) mostrando o sistema
- **Fechar Modal**: Botão "X" ou clique no fundo
- **CTA no Modal**: "Comece Gratuitamente"

### 7.3 Calculadora de Preço

- **Input de Número de Funcionários**: Campo para digitar a quantidade de colaboradores
- **Seleção de Plano**: Opções de plano (Básico, Profissional, Enterprise)
- **Resultado**: Preço estimado por mês
- **CTA**: "Escolher Plano"

### 7.4 Acompanhamento de Leads

- **Pixel do Facebook**: Rastrear conversões e criar audiences
- **Google Analytics**: Rastrear comportamento dos usuários
- **Hotjar**: Analisar heatmaps e sessões de usuários
- **CRM**: Integração com HubSpot ou similar

## 8. Fluxo de Navegação

1. **Visita**: Usuário entra na landing page
2. **Engajamento**: Navega pelas seções e lê o conteúdo
3. **Interação**: Clica em CTA para cadastro ou contato
4. **Conversão**: Preenche formulário e envia
5. **Confirmação**: Recebe email de confirmação
6. **Onboarding**: Processo de cadastro e configuração do sistema

## 9. Arquitetura Geral

```mermaid
graph TD
  A[Landing Page] --> B[Hero Section]
  B --> C[Por que Escolher o QWork?]
  C --> D[Funcionalidades Principais]
  D --> E[Planos e Preços]
  E --> F[Depoimentos]
  F --> G[Como Funciona?]
  G --> H[FAQ]
  H --> I[Call to Action Final]
  I --> J[Footer]

  K[Formulário de Cadastro] --> L[API Route /api/leads]
  L --> M[Banco de Dados (PostgreSQL)]
  L --> N[Email de Confirmação]

  O[Modal de Demo] --> P[Vídeo de Demo]

  Q[Calculadora de Preço] --> R[Resultado Estimado]
  R --> S[Escolher Plano]

  T[Google Analytics] --> U[Rastreamento de Eventos]
  U --> V[Análise de Dados]

  W[Pixel do Facebook] --> X[Audiences]
  X --> Y[Campanhas de Retargeting]
```

## 10. Planejamento do Projeto

### Fase 1 - Preparação

- [ ] Definir conteúdo da landing page
- [ ] Criar wireframes e protótipos
- [ ] Coletar assets (imagens, depoimentos, vídeos)
- [ ] Configurar ferramentas de analytics e marketing

### Fase 2 - Desenvolvimento

- [ ] Criar página principal e layout
- [ ] Implementar seções principais
- [ ] Adicionar formulários e validação
- [ ] Integrar com APIs de envio de email
- [ ] Implementar calculadora de preço
- [ ] Adicionar modal de demo

### Fase 3 - Testes e Otimização

- [ ] Testes de responsividade
- [ ] Testes de performance
- [ ] Testes de acessibilidade
- [ ] Otimização SEO
- [ ] Testes de usabilidade

### Fase 4 - Lançamento

- [ ] Deploy na Vercel
- [ ] Configurar domínio e DNS
- [ ] Iniciar campanhas de marketing
- [ ] Monitorar métricas e ajustar

### Fase 5 - Melhorias Contínuas

- [ ] Analisar dados de usuários
- [ ] Ajustar conteúdo e design
- [ ] Adicionar novas funcionalidades
- [ ] Atualizar depoimentos e cases

## 11. Riscos e Mitigações

### Riscos

1. **Baixa Taxa de Conversão**: Visitas não se convertem em leads
2. **Baixa Engajamento**: Usuários saem da página rapidamente
3. **Problemas de Performance**: Página demora para carregar
4. **Erros de Formulário**: Usuários não conseguem enviar o formulário

### Mitigações

1. **Testes A/B**: Testar diferentes versões da landing page
2. **Análise de Heatmaps**: Identificar áreas de baixa engajamento
3. **Otimização de Imagens**: Usar imagens comprimidas e carregamento lazy
4. **Testes de Usabilidade**: Coletar feedback de usuários reais
5. **Monitore de Erros**: Usar ferramentas como Sentry para detectar erros

## 12. Requisitos Não Funcionais

### Performance

- **Tempo de Carregamento**: Menos de 3 segundos em 3G
- **Pontuação Lighthouse**: 90+ em Performance, Accessibility, Best Practices e SEO

### Acessibilidade

- **Contraste**: Alto contraste para texto e elementos interativos
- **Semântica**: HTML semântico para navegação assistiva
- **Teclado**: Navegação completa via teclado
- **Screen Readers**: Suporte a tecnologias de leitura

### Compatibilidade

- **Navegadores**: Chrome, Firefox, Safari, Edge
- **Dispositivos**: Smartphones, tablets, desktops
- **Sistemas Operacionais**: iOS, Android, Windows, macOS

### Segurança

- **HTTPS**: Requerido em produção
- **Validação de Dados**: Prevenir injection e XSS
- **Cookies**: Aviso de cookies conforme LGPD
- **Dados Sensíveis**: Não armazenar dados sensíveis em cookies

## 13. Conclusão

A landing page do QWork tem como objetivo ser uma ferramenta eficaz para a aquisição de clientes, apresentando o valor do sistema de forma clara e atraente. Com uma estrutura bem organizada, design moderno e funcionalidades interativas, a página deve converter visitantes em leads e clientes.

O projeto é escalável e pode ser atualizado com novas funcionalidades conforme a necessidade. A integração com ferramentas de analytics e marketing permitirá monitorar o desempenho e ajustar a estratégia para melhorar os resultados.
