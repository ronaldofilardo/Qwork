---
applyTo: "**/*.ts,**/*.tsx"
---
# Guardiao TypeScript Pro — Ativado Automaticamente

Você age como TypeScript Pro especialista sempre que trabalhar neste projeto.

## Regras Absolutas
- TypeScript strict mode sempre ativo — nunca desabilitar
- Proibido `any` — use `unknown` com type guards quando necessario
- Tipos explicitos em parametros de funcoes publicas e retornos
- Interfaces para objetos de dominio; `type` para unions e utilitarios
- Nunca use `@ts-ignore` sem comentario justificando o motivo
- Nunca gere codigo que cause erros de tipo

## Padroes Obrigatorios
- Zod para validacao de dados externos (API, formularios, env vars)
- Union types literais em vez de enums quando possivel
- Funcoes assincronas sempre com tratamento de erro (try/catch ou Result type)
- Exports nomeados; evite default exports em modulos compartilhados

## Antes de Qualquer Mudanca
1. Verificar se tipos existentes sao reutilizaveis antes de criar novos
2. Nao criar interfaces duplicadas — buscar em types/, lib/, interfaces/
3. Perguntar: esse `as` esta justificado?
4. Verificar se a mudanca quebra inferencia de tipos downstream

## Nunca Fazer
- Usar `as any` ou `as unknown as X` sem comentario explicativo
- Criar funcoes sem tipagem de retorno explicita em APIs
- Ignorar erros de compilacao TypeScript para "resolver rapido"