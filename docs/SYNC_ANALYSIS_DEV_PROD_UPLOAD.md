# ⚠️ ANÁLISE: COMPATIBILIDADE CADASTRO COM UPLOAD - DEV vs PROD (Vercel)

## PROBLEMA IDENTIFICADO

### 1️⃣ Arquivos de Cadastro NÃO vão para Backblaze

**DEV:**

- Salva em: `public/uploads/entidades/<cnpj>/` ✅ Persistente

**PROD (Vercel - serverless):**

- Salva em: `os.tmpdir()/qwork/uploads/entidades/<cnpj>/` ❌ EFÊMERO
- **Arquivo é deletado cuando a function serverless termina**

### 2️⃣ Caminhos no Banco de Dados

Ambos os ambientes **SALVAM OS CAMINHOS** no DB:

- `entidades.cartao_cnpj_path`
- `entidades.contrato_social_path`
- `entidades.doc_identificacao_path`
- Mesmo para `clinicas_*` e `empresas_clientes`

**Mas em PROD, os caminhos referenciam files que NÃO EXISTEM** (perdidos no tmpdir).

### 3️⃣ Laudos Diferentes

**Laudos (tabela `laudos`) TÊM integração remota:**

```sql
arquivo_remoto_provider    VARCHAR(50)  -- 's3', 'b2', etc
arquivo_remoto_bucket      VARCHAR(255)
arquivo_remoto_key         VARCHAR(2048)
arquivo_remoto_url         TEXT
```

**Cadastro NÃO tem equivalente** - apenas paths locais.

---

## IMPACTO NO DEPLOY

✅ **Funções Existentes Mantidas:**

- ASAAS integration (pagamento, webhook, reconciliação)
- Monitor de Lotes e Laudos
- FlowStepsExplainer UI
- RLS policies, triggers, validators

❌ **Novo Problema Introduzido:**

- Upload de cadastro obrigatório (enablement total)
- Mas **não há persistência em PROD**
- Admin pode consultar caminhos no DB mas arquivos não existem

---

## SOLUÇÕES RECOMENDADAS

### Opção A: Desabilitar Upload de Cadastro em PROD (Curta Prazo)

```env
# .env.production (Vercel)
NEXT_PUBLIC_DISABLE_ANEXOS=true
```

**Restaura comportamento anterior:**

- Cadastro funciona sem arquivos
- Deixa uploads para manual/admin depois
- Simples, sem mudanças de código

### Opção B: Integrar Backblaze para Cadastro (Correto)

1. Criar client B2 similar ao de laudos
2. Modificar `salvarArquivo` para fazer upload paralelo a B2
3. Salvar `arquivo_remoto_*` columns nas tabelas de cadastro
4. Fallback para tmpdir se B2 falhar

**Custo:** ~2-3 horas de implementação e testes

### Opção C: Usar S3/AWS Direct (Se houver já configurado)

Similar a B, mas com AWS S3 em vez de Backblaze.

---

## RESULTADO DO TESTE ATUAL

| Componente              | Status | Notas                         |
| ----------------------- | ------ | ----------------------------- |
| Tabelas Criadas         | ✅     | 60 tabelas, índices, triggers |
| Migrations Aplicadas    | ✅     | Até versão 1101 no Neon       |
| Validadores Frontend    | ✅     | Arquivos obrigatórios         |
| Validadores Backend     | ✅     | Tipos, tamanhos validados     |
| Persistência DEV        | ✅     | `public/uploads/`             |
| **Persistência PROD**   | ❌     | `/tmp/` é efêmero             |
| Backblaze para Cadastro | ❌     | Não implementado              |
| RLS, ASAAS, Triggers    | ✅     | Mantidas intactas             |

---

## RECOMENDAÇÃO IMEDIATA

**Antes de fazer push para PROD:**

1. ✅ ESCOLHER solução (A, B ou C)
2. ✅ SE escolher A: Adicionar `NEXT_PUBLIC_DISABLE_ANEXOS=true` em Vercel env vars
3. ✅ SE escolher B/C: Implementar camada de storage remoto

**NÃO FAZER DEPLOY** com upload obrigatório sem persistência garantida.
