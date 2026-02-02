# QWork - Nova Identidade Visual 🎨

## Implementação Concluída

Este documento resume as mudanças implementadas para a nova identidade visual do QWork.

## ✅ Mudanças Implementadas

### 1. **Estrutura Base de Branding**

#### Arquivo de Configuração: `lib/config/branding.ts`

- ✅ Cores definidas (Preto base + Verde para ações)
- ✅ Logo em base64 (placeholder - **SUBSTITUIR pelo logo real**)
- ✅ Dimensões para diferentes contextos
- ✅ Slogan "AVALIE. PREVINA. PROTEJA."

### 2. **Componentes Reutilizáveis**

#### `components/QworkLogo.tsx`

- ✅ Componente React com variações de tamanho (sm, md, lg, xl)
- ✅ Função para HTML em PDFs (`getLogoHTMLForPDF`)
- ✅ Função para marca d'água (`getWatermarkLogoHTML`)

### 3. **Templates Puppeteer**

#### `lib/pdf/puppeteer-templates.ts`

- ✅ Header template com logo e título
- ✅ Footer template com slogan e numeração
- ✅ Marca d'água centralizada
- ✅ Logo para assinatura (Laudo Biopsicossocial)
- ✅ Estilos CSS base para PDFs

### 4. **Sistema de Cores Atualizado**

#### Arquivos Modificados:

- ✅ `app/globals.css` - Variáveis CSS root
- ✅ `tailwind.config.ts` - Configuração Tailwind
- ✅ `app/layout.tsx` - Theme color
- ✅ `components/Header.tsx` - Header com nova identidade

**Nova Paleta:**

```css
--primary: #000000       /* Preto - base institucional */
--accent: #9ACD32        /* Verde - botões e ações */
--secondary: #4A5568     /* Cinza escuro */
```

### 5. **PDFs Atualizados**

#### A) **Laudo Biopsicossocial** ✅

- **Arquivo:** `lib/templates/laudo-html.ts`
- **Mudança:** Logo QWork adicionado abaixo da assinatura do Coordenador responsável técnico
- **Método:** Puppeteer + HTML template

#### B) **Relatório por Setor** ✅

- **Arquivos:**
  - `app/api/rh/relatorio-setor-pdf/route.ts`
  - `components/RelatorioSetor.tsx`
- **Mudança:** Marca d'água centralizada no PDF + Logo no modal React
- **Método:** Puppeteer + HTML inline

#### C) **Relatório Individual** ✅

- **Arquivos:**
  - `lib/templates/relatorio-individual-html.ts` (NOVO)
  - `app/api/rh/relatorio-individual-pdf/route.ts` (NOVO)
  - `app/rh/empresa/[id]/lote/[loteId]/page.tsx` (atualizado)
- **Mudança:** Migrado de jsPDF para Puppeteer, logo como marca d'água sutil
- **Método:** Puppeteer + HTML template
- **Formato:** Mantido em 1 página

#### D) **Relatório de Lote** ✅

- **Arquivos:**
  - `lib/templates/relatorio-lote-html.ts` (NOVO)
  - `app/api/rh/relatorio-lote-pdf/route.ts` (NOVO)
  - `app/rh/empresa/[id]/lote/[loteId]/page.tsx` (atualizado)
- **Mudança:** Migrado de jsPDF para Puppeteer
- **Formato:** Capa com logo grande na primeira página + contador em todas as páginas

### 6. **Headers de Todos os Perfis** ✅

- ✅ Header principal atualizado (`components/Header.tsx`)
- ✅ Logo placeholder visível
- ✅ Slogan exibido
- ✅ Nova paleta de cores aplicada

---

## 📝 AÇÕES NECESSÁRIAS

### ⚠️ **CRÍTICO - Substituir Logo Placeholder**

O logo atual é um placeholder. Para finalizar:

1. **Converter logo real para base64:**

   ```bash
   # Opção 1: Online
   # Use: https://www.base64-image.de/

   # Opção 2: Node.js
   node -e "console.log('data:image/png;base64,' + require('fs').readFileSync('logo.png').toString('base64'))"
   ```

2. **Substituir em `lib/config/branding.ts`:**

   ```typescript
   export const QWORK_LOGO_BASE64 = `data:image/png;base64,iVBORw0K...SEU_LOGO_AQUI`;
   ```

3. **Atualizar placeholder do Header em `components/Header.tsx`:**

   ```tsx
   // Linha ~105 - Substituir:
   <div style={{...}}>...</div>

   // Por:
   <img
     src={QWORK_BRANDING.logo.base64}
     alt="QWork"
     style={{ width: '100%', height: '100%', objectFit: 'contain' }}
   />
   ```

---

## 🧪 TESTES RECOMENDADOS

### Testes Visuais

