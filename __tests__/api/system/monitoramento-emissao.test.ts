/**
 * Testes - Endpoint de Monitoramento de Emissão Automática
 */

import { GET } from '@/app/api/system/monitoramento-emissao/route';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/session');
jest.mock('@/lib/db');

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('API /api/system/monitoramento-emissao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Autenticação e Autorização', () => {
    it('deve permitir acesso para admin', async () => {
      mockRequireRole.mockResolvedValueOnce({
        cpf: '12345678901',
        perfil: 'admin',
      });
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const response = await GET({} as Request);

      expect(response.status).toBe(200);
    });

    it('deve permitir acesso para emissor', async () => {
      mockRequireRole.mockResolvedValueOnce({
        cpf: '12345678901',
        perfil: 'emissor',
      });
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const response = await GET({} as Request);

      expect(response.status).toBe(200);
    });

    it('deve negar acesso para outros perfis', async () => {
      mockRequireRole.mockResolvedValueOnce(null);

      const response = await GET({} as Request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Acesso negado');
    });
  });

  describe('Métricas Gerais', () => {
    it('deve retornar métricas de emissão das últimas 24h', async () => {
      mockRequireRole.mockResolvedValueOnce({ cpf: '123', perfil: 'admin' });

      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              emissoes_24h: 10,
              envios_24h: 8,
              cancelamentos_auto_24h: 2,
              pendentes_emissao: 3,
              pendentes_envio: 2,
              latencia_media_emissao_seg: 45,
              latencia_media_envio_seg: 610,
            },
          ],
          rowCount: 1,
        })
        .mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const response = await GET({} as Request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.metricas_gerais.emissoes_24h).toBe(10);
      expect(data.metricas_gerais.latencia_media_emissao_seg).toBeLessThan(60); // Menos de 1 min
      expect(data.metricas_gerais.latencia_media_envio_seg).toBeLessThan(700); // Menos de 12 min
    });
  });

  describe('Percentis de Latência', () => {
    it('deve retornar P50, P95 e P99 de latências', async () => {
      mockRequireRole.mockResolvedValueOnce({ cpf: '123', perfil: 'admin' });

      // Ordem das queries na API:
      // 1. metricasGerais, 2. alertasCriticos, 3. lotesPendentesEmissao, 4. lotesPendentesEnvio
      // 5. historicoEmissoes, 6. errosRecentes, 7. emissores, 8. percentisLatencia
      mockQuery
        .mockResolvedValueOnce({ rows: [{}], rowCount: 1 }) // metricasGerais
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // alertasCriticos
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // lotesPendentesEmissao
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // lotesPendentesEnvio
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // historicoEmissoes
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // errosRecentes
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // emissores
        .mockResolvedValueOnce({
          rows: [
            {
              p50_emissao: 30,
              p95_emissao: 90,
              p99_emissao: 120,
              p50_envio: 600,
              p95_envio: 650,
              p99_envio: 700,
            },
          ],
          rowCount: 1,
        }); // percentisLatencia

      const response = await GET({} as Request);
      const data = await response.json();

      expect(data.percentis_latencia.p50_emissao).toBe(30);
      expect(data.percentis_latencia.p95_emissao).toBe(90);
      expect(data.percentis_latencia.p99_emissao).toBe(120);
      expect(data.percentis_latencia.p50_envio).toBeCloseTo(600, 0);
    });
  });

  describe('Alertas Críticos', () => {
    it('deve listar lotes com problemas críticos', async () => {
      mockRequireRole.mockResolvedValueOnce({ cpf: '123', perfil: 'admin' });

      // Ordem: metricasGerais → alertasCriticos → lotesPendentesEmissao → ...
      mockQuery
        .mockResolvedValueOnce({ rows: [{}], rowCount: 1 }) // metricasGerais
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              codigo: 'LOTE-001',
              tipo_alerta:
                'CRITICO: Lote concluído há mais de 5min sem emissão',
              idade_conclusao_segundos: 400,
            },
            {
              id: 2,
              codigo: 'LOTE-002',
              tipo_alerta: 'CRITICO: Lote emitido há mais de 5min sem envio',
              idade_conclusao_segundos: 350,
            },
          ],
          rowCount: 2,
        }) // alertasCriticos
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // lotesPendentesEmissao
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // lotesPendentesEnvio
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // historicoEmissoes
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // errosRecentes
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // emissores
        .mockResolvedValueOnce({ rows: [{}], rowCount: 1 }); // percentisLatencia

      const response = await GET({} as Request);
      const data = await response.json();

      expect(data.alertas_criticos).toHaveLength(2);
      expect(data.alertas_criticos[0].tipo_alerta).toContain('CRITICO');
    });
  });

  describe('Lotes Pendentes', () => {
    it('deve listar lotes pendentes de emissão', async () => {
      mockRequireRole.mockResolvedValueOnce({ cpf: '123', perfil: 'admin' });

      mockQuery
        .mockResolvedValueOnce({ rows: [{}], rowCount: 1 }) // metricasGerais
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // alertasCriticos
        .mockResolvedValueOnce({
          rows: [
            { id: 1, codigo: 'LOTE-001', idade_segundos: 120 },
            { id: 2, codigo: 'LOTE-002', idade_segundos: 90 },
          ],
          rowCount: 2,
        }) // lotesPendentesEmissao
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // lotesPendentesEnvio
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // historicoEmissoes
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // errosRecentes
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // emissores
        .mockResolvedValueOnce({ rows: [{}], rowCount: 1 }); // percentisLatencia

      const response = await GET({} as Request);
      const data = await response.json();

      expect(data.lotes_pendentes_emissao).toHaveLength(2);
    });

    it('deve listar lotes pendentes de envio', async () => {
      mockRequireRole.mockResolvedValueOnce({ cpf: '123', perfil: 'admin' });

      mockQuery
        .mockResolvedValueOnce({ rows: [{}], rowCount: 1 }) // metricasGerais
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // alertasCriticos
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // lotesPendentesEmissao
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              codigo: 'LOTE-001',
              idade_emissao_segundos: 300,
              atraso_envio_segundos: -300, // Ainda não venceu
            },
          ],
          rowCount: 1,
        }) // lotesPendentesEnvio
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // historicoEmissoes
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // errosRecentes
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // emissores
        .mockResolvedValueOnce({ rows: [{}], rowCount: 1 }); // percentisLatencia

      const response = await GET({} as Request);
      const data = await response.json();

      expect(data.lotes_pendentes_envio).toHaveLength(1);
    });
  });

  describe('Histórico e Erros', () => {
    it('deve retornar histórico de emissões recentes', async () => {
      mockRequireRole.mockResolvedValueOnce({ cpf: '123', perfil: 'admin' });

      mockQuery
        .mockResolvedValueOnce({ rows: [{}], rowCount: 1 }) // metricasGerais
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // alertasCriticos
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // lotesPendentesEmissao
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // lotesPendentesEnvio
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              codigo: 'LOTE-001',
              emitido_em: new Date(),
              enviado_em: new Date(),
              latencia_emissao_seg: 45,
              latencia_envio_seg: 605,
            },
          ],
          rowCount: 1,
        }) // historicoEmissoes
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // errosRecentes
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // emissores
        .mockResolvedValueOnce({ rows: [{}], rowCount: 1 }); // percentisLatencia

      const response = await GET({} as Request);
      const data = await response.json();

      expect(data.historico_emissoes).toBeDefined();
      expect(Array.isArray(data.historico_emissoes)).toBe(true);
    });

    it('deve retornar erros recentes', async () => {
      mockRequireRole.mockResolvedValueOnce({ cpf: '123', perfil: 'admin' });

      mockQuery
        .mockResolvedValueOnce({ rows: [{}], rowCount: 1 }) // metricasGerais
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // alertasCriticos
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // lotesPendentesEmissao
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // lotesPendentesEnvio
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // historicoEmissoes
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              lote_id: 1,
              acao: 'emissao_automatica_erro',
              status: 'erro',
              observacoes: 'Erro ao gerar PDF',
            },
          ],
          rowCount: 1,
        }) // errosRecentes
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // emissores
        .mockResolvedValueOnce({ rows: [{}], rowCount: 1 }); // percentisLatencia

      const response = await GET({} as Request);
      const data = await response.json();

      expect(data.erros_recentes).toBeDefined();
      expect(Array.isArray(data.erros_recentes)).toBe(true);
    });
  });

  describe('Status do Emissor', () => {
    it('deve retornar OK com 1 emissor ativo', async () => {
      mockRequireRole.mockResolvedValueOnce({ cpf: '123', perfil: 'admin' });

      mockQuery
        .mockResolvedValueOnce({ rows: [{}], rowCount: 1 }) // metricasGerais
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // alertasCriticos
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // lotesPendentesEmissao
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // lotesPendentesEnvio
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // historicoEmissoes
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // errosRecentes
        .mockResolvedValueOnce({
          rows: [
            {
              cpf: '12345678901',
              nome: 'Emissor Teste',
              email: 'emissor@test.com',
            },
          ],
          rowCount: 1,
        }) // emissores
        .mockResolvedValueOnce({ rows: [{}], rowCount: 1 }) // percentisLatencia
        .mockResolvedValue({ rows: [], rowCount: 0 }); // fallback

      const response = await GET({} as Request);
      const data = await response.json();

      expect(data.emissor_status.ok).toBe(true);
      expect(data.emissor_status.total).toBe(1);
      expect(data.emissor_status.erro).toBeNull();
    });

    it('deve retornar erro se não houver emissor', async () => {
      mockRequireRole.mockResolvedValueOnce({ cpf: '123', perfil: 'admin' });

      mockQuery
        .mockResolvedValueOnce({ rows: [{}], rowCount: 1 }) // metricasGerais
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // alertasCriticos
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // lotesPendentesEmissao
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // lotesPendentesEnvio
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // historicoEmissoes
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // errosRecentes
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // emissores (vazio)
        .mockResolvedValueOnce({ rows: [{}], rowCount: 1 }) // percentisLatencia
        .mockResolvedValue({ rows: [], rowCount: 0 }); // fallback

      const response = await GET({} as Request);
      const data = await response.json();

      expect(data.emissor_status.ok).toBe(false);
      expect(data.emissor_status.erro).toBe('Nenhum emissor ativo no sistema');
    });
  });
});
