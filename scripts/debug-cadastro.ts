(async () => {
  try {
    const { POST } = await import('../app/api/cadastro/contratante/route');

    class FakeFormData {
      private data: Map<string, any> = new Map();
      append(key: string, value: any) {
        this.data.set(key, value);
      }
      get(key: string) {
        return this.data.get(key);
      }
    }

    const formData = new FakeFormData();
    formData.append('tipo', 'entidade');
    formData.append('nome', 'Empresa Debug Teste Ltda');
    formData.append('cnpj', '11222333000181');
    formData.append('email', 'debug@test.com');
    formData.append('telefone', '11999887766');
    formData.append('endereco', 'Rua do Debug, 1');
    formData.append('cidade', 'São Paulo');
    formData.append('estado', 'SP');
    formData.append('cep', '01000000');
    formData.append('responsavel_nome', 'Resp Debug');
    formData.append('responsavel_cpf', '12345678909');
    formData.append('responsavel_cargo', 'Diretor');
    formData.append('responsavel_email', 'resp.debug@test.com');
    formData.append('responsavel_celular', '11999887766');
    formData.append('numero_funcionarios', '150');
    formData.append('aceite_termos', 'true');

    const mockRequest = {
      formData: () => Promise.resolve(formData),
      headers: {
        get: (k: string) => (k === 'x-forwarded-for' ? '127.0.0.1' : null),
      },
    } as any;

    const res = await POST(mockRequest);
    console.log('status', res.status);
    try {
      const json = await res.json();
      console.log('body', json);
    } catch (e) {
      const text = await res.text();
      console.log('text body', text);
    }
  } catch (err) {
    console.error('Erro ao executar debug-cadastro:', err);
    process.exit(1);
  }
})();
