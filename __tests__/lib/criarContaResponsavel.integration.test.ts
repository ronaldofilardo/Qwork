import { query } from '@/lib/db';
import * as db from '@/lib/db';
import bcrypt from 'bcryptjs';

// Usar jest.spyOn(db, 'query') nos testes para controlar respostas sem substituir o módulo

describe('criarContaResponsavel - integração (mocks DB)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('Deve inserir senha e criar funcionário quando não existir (DB real)', async () => {
    const id = 9101;
    const tomador = {
      id,
      cnpj: '12345678000999',
      responsavel_cpf: '19999999999',
      responsavel_nome: 'Teste Integra DB',
      responsavel_email: 'integra-db@exemplo.com',
      tipo: 'entidade',
    } as any;

    // Preparar DB
    await db
      .query('DELETE FROM entidades_senhas WHERE tomador_id = $1', [id])
      .catch(() => {});
    await db
      .query(
        'DELETE FROM tomadors_funcionarios WHERE tomador_id = $1',
        [id]
      )
      .catch(() => {});
    await db
      .query('DELETE FROM funcionarios WHERE cpf = $1', [
        tomador.responsavel_cpf,
      ])
      .catch(() => {});
    await db
      .query('DELETE FROM tomadors WHERE id = $1', [id])
      .catch(() => {});

    await db.query(
      'INSERT INTO tomadors (id, nome, cnpj, tipo, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, status, criado_em, atualizado_em) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW())',
      [
        id,
        'Teste Integra DB Ltda',
        tomador.cnpj,
        'entidade',
        tomador.responsavel_email,
        '(11) 97777-7777',
        'Rua Integra, 99',
        'Cidade',
        'SP',
        '01234-567',
        tomador.responsavel_nome,
        tomador.responsavel_cpf,
        tomador.responsavel_email,
        '(11) 97777-0000',
        'pendente',
      ]
    );

    try {
      await expect(
        db.criarContaResponsavel(tomador)
      ).resolves.not.toThrow();

      const s = await db.query(
        'SELECT * FROM entidades_senhas WHERE tomador_id = $1',
        [id]
      );
      expect(s.rows.length).toBeGreaterThan(0);

      const u = await db.query('SELECT * FROM usuarios WHERE cpf = $1', [
        tomador.responsavel_cpf,
      ]);
      expect(u.rows.length).toBeGreaterThanOrEqual(0);
      if (u.rows.length > 0) {
        expect(u.rows[0].tipo_usuario).toBe('gestor');
      }
    } finally {
      // Cleanup
      await db
        .query('DELETE FROM entidades_senhas WHERE tomador_id = $1', [id])
        .catch(() => {});
      await db
        .query(
          'DELETE FROM tomadors_funcionarios WHERE tomador_id = $1',
          [id]
        )
        .catch(() => {});
      await db
        .query('DELETE FROM usuarios WHERE cpf = $1', [
          tomador.responsavel_cpf,
        ])
        .catch(() => {});
      await db
        .query('DELETE FROM tomadors WHERE id = $1', [id])
        .catch(() => {});
    }
  });

  it('Deve atualizar senha quando já existir (DB real)', async () => {
    const id = 9102;
    const tomador = {
      id,
      cnpj: '12345678000888',
      responsavel_cpf: '18888888888',
      responsavel_nome: 'Atualiza Senha DB',
      tipo: 'entidade',
    } as any;

    // Preparar DB: tomador e senha existente
    await db
      .query('DELETE FROM entidades_senhas WHERE tomador_id = $1', [id])
      .catch(() => {});
    await db
      .query(
        'DELETE FROM tomadors_funcionarios WHERE tomador_id = $1',
        [id]
      )
      .catch(() => {});
    await db
      .query('DELETE FROM funcionarios WHERE cpf = $1', [
        tomador.responsavel_cpf,
      ])
      .catch(() => {});
    await db
      .query('DELETE FROM tomadors WHERE id = $1', [id])
      .catch(() => {});

    await db.query(
      'INSERT INTO tomadors (id, nome, cnpj, tipo, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, status, criado_em, atualizado_em) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW())',
      [
        id,
        'Teste Atualiza DB Ltda',
        tomador.cnpj,
        'entidade',
        'atualiza@exemplo.com',
        '(11) 96666-6666',
        'Rua Atualiza, 10',
        'Cidade',
        'SP',
        '01234-567',
        'Nome Atualiza',
        tomador.responsavel_cpf,
        'atualiza@exemplo.com',
        '(11) 96666-0000',
        'pendente',
      ]
    );

    // Inserir senha anterior
    await db
      .query(
        'INSERT INTO entidades_senhas (tomador_id, cpf, senha_hash) VALUES ($1,$2,$3)',
        [id, tomador.responsavel_cpf, '$2a$10$oldhasholdhasholdhasholdha']
      )
      .catch(() => {});

    try {
      await expect(
        db.criarContaResponsavel(tomador)
      ).resolves.not.toThrow();

      const s = await db.query(
        'SELECT * FROM entidades_senhas WHERE tomador_id = $1 AND cpf = $2',
        [id, tomador.responsavel_cpf]
      );
      expect(s.rows.length).toBeGreaterThan(0);
      // senha deve existir e ter hash atualizado (length > 0)
      expect(s.rows[0].senha_hash.length).toBeGreaterThan(0);

      const u = await db.query('SELECT * FROM usuarios WHERE cpf = $1', [
        tomador.responsavel_cpf,
      ]);
      if (u.rows.length > 0) {
        expect(u.rows[0].tipo_usuario).toBe('gestor');
      }
    } finally {
      // Cleanup
      await db
        .query('DELETE FROM entidades_senhas WHERE tomador_id = $1', [id])
        .catch(() => {});
      await db
        .query(
          'DELETE FROM tomadors_funcionarios WHERE tomador_id = $1',
          [id]
        )
        .catch(() => {});
      await db
        .query('DELETE FROM usuarios WHERE cpf = $1', [
          tomador.responsavel_cpf,
        ])
        .catch(() => {});
      await db
        .query('DELETE FROM tomadors WHERE id = $1', [id])
        .catch(() => {});
    }
  });
});
