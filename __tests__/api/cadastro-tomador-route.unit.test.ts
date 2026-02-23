// Teste unitário do handler POST para checar que arquivos são obrigatórios
describe('Route POST - unitário (sem DB real)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('deve retornar 400 quando arquivos obrigatórios não são enviados', async () => {
    // Importar o handler
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
    // Sem arquivos anexados

    const mockRequest = {
      formData: () => Promise.resolve(formData),
      headers: { get: jest.fn(() => '127.0.0.1') },
    } as unknown as Request;

    const response = await POST(mockRequest as any);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toMatch(/obrigatórios/i);
  });
});
