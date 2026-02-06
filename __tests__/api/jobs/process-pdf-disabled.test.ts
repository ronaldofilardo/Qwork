/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST as postProcessPdf } from '../../../app/api/jobs/process-pdf/route';

describe('Cron Process-PDF - Endpoint Desabilitado', () => {
  it('deve retornar 410 quando endpoint de processamento PDF é acessado', async () => {
    const req = new NextRequest('http://localhost:3000/api/jobs/process-pdf', {
      method: 'POST',
    });
    const response = await postProcessPdf(req);

    expect(response.status).toBe(410);
    const data = await response.json();
    expect(data.error).toBe('Endpoint desabilitado');
    expect(data.message).toContain(
      'Processamento de PDFs migrado para emissor local'
    );
  });
});
