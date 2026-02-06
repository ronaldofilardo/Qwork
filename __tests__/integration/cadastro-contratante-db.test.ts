import '@testing-library/jest-dom';
import { createEntidade, query } from '@/lib/db';

// Tipo básico para sessão de teste
interface TestSession {
  cpf: string;
  nome: string;
  perfil: string;
  clinica_id: number | null;
}

describe('Integração: criar e apagar contratante (DB)', () => {
  it('cria contratante, cria contrato relacionado e apaga tudo (cascade)', async () => {
    // Dados únicos para evitar colisões
    const ts = Date.now();
    const uniqueEmail = `test-db-${ts}@example.com`;
    const cnpj = String(10000000000000 + (ts % 10000000000000)).slice(0, 14);

    let contratanteId: number | null = null;
    let contratoId: number | null = null;

    try {
      const contratante = await createEntidade({
        tipo: 'entidade',
        nome: `Teste DB ${ts}`,
        cnpj,
        inscricao_estadual: undefined,
        email: uniqueEmail,
        telefone: '(11)90000-0000',
        endereco: 'Rua Teste, 123',
        cidade: 'Cidade',
        estado: 'SP',
        cep: '01234-567',
        responsavel_nome: 'Teste Responsavel',
        responsavel_cpf: String(ts).slice(-11).padStart(11, '1'),
        responsavel_cargo: undefined,
        responsavel_email: `resp-${ts}@example.com`,
        responsavel_celular: '(11)90000-0001',
        cartao_cnpj_path: null as any,
        contrato_social_path: null as any,
        doc_identificacao_path: null as any,
        status: 'pendente' as any,
        ativa: false,
        plano_id: undefined,

        contrato_aceito: false,
        pagamento_confirmado: false,
      });

      expect(contratante).toBeDefined();
      expect(contratante.id).toBeGreaterThan(0);
      contratanteId = contratante.id;

      // Verificar se a tabela contratos existe no banco de testes
      const tbl = await query(
        "SELECT COUNT(*)::int as cnt FROM information_schema.tables WHERE table_name = 'contratos'"
      );
      const hasContratos = Number(tbl.rows[0].cnt) > 0;

      if (hasContratos) {
        // Criar um contrato relacionado (sem RLS constraints - usando perfil cadastro em query)
        const cadastroSession = {
          cpf: '00000000000',
          nome: 'test',
          perfil: 'cadastro',
          clinica_id: null,
        } as TestSession;
        const insertContrato = await query(
          `INSERT INTO contratos (contratante_id, plano_id, conteudo, aceito, ip_aceite, data_aceite)
           VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id`,
          [contratanteId, 1, 'Contrato de teste (integ)', false, '127.0.0.1'],
          cadastroSession
        );

        contratoId = insertContrato.rows[0].id as number;
        expect(contratoId).toBeGreaterThan(0);
      }

      // Agora apagar o contratante e verificar cascade (se aplicável)
      const del = await query(
        'DELETE FROM entidades WHERE id = $1 RETURNING id',
        [contratanteId]
      );
      expect(del.rowCount).toBe(1);

      if (hasContratos) {
        const chk = await query(
          'SELECT COUNT(*)::int as cnt FROM contratos WHERE contratante_id = $1',
          [contratanteId]
        );
        expect(Number(chk.rows[0].cnt)).toBe(0);
      }
    } finally {
      // Cleanup de segurança caso algo falhe
      if (contratoId) {
        await query('DELETE FROM contratos WHERE id = $1', [contratoId]).catch(
          () => {}
        );
      }
      if (contratanteId) {
        await query('DELETE FROM contratantes WHERE id = $1', [
          contratanteId,
        ]).catch(() => {});
      }
    }
  }, 20000);
});
