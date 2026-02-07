// Teste unitário do handler POST para checar comportamento quando anexos estão desabilitados
describe('Route POST - unitário (sem DB real)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('deve retornar 201 quando NEXT_PUBLIC_DISABLE_ANEXOS=true e não há arquivos', async () => {
    // Forçar a flag
    const prev = process.env.NEXT_PUBLIC_DISABLE_ANEXOS;
    process.env.NEXT_PUBLIC_DISABLE_ANEXOS = 'true';

    // Mockar o módulo de banco para evitar inserção real
    jest.mock('@/lib/db', () => ({
      transaction: async (fn: any) => {
        // Não executar o callback: retornar resultado simulado diretamente
        return {
          contratante: {
            id: 9999,
            nome: 'Mock Co',
            tipo: 'entidade',
            status: 'pendente',
          },
          requiresPayment: false,
          contratIdCreated: null,
          contratoIdCreated: null,
          valorPorFuncionario: null,
          numeroFuncionarios: 0,
          valorTotal: 0,
          simuladorUrl: null,
        };
      },
    }));

    // Importar o handler após mock
    const { POST } = await import('@/app/api/cadastro/tomadores/route');

    const formData = new FormData();
    formData.append('tipo', 'entidade');
    formData.append('nome', 'Empresa Mock Sem Anexos');
    formData.append('cnpj', '11.444.777/0001-61');
    formData.append('email', 'mock-no-files@example.test');
    formData.append('telefone', '11999999990');
    formData.append('endereco', 'Rua Mock, 1');
    formData.append('cidade', 'Mock');
    formData.append('estado', 'SP');
    formData.append('cep', '01234567');
    formData.append('responsavel_nome', 'Mock');
    formData.append('responsavel_cpf', '52998224725');
    formData.append('responsavel_email', 'resp@mock.test');
    formData.append('responsavel_celular', '11999999990');

    const mockRequest = {
      formData: () => Promise.resolve(formData),
      headers: { get: jest.fn(() => '127.0.0.1') },
    } as unknown as Request;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.contratante).toBeDefined();

    process.env.NEXT_PUBLIC_DISABLE_ANEXOS = prev;
  });
});
