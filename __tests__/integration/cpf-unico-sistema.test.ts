/**
 * @file __tests__/integration/cpf-unico-sistema.test.ts
 *
 * Testes de integração para a regra de negócio: CPF único no sistema.
 *
 * Requisito de sistema: Um CPF não pode ser registrado simultaneamente como
 * representante (PF ou responsável PJ), lead ativo, vendedor, gestor ou rh.
 *
 * Estes testes rodam contra o banco de testes real (TEST_DATABASE_URL) e
 * verificam TANTO a função de aplicação (checkCpfUnicoSistema) QUANTO
 * os triggers de banco (fn_trigger_*_cpf_unico) da migration 1229.
 *
 * Pré-condição: migration 1229 deve estar aplicada no banco de testes.
 *
 * Nota: O banco de testes tem a constraint `representantes_somente_pj` que
 * restringe inserção de representantes PF. Por isso, os testes usam apenas:
 *   - representantes PJ (via cpf_responsavel_pj)
 *   - leads (PF e PJ)
 *   - usuarios (vendedor, gestor, rh)
 */

import { query } from '@/lib/db';
import { checkCpfUnicoSistema } from '@/lib/validators/cpf-unico';

// CPFs fictícios gerados com timestamp para evitar colisões entre execuções
function cpfFromSeed(seed: number): string {
  return String(seed).slice(-11).padStart(11, '0');
}

const NOW = Date.now();
const CPF_REP_PJ = cpfFromSeed(NOW + 2);
const CPF_LEAD_PF = cpfFromSeed(NOW + 3);
const CPF_LEAD_PJ = cpfFromSeed(NOW + 4);
const CPF_VENDEDOR = cpfFromSeed(NOW + 5);
const CPF_GESTOR = cpfFromSeed(NOW + 6);
const CPF_RH = cpfFromSeed(NOW + 7);
const CPF_LIVRE = cpfFromSeed(NOW + 8);

// IDs criados durante os testes — limpos no afterAll
let repPjId: number | null = null;
let leadPfId: string | null = null;
let leadPjId: string | null = null;
let vendedorId: number | null = null;
let gestorId: number | null = null;
let rhId: number | null = null;
let entidadeId: number | null = null;
let clinicaId: number | null = null;

