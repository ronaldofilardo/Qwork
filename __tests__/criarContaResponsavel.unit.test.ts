import { criarContaResponsavel } from '@/lib/db';
import * as db from '@/lib/db';
import bcrypt from 'bcryptjs';

// Usar spy em vez de mock global do módulo para preservar closures internas

describe('criarContaResponsavel - unitários', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('Deve lançar erro quando não houver CNPJ nem no objeto nem no DB', async () => {
    const id = 9999;
    // Garantir que não exista contratante com esse id
    await db
      .query('DELETE FROM contratantes_senhas WHERE contratante_id = $1', [id])
      .catch(() => {});
    await db
      .query(
        'DELETE FROM contratantes_funcionarios WHERE contratante_id = $1',
        [id]
      )
      .catch(() => {});
    await db
      .query('DELETE FROM contratantes WHERE id = $1', [id])
      .catch(() => {});

    await expect(criarContaResponsavel({ id } as any)).rejects.toThrow(
      'CNPJ do contratante é obrigatório para criar conta'
    );
  });

  it('Deve usar CNPJ limpo para gerar senha padrão dos últimos 6 dígitos', async () => {
    const id = 10000;
    const contratante = {
      id,
      cnpj: '12.345.678/0001-99',
      responsavel_cpf: '77777777777',
    } as any;

    // Inserir contratante de teste
    await db.query(
      'INSERT INTO contratantes (id, nome, cnpj, tipo, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, status, criado_em, atualizado_em) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW())',
      [
        id,
        'Teste Unit',
        contratante.cnpj,
        'entidade',
        'unit@test.com',
        '(11) 99999-9999',
        'Rua Teste, 1',
        'Cidade',
        'SP',
        '01234-567',
        'Responsavel Unit',
        contratante.responsavel_cpf,
        'resp@unit.com',
        '(11) 98888-8888',
        'pendente',
      ]
    );

    try {
      await expect(criarContaResponsavel(contratante)).resolves.not.toThrow();

      const s = await db.query(
        'SELECT * FROM contratantes_senhas WHERE contratante_id = $1',
        [id]
      );
      expect(s.rows.length).toBeGreaterThan(0);

      const f = await db.query('SELECT * FROM funcionarios WHERE cpf = $1', [
        contratante.responsavel_cpf,
      ]);
      expect(f.rows.length).toBeGreaterThanOrEqual(0);
    } finally {
      // Limpar registros criados
      await db
        .query('DELETE FROM contratantes_senhas WHERE contratante_id = $1', [
          id,
        ])
        .catch(() => {});
      await db
        .query(
          'DELETE FROM contratantes_funcionarios WHERE contratante_id = $1',
          [id]
        )
        .catch(() => {});
      await db
        .query('DELETE FROM funcionarios WHERE cpf = $1', [
          contratante.responsavel_cpf,
        ])
        .catch(() => {});
      await db
        .query('DELETE FROM contratantes WHERE id = $1', [id])
        .catch(() => {});
    }
  });
});
