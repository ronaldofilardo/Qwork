# Correção: QueryClientProvider - React Query Integration

## Data da Correção

4 de janeiro de 2026

## Problema Identificado

Ao logar como emissor, ocorria o seguinte erro:

```
⨯ Error: No QueryClient set, use QueryClientProvider to set one
    at useReprocessarLaudo (./hooks/useReprocessarLaudo.ts:11:94)
    at EmissorDashboard (./app/emissor/page.tsx:30:149)
```

O erro ocorria porque a aplicação estava usando hooks do React Query (`useMutation`, `useQueryClient`) sem ter configurado o `QueryClientProvider` no layout da aplicação.

## Solução Implementada

### 1. Criação do QueryClient (`lib/query-client.ts`)

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (
          error instanceof Error &&
          'status' in error &&
          typeof error.status === 'number'
        ) {
          return error.status >= 500 && failureCount < 3;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
```

### 2. Criação do QueryClientProvider (`components/QueryClientProvider.tsx`)

```typescript
'use client';

import { QueryClientProvider as TanStackQueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

interface QueryClientProviderProps {
  children: React.ReactNode;
}

export function QueryClientProvider({ children }: QueryClientProviderProps) {
  return (
    <TanStackQueryClientProvider client={queryClient}>
      {children}
    </TanStackQueryClientProvider>
  );
}
```

### 3. Integração no Layout Raiz (`app/layout.tsx`)

```typescript
import { QueryClientProvider } from '@/components/QueryClientProvider';

// ...

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryClientProvider>
          <PWAInitializer />
          <ConditionalHeader />
          {children}
          <div id="modal-root"></div>
          <Toaster position="top-right" />
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

### 4. Correção de Bug no PDF Route

Durante a implementação, foi identificado e corrigido um bug no arquivo `app/api/emissor/laudos/[loteId]/pdf/route.ts` onde `requireRole('emissor')` não estava sendo aguardado:

```typescript
// Antes (incorreto):
const user = requireRole('emissor');

// Depois (correto):
const user = await requireRole('emissor');
```

## Testes Criados

### 1. Teste do QueryClientProvider (`__tests__/query-client-provider.test.tsx`)

- ✅ Verifica se o componente renderiza children corretamente
- ✅ Valida configuração do QueryClient com opções padrão

### 2. Teste de Integração React Query (`__tests__/react-query-integration.test.tsx`)

- ✅ Confirma que hooks do React Query funcionam dentro do QueryClientProvider
- ✅ Valida que erro ocorre quando hooks são usados fora do provider

## Resultados

- ✅ Build passa sem erros
- ✅ Todos os testes passam (4/4)
- ✅ Funcionalidade do emissor restaurada
- ✅ Hooks do React Query funcionam corretamente

## Hooks Afetados

Os seguintes hooks agora funcionam corretamente:

- `useReprocessarLaudo` (usado na página do emissor)
- `useEmergenciaLaudo` (usado na página do emissor)
- Todos os outros hooks que usam `useMutation` ou `useQueryClient`

## Configuração do QueryClient

- **staleTime**: 5 minutos (dados considerados frescos)
- **gcTime**: 10 minutos (dados mantidos em cache)
- **retry**: Não tenta novamente em erros 4xx, até 3 tentativas em 5xx
- **mutations**: Sem retry automático

## Próximos Passos

1. Monitorar performance e ajustar configurações do QueryClient se necessário
2. Considerar adicionar React Query Devtools em ambiente de desenvolvimento (requer instalação do pacote `@tanstack/react-query-devtools`)
3. Implementar invalidação de cache quando necessário para manter consistência de dados
