/**
 * Testes para funções de validação client-side
 */

import '@testing-library/jest-dom';
import {
  validarCNPJ,
  validarCPF,
  validarEmail,
  validarTelefone,
  validarCEP,
  validarValor,
  validarPlano,
  validarMetodoPagamento,
  formatarCNPJ,
  formatarCPF,
  formatarTelefone,
  formatarCEP,
  formatarValor,
  validarCampoObrigatorio,
  validarTamanhoMinimo,
  validarArquivo,
  validarTipoArquivo,
  validarFormularioContratante,
  MENSAGENS_ERRO,
} from '@/lib/validacoes-contratacao';

describe('Validações de Contratação', () => {
  describe('validarCNPJ', () => {
    it('deve validar CNPJ correto', () => {
      expect(validarCNPJ('11.222.333/0001-81')).toBe(true);
      expect(validarCNPJ('11222333000181')).toBe(true);
    });

    it('deve rejeitar CNPJ inválido', () => {
      expect(validarCNPJ('11.222.333/0001-82')).toBe(false);
      expect(validarCNPJ('11.222.333/0001-00')).toBe(false);
    });

    it('deve rejeitar CNPJ com todos dígitos iguais', () => {
      expect(validarCNPJ('11.111.111/1111-11')).toBe(false);
      expect(validarCNPJ('00.000.000/0000-00')).toBe(false);
    });

    it('deve rejeitar CNPJ com tamanho incorreto', () => {
      expect(validarCNPJ('123')).toBe(false);
      expect(validarCNPJ('11.222.333/0001')).toBe(false);
    });
  });

  describe('validarCPF', () => {
    it('deve validar CPF correto', () => {
      expect(validarCPF('123.456.789-09')).toBe(true);
      expect(validarCPF('12345678909')).toBe(true);
    });

    it('deve rejeitar CPF inválido', () => {
      expect(validarCPF('123.456.789-00')).toBe(false);
      expect(validarCPF('123.456.789-10')).toBe(false);
    });

    it('deve rejeitar CPF com todos dígitos iguais', () => {
      expect(validarCPF('111.111.111-11')).toBe(false);
      expect(validarCPF('000.000.000-00')).toBe(false);
    });

    it('deve rejeitar CPF com tamanho incorreto', () => {
      expect(validarCPF('123')).toBe(false);
      expect(validarCPF('123.456.789')).toBe(false);
    });
  });

  describe('validarEmail', () => {
    it('deve validar email correto', () => {
      expect(validarEmail('teste@exemplo.com')).toBe(true);
      expect(validarEmail('user+tag@empresa.com.br')).toBe(true);
    });

    it('deve rejeitar email inválido', () => {
      expect(validarEmail('teste')).toBe(false);
      expect(validarEmail('teste@')).toBe(false);
      expect(validarEmail('@exemplo.com')).toBe(false);
      expect(validarEmail('teste @exemplo.com')).toBe(false);
    });
  });

  describe('validarTelefone', () => {
    it('deve validar telefone fixo (10 dígitos)', () => {
      expect(validarTelefone('(11) 1234-5678')).toBe(true);
      expect(validarTelefone('1112345678')).toBe(true);
    });

    it('deve validar celular (11 dígitos)', () => {
      expect(validarTelefone('(11) 98765-4321')).toBe(true);
      expect(validarTelefone('11987654321')).toBe(true);
    });

    it('deve rejeitar telefone com tamanho incorreto', () => {
      expect(validarTelefone('123')).toBe(false);
      expect(validarTelefone('123456789')).toBe(false);
      expect(validarTelefone('123456789012')).toBe(false);
    });
  });

  describe('validarCEP', () => {
    it('deve validar CEP correto', () => {
      expect(validarCEP('01310-100')).toBe(true);
      expect(validarCEP('01310100')).toBe(true);
    });

    it('deve rejeitar CEP com tamanho incorreto', () => {
      expect(validarCEP('123')).toBe(false);
      expect(validarCEP('01310-10')).toBe(false);
      expect(validarCEP('013101000')).toBe(false);
    });
  });

  describe('validarValor', () => {
    it('deve validar valores positivos', () => {
      expect(validarValor(499.0)).toBe(true);
      expect(validarValor(1)).toBe(true);
      expect(validarValor(0.01)).toBe(true);
    });

    it('deve rejeitar valores inválidos', () => {
      expect(validarValor(0)).toBe(false);
      expect(validarValor(-10)).toBe(false);
      expect(validarValor(NaN)).toBe(false);
    });
  });

  describe('validarPlano', () => {
    it('deve validar plano selecionado', () => {
      expect(validarPlano(1)).toBe(true);
      expect(validarPlano(2)).toBe(true);
    });

    it('deve rejeitar plano não selecionado', () => {
      expect(validarPlano(null)).toBe(false);
      expect(validarPlano(undefined)).toBe(false);
      expect(validarPlano(0)).toBe(false);
      expect(validarPlano(-1)).toBe(false);
    });
  });

  describe('validarMetodoPagamento', () => {
    it('deve validar métodos válidos', () => {
      expect(validarMetodoPagamento('pix')).toBe(true);
      expect(validarMetodoPagamento('boleto')).toBe(true);
      expect(validarMetodoPagamento('cartao')).toBe(true);
    });

    it('deve rejeitar métodos inválidos', () => {
      expect(validarMetodoPagamento(null)).toBe(false);
      expect(validarMetodoPagamento('dinheiro')).toBe(false);
      expect(validarMetodoPagamento('cheque')).toBe(false);
    });
  });

  describe('Formatações', () => {
    describe('formatarCNPJ', () => {
      it('deve formatar CNPJ corretamente', () => {
        expect(formatarCNPJ('11222333000181')).toBe('11.222.333/0001-81');
        expect(formatarCNPJ('11.222.333/0001-81')).toBe('11.222.333/0001-81');
      });

      it('deve limitar a 14 dígitos', () => {
        expect(formatarCNPJ('112223330001819999')).toBe('11.222.333/0001-81');
      });
    });

    describe('formatarCPF', () => {
      it('deve formatar CPF corretamente', () => {
        expect(formatarCPF('12345678909')).toBe('123.456.789-09');
        expect(formatarCPF('123.456.789-09')).toBe('123.456.789-09');
      });

      it('deve limitar a 11 dígitos', () => {
        expect(formatarCPF('123456789099999')).toBe('123.456.789-09');
      });
    });

    describe('formatarTelefone', () => {
      it('deve formatar telefone fixo', () => {
        expect(formatarTelefone('1112345678')).toBe('(11) 1234-5678');
      });

      it('deve formatar celular', () => {
        expect(formatarTelefone('11987654321')).toBe('(11) 98765-4321');
      });

      it('deve limitar a 11 dígitos', () => {
        expect(formatarTelefone('119876543219999')).toBe('(11) 98765-4321');
      });
    });

    describe('formatarCEP', () => {
      it('deve formatar CEP corretamente', () => {
        expect(formatarCEP('01310100')).toBe('01310-100');
        expect(formatarCEP('01310-100')).toBe('01310-100');
      });

      it('deve limitar a 8 dígitos', () => {
        expect(formatarCEP('013101009999')).toBe('01310-100');
      });
    });

    describe('formatarValor', () => {
      it('deve formatar valor monetário', () => {
        expect(formatarValor(499.0)).toBe('R$\u00A0499,00');
        expect(formatarValor(1234.56)).toBe('R$\u00A01.234,56');
      });
    });
  });

  describe('validarCampoObrigatorio', () => {
    it('deve validar campos preenchidos', () => {
      expect(validarCampoObrigatorio('teste')).toBe(true);
      expect(validarCampoObrigatorio('  teste  ')).toBe(true);
    });

    it('deve rejeitar campos vazios', () => {
      expect(validarCampoObrigatorio('')).toBe(false);
      expect(validarCampoObrigatorio('   ')).toBe(false);
      expect(validarCampoObrigatorio(null)).toBe(false);
      expect(validarCampoObrigatorio(undefined)).toBe(false);
    });
  });

  describe('validarTamanhoMinimo', () => {
    it('deve validar tamanho mínimo', () => {
      expect(validarTamanhoMinimo('teste', 5)).toBe(true);
      expect(validarTamanhoMinimo('teste', 3)).toBe(true);
    });

    it('deve rejeitar texto curto', () => {
      expect(validarTamanhoMinimo('abc', 5)).toBe(false);
      expect(validarTamanhoMinimo('  abc  ', 5)).toBe(false);
    });
  });

  describe('validarArquivo', () => {
    it('deve validar arquivo válido', () => {
      const arquivo = new File(['conteudo'], 'teste.pdf', {
        type: 'application/pdf',
      });
      Object.defineProperty(arquivo, 'size', { value: 1024 * 1024 }); // 1MB

      expect(validarArquivo(arquivo, 5)).toBe(true);
    });

    it('deve rejeitar arquivo muito grande', () => {
      const arquivo = new File(['conteudo'], 'teste.pdf', {
        type: 'application/pdf',
      });
      Object.defineProperty(arquivo, 'size', { value: 10 * 1024 * 1024 }); // 10MB

      expect(validarArquivo(arquivo, 5)).toBe(false);
    });

    it('deve rejeitar arquivo null', () => {
      expect(validarArquivo(null)).toBe(false);
    });
  });

  describe('validarTipoArquivo', () => {
    it('deve validar tipo permitido', () => {
      const arquivo = new File(['conteudo'], 'teste.pdf', {
        type: 'application/pdf',
      });

      expect(validarTipoArquivo(arquivo, ['pdf', 'image'])).toBe(true);
    });

    it('deve rejeitar tipo não permitido', () => {
      const arquivo = new File(['conteudo'], 'teste.exe', {
        type: 'application/x-msdownload',
      });

      expect(validarTipoArquivo(arquivo, ['pdf', 'image'])).toBe(false);
    });

    it('deve rejeitar arquivo null', () => {
      expect(validarTipoArquivo(null, ['pdf'])).toBe(false);
    });
  });

  describe('validarFormularioContratante', () => {
    const dadosValidos = {
      nome: 'Clínica Teste',
      cnpj: '11.222.333/0001-81',
      email: 'contato@clinica.com',
      telefone: '(11) 1234-5678',
      endereco: 'Rua Teste, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310-100',
      plano_id: 1,
      responsavel_nome: 'João Silva',
      responsavel_cpf: '123.456.789-09',
      responsavel_email: 'joao@clinica.com',
      responsavel_celular: '(11) 98765-4321',
      cartao_cnpj: new File([''], 'cartao.pdf', { type: 'application/pdf' }),
      contrato_social: new File([''], 'contrato.pdf', {
        type: 'application/pdf',
      }),
      doc_identificacao: new File([''], 'doc.pdf', { type: 'application/pdf' }),
    };

    // Mock do File size
    beforeEach(() => {
      Object.defineProperty(dadosValidos.cartao_cnpj, 'size', { value: 1024 });
      Object.defineProperty(dadosValidos.contrato_social, 'size', {
        value: 1024,
      });
      Object.defineProperty(dadosValidos.doc_identificacao, 'size', {
        value: 1024,
      });
    });

    it('não deve retornar erros para dados válidos', () => {
      const erros = validarFormularioContratante(dadosValidos);
      expect(Object.keys(erros).length).toBe(0);
    });

    it('deve validar campo nome obrigatório', () => {
      const erros = validarFormularioContratante({
        ...dadosValidos,
        nome: '',
      });
      expect(erros.nome).toBe(MENSAGENS_ERRO.CAMPO_OBRIGATORIO);
    });

    it('deve validar CNPJ inválido', () => {
      const erros = validarFormularioContratante({
        ...dadosValidos,
        cnpj: '11.222.333/0001-00',
      });
      expect(erros.cnpj).toBe(MENSAGENS_ERRO.CNPJ_INVALIDO);
    });

    it('deve validar email inválido', () => {
      const erros = validarFormularioContratante({
        ...dadosValidos,
        email: 'email_invalido',
      });
      expect(erros.email).toBe(MENSAGENS_ERRO.EMAIL_INVALIDO);
    });

    it('deve validar CPF do responsável inválido', () => {
      const erros = validarFormularioContratante({
        ...dadosValidos,
        responsavel_cpf: '123.456.789-00',
      });
      expect(erros.responsavel_cpf).toBe(MENSAGENS_ERRO.CPF_INVALIDO);
    });

    it('deve validar plano não selecionado', () => {
      const erros = validarFormularioContratante({
        ...dadosValidos,
        plano_id: null,
      });
      expect(erros.plano_id).toBe(MENSAGENS_ERRO.PLANO_OBRIGATORIO);
    });

    it('deve validar arquivo faltando', () => {
      const erros = validarFormularioContratante({
        ...dadosValidos,
        cartao_cnpj: null,
      });
      expect(erros.cartao_cnpj).toContain('Anexe');
    });
  });

  describe('Mensagens de Erro', () => {
    it('deve ter todas as mensagens definidas', () => {
      expect(MENSAGENS_ERRO.CNPJ_INVALIDO).toBeDefined();
      expect(MENSAGENS_ERRO.CPF_INVALIDO).toBeDefined();
      expect(MENSAGENS_ERRO.EMAIL_INVALIDO).toBeDefined();
      expect(MENSAGENS_ERRO.TELEFONE_INVALIDO).toBeDefined();
      expect(MENSAGENS_ERRO.CEP_INVALIDO).toBeDefined();
      expect(MENSAGENS_ERRO.CAMPO_OBRIGATORIO).toBeDefined();
      expect(MENSAGENS_ERRO.PLANO_OBRIGATORIO).toBeDefined();
      expect(MENSAGENS_ERRO.METODO_PAGAMENTO_OBRIGATORIO).toBeDefined();
      expect(MENSAGENS_ERRO.VALOR_INVALIDO).toBeDefined();
    });

    it('deve ter funções de mensagem dinâmica', () => {
      expect(MENSAGENS_ERRO.TAMANHO_MINIMO(10)).toBe('Mínimo de 10 caracteres');
      expect(MENSAGENS_ERRO.ARQUIVO_TAMANHO(5)).toBe('Arquivo maior que 5MB');
    });
  });
});
