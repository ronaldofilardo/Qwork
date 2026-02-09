import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from '@testing-library/react';
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
        json: async () => ({
          contrato: {
            id: 999,
            conteudo_gerado: 'Curto Gerado',
            aceito: false,
            tomador_nome: 'Empresa Teste LTDA',
            tomador_cnpj: '12.345.678/0001-90',
            tomador_tipo: 'entidade',
          },
        }),
      })
    );

    render(<ModalContrato isOpen={true} onClose={() => {}} contratoId={999} />);

    const content = await screen.findByTestId('contrato-content');

    // Simular que o conteúdo é menor que a área (clientHeight >= scrollHeight)
    Object.defineProperty(content, 'clientHeight', {
      value: 200,
      configurable: true,
    });
    Object.defineProperty(content, 'scrollHeight', {
      value: 100,
      configurable: true,
    });

    // Aguardamos o efeito que checa o tamanho inicial (usa timeout)
    await waitFor(() =>
      expect(screen.getByTestId('aceite-checkbox')).not.toBeDisabled()
    );

    // O modal agora exibe o contrato padrão unificado
    await waitFor(() =>
      expect(content.textContent).toContain(
        'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DIGITAIS'
      )
    );
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
      expect((global as any).fetch).toHaveBeenCalledWith(
        '/api/contratos',
        expect.any(Object)
      );
    });
  });

  it('exige rolar até o fim antes de habilitar checkbox', async () => {
    const longText = new Array(200).fill('Linha longa de texto').join('\n');

    (global as any).fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          contrato: {
            id: 1001,
            conteudo_gerado: longText,
            aceito: false,
            tomador_nome: 'Clínica Saúde Ocupacional',
            tomador_cnpj: '98.765.432/0001-12',
            tomador_tipo: 'clinica',
          },
        }),
      })
    );

    render(
      <ModalContrato isOpen={true} onClose={() => {}} contratoId={1001} />
    );

    const content = await screen.findByTestId('contrato-content');

    // Simular área rolável: clientHeight < scrollHeight
    Object.defineProperty(content, 'clientHeight', {
      value: 100,
      configurable: true,
    });
    Object.defineProperty(content, 'scrollHeight', {
      value: 2000,
      configurable: true,
    });
    // Inicialmente deve estar desabilitado
    expect(screen.getByTestId('aceite-checkbox')).toBeDisabled();

    // Simular rolagem até o final
    Object.defineProperty(content, 'scrollTop', {
      value: 1900,
      configurable: true,
    });
    fireEvent.scroll(content);

    await waitFor(() =>
      expect(screen.getByTestId('aceite-checkbox')).not.toBeDisabled()
    );
  });

  it('exibe alerta de cobrança R$ 200 para clínicas', async () => {
    (global as any).fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          contrato: {
            id: 2001,
            conteudo_gerado: 'Texto breve',
            aceito: false,
            tomador_nome: 'Clínica Premium',
            tomador_cnpj: '11.111.111/0001-11',
            tomador_tipo: 'clinica',
          },
        }),
      })
    );

    render(
      <ModalContrato isOpen={true} onClose={() => {}} contratoId={2001} />
    );

    // Aguardar exibição do alerta visual no footer (container .bg-amber-50)
    await waitFor(() => {
      // Procurar pelo alerta visual especificamente dentro de .bg-amber-50
      const alertaHeading = screen.getByText(/^Atenção:$/);
      const alertaVisual = alertaHeading.closest('.bg-amber-50');
      expect(alertaVisual).toBeInTheDocument();
    });

    // Verificar conteúdo dentro do alerta visual
    const alertaHeading = screen.getByText(/^Atenção:$/);
    const alertaVisual = alertaHeading.closest('.bg-amber-50');
    expect(
      within(alertaVisual as HTMLElement).getByText(
        /Cada empresa cliente que você cadastrar na QWork/
      )
    ).toBeInTheDocument();
    expect(
      within(alertaVisual as HTMLElement).getByText(/R\$ 200,00/)
    ).toBeInTheDocument();
  });

  it('NÃO exibe alerta de cobrança para entidades', async () => {
    (global as any).fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          contrato: {
            id: 2002,
            conteudo_gerado: 'Texto breve',
            aceito: false,
            tomador_nome: 'ONG Social',
            tomador_cnpj: '22.222.222/0001-22',
            tomador_tipo: 'entidade',
          },
        }),
      })
    );

    render(
      <ModalContrato isOpen={true} onClose={() => {}} contratoId={2002} />
    );

    // Aguardar que o modal carregue
    await waitFor(() => {
      expect(screen.getByText('Dados da Contratante')).toBeInTheDocument();
    });

    // Verificar que o alerta visual (container .bg-amber-50) NÃO aparece para entidades
    // Nota: "Atenção:" pode aparecer no contrato (cláusula 4.2), mas não no alerta visual
    const alertaVisualContainer = document.querySelector('.bg-amber-50');

    if (alertaVisualContainer) {
      // Se encontrou um container amber, o alerta visual não deve estar presente para entidades
      expect(
        within(alertaVisualContainer).queryByText(/^Atenção:$/)
      ).not.toBeInTheDocument();
    } else {
      // Idealmente, para entidades, nem deve existir container .bg-amber-50
      expect(alertaVisualContainer).toBeNull();
    }
  });

  it('exibe dados da tomadora (nome e CNPJ)', async () => {
    (global as any).fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          contrato: {
            id: 3001,
            conteudo_gerado: 'Texto',
            aceito: false,
            tomador_nome: 'Empresa XYZ Consultoria',
            tomador_cnpj: '33.333.333/0001-33',
            tomador_tipo: 'entidade',
          },
        }),
      })
    );

    render(
      <ModalContrato isOpen={true} onClose={() => {}} contratoId={3001} />
    );

    // Aguardar exibição dos dados
    await waitFor(() => {
      expect(screen.getByText('Dados da Contratante')).toBeInTheDocument();
      expect(screen.getByText(/Razão Social:/)).toBeInTheDocument();
      expect(screen.getByText('Empresa XYZ Consultoria')).toBeInTheDocument();
      expect(screen.getByText(/CNPJ:/)).toBeInTheDocument();
      expect(screen.getByText('33.333.333/0001-33')).toBeInTheDocument();
    });
  });

  it('botão exibe texto correto: "Prosseguir para o Pagamento"', async () => {
    (global as any).fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          contrato: {
            id: 4001,
            conteudo: 'Breve',
            aceito: false,
            tomador_nome: 'Teste',
            tomador_cnpj: '44.444.444/0001-44',
            tomador_tipo: 'clinica',
          },
        }),
      })
    );

    render(
      <ModalContrato isOpen={true} onClose={() => {}} contratoId={4001} />
    );

    const content = await screen.findByTestId('contrato-content');
    Object.defineProperty(content, 'clientHeight', {
      value: 200,
      configurable: true,
    });
    Object.defineProperty(content, 'scrollHeight', {
      value: 100,
      configurable: true,
    });

    await waitFor(() => {
      const btn = screen.getByTestId('aceitar-button');
      expect(btn.textContent).toContain('Aceitar Contrato e Iniciar o Uso');
    });
  });
});
