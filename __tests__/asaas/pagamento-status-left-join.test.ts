/**
 * Testes: /api/pagamento/status — LEFT JOIN + parâmetro dual (id / pagamento_id)
 *
 * Data: 17/02/2026
 * Contexto: A rota usava INNER JOIN em entidades, retornando 404 para pagamentos
 *           de clínicas (que têm clinica_id, não entidade_id).
 *           Também só aceitava o parâmetro 'id', não 'pagamento_id', quebrando o polling
 *           do CheckoutAsaas.tsx.
 *
 * O que estes testes garantem:
 * 1. Retorna 400 sem nenhum parâmetro
 * 2. Retorna 404 para pagamento inexistente
 * 3. Funciona com parâmetro 'id'
 * 4. Funciona com parâmetro 'pagamento_id' (retrocompatibilidade)
 * 5. Funciona para pagamento de ENTIDADE (entidade_id populado, clinica_id NULL)
 * 6. Funciona para pagamento de CLÍNICA (clinica_id populado, entidade_id NULL)
 * 7. Retorna campo 'status' no root do JSON (para polling verificar)
 * 8. Retorna 'entidade_nome' correta para cada tipo
 * 9. Suporta status 'pago' e 'pendente' corretamente
 *
 * @see app/api/pagamento/status/route.ts
 */

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { GET } from '@/app/api/pagamento/status/route';
import { createTesttomador } from '../helpers/test-data-factory';

// ── Helper ─────────────────────────────────────────────────────────────────

