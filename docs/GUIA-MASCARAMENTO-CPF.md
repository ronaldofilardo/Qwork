# 🎨 Guia de Atualização de Componentes UI - Mascaramento CPF

## 📋 Visão Geral

Este guia mostra como atualizar componentes existentes para exibir CPF mascarado conforme LGPD.

---

## ✅ Padrões de Uso

### 1. Importar o Componente

```tsx
import CPFMascarado, {
  ConsentimentoBadge,
  DadosAnonimizados,
} from '@/components/common/CPFMascarado';
```

### 2. Substituir Exibição de CPF

**❌ ANTES (expõe CPF completo):**

```tsx
<td className="px-3 py-2 text-sm text-gray-900 font-mono">{funcionario.cpf}</td>
```

**✅ DEPOIS (CPF mascarado):**

```tsx
<td className="px-3 py-2 text-sm text-gray-900">
  <CPFMascarado cpf={funcionario.cpf} />
</td>
```

**✅ PARA ADMINISTRADORES (com opção de revelar):**

```tsx
<td className="px-3 py-2 text-sm text-gray-900">
  <CPFMascarado
    cpf={funcionario.cpf}
    revelarCompleto={session.perfil === 'admin'}
  />
</td>
```

---

## 🔍 Exemplos de Migração

### Exemplo 1: Tabela de Funcionários

**ANTES:**

```tsx
<tbody>
  {funcionarios.map((func) => (
    <tr key={func.cpf} className="hover:bg-gray-50">
      <td className="px-3 py-2 text-sm font-mono">{func.cpf}</td>
      <td className="px-3 py-2 text-sm">{func.nome}</td>
      <td className="px-3 py-2 text-sm">{func.email}</td>
    </tr>
  ))}
</tbody>
```

**DEPOIS:**

```tsx
import CPFMascarado from '@/components/common/CPFMascarado';

<tbody>
  {funcionarios.map((func) => (
    <tr key={func.cpf} className="hover:bg-gray-50">
      <td className="px-3 py-2 text-sm">
        <CPFMascarado cpf={func.cpf} revelarCompleto={isAdmin} />
      </td>
      <td className="px-3 py-2 text-sm">{func.nome}</td>
      <td className="px-3 py-2 text-sm">{func.email}</td>
    </tr>
  ))}
</tbody>;
```

### Exemplo 2: Detalhes do Funcionário

**ANTES:**

```tsx
<div className="space-y-4">
  <div>
    <label className="font-semibold">CPF:</label>
    <span className="ml-2 font-mono">{funcionario.cpf}</span>
  </div>
  <div>
    <label className="font-semibold">Nome:</label>
    <span className="ml-2">{funcionario.nome}</span>
  </div>
</div>
```

**DEPOIS:**

```tsx
import CPFMascarado from '@/components/common/CPFMascarado';

<div className="space-y-4">
  <div>
    <label className="font-semibold">CPF:</label>
    <CPFMascarado
      cpf={funcionario.cpf}
      revelarCompleto={isAdminOrRH}
      className="ml-2"
    />
  </div>
  <div>
    <label className="font-semibold">Nome:</label>
    <span className="ml-2">{funcionario.nome}</span>
  </div>
</div>;
```

### Exemplo 3: Badge de Consentimento

**Exibir status de conformidade LGPD:**

```tsx
import { ConsentimentoBadge } from '@/components/common/CPFMascarado';

<div className="flex items-center gap-2">
  <CPFMascarado cpf={func.cpf} />
  <ConsentimentoBadge
    baseLegal={avaliacao.base_legal}
    dataConsentimento={avaliacao.data_consentimento}
  />
</div>;
```

**Resultado visual:**

```
***.***.***-45  📄 Contrato
***.***.***-67  ✅ Consentimento
***.***.***-89  ⚠️ Sem base legal
```

### Exemplo 4: Indicador de Dados Anonimizados

```tsx
import { DadosAnonimizados } from '@/components/common/CPFMascarado';

<div className="space-y-2">
  <h3>Avaliação #{avaliacao.id}</h3>

  {avaliacao.anonimizada && (
    <DadosAnonimizados
      anonimizada={true}
      dataAnonimizacao={avaliacao.data_anonimizacao}
    />
  )}

  <div>
    <CPFMascarado cpf={avaliacao.funcionario_cpf} />
  </div>
</div>;
```

---

