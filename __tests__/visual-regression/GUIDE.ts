/**
 * Guia de Interpretação de Testes Visuais
 *
 * Este arquivo explica como interpretar os resultados dos testes de regressão visual
 * e quando atualizar os snapshots.
 */

// ============================================================================
// CENÁRIOS COMUNS E AÇÕES RECOMENDADAS
// ============================================================================

/*
 * CENÁRIO 1: Teste falhou - "Snapshot has changed"
 * -----------------------------------------------
 *
 * CAUSA: A estrutura HTML renderizada mudou em relação ao snapshot salvo
 *
 * AÇÃO:
 * 1. Revisar as diferenças mostradas no terminal
 * 2. Verificar se a mudança foi intencional
 * 3. Se SIM: `pnpm test:visual:update`
 * 4. Se NÃO: Investigar e corrigir o código
 *
 * EXEMPLO:
 * - Snapshot
 * + Received
 *
 * - <div class="flex bg-white">
 * + <div class="flex bg-gray-100">
 *
 * Neste caso, o fundo mudou de branco para cinza. É intencional?
 */

/*
 * CENÁRIO 2: Teste falhou - "Class names have changed"
 * -----------------------------------------------------
 *
 * CAUSA: Classes CSS foram adicionadas, removidas ou alteradas
 *
 * AÇÃO:
 * 1. Verificar se a mudança afeta o layout visual
 * 2. Testar a página no navegador
 * 3. Se layout está correto: atualizar snapshot
 * 4. Se layout quebrou: corrigir as classes
 *
 * EXEMPLO:
 * Expected: /bg-white/
 * Received: "flex border rounded bg-gray-50"
 *
 * Classes esperadas não foram encontradas
 */

/*
 * CENÁRIO 3: Teste falhou - "Element not found"
 * ----------------------------------------------
 *
 * CAUSA: Elemento esperado não existe mais no DOM
 *
 * AÇÃO:
 * 1. Verificar se elemento foi removido intencionalmente
 * 2. Se SIM: Atualizar ou remover o teste
 * 3. Se NÃO: Restaurar o elemento ou ajustar seletor
 *
 * EXEMPLO:
 * Unable to find element with alt text: "QWork"
 *
 * Logo pode ter sido removida ou alt text mudou
 */

/*
 * CENÁRIO 4: Teste falhou em CI mas passa localmente
 * ---------------------------------------------------
 *
 * CAUSA: Diferenças de ambiente (Node version, dependencies, etc)
 *
 * AÇÃO:
 * 1. Verificar versões de Node.js e dependências
 * 2. Limpar cache: `pnpm store prune && pnpm install`
 * 3. Deletar snapshots locais e regerar
 * 4. Commitar novos snapshots
 */

// ============================================================================
// QUANDO ATUALIZAR SNAPSHOTS
// ============================================================================

/*
 * ✅ SITUAÇÕES ONDE DEVE ATUALIZAR:
 *
 * 1. Mudança intencional de design
 *    - Ex: "Mudamos botões de azul para verde"
 *    - Comando: `pnpm test:visual:update`
 *
 * 2. Novo componente adicionado
 *    - Ex: "Criamos novo componente CardProduto"
 *    - Comando: `pnpm test:visual:update`
 *
 * 3. Refatoração que mantém visual
 *    - Ex: "Mudamos estrutura interna mas visual é igual"
 *    - Revisar no navegador primeiro!
 *    - Comando: `pnpm test:visual:update`
 *
 * 4. Correção de bug visual aprovada
 *    - Ex: "Corrigimos espaçamento que estava errado"
 *    - Comando: `pnpm test:visual:update`
 *
 * 5. Atualização de biblioteca que muda HTML
 *    - Ex: "Next.js 14 muda estrutura de Image"
 *    - Comando: `pnpm test:visual:update`
 */

/*
 * ❌ SITUAÇÕES ONDE NÃO DEVE ATUALIZAR:
 *
 * 1. Teste falhou sem você ter mudado nada
 *    - Investigar causa raiz
 *    - Pode ser problema de estado/mock
 *
 * 2. Você não entende a diferença mostrada
 *    - Pedir revisão de colega
 *    - Debugar teste específico
 *
 * 3. Mudança não foi intencional
 *    - Desfazer mudança no código
 *    - Corrigir bug que causou a mudança
 *
 * 4. Apenas alguns testes falharam
 *    - Indica problema específico
 *    - Não use -u para atualizar todos
 */

