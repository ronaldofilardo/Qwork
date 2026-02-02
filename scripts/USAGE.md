# Guia de Uso dos Scripts - Raiz da Pasta /scripts

## Scripts Higienizados e Sanitizados

### Gerenciamento de Contas

#### createGestorAccount.cjs

Cria ou atualiza conta de gestor de entidade.

```bash
node scripts/createGestorAccount.cjs <CPF>
```

#### createGestorRH.cjs

Cria ou atualiza conta de gestor RH.

```bash
node scripts/createGestorRH.cjs <CPF> <Nome> <Email> <ClinicaID>
```

#### runCriarConta.ts

Cria conta de responsável a partir de um contratante existente.

```bash
node scripts/runCriarConta.ts <ContratanteID> <CNPJ>
```

### Gerenciamento de Senhas

#### updateFuncionarioHash.cjs

Atualiza hash de senha de um funcionário.

```bash
node scripts/updateFuncionarioHash.cjs <CPF> <Senha>
```

#### set-hash.js

Define hash de senha para funcionário e opcionalmente contratante_senhas.

```bash
node scripts/set-hash.js <CPF> <Senha> [ContratanteID]
```

### Verificação e Debug

#### check-db.ts

Verifica conexão e informações do banco de dados.

```bash
node scripts/check-db.ts
```

#### check-cpf.ts

Busca funcionário por CPF.

```bash
node scripts/check-cpf.ts <CPF>
```

#### check-data.ts

Exibe estatísticas gerais de funcionários e contratantes_senhas.

```bash
node scripts/check-data.ts
```

#### check-contratantes.ts

Exibe estatísticas de contratantes e senhas configuradas.

```bash
node scripts/check-contratantes.ts
```

#### check-login.js

Testa autenticação de funcionário.

```bash
node scripts/check-login.js <CPF> <Senha>
```

#### debug-cobranca.js

Debug de informações de cobrança por CNPJ.

```bash
node scripts/debug-cobranca.js <CNPJ>
```

#### test-conn.ts

Testa conexão básica com o banco.

```bash
node scripts/test-conn.ts
```

#### test-env-vars.ts

Verifica variáveis de ambiente carregadas.

```bash
node scripts/test-env-vars.ts
```

### Testes de API

#### callConfirm.ts

Testa endpoint de confirmação de pagamento.

```bash
node scripts/callConfirm.ts <PagamentoID>
```

#### callConfirmThis.ts

Testa endpoint de confirmação de pagamento (versão alternativa).

```bash
node scripts/callConfirmThis.ts <PagamentoID>
```

#### confirm_payment.js

Confirma pagamento via fetch API.

```bash
node scripts/confirm_payment.js <PagamentoID> [MetodoPagamento] [NumeroParcelas]
```

## Variáveis de Ambiente Necessárias

Certifique-se de que seu arquivo `.env.local` contém:

```env
DATABASE_URL=sua_connection_string
LOCAL_DATABASE_URL=sua_connection_string_local
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Alterações de Higienização

### ✅ Removido

- Credenciais hardcoded (senhas de banco de dados)
- CPFs, CNPJs e senhas expostas no código
- Arquivos duplicados (updateFuncionarioHash.js)
- Arquivos temporários (temp_hash.ts)

### ✅ Melhorado

- Uso de variáveis de ambiente
- Parametrização via argumentos de linha de comando
- Mensagens de erro e uso mais claras
- Queries mais úteis e genéricas
- Tratamento de erros consistente

### ⚠️ Importante

- Todos os scripts agora requerem argumentos para dados sensíveis
- Use `.env.local` para configuração de banco de dados
- Nunca commite credenciais no código fonte
