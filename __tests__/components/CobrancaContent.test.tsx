import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CobrancaContent } from '@/components/admin/CobrancaContent';

describe('CobrancaContent', () => {
  const mockContratos = [
    {
      id: 10,
      numero_contrato: 10,
      tipo_tomador: 'entidade',
      nome_tomador: 'Empresa Teste',
      cnpj: '12345678000199',
      contrato_id: 99,
      plano_id: 1,
      plano_nome: 'Plano Básico',
      plano_preco: 2500,
      plano_tipo: 'fixo',
      numero_funcionarios_estimado: 50,
      numero_funcionarios_atual: 45,
      valor_pago: 5000,
      tipo_pagamento: 'cartao',
      modalidade_pagamento: 'a_vista',
      numero_parcelas: null,
      parcelas_json: null,
      status: 'ativo',
      data_contratacao: '2025-01-01T00:00:00Z',
      data_fim_vigencia: '2026-01-01T00:00:00Z',
      data_pagamento: null,
    },
    {
      id: 11,
      numero_contrato: 11,
      tipo_tomador: 'clinica',
      nome_tomador: 'Clínica Parcelada',
      cnpj: '99887766000100',
      contrato_id: 100,
      plano_id: 2,
      plano_nome: 'Plano Parcelado',
      plano_preco: 1250,
      plano_tipo: 'personalizado',
      numero_funcionarios_estimado: 20,
      numero_funcionarios_atual: 10,
      valor_pago: 2500,
      tipo_pagamento: 'boleto',
      modalidade_pagamento: 'parcelado',
      numero_parcelas: 2,
      parcelas_json: [
        {
          numero: 1,
          valor: 1250,
          data_vencimento: '2025-02-01',
          pago: true,
          data_pagamento: '2025-02-05',
        },
        {
          numero: 2,
          valor: 1250,
          // marcar vencimento na data corrente para o teste contar no mês atual
          data_vencimento: new Date().toISOString().split('T')[0],
          pago: false,
          data_pagamento: null,
        },
      ],
      status: 'ativo',
      data_contratacao: '2025-01-01T00:00:00Z',
      data_fim_vigencia: '2026-01-01T00:00:00Z',
      data_pagamento: '2025-01-10T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ contratos: mockContratos }),
    } as unknown as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exibe cabeçalhos e coluna Data Pagamento', async () => {
    render(<CobrancaContent />);

    // Título da área
    expect(await screen.findByText('Gestão de Cobranças')).toBeInTheDocument();

    // Esperar que a lista seja carregada (meta de total)
    await waitFor(() =>
      expect(screen.getByText(/contrato\(s\) encontrado/)).toBeInTheDocument()
    );

    // Cabeçalhos básicos exigidos
    expect((await screen.findAllByText('tomador ID')).length).toBeGreaterThan(
      0
    );
    // 'Contrato ID' foi removido do layout; verificar colunas essenciais
    expect((await screen.findAllByText('Plano ID')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Plano Preço')).length).toBeGreaterThan(
      0
    );
    expect((await screen.findAllByText('Pagamento')).length).toBeGreaterThan(0);
    expect(
      (await screen.findAllByText('Data Pagamento')).length
    ).toBeGreaterThan(0);

    // Linha com Empresa Teste (verificar por CNPJ)
    expect(await screen.findByText('12345678000199')).toBeInTheDocument();

    // Verificar valores renderizados (plano_preco e pagamento_valor)
    expect((await screen.findAllByText(/2\.500,00/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Não informado')[0]).toBeInTheDocument();

    // Novo: validar métricas de resumo - Valor Total Pago e Valor a Receber
    // mockContratos: primeiro valor_pago 5000 (à vista), segundo tem parcela paga 1250 e parcela pendente 1250
    expect(await screen.findByText('Valor Total Pago')).toBeInTheDocument();
    expect(await screen.findByText('Valor a Receber')).toBeInTheDocument();

    // Garantir que ambos os indicadores estão na mesma coluna (coluna da direita, stacked)
    const valorTotalEl = await screen.findByText('Valor Total Pago');
    const valorReceberEl = await screen.findByText('Valor a Receber');

    // Encontrar o ancestral comum mais próximo e confirmar que é um container flex alinhado à direita
    function findCommonAncestor(a: HTMLElement, b: HTMLElement) {
      const ancestors = new Set<HTMLElement>();
      let cur: HTMLElement | null = a;
      while (cur) {
        ancestors.add(cur);
        cur = cur.parentElement;
      }
      cur = b;
      while (cur && !ancestors.has(cur)) cur = cur.parentElement;
      return cur;
    }

    const commonAncestor = findCommonAncestor(valorTotalEl, valorReceberEl);

    expect(commonAncestor).not.toBeNull();
    expect(commonAncestor.className).toMatch(/\bflex\b/);
    expect(commonAncestor.className).toMatch(/justify-end/);

    // Valor Total Pago = 5000 + 1250 = 6250
    expect((await screen.findAllByText(/6\.250,00/)).length).toBeGreaterThan(0);
    // Valor a Receber = 1250 (parcela pendente da clínica parcelada)
    expect((await screen.findAllByText(/1\.250,00/)).length).toBeGreaterThan(0);
  });

  it('expande parcelas quando modalidade é parcelado e exibe detalhes/pago', async () => {
    const { container } = render(<CobrancaContent />);

    // Esperar pela linha da clínica parcelada (verificar por CNPJ)
    await waitFor(() =>
      expect(screen.getByText('99887766000100')).toBeInTheDocument()
    );

    // Botão para ver parcelas - título 'Ver parcelas'
    const btn = screen.getAllByTitle('Ver parcelas')[0];
    fireEvent.click(btn);

    // Detalhamento de Parcelas aparece
    await waitFor(() =>
      expect(screen.getByText(/Detalhamento de Parcelas/)).toBeInTheDocument()
    );

    // Verificar valores das parcelas
    const valores = screen.getAllByText((t) => /1\.250,00/.test(t));
    expect(valores.length).toBeGreaterThan(0);

    // Verificar que há indicação de pagamento (linha 'Pago: ...')
    expect(screen.getByText(/Pago:/)).toBeInTheDocument();

    // Verificar que o layout usa container horizontal (div com classe flex gap-3)
    const detalhe = screen.getByText(/Detalhamento de Parcelas/).closest('tr');
    expect(detalhe).not.toBeNull();
    // Procurar div com classe flex e gap-3 dentro do row expandido
    const horizontalDiv = detalhe.querySelector('div.flex.gap-3');
    expect(horizontalDiv).not.toBeNull();
  });

  it('inclui pagamento no ato da contratação mesmo quando há parcelas (entrada)', async () => {
    // Contrato com parcelas todas pendentes, mas com entrada paga (pagamento_valor)
    const mockWithEntrada = [
      {
        id: 20,
        numero_contrato: 20,
        tipo_tomador: 'entidade',
        nome_tomador: 'Entrada Teste',
        cnpj: '11111111000111',
        contrato_id: 101,
        plano_id: 3,
        plano_nome: 'Plano Com Entrada',
        plano_preco: 400,
        plano_tipo: 'personalizado',
        numero_funcionarios_estimado: 5,
        numero_funcionarios_atual: 5,
        valor_pago: 0,
        tipo_pagamento: 'boleto',
        modalidade_pagamento: 'parcelado',
        numero_parcelas: 2,
        parcelas_json: [
          {
            numero: 1,
            valor: 200,
            data_vencimento: new Date().toISOString().split('T')[0],
            pago: false,
            data_pagamento: null,
          },
          {
            numero: 2,
            valor: 200,
            data_vencimento: new Date().toISOString().split('T')[0],
            pago: false,
            data_pagamento: null,
          },
        ],
        pagamento_id: 45,
        pagamento_valor: 300,
        pagamento_status: 'pago',
        status: 'ativo',
        data_contratacao: '2025-01-01T00:00:00Z',
        data_fim_vigencia: '2026-01-01T00:00:00Z',
        data_pagamento: null,
      },
    ];

    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ contratos: mockWithEntrada }),
    } as unknown as Response);

    render(<CobrancaContent />);

    // Esperar o carregamento (usamos o CNPJ que é mostrado na tabela)
    await waitFor(() =>
      expect(screen.getByText('11111111000111')).toBeInTheDocument()
    );

    // Valor Total Pago deve incluir a entrada (pagamento_valor = 300)
    expect((await screen.findAllByText(/300,00/)).length).toBeGreaterThan(0);

    // Valor a Receber deve ser soma das parcelas pendentes (200 + 200 = 400)
    expect((await screen.findAllByText(/400,00/)).length).toBeGreaterThan(0);
  });

  it('exibe badge Quitado para pagamento à vista e Em Aberto para parcelado', async () => {
    render(<CobrancaContent />);

    await waitFor(() =>
      expect(screen.getByText('12345678000199')).toBeInTheDocument()
    );

    // Empresa Teste é à vista -> badge Quitado
    expect(screen.getAllByText('Quitado').length).toBeGreaterThan(0);

    // Clínica Parcelada tem parcela pendente -> badge Em Aberto
    expect(screen.getAllByText('Em Aberto').length).toBeGreaterThan(0);
  });

  it('faz requisição ao servidor com filtro por CNPJ e exibe resultados', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementationOnce(
        async (url: any) =>
          ({
            ok: true,
            json: async () => ({ contratos: mockContratos }),
          }) as unknown as Response
      )
      .mockImplementationOnce(async (url: any) => {
        // Verificar que a URL contém o query param cnpj
        expect(String(url)).toContain(
          '/api/admin/cobranca?cnpj=02494916000170'
        );
        return {
          ok: true,
          json: async () => ({
            contratos: [
              {
                tomador_id: 1,
                cnpj: '02494916000170',
                contrato_id: 35,
                plano_id: 4,
                plano_nome: 'Plano Fixo',
                plano_preco: 20.0,
                pagamento_id: 21,
                pagamento_valor: 20.0,
                pagamento_status: 'pago',
                data_pagamento: '2025-12-24T14:18:47.37561',
                tipo_tomador: 'entidade',
                nome_tomador: 'Entidade Teste',
                numero_contrato: 35,
                plano_tipo: 'fixo',
                numero_funcionarios_estimado: 10,
                numero_funcionarios_atual: 10,
                status: 'ativo',
              },
            ],
          }),
        } as unknown as Response;
      });

    render(<CobrancaContent />);

    // Preencher input de CNPJ e clicar no botão Filtrar CNPJ
    const cnpjInput = screen.getByPlaceholderText('Filtrar por CNPJ');
    fireEvent.change(cnpjInput, { target: { value: '02494916000170' } });
    const btn = screen.getByTitle('Filtrar por CNPJ');
    fireEvent.click(btn);

    // Esperar a linha com CNPJ aparecer
    expect(await screen.findByText('02494916000170')).toBeInTheDocument();
    // Valor pode aparecer em múltiplas células (usar findAll)
    expect((await screen.findAllByText(/20,00/)).length).toBeGreaterThan(0);

    fetchSpy.mockRestore();
  });

  it('renderiza corretamente plano fixo e personalizado com valores esperados', async () => {
    // Mockar fetch para retornar ambos os cenários
    const fixtures = {
      contratos: [
        {
          tomador_id: 56,
          cnpj: '02494916000170',
          plano_nome: 'Plano Fixo Teste',
          plano_tipo: 'fixo',
          plano_preco: 20,
          numero_funcionarios_estimado: 15,
          numero_funcionarios_atual: 15,
          valor_pago: 300,
          data_pagamento: '2025-12-27T00:00:00Z',
          tipo_tomador: 'entidade',
          nome_tomador: 'Entidade Exemplo',
          status: 'ativo',
        },
        {
          tomador_id: 55,
          cnpj: '09110380000191',
          plano_nome: 'Plano Personalizado',
          plano_tipo: 'personalizado',
          plano_preco: 7,
          numero_funcionarios_estimado: 1200,
          numero_funcionarios_atual: 0,
          valor_pago: 8400,
          data_pagamento: '2025-12-27T00:00:00Z',
          tipo_tomador: 'clinica',
          nome_tomador: 'Clínica Exemplo',
          status: 'ativo',
        },
      ],
    };

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => fixtures,
    } as unknown as Response);

    render(<CobrancaContent />);

    // Esperar pelas linhas aparecerem
    expect(await screen.findByText('02494916000170')).toBeInTheDocument();
    expect(await screen.findByText('09110380000191')).toBeInTheDocument();

    // Verificar plano_preco formatado
    expect((await screen.findAllByText(/R\$ 20,00/)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/R\$ 7,00/)).length).toBeGreaterThan(0);

    // Verificar valor_pago formatado
    expect((await screen.findAllByText(/R\$ 300,00/)).length).toBeGreaterThan(
      0
    );
    expect((await screen.findAllByText(/R\$ 8.400,00/)).length).toBeGreaterThan(
      0
    );

    jest.restoreAllMocks();
  });

  it('exibe total correto mesmo com valores string/formato ou zero', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        contratos: [
          {
            id: 1,
            tomador_id: 57,
            cnpj: '41877277000184',
            nome_tomador: 'Teste NaN',
            tipo_tomador: 'clinica',
            plano_id: 1,
            plano_preco: null,
            numero_funcionarios_estimado: 150,
            numero_funcionarios_atual: 1,
            valor_pago: 'R$ 0,00',
            pagamento_valor: '0',
            pagamento_status: 'pago',
            status: 'ativo',
            data_contratacao: '2025-12-30T00:00:00Z',
            data_fim_vigencia: '2026-12-31T00:00:00Z',
            data_pagamento: '2025-12-31T00:00:00Z',
          },
          {
            id: 2,
            tomador_id: 58,
            cnpj: '00000000000100',
            nome_tomador: 'Outro Teste',
            tipo_tomador: 'entidade',
            plano_id: 2,
            plano_preco: 360,
            numero_funcionarios_estimado: 1,
            numero_funcionarios_atual: 1,
            valor_pago: 360,
            pagamento_valor: 360,
            pagamento_status: 'pago',
            status: 'ativo',
            data_contratacao: '2025-12-30T00:00:00Z',
            data_fim_vigencia: '2026-12-31T00:00:00Z',
            data_pagamento: '2025-12-30T00:00:00Z',
          },
        ],
      }),
    } as unknown as Response);

    render(<CobrancaContent />);

    expect(await screen.findByText('Gestão de Cobranças')).toBeInTheDocument();

    // Total deve ignorar o valor formatado 'R$ 0,00' e somar apenas o 360
    expect((await screen.findAllByText(/R\$ 360,00/)).length).toBeGreaterThan(
      0
    );

    jest.restoreAllMocks();
  });
});