## 🚫 Casos Especiais - Quando NÃO Mascarar

### 1. Filtros de Busca (Backend)

CPFs devem ser buscados **sem formatação** no backend:

```typescript
// ✅ Correto
const cpfLimpo = limparCPF(cpfInput);
const resultado = await query('SELECT * FROM funcionarios WHERE cpf = $1', [
  cpfLimpo,
]);
```

### 2. Keys do React

Use CPF completo (não formatado) como key:

```tsx
// ✅ Correto
{
  funcionarios.map((func) => (
    <div key={func.cpf}>
      <CPFMascarado cpf={func.cpf} />
    </div>
  ));
}
```

### 3. Logs (Sempre Mascarar)

```typescript
import { mascararCPFParaLog } from '@/lib/cpf-utils';

// ❌ NUNCA faça isso
console.log('Funcionário:', funcionario.cpf);

// ✅ Sempre mascare
console.log('Funcionário:', mascararCPFParaLog(funcionario.cpf));
```

---

## 📊 Auditoria de Componentes

### Buscar componentes que exibem CPF sem mascaramento:

```powershell
# Buscar possíveis violações
grep -r "func.cpf\|funcionario.cpf\|\.cpf" app/ components/ --include="*.tsx" --include="*.jsx"

# Buscar logs com CPF
grep -r "console.log.*cpf\|console.error.*cpf" app/ --include="*.ts" --include="*.tsx"
```

### Checklist de Migração:

- [ ] Tabelas de funcionários atualadas
- [ ] Modais de edição atualizados
- [ ] Páginas de detalhes atualizadas
- [ ] Relatórios PDF com mascaramento
- [ ] Exports Excel com mascaramento
- [ ] Logs de auditoria mascarados
- [ ] Mensagens de erro mascaradas

---

## 🎨 Customização do Componente

### Exemplo com estilos personalizados:

```tsx
<CPFMascarado
  cpf="12345678909"
  revelarCompleto={true}
  className="text-lg font-bold text-blue-600"
/>
```

### Criar variante para impressão:

```tsx
// components/common/CPFParaImpressao.tsx
import { mascararCPF } from '@/lib/cpf-utils';

export default function CPFParaImpressao({ cpf }: { cpf: string }) {
  return (
    <span className="print:font-mono print:text-sm">{mascararCPF(cpf)}</span>
  );
}
```

---

## 📝 Padrões de Nomenclatura

### Estados de permissão:

```typescript
// ✅ Bons nomes
const isAdmin = session.perfil === 'admin';
const canRevealCPF = ['admin', 'emissor'].includes(session.perfil);
const isOwnData = func.cpf === session.cpf;

// ❌ Evite
const showCPF = true; // Ambíguo - mascarado ou completo?
```

### Props do componente:

```typescript
interface CPFDisplayProps {
  cpf: string; // ✅ CPF sem formatação (11 dígitos)
  revelarCompleto?: boolean; // ✅ Permitir revelação
  className?: string; // ✅ Estilos adicionais
}
```

---

## 🧪 Testes

### Testar exibição mascarada:

```tsx
import { render, screen } from '@testing-library/react';
import CPFMascarado from '@/components/common/CPFMascarado';

test('deve exibir CPF mascarado', () => {
  render(<CPFMascarado cpf="12345678909" />);

  // Deve mostrar apenas últimos 4 dígitos
  expect(screen.getByText(/\*\*\*\.\*\*\*\.\*89-09/)).toBeInTheDocument();

  // Não deve mostrar CPF completo
  expect(screen.queryByText('123.456.789-09')).not.toBeInTheDocument();
});

test('deve permitir revelação para admin', () => {
  render(<CPFMascarado cpf="12345678909" revelarCompleto={true} />);

  const button = screen.getByRole('button', { name: /Ver/i });
  fireEvent.click(button);

  // Após clicar, deve mostrar CPF completo
  expect(screen.getByText('123.456.789-09')).toBeInTheDocument();
});
```

---

## 📚 Referências

- [LGPD Art. 6º, III - Princípio da Necessidade](https://www.gov.br/anpd/pt-br)
- [Boas Práticas ANPD - Minimização de Dados](https://www.gov.br/anpd/pt-br/assuntos/guias)
- Componente: [components/common/CPFMascarado.tsx](../components/common/CPFMascarado.tsx)
- Utilitários: [lib/cpf-utils.ts](../lib/cpf-utils.ts)
