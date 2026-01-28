import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ModalContrato from '@/components/modals/ModalContrato';

describe('ModalContrato comportamento de aceite por rolagem', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    (global as any).fetch = jest.fn();
  });

  it('habilita checkbox automaticamente quando o conteúdo não possui scroll', async () => {
    // mock do GET /api/contratos/999
    (global as any).fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ contrato: { id: 999, conteudo_gerado: 'Curto Gerado', aceito: false } }),
      })
    );

    render(<ModalContrato isOpen={true} onClose={() => {}} contratoId={999} />);

    const content = await screen.findByTestId('contrato-content');

    // Simular que o conteúdo é menor que a área (clientHeight >= scrollHeight)
    Object.defineProperty(content, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(content, 'scrollHeight', { value: 100, configurable: true });

    // Aguardamos o efeito que checa o tamanho inicial (usa timeout)
    await waitFor(() => expect(screen.getByTestId('aceite-checkbox')).not.toBeDisabled());

    // O modal agora exibe o contrato padrão unificado
    await waitFor(() => expect(content.textContent).toContain('CONTRATO DE PRESTAÇÃO DE SERVIÇOS DIGITAIS'));
    // Não deve exibir aviso de resumo nem conteúdos dinâmicos

    // Marcar checkbox e verificar botão de aceite habilitado
    fireEvent.click(screen.getByTestId('aceite-checkbox'));

    // Preparar mock para POST de aceite
    (global as any).fetch.mockImplementationOnce(() =>
      Promise.resolve({ ok: true, json: async () => ({ success: true }) })
    );

    const btn = screen.getByTestId('aceitar-button');
    expect(btn).not.toBeDisabled();

    fireEvent.click(btn);

    await waitFor(() => {
      expect((global as any).fetch).toHaveBeenCalledWith('/api/contratos', expect.any(Object));
    });
  });

  it('exige rolar até o fim antes de habilitar checkbox', async () => {
    const longText = new Array(200).fill('Linha longa de texto').join('\n');

    (global as any).fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ contrato: { id: 1001, conteudo_gerado: longText, aceito: false } }),
      })
    );

    render(<ModalContrato isOpen={true} onClose={() => {}} contratoId={1001} />);

    const content = await screen.findByTestId('contrato-content');

    // Simular área rolável: clientHeight < scrollHeight
    Object.defineProperty(content, 'clientHeight', { value: 100, configurable: true });
    Object.defineProperty(content, 'scrollHeight', { value: 2000, configurable: true });
    // Inicialmente deve estar desabilitado
    expect(screen.getByTestId('aceite-checkbox')).toBeDisabled();

    // Simular rolagem até o final
    Object.defineProperty(content, 'scrollTop', { value: 1900, configurable: true });
    fireEvent.scroll(content);

    await waitFor(() => expect(screen.getByTestId('aceite-checkbox')).not.toBeDisabled());
  });
});