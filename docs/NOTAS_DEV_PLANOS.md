# Notas de desenvolvimento — Planos e Preços

Pequena referência para desenvolvedores e QA sobre como o sistema trata os valores de preço dos planos.

- Formato de dados do banco:
  - Em algumas consultas, colunas numéricas do Postgres podem chegar ao frontend como _string_ (por exemplo `'24.00'`) devido a bibliotecas ou camadas intermediárias.
  - O frontend normaliza internamente (tenta converter para number usando `Number(String(valor).replace(',', '.'))`) para evitar erros de renderização e garantir formatação correta.

- Regras de exibição:
  - Planos do tipo `fixo` são apresentados como **preço anual por funcionário**. No card do plano (admin) e na seleção de plano (cadastro) exibimos:
    - `R$ XX,YY` — valor (quando `preco > 0`)
    - rótulo: **Preço anual por funcionário** (em destaque)
  - Planos com `preco <= 0` são tratados como **Sob consulta** (apresentado em laranja e com destaque). Esses planos não requerem pagamento automático e devem passar por negociação manual.
  - Para planos fixos com parcelas, exibimos a informação de `parcelas_max` se presente (ex.: `Até 12x sem juros`).

- Comportamento em formulários:
  - Na etapa de seleção de plano (cadastro), para planos `fixo` mostramos um campo numérico para quantidade de funcionários e calculamos o **Total anual** como `numeroFuncionarios * preco` (preço anual por funcionário).
  - Validamos localmente (UI) e no backend (endpoint `/api/cadastro/contratante`) que `numero_funcionarios_estimado` não exceda `caracteristicas.limite_funcionarios` quando definido.

- Testes:
  - Há testes unitários cobrindo:
    - Preços vindos como `string` são formatados corretamente (`__tests__/components/ModalCadastroContratante.precoString.test.tsx`).
    - Validação de limite de funcionários no endpoint do cadastro (`__tests__/api/cadastro-contratante-validation.test.ts`).

- Observações para QA/dev:
  - Se um plano novo for criado diretamente no banco com `preco` como string (p.ex: `'24.00'`), o frontend ainda deverá mostrar `R$ 24,00` e permitir cálculo de totais.
  - Para demos, use o endpoint de simulação de pagamento (`POST /api/pagamento/simular`) ou o botão "Simular Pagamento" no modal de pagamento (apenas disponível em ambientes de desenvolvimento) para liberar o fluxo sem integrar um gateway.

Se necessário, podemos adicionar pequenas utilitários de conversão centralizados (`lib/valor.ts`) para garantir comportamento idêntico em toda a base de código.
