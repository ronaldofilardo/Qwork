# Testes de Regressão Visual

## Visão Geral

Este diretório contém testes automatizados para garantir que o layout e a aparência visual das páginas e componentes não quebrem ou regridam durante o desenvolvimento.

## Tipos de Testes

### 1. Snapshots de Páginas (`page-snapshots.test.tsx`)

Captura a estrutura renderizada de todas as páginas principais:

- Login
- Avaliação (e Concluída)
- Admin Dashboard
- RH Dashboard
- Emissor
- Home
- Sucesso Cadastro
- Termos de Contrato

**Objetivo**: Detectar mudanças não intencionais na estrutura DOM das páginas.

### 2. Snapshots de Componentes (`component-snapshots.test.tsx`)

Testa componentes visuais críticos:

- Header
- QworkLogo
- QuestionCard
- RadioScale
- ProgressBar
- NavigationButtons
- FormGroup
- NotificationCenter
- ConditionalHeader

**Objetivo**: Garantir que componentes reutilizáveis mantêm sua estrutura visual.

### 3. Classes CSS e Layout (`css-layout.test.tsx`)

Valida que classes CSS críticas não são removidas:

- Cores (branco, cinza, verde, preto)
- Espaçamento (padding, margin, gap)
- Layout (flex, grid)
- Tipografia (tamanhos de fonte)
- Bordas e sombras

**Objetivo**: Prevenir remoção acidental de classes Tailwind essenciais.

### 4. Responsividade (`responsiveness.test.tsx`)

Testa layouts em diferentes viewports:

- Mobile (375px)
- Tablet (768px)
- Desktop (1920px)

Valida:

- Elementos se adaptam ao tamanho da tela
- Touch targets adequados em mobile
- Overflow e scroll
- Estados interativos (hover, focus)

**Objetivo**: Garantir que a aplicação funciona em todos os dispositivos.

### 5. Componentes Específicos (`component-specific.test.tsx`)

Testa componentes específicos de módulos:

- Componentes da Clínica (NotificationCenterClinica, Sidebar, LaudosSection)
- Componentes RH (GerenciarEmpresas, DetalhesFuncionario, RelatorioSetor)
- Componentes Admin (CentroOperacoes)
- Modais (Inativar, Resetar, InserirFuncionario, EditEmployee)
- Formulários (FormGroup)
- Botões Especiais (BotaoSolicitarEmissao, LiberarAvaliacoes)

**Objetivo**: Garantir que componentes específicos de cada módulo mantêm consistência visual.

## Como Executar

### Executar todos os testes visuais:

```bash
pnpm test:visual
```

### Executar apenas um arquivo:

```bash
pnpm test __tests__/visual-regression/page-snapshots.test.tsx
```

### Atualizar snapshots (quando mudanças são intencionais):

```bash
pnpm test:visual:update
```

### Ver cobertura:

```bash
pnpm test:visual:coverage
```

## Quando Atualizar Snapshots

Snapshots devem ser atualizados quando:

1. ✅ **Mudanças intencionais de design** são feitas
2. ✅ **Novos componentes** são adicionados
3. ✅ **Refatoração** que mantém o mesmo visual
4. ✅ **Correções de bugs** visuais aprovadas

Snapshots **NÃO** devem ser atualizados quando:

1. ❌ Testes estão falhando sem razão clara
2. ❌ Você não revisou as diferenças
3. ❌ A mudança não foi intencional

## Workflow de Desenvolvimento

### 1. Antes de fazer mudanças:

```bash
pnpm test:visual
```

✅ Todos os testes devem passar

### 2. Fazer suas mudanças no código

### 3. Executar testes novamente:

```bash
pnpm test:visual
```

### 4. Se testes falharem:

- Revisar as diferenças nos snapshots
- Se mudanças são **intencionais**: `pnpm test:visual:update`
- Se mudanças **não** são intencionais: corrigir o código

### 5. Commitar snapshots atualizados:

```bash
git add __tests__/visual-regression/__snapshots__
git commit -m "chore: update visual snapshots"
```

## Estrutura de Arquivos

```
__tests__/visual-regression/
├── README.md                          # Esta documentação
├── page-snapshots.test.tsx           # Snapshots de páginas
├── component-snapshots.test.tsx      # Snapshots de componentes
├── component-specific.test.tsx       # Componentes específicos
├── css-layout.test.tsx              # Classes CSS
├── responsiveness.test.tsx          # Responsividade
└── __snapshots__/                   # Snapshots gerados
    ├── page-snapshots.test.tsx.snap
    ├── component-snapshots.test.tsx.snap
    ├── component-specific.test.tsx.snap
    ├── css-layout.test.tsx.snap
    └── responsiveness.test.tsx.snap
```

## Manutenção

### Adicionar nova página:

1. Abrir `page-snapshots.test.tsx`
2. Adicionar novo describe block:

```typescript
describe('Página Nova', () => {
  it('deve manter estrutura visual consistente', () => {
    const NovaPage = require('@/app/nova/page').default;
    const { container } = render(<NovaPage />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

### Adicionar novo componente:

1. Abrir `component-snapshots.test.tsx`
2. Adicionar novo describe block:

```typescript
describe('NovoComponente', () => {
  it('deve manter estrutura visual consistente', () => {
    const NovoComponente = require('@/components/NovoComponente').default;
    const { container } = render(<NovoComponente />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

## Debugging

### Ver diferenças de snapshot:

Quando um teste falha, Jest mostra as diferenças no terminal:

```
- Snapshot
+ Received

- <div class="flex bg-white">
+ <div class="flex bg-gray-100">
```

### Modo watch para desenvolvimento:

```bash
pnpm test:visual:watch
```

### Ver snapshots atuais:

Arquivos `.snap` em `__snapshots__/` são legíveis e podem ser revisados no editor.

## Boas Práticas

1. **Rode testes antes de commitar**: Garante que não há regressões
2. **Revise diferenças cuidadosamente**: Não atualize snapshots às cegas
3. **Mantenha snapshots no controle de versão**: São parte do código
4. **Documente mudanças visuais**: No commit message ou PR
5. **Teste em diferentes viewports**: Use testes de responsividade
6. **Evite snapshots muito grandes**: Focam em estrutura, não em dados específicos

## Integração com CI/CD

Estes testes devem ser executados:

- ✅ No pre-commit hook
- ✅ Em pull requests
- ✅ Antes de deploy para produção

## Problemas Comuns

### Snapshots diferentes em diferentes ambientes:

- Verifique que todos usam mesma versão do Node.js
- Use mesma versão do Jest
- Normalize dados que mudam (datas, IDs aleatórios)

### Muitos snapshots falhando após merge:

- Atualize sua branch: `git merge main`
- Rode testes: `pnpm test:visual`
- Atualize se necessário: `pnpm test:visual:update`

### Snapshot muito grande:

- Considere testar apenas parte do componente
- Mock dados que geram muito conteúdo
- Use `toMatchInlineSnapshot()` para snapshots pequenos

## Recursos

- [Jest Snapshot Testing](https://jestjs.io/docs/snapshot-testing)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Contribuindo

Ao adicionar novos componentes ou páginas, sempre adicione:

1. Snapshot test
2. Teste de classes CSS essenciais
3. Teste de responsividade (se aplicável)

Isso garante que a qualidade visual é mantida ao longo do tempo.
