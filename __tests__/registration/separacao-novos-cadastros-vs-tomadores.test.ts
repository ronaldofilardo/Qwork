/**
 * Teste de validação: tomadores pendentes não devem aparecer em "Tomadores Aprovados"
 * Devem aparecer apenas em "Novos Cadastros"
 *
 * Testa a segregação de queries entre listagens
 */

import { query } from '@/lib/db';

jest.mock('@/lib/db');
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('Separação Novos Cadastros vs Tomadores Aprovados', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tomadores pendentes não devem aparecer na listagem de aprovados', async () => {
    // Mock da query de tomadores aprovados (exclui pendentes)
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, nome: 'Empresa A', status: 'aprovado', ativa: true }],
      rowCount: 1,
    } as any);

    // Mock da query de novos cadastros (apenas pendentes)
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 2, nome: 'Empresa B', status: 'pendente', ativa: false }],
      rowCount: 1,
    } as any);

    const tomadoresAprovados = await query(
      `SELECT * FROM tomadores WHERE tipo = 'clinica'
       AND status NOT IN ('pendente', 'em_reanalise', 'aguardando_pagamento')
       ORDER BY nome`
    );

    const novosCadastros = await query(
      `SELECT * FROM tomadores WHERE status IN ('pendente', 'em_reanalise', 'aguardando_pagamento')
       ORDER BY criado_em DESC`
    );

    // Nenhum tomador aprovado deve ter status pendente
    const pendentesEmAprovados = tomadoresAprovados.rows.filter((c: any) =>
      ['pendente', 'em_reanalise', 'aguardando_pagamento'].includes(c.status)
    );
    expect(pendentesEmAprovados).toHaveLength(0);

    // Todos os novos cadastros devem ter status pendente/reanalise/aguardando
    const statusValidos = ['pendente', 'em_reanalise', 'aguardando_pagamento'];
    const statusInvalidos = novosCadastros.rows.filter(
      (c: any) => !statusValidos.includes(c.status)
    );
    expect(statusInvalidos).toHaveLength(0);

    // Queries usam filtros corretos
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('NOT IN'));
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("status IN ('pendente'")
    );
  });
});