1. **Laudo Biopsicossocial**

   - [ ] Logo aparece abaixo da assinatura
   - [ ] Logo não sobrepõe texto
   - [ ] Qualidade do logo adequada

2. **Relatório por Setor**

   - [ ] Marca d'água centralizada no PDF
   - [ ] Opacidade não atrapalha leitura (0.08)
   - [ ] Logo visível no modal React

3. **Relatório Individual**

   - [ ] Mantém formato de 1 página
   - [ ] Marca d'água sutil não atrapalha
   - [ ] Todos os dados visíveis

4. **Relatório de Lote**

   - [ ] Capa com logo grande na primeira página
   - [ ] Contador "Página X de Y" em todas as páginas
   - [ ] Header/footer consistentes

5. **Headers**
   - [ ] Logo visível em todos os perfis
   - [ ] Slogan legível
   - [ ] Cores aplicadas corretamente

### Testes Funcionais

```bash
# Rodar testes existentes (podem precisar de ajustes)
pnpm test

# Testes específicos de PDFs
pnpm test __tests__/lib/pdf-laudo-generator.test.ts
pnpm test __tests__/lib/pdf-relatorio-generator.test.ts
```

⚠️ **Nota:** Testes podem falhar devido às mudanças. Atualize snapshots se necessário:

```bash
pnpm test -- -u
```

---

## 📊 ESTRUTURA DE ARQUIVOS CRIADOS/MODIFICADOS

### Novos Arquivos

```
lib/
  config/
    branding.ts                        # Configuração de identidade visual
  pdf/
    puppeteer-templates.ts             # Templates reutilizáveis para PDFs
  templates/
    relatorio-individual-html.ts       # Template HTML relatório individual
    relatorio-lote-html.ts             # Template HTML relatório lote

components/
  QworkLogo.tsx                        # Componente logo reutilizável

app/
  api/
    rh/
      relatorio-individual-pdf/
        route.ts                       # API PDF individual (Puppeteer)
      relatorio-lote-pdf/
        route.ts                       # API PDF lote (Puppeteer)
```

### Arquivos Modificados

```
app/
  globals.css                          # Cores CSS root
  layout.tsx                           # Theme color
  rh/
    empresa/[id]/
      page.tsx                         # Botões com novas cores
      lote/[loteId]/
        page.tsx                       # Chamadas para novas APIs
    page.tsx                           # Botões atualizados

components/
  Header.tsx                           # Nova identidade visual
  RelatorioSetor.tsx                   # Logo no modal

lib/
  templates/
    laudo-html.ts                      # Logo após assinatura

app/
  api/
    rh/
      relatorio-setor-pdf/
        route.ts                       # Marca d'água adicionada

tailwind.config.ts                     # Nova paleta de cores
```

---

## 🎯 PRÓXIMOS PASSOS SUGERIDOS

### Curto Prazo (Crítico)

1. **Substituir logo placeholder** pelo logo real em base64
2. **Testar todos os PDFs** visualmente
3. **Validar em ambiente de staging** antes de produção

### Médio Prazo (Melhorias)

1. **Otimizar tamanho do logo** (PNG otimizado ou SVG)
2. **Ajustar opacidades** das marcas d'água se necessário
3. **Atualizar testes automatizados** com novos snapshots
4. **Documentar padrões** de uso do logo para futuros desenvolvedores

### Longo Prazo (Opcional)

1. **Dark mode** com nova paleta
2. **Animações** de transição para nova identidade
3. **A/B testing** de usabilidade com usuários reais

---

## 🔧 TROUBLESHOOTING

### Logo não aparece no PDF

1. Verificar se base64 está completo (começa com `data:image/png;base64,`)
2. Testar base64 em navegador: `<img src="data:image/..." />`
3. Verificar logs do Puppeteer no console

### Cores não mudaram

1. Limpar cache do browser (Ctrl+Shift+Del)
2. Verificar se `globals.css` foi compilado
3. Rodar `pnpm dev` novamente

### PDF muito grande

1. Otimizar imagem do logo (reduzir dimensões)
2. Usar PNG otimizado ou converter para SVG
3. Ajustar opacidade das marcas d'água

### Testes falhando

1. Atualizar snapshots: `pnpm test -- -u`
2. Verificar se todas as importações estão corretas
3. Mockar `QWORK_BRANDING` se necessário nos testes

---

## 📞 SUPORTE

Para dúvidas sobre a implementação:

- Revisar este documento
- Verificar comentários nos arquivos modificados
- Consultar `lib/config/branding.ts` para referência das cores

---

**Implementação realizada em:** 14 de dezembro de 2025  
**Versão:** 1.0.0 - Nova Identidade Visual  
**Status:** ✅ Implementação Concluída - Aguardando logo real
