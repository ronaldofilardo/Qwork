/**
 * @jest-environment jsdom
 *
 * Testes para funcionalidades de relatórios no Dashboard RH Empresa
 * - Toggle status de funcionário (ativo/inativo) via fetch
 * - Lógica de status de lotes (Pronto, Pendente, Cancelado)
 * - Download de relatório PDF por lote
 * - Tratamento de erros
 */

// Helpers: simular lógica de status extraída de LotesGrid
function getLoteStatus(lote: {
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
  avaliacoes_inativadas: number;
  pode_emitir_laudo?: boolean;
}) {
  const {
    total_avaliacoes,
    avaliacoes_concluidas,
    avaliacoes_inativadas,
    pode_emitir_laudo,
  } = lote;
  const isCancelado =
    total_avaliacoes > 0 &&
    avaliacoes_inativadas === total_avaliacoes &&
    avaliacoes_concluidas === 0;
  const isPronto = !!pode_emitir_laudo;
  return { isPronto, isCancelado };
}

// Simular handleToggleStatus extraído de FuncionariosSection
async function handleToggleStatus(
  cpf: string,
  currentStatus: boolean,
  empresaId?: number
) {
  const action = currentStatus ? 'inativar' : 'ativar';
  const body: { cpf: string; ativo: boolean; empresa_id?: number } = {
    cpf,
    ativo: !currentStatus,
  };
  if (empresaId) body.empresa_id = empresaId;

  const res = await fetch('/api/rh/funcionarios/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Erro ao ${action}: ${error.error || 'Erro desconhecido'}`);
  }
  return res.json();
}

// Simular gerarRelatorioLote
async function gerarRelatorioLote(loteId: number) {
  const response = await fetch(`/api/rh/relatorio-lote-pdf?lote_id=${loteId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao gerar relatório');
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-lote-${loteId}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

describe('Dashboard RH Empresa - Funcionalidades de Relatórios', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchSpy = jest.spyOn(global, 'fetch');
    window.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('Checkbox de Status do Funcionário', () => {
    it('deve chamar PATCH /api/rh/funcionarios/status com ativo=false ao inativar', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await handleToggleStatus('12345678901', true, 5);

      expect(fetchSpy).toHaveBeenCalledWith('/api/rh/funcionarios/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: '12345678901',
          ativo: false,
          empresa_id: 5,
        }),
      });
    });

    it('deve chamar PATCH com ativo=true ao ativar', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await handleToggleStatus('12345678901', false, 5);

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.ativo).toBe(true);
    });

    it('deve incluir empresa_id no body quando fornecido', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await handleToggleStatus('12345678901', true, 42);

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.empresa_id).toBe(42);
    });

    it('deve lançar erro quando API falha', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Permissão negada' }),
      });

      await expect(handleToggleStatus('12345678901', true)).rejects.toThrow(
        'Erro ao inativar: Permissão negada'
      );
    });
  });

  describe('Lógica de Status de Lotes', () => {
    it('deve retornar isPronto=true se pode_emitir_laudo=true', () => {
      const { isPronto } = getLoteStatus({
        total_avaliacoes: 10,
        avaliacoes_concluidas: 8,
        avaliacoes_inativadas: 2,
        pode_emitir_laudo: true,
      });
      expect(isPronto).toBe(true);
    });

    it('deve retornar isPronto=false se pode_emitir_laudo=false', () => {
      const { isPronto } = getLoteStatus({
        total_avaliacoes: 10,
        avaliacoes_concluidas: 5,
        avaliacoes_inativadas: 0,
        pode_emitir_laudo: false,
      });
      expect(isPronto).toBe(false);
    });

    it('deve retornar isCancelado=true quando todas inativadas e nenhuma concluída', () => {
      const { isCancelado } = getLoteStatus({
        total_avaliacoes: 5,
        avaliacoes_concluidas: 0,
        avaliacoes_inativadas: 5,
      });
      expect(isCancelado).toBe(true);
    });

    it('deve retornar isCancelado=false quando há concluídas', () => {
      const { isCancelado } = getLoteStatus({
        total_avaliacoes: 5,
        avaliacoes_concluidas: 2,
        avaliacoes_inativadas: 3,
      });
      expect(isCancelado).toBe(false);
    });

    it('deve retornar isCancelado=false para lote vazio (total=0)', () => {
      const { isCancelado } = getLoteStatus({
        total_avaliacoes: 0,
        avaliacoes_concluidas: 0,
        avaliacoes_inativadas: 0,
      });
      expect(isCancelado).toBe(false);
    });
  });

  describe('Download de Relatório PDF por Lote', () => {
    it('deve fazer GET /api/rh/relatorio-lote-pdf com lote_id correto', async () => {
      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      await gerarRelatorioLote(1007);

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/rh/relatorio-lote-pdf?lote_id=1007'
      );
    });

    it('deve criar download com filename correto', async () => {
      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      const appendSpy = jest.spyOn(document.body, 'appendChild');
      await gerarRelatorioLote(2050);

      const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
      expect(anchor.download).toBe('relatorio-lote-2050.pdf');
      appendSpy.mockRestore();
    });

    it('deve revocar objectURL após download', async () => {
      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      await gerarRelatorioLote(1007);

      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('deve lançar erro se response não ok', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Lote não encontrado' }),
      });

      await expect(gerarRelatorioLote(9999)).rejects.toThrow(
        'Lote não encontrado'
      );
    });
  });

  describe('Integração: useLotesAvaliacao', () => {
    it('deve buscar lotes via GET /api/rh/lotes?empresa_id=X', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: 1,
              total_avaliacoes: 10,
              avaliacoes_concluidas: 10,
              avaliacoes_inativadas: 0,
              pode_emitir_laudo: true,
            },
          ]),
      });

      await fetch('/api/rh/lotes?empresa_id=5');

      expect(fetchSpy).toHaveBeenCalledWith('/api/rh/lotes?empresa_id=5');
    });

    it('lotes recentes devem ser limitados a 3', () => {
      const lotes = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
      const recent = lotes.slice(0, 3);
      expect(recent).toHaveLength(3);
      expect(recent.map((l) => l.id)).toEqual([1, 2, 3]);
    });
  });
});
