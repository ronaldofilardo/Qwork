# Configuração de Upload de Anexos em Produção

## Problema

Na versão de produção, o cadastro ainda está permitindo e **exigindo** arquivos para avançar, mas isso deve ser desabilitado como na versão local.

## Causa

A variável de ambiente `NEXT_PUBLIC_DISABLE_ANEXOS=true` está configurada apenas no arquivo `.env.local` (ambiente de desenvolvimento), mas **não está configurada no ambiente de produção (Vercel)**.

## Solução

### Opção 1: Configurar via Dashboard Vercel (RECOMENDADO)

1. Acesse o dashboard da Vercel: https://vercel.com/dashboard
2. Selecione o projeto QWork
3. Vá em **Settings** → **Environment Variables**
4. Adicione uma nova variável:
   - **Name:** `NEXT_PUBLIC_DISABLE_ANEXOS`
   - **Value:** `true`
   - **Environment:** Marque `Production`, `Preview` e `Development` conforme necessário
5. Clique em **Save**
6. **Faça um novo deploy** ou dispare um redeploy do último commit

### Opção 2: Via CLI Vercel

```bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Login na Vercel
vercel login

# Adicionar a variável de ambiente
vercel env add NEXT_PUBLIC_DISABLE_ANEXOS

# Quando solicitado:
# - Value: true
# - Environment: Production

# Fazer redeploy
vercel --prod
```

## Verificação

Após configurar a variável e fazer o deploy, verifique:

1. Acesse a aplicação em produção
2. Tente fazer um cadastro de contratante
3. Na etapa de "Dados da Empresa", os campos de upload devem:
   - Estar **desabilitados** (disabled)
   - Mostrar a mensagem: "Uploads temporariamente desabilitados. Você poderá anexar posteriormente."
   - **NÃO** bloquear o avanço para a próxima etapa

## Como Funciona

### Frontend (Componente)

O componente `DadosStep.tsx` verifica a variável:

```tsx
const anexosDesabilitados = process.env.NEXT_PUBLIC_DISABLE_ANEXOS === 'true';
```

E aplica:

```tsx
required={!anexosDesabilitados}
disabled={anexosDesabilitados}
```

### Backend (API)

A API `/api/cadastro/contratante/route.ts` também verifica:

```typescript
const anexosDesabilitados = process.env.NEXT_PUBLIC_DISABLE_ANEXOS === 'true';

if (!anexosDesabilitados) {
  if (!cartaoCnpjFile || !contratoSocialFile || !docIdentificacaoFile) {
    return NextResponse.json(
      { error: 'Todos os anexos são obrigatórios...' },
      { status: 400 }
    );
  }
}
```

## Importante

⚠️ **Variáveis com prefixo `NEXT_PUBLIC_`** são incorporadas no bundle durante o build. Por isso:

1. Após adicionar/alterar a variável na Vercel, é **obrigatório** fazer um novo deploy
2. Não é suficiente apenas adicionar a variável - precisa reconstruir a aplicação
3. A variável ficará exposta no código do cliente (é pública por design)

## Histórico de Alterações

- **29/01/2026**: Documentação criada para resolver problema de produção exigindo anexos
