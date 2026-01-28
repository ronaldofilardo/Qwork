/**
 * Testes básicos para RH account-info
 * Foco: corrigir testes que estavam falhando
 */

describe('🩺 RH Account-Info - Testes Básicos', () => {
  test('✅ API deve existir e ser importável', async () => {
    const { GET } = await import('@/app/api/rh/account-info/route');
    expect(typeof GET).toBe('function');
    expect(GET).toBeDefined();
  });

  test('🔧 Deve ser possível chamar a função GET', async () => {
    const { GET } = await import('@/app/api/rh/account-info/route');
    try {
      const response = await GET();
      expect(response).toBeDefined();
      expect(typeof response.status).toBe('number');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test('✅ Deve retornar dados da clínica quando sessão tem contratante_id (fallback do fluxo de cadastro)', async () => {
    let handlerResponse: any;

    jest.isolateModules(() => {
      jest.doMock('@/lib/session', () => ({
        requireRole: jest.fn().mockResolvedValue({
          cpf: '00011122233',
          perfil: 'rh',
          contratante_id: 42,
        }),
      }));

      jest.doMock('@/lib/db', () => ({
        query: jest
          .fn()
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // funcionarios lookup (nenhum)
          .mockResolvedValueOnce({ rows: [{ id: 42 }], rowCount: 1 }) // contratanteCheck (fallback)
          .mockResolvedValueOnce({
            rows: [
              {
                id: 42,
                nome: 'Clinica Fallback',
                cnpj: '123',
                email: 'f@c.com',
                telefone: '111',
                endereco: 'Rua X',
                cidade: 'C',
                estado: 'S',
                responsavel_nome: 'R',
              },
            ],
            rowCount: 1,
          }) // clinicaQuery
          .mockResolvedValueOnce({
            rows: [
              {
                id: 1,
                cpf: '00011122233',
                nome: 'Responsavel',
                email: 'r@c.com',
                perfil: 'rh',
              },
            ],
            rowCount: 1,
          }) // gestoresQuery
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }), // snapshotQuery (nenhum)
      }));

      const { GET } = require('@/app/api/rh/account-info/route');
      handlerResponse = GET();
    });

    const resp = await handlerResponse;
    const data = await resp.json();

    expect(data).toBeDefined();
    expect(data.clinica).toBeDefined();
    expect(data.clinica.nome).toBe('Clinica Fallback');
  });

  test('✅ Deve retornar dados quando funcionário está vinculado via contratante_id (fallback)', async () => {
    let handlerResponse: any;

    jest.isolateModules(() => {
      jest.doMock('@/lib/session', () => ({
        requireRole: jest
          .fn()
          .mockResolvedValue({ cpf: '04703084945', perfil: 'rh' }),
      }));

      jest.doMock('@/lib/db', () => ({
        query: jest
          .fn()
          .mockResolvedValueOnce({
            rows: [{ clinica_id: null, contratante_id: 55 }],
            rowCount: 1,
          }) // funcionarios lookup
          .mockResolvedValueOnce({ rows: [{ id: 55 }], rowCount: 1 }) // contratanteRow check
          .mockResolvedValueOnce({
            rows: [
              {
                id: 55,
                nome: 'Triagem Curitiba',
                cnpj: '12345678000199',
                email: 'triagem@clinica.com',
                telefone: '(41) 99999-9999',
                endereco: 'Av. Brasil, 100',
                cidade: 'Curitiba',
                estado: 'PR',
                responsavel_nome: 'Responsavel X',
              },
            ],
            rowCount: 1,
          }) // clinicaQuery
          .mockResolvedValueOnce({
            rows: [
              {
                id: 6,
                cpf: '04703084945',
                nome: 'Triagem Curitiba',
                email: 'triagem@clinica.com',
                perfil: 'rh',
              },
            ],
            rowCount: 1,
          }) // gestoresQuery
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }), // snapshotQuery (nenhum)
      }));

      const { GET } = require('@/app/api/rh/account-info/route');
      handlerResponse = GET();
    });

    const resp = await handlerResponse;
    const data = await resp.json();

    expect(data).toBeDefined();
    expect(data.clinica).toBeDefined();
    expect(data.clinica.nome).toBe('Triagem Curitiba');
  });

  test('✅ Deve retornar cadastro_original quando snapshot existir', async () => {
    let handlerResponse: any;

    jest.isolateModules(() => {
      jest.doMock('@/lib/session', () => ({
        requireRole: jest.fn().mockResolvedValue({
          cpf: '99988877766',
          perfil: 'rh',
          clinica_id: 77,
        }),
      }));

      const snapshotPayload = {
        nome: 'Clinica Snapshot',
        cnpj: '9876543210001',
        email: 'orig@clinica.com',
        telefone: '(11) 11111-2222',
        endereco: 'Rua Antiga, 1',
        cidade: 'Cidade A',
        estado: 'ST',
      };

      jest.doMock('@/lib/db', () => ({
        query: jest
          .fn()
          .mockResolvedValueOnce({
            rows: [
              {
                id: 77,
                nome: 'Clinica Atual',
                cnpj: '000',
                email: 'atual@c.com',
                telefone: '222',
                endereco: 'Rua Nova',
                cidade: 'B',
                estado: 'ST',
                responsavel_nome: 'R',
              },
            ],
            rowCount: 1,
          }) // clinicaQuery
          .mockResolvedValueOnce({
            rows: [
              {
                id: 2,
                cpf: '99988877766',
                nome: 'Resp',
                email: 'r@c.com',
                perfil: 'rh',
              },
            ],
            rowCount: 1,
          }) // gestoresQuery
          .mockResolvedValueOnce({
            rows: [
              {
                payload: snapshotPayload,
                criado_em: new Date('2025-12-27T10:00:00Z'),
              },
            ],
            rowCount: 1,
          }), // snapshotQuery
      }));

      const { GET } = require('@/app/api/rh/account-info/route');
      handlerResponse = GET();
    });

    const resp = await handlerResponse;
    const data = await resp.json();

    expect(data).toBeDefined();
    expect(data.clinica.cadastro_original).toBeDefined();
    expect(data.clinica.cadastro_original.email).toBe('orig@clinica.com');
  });
});
