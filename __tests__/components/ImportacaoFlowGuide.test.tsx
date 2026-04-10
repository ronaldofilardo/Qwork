/**
 * Testes para o componente ImportacaoFlowGuide
 * Cobre o card explicativo de importação em massa:
 * - app/rh/importacao/page.tsx (isClinica={true})
 * - app/entidade/importacao/page.tsx (isClinica={false})
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImportacaoFlowGuide from '@/components/ImportacaoFlowGuide';

describe('ImportacaoFlowGuide', () => {
  describe('Renderização base', () => {
    it('renderiza o título do bloco', () => {
      render(<ImportacaoFlowGuide />);
      expect(
        screen.getByText('📋 Como funciona a Importação por Planilha')
      ).toBeInTheDocument();
    });

    it('renderiza todas as 5 etapas de importação', () => {
      render(<ImportacaoFlowGuide />);
      expect(screen.getByText('1. Upload da Planilha')).toBeInTheDocument();
      expect(
        screen.getByText('2. Mapeamento de Colunas')
      ).toBeInTheDocument();
      expect(screen.getByText('3. Validação')).toBeInTheDocument();
      expect(screen.getByText('4. Importação')).toBeInTheDocument();
      expect(screen.getByText('5. Resultado')).toBeInTheDocument();
    });

    it('renderiza atalho no fluxo completo', () => {
      render(<ImportacaoFlowGuide />);
      expect(
        screen.getByText(/Atalho no fluxo completo/)
      ).toBeInTheDocument();
    });
  });

  describe('Divisor e seção "Colunas obrigatórias e formatação de dados"', () => {
    it('exibe divisor com título "Colunas obrigatórias e formatação de dados"', () => {
      render(<ImportacaoFlowGuide />);
      expect(
        screen.getByText('Colunas obrigatórias e formatação de dados')
      ).toBeInTheDocument();
    });
  });

  describe('Clínica (isClinica=true)', () => {
    it('exibe informação de Empresa com CNPJ', () => {
      render(<ImportacaoFlowGuide isClinica={true} />);
      expect(
        screen.getByText(/Empresa.*CNPJ/)
      ).toBeInTheDocument();
    });

    it('exibe informação de Data de Nascimento com formato dd/mm/aaaa', () => {
      render(<ImportacaoFlowGuide isClinica={true} />);
      expect(
        screen.getByText(/Data de Nascimento.*dd\/mm\/aaaa/)
      ).toBeInTheDocument();
    });

    it('exibe aviso sobre Excel para data', () => {
      render(<ImportacaoFlowGuide isClinica={true} />);
      expect(
        screen.getByText(/evitar perda por formatação do Excel/)
      ).toBeInTheDocument();
    });

    it('exibe informação de CPF com 11 dígitos', () => {
      render(<ImportacaoFlowGuide isClinica={true} />);
      expect(
        screen.getByText(/CPF.*deve conter apenas 11 dígitos/)
      ).toBeInTheDocument();
    });

    it('exibe informação sobre Função', () => {
      render(<ImportacaoFlowGuide isClinica={true} />);
      expect(
        screen.getByText(/Função.*importante para determinar a versão do questionário/)
      ).toBeInTheDocument();
    });

    it('exibe referência à etapa "4. Níveis"', () => {
      render(<ImportacaoFlowGuide isClinica={true} />);
      expect(
        screen.getByText(/4\. Níveis/)
      ).toBeInTheDocument();
    });
  });

  describe('Entidade (isClinica=false)', () => {
    it('NÃO exibe informação de Empresa com CNPJ para entidade', () => {
      render(<ImportacaoFlowGuide isClinica={false} />);
      const empresaElements = screen.queryAllByText(/Empresa.*CNPJ/);
      expect(empresaElements).toHaveLength(0);
    });

    it('exibe informação de Data de Nascimento com formato dd/mm/aaaa para entidade', () => {
      render(<ImportacaoFlowGuide isClinica={false} />);
      expect(
        screen.getByText(/Data de Nascimento.*dd\/mm\/aaaa/)
      ).toBeInTheDocument();
    });

    it('exibe aviso sobre Excel para data em entidade', () => {
      render(<ImportacaoFlowGuide isClinica={false} />);
      expect(
        screen.getByText(/evitar perda por formatação do Excel/)
      ).toBeInTheDocument();
    });

    it('exibe informação de CPF com 11 dígitos para entidade', () => {
      render(<ImportacaoFlowGuide isClinica={false} />);
      expect(
        screen.getByText(/CPF.*deve conter apenas 11 dígitos/)
      ).toBeInTheDocument();
    });

    it('exibe informação sobre Função para entidade', () => {
      render(<ImportacaoFlowGuide isClinica={false} />);
      expect(
        screen.getByText(/Função.*importante para determinar a versão do questionário/)
      ).toBeInTheDocument();
    });

    it('exibe referência à etapa "4. Níveis" para entidade', () => {
      render(<ImportacaoFlowGuide isClinica={false} />);
      expect(
        screen.getByText(/4\. Níveis/)
      ).toBeInTheDocument();
    });
  });

  describe('Prop isClinica padrão', () => {
    it('renderiza com isClinica=true por padrão', () => {
      render(<ImportacaoFlowGuide />);
      // Quando isClinica=true (padrão), CNPJ deve aparecer
      expect(
        screen.getByText(/Empresa.*CNPJ/)
      ).toBeInTheDocument();
    });
  });
});
