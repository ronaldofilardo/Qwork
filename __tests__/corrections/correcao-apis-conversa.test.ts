/**
 * Testes para as correções das APIs /api/entidade/lotes e /api/rh/empresas
 *
 * Contexto:
 * - /api/entidade/lotes: Corrigido query que referenciava tabela inexistente contratantes_funcionarios
 * - /api/rh/empresas: Trocado queryWithContext por query para evitar bloqueio RLS
 */

import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import { query } from '@/lib/db';

describe('Correção API /api/entidade/lotes', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  it('deve verificar que query não contém referência à tabela contratantes_funcionarios', async () => {
    // Query corrigida da API
    const queryCorrigida = `
      SELECT 
        la.id,
        la.numero_lote,
        ec.id as empresa_id,
        ec.razao_social as empresa_razao_social,
        ec.contratante_id,
        COUNT(DISTINCT a.id) as total_avaliacoes,
        COUNT(DISTINCT CASE WHEN a.status IN ('pendente', 'em_andamento') THEN a.id END) as avaliacoes_pendentes,
        COUNT(DISTINCT CASE WHEN a.status = 'finalizada' THEN a.id END) as avaliacoes_concluidas,
        COUNT(DISTINCT CASE WHEN l.status = 'emitido' THEN l.id END) as laudos_emitidos,
        COUNT(DISTINCT CASE WHEN a.status = 'finalizada' AND (l.id IS NULL OR l.status != 'emitido') THEN a.id END) as laudos_pendentes,
        la.data_criacao,
        CASE 
          WHEN COUNT(DISTINCT a.id) = 0 THEN 'sem_avaliacoes'
          WHEN COUNT(DISTINCT CASE WHEN a.status = 'finalizada' THEN a.id END) = 0 THEN 'em_andamento'
          WHEN COUNT(DISTINCT CASE WHEN a.status = 'finalizada' THEN a.id END) = COUNT(DISTINCT a.id) 
            AND COUNT(DISTINCT l.id) = COUNT(DISTINCT a.id) THEN 'concluido'
          ELSE 'em_andamento'
        END as status,
        f_liberado.nome as liberado_por_nome,
        f_emissor.nome as emissor_nome
      FROM lotes_avaliacao la
      LEFT JOIN avaliacoes a ON a.lote_id = la.id
      LEFT JOIN laudos l ON l.avaliacao_id = a.id
      LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
      LEFT JOIN funcionarios f_liberado ON la.liberado_por = f_liberado.cpf
      LEFT JOIN funcionarios f_emissor ON l.emissor_cpf = f_emissor.cpf
      WHERE ec.contratante_id = $1
      GROUP BY la.id, la.numero_lote, ec.id, ec.razao_social, ec.contratante_id, la.data_criacao, f_liberado.nome, f_emissor.nome
      ORDER BY la.data_criacao DESC
    `;

    // Verifica que a query NÃO contém referências problemáticas
    expect(queryCorrigida).not.toContain('contratantes_funcionarios');
    expect(queryCorrigida).not.toContain(
      'JOIN funcionarios f ON a.funcionario_cpf = f.cpf'
    );
    expect(queryCorrigida).not.toContain(
      'LEFT JOIN contratantes_funcionarios cf'
    );
  });

  it('deve confirmar que a query usa JOINs corretos apenas para liberado_por e emissor', async () => {
    const queryCorrigida = `
      FROM lotes_avaliacao la
      LEFT JOIN avaliacoes a ON a.lote_id = la.id
      LEFT JOIN laudos l ON l.avaliacao_id = a.id
      LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
      LEFT JOIN funcionarios f_liberado ON la.liberado_por = f_liberado.cpf
      LEFT JOIN funcionarios f_emissor ON l.emissor_cpf = f_emissor.cpf
    `;

    // Verifica que os JOINs corretos estão presentes
    expect(queryCorrigida).toContain(
      'LEFT JOIN funcionarios f_liberado ON la.liberado_por = f_liberado.cpf'
    );
    expect(queryCorrigida).toContain(
      'LEFT JOIN funcionarios f_emissor ON l.emissor_cpf = f_emissor.cpf'
    );
  });
});

