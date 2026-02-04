import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModalInativarAvaliacao from '@/components/ModalInativarAvaliacao';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

const mockRouter = { push: jest.fn(), back: jest.fn() };

describe('Integração: Inativar avaliação (Entidade)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useRouter, useParams } = require('next/navigation');
    useRouter.mockReturnValue(mockRouter);
    useParams.mockReturnValue({ id: '1' });
  });

  it('abre o modal de inativação e chama validação GET', async () => {
    // Mock global.fetch: primeiro GET (validacao), depois POST (inativacao)
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          permitido: true,
          motivo: 'ok',
          pode_forcar: true,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    // @ts-ignore - Jest env provides global.fetch
    global.fetch = mockFetch;

    const Wrapper = () => {
      const [modal, setModal] = React.useState<any>(null);
      return (
        <div>
          <button
            data-testid="open-btn"
            onClick={() =>
              setModal({
                avaliacaoId: 1,
                funcionarioNome: 'João Silva',
                funcionarioCpf: '12345678901',
              })
            }
          >
            Abrir
          </button>
          {modal && (
            <ModalInativarAvaliacao
              avaliacaoId={modal.avaliacaoId}
              funcionarioNome={modal.funcionarioNome}
              funcionarioCpf={modal.funcionarioCpf}
              _loteId={'1'}
              contexto="entidade"
              onClose={() => setModal(null)}
              onSuccess={() => {}}
            />
          )}
        </div>
      );
    };

    render(<Wrapper />);

    fireEvent.click(screen.getByTestId('open-btn'));

    // Deve abrir o modal com título
    expect(
      await screen.findByText('⚠️ Inativar Avaliação')
    ).toBeInTheDocument();

    // NOTA: Validação foi movida para o backend - não há mais chamada GET prévia
    // O modal agora apenas mostra o formulário e valida no POST
  });

  // NOTA: Testes abaixo comentados pois a validação prévia foi removida
  // A validação agora acontece no backend via POST
  it.skip('bloqueia inativação quando lote foi emitido e não mostra opção de forçar', async () => {
    const mockFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        permitido: false,
        motivo: 'Laudo emitido',
        pode_forcar: false,
        avaliacao: { lote_emitido: true },
      }),
    });

    // @ts-ignore
    global.fetch = mockFetch;

    // Render the Modal directly to avoid wrapper async state timing
    render(
      <ModalInativarAvaliacao
        avaliacaoId={1}
        funcionarioNome={'João Silva'}
        funcionarioCpf={'12345678901'}
        _loteId={'1'}
        contexto="entidade"
        onClose={() => {}}
        onSuccess={() => {}}
      />
    );

    // Mensagem de laudo emitido (modal deve abrir e mostrar aviso)
    expect(
      await screen.findByText(/Impossível Inativar - Laudo Emitido/)
    ).toBeInTheDocument();

    // Não deve mostrar checkbox 'Forçar Inativação'
    expect(screen.queryByText(/Forçar Inativação/)).toBeNull();

    // Não deve mostrar botão de submit (confirmar inativação)
    expect(
      screen.queryByText(/Confirmar Inativação|Forçar Inativação/)
    ).toBeNull();
  });

  it('não deve renderizar botão Inativar na UI quando lote da entidade foi emitido', async () => {
    const emittedLote = {
      lote: {
        id: 1,
        titulo: 'Lote Entidade Emitido',
        descricao: 'Emitido',
        tipo: 'completo',
        status: 'emitido',
        liberado_em: '2025-11-20T10:00:00',
        emitido_em: '2025-12-10T12:00:00',
      },
      estatisticas: {
        total_funcionarios: 1,
        funcionarios_concluidos: 0,
        funcionarios_pendentes: 1,
      },
      funcionarios: [
        {
          cpf: '99988877766',
          nome: 'Usuário Entidade',
          setor: 'TI',
          funcao: 'Dev',
          nivel_cargo: 'operacional',
          avaliacao: {
            id: 20,
            status: 'iniciada',
            data_inicio: '2025-12-01T08:00:00',
          },
        },
      ],
    };

    // @ts-ignore
    global.fetch = jest.fn((url: string) => {
      if (url.endsWith('/api/entidade/lote/1')) {
        return Promise.resolve({ ok: true, json: async () => emittedLote });
      }
      return Promise.reject(new Error('unexpected url'));
    });

    // Import the page component dynamically to ensure hooks run
    const { default: Detalhes } = await import('@/app/entidade/lote/[id]/page');

    render((<Detalhes />) as any);

    await waitFor(() => {
      expect(screen.getByText(/Lote ID:/i)).toBeInTheDocument();
    });

    // 'Inativar' button must not be visible
    expect(screen.queryByText('🚫 Inativar')).not.toBeInTheDocument();
  });
});
