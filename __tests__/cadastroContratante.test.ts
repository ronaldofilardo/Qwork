/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  validarCNPJ,
  validarEtapaDados,
  validarEtapaResponsavel,
  gerarContratoSimulado,
  DadosContratante,
  DadosResponsavel,
} from '@/lib/cadastroContratante';

describe('cadastroContratante - domínio', () => {
  test('validarCNPJ aceita CNPJ válido e rejeita inválido', () => {
    // Exemplo de CNPJ válido (formato genérico usado em testes)
    // 11444777000161 é um CNPJ gerado que passa o algoritmo
    expect(validarCNPJ('11.444.777/0001-61')).toBe(true);
    expect(validarCNPJ('00.000.000/0000-00')).toBe(false);
    expect(validarCNPJ('11111111111111')).toBe(false);
    expect(validarCNPJ('')).toBe(false);
  });

  test('validarEtapaDados retorna erro quando campos faltam ou arquivos não anexados', () => {
    const dados: DadosContratante = {
      nome: 'ACME Ltda',
      cnpj: '11.444.777/0001-61',
      email: 'contato@acme.com',
      telefone: '(11) 99999-9999',
      endereco: 'Rua Teste, 100',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234-567',
    };

    const arquivosEmpty = {
      cartao_cnpj: null,
      contrato_social: null,
      doc_identificacao: null,
    };

    const res = validarEtapaDados(dados, arquivosEmpty);
    expect(res.ok).toBe(false);
    expect(res.error).toContain('Cartão CNPJ');
  });

  test('quando NEXT_PUBLIC_DISABLE_ANEXOS=true validarEtapaDados permite ausência de anexos', () => {
    const prev = process.env.NEXT_PUBLIC_DISABLE_ANEXOS;
    process.env.NEXT_PUBLIC_DISABLE_ANEXOS = 'true';

    try {
      const dados: DadosContratante = {
        nome: 'ACME Ltda',
        cnpj: '11.444.777/0001-61',
        email: 'contato@acme.com',
        telefone: '(11) 99999-9999',
        endereco: 'Rua Teste, 100',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234-567',
      };

      const arquivosEmpty = {
        cartao_cnpj: null,
        contrato_social: null,
        doc_identificacao: null,
      };

      const res = validarEtapaDados(dados, arquivosEmpty);
      expect(res.ok).toBe(true);
    } finally {
      process.env.NEXT_PUBLIC_DISABLE_ANEXOS = prev;
    }
  });

  test('validarEtapaResponsavel detecta campos faltantes', () => {
    const responsavel: DadosResponsavel = {
      nome: 'João',
      cpf: '123.456.789-00',
      email: 'joao@x.com',
      celular: '(11) 99999-9999',
    };

    const arquivosEmpty = {
      cartao_cnpj: null,
      contrato_social: null,
      doc_identificacao: null,
    };

    const res = validarEtapaResponsavel(responsavel, arquivosEmpty);
    expect(res.ok).toBe(false);
    expect(res.error).toContain('Documento de identificação');
  });

  test('quando NEXT_PUBLIC_DISABLE_ANEXOS=true validarEtapaResponsavel permite ausência de doc_identificacao', () => {
    const prev = process.env.NEXT_PUBLIC_DISABLE_ANEXOS;
    process.env.NEXT_PUBLIC_DISABLE_ANEXOS = 'true';

    try {
      const responsavel: DadosResponsavel = {
        nome: 'João',
        cpf: '123.456.789-00',
        email: 'joao@x.com',
        celular: '(11) 99999-9999',
      };

      const arquivosEmpty = {
        cartao_cnpj: null,
        contrato_social: null,
        doc_identificacao: null,
      };

      const res = validarEtapaResponsavel(responsavel, arquivosEmpty);
      expect(res.ok).toBe(true);
    } finally {
      process.env.NEXT_PUBLIC_DISABLE_ANEXOS = prev;
    }
  });

  test('gerarContratoSimulado gera contrato para dados válidos', () => {
    const plano = {
      id: 1,
      nome: 'Básico',
      preco: 100,
      tipo: 'fixo',
      caracteristicas: {},
    } as any;

    const dados: DadosContratante = {
      nome: 'ACME Ltda',
      cnpj: '11.444.777/0001-61',
      email: 'contato@acme.com',
      telefone: '(11) 99999-9999',
      endereco: 'Rua Teste, 100',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234-567',
    };

    const responsavel: DadosResponsavel = {
      nome: 'João Silva',
      cpf: '123.456.789-09',
      email: 'joao@x.com',
      celular: '(11) 99999-9999',
    };

    const contrato = gerarContratoSimulado({
      plano,
      dadosContratante: dados,
      dadosResponsavel: responsavel,
      numeroFuncionarios: 5,
      tipo: 'entidade',
    });

    expect(typeof contrato).toBe('string');
    expect(contrato).toContain('CONTRATO DE PRESTAÇÃO DE SERVIÇOS');
    expect(contrato).toContain('ACME Ltda');
  });

  test('gerarContratoSimulado lança erro se dados incompletos', () => {
    const plano = {
      id: 1,
      nome: 'Básico',
      preco: 100,
      tipo: 'fixo',
      caracteristicas: {},
    } as any;

    const dados: any = {
      nome: '',
      cnpj: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
    };

    const responsavel: any = { nome: '', cpf: '', email: '' };

    expect(() =>
      gerarContratoSimulado({
        plano,
        dadosContratante: dados,
        dadosResponsavel: responsavel,
        numeroFuncionarios: 1,
        tipo: 'entidade',
      })
    ).toThrow('Dados incompletos para geração do contrato');
  });
});
