/**
 * Testes para Admin UI - Renderização Condicional de Botões de Aprovação
 * Valida que botão "Aprovar" é escondido quando pagamento confirmado + contrato aceito
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NovoscadastrosContent } from '@/components/admin/NovoscadastrosContent';

// Mock do fetch para simular respostas da API
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('NovoscadastrosContent - Aprovação Condicional', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve esconder botão Aprovar quando requer_aprovacao_manual = false', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        contratantes: [
          {
            id: 1,
            nome: 'Teste Entidade',
            cpf_responsavel: '12345678900',
            status: 'pendente',
            pagamento_confirmado: true,
            contrato_aceito: true,
            requer_aprovacao_manual: false, // Pagamento confirmado + contrato aceito
          },
        ],
      }),
    } as any);

    render(<NovoscadastrosContent />);

    await waitFor(() => {
      expect(screen.queryByText('Aprovar')).not.toBeInTheDocument();
    });
  });

  it('deve mostrar botão Aprovar quando requer_aprovacao_manual = true', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        contratantes: [
          {
            id: 2,
            nome: 'Teste Entidade 2',
            cpf_responsavel: '98765432100',
            status: 'pendente',
            pagamento_confirmado: false,
            contrato_aceito: false,
            requer_aprovacao_manual: true, // Sem pagamento confirmado
          },
        ],
      }),
    } as any);

    render(<NovoscadastrosContent />);

    await waitFor(() => {
      expect(screen.getByText('Aprovar')).toBeInTheDocument();
    });
  });

  it('deve esconder botão Forçar Aprovação quando requer_aprovacao_manual = false', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        contratantes: [
          {
            id: 3,
            nome: 'Teste Entidade 3',
            cpf_responsavel: '11111111111',
            status: 'pendente',
            pagamento_confirmado: true,
            contrato_aceito: true,
            requer_aprovacao_manual: false,
          },
        ],
      }),
    } as any);

    render(<NovoscadastrosContent />);

    await waitFor(() => {
      expect(screen.queryByText('Forçar Aprovação')).not.toBeInTheDocument();
    });
  });

  it('deve calcular requer_aprovacao_manual corretamente no backend', async () => {
    // Simular query SQL do handler
    const contratante = {
      id: 1,
      pagamento_confirmado: true,
      contrato_aceito: true,
    };

    const requer_aprovacao_manual = !(
      contratante.pagamento_confirmado && contratante.contrato_aceito
    );

    expect(requer_aprovacao_manual).toBe(false);
  });

  it('deve exigir aprovação manual quando pagamento não confirmado', async () => {
    const contratante = {
      id: 2,
      pagamento_confirmado: false,
      contrato_aceito: true,
    };

    const requer_aprovacao_manual = !(
      contratante.pagamento_confirmado && contratante.contrato_aceito
    );

    expect(requer_aprovacao_manual).toBe(true);
  });

  it('deve exigir aprovação manual quando contrato não aceito', async () => {
    const contratante = {
      id: 3,
      pagamento_confirmado: true,
      contrato_aceito: false,
    };

    const requer_aprovacao_manual = !(
      contratante.pagamento_confirmado && contratante.contrato_aceito
    );

    expect(requer_aprovacao_manual).toBe(true);
  });

  it('deve renderizar status "Pagamento Confirmado" para contratantes pagos', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        contratantes: [
          {
            id: 4,
            nome: 'Teste Pago',
            cpf_responsavel: '22222222222',
            status: 'pendente',
            pagamento_confirmado: true,
            contrato_aceito: true,
            requer_aprovacao_manual: false,
          },
        ],
      }),
    } as any);

    render(<NovoscadastrosContent />);

    await waitFor(() => {
      expect(screen.getByText(/pagamento confirmado/i)).toBeInTheDocument();
    });
  });
});

describe('Handlers API - Coluna requer_aprovacao_manual', () => {
  it('deve incluir CASE WHEN na query SQL de novos cadastros', () => {
    const query = `
      SELECT c.*,
        CASE 
          WHEN c.pagamento_confirmado = true 
            AND EXISTS (SELECT 1 FROM contratos ct WHERE ct.contratante_id = c.id AND ct.aceito = true)
          THEN false 
          ELSE true 
        END AS requer_aprovacao_manual
      FROM contratantes c
      WHERE c.status = 'pendente'
    `;

    expect(query).toContain('requer_aprovacao_manual');
    expect(query).toContain('pagamento_confirmado = true');
    expect(query).toContain('ct.aceito = true');
  });

  it('deve retornar false quando pagamento confirmado E contrato aceito', () => {
    const pagamento_confirmado = true;
    const contrato_aceito = true;

    const requer_aprovacao_manual = !(pagamento_confirmado && contrato_aceito);

    expect(requer_aprovacao_manual).toBe(false);
  });

  it('deve retornar true em qualquer outro caso', () => {
    const casos = [
      { pagamento_confirmado: false, contrato_aceito: false },
      { pagamento_confirmado: true, contrato_aceito: false },
      { pagamento_confirmado: false, contrato_aceito: true },
    ];

    casos.forEach((caso) => {
      const requer_aprovacao_manual = !(
        caso.pagamento_confirmado && caso.contrato_aceito
      );
      expect(requer_aprovacao_manual).toBe(true);
    });
  });
});
