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
  describe('Renderização base (entidade — isClinica=false)', () => {
    it('renderiza o título do bloco de fluxo', () => {
      render(<FlowStepsExplainer />);
      expect(
        screen.getByText('📋 Entenda o Fluxo Completo')
      ).toBeInTheDocument();
    });

    it('renderiza todas as 6 etapas do fluxo de entidade', () => {
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

    it('NÃO exibe "Inserção de Nova Empresa" no fluxo de entidade', () => {
      render(<FlowStepsExplainer />);
      expect(
        screen.queryByText('Inserção de Nova Empresa')
      ).not.toBeInTheDocument();
    });

    it('renderiza 5 setas separadoras entre as 6 etapas de entidade', () => {
      render(<FlowStepsExplainer />);
      const arrows = screen.getAllByText('→');
      expect(arrows).toHaveLength(5); // 6 etapas = 5 setas
    });
  });

  describe('Renderização de clínica (isClinica=true)', () => {
    it('renderiza todas as 7 etapas do fluxo de clínica', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      expect(screen.getByText('Inserção de Nova Empresa')).toBeInTheDocument();
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

    it('"Inserção de Nova Empresa" é a primeira etapa no fluxo de clínica', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveTextContent('Inserção de Nova Empresa');
    });

    it('renderiza 7 setas separadoras no fluxo de clínica (6 entre etapas + 1 fork para sub-etapas)', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      const arrows = screen.getAllByText('→');
      expect(arrows).toHaveLength(7); // 7 etapas = 6 setas + 1 seta extra do fork de Inserção de Funcionário
    });

    it('exibe tooltip de Inserção de Nova Empresa ao passar o mouse', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      const btn = screen.getByText('Inserção de Nova Empresa');
      fireEvent.mouseEnter(btn);
      expect(
        screen.getByText(
          /Cadastre as empresas clientes que terão funcionários avaliados pela clínica/
        )
      ).toBeInTheDocument();
    });

    it('oculta tooltip de Nova Empresa ao remover o mouse', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      const btn = screen.getByText('Inserção de Nova Empresa');
      fireEvent.mouseEnter(btn);
      fireEvent.mouseLeave(btn);
      expect(
        screen.queryByText(
          /Cadastre as empresas clientes que terão funcionários avaliados pela clínica/
        )
      ).not.toBeInTheDocument();
    });

    it('exibe sub-etapas de Inserção de Funcionário no fluxo de clínica', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      expect(screen.getByText("via 'Importação em massa'")).toBeInTheDocument();
      expect(screen.getByText("via 'Nova empresa'")).toBeInTheDocument();
    });

    it('exibe tooltip de sub-etapa Importação em massa ao passar o mouse', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      const btn = screen.getByText("via 'Importação em massa'");
      fireEvent.mouseEnter(btn);
      expect(
        screen.getByText(/Clique em 'Importação em massa' no menu a esquerda/)
      ).toBeInTheDocument();
    });

    it('oculta tooltip de Importação em massa ao remover o mouse', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      const btn = screen.getByText("via 'Importação em massa'");
      fireEvent.mouseEnter(btn);
      fireEvent.mouseLeave(btn);
      expect(
        screen.queryByText(/Clique em 'Importação em massa' no menu a esquerda/)
      ).not.toBeInTheDocument();
    });

    it('exibe tooltip de sub-etapa Nova empresa ao passar o mouse', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      const btn = screen.getByText("via 'Nova empresa'");
      fireEvent.mouseEnter(btn);
      expect(screen.getByText(/acesse via card abaixo/)).toBeInTheDocument();
    });

    it('oculta tooltip de Nova empresa ao remover o mouse', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      const btn = screen.getByText("via 'Nova empresa'");
      fireEvent.mouseEnter(btn);
      fireEvent.mouseLeave(btn);
      expect(
        screen.queryByText(/acesse via card abaixo/)
      ).not.toBeInTheDocument();
    });
  });

  describe('Tooltips interativos (entidade)', () => {
    it('não exibe tooltip antes do hover', () => {
      render(<FlowStepsExplainer />);
      expect(
        screen.queryByText(/Cadastre os funcionários que serão avaliados/)
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
      expect(screen.getByText(/incluído no PGR/)).toBeInTheDocument();
    });

    it('tooltip do último passo abre para baixo (evita corte no flex-wrap)', () => {
      render(<FlowStepsExplainer />);
      const btn = screen.getByText('Emissão e Recebimento do Laudo');
      fireEvent.mouseEnter(btn);
      // O container do tooltip do último passo deve usar top-full (abre para baixo)
      const tooltipWrapper = screen
        .getByText(/incluído no PGR/)
        .closest('div')?.parentElement;
      expect(tooltipWrapper).toHaveClass('top-full');
      expect(tooltipWrapper).not.toHaveClass('bottom-full');
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
