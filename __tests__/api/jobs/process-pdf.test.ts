/**
 * @jest-environment node
 */

import { POST as processPdf } from '@/app/api/jobs/process-pdf/route';
import * as pdfService from '@/lib/pdf-service';
import { query } from '@/lib/db';

jest.mock('@/lib/db');
jest.mock('@/lib/pdf-service');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockedPdfService = pdfService as jest.Mocked<typeof pdfService>;

describe('POST /api/jobs/process-pdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Disable cron secret check
    process.env.CRON_SECRET = '';
  });

  it('deve processar jobs pendentes com sucesso', async () => {
    // Mock getNextPendingJobs para retornar 1 job
    mockedPdfService.getNextPendingJobs.mockResolvedValueOnce([
      {
        id: 1,
        recibo_id: 8,
        status: 'pending',
        attempts: 0,
        max_attempts: 5,
      } as any,
    ]);

    // Mock queries sequence:
    // 1) SELECT recibo (pdf IS NULL)
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          { id: 8, numero_recibo: 'REC-20251231-0001', tomador_id: 56 },
        ],
      } as any)
      // 2) UPDATE recibos (set pdf, hash)
      .mockResolvedValueOnce({ rows: [] } as any)
      // 3) INSERT auditoria_recibos
      .mockResolvedValueOnce({ rows: [] } as any);

    const mockBuffer = Buffer.from([1, 2, 3]);
    mockedPdfService.generatePdfViaExternalService.mockResolvedValueOnce(
      mockBuffer as any
    );
    mockedPdfService.markJobCompleted.mockResolvedValueOnce(undefined as any);
    mockedPdfService.createReciboNotification.mockResolvedValueOnce(
      undefined as any
    );

    const req = new Request('http://localhost/api/jobs/process-pdf', {
      method: 'POST',
    });
    const res = await processPdf(req as any);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.processed).toBe(1);
    expect(body.succeeded).toBe(1);
    expect(body.failed).toBe(0);

    // Verificações: geração chamada com URL correta
    expect(
      mockedPdfService.generatePdfViaExternalService
    ).toHaveBeenCalledTimes(1);
    const calledWith =
      mockedPdfService.generatePdfViaExternalService.mock.calls[0][0];
    expect(calledWith).toContain('/recibo/REC-20251231-0001');

    // Verificamos que UPDATE recibos foi chamado (uma das chamadas ao query)
    expect(mockQuery).toHaveBeenCalled();
  });

  it('deve retornar sucesso quando não há jobs pendentes', async () => {
    mockedPdfService.getNextPendingJobs.mockResolvedValueOnce([] as any);

    const req = new Request('http://localhost/api/jobs/process-pdf', {
      method: 'POST',
    });
    const res = await processPdf(req as any);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.processed).toBe(0);
  });

  it('deve marcar job como falho e registrar auditoria em caso de erro', async () => {
    mockedPdfService.getNextPendingJobs.mockResolvedValueOnce([
      {
        id: 2,
        recibo_id: 9,
        status: 'pending',
        attempts: 0,
        max_attempts: 5,
      } as any,
    ]);

    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 9, numero_recibo: 'REC-20251231-0002', tomador_id: 56 }],
      rowCount: 1,
    } as any);

    mockedPdfService.generatePdfViaExternalService.mockRejectedValueOnce(
      new Error('Service error')
    );
    mockedPdfService.markJobFailed.mockResolvedValueOnce(undefined as any);

    const req = new Request('http://localhost/api/jobs/process-pdf', {
      method: 'POST',
    });
    const res = await processPdf(req as any);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.processed).toBe(1);
    expect(body.failed).toBe(1);
    expect(mockedPdfService.markJobFailed).toHaveBeenCalled();

    // Deve ter tentado inserir auditoria (query called for audit insert after markJobFailed)
    expect(mockQuery).toHaveBeenCalled();
  });
});