describe('Regra de negócio: CPF único no sistema (integration)', () => {
  // ─── Setup: criar dados de referência ─────────────────────────────────────

  beforeAll(async () => {
    // Representante PJ (cpf_responsavel_pj = CPF_REP_PJ)
    const cnpjPj = String(NOW).slice(-14).padStart(14, '0');
    const repPj = await query(
      `INSERT INTO representantes (tipo_pessoa, nome, email, telefone, cnpj, cpf_responsavel_pj, status, ativo, aceite_termos)
       VALUES ('pj', 'Rep PJ Teste', $1, '11999990002', $2, $3, 'ativo', true, false)
       RETURNING id`,
      [`rep_pj_${NOW}@teste.com`, cnpjPj, CPF_REP_PJ]
    );
    repPjId = repPj.rows[0].id;

    // Lead PF (status pendente_verificacao)
    const leadPf = await query(
      `INSERT INTO representantes_cadastro_leads
         (tipo_pessoa, nome, email, telefone, cpf, status, doc_cpf_key)
       VALUES ('pf', 'Lead PF Teste', $1, '11999990003', $2, 'pendente_verificacao', 'fake-key-pf')
       RETURNING id`,
      [`lead_pf_${NOW}@teste.com`, CPF_LEAD_PF]
    );
    leadPfId = leadPf.rows[0].id;

    // Lead PJ (cpf_responsavel = CPF_LEAD_PJ, status verificado)
    const cnpjLeadPj = String(NOW + 99)
      .slice(-14)
      .padStart(14, '0');
    const leadPj = await query(
      `INSERT INTO representantes_cadastro_leads
         (tipo_pessoa, nome, email, telefone, cnpj, razao_social, cpf_responsavel, status, doc_cnpj_key, doc_cpf_resp_key)
       VALUES ('pj', 'Lead PJ Teste', $1, '11999990004', $2, 'Razao Social', $3, 'verificado', 'fake-cnpj', 'fake-cpf-resp')
       RETURNING id`,
      [`lead_pj_${NOW}@teste.com`, cnpjLeadPj, CPF_LEAD_PJ]
    );
    leadPjId = leadPj.rows[0].id;

    // Entidade para gestor
    const ent = await query(
      `INSERT INTO entidades (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
         responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa)
       VALUES ('entidade', $1, $2, $3, '1199999999', 'Rua Teste', 'SP', 'SP', '01234567',
         'Resp', '00000000001', $4, '11988880000', true)
       RETURNING id`,
      [
        `Entidade CPF Unico ${NOW}`,
        String(NOW).slice(-14).padStart(14, '0'),
        `ent_cpf_unico_${NOW}@teste.com`,
        `resp_ent_${NOW}@teste.com`,
      ]
    );
    entidadeId = ent.rows[0].id;

    // Clínica para rh
    const cli = await query(
      `INSERT INTO clinicas (cnpj, nome, email, telefone, endereco, cidade, estado, cep,
         responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa)
       VALUES ($1, $2, $3, '1199990001', 'Rua Teste', 'SP', 'SP', '01234567',
         'Resp', '00000000002', $4, '11988880001', true)
       RETURNING id`,
      [
        String(NOW + 777)
          .slice(-14)
          .padStart(14, '0'),
        `Clinica CPF Unico ${NOW}`,
        `cli_cpf_unico_${NOW}@teste.com`,
        `resp_cli_${NOW}@teste.com`,
      ]
    );
    clinicaId = cli.rows[0].id;

    // Vendedor
    const vend = await query(
      `INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, ativo)
       VALUES ($1, 'Vendedor Teste', $2, 'hash', 'vendedor', true)
       RETURNING id`,
      [CPF_VENDEDOR, `vendedor_${NOW}@teste.com`]
    );
    vendedorId = vend.rows[0].id;

    // Gestor (com entidade_id)
    const gest = await query(
      `INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, entidade_id, ativo)
       VALUES ($1, 'Gestor Teste', $2, 'hash', 'gestor', $3, true)
       RETURNING id`,
      [CPF_GESTOR, `gestor_${NOW}@teste.com`, entidadeId]
    );
    gestorId = gest.rows[0].id;

    // RH (com clinica_id)
    const rhUser = await query(
      `INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, clinica_id, ativo)
       VALUES ($1, 'RH Teste', $2, 'hash', 'rh', $3, true)
       RETURNING id`,
      [CPF_RH, `rh_${NOW}@teste.com`, clinicaId]
    );
    rhId = rhUser.rows[0].id;
  });

  afterAll(async () => {
    // Limpeza em ordem reversa de dependências
    const cpfsToClean = [CPF_VENDEDOR, CPF_GESTOR, CPF_RH];
    for (const cpf of cpfsToClean) {
      await query('DELETE FROM usuarios WHERE cpf = $1', [cpf]);
    }
    if (leadPfId)
      await query('DELETE FROM representantes_cadastro_leads WHERE id = $1', [
        leadPfId,
      ]);
    if (leadPjId)
      await query('DELETE FROM representantes_cadastro_leads WHERE id = $1', [
        leadPjId,
      ]);
    if (repPjId)
      await query('DELETE FROM representantes WHERE id = $1', [repPjId]);
    if (entidadeId)
      await query('DELETE FROM entidades WHERE id = $1', [entidadeId]);
    if (clinicaId)
      await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
  });

  // ─── 1. checkCpfUnicoSistema (nível de aplicação) ─────────────────────────

  describe('checkCpfUnicoSistema (função de aplicação)', () => {
    it('CPF livre → disponivel=true', async () => {
      const r = await checkCpfUnicoSistema(CPF_LIVRE);
      expect(r.disponivel).toBe(true);
      expect(r.perfil).toBeNull();
    });

    it('CPF de responsável PJ → disponivel=false, perfil=representante_pj', async () => {
      const r = await checkCpfUnicoSistema(CPF_REP_PJ);
      expect(r.disponivel).toBe(false);
      expect(r.perfil).toBe('representante_pj');
    });

    it('CPF de lead PF ativo → disponivel=false, perfil=representante_lead', async () => {
      const r = await checkCpfUnicoSistema(CPF_LEAD_PF);
      expect(r.disponivel).toBe(false);
      expect(r.perfil).toBe('representante_lead');
    });

    it('CPF responsável de lead PJ ativo → disponivel=false, perfil=representante_lead', async () => {
      const r = await checkCpfUnicoSistema(CPF_LEAD_PJ);
      expect(r.disponivel).toBe(false);
      expect(r.perfil).toBe('representante_lead');
    });

    it('CPF de vendedor ativo → disponivel=false, perfil=vendedor', async () => {
      const r = await checkCpfUnicoSistema(CPF_VENDEDOR);
      expect(r.disponivel).toBe(false);
      expect(r.perfil).toBe('vendedor');
    });

    it('CPF de gestor ativo → disponivel=false, perfil=gestor', async () => {
      const r = await checkCpfUnicoSistema(CPF_GESTOR);
      expect(r.disponivel).toBe(false);
      expect(r.perfil).toBe('gestor');
    });

    it('CPF de rh ativo → disponivel=false, perfil=rh', async () => {
      const r = await checkCpfUnicoSistema(CPF_RH);
      expect(r.disponivel).toBe(false);
      expect(r.perfil).toBe('rh');
    });

    it('ignorarRepresentanteId permite reeditar o próprio representante PJ', async () => {
      const r = await checkCpfUnicoSistema(CPF_REP_PJ, {
        ignorarRepresentanteId: repPjId!,
      });
      expect(r.disponivel).toBe(true);
    });

    it('ignorarUsuarioId permite reeditar o próprio usuário (vendedor)', async () => {
      const r = await checkCpfUnicoSistema(CPF_VENDEDOR, {
        ignorarUsuarioId: vendedorId!,
      });
      expect(r.disponivel).toBe(true);
    });
  });

  // ─── 2. Triggers de banco (nível DB — migration 1229) ─────────────────────

  describe('Triggers DB (migration 1229)', () => {
    it('trigger existe em representantes', async () => {
      const r = await query(
        `SELECT tgname FROM pg_trigger WHERE tgname = 'tg_representante_cpf_unico'`
      );
      expect(r.rows.length).toBe(1);
    });

    it('trigger existe em representantes_cadastro_leads', async () => {
      const r = await query(
        `SELECT tgname FROM pg_trigger WHERE tgname = 'tg_lead_cpf_unico'`
      );
      expect(r.rows.length).toBe(1);
    });

    it('trigger existe em usuarios', async () => {
      const r = await query(
        `SELECT tgname FROM pg_trigger WHERE tgname = 'tg_usuario_cpf_unico'`
      );
      expect(r.rows.length).toBe(1);
    });

    it('trigger bloqueia INSERT em representantes PJ com cpf_responsavel_pj de vendedor ativo', async () => {
      const cnpjDup = String(NOW + 555)
        .slice(-14)
        .padStart(14, '0');
      await expect(
        query(
          `INSERT INTO representantes (tipo_pessoa, nome, email, telefone, cnpj, cpf_responsavel_pj, status, ativo, aceite_termos)
           VALUES ('pj', 'Dup PJ Teste', $1, '11999990099', $2, $3, 'ativo', true, false)`,
          [`dup_pj_${NOW}@teste.com`, cnpjDup, CPF_VENDEDOR]
        )
      ).rejects.toThrow(
        /cpf_unico_sistema|cadastrado no sistema|bloqueada por regra/i
      );
    });

    it('trigger bloqueia INSERT em usuarios (vendedor) com CPF de responsável PJ', async () => {
      await expect(
        query(
          `INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, ativo)
           VALUES ($1, 'Dup Vendedor', $2, 'hash', 'vendedor', true)`,
          [CPF_REP_PJ, `dup_vend_${NOW}@teste.com`]
        )
      ).rejects.toThrow(
        /cpf_unico_sistema|cadastrado no sistema|bloqueada por regra/i
      );
    });

    it('trigger bloqueia INSERT em representantes_cadastro_leads (ativo) com CPF de vendedor', async () => {
      await expect(
        query(
          `INSERT INTO representantes_cadastro_leads
             (tipo_pessoa, nome, email, telefone, cpf, status, doc_cpf_key)
           VALUES ('pf', 'Dup Lead', $1, '11999990098', $2, 'pendente_verificacao', 'fake-dup')`,
          [`dup_lead_${NOW}@teste.com`, CPF_VENDEDOR]
        )
      ).rejects.toThrow(
        /cpf_unico_sistema|cadastrado no sistema|bloqueada por regra/i
      );
    });

    it('trigger NÃO bloqueia lead com status convertido (CPF de rep)', async () => {
      // Lead já convertido pode ter o mesmo CPF — o registro já foi processado
      await expect(
        query(
          `INSERT INTO representantes_cadastro_leads
             (tipo_pessoa, nome, email, telefone, cpf, status, doc_cpf_key)
           VALUES ('pf', 'Lead Conv', $1, '11999990097', $2, 'convertido', 'fake-conv')
           RETURNING id`,
          [`lead_conv_${NOW}@teste.com`, CPF_REP_PJ]
        )
      ).resolves.toBeDefined();

      // Limpar
      await query(
        `DELETE FROM representantes_cadastro_leads WHERE email = $1`,
        [`lead_conv_${NOW}@teste.com`]
      );
    });

    it('trigger NÃO bloqueia usuario admin com CPF de responsável PJ (admin é excluído da regra)', async () => {
      await expect(
        query(
          `INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, ativo)
           VALUES ($1, 'Admin Dup', $2, 'hash', 'admin', true)
           RETURNING id`,
          [CPF_REP_PJ, `admin_dup_${NOW}@teste.com`]
        )
      ).resolves.toBeDefined();

      // Limpar
      await query('DELETE FROM usuarios WHERE cpf = $1 AND tipo_usuario = $2', [
        CPF_REP_PJ,
        'admin',
      ]);
    });
  });
});
