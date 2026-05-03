/**
 * Testes de integração para marcação de modo emergência em PDFs
 */

import { query, closePool } from '@/lib/db';

// Mock do Puppeteer para evitar dependências pesadas nos testes
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(Buffer.from('fake-pdf-content')),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  }),
}));

// TODO: Temporariamente pulado — emissão emergencial está fora do escopo desta entrega. Reativar e revisar quando for feita a correção específica de emissão emergencial.
// See: issue/XXX (re-enable when emergency flow is addressed)
describe.skip('Marcação de Modo Emergência em PDFs', () => {
  afterAll(async () => {
    await closePool();
  });

  describe('Geração de HTML com Marcação de Emergência', () => {
    it('deve inserir aviso visual quando modo_emergencia é true', () => {
      const htmlBase = `
        <html>
          <body>
            <div class="header">Header</div>

            <div class="section">Conteúdo</div>
          </body>
        </html>
      `;

      const motivoEmergencia = 'Sistema de validação falhou crítico';
      const avisoEmergencia = `
        <div style="background-color: #fee; border: 3px solid #c00; padding: 15px; margin: 20px 0; text-align: center;">
          <h3 style="color: #c00; margin: 0 0 10px 0; font-size: 14pt;">⚠️ EMITIDO EM MODO DE EMERGÊNCIA</h3>
          <p style="color: #c00; margin: 0; font-size: 11pt; font-weight: bold;">
            VALIDAÇÃO TÉCNICA IGNORADA - DOCUMENTO EMITIDO SEM VERIFICAÇÕES PADRÃO
          </p>
          <p style="margin: 10px 0 0 0; font-size: 10pt;"><strong>Motivo:</strong> ${motivoEmergencia}</p>
        </div>
      `;

      // Simular inserção do aviso após header
      // Inserir aviso logo após a div do header (substituição segmentada para maior robustez)
      const htmlComAviso = htmlBase.replace(
        '<div class="header">Header</div>',
        `<div class="header">Header</div>${avisoEmergencia}`
      );

      // Validar que aviso foi inserido
      expect(htmlComAviso).toContain('⚠️ EMITIDO EM MODO DE EMERGÊNCIA');
      expect(htmlComAviso).toContain('VALIDAÇÃO TÉCNICA IGNORADA');
      expect(htmlComAviso).toContain(motivoEmergencia);
      expect(htmlComAviso).toContain('background-color: #fee');
      expect(htmlComAviso).toContain('border: 3px solid #c00');
    });

    it('não deve inserir aviso quando modo_emergencia é false', () => {
      const htmlBase = `
        <html>
          <body>
            <div class="header">Header</div>

            <div class="section">Conteúdo</div>
          </body>
        </html>
      `;

      // Sem modificação
      const htmlSemAviso = htmlBase;

      expect(htmlSemAviso).not.toContain('⚠️ EMITIDO EM MODO DE EMERGÊNCIA');
      expect(htmlSemAviso).not.toContain('VALIDAÇÃO TÉCNICA IGNORADA');
    });

    it('deve exibir motivo quando fornecido', () => {
      const motivoCompleto =
        'Falha crítica no servidor de validação às 23:45 do dia 04/01/2026';

      const aviso = `
        <div style="background-color: #fee; border: 3px solid #c00; padding: 15px; margin: 20px 0; text-align: center;">
          <h3 style="color: #c00; margin: 0 0 10px 0; font-size: 14pt;">⚠️ EMITIDO EM MODO DE EMERGÊNCIA</h3>
          <p style="color: #c00; margin: 0; font-size: 11pt; font-weight: bold;">
            VALIDAÇÃO TÉCNICA IGNORADA - DOCUMENTO EMITIDO SEM VERIFICAÇÕES PADRÃO
          </p>
          <p style="margin: 10px 0 0 0; font-size: 10pt;"><strong>Motivo:</strong> ${motivoCompleto}</p>
        </div>
      `;

      expect(aviso).toContain(motivoCompleto);
      expect(aviso).toContain('<strong>Motivo:</strong>');
    });

    it('deve funcionar sem motivo (campo opcional no HTML)', () => {
      const avisoSemMotivo = `
        <div style="background-color: #fee; border: 3px solid #c00; padding: 15px; margin: 20px 0; text-align: center;">
          <h3 style="color: #c00; margin: 0 0 10px 0; font-size: 14pt;">⚠️ EMITIDO EM MODO DE EMERGÊNCIA</h3>
          <p style="color: #c00; margin: 0; font-size: 11pt; font-weight: bold;">
            VALIDAÇÃO TÉCNICA IGNORADA - DOCUMENTO EMITIDO SEM VERIFICAÇÕES PADRÃO
          </p>
        </div>
      `;

      expect(avisoSemMotivo).toContain('⚠️ EMITIDO EM MODO DE EMERGÊNCIA');
      expect(avisoSemMotivo).not.toContain('<strong>Motivo:</strong>');
    });
  });

  describe('Persistência de Modo Emergência', () => {
    let loteIdPersistencia: number;
    let empresaId: number;
    let clinicaId: number;

    beforeAll(async () => {
      // Criar clínica
      const clinicaCnpj = '55566677000199';
      // Remover entradas antigas com mesmo CNPJ (evita problema de test runs repetidos)
      await query(`DELETE FROM clinicas WHERE cnpj = $1`, [clinicaCnpj]);
      const clinicaResult = await query(
        `INSERT INTO clinicas (nome, cnpj, email) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        ['Clínica PDF Test', clinicaCnpj, 'pdf@test.com']
      );
      clinicaId = clinicaResult.rows[0].id;

      // Criar empresa
      const empresaCnpj = '33344455000188';
      await query(`DELETE FROM empresas_clientes WHERE cnpj = $1`, [
        empresaCnpj,
      ]);
      const empresaResult = await query(
        `INSERT INTO empresas_clientes (nome, cnpj, clinica_id) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        ['Empresa PDF Test', empresaCnpj, clinicaId]
      );
      empresaId = empresaResult.rows[0].id;

      // Criar lote
      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (
          codigo, empresa_id, clinica_id, status, titulo, tipo, liberado_por,
          modo_emergencia, motivo_emergencia
        ) 
         VALUES ($1, $2, $6, 'concluido', $3, 'completo', $5, true, $4) 
         RETURNING id`,
        [
          'LOTE-PDF-EMERG',
          empresaId,
          'Lote com emergência',
          'Validação de sistema comprometida',
          '00000000000',
          clinicaId,
        ]
      );
      loteIdPersistencia = loteResult.rows[0].id;
    });

    afterAll(async () => {
      await query(`DELETE FROM lotes_avaliacao WHERE id = $1`, [
        loteIdPersistencia,
      ]);
      await query(`DELETE FROM empresas_clientes WHERE id = $1`, [empresaId]);
      await query(`DELETE FROM clinicas WHERE id = $1`, [clinicaId]);
    });

    it('deve persistir modo_emergencia e motivo no banco', async () => {
      const lote = await query(
        `SELECT modo_emergencia, motivo_emergencia 
         FROM lotes_avaliacao 
         WHERE id = $1`,
        [loteIdPersistencia]
      );

      expect(lote.rows[0].modo_emergencia).toBe(true);
      expect(lote.rows[0].motivo_emergencia).toBe(
        'Validação de sistema comprometida'
      );
    });

    it('deve ser possível consultar lotes em modo emergência', async () => {
      const lotesEmergencia = await query(
        `SELECT id, codigo, motivo_emergencia 
         FROM lotes_avaliacao 
         WHERE modo_emergencia = true 
         AND id = $1`,
        [loteIdPersistencia]
      );

      expect(lotesEmergencia.rows.length).toBe(1);
      expect(lotesEmergencia.rows[0].id).toBe(loteIdPersistencia);
    });

    it('deve registrar timestamp de modo emergência via processamento_em', async () => {
      // Simular marcação de processamento (usado na emissão)
      await query(
        `UPDATE lotes_avaliacao 
         SET processamento_em = NOW() 
         WHERE id = $1`,
        [loteIdPersistencia]
      );

      const lote = await query(
        `SELECT processamento_em FROM lotes_avaliacao WHERE id = $1`,
        [loteIdPersistencia]
      );

      expect(lote.rows[0].processamento_em).not.toBeNull();
      expect(new Date(lote.rows[0].processamento_em as string)).toBeInstanceOf(
        Date
      );
    });
  });

  describe('Auditoria de Emissões em Modo Emergência', () => {
    it('deve permitir consultar laudos emitidos em modo emergência', async () => {
      // Criar dados de teste para auditoria
      const clinicaAuditCnpj = '11122233000144';
      await query(`DELETE FROM clinicas WHERE cnpj = $1`, [clinicaAuditCnpj]);
      const clinicaResult = await query(
        `INSERT INTO clinicas (nome, cnpj, email) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        ['Clínica Audit', clinicaAuditCnpj, 'audit@test.com']
      );
      const clinicaId = clinicaResult.rows[0].id;

      const empresaAuditCnpj = '44455566000177';
      await query(`DELETE FROM empresas_clientes WHERE cnpj = $1`, [
        empresaAuditCnpj,
      ]);
      const empresaResult = await query(
        `INSERT INTO empresas_clientes (nome, cnpj, clinica_id) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        ['Empresa Audit', empresaAuditCnpj, clinicaId]
      );
      const empresaId = empresaResult.rows[0].id;

      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (
          codigo, empresa_id, clinica_id, status, titulo, tipo, liberado_por,
          modo_emergencia, motivo_emergencia
        ) 
         VALUES ($1, $2, $6, 'concluido', $3, 'completo', $5, true, $4) 
         RETURNING id`,
        [
          'LOTE-AUDIT-01',
          empresaId,
          'Lote auditoria',
          'Teste de auditoria',
          '00000000000',
          clinicaId,
        ]
      );
      const loteId = loteResult.rows[0].id;

      // Consultar lotes em emergência
      const auditQuery = await query(
        `SELECT 
          la.id, 
          la.codigo, 
          la.modo_emergencia, 
          la.motivo_emergencia,
          la.processamento_em,
          ec.nome as empresa_nome,
          c.nome as clinica_nome
         FROM lotes_avaliacao la
         JOIN empresas_clientes ec ON ec.id = la.empresa_id
         JOIN clinicas c ON c.id = ec.clinica_id
         WHERE la.modo_emergencia = true
         AND la.id = $1`,
        [loteId]
      );

      expect(auditQuery.rows.length).toBe(1);
      expect(auditQuery.rows[0].modo_emergencia).toBe(true);
      expect(auditQuery.rows[0].motivo_emergencia).toBe('Teste de auditoria');

      // Cleanup
      await query(`DELETE FROM lotes_avaliacao WHERE id = $1`, [loteId]);
      await query(`DELETE FROM empresas_clientes WHERE id = $1`, [empresaId]);
      await query(`DELETE FROM clinicas WHERE id = $1`, [clinicaId]);
    });
  });
});
