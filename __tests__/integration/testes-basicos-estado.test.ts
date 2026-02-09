/**
 * Teste básico de criação e transições de lotes e avaliações
 *
 * Valida que a máquina de estado fundamental está funcionando:
 * - Lotes: começam 'ativo' → 'concluido'
 * - Avaliações: começam 'iniciada' → 'concluida' (feminino)
 * - Triggers: reservam ID do laudo = ID do lote (não criam laudo)
 */

import { query } from '@/lib/db';

describe('Testes Básicos de Estado', () => {
  let clinicaId: number;
  let tomadorId: number;
  let empresaId: number;
  let emissorCpf: string; // Gerar dinamicamente para evitar conflitos

  beforeAll(async () => {
    const timestamp = Date.now();

    // Gerar CPFs únicos para este teste (usar últimos 11 dígitos do timestamp)
    const timestampStr = timestamp.toString();
    emissorCpf = timestampStr.slice(-11);
    const responsavelCpf = (timestamp - 1).toString().slice(-11); // CPF diferente

    // Criar clínica
    const clinicaResult = await query(
      `INSERT INTO clinicas (nome, cnpj, email, ativa) VALUES ($1, $2, $3, true) RETURNING id`,
      [
        `Clínica Test ${timestamp}`,
        `${timestamp.toString().slice(-14)}`,
        `test${timestamp}@test.com`,
      ]
    );
    clinicaId = clinicaResult.rows[0].id;

    // Criar entidade para o emissor
    const entidadeResult = await query(
      `INSERT INTO entidades (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular
      ) VALUES (
        'entidade', $1, $2, $3, '1122334455', 'Rua Test 123', 'São Paulo', 'SP', '01234-567',
        'Responsável Test', $4, $3, '11987654321'
      ) RETURNING id`,
      [
        `Entidade Test ${timestamp}`,
        `${timestamp.toString().slice(-14)}`,
        `ent${timestamp}@test.com`,
        responsavelCpf,
      ]
    );
    tomadorId = entidadeResult.rows[0].id;

    // Criar emissor em entidades_senhas com CPF único (senha: 'test123')
    await query(
      'INSERT INTO entidades_senhas (entidade_id, cpf, senha_hash) VALUES ($1, $2, $3)',
      [
        tomadorId,
        emissorCpf,
        '$2a$10$NNUkJ.nfWUrrDcAcwWNjH.RfMEbMfIVW5j7pVz4vTPfEfIqCzUMme',
      ]
    );

    // SET context após criar emissor
    await query(`SET app.current_user_cpf = '${emissorCpf}'`);

    // Criar empresa
    const empresaResult = await query(
      `INSERT INTO empresas_clientes (nome, cnpj, email, clinica_id, ativa) VALUES ($1, $2, $3, $4, true) RETURNING id`,
      [
        `Empresa Test ${timestamp}`,
        `${(timestamp + 1).toString().slice(-14)}`,
        `empresa${timestamp}@test.com`,
        clinicaId,
      ]
    );
    empresaId = empresaResult.rows[0].id;
  });

  afterAll(async () => {
    // Deixar dados no banco - RLS impede DELETE normal
    // Em produção, usar script de limpeza separado se necessário
  });

  describe('Lotes', () => {
    it('deve criar lote com status "ativo"', async () => {
      await query(`SET app.current_user_cpf = '${emissorCpf}'`);

      const maxOrdem = await query(
        'SELECT COALESCE(MAX(numero_ordem), 0) as max FROM lotes_avaliacao WHERE empresa_id = $1',
        [empresaId]
      );
      const numeroOrdem = maxOrdem.rows[0].max + 1;

      const result = await query(
        `INSERT INTO lotes_avaliacao (empresa_id, clinica_id, tipo, status, numero_ordem, liberado_por) 
         VALUES ($1, $2, 'completo', 'ativo', $3, $4) RETURNING id, status`,
        [empresaId, clinicaId, numeroOrdem, emissorCpf]
      );

      expect(result.rows[0].status).toBe('ativo');

      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [
        result.rows[0].id,
      ]);
    });
  });

  describe('Avaliações', () => {
    let loteId: number;
    let funcionarioCpf: string;

    beforeEach(async () => {
      await query(`SET app.current_user_cpf = '${emissorCpf}'`);

      // Criar lote
      const maxOrdem = await query(
        'SELECT COALESCE(MAX(numero_ordem), 0) as max FROM lotes_avaliacao WHERE empresa_id = $1',
        [empresaId]
      );
      const numeroOrdem = maxOrdem.rows[0].max + 1;

      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (empresa_id, clinica_id, tipo, status, numero_ordem, liberado_por) 
         VALUES ($1, $2, 'completo', 'ativo', $3, $4) RETURNING id`,
        [empresaId, clinicaId, numeroOrdem, emissorCpf]
      );
      loteId = loteResult.rows[0].id;

      // Criar funcionário (senha: 'test123')
      funcionarioCpf = String(
        Math.floor(Math.random() * 100000000000)
      ).padStart(11, '0');
      await query(
        'INSERT INTO funcionarios (cpf, nome, tomador_id, usuario_tipo, senha_hash) VALUES ($1, $2, $3, $4, $5)',
        [
          funcionarioCpf,
          'Test Func',
          tomadorId,
          'funcionario_entidade',
          '$2a$10$NNUkJ.nfWUrrDcAcwWNjH.RfMEbMfIVW5j7pVz4vTPfEfIqCzUMme',
        ]
      );
    });

    // afterEach removido: RLS bloqueia DELETEs e dados são únicos por execução

    it('deve criar avaliação com status "iniciada"', async () => {
      await query(`SET app.current_user_cpf = '${funcionarioCpf}'`);

      const result = await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio) 
         VALUES ($1, $2, 'iniciada', NOW()) RETURNING id, status`,
        [loteId, funcionarioCpf]
      );

      expect(result.rows[0].status).toBe('iniciada');

      await query(`RESET app.current_user_cpf`);
    });

    it('deve transicionar de "iniciada" para "em_andamento"', async () => {
      await query(`SET app.current_user_cpf = '${funcionarioCpf}'`);

      const avalResult = await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio) 
         VALUES ($1, $2, 'iniciada', NOW()) RETURNING id`,
        [loteId, funcionarioCpf]
      );

      await query('UPDATE avaliacoes SET status = $1 WHERE id = $2', [
        'em_andamento',
        avalResult.rows[0].id,
      ]);

      const check = await query('SELECT status FROM avaliacoes WHERE id = $1', [
        avalResult.rows[0].id,
      ]);
      expect(check.rows[0].status).toBe('em_andamento');

      await query(`RESET app.current_user_cpf`);
    });

    it('deve transicionar de "em_andamento" para "concluida"', async () => {
      await query(`SET app.current_user_cpf = '${funcionarioCpf}'`);

      const avalResult = await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio) 
         VALUES ($1, $2, 'em_andamento', NOW()) RETURNING id`,
        [loteId, funcionarioCpf]
      );

      await query(
        'UPDATE avaliacoes SET status = $1, envio = NOW() WHERE id = $2',
        ['concluida', avalResult.rows[0].id]
      );

      const check = await query('SELECT status FROM avaliacoes WHERE id = $1', [
        avalResult.rows[0].id,
      ]);
      expect(check.rows[0].status).toBe('concluida');

      await query(`RESET app.current_user_cpf`);
    });

    it('deve atualizar lote para "concluido" quando avaliação finalizada', async () => {
      await query(`SET app.current_user_cpf = '${funcionarioCpf}'`);

      // Criar avaliação iniciada
      const avalResult = await query(
        `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio) 
         VALUES ($1, $2, 'iniciada', NOW()) RETURNING id`,
        [loteId, funcionarioCpf]
      );

      // Atualizar para concluída (dispara o trigger)
      await query(
        'UPDATE avaliacoes SET status = $1, envio = NOW() WHERE id = $2',
        ['concluida', avalResult.rows[0].id]
      );

      await query(`RESET app.current_user_cpf`);

      // Aguardar trigger
      await new Promise((resolve) => setTimeout(resolve, 100));

      const loteCheck = await query(
        'SELECT status FROM lotes_avaliacao WHERE id = $1',
        [loteId]
      );
      expect(loteCheck.rows[0].status).toBe('concluido');
    });
  });
});
