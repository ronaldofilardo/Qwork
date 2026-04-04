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
      expect(
        screen.getByText('1. Inserção de Funcionário')
      ).toBeInTheDocument();
      expect(screen.getByText('2. Liberação de Lotes')).toBeInTheDocument();
      expect(screen.getByText('3. Avaliações')).toBeInTheDocument();
      expect(
        screen.getByText('4. Solicitação de Emissão de Laudo')
      ).toBeInTheDocument();
      expect(
        screen.getByText('5. Recebimento do Link para Pagamento')
      ).toBeInTheDocument();
      expect(
        screen.getByText('6. Emissão e Recebimento do Laudo')
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
    it('exibe o bloco de fork com os dois caminhos de entrada', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      expect(screen.getByText('⚡ Importação em massa')).toBeInTheDocument();
      expect(screen.getByText('1. Nova Empresa')).toBeInTheDocument();
      expect(
        screen.getByText('2. Inserção de Funcionários')
      ).toBeInTheDocument();
    });

    it('exibe separador "ou" entre os caminhos do fork', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      expect(screen.getByText('ou')).toBeInTheDocument();
    });

    it('exibe badge "Recomendado" no caminho de importação em massa', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      expect(screen.getByText('Recomendado')).toBeInTheDocument();
    });

    it('"⚡ Importação em massa" é o primeiro botão no fluxo de clínica', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveTextContent('Importação em massa');
    });

    it('renderiza os passos comuns do fluxo (3 ao 7) após o fork', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      expect(screen.getByText('3. Liberação de Lotes')).toBeInTheDocument();
      expect(screen.getByText('4. Avaliações')).toBeInTheDocument();
      expect(
        screen.getByText('5. Solicitação de Emissão de Laudo')
      ).toBeInTheDocument();
      expect(
        screen.getByText('6. Recebimento do Link para Pagamento')
      ).toBeInTheDocument();
      expect(
        screen.getByText('7. Emissão e Recebimento do Laudo')
      ).toBeInTheDocument();
    });

    it('renderiza 6 setas no fluxo de clínica (5 entre blocos + 1 dentro do fork manual)', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      const arrows = screen.getAllByText('→');
      expect(arrows).toHaveLength(6);
    });

    it('NÃO exibe "Inserção de Nova Empresa" como passo isolado no fluxo de clínica', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      // O nome antigo como passo standalone não existe mais
      const buttons = screen.getAllByRole('button');
      const labels = buttons.map((b) => b.textContent);
      expect(labels).not.toContain('1. Inserção de Nova Empresa');
      expect(labels).not.toContain('2. Inserção de Funcionário');
    });

    it('exibe tooltip de "⚡ Importação em massa" ao passar o mouse', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      const btn = screen.getByText('⚡ Importação em massa');
      fireEvent.mouseEnter(btn);
      expect(
        screen.getByText(/Acesse 'Importação em massa' no menu à esquerda/)
      ).toBeInTheDocument();
    });

    it('oculta tooltip de "⚡ Importação em massa" ao remover o mouse', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      const btn = screen.getByText('⚡ Importação em massa');
      fireEvent.mouseEnter(btn);
      fireEvent.mouseLeave(btn);
      expect(
        screen.queryByText(/Acesse 'Importação em massa' no menu à esquerda/)
      ).not.toBeInTheDocument();
    });

    it('exibe tooltip de "1. Nova Empresa" ao passar o mouse', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      const btn = screen.getByText('1. Nova Empresa');
      fireEvent.mouseEnter(btn);
      expect(
        screen.getByText(/Clique em '\+Nova empresa' no topo desta página/)
      ).toBeInTheDocument();
    });

    it('oculta tooltip de "1. Nova Empresa" ao remover o mouse', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      const btn = screen.getByText('1. Nova Empresa');
      fireEvent.mouseEnter(btn);
      fireEvent.mouseLeave(btn);
      expect(
        screen.queryByText(/Clique em '\+Nova empresa' no topo desta página/)
      ).not.toBeInTheDocument();
    });

    it('exibe tooltip de "2. Inserção de Funcionários" ao passar o mouse', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      const btn = screen.getByText('2. Inserção de Funcionários');
      fireEvent.mouseEnter(btn);
      expect(screen.getByText(/acesse o card dela abaixo/)).toBeInTheDocument();
    });

    it('oculta tooltip de "2. Inserção de Funcionários" ao remover o mouse', () => {
      render(<FlowStepsExplainer isClinica={true} />);
      const btn = screen.getByText('2. Inserção de Funcionários');
      fireEvent.mouseEnter(btn);
      fireEvent.mouseLeave(btn);
      expect(
        screen.queryByText(/acesse o card dela abaixo/)
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
      const btn = screen.getByText('1. Inserção de Funcionário');
      fireEvent.mouseEnter(btn);
      expect(
        screen.getByText(
          /Cadastre os funcionários que serão avaliados na plataforma/
        )
      ).toBeInTheDocument();
    });

    it('oculta tooltip ao remover o mouse', () => {
      render(<FlowStepsExplainer />);
      const btn = screen.getByText('1. Inserção de Funcionário');
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
      const btn = screen.getByText('2. Liberação de Lotes');
      fireEvent.mouseEnter(btn);
      expect(
        screen.getByText(/Libere lotes de avaliação para que os funcionários/)
      ).toBeInTheDocument();
    });

    it('exibe tooltip de Avaliações ao passar o mouse', () => {
      render(<FlowStepsExplainer />);
      const btn = screen.getByText('3. Avaliações');
      fireEvent.mouseEnter(btn);
      expect(
        screen.getByText(/questionário de avaliação psicossocial/)
      ).toBeInTheDocument();
    });

    it('exibe tooltip de Solicitação de Emissão ao passar o mouse', () => {
      render(<FlowStepsExplainer />);
      const btn = screen.getByText('4. Solicitação de Emissão de Laudo');
      fireEvent.mouseEnter(btn);
      expect(
        screen.getByText(/negocia o valor diretamente com a plataforma/)
      ).toBeInTheDocument();
    });

    it('exibe tooltip de Recebimento do Link ao passar o mouse', () => {
      render(<FlowStepsExplainer />);
      const btn = screen.getByText('5. Recebimento do Link para Pagamento');
      fireEvent.mouseEnter(btn);
      expect(
        screen.getByText(/via WhatsApp ou e-mail cadastrado/)
      ).toBeInTheDocument();
    });

    it('exibe tooltip de Emissão do Laudo ao passar o mouse', () => {
      render(<FlowStepsExplainer />);
      const btn = screen.getByText('6. Emissão e Recebimento do Laudo');
      fireEvent.mouseEnter(btn);
      expect(screen.getByText(/incluído no PGR/)).toBeInTheDocument();
    });

    it('tooltip do último passo abre para baixo (evita corte no flex-wrap)', () => {
      render(<FlowStepsExplainer />);
      const btn = screen.getByText('6. Emissão e Recebimento do Laudo');
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
