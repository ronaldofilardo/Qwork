# Guia Rápido: Gestão de Cobranças (Painel Administrativo)

Este guia descreve as funcionalidades da sub-aba **Gestão de Cobranças** e como utilizar os filtros, paginação e ordenação.

## Campos exibidos

A tabela exibe as seguintes colunas:

- contratante_id
- cnpj
- contrato_id
- plano_id
- plano_nome
- plano_preco
- pagamento_id
- pagamento_valor
- pagamento_status
- data_pagamento

## Filtros

- Buscar por nome ou CNPJ (campo de busca rápido, busca local com normalização do CNPJ).
- Filtrar por CNPJ (campo específico): faz requisição ao servidor `/api/admin/cobranca?cnpj=02494916000170` (CNPJ será normalizado para somente dígitos).

## Paginação e ordenação

- Controlos de página: **Anterior** / **Próxima** e seletor de registros por página (10, 20, 50).
- Ordenação: escolha de ordenação por `data_pagamento` ou `plano_preco` (asc/desc) — enviada como `sort_by` e `sort_dir`.
- Exemplo de requisição: `/api/admin/cobranca?page=2&limit=20&sort_by=data_pagamento&sort_dir=asc`

## API

- Endpoint: `GET /api/admin/cobranca`
- Query params suportados: `cnpj`, `page`, `limit`, `sort_by`, `sort_dir`
- Retorno (JSON):

```
{
  success: true,
  contratos: [ ... ],
  total: 123,
  page: 1,
  limit: 20
}
```

## Observações

- A API detecta automaticamente se a coluna de preço no catálogo de planos se chama `valor_base` ou `preco` e adapta o campo `plano_preco` para compatibilidade com esquemas antigos.
- A busca por CNPJ faz correspondência apenas nos dígitos (normalização), evitando problemas com formatação divergente.

---

Documentado por: Automação de correções (24/12/2025)
