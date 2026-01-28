/**
 * Test utilities for React Query
 * Provides QueryClientProvider wrapper for tests
 */

// @ts-nocheck
import React, { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';

/**
 * Creates a new QueryClient with disabled retries for testing
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Wrapper component that provides QueryClient to children
 */
interface WrapperProps {
  children: React.ReactNode;
}

export function createWrapper(queryClient?: QueryClient) {
  const client = queryClient || createTestQueryClient();

  return function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

/**
 * Custom render method that wraps component with QueryClientProvider
 */
export function renderWithQueryClient(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient }
) {
  const { queryClient, ...renderOptions } = options || {};
  const testQueryClient = queryClient || createTestQueryClient();

  return render(ui, {
    wrapper: createWrapper(testQueryClient),
    ...renderOptions,
  });
}
