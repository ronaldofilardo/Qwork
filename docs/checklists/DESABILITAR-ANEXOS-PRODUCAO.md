# Checklist: Desabilitar Anexos em Produção

## Status do Problema

✅ Identificado: Variável `NEXT_PUBLIC_DISABLE_ANEXOS=true` não está configurada na Vercel  
❌ Produção ainda exige anexos para cadastro de contratantes

## Passos para Resolver

### 1. Configurar Variável na Vercel

- [ ] Acessar https://vercel.com/dashboard
- [ ] Selecionar projeto QWork
- [ ] Ir em **Settings** → **Environment Variables**
- [ ] Adicionar nova variável:
  - Name: `NEXT_PUBLIC_DISABLE_ANEXOS`
  - Value: `true`
  - Environments: ✅ Production ✅ Preview
- [ ] Salvar

### 2. Fazer Novo Deploy

- [ ] Disparar novo deploy ou fazer redeploy do último commit
  - **Importante:** Variáveis `NEXT_PUBLIC_*` só são aplicadas após rebuild!

### 3. Verificar em Produção

- [ ] Acessar aplicação em produção
- [ ] Iniciar cadastro de contratante
- [ ] Verificar na etapa "Dados da Empresa":
  - [ ] Campos de upload devem estar **disabled**
  - [ ] Deve mostrar: "Uploads temporariamente desabilitados"
  - [ ] Deve permitir avançar sem anexos
- [ ] Verificar na etapa "Responsável":
  - [ ] Campo "Documento de Identificação" também disabled
  - [ ] Deve permitir concluir cadastro sem documentos

### 4. Testar Fluxo Completo

- [ ] Completar um cadastro teste em produção
- [ ] Verificar se não há erros de validação relacionados a arquivos
- [ ] Confirmar que contratante foi cadastrado com sucesso

## Alternativa: Via CLI

Se preferir usar terminal:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Adicionar variável
vercel env add NEXT_PUBLIC_DISABLE_ANEXOS
# Quando solicitado, inserir: true
# Selecionar: Production

# Fazer deploy
vercel --prod
```

## Referências

- [Documentação completa](CONFIGURACAO-PRODUCAO-ANEXOS.md)
- [README - Seção de Variáveis de Ambiente](../README.md#variáveis-de-ambiente-importantes)

## Observações

⚠️ Esta é uma solução **temporária** - no futuro os anexos podem ser reativados quando necessário

## Data

29/01/2026
