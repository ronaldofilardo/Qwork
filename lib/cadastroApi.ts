'use strict';

export type Fetcher = (
  input: RequestInfo,
  init?: RequestInit
) => Promise<Response>;

export const defaultFetcher: Fetcher = (input, init) => fetch(input, init);

export const createCadastroApi = (fetcher: Fetcher = defaultFetcher) => {
  return {
    async getPlanos() {
      const res = await fetcher('/api/planos');
      if (!res.ok) throw new Error('Erro ao buscar planos');
      return res.json();
    },

    async enviarCadastro(formData: FormData) {
      const res = await fetcher('/api/cadastro/tomador', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar cadastro');
      return data;
    },
  };
};
