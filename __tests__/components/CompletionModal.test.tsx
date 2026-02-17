import { render, screen } from '@testing-library/react';
import CompletionModal from '@/components/avaliacao/CompletionModal';

describe('CompletionModal', () => {
  it('não renderiza quando isOpen é false', () => {
    const { container } = render(
      <CompletionModal isOpen={false} status="processing" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza modal de processamento com spinner quando status é processing', () => {
    render(<CompletionModal isOpen={true} status="processing" />);

    // Verifica título
    expect(screen.getByText('Finalizando sua avaliação...')).toBeInTheDocument();
    
    // Verifica mensagem de processamento
    expect(
      screen.getByText('Estamos processando suas respostas e calculando os resultados.')
    ).toBeInTheDocument();
    
    // Verifica mensagem de aguarde
    expect(screen.getByText('Por favor, aguarde um momento.')).toBeInTheDocument();
    
    // Verifica que o spinner está presente (div com classe animate-spin)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renderiza modal de sucesso com checkmark quando status é success', () => {
    const { container } = render(<CompletionModal isOpen={true} status="success" />);

    // Verifica título de sucesso
    expect(screen.getByText('Avaliação enviada com sucesso!')).toBeInTheDocument();
    
    // Verifica mensagem de sucesso
    expect(
      screen.getByText('Todas as suas respostas foram processadas corretamente.')
    ).toBeInTheDocument();
    
    // Verifica mensagem de redirecionamento
    expect(screen.getByText('Redirecionando para o comprovante...')).toBeInTheDocument();
    
    // Verifica que o checkmark SVG está presente
    const checkmark = container.querySelector('svg');
    expect(checkmark).toBeInTheDocument();
    
    // Verifica que o círculo verde está presente
    const greenCircle = container.querySelector('.bg-green-100');
    expect(greenCircle).toBeInTheDocument();
  });

  it('aplica overlay escuro quando modal está aberto', () => {
    const { container } = render(
      <CompletionModal isOpen={true} status="processing" />
    );

    // Verifica que o overlay tem as classes corretas
    const overlay = container.firstChild;
    expect(overlay).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-75');
  });

  it('aplica z-index alto para sobrepor outros elementos', () => {
    const { container } = render(
      <CompletionModal isOpen={true} status="processing" />
    );

    const overlay = container.firstChild;
    expect(overlay).toHaveClass('z-[100]');
  });

  it('não possui botão de fechar (modal não-dismissível)', () => {
    render(<CompletionModal isOpen={true} status="processing" />);
    
    // Verificar que não há botão de fechar (X)
    const closeButtons = screen.queryAllByRole('button');
    expect(closeButtons).toHaveLength(0);
  });

  it('modal está centralizado na tela', () => {
    const { container } = render(
      <CompletionModal isOpen={true} status="processing" />
    );

    const overlay = container.firstChild;
    expect(overlay).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('transiciona de processing para success mantendo estrutura', () => {
    const { rerender } = render(
      <CompletionModal isOpen={true} status="processing" />
    );

    // Verifica estado inicial
    expect(screen.getByText('Finalizando sua avaliação...')).toBeInTheDocument();

    // Muda para sucesso
    rerender(<CompletionModal isOpen={true} status="success" />);

    // Verifica novo estado
    expect(screen.getByText('Avaliação enviada com sucesso!')).toBeInTheDocument();
    expect(screen.queryByText('Finalizando sua avaliação...')).not.toBeInTheDocument();
  });
});
