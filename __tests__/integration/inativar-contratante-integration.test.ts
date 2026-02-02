/**
 * @fileoverview Teste de integração para inativação de avaliação por contratante
 * @description Valida fluxo completo de inativação de avaliação incluindo:
 * - Criação de contratante, funcionário, lote e avaliação
 * - Inativação via API com autenticação gestor_entidade
 * - Atualização de status sem violar constraints
 */

import type { Session } from '@/types/auth';
import type { Response } from '@/types/api';
import { POST } from '@/app/api/avaliacoes/inativar/route';
import { query } from '@/lib/db';
import * as sessionMod from '@/lib/session';

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn() as jest.MockedFunction<
    typeof import('@/lib/session').requireAuth
  >,
}));

const mockRequireAuth = sessionMod.requireAuth as jest.MockedFunction<
  typeof sessionMod.requireAuth
>;

/**
 * @test Suite de integração para inativação de avaliação
 * @description Testa fluxo completo desde criação até inativação
 */
describe('Inativar avaliação - integração (contratante)', () => {
  let contratanteId: number;
  let funcionarioCpf: string;
  let loteId: number;
  let avaliacaoId: number;

  beforeEach(() => {
    // Limpar mocks antes de cada teste
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    // Arrange - Criar contratante com todos os campos obrigatórios
    const contratanteRes = await query(
      `INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, 
        ativa, pagamento_confirmado
      ) VALUES (
        'entidade', 'Contratante Teste Int', '11222333000144', 
        'teste@contratante-int.com', '1199998888', 'Rua Teste 123', 
        'São Paulo', 'SP', '01000-000',
        'Resp Teste', '99900011122', 'resp@teste.com', '11988887777', 
        true, true
      ) RETURNING id`,
      []
    );
    contratanteId = contratanteRes.rows[0].id;

    // Arrange - Criar funcionário vinculado ao contratante
    funcionarioCpf = '77766655544';
    await query(
      `INSERT INTO funcionarios (cpf, nome, ativo, perfil, contratante_id, indice_avaliacao, senha_hash, nivel_cargo) 
       VALUES ($1, $2, true, 'funcionario', $3, 0, '$2a$10$testehashsenhaintegration', 'operacional')`,
      [funcionarioCpf, 'Func Int Test', contratanteId]
    );

    // Arrange - Criar lote de contratante
    const codigoRes = await query(`SELECT gerar_codigo_lote() as codigo`);
    const codigo = codigoRes.rows[0].codigo;
    const loteRes = await query(
      `INSERT INTO lotes_avaliacao (codigo, contratante_id, titulo, tipo, status, liberado_por, numero_ordem) VALUES ($1, $2, $3, 'completo', 'ativo', $4, 1) RETURNING id`,
      [codigo, contratanteId, `Lote Teste Int ${codigo}`, '00000000000']
    );
    loteId = loteRes.rows[0].id;

    // Arrange - Criar avaliação iniciada
    const avRes = await query(
      `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio) VALUES ($1, $2, 'iniciada', NOW()) RETURNING id`,
      [funcionarioCpf, loteId]
    );
    avaliacaoId = avRes.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup - Remover dados de teste
    await query('DELETE FROM avaliacoes WHERE id = $1', [avaliacaoId]);
    await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
    await query('DELETE FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
    await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
  });

  /**
   * @test Valida inativação de avaliação sem violar constraints
   * @description Testa:
   * 1. Autenticação como gestor_entidade
   * 2. Inativação via POST /api/avaliacoes/inativar
   * 3. Atualização de status da avaliação
   * 4. Atualização de status do funcionário sem violar constraints
   */
  it('deve inativar avaliação sem violar constraint e atualizar funcionário', async () => {
    // Arrange - Mock auth como gestor_entidade do contratante
    const mockSession: Session = {
      cpf: '99900011122',
      perfil: 'gestor_entidade',
      contratante_id: contratanteId,
    };
    mockRequireAuth.mockResolvedValue(mockSession as any);

    const req = new Request('http://localhost/api/avaliacoes/inativar', {
      method: 'POST',
      body: JSON.stringify({
        avaliacao_id: avaliacaoId,
        motivo: 'Teste integração inativar',
        forcar: false,
      }),
    });

    // Act - Executar inativação
    const res = await POST(req);

    // Assert 1 - Validar resposta da API
    let data: Response<unknown>;
    try {
      data = await res.json();
    } catch (jsonErr: any) {
      throw new Error(`Failed to parse JSON: ${jsonErr.message}`);
    }

    expect(res.status).toBe(200, 'Inativação deve retornar 200');
    expect(data.success).toBe(true, 'Inativação deve retornar success=true');

    // Assert 2 - Verificar que avaliação foi atualizada
    const avCheck = await query(
      'SELECT status, inativada_em FROM avaliacoes WHERE id = $1',
      [avaliacaoId]
    );
    expect(avCheck.rows[0].status).toBe(
      'inativada',
      'Status da avaliação deve ser inativada'
    );
    expect(avCheck.rows[0].inativada_em).toBeTruthy();

    // Assert 3 - Verificar que funcionário foi atualizado sem violar constraint
    const fCheck = await query(
      'SELECT ultima_avaliacao_status, ultimo_lote_codigo FROM funcionarios WHERE cpf = $1',
      [funcionarioCpf]
    );
    expect(fCheck.rows[0].ultima_avaliacao_status).toBe(
      'inativada',
      'Status do funcionário deve ser inativada'
    );
  }, 20000);
});
