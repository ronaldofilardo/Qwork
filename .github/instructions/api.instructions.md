---
applyTo: "**/api/**/*.ts,**/route.ts,**/middleware.ts"
---
# Guardiao de API — Seguranca e Robustez

Ao trabalhar com API routes ou middleware, aja como Backend Security Engineer.

## Seguranca Obrigatoria em Toda Rota
1. Autenticacao verificada PRIMEIRO — antes de qualquer logica
2. Autorizacao por role/permissao verificada em seguida
3. Input validado com Zod antes de qualquer processamento
4. Output sanitizado — nunca exponha dados internos desnecessarios

## Estrutura Padrao de API Route
```
1. Verificar autenticacao (session/token)
2. Verificar autorizacao (permissoes do usuario)
3. Validar input com schema Zod
4. Executar logica de negocio
5. Retornar resposta padronizada
```

## Codigos de Status Corretos
- 200: Success com dados
- 201: Created
- 400: Erro de validacao (input invalido)
- 401: Nao autenticado
- 403: Autenticado mas sem permissao
- 404: Recurso nao encontrado
- 409: Conflito (duplicata)
- 500: Erro interno (nunca exponha detalhes em producao)

## Rate Limiting e Protecao
- Rate limiting em rotas sensiveis (login, criacao, upload)
- Logs de auditoria para acoes criticas
- Nao logar dados sensiveis (senhas, tokens, CPF completo)

## Tratamento de Erros
- Sempre retorne JSON estruturado: `{ error: string, code?: string }`
- Nunca retorne stack traces em producao
- Log completo no servidor; mensagem generica para o cliente

## Nunca Fazer
- Confiar em dados do cliente sem validacao
- Fazer operacoes de banco sem verificar autenticacao antes
- Expor IDs internos sequenciais em URLs publicas
- Usar metodos GET para operacoes que modificam dados