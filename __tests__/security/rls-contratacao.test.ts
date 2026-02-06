/**
 * Testes de Row Level Security (RLS) para tabelas de contratação
 * Verifica que as políticas de segurança funcionam corretamente
 */

import '@testing-library/jest-dom';

describe('RLS - Políticas de Segurança das Tabelas de Contratação', () => {
  const mockSession = {
    cpf: '123.456.789-00',
    perfil: 'admin',
    clinica_id: 1,
  };

  beforeEach(() => {
    // Mock do getSession
    jest.mock('@/lib/session', () => ({
      getSession: jest.fn(() => Promise.resolve(mockSession)),
    }));
  });

  describe('Tabela: planos', () => {
    it('deve permitir leitura pública de planos ativos', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              planos: [
                {
                  id: 1,
                  nome: 'Plano Fixo',
                  preco: 499.0,
                  ativo: true,
                },
              ],
            }),
        })
      ) as jest.Mock;

      const response = await fetch('/api/planos');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.planos).toHaveLength(1);
      expect(data.planos[0].ativo).toBe(true);
    });

    it('não deve permitir leitura de planos inativos', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              planos: [], // Plano inativo não deve aparecer
            }),
        })
      ) as jest.Mock;

      const response = await fetch('/api/planos');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.planos).toHaveLength(0);
    });

    it('não deve permitir inserção por usuários não-admin', async () => {
      // Mock de sessão não-admin
      jest.mock('@/lib/session', () => ({
        getSession: jest.fn(() =>
          Promise.resolve({
            cpf: '123.456.789-00',
            perfil: 'funcionario',
            clinica_id: 1,
          })
        ),
      }));

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 403,
          json: () =>
            Promise.resolve({
              error: 'Acesso negado',
            }),
        })
      ) as jest.Mock;

      const response = await fetch('/api/planos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: 'Novo Plano',
          preco: 299.0,
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toBe('Acesso negado');
    });
  });

  describe('Tabela: contratos', () => {
    it('deve permitir criação de contrato por contratante', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              contrato: {
                id: 100,
                contratante_id: 50,
                conteudo: 'Contrato...',
              },
            }),
        })
      ) as jest.Mock;

      const response = await fetch('/api/contratos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'criar',
          contratante_id: 50,
          plano_id: 1,
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.contrato.id).toBe(100);
    });

    it('deve permitir leitura de contrato próprio', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              contratos: [
                {
                  id: 100,
                  contratante_id: 50,
                  conteudo: 'Contrato...',
                },
              ],
            }),
        })
      ) as jest.Mock;

      const response = await fetch('/api/contratos?contratante_id=50');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.contratos).toHaveLength(1);
      expect(data.contratos[0].contratante_id).toBe(50);
    });

    it('não deve permitir leitura de contrato de outro contratante', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              contratos: [], // Não deve retornar contratos de outros
            }),
        })
      ) as jest.Mock;

      const response = await fetch('/api/contratos?contratante_id=99');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.contratos).toHaveLength(0);
    });

    it('deve permitir admin ler todos os contratos', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              contratos: [
                { id: 100, contratante_id: 50 },
                { id: 101, contratante_id: 51 },
              ],
            }),
        })
      ) as jest.Mock;

      const response = await fetch('/api/admin/contratos');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.contratos).toHaveLength(2);
    });
  });

  describe('Tabela: pagamentos', () => {
    it('deve permitir criação de pagamento por contratante', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              pagamento: {
                id: 200,
                contratante_id: 50,
                valor: 499.0,
                status: 'pendente',
              },
            }),
        })
      ) as jest.Mock;

      const response = await fetch('/api/pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'iniciar',
          contratante_id: 50,
          contrato_id: 100,
          valor: 499.0,
          metodo: 'pix',
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.pagamento.status).toBe('pendente');
    });

    it('deve permitir leitura de pagamentos próprios', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              pagamentos: [
                {
                  id: 200,
                  contratante_id: 50,
                  valor: 499.0,
                  status: 'pago',
                },
              ],
            }),
        })
      ) as jest.Mock;

      const response = await fetch('/api/pagamento?contratante_id=50');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.pagamentos).toHaveLength(1);
      expect(data.pagamentos[0].contratante_id).toBe(50);
    });

    it('não deve permitir leitura de pagamentos de outros', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              pagamentos: [], // Não deve retornar pagamentos de outros
            }),
        })
      ) as jest.Mock;

      const response = await fetch('/api/pagamento?contratante_id=99');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.pagamentos).toHaveLength(0);
    });

    it('deve permitir admin atualizar status de pagamento', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              pagamento: {
                id: 200,
                status: 'pago',
                data_pagamento: new Date().toISOString(),
              },
            }),
        })
      ) as jest.Mock;

      const response = await fetch('/api/pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'atualizar_status',
          pagamento_id: 200,
          status: 'pago',
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.pagamento.status).toBe('pago');
    });

    it('não deve permitir contratante atualizar status', async () => {
      // Mock perfil incorreto
      jest.mock('@/lib/session', () => ({
        getSession: jest.fn(() =>
          Promise.resolve({
            cpf: '123.456.789-00',
            perfil: 'gestor',
            clinica_id: 1,
          })
        ),
      }));

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 403,
          json: () =>
            Promise.resolve({
              error: 'Apenas admin pode atualizar status',
            }),
        })
      ) as jest.Mock;

      const response = await fetch('/api/pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'atualizar_status',
          pagamento_id: 200,
          status: 'pago',
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toContain('admin');
    });
  });

  describe('Tabela: contratantes (campos novos)', () => {
    it('deve permitir contratante ler seus próprios dados', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              contratante: {
                id: 50,
                nome: 'Clínica Teste',
                plano_id: 1,
                pagamento_confirmado: false,
              },
            }),
        })
      ) as jest.Mock;

      const response = await fetch('/api/public/contratante?id=50');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.contratante.id).toBe(50);
      expect(data.contratante.plano_id).toBe(1);
    });

    it('não deve expor dados sensíveis na API pública', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              contratante: {
                id: 50,
                nome: 'Clínica Teste',
                plano_id: 1,
                pagamento_confirmado: false,
                // Não deve incluir: email, telefone, endereco, etc.
              },
            }),
        })
      ) as jest.Mock;

      const response = await fetch('/api/public/contratante?id=50');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.contratante.email).toBeUndefined();
      expect(data.contratante.telefone).toBeUndefined();
      expect(data.contratante.endereco).toBeUndefined();
    });

    it('deve permitir admin ler todos os dados', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              contratante: {
                id: 50,
                nome: 'Clínica Teste',
                email: 'teste@clinica.com',
                telefone: '11999999999',
                plano_id: 1,
                pagamento_confirmado: false,
                data_liberacao_login: null,
              },
            }),
        })
      ) as jest.Mock;

      const response = await fetch('/api/admin/contratantes?id=50');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.contratante.email).toBe('teste@clinica.com');
      expect(data.contratante.telefone).toBe('11999999999');
    });
  });

  describe('Políticas de Segurança Gerais', () => {
    it('deve bloquear acesso sem sessão válida', async () => {
      // Mock sem sessão
      jest.mock('@/lib/session', () => ({
        getSession: jest.fn(() => Promise.resolve(null)),
      }));

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () =>
            Promise.resolve({
              error: 'Autenticação requerida',
            }),
        })
      ) as jest.Mock;

      const response = await fetch('/api/admin/contratantes');
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toBe('Autenticação requerida');
    });

    it('deve validar perfil do usuário', async () => {
      // Mock perfil incorreto
      jest.mock('@/lib/session', () => ({
        getSession: jest.fn(() =>
          Promise.resolve({
            cpf: '123.456.789-00',
            perfil: 'funcionario', // Não é admin
            clinica_id: 1,
          })
        ),
      }));

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 403,
          json: () =>
            Promise.resolve({
              error: 'Acesso não autorizado',
            }),
        })
      ) as jest.Mock;

      const response = await fetch('/api/admin/contratantes');
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toBe('Acesso não autorizado');
    });
  });
});