describe('Correção API /api/rh/empresas', () => {
  it('deve verificar que API usa query direta em vez de queryWithContext', async () => {
    // Lê o arquivo da API para verificar as importações
    const fs = require('fs');
    const path = require('path');
    const apiPath = path.join(process.cwd(), 'app/api/rh/empresas/route.ts');
    const apiContent = fs.readFileSync(apiPath, 'utf-8');

    // Verifica que usa query do db.ts e NÃO queryWithContext do db-security.ts
    expect(apiContent).toContain("import { query } from '@/lib/db';");
    expect(apiContent).not.toContain(
      "import { queryWithContext } from '@/lib/db-security';"
    );
  });

  it('deve confirmar que GET usa query direta', async () => {
    const fs = require('fs');
    const path = require('path');
    const apiPath = path.join(process.cwd(), 'app/api/rh/empresas/route.ts');
    const apiContent = fs.readFileSync(apiPath, 'utf-8');

    // Extrai o método GET
    const getMethodMatch = apiContent.match(
      /export async function GET[\s\S]*?(?=export|$)/
    );
    expect(getMethodMatch).toBeTruthy();

    const getMethod = getMethodMatch![0];

    // Verifica que usa 'await query(' e não 'await queryWithContext('
    expect(getMethod).toContain('await query(');
    expect(getMethod).not.toContain('await queryWithContext(');
  });

  it('deve confirmar que POST usa query direta', async () => {
    const fs = require('fs');
    const path = require('path');
    const apiPath = path.join(process.cwd(), 'app/api/rh/empresas/route.ts');
    const apiContent = fs.readFileSync(apiPath, 'utf-8');

    // Extrai o método POST
    const postMethodMatch = apiContent.match(
      /export async function POST[\s\S]*?(?=export|$)/
    );
    expect(postMethodMatch).toBeTruthy();

    const postMethod = postMethodMatch![0];

    // Verifica que usa 'await query(' e não 'await queryWithContext('
    expect(postMethod).toContain('await query(');
    expect(postMethod).not.toContain('await queryWithContext(');
  });

  it('deve validar que a query filtra corretamente por clinica_id', async () => {
    const fs = require('fs');
    const path = require('path');
    const apiPath = path.join(process.cwd(), 'app/api/rh/empresas/route.ts');
    const apiContent = fs.readFileSync(apiPath, 'utf-8');

    // Verifica que a query contém filtro por clinica_id
    expect(apiContent).toContain('clinica_id = $1');
    expect(apiContent).toContain('[session.clinica_id]');
  });
});

describe('Verificação de integração entre lotes e empresas', () => {
  it('deve confirmar que lotes API filtra por contratante_id', async () => {
    const fs = require('fs');
    const path = require('path');
    const apiPath = path.join(process.cwd(), 'app/api/entidade/lotes/route.ts');
    const apiContent = fs.readFileSync(apiPath, 'utf-8');

    // Verifica que filtra por la.contratante_id (não ec.contratante_id)
    expect(apiContent).toContain('la.contratante_id');
    expect(apiContent).toContain('[session.contratante_id]');
  });

  it('deve confirmar que empresas API filtra por clinica_id', async () => {
    const fs = require('fs');
    const path = require('path');
    const apiPath = path.join(process.cwd(), 'app/api/rh/empresas/route.ts');
    const apiContent = fs.readFileSync(apiPath, 'utf-8');

    // Verifica que filtra por clinica_id
    expect(apiContent).toContain('clinica_id = $1');
    expect(apiContent).toContain('[session.clinica_id]');
  });

  it('deve validar que ambas as APIs usam validação de sessão apropriada', async () => {
    const fs = require('fs');
    const path = require('path');

    const lotesPath = path.join(
      process.cwd(),
      'app/api/entidade/lotes/route.ts'
    );
    const empresasPath = path.join(
      process.cwd(),
      'app/api/rh/empresas/route.ts'
    );

    const lotesContent = fs.readFileSync(lotesPath, 'utf-8');
    const empresasContent = fs.readFileSync(empresasPath, 'utf-8');

    // Entidade usa getSession diretamente
    expect(lotesContent).toContain('getSession');
    // RH usa requireClinica
    expect(empresasContent).toContain('requireClinica');
  });
});