// ============================================================================
// COMANDOS ÚTEIS
// ============================================================================

/*
 * # Ver quais testes estão falhando
 * pnpm test:visual
 *
 * # Atualizar TODOS os snapshots
 * pnpm test:visual:update
 *
 * # Atualizar apenas um arquivo
 * pnpm test __tests__/visual-regression/page-snapshots.test.tsx -u
 *
 * # Modo watch (útil durante desenvolvimento)
 * pnpm test:visual:watch
 *
 * # Ver cobertura de testes
 * pnpm test:visual:coverage
 *
 * # Rodar teste específico
 * pnpm test:visual -t "Login Page"
 *
 * # Limpar cache e rodar testes
 * pnpm jest --clearCache && pnpm test:visual
 */

// ============================================================================
// DEBUGGING
// ============================================================================

/*
 * PROBLEMA: "Snapshot is outdated"
 * SOLUÇÃO:
 * 1. Deletar pasta __snapshots__
 * 2. Rodar: pnpm test:visual
 * 3. Revisar novos snapshots
 * 4. Commitar
 *
 * PROBLEMA: "Cannot find module"
 * SOLUÇÃO:
 * 1. Verificar imports no teste
 * 2. Verificar se arquivo existe
 * 3. Limpar cache: pnpm jest --clearCache
 *
 * PROBLEMA: "TypeError: X is not a function"
 * SOLUÇÃO:
 * 1. Verificar mocks (next/navigation, next-auth, etc)
 * 2. Verificar se componente exporta default
 * 3. Adicionar mock necessário no teste
 *
 * PROBLEMA: Snapshot muito grande
 * SOLUÇÃO:
 * 1. Mock dados dinâmicos
 * 2. Testar apenas parte do componente
 * 3. Usar queries mais específicas
 */

// ============================================================================
// CHECKLIST ANTES DE COMMITAR
// ============================================================================

/*
 * ☐ Rodei todos os testes visuais
 * ☐ Revisei cada diferença de snapshot
 * ☐ Testei visualmente no navegador
 * ☐ Mudanças são intencionais e aprovadas
 * ☐ Snapshots estão incluídos no commit
 * ☐ Mensagem de commit explica mudança visual
 * ☐ PR/MR inclui screenshots se necessário
 *
 * MENSAGEM DE COMMIT SUGERIDA:
 * "chore: update visual snapshots after button color change"
 * "test: add visual regression tests for new Modal component"
 * "fix: correct visual regression test mocks"
 */

// ============================================================================
// BOAS PRÁTICAS
// ============================================================================

/*
 * 1. RODE TESTES FREQUENTEMENTE
 *    - Antes de começar a trabalhar
 *    - Após cada mudança visual
 *    - Antes de commitar
 *
 * 2. MANTENHA SNAPSHOTS LIMPOS
 *    - Não commite snapshots desnecessários
 *    - Delete snapshots de testes removidos
 *    - Use .gitignore se necessário
 *
 * 3. DOCUMENTE MUDANÇAS VISUAIS
 *    - No commit message
 *    - No PR description
 *    - Adicione screenshots
 *
 * 4. REVISE CUIDADOSAMENTE
 *    - Não atualize snapshots às cegas
 *    - Entenda cada diferença
 *    - Teste no navegador quando necessário
 *
 * 5. MANTENHA TESTES ATUALIZADOS
 *    - Adicione testes para novos componentes
 *    - Remova testes de componentes deletados
 *    - Atualize testes quando API muda
 */

// ============================================================================
// INTEGRAÇÃO COM GIT
// ============================================================================

/*
 * # Ver snapshots modificados
 * git status
 * git diff __tests__/visual-regression/__snapshots__
 *
 * # Adicionar snapshots ao commit
 * git add __tests__/visual-regression/__snapshots__
 *
 * # Ver histórico de mudanças em snapshot
 * git log --follow __tests__/visual-regression/__snapshots__/page-snapshots.test.tsx.snap
 *
 * # Reverter snapshots (se atualização foi erro)
 * git checkout HEAD -- __tests__/visual-regression/__snapshots__
 *
 * # Criar commit apenas com snapshots
 * git add __tests__/visual-regression/__snapshots__
 * git commit -m "chore: update visual regression snapshots"
 */

export {};
