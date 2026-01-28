import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import EmpresaDashboardPage from '@/app/rh/empresa/[id]/page';
import RhPage from '@/app/rh/page';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));

const mockSearchParams = { get: (k: string) => 'lotes' };
(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });
const useParamsMock = useParams as jest.Mock;
useParamsMock.mockReturnValue({ id: '1' });

describe('Laudos via Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      if (url.startsWith('/api/rh/dashboard'))
        return Promise.resolve({
          ok: true,
          json: async () => ({
            stats: {
              total_avaliacoes: 0,
              concluidas: 0,
              funcionarios_avaliados: 0,
            },
            resultados: [],
            distribuicao: [],
          }),
        });
      if (url.startsWith('/api/rh/funcionarios'))
        return Promise.resolve({
          ok: true,
          json: async () => ({ funcionarios: [] }),
        });
      if (url.includes('/api/rh/laudos'))
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            laudos: [
              {
                id: 1,
                lote_id: 1,
                codigo: 'LOTE1',
                titulo: 'Laudo 1',
                empresa_nome: 'Empresa Teste',
                clinica_nome: 'Clínica',
                emissor_nome: 'Dr X',
                enviado_em: new Date().toISOString(),
                hash: 'abc123',
              },
            ],
          }),
        });
      return Promise.resolve({ ok: false });
    });
  });

  it('deve abrir laudos de empresa via submenu da empresa', async () => {
    render(<EmpresaDashboardPage />);

    await waitFor(() =>
      expect(screen.getByText('← Voltar')).toBeInTheDocument()
    );

    // Simular clique no submenu empresas -> Laudos (sidebar)
    const laudosSub = screen.getByText(/Laudos/);
    fireEvent.click(laudosSub);

    await waitFor(() => {
      expect(screen.getByText('Laudo 1')).toBeInTheDocument();
    });
  });
});
