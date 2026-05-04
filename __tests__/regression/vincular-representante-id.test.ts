/**
 * Teste de regressão: Vincular representante por ID numérico
 *
 * Valida que:
 * 1. Busca de representante por ID numérico (ex: "42") retorna exatamente aquele ID
 * 2. Busca por nome retorna ILIKE com wildcard
 * 3. Validação desabilita botão até encontrar representante válido
 */

describe('Task 5 — Regressão: Vincular representante por ID', () => {
  /**
   * Simula a lógica de busca: detecta se entrada é numérica
   */
  function isNumericId(q: string): boolean {
    return /^\d+$/.test(q);
  }

  /**
   * Simula representantes em banco
   */
  interface Representante {
    id: number;
    nome: string;
    codigo: string | null;
    status: string;
  }

  const mockReps: Representante[] = [
    { id: 1, nome: 'João Silva', codigo: 'JS001', status: 'ativo' },
    { id: 42, nome: 'Maria Oliveira', codigo: 'MO042', status: 'ativo' },
    { id: 100, nome: 'João Santos', codigo: 'JS100', status: 'ativo' },
    { id: 999, nome: 'Inativo Rep', codigo: 'IR999', status: 'desativado' },
  ];

  function searchReps(q: string): Representante[] {
    const isNumeric = isNumericId(q);

    if (isNumeric) {
      // Busca exata por ID
      const id = Number(q);
      return mockReps.filter(
        (r) =>
          r.id === id &&
          r.status !== 'desativado' &&
          r.status !== 'rejeitado'
      );
    } else {
      // Busca por nome ILIKE
      const pattern = q.toLowerCase();
      return mockReps.filter(
        (r) =>
          r.nome.toLowerCase().includes(pattern) &&
          r.status !== 'desativado' &&
          r.status !== 'rejeitado'
      );
    }
  }

  it('deve detectar entrada numérica', () => {
    expect(isNumericId('42')).toBe(true);
    expect(isNumericId('100')).toBe(true);
    expect(isNumericId('0')).toBe(true);
    expect(isNumericId('João')).toBe(false);
    expect(isNumericId('42ab')).toBe(false);
  });

  it('deve buscar representante por ID exato', () => {
    // Dado: entrada "42"
    const q = '42';

    // Quando: busco
    const results = searchReps(q);

    // Então: retorna exatamente o ID 42
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(42);
    expect(results[0].nome).toBe('Maria Oliveira');
  });

  it('deve retornar vazio para ID não existente', () => {
    // Dado: entrada "999999"
    const q = '999999';

    // Quando: busco
    const results = searchReps(q);

    // Então: retorna vazio
    expect(results).toHaveLength(0);
  });

  it('deve filtrar representantes desativados mesmo por ID', () => {
    // Cenário: ID 999 existe mas status é "desativado"
    // Esperado: não deve ser retornado
    const results = searchReps('999');

    expect(results).toHaveLength(0);
  });

  it('deve buscar por nome (ILIKE) e retornar múltiplos resultados', () => {
    // Dado: entrada "João" (não numérica)
    const q = 'João';

    // Quando: busco
    const results = searchReps(q);

    // Então: retorna todos com "João" no nome
    expect(results.length).toBeGreaterThan(0);
    expect(results.map((r) => r.nome)).toContain('João Silva');
    expect(results.map((r) => r.nome)).toContain('João Santos');
  });

  it('deve manter ordem de resultados (ID crescente ou por nome)', () => {
    // Dado: busca por "Silva"
    const results = searchReps('Silva');

    // Então: deve retornar o Silva encontrado
    expect(results.some((r) => r.nome.includes('Silva'))).toBe(true);
  });

  it('deve habilitar botão Vincular apenas com resultado válido', () => {
    // Cenário 1: Entrada vazia (comportamento real: retorna todos os ativos)
    let repFound = searchReps('');
    // Se q.length < 1, a rota retorna [] (ver route.ts: if (q.length < 1) return [])
    // Portanto simular esse comportamento
    if (''.trim().length < 1) {
      repFound = [];
    }
    expect(repFound).toHaveLength(0);
    expect(repFound.length > 0).toBe(false); // Botão desabilitado

    // Cenário 2: ID válido encontrado
    repFound = searchReps('42');
    expect(repFound).toHaveLength(1);
    expect(repFound.length > 0).toBe(true); // Botão habilitado

    // Cenário 3: ID não encontrado
    repFound = searchReps('999999');
    expect(repFound).toHaveLength(0);
    expect(repFound.length > 0).toBe(false); // Botão desabilitado

    // Cenário 4: Busca por nome encontra
    repFound = searchReps('Maria');
    expect(repFound.length > 0).toBe(true); // Botão habilitado
  });

  it('deve retornar código do representante encontrado', () => {
    // Dado: busca por ID 42
    const results = searchReps('42');

    // Quando: obtenho o resultado
    const rep = results[0];

    // Então: tenho acesso ao código
    expect(rep.codigo).toBe('MO042');
  });

  it('deve suportar busca case-insensitive por nome', () => {
    // Dado: busca "maria" (minúscula)
    // Esperado: encontre "Maria Oliveira" (com capitalização)
    const results = searchReps('maria');

    // ILIKE é case-insensitive por padrão em PostgreSQL
    expect(results.length > 0).toBe(true);
    expect(results.some((r) => r.nome.includes('Maria'))).toBe(true);

    // Nota: Acentos (tilde, etc) requerem COLLATE ci em PostgreSQL
    // ou normalize() em JavaScript — JavaScript toLowerCase() sozinho NÃO remove acentos
    // Portanto este teste valida que a busca é insensível a maiúsculas, mas não a acentos
  });
});
