/**
 * Testes para o componente FlowStepsExplainer
 * Cobre o card explicativo do fluxo completo inserido em:
 * - app/entidade/dashboard/page.tsx (isClinica={false})
 * - app/rh/page.tsx (isClinica={true})
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FlowStepsExplainer from '@/components/FlowStepsExplainer';

describe('FlowStepsExplainer', () => {
  describe('Renderização base', () => {
    it('renderiza o título do bloco de fluxo', () => {
      render(<FlowStepsExplainer />);
      expect(
        screen.getByText('📋 Entenda o Fluxo Completo')
      ).toBeInTheDocument();
    });

    it('renderiza todas as 6 etapas do fluxo', () => {
      render(<FlowStepsExplainer />);
      expect(screen.getByText('Inserção de Funcionário')).toBeInTheDocument();
      expect(screen.getByText('Liberação de Lotes')).toBeInTheDocument();
      expect(screen.getByText('Avaliações')).toBeInTheDocument();
      expect(
        screen.getByText('Solicitação de Emissão de Laudo')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Recebimento do Link para Pagamento')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Emissão e Recebimento do Laudo')
      ).toBeInTheDocument();
    });

    it('renderiza as setas separadoras entre etapas', () => {
      render(<FlowStepsExplainer />);
      const arrows = screen.getAllByText('→');
      expect(arrows).toHaveLength(5); // 6 etapas = 5 setas
    });
  });

  describe('Tooltips interativos', () => {
    it('não exibe tooltip antes do hover', () => {
      render(<FlowStepsExplainer />);
      expect(
        screen.queryByText(
          /Cadastre os funcionários que serão avaliados/
        )
      ).not.toBeInTheDocument();
    });

    it('exibe tooltip de Inserção de Funcionário ao passar o mouse', () => {
      render(<FlowStepsExplainer />);
      const btn = screen.getByText('Inserção de Funcionário');
      fireEvent.mouseEnter(btn);
      expect(
        screen.getByText(
          /Cadastre os funcionários que serão avaliados na plataforma/
        )
      ).toBeInTheDocument();
    });

    it('oculta tooltip ao remover o mouse', () => {
      render(<FlowStepsExplainer />);
      const btn = screen.getByText('Inserção de Funcionário');
      fireEvent.mouseEnter(btn);
      fireEvent.mouseLeave(btn);
      expect(
        screen.queryByText(
          /Cadastre os funcionários que serão avaliados na plataforma/
        )
      ).not.toBeInTheDocument();
    });

    it('exibe tooltip de Liberação de Lotes ao passar o mouse', () => {
      render(<FlowStepsExplainer />);
      const btn = screen.getByText('Liberação de Lotes');
      fireEvent.mouseEnter(btn);
      expect(
        screen.getByText(/Libere lotes de avaliação para que os funcionários/)
      ).toBeInTheDocument();
    });

    it('exibe tooltip de Avaliações ao passar o mouse', () => {
      render(<FlowStepsExplainer />);
      const btn = screen.getByText('Avaliações');
      fireEvent.mouseEnter(btn);
      expect(
        screen.getByText(/questionário de avaliação psicossocial/)
      ).toBeInTheDocument();
    });

    it('exibe tooltip de Solicitação de Emissão ao passar o mouse', () => {
      render(<FlowStepsExplainer />);
      const btn = screen.getByText('Solicitação de Emissão de Laudo');
      fireEvent.mouseEnter(btn);
      expect(
        screen.getByText(/negocia o valor diretamente com a plataforma/)
      ).toBeInTheDocument();
    });

    it('exibe tooltip de Recebimento do Link ao passar o mouse', () => {
      render(<FlowStepsExplainer />);
      const btn = screen.getByText('Recebimento do Link para Pagamento');
      fireEvent.mouseEnter(btn);
      expect(
        screen.getByText(/via WhatsApp ou e-mail cadastrado/)
      ).toBeInTheDocument();
    });

    it('exibe tooltip de Emissão do Laudo ao passar o mouse', () => {
      render(<FlowStepsExplainer />);
      const btn = screen.getByText('Emissão e Recebimento do Laudo');
      fireEvent.mouseEnter(btn);
      expect(
        screen.getByText(/incluído no PGR/)
      ).toBeInTheDocument();
    });
  });

  describe('Prop isClinica', () => {
    it('NÃO exibe aviso de cobrança por lote quando isClinica=false (entidade)', () => {
      render(<FlowStepsExplainer isClinica={false} />);
      expect(
        screen.queryByText(/O laudo é cobrado por lote de cada empresa/)
      ).not.toBeInTheDocument();
    });

    it('exibe aviso de cobrança por lote quando isClinica=true (clínica/RH)', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      expect(
        screen.getByText(/O laudo é cobrado por lote de cada empresa/)
      ).toBeInTheDocument();
    });

    it('exibe aviso com destaque "Importante" para clínicas', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      expect(screen.getByText('💡 Importante:')).toBeInTheDocument();
    });

    it('não exibe aviso quando isClinica não informado (default false)', () => {
      render(<FlowStepsExplainer />);
      expect(
        screen.queryByText(/O laudo é cobrado por lote de cada empresa/)
      ).not.toBeInTheDocument();
    });
  });
});
