/**
 * @file __tests__/hooks/useCadastroTomador.test.tsx
 * Testes: useCadastroTomador
 * Fluxo atual: tipo → dados → responsavel → confirmacao (sem planos)
 */

import React, { useEffect } from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { useCadastroTomador } from '@/hooks/useCadastroTomador';

// Helper harness to expose the hook instance via ref object
function Harness({ apiFetcher, resultRef, initialTipo }: any) {
  const h = useCadastroTomador({ apiFetcher, initialTipo });
  useEffect(() => {
    resultRef.current = h;
  }, [h, resultRef]);
  return null;
}

function makeFetcher({ cadastro = {} }: any = {}) {
  return async (input: RequestInfo, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith('/api/cadastro/tomadores')) {
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

describe('useCadastroTomador', () => {
  test('inicia em dados quando initialTipo definido', () => {
    const ref: any = { current: null };
    const fakeFetcher = makeFetcher({ cadastro: { id: 123 } });

    render(
      <Harness
        apiFetcher={fakeFetcher}
        resultRef={ref}
        initialTipo="entidade"
      />
    );

    expect(ref.current.etapaAtual).toBe('dados');
  });

  test('submit envia dados e retorna redirect com contrato_id', async () => {
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

    // preencher dados
    act(() => {
      ref.current.setDadostomador({
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
        cargo: 'Gestor',
        email: 'j@j.com',
        celular: '(11) 99999-9999',
      });
    });

    let res: any;
    await act(async () => {
      res = await ref.current.submit();
    });

    expect(res.data.id).toBe(123);
    expect(res.redirect).toBe('/sucesso-cadastro?id=123&contrato_id=999');
  });

  test('permite definir código de representante durante confirmacao', async () => {
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

    act(() => {
      ref.current.setCodigoRepresentante('REP-ABC123');
    });

    expect(ref.current.codigoRepresentante).toBe('REP-ABC123');
  });

  test('permite marcar semIndicacao para pular representante', async () => {
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

    act(() => {
      ref.current.setSemIndicacao(true);
    });

    expect(ref.current.semIndicacao).toBe(true);
  });

  test('validação de CNPJ rejeita inválido', async () => {
    const ref: any = { current: null };

    const fakeFetcher = makeFetcher({ cadastro: { id: 123 } });

    render(
      <Harness
        apiFetcher={fakeFetcher}
        resultRef={ref}
        initialTipo="entidade"
      />
    );

    // Tentar avancar sem preencher dados válidos
    act(() => {
      ref.current.setDadostomador({
        nome: 'ACME',
        cnpj: '00.000.000/0000-00', // CNPJ inválido
        inscricao_estadual: '',
        email: 'a@a.com',
        telefone: '(11) 99999-9999',
        endereco: 'rua',
        cidade: 'SP',
        estado: 'SP',
        cep: '01234-567',
      });
      ref.current.avancarEtapa();
    });

    // Deve continuar em 'dados' com erro
    expect(ref.current.etapaAtual).toBe('dados');
    expect(ref.current.erro).toBeTruthy();
  });
});
