/**
 * @fileoverview Testes do endpoint POST /api/representante/aceitar-termos
 *
 * Cobre:
 *   - Validação de corpo (tipo inválido → 400)
 *   - Auth: sessão ausente → 401
 *   - Mapeamento correto tipo → coluna no banco
 *   - Idempotência: re-aceite não causa erro
 *   - Resposta de sucesso: { ok: true }
 */

jest.mock('@/lib/db');
jest.mock('@/lib/session-representante');

import { describe, it, expect, beforeEach } from '@jest/globals';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import { POST } from '@/app/api/representante/aceitar-termos/route';
import { NextRequest } from 'next/server';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRepresentante = requireRepresentante as jest.MockedFunction<
  typeof requireRepresentante
>;
const mockRepAuthErrorResponse = repAuthErrorResponse as jest.MockedFunction<
  typeof repAuthErrorResponse
>;

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/representante/aceitar-termos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/representante/aceitar-termos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRepresentante.mockReturnValue({
      representante_id: 7,
      email: 'rep@test.com',
      status: 'aguardando_senha',
      nome: 'Rep Teste',
      codigo: 'AB12-CD34',
      tipo_pessoa: 'pf',
      criado_em_ms: Date.now(),
    });
    mockRepAuthErrorResponse.mockReturnValue({
      status: 500,
      body: { error: 'Erro.' },
    });
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as ReturnType<
      typeof query
    >);
  });

  describe('Validação de entrada', () => {
    it('deve retornar 400 para tipo inválido', async () => {
      const res = await POST(makeRequest({ tipo: 'tipo_invalido' }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/inválido/i);
    });

    it('deve retornar 400 para body vazio', async () => {
      const res = await POST(makeRequest({}));
      expect(res.status).toBe(400);
    });

    it('deve retornar 400 para body sem campo tipo', async () => {
      const res = await POST(makeRequest({ outro_campo: 'x' }));
      expect(res.status).toBe(400);
    });
  });

  describe('Autenticação', () => {
    it('deve retornar 401 quando sessão não existe', async () => {
      mockRequireRepresentante.mockImplementation(() => {
        throw new Error('Não autenticado');
      });
      mockRepAuthErrorResponse.mockReturnValue({
        body: { error: 'Não autenticado' },
        status: 401,
      });

      const res = await POST(makeRequest({ tipo: 'termos_uso' }));
      expect(res.status).toBe(401);
    });
  });

  describe('Mapeamento tipo → coluna', () => {
    it('contrato_nao_clt deve atualizar aceite_disclaimer_nv', async () => {
      await POST(makeRequest({ tipo: 'contrato_nao_clt' }));

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('aceite_disclaimer_nv'),
        [7]
      );
    });

    it('politica_privacidade deve atualizar aceite_politica_privacidade', async () => {
      await POST(makeRequest({ tipo: 'politica_privacidade' }));

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('aceite_politica_privacidade'),
        [7]
      );
    });

    it('termos_uso deve atualizar aceite_termos', async () => {
      await POST(makeRequest({ tipo: 'termos_uso' }));

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('aceite_termos'),
        [7]
      );
    });
  });

  describe('Comportamento correto', () => {
    it('deve retornar { ok: true } em sucesso', async () => {
      const res = await POST(makeRequest({ tipo: 'politica_privacidade' }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
    });

    it('deve usar UPDATEidempotente (WHERE campo = FALSE)', async () => {
      await POST(makeRequest({ tipo: 'politica_privacidade' }));

      const callArg = mockQuery.mock.calls[0][0];
      expect(callArg).toMatch(
        /WHERE id = \$1 AND aceite_politica_privacidade = FALSE/
      );
    });

    it('deve usar o representante_id da sessão no UPDATE', async () => {
      mockRequireRepresentante.mockReturnValue({
        representante_id: 42,
        email: 'outro@test.com',
        status: 'aguardando_senha',
        nome: 'Outro Rep',
        codigo: 'XY99-ZW00',
        tipo_pessoa: 'pf',
        criado_em_ms: Date.now(),
      });

      await POST(makeRequest({ tipo: 'termos_uso' }));

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [42]);
    });

    it('também atualiza representantes_senhas com primeira_senha_alterada = TRUE', async () => {
      await POST(makeRequest({ tipo: 'politica_privacidade' }));

      // primeira chamada: UPDATE representantes
      // segunda chamada: UPDATE representantes_senhas
      expect(mockQuery).toHaveBeenCalledTimes(2);
      const senhasCall = mockQuery.mock.calls[1];
      expect(senhasCall[0]).toMatch(/representantes_senhas/);
      expect(senhasCall[0]).toMatch(/primeira_senha_alterada\s*=\s*TRUE/i);
      expect(senhasCall[1]).toEqual([7]);
    });
  });
});
