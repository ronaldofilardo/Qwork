/**
 * @fileoverview Testes do UploadLaudoButton — desabilitar botão após envio ao bucket.
 *
 * ALTERAÇÕES COBERTAS:
 * - Estado local `uploadedSuccessfully` desabilita o botão imediatamente após o
 *   upload bem-sucedido, sem aguardar o re-fetch do componente pai.
 * - Não depende de `arquivoRemotoKey` ser atualizado pelo pai.
 */

import '@testing-library/jest-dom';
import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import UploadLaudoButton from '@/components/UploadLaudoButton';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Criar um arquivo PDF válido para testes
function makePdfFile(name = 'laudo.pdf'): File {
  const pdfContent = '%PDF-1.4 fake content';
  return new File([pdfContent], name, { type: 'application/pdf' });
}

// Wrapper que seta o arquivo via input de arquivo
async function triggerFileUpload(file: File) {
  const input = document.querySelector('input[type="file"]');
  expect(input).not.toBeNull();
  await act(async () => {
    Object.defineProperty(input, 'files', {
      value: [file],
      configurable: true,
    });
    fireEvent.change(input);
  });
}

// ─── Render helper ────────────────────────────────────────────────────────────

function renderButton(
  overrides: Partial<React.ComponentProps<typeof UploadLaudoButton>> = {}
) {
  const defaults: React.ComponentProps<typeof UploadLaudoButton> = {
    laudoId: 1042,
    loteId: 1042,
    status: 'emitido',
    arquivoRemotoKey: null,
    onUploadSuccess: jest.fn(),
    hasUploadFailed: false,
    ...overrides,
  };
  return render(<UploadLaudoButton {...defaults} />);
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('UploadLaudoButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Visibilidade ──────────────────────────────────────────────────────────

  it('exibe botão "Enviar ao Bucket" quando laudo está emitido e sem chave remota', () => {
    renderButton();
    expect(
      screen.getByRole('button', { name: /Enviar ao Bucket/i })
    ).toBeInTheDocument();
  });

  it('NÃO exibe botão quando arquivoRemotoKey já está preenchido (já sincronizado)', () => {
    renderButton({ arquivoRemotoKey: 'bucket/laudos/1042.pdf' });
    expect(
      screen.queryByRole('button', { name: /Enviar ao Bucket/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Sincronizado com bucket/i)).toBeInTheDocument();
  });

  it('NÃO exibe nada quando status não é emitido/enviado', () => {
    renderButton({ status: 'rascunho' });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('exibe botão "Re-sincronizar" quando hasUploadFailed=true', () => {
    renderButton({ hasUploadFailed: true });
    expect(
      screen.getByRole('button', { name: /Re-sincronizar/i })
    ).toBeInTheDocument();
  });

  // ── Upload bem-sucedido ───────────────────────────────────────────────────

  it('desabilita o botão imediatamente após upload bem-sucedido (sem aguardar re-fetch)', async () => {
    // Simular fetch bem-sucedido
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        arquivo_remoto_key: 'bucket/laudos/1042.pdf',
      }),
    });

    renderButton();
    expect(
      screen.getByRole('button', { name: /Enviar ao Bucket/i })
    ).toBeInTheDocument();

    // Simular upload de arquivo PDF
    await triggerFileUpload(makePdfFile());

    // Botão deve sumir e mostrar "Sincronizado com bucket" imediatamente
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /Enviar ao Bucket/i })
      ).not.toBeInTheDocument();
      expect(screen.getByText(/Sincronizado com bucket/i)).toBeInTheDocument();
    });
  });

  it('chama onUploadSuccess após upload bem-sucedido', async () => {
    const onUploadSuccess = jest.fn();
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        arquivo_remoto_key: 'bucket/laudos/1042.pdf',
      }),
    });

    renderButton({ onUploadSuccess });
    await triggerFileUpload(makePdfFile());

    await waitFor(() => {
      expect(onUploadSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('mantém botão visível após falha de upload (keepscreenButtons)', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Erro interno' }),
    });

    renderButton();
    await triggerFileUpload(makePdfFile());

    await waitFor(() => {
      // Botão deve continuar visível (não foi bem-sucedido)
      expect(
        screen.getByRole('button', { name: /Enviar ao Bucket/i })
      ).toBeInTheDocument();
    });
  });

  // ── Validações client-side ────────────────────────────────────────────────

  it('rejeita arquivo que não é PDF', async () => {
    const { error } = await import('react-hot-toast');
    renderButton();

    const nonPdf = new File(['not pdf'], 'file.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const input = document.querySelector('input[type="file"]');
    await act(async () => {
      Object.defineProperty(input, 'files', {
        value: [nonPdf],
        configurable: true,
      });
      fireEvent.change(input);
    });

    expect(error).toHaveBeenCalledWith('Apenas arquivos PDF são permitidos');
  });

  it('rejeita arquivo PDF maior que 2MB', async () => {
    const { error } = await import('react-hot-toast');
    renderButton();

    // 2MB + 1 byte
    const bigContent = new Uint8Array(2 * 1024 * 1024 + 1).fill(0x25); // '%'
    const bigPdf = new File([bigContent], 'large.pdf', {
      type: 'application/pdf',
    });

    const input = document.querySelector('input[type="file"]');
    await act(async () => {
      Object.defineProperty(input, 'files', {
        value: [bigPdf],
        configurable: true,
      });
      fireEvent.change(input);
    });

    expect(error).toHaveBeenCalledWith(
      'Arquivo excede o tamanho máximo de 2 MB'
    );
  });

  // ── Estado durante upload ─────────────────────────────────────────────────

  it('exibe "Enviando..." durante o upload', async () => {
    // Fetch que nunca resolve (simular lentidão)
    let resolveUpload!: () => void;
    global.fetch = jest.fn().mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveUpload = () =>
          resolve({
            ok: true,
            json: async () => ({ success: true }),
          } as unknown as Response);
      })
    );

    renderButton();
    await triggerFileUpload(makePdfFile());

    // Enquanto upload está em andamento
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent(/Enviando/i);
    });

    // Concluir upload para limpeza
    await act(async () => {
      resolveUpload();
    });
  });
});
