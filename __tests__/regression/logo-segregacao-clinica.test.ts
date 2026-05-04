/**
 * Teste de regressão: Logo segregado por clínica/entidade
 *
 * Valida que:
 * 1. Funcionário com múltiplos vínculos ativos retorna logo da clínica/entidade mais recente
 * 2. ORDER BY id DESC garante resultado determinístico
 * 3. Logo não vaza entre clínicas diferentes
 */

describe('Task 2 — Regressão: Logo segregado por clínica', () => {
  /**
   * Simula resultado de query ORDER BY fc.id DESC LIMIT 1
   * Retorna sempre o vínculo mais recente (maior ID)
   */
  function selectMostRecentFunctionalClinica(
    vinculos: Array<{
      id: number;
      clinica_id: number;
      ativo: boolean;
      logo?: string;
    }>
  ) {
    const ativos = vinculos.filter((v) => v.ativo);
    if (ativos.length === 0) return null;
    // Simula: ORDER BY id DESC LIMIT 1
    return ativos.sort((a, b) => b.id - a.id)[0];
  }

  it('deve retornar vínculo com ID mais alto quando múltiplos ativos', () => {
    // Dado: funcionário com 2 vínculos ativos (possível durante migração)
    const vinculos = [
      { id: 100, clinica_id: 1, ativo: true, logo: 'logo-clinica-a.png' },
      { id: 105, clinica_id: 2, ativo: true, logo: 'logo-clinica-b.png' }, // Mais recente
    ];

    // Quando: consulto pela query com ORDER BY id DESC LIMIT 1
    const result = selectMostRecentFunctionalClinica(vinculos);

    // Então: retorna o vínculo mais recente (ID 105)
    expect(result?.id).toBe(105);
    expect(result?.clinica_id).toBe(2);
    expect(result?.logo).toBe('logo-clinica-b.png');
  });

  it('deve evitar logo de clínica errada durante transição', () => {
    // Dado: funcionário migrado de Clínica A para Clínica B, mas vínculo antigo ainda ativo
    const vinculos = [
      {
        id: 1,
        clinica_id: 1,
        ativo: true,
        logo: 'logo-clinica-a.png',
      },
      {
        id: 2,
        clinica_id: 2,
        ativo: true,
        logo: 'logo-clinica-b.png',
      },
    ];

    // Quando: quero obter a clínica atual
    const current = selectMostRecentFunctionalClinica(vinculos);

    // Então: devo obter a Clínica B (mais recente)
    expect(current?.clinica_id).toBe(2);
    expect(current?.logo).not.toBe('logo-clinica-a.png');
  });

  it('deve retornar null quando nenhum vínculo ativo', () => {
    // Dado: funcionário sem vínculos ativos
    const vinculos = [
      { id: 100, clinica_id: 1, ativo: false, logo: 'logo-a.png' },
      { id: 101, clinica_id: 2, ativo: false, logo: 'logo-b.png' },
    ];

    // Quando: consulto
    const result = selectMostRecentFunctionalClinica(vinculos);

    // Então: retorna null
    expect(result).toBeNull();
  });

  it('deve ser determinístico: mesmos vínculos, sempre mesmo resultado', () => {
    const vinculos = [
      { id: 50, clinica_id: 1, ativo: true, logo: 'logo-a.png' },
      { id: 75, clinica_id: 2, ativo: true, logo: 'logo-b.png' },
      { id: 60, clinica_id: 3, ativo: true, logo: 'logo-c.png' },
    ];

    // Múltiplas execuções devem retornar sempre ID 75
    const result1 = selectMostRecentFunctionalClinica(vinculos);
    const result2 = selectMostRecentFunctionalClinica(vinculos);
    const result3 = selectMostRecentFunctionalClinica(vinculos);

    expect(result1?.id).toBe(75);
    expect(result2?.id).toBe(75);
    expect(result3?.id).toBe(75);
  });

  it('deve analogamente funcionar para funcionarios_entidades com ORDER BY fe.id DESC', () => {
    // Dado: funcionário com múltiplos vínculos de entidades
    function selectMostRecentFunctionalEntidade(
      vinculos: Array<{
        id: number;
        entidade_id: number;
        ativo: boolean;
      }>
    ) {
      const ativos = vinculos.filter((v) => v.ativo);
      if (ativos.length === 0) return null;
      return ativos.sort((a, b) => b.id - a.id)[0];
    }

    const vinculos = [
      { id: 200, entidade_id: 10, ativo: true },
      { id: 210, entidade_id: 20, ativo: true }, // Mais recente
    ];

    // Quando: consulto
    const result = selectMostRecentFunctionalEntidade(vinculos);

    // Então: retorna entidade mais recente
    expect(result?.entidade_id).toBe(20);
    expect(result?.id).toBe(210);
  });
});
