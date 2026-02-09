import { GET } from '@/app/api/entidade/lotes/route';
import { query } from '@/lib/db';

jest.mock('@/lib/session', () => ({
  requireEntity: jest.fn(),
}));

const mockRequireEntity = require('@/lib/session').requireEntity;

describe('Integração: Entidade Lotes com contratante_id', () => {
  let entidadeId: number | null = null;
  let gestorCpf: string | null = null;
  let loteId: number | null = null;

  beforeAll(async () => {
    // Criar uma entidade (tomador) e gestor
    const ts = Date.now();
    const nome = `Ent Teste CI ${ts}`;
    const cnpj = `${String(ts).slice(-8)}0009`;

    const entRes = await query(
      `INSERT INTO entidades (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa
      ) VALUES (
        'entidade', $1, $2, $3, '11999999999', 'Rua Teste, 1', 'São Paulo', 'SP', '01234567',
        'Resp Teste', '11111111111', $4, '11988888888', true
      ) RETURNING id`,
      [
        nome,
        cnpj,
        `${nome.replace(/\s/g, '').toLowerCase()}@test.local`,
        `resp_${nome.replace(/\s/g, '').toLowerCase()}@test.local`,
      ]
    );
    entidadeId = entRes.rows[0].id;

    gestorCpf = `${String(ts + 11).slice(-11)}`;
    await query(
      `INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, entidade_id, ativo) VALUES ($1, $2, $3, $4, 'gestor', $5, true) ON CONFLICT (cpf) DO UPDATE SET entidade_id = EXCLUDED.entidade_id RETURNING cpf`,
      [
        gestorCpf,
        `Gestor CI ${ts}`,
        `gestor${ts}@test.local`,
        '$2b$10$dummy',
        entidadeId,
      ]
    );

    // Garantir que coluna contratante_id exista (migrations podem ter adicionado)
    await query(
      `ALTER TABLE lotes_avaliacao ADD COLUMN IF NOT EXISTS contratante_id integer`
    );

    // Inserir lote apontando para a entidade via contratante_id
    const loteRes = await query(
      `INSERT INTO lotes_avaliacao (entidade_id, contratante_id, descricao, tipo, status, liberado_por, numero_ordem) VALUES ($1, $1, $2, 'completo', 'ativo', NULL, 1) RETURNING id`,
      [entidadeId, `Lote CI Teste ${ts}`]
    );
    loteId = loteRes.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup
    if (loteId) {
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
    }
    if (gestorCpf) {
      await query('DELETE FROM usuarios WHERE cpf = $1', [gestorCpf]);
    }
    if (entidadeId) {
      await query('DELETE FROM entidades WHERE id = $1', [entidadeId]);
    }
  });

  test('rota de entidade retorna lotes para contratante_id', async () => {
    expect(entidadeId).not.toBeNull();
    expect(loteId).not.toBeNull();

    // Mockar sessão de entidade
    mockRequireEntity.mockResolvedValue({
      perfil: 'gestor',
      entidade_id: entidadeId,
    });

    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('lotes');
    const ids = (body.lotes || []).map((l: any) => l.id);
    expect(ids).toContain(loteId);
  });
});
