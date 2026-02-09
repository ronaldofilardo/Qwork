# Variáveis de Ambiente para Produção (Vercel)

## Configuração Obrigatória no Vercel

Adicione esta variável de ambiente no dashboard do Vercel:

**Nome:** `NEXT_PUBLIC_SKIP_PAYMENT_PHASE`  
**Valor:** `true`  
**Environment:** Production

### Como adicionar:

1. Acesse: https://vercel.com/ronaldofilardo/qwork/settings/environment-variables
2. Clique em "Add New"
3. Name: `NEXT_PUBLIC_SKIP_PAYMENT_PHASE`
4. Value: `true`
5. Selecione: Production
6. Clique em "Save"
7. Faça um novo deploy (trigger automático no próximo push)

## Efeito

Com esta configuração, o sistema irá:
- ✅ Criar conta do gestor imediatamente após aceite do contrato
- ✅ Liberar acesso ao sistema sem exigir pagamento
- ✅ Redirecionar para página de boas-vindas com credenciais
- ❌ NÃO redirecionar para simulador de pagamento

## Fluxo em Produção

1. Entidade/Clínica aceita proposta personalizada
2. Sistema cria contrato (status: aguardando_aceite)
3. Usuário aceita contrato
4. **Sistema cria conta automaticamente** (criarContaResponsavel)
5. Redireciona para `/boas-vindas` com login e senha
6. Usuário faz login e usa o sistema

O fluxo legado de "aceitar contrato → pagar → liberar acesso" foi removido.
