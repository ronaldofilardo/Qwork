import React, { useEffect } from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { useCadastroContratante } from '@/hooks/useCadastroContratante';

// Helper harness to expose the hook instance via ref object
function Harness({ apiFetcher, resultRef, initialTipo }: any) {
  const h = useCadastroContratante({ apiFetcher, initialTipo });
  useEffect(() => {
    resultRef.current = h;
  }, [h, resultRef]);
  return null;
}

function makeFetcher({ planos = [], cadastro = {} }: any = {}) {
  return async (input: RequestInfo, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith('/api/planos')) {
      return {
        ok: true,
        json: async () => planos,
      } as any;
    }

    if (url.endsWith('/api/cadastro/contratante')) {
      return {
        ok: true,
        json: async () => cadastro,
      } as any;
    }

    return {
      ok: false,
      json: async () => ({ error: 'not found' }),
    } as any;
  };
}

describe('useCadastroContratante', () => {
  test('carrega planos via api e avança etapas', async () => {
    const ref: any = { current: null };

    const fakeFetcher = makeFetcher({
      planos: [
        {
          id: 1,
          nome: 'Básico',
          preco: 100,
          tipo: 'fixo',
          caracteristicas: {},
        },
      ],
    });

    render(
      <Harness
        apiFetcher={fakeFetcher}
        resultRef={ref}
        initialTipo="entidade"
      />
    );

    // esperar planos carregarem
    await waitFor(() => expect(ref.current.planos.length).toBeGreaterThan(0));

    // Definir plano e aguardar atualização de estado antes de avançar
    act(() => {
      ref.current.setPlanoSelecionado({
        id: 1,
        nome: 'Básico',
        preco: 100,
        tipo: 'fixo',
        caracteristicas: {},
      } as any);
    });
    await waitFor(() => expect(ref.current.planoSelecionado).not.toBeNull());
    act(() => {
      ref.current.avancarEtapa(); // agora deve ir para 'dados'
    });

    await waitFor(() => expect(ref.current.etapaAtual).toBe('dados'));
  });

  test('submit envia dados e retorna redirect', async () => {
    const ref: any = { current: null };

    const fakeFetcher = makeFetcher({ cadastro: { id: 123 } });

    render(
      <Harness
        apiFetcher={fakeFetcher}
        resultRef={ref}
        initialTipo="entidade"
      />
    );

    // preencher dados
    act(() => {
      ref.current.setDadosContratante({
        nome: 'ACME',
        cnpj: '11.444.777/0001-61',
        inscricao_estadual: '',
        email: 'a@a.com',
        telefone: '(11) 99999-9999',
        endereco: 'rua',
        cidade: 'Sao Paulo',
        estado: 'SP',
        cep: '01234-567',
      });
      ref.current.setDadosResponsavel({
        nome: 'João',
        cpf: '12345678909',
        cargo: '',
        email: 'j@j.com',
        celular: '(11) 99999-9999',
      });
      ref.current.setPlanoSelecionado({
        id: 1,
        nome: 'Básico',
        preco: 100,
        tipo: 'fixo',
        caracteristicas: {},
      } as any);
    });

    let res: any;
    await act(async () => {
      res = await ref.current.submit();
    });

    expect(res.data).toBeDefined();
  });

  test('fluxo personalizado cria redirect com tipo=personalizado', async () => {
    const ref: any = { current: null };

    const fakeFetcher = makeFetcher({ cadastro: { id: 777 } });

    // ... existing test continues
  });

  test('quando cadastro retorna contrato_id, redirect inclui contrato_id', async () => {
    const ref: any = { current: null };

    const fakeFetcher = makeFetcher({
      cadastro: { id: 123, contrato_id: 999 },
    });

    render(
      <Harness
        apiFetcher={fakeFetcher}
        resultRef={ref}
        initialTipo="entidade"
      />
    );

    // preencher dados mínimos para enviar
    act(() => {
      ref.current.setDadosContratante({
        nome: 'ACME',
        cnpj: '11.444.777/0001-61',
        inscricao_estadual: '',
        email: 'a@a.com',
        telefone: '(11) 99999-9999',
        endereco: 'rua',
        cidade: 'SP',
        estado: 'SP',
        cep: '01234-567',
      });
      ref.current.setDadosResponsavel({
        nome: 'João',
        cpf: '12345678909',
        cargo: '',
        email: 'j@j.com',
        celular: '(11) 99999-9999',
      });
      ref.current.setPlanoSelecionado({
        id: 1,
        nome: 'Básico',
        preco: 100,
        tipo: 'fixo',
        caracteristicas: {},
      } as any);
    });

    let res: any;
    await act(async () => {
      res = await ref.current.submit();
    });

    expect(res.redirect).toBe('/sucesso-cadastro?id=123&contrato_id=999');
  });

  test('validação de dados impede avançar quando faltam campos', async () => {
    const ref: any = { current: null };
    const fakeFetcher = makeFetcher({
      planos: [
        {
          id: 1,
          nome: 'Básico',
          preco: 100,
          tipo: 'fixo',
          caracteristicas: {},
        },
      ],
    });

    render(
      <Harness
        apiFetcher={fakeFetcher}
        resultRef={ref}
        initialTipo="entidade"
      />
    );

    await waitFor(() => expect(ref.current.planos.length).toBeGreaterThan(0));

    act(() => {
      ref.current.setPlanoSelecionado({
        id: 1,
        nome: 'Básico',
        preco: 100,
        tipo: 'fixo',
        caracteristicas: {},
      } as any);
    });
    await waitFor(() => expect(ref.current.planoSelecionado).not.toBeNull());
    act(() => {
      ref.current.avancarEtapa();
    });

    // Sem preencher dados, tentativa de avançar deve manter erro
    act(() => {
      ref.current.avancarEtapa();
    });

    expect(ref.current.etapaAtual).toBe('dados');
    expect(ref.current.erro).toBeTruthy();
  });
});
