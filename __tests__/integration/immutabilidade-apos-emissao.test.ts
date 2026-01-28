/**
 * E2E: Imutabilidade após laudo emitido
 * - Depois de emitir o laudo, tentativas de alterar lote ou avaliações devem falhar
 */

import { query } from '@/lib/db';
import { emitirLaudoImediato } from '@/lib/laudo-auto';
import { recalcularStatusLote } from '@/lib/lotes';

jest.setTimeout(60000);

describe('Imutabilidade após laudo emitido', () => {
  let clinicaId: number;
  let empresaId: number;
  let loteId: number;
  let funcionarioCpf: string;
  let avalId: number;

  beforeAll(async () => {
    const uniqueClin = Math.floor(Math.random() * 1e14)
      .toString()
      .padStart(14, '0');
    const uniqueEmp = Math.floor(Math.random() * 1e14)
      .toString()
      .padStart(14, '0');
    const clinica = await query(
      `INSERT INTO clinicas (nome, cnpj, ativa) VALUES ('Clínica Imut', $1, true) RETURNING id`,
      [uniqueClin]
    );
    clinicaId = clinica.rows[0].id;
    const empresa = await query(
      `INSERT INTO empresas_clientes (clinica_id, nome, cnpj, ativa) VALUES ($1, 'Empresa Imut', $2, true) RETURNING id`,
      [clinicaId, uniqueEmp]
    );
    empresaId = empresa.rows[0].id;

    funcionarioCpf = `${Date.now().toString().slice(-11)}`.padStart(11, '0');
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, perfil, ativo, clinica_id, empresa_id, senha_hash) VALUES ($1, 'Func Imut', 'fi@imut.test', 'funcionario', true, $2, $3, 'dummy')`,
      [funcionarioCpf, clinicaId, empresaId]
    );

    // Criar emissor ativo para permitir emissão automática
    const emissorCpf = `${(Date.now() + 1).toString().slice(-11)}`.padStart(
      11,
      '0'
    );
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, perfil, ativo, clinica_id, senha_hash) VALUES ($1, 'Emissor Teste', 'emissor@imut.test', 'emissor', true, $2, 'dummy')`,
      [emissorCpf, clinicaId]
    );

    // Garantir triggers de imutabilidade presentes no DB para o teste
    await query(`
      CREATE OR REPLACE FUNCTION public.prevent_modification_lote_when_laudo_emitted()
      RETURNS TRIGGER AS $$
      DECLARE v_has_laudo BOOLEAN := FALSE;
      BEGIN
        -- desligar temporariamente row level security para a checagem interna
        PERFORM set_config('row_security', 'off', true);
        IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
          SELECT EXISTS(SELECT 1 FROM laudos WHERE lote_id = OLD.id AND emitido_em IS NOT NULL) INTO v_has_laudo;
          IF v_has_laudo THEN
            RAISE EXCEPTION 'Não é permitido alterar/deletar lote %: laudo já emitido.', OLD.id;
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS trg_protect_lote_after_emit ON public.lotes_avaliacao;
      CREATE TRIGGER trg_protect_lote_after_emit
      BEFORE UPDATE OR DELETE ON public.lotes_avaliacao
      FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_lote_when_laudo_emitted();

      CREATE OR REPLACE FUNCTION public.prevent_modification_avaliacao_when_lote_emitted()
      RETURNS TRIGGER AS $$
      DECLARE
        v_count INTEGER;
        v_lote INTEGER;
      BEGIN
        IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
          v_lote := COALESCE(NEW.lote_id, OLD.lote_id);
          SELECT COUNT(*) INTO v_count FROM laudos WHERE lote_id = v_lote AND emitido_em IS NOT NULL;
          IF v_count > 0 THEN
            RAISE EXCEPTION 'Não é permitido alterar/deletar avaliação %: laudo do lote % já foi emitido.', COALESCE(NEW.id, OLD.id), v_lote;
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS trg_protect_avaliacao_after_emit ON public.avaliacoes;
      CREATE TRIGGER trg_protect_avaliacao_after_emit
      BEFORE UPDATE OR DELETE ON public.avaliacoes
      FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_avaliacao_when_lote_emitted();
    `);

    const lote = await query(
      `INSERT INTO lotes_avaliacao (codigo, clinica_id, empresa_id, titulo, status, liberado_por, tipo, numero_ordem) VALUES ($1,$2,$3,'Lote Imut','ativo',$4,'completo',1) RETURNING id`,
      [`IMUT-${Date.now()}`, clinicaId, empresaId, funcionarioCpf]
    );
    loteId = lote.rows[0].id;

    const aval = await query(
      `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio) VALUES ($1, $2, 'iniciada', NOW()) RETURNING id`,
      [funcionarioCpf, loteId]
    );
    avalId = aval.rows[0].id;
  });

  afterAll(async () => {
    if (loteId) {
      await query('DELETE FROM laudos WHERE lote_id = $1', [loteId]);
      await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
    }
    await query(
      'UPDATE lotes_avaliacao SET liberado_por = NULL WHERE liberado_por = $1',
      [funcionarioCpf]
    );
    await query('DELETE FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
    await query('DELETE FROM empresas_clientes WHERE id = $1', [empresaId]);
    await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
  });

  it('emite laudo e bloqueia alterações subsequentes', async () => {
    // concluir avaliação e emitir
    await query(
      `UPDATE avaliacoes SET status = 'concluida', envio = NOW() WHERE id = $1`,
      [avalId]
    );

    // Forçar recálculo (emitirá laudo imediatamente)
    await recalcularStatusLote(avalId);

    // Esperar processamento
    await new Promise((r) => setTimeout(r, 1500));

    const laudo = await query('SELECT id FROM laudos WHERE lote_id = $1', [
      loteId,
    ]);
    expect(laudo.rows.length).toBeGreaterThan(0);

    // Tentar alterar o lote - deve falhar (trigger de imutabilidade deve bloquear)
    let erroLote = null;
    try {
      await query(
        "UPDATE lotes_avaliacao SET titulo = 'Alterado' WHERE id = $1",
        [loteId]
      );
    } catch (err: any) {
      erroLote = err;
      expect(err.message).toMatch(/Não é permitido alterar\/deletar lote/);
    }
    expect(erroLote).not.toBeNull();

    // Tentar alterar avaliação - deve falhar
    let erroAval = null;
    try {
      await query("UPDATE avaliacoes SET status = 'iniciada' WHERE id = $1", [
        avalId,
      ]);
    } catch (err) {
      erroAval = err;
    }
    expect(erroAval).not.toBeNull();
  });
});
