# Testes - API Emissor de Laudos

## 📝 Descrição

Este diretório contém testes para os endpoints relacionados à emissão de laudos, incluindo geração de PDF, hash SHA-256, armazenamento e integridade de dados.

## 🧪 Testes Disponíveis

### `hash-sha256-laudo.test.ts`

Testes para funcionalidades de hash SHA-256 e envio de laudos.

#### Funcionalidades Testadas:

1. **Geração de Hash SHA-256** - Criação de hash durante emissão de laudo
2. **Armazenamento de Hash** - Persistência do hash no banco de dados
3. **Atualização de Timestamps** - Atualização da coluna `laudo_enviado_em` no lote
4. **Exibição de Hash** - Apresentação do hash na interface quando laudo emitido

#### Cenários de Teste:

- ✅ Geração e armazenamento de hash SHA-256 do PDF durante emissão
- ✅ Atualização de timestamp `laudo_enviado_em` ao enviar laudo
- ✅ Exibição do hash na interface após emissão
- ✅ Validação de integridade do hash gerado

## 🔧 Tecnologias e Dependências

### Dependências de Teste

- **Jest**: Framework de testes
- **Puppeteer**: Geração de PDF (mockado)
- **Crypto**: Geração de hash SHA-256 (mockado)

### Mocks Utilizados

```typescript
jest.mock('@/lib/session'); // Autenticação
jest.mock('@/lib/db'); // Banco de dados
jest.mock('puppeteer'); // Geração de PDF
jest.mock('crypto'); // Hash SHA-256
```

## 📊 Estrutura do Teste

### Setup Comum

```typescript
beforeEach(() => {
  jest.clearAllMocks();

  // Mock puppeteer para geração de PDF
  // Mock crypto para hash SHA-256
  // Mock requireRole para autenticação
});
```

### Fluxo de Teste

```
1. Mock de autenticação (emissor)
2. Mock de dados do lote
3. Mock de geração de PDF
4. Mock de criação de hash
5. Verificação de armazenamento
6. Validação de timestamps
```

## 🎯 Casos de Uso Cobertos

### Emissão de Laudo

- Verificação de lote (status, empresa, clínica)
- Geração de dados do laudo
- Criação de PDF via Puppeteer
- Geração de hash SHA-256
- Armazenamento em banco de dados

### Envio de Laudo

- Atualização de status do laudo
- Registro de timestamp de envio
- Atualização do lote
- Validação de integridade

### Exibição de Hash

- Recuperação do hash do banco
- Apresentação na interface
- Validação de formato

## 🔒 Segurança e Integridade

### Hash SHA-256

- **Algoritmo**: SHA-256
- **Entrada**: Buffer do PDF gerado
- **Saída**: String hexadecimal de 64 caracteres
- **Finalidade**: Garantir integridade e imutabilidade do laudo

### Imutabilidade

- Laudos emitidos não podem ser alterados
- Hash serve como prova de integridade
- Qualquer modificação invalida o hash

## 📈 Cobertura de Código

### Arquivos Testados

- `app/api/emissor/laudos/[loteId]/route.ts`
  - `POST` - Emitir laudo
  - `PATCH` - Enviar laudo

### Funções Críticas

- Geração de PDF
- Criação de hash
- Armazenamento em banco
- Atualização de timestamps

## 🚀 Executar Testes

### Teste específico

```bash
pnpm test tests/api/emissor/laudos/hash-sha256-laudo.test.ts
```

### Todos os testes do emissor

```bash
pnpm test tests/api/emissor
```

### Com cobertura

```bash
pnpm test:coverage tests/api/emissor/laudos
```

## 📋 Checklist de Qualidade

- [x] Mocks devidamente configurados
- [x] Cleanup em beforeEach
- [x] Assertions robustas
- [x] Casos de erro cobertos
- [x] Casos de sucesso cobertos
- [x] Documentação atualizada
- [x] Sem console.log
- [x] Sem @ts-nocheck desnecessário

## 🔍 Debugging

### Logs Úteis

```typescript
// Verificar calls de mock
expect(mockQuery).toHaveBeenCalledTimes(expectedNumber);
expect(mockQuery).toHaveBeenCalledWith(expectedParams);

// Verificar hash gerado
expect(mockHash).toHaveLength(64); // SHA-256 hex
```

### Problemas Comuns

1. **Mock não configurado**: Verificar ordem de mocks
2. **Dados inconsistentes**: Validar estrutura dos mocks
3. **Timestamps incorretos**: Verificar formato de datas

## 🔄 Manutenção

### Atualização de Testes

- Adicionar novos cenários conforme funcionalidades
- Atualizar mocks quando estrutura de dados mudar
- Revisar assertions após refatorações

### Próximos Passos

- [ ] Adicionar testes de performance
- [ ] Testes de concorrência
- [ ] Testes de stress (grandes volumes)
- [ ] Testes de recuperação de falhas

## 📚 Referências

- **Documentação de Hash**: `/docs/features/laudo-hash.md`
- **Política de Mocks**: `/docs/testing/MOCKS_POLICY.md`
- **API Routes**: `/app/api/emissor/laudos/[loteId]/route.ts`

---

**Última atualização**: Janeiro 2026
**Status**: ✅ Estável
