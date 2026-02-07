# Migração de Relatório Individual: Puppeteer → jsPDF

**Data**: 3 de fevereiro de 2026  
**Objetivo**: Simplificar a geração de PDFs de avaliação individual, tornando-a mais rápida, com menos dependências e layout compacto de uma página

## 📋 Resumo das Mudanças

### Antes (Puppeteer + HTML)

- ✗ Dependência de Chromium headless (@sparticuz/chromium)
- ✗ Geração via renderização HTML em navegador
- ✗ Processo mais lento e pesado
- ✗ Maior complexidade de deploy
- ✗ Múltiplas páginas com tabelas detalhadas
- ✓ Layout rico com CSS completo

### Depois (jsPDF - Uma Página)

- ✓ Geração programática em memória
- ✓ Sem dependências de navegador
- ✓ Mais rápido e leve
- ✓ Deploy simplificado
- ✓ **Uma única página com resumo**
- ✓ Layout compacto focado em resultados
- ⚠ Sem detalhamento de questões individuais

## 🔧 Arquivos Modificados

### 1. Rotas de API

#### `app/api/entidade/lote/[id]/relatorio-individual/route.ts`

**Mudanças principais:**

- Removido: `getPuppeteerInstance`, `gerarHTMLRelatorioIndividual`, `fs`, `path`, `crypto`
- Adicionado: `jsPDF`, `applyPlugin` de `jspdf-autotable`
- Geração: Criação programática do PDF com `doc.text()` e `doc.autoTable()`
- Persistência: **REMOVIDA** - não salva mais no banco
- Retorno: Apenas como anexo (download direto)

#### `app/api/rh/relatorio-individual-pdf/route.ts`

**Mudanças principais:**

- Mesma conversão de Puppeteer para jsPDF
- Mantém a mesma estrutura de dados e layout
- Não persiste no banco

### 2. Testes

#### `__tests__/api/entidade/relatorio-individual-diagnostics.test.ts`

**Atualizações:**

- Renomeado suite: "Diagnósticos de Chromium" → "Geração com jsPDF"
- Novos testes para jsPDF e autoTable
- Removidos testes de Puppeteer/Chromium
- Adicionado teste para verificar não-persistência

## 📊 Estrutura do PDF Gerado (Uma Página)

### Layout Compacto

O relatório individual agora cabe em **uma única página A4** com:

1. **Cabeçalho**
   - Título: "Relatório Individual de Avaliação"

2. **Dados do Funcionário** (compacto)
   - Nome, CPF, Matrícula
   - Empresa, Setor, Função, Nível

3. **Dados da Avaliação**
   - Código do Lote
   - Título do Lote
   - Data de Conclusão

4. **Resultados por Domínio** (resumo)
   Para cada grupo, mostra APENAS:
   - Nome do domínio e grupo (ex: "Demandas no Trabalho - Grupo 1 - Demandas no Trabalho")
   - Média calculada e classificação colorida (ex: "Média: 62.5 - AMARELO")
   - **SEM tabelas de questões detalhadas**

5. **Rodapé**
   - Data/hora de geração

### Cores de Classificação

- **VERDE** (#166534):
  - Positiva: > 66
  - Negativa: < 33
- **AMARELO** (#854D0E):
  - Positiva: 33-66
  - Negativa: 33-66
- **VERMELHO** (#991B1B):
  - Positiva: < 33
  - Negativa: > 66

## 🎯 Dados Mantidos vs Removidos

### ✅ Mantidos

- ✓ Informações completas do funcionário
- ✓ Dados da avaliação e lote
- ✓ Médias calculadas por grupo
- ✓ Classificações (verde/amarelo/vermelho)
- ✓ Nome de cada domínio/grupo

### ❌ Removidos (para caber em 1 página)

- ✗ Tabelas detalhadas de perguntas
- ✗ Valores individuais de cada resposta
- ✗ Textos completos das questões

## 🗑️ Arquivos Removidos do Sistema

### Arquivos de Código

- ✅ `lib/infrastructure/pdf/generators/pdf-generator.ts` (getPuppeteerInstance)
- ✅ `lib/templates/relatorio-individual-html.ts` (template HTML)
- ✅ `lib/pdf-generator.ts` (wrapper antigo)

### Testes

- ✅ `__tests__/lib/pdf-generator-vercel-chromium.test.ts`
- ✅ `__tests__/lib/pdf-generator.test.ts`
- ✅ `__tests__/lib/relatorio-individual-html.test.ts`

### Scripts

- ✅ `scripts/install-puppeteer-chrome.js` (se existia)

**Nota Importante**: O arquivo `lib/laudo-auto.ts` ainda usa Puppeteer, mas é para geração de **laudos completos** (não relatórios individuais). Isso é intencional e não foi removido.

## ⚡ Benefícios

### Performance

- Geração ~3-5x mais rápida
- Menor uso de memória
- Sem overhead de navegador

### Deployment

- Sem necessidade de binários Chromium
- Build mais rápido
- Menor tamanho do bundle

### Manutenção

- Código mais simples
- Menos pontos de falha
- Debugging mais fácil

## ⚠️ Trade-offs Aceitos

### Layout

- Menos flexibilidade visual
- Sem suporte a CSS complexo
- Tabelas mais simples

### Recursos

- Sem gráficos complexos
- Sem imagens customizadas
- Cores limitadas

## 🔍 Validação

Para validar as mudanças:

1. **Teste de geração (Entidade)**

```bash
GET /api/entidade/lote/{loteId}/relatorio-individual?cpf={cpf}
```

2. **Teste de geração (RH)**

```bash
GET /api/rh/relatorio-individual-pdf?lote_id={loteId}&cpf={cpf}
```

3. **Executar testes**

```bash
pnpm test __tests__/api/entidade/relatorio-individual-diagnostics.test.ts
```

## 📝 Notas Importantes

1. **Não persiste no banco**: O PDF é gerado on-demand e retornado diretamente
2. **Mesmo fluxo de autorização**: RH e Gestor de Entidade continuam com as mesmas validações
3. **buildGruposFromRespostas**: Função helper mantida e exportada para reuso
4. **Compatibilidade**: As páginas de UI não precisam ser alteradas (mesmos endpoints)

## 🚀 Próximos Passos (Opcional)

Se necessário melhorar o visual:

1. Adicionar gráficos com Chart.js + canvas
2. Incluir logos/imagens via Data URLs
3. Criar templates mais elaborados com jsPDF

## 📚 Referências

- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)
- Arquivo de referência: `app/api/entidade/lote/[id]/relatorio/route.ts` (já usava jsPDF)
