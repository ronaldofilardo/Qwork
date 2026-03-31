/**
 * @file __tests__/rh/clinica-notificacoes.test.tsx
 * Testes: Clinica - Notificações
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import RhPage from '@/app/rh/page';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

describe('Clinica - Notificações', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock global.fetch
    (global as any).fetch = jest.fn((url: string) => {
      if (url === '/api/auth/session') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ cpf: '111', nome: 'RH Teste', perfil: 'rh' }),
        });
      }
      if (url === '/api/rh/empresas') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: 1,
                nome: 'Empresa Teste',
                cnpj: '00.000.000/0000-00',
                ativa: true,
              },
            ]),
        });
      }
      if (url === '/api/rh/notificacoes') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              notificacoes: [
                {
                  id: 'n1',
                  tipo: 'laudo_enviado',
                  lote_id: 1,
                  titulo: 'Lote 1',
                  empresa_nome: 'Empresa Teste',
                  data_evento: new Date().toISOString(),
                },
              ],
              totalNaoLidas: 1,
            }),
        });
      }
      return Promise.resolve({ ok: false });
    });
  });

  it('deve abrir a seção de notificações e renderizar itens', async () => {
    // Renderizar a página principal de RH e a seção de notificações separadamente
    render(<RhPage />);

    // Espera o carregamento inicial
    await waitFor(() =>
      expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument()
    );

    // Renderizar a seção de notificações diretamente (comportamento isolado)
    const NotificationsSection =
      require('@/components/NotificationsSection').default;
    render(<NotificationsSection onNavigateToLote={() => {}} />);

    await waitFor(() => {
      expect(
        screen.getByText('🔔 Notificações da Clínica')
      ).toBeInTheDocument();
      // O componente exibe o lote_id numérico — pode haver múltiplos '1' (badge + cell)
      const allOnes = screen.getAllByText('1');
      expect(allOnes.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('deve mostrar placeholder quando API retorna vazio', async () => {
    (global as any).fetch = jest.fn((url: string) => {
      if (url === '/api/auth/session')
        return Promise.resolve({
          ok: true,
          json: async () => ({ cpf: '111', nome: 'RH Teste', perfil: 'rh' }),
        });
      if (url === '/api/rh/empresas')
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 1,
              nome: 'Empresa Teste',
              cnpj: '00.000.000/0000-00',
              ativa: true,
            },
          ],
        });
      if (url === '/api/rh/notificacoes')
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            notificacoes: [],
            totalNaoLidas: 0,
          }),
        });
      return Promise.resolve({ ok: false });
    });

    const NotificationsSection =
      require('@/components/NotificationsSection').default;
    render(<NotificationsSection onNavigateToLote={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('🔔')).toBeInTheDocument();
      expect(screen.getByText('Nenhuma notificação')).toBeInTheDocument();
    });
  });
});
