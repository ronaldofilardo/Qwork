import { POST } from '@/app/api/avaliacoes/inativar/route';
import { query } from '@/lib/db';
import * as sessionMod from '@/lib/session';

jest.mock('@/lib/session', () => ({ requireAuth: jest.fn() }));
const mockRequireAuth = sessionMod.requireAuth as jest.MockedFunction<
  typeof sessionMod.requireAuth
>;

describe('Inativar avaliação - integração (contratante)', () => {
  let contratanteId: number;
  let funcionarioCpf: string;
  let loteId: number;
  let avaliacaoId: number;

  beforeAll(async () => {
    // Criar contratante com todos os campos obrigatórios
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

    // Criar funcionário vinculado ao contratante (empresa_id NULL)
    funcionarioCpf = '77766655544';
    await query(
      `INSERT INTO funcionarios (cpf, nome, ativo, perfil, contratante_id, indice_avaliacao, senha_hash, nivel_cargo) 
       VALUES ($1, $2, true, 'funcionario', $3, 0, '$2a$10$testehashsenhaintegration', 'operacional')`,
      [funcionarioCpf, 'Func Int Test', contratanteId]
    );

    // Criar lote de contratante
    const codigoRes = await query(`SELECT gerar_codigo_lote() as codigo`);
    const codigo = codigoRes.rows[0].codigo;
    const loteRes = await query(
      `INSERT INTO lotes_avaliacao (codigo, contratante_id, titulo, tipo, status, liberado_por, numero_ordem) VALUES ($1, $2, $3, 'completo', 'ativo', $4, 1) RETURNING id`,
      [codigo, contratanteId, `Lote Teste Int ${codigo}`, '00000000000']
    );
    loteId = loteRes.rows[0].id;

    // Criar avaliação iniciada
    const avRes = await query(
      `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio) VALUES ($1, $2, 'iniciada', NOW()) RETURNING id`,
      [funcionarioCpf, loteId]
    );
    avaliacaoId = avRes.rows[0].id;
  });

  afterAll(async () => {
    await query('DELETE FROM avaliacoes WHERE id = $1', [avaliacaoId]);
    await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
    await query('DELETE FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
    await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
  });

  it('deve inativar avaliação sem violar constraint e atualizar funcionário', async () => {
    // Mock auth como gestor_entidade do contratante
    mockRequireAuth.mockResolvedValue({
      cpf: '99900011122',
      perfil: 'gestor_entidade',
      contratante_id: contratanteId,
    } as any);

    const req = new Request('http://localhost/api/avaliacoes/inativar', {
      method: 'POST',
      body: JSON.stringify({
        avaliacao_id: avaliacaoId,
        motivo: 'Teste integração inativar',
        forcar: false,
      }),
    });

    const res = await POST(req);

    console.log('Response status:', res.status);
    console.log('Response headers:', Object.fromEntries(res.headers.entries()));

    let data;
    try {
      data = await res.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } catch (jsonErr: any) {
      console.error('Failed to parse JSON:', jsonErr.message);
      throw jsonErr;
    }

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    // Verificar que avaliação foi atualizada
    const avCheck = await query(
      'SELECT status, inativada_em FROM avaliacoes WHERE id = $1',
      [avaliacaoId]
    );
    expect(avCheck.rows[0].status).toBe('inativada');

    // Verificar que funcionário foi atualizado sem violar constraint
    const fCheck = await query(
      'SELECT ultima_avaliacao_status, ultimo_lote_codigo FROM funcionarios WHERE cpf = $1',
      [funcionarioCpf]
    );
    expect(fCheck.rows[0].ultima_avaliacao_status).toBe('inativada');
  }, 20000);
});