const uid = () => `st_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/pagamento/status');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url);
}

// ── Fixtures ────────────────────────────────────────────────────────────────

describe('/api/pagamento/status — LEFT JOIN + parâmetro dual', () => {
  let entidadeId: number;
  let clinicaId: number;

  beforeAll(async () => {
    entidadeId = await createTesttomador({
      tipo: 'entidade',
      nome: 'Status Test Entidade',
    });
    clinicaId = await createTesttomador({
      tipo: 'clinica',
      nome: 'Status Test Clinica',
    });
  });

  afterAll(async () => {
    await query(`DELETE FROM entidades WHERE id = $1`, [entidadeId]);
    await query(`DELETE FROM clinicas  WHERE id = $1`, [clinicaId]);
  });

  // ── 1. Validação de input ─────────────────────────────────────────────────

  describe('Validação de input', () => {
    it('deve retornar 400 sem nenhum parâmetro', async () => {
      const res = await GET(makeRequest({}));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/obrigatório/i);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const res = await GET(makeRequest({ id: '999999999' }));
      expect(res.status).toBe(404);
    });

    it('deve retornar 404 para pagamento_id inexistente', async () => {
      const res = await GET(makeRequest({ pagamento_id: '999999999' }));
      expect(res.status).toBe(404);
    });
  });

  // ── 2. Parâmetro dual (id / pagamento_id) ─────────────────────────────────

  describe('Suporte a parâmetros: id e pagamento_id', () => {
    let pgId: number;

    beforeAll(async () => {
      const {
        rows: [pg],
      } = await query(
        `INSERT INTO pagamentos (entidade_id, valor, status, metodo, plataforma_nome)
         VALUES ($1, 100, 'pendente', 'pix', 'Asaas') RETURNING id`,
        [entidadeId]
      );
      pgId = pg.id;
    });

    afterAll(async () => {
      await query(`DELETE FROM pagamentos WHERE id = $1`, [pgId]);
    });

    it('deve funcionar com parâmetro ?id=X', async () => {
      const res = await GET(makeRequest({ id: String(pgId) }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.pagamento.id).toBe(pgId);
    });

    it('deve funcionar com parâmetro ?pagamento_id=X (retrocompatibilidade)', async () => {
      const res = await GET(makeRequest({ pagamento_id: String(pgId) }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.pagamento.id).toBe(pgId);
    });

    it('?id tem prioridade sobre ?pagamento_id quando ambos são passados', async () => {
      const res = await GET(
        makeRequest({ id: String(pgId), pagamento_id: '999' })
      );
      expect(res.status).toBe(200);
    });
  });

  // ── 3. LEFT JOIN para ENTIDADE ────────────────────────────────────────────

  describe('Pagamento de Entidade (entidade_id populado, clinica_id NULL)', () => {
    let pgId: number;

    beforeAll(async () => {
      const {
        rows: [pg],
      } = await query(
        `INSERT INTO pagamentos (entidade_id, valor, status, metodo, plataforma_nome)
         VALUES ($1, 150, 'pago', 'credit_card', 'Asaas') RETURNING id`,
        [entidadeId]
      );
      pgId = pg.id;
    });

    afterAll(async () => {
      await query(`DELETE FROM pagamentos WHERE id = $1`, [pgId]);
    });

    it('deve retornar 200 com entidade_nome correta', async () => {
      const res = await GET(makeRequest({ id: String(pgId) }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.pagamento.entidade_nome).toBe('Status Test Entidade');
      expect(body.pagamento.entidade_id).toBe(entidadeId);
      expect(body.pagamento.clinica_id).toBeNull();
    });

    it('deve retornar campo status no root do JSON para polling', async () => {
      const res = await GET(makeRequest({ id: String(pgId) }));
      const body = await res.json();
      // O polling verifica body.status diretamente (não body.pagamento.status)
      expect(body.status).toBe('pago');
    });
  });

  // ── 4. LEFT JOIN para CLÍNICA ──────────────────────────────────────────────

  describe('Pagamento de Clínica (clinica_id populado, entidade_id NULL) — bug anterior: INNER JOIN retornava 404', () => {
    let pgId: number;

    beforeAll(async () => {
      const {
        rows: [pg],
      } = await query(
        `INSERT INTO pagamentos (clinica_id, valor, status, metodo, plataforma_nome)
         VALUES ($1, 200, 'pendente', 'pix', 'Asaas') RETURNING id`,
        [clinicaId]
      );
      pgId = pg.id;
    });

    afterAll(async () => {
      await query(`DELETE FROM pagamentos WHERE id = $1`, [pgId]);
    });

    it('deve retornar 200 (não 404) para pagamento de clínica', async () => {
      const res = await GET(makeRequest({ id: String(pgId) }));
      // Este era o bug: INNER JOIN retornava 0 rows → 404
      expect(res.status).toBe(200);
    });

    it('deve retornar entidade_nome da clínica via COALESCE', async () => {
      const res = await GET(makeRequest({ id: String(pgId) }));
      const body = await res.json();
      expect(body.pagamento.entidade_nome).toBe('Status Test Clinica');
      expect(body.pagamento.clinica_id).toBe(clinicaId);
      expect(body.pagamento.entidade_id).toBeNull();
    });

    it('deve retornar campo status no root para polling de clínica', async () => {
      const res = await GET(makeRequest({ id: String(pgId) }));
      const body = await res.json();
      expect(body.status).toBeDefined();
      expect(body.status).toBe('pendente');
    });

    it('deve funcionar com ?pagamento_id= para clínica também', async () => {
      const res = await GET(makeRequest({ pagamento_id: String(pgId) }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });

  // ── 5. Integração: polling simula detecção de status 'pago' ───────────────

  describe('Integração: polling detecta mudança de status', () => {
    let pgId: number;

    beforeAll(async () => {
      const {
        rows: [pg],
      } = await query(
        `INSERT INTO pagamentos (entidade_id, valor, status, metodo, plataforma_nome)
         VALUES ($1, 300, 'pendente', 'pix', 'Asaas') RETURNING id`,
        [entidadeId]
      );
      pgId = pg.id;
    });

    afterAll(async () => {
      await query(`DELETE FROM pagamentos WHERE id = $1`, [pgId]);
    });

    it('deve retornar status=pendente antes do pagamento', async () => {
      const res = await GET(makeRequest({ pagamento_id: String(pgId) }));
      const body = await res.json();
      expect(body.status).toBe('pendente');
    });

    it('deve retornar status=pago após pagamento confirmado', async () => {
      // Simular confirmação (como faria /sincronizar)
      await query(`UPDATE pagamentos SET status = 'pago' WHERE id = $1`, [
        pgId,
      ]);

      const res = await GET(makeRequest({ pagamento_id: String(pgId) }));
      const body = await res.json();
      expect(body.status).toBe('pago');
    });
  });
});
