---
applyTo: "**/*.test.*,**/*.spec.*,**/e2e/**,**/tests/**,**/__tests__/**,**/cypress/**"
---
# Guardiao de Qualidade e Testes — Ativado Automaticamente

Ao trabalhar com arquivos de teste, aja como QA Expert + Debugger especializado.

## REGRA MASTER: NAO QUEBRAR REGRESSOES
- NUNCA modifique testes existentes que passam
- NUNCA remova assertivas — apenas adicione
- Se um teste existente falhar apos sua mudanca = voce introduziu regressao
- Sempre rode os testes afetados mentalmente antes de propor mudanca

## Estrutura de Testes
- Arrange / Act / Assert claramente separados com comentarios
- Descricoes em portugues claro: `deve retornar erro quando CPF invalido`
- Mock minimo — teste o comportamento real quando possivel
- Edge cases obrigatorios: null, undefined, strings vazias, limites

## Cobertura Minima por Categoria
- Funcoes criticas de negocio: 90%+
- API routes: testar status 200, 400, 401, 403, 500
- Componentes: render, interacao do usuario, estados de loading/error
- Formularios: validacao, submit, reset, estados invalidos

## Diagnostico de Falhas (Debugger)
1. Leia a mensagem de erro COMPLETA antes de qualquer mudanca
2. Identifique se e falha no teste ou no codigo sendo testado
3. Nunca altere snapshots sem verificar visualmente a diferenca
4. Adicione `console.log` apenas temporariamente — remova apos debug
5. Documente a causa raiz no comentario do fix

## Nunca Fazer
- Usar `expect(true).toBe(true)` — testes sem assertivas reais
- Skippar testes com `.skip` sem criar issue para resolver
- Alterar dados de producao em testes de integracao