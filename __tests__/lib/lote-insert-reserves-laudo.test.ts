import { query } from '@/lib/db';

describe('Lote insert reserves laudo rascunho', () => {
  it('ao inserir um lote, foi criado um laudo rascunho com same id', async () => {
    await query('BEGIN');
    try {
      // Criar um contratante temporário para satisfazer constraint clinica XOR contratante
      const uniqueCpf =
        '9' + (Date.now() % 100000000000).toString().padStart(11, '0');
      const contratanteRes = await query(
        `INSERT INTO contratantes (
          tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
          status, ativa, pagamento_confirmado
        ) VALUES (
          'entidade', 'Teste Contratante', '999' || $1, $2, $3, $4, $5, $6, $7,
          'Joao', $8, $9, $10, 'aprovado', true, true
        ) RETURNING id`,
        [
          Date.now().toString().slice(-11),
          'teste@contratante.local',
          '11999999999',
          'Rua Teste, 1',
          'Cidade',
          'SP',
          '01000-000',
          uniqueCpf,
          'joao@contratante.local',
          '11988888888',
        ]
      );

      const contratanteId = contratanteRes.rows[0].id;

      const res = await query(
        `INSERT INTO lotes_avaliacao (tipo, status, criado_em, atualizado_em, contratante_id) VALUES ('completo', 'rascunho', NOW(), NOW(), $1) RETURNING id`,
        [contratanteId]
      );

      const loteId = res.rows[0].id;

      const laudo = await query(
        'SELECT id, lote_id, status FROM laudos WHERE id = $1',
        [loteId]
      );

      expect(laudo.rows.length).toBe(1);
      expect(laudo.rows[0].id).toBe(loteId);
      expect(laudo.rows[0].lote_id).toBe(loteId);
      expect(['rascunho', 'enviado']).toContain(laudo.rows[0].status);
    } finally {
      await query('ROLLBACK');
    }
  });
});
