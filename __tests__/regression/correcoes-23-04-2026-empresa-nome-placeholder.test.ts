/**
 * Testes de regressão para a correção de 23/04/2026:
 *
 * COMPORTAMENTO CORRIGIDO:
 *   Na 1ª importação sem coluna empresa_nome, o sistema criava a empresa com
 *   nome placeholder ("Empresa 12.345.678/0001-99" ou "Empresa Desconhecida").
 *   Na 2ª importação com o nome real, o sistema encontrava a empresa pelo CNPJ
 *   mas apenas reutilizava o ID — o placeholder ficava permanentemente no banco.
 *
 * COBERTURA:
 *  1. isNomePlaceholder: detecta corretamente placeholders gerados pelo sistema
 *  2. Não sobrescreve nomes reais com nome vazio
 *  3. Não sobrescreve nomes reais com outro nome real
 *  4. Sobrescreve placeholder com nome real
 *  5. Não sobrescreve placeholder com outro placeholder
 */

// ============================================================
// Helper isNomePlaceholder — regras de detecção
// ============================================================

/**
 * Replica exata da função isNomePlaceholder definida nos dois route handlers.
 * Mantida aqui para testes unitários independentes de banco de dados.
 */
function isNomePlaceholder(nome: string): boolean {
  if (nome === 'Empresa Desconhecida') return true;
  if (/^Empresa \d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(nome)) return true;
  return false;
}

/**
 * Lógica de decisão de atualização de nome, extraída dos route handlers.
 * Retorna true se o nome deve ser atualizado.
 */
function deveAtualizarNome(nomeAtual: string, nomeNovo: string): boolean {
  if (!nomeNovo || !nomeNovo.trim()) return false;
  if (!isNomePlaceholder(nomeAtual)) return false;
  if (isNomePlaceholder(nomeNovo.trim())) return false;
  return true;
}

describe('isNomePlaceholder — detecção de nomes gerados automaticamente', () => {
  describe('placeholders reconhecidos', () => {
    it('reconhece "Empresa Desconhecida"', () => {
      expect(isNomePlaceholder('Empresa Desconhecida')).toBe(true);
    });

    it('reconhece "Empresa XX.XXX.XXX/XXXX-XX" (CNPJ formatado)', () => {
      expect(isNomePlaceholder('Empresa 12.345.678/0001-99')).toBe(true);
    });

    it('reconhece variações de CNPJ formatado', () => {
      expect(isNomePlaceholder('Empresa 00.000.000/0001-00')).toBe(true);
      expect(isNomePlaceholder('Empresa 99.999.999/9999-99')).toBe(true);
    });
  });

  describe('nomes reais não são confundidos com placeholder', () => {
    it('não classifica nome real como placeholder', () => {
      expect(isNomePlaceholder('Acme Serviços Ltda')).toBe(false);
    });

    it('não classifica nome vazio como placeholder', () => {
      expect(isNomePlaceholder('')).toBe(false);
    });

    it('não classifica nome com "Empresa" mas sem CNPJ formatado como placeholder', () => {
      expect(isNomePlaceholder('Empresa Alpha')).toBe(false);
    });

    it('não classifica CNPJ não formatado como placeholder', () => {
      expect(isNomePlaceholder('Empresa 12345678000199')).toBe(false);
    });

    it('não classifica CNPJ com pontuação incompleta como placeholder', () => {
      expect(isNomePlaceholder('Empresa 12.345.678/000199')).toBe(false);
    });
  });
});

describe('deveAtualizarNome — lógica de decisão de atualização', () => {
  describe('casos que DEVEM atualizar', () => {
    it('placeholder "Empresa Desconhecida" + nome real → atualiza', () => {
      expect(deveAtualizarNome('Empresa Desconhecida', 'Acme Ltda')).toBe(true);
    });

    it('placeholder com CNPJ formatado + nome real → atualiza', () => {
      expect(
        deveAtualizarNome('Empresa 12.345.678/0001-99', 'Transporte XYZ')
      ).toBe(true);
    });

    it('placeholder com espaços no nome novo (trim) → atualiza', () => {
      expect(
        deveAtualizarNome('Empresa Desconhecida', '  Acme Ltda  ')
      ).toBe(true);
    });
  });

  describe('casos que NÃO devem atualizar', () => {
    it('nome real existente + nome real novo → não sobrescreve', () => {
      expect(deveAtualizarNome('Acme Ltda', 'Beta Corp')).toBe(false);
    });

    it('nome real existente + nome vazio → não sobrescreve', () => {
      expect(deveAtualizarNome('Acme Ltda', '')).toBe(false);
    });

    it('placeholder + nome vazio (sem nome na planilha) → não atualiza', () => {
      expect(deveAtualizarNome('Empresa Desconhecida', '')).toBe(false);
    });

    it('placeholder + espaços apenas → não atualiza', () => {
      expect(deveAtualizarNome('Empresa Desconhecida', '   ')).toBe(false);
    });

    it('placeholder + outro placeholder (CNPJ) → não atualiza', () => {
      expect(
        deveAtualizarNome(
          'Empresa 12.345.678/0001-99',
          'Empresa 12.345.678/0001-99'
        )
      ).toBe(false);
    });

    it('placeholder + "Empresa Desconhecida" → não atualiza', () => {
      expect(
        deveAtualizarNome('Empresa 12.345.678/0001-99', 'Empresa Desconhecida')
      ).toBe(false);
    });
  });
});

// ============================================================
// Cenários de negócio end-to-end (comportamento esperado)
// ============================================================

describe('cenários de importação em 2 etapas', () => {
  it('1ª import (sem nome) → empresa criada com placeholder CNPJ', () => {
    // Simula o que acontece na 1ª importação quando empresa_nome não está mapeada
    const nomeRaw = ''; // planilha não tem coluna empresa_nome
    const cnpj = '12345678000199';
    const cnpjFmt = cnpj.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5'
    );
    const nomeFinal = nomeRaw.trim() || (cnpjFmt ? `Empresa ${cnpjFmt}` : 'Empresa Desconhecida');
    expect(nomeFinal).toBe('Empresa 12.345.678/0001-99');
    expect(isNomePlaceholder(nomeFinal)).toBe(true);
  });

  it('2ª import (com nome real) → detecta placeholder e sinaliza para UPDATE', () => {
    const nomeNoBanco = 'Empresa 12.345.678/0001-99'; // criado na 1ª import
    const nomeNaPlilha = 'Transporte Santos Ltda';     // 2ª import com nome real
    expect(deveAtualizarNome(nomeNoBanco, nomeNaPlilha)).toBe(true);
  });

  it('3ª import (mesmo nome real) → nome já real, NÃO sobrescreve', () => {
    const nomeNoBanco = 'Transporte Santos Ltda'; // atualizado na 2ª import
    const nomeNaPlanilha = 'Transporte Santos Ltda';
    expect(deveAtualizarNome(nomeNoBanco, nomeNaPlanilha)).toBe(false);
  });

  it('import sem CNPJ → placeholder "Empresa Desconhecida" é detectado', () => {
    const nomeRaw = '';
    const cnpj = '';
    const cnpjFmt = cnpj.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5'
    );
    const nomeFinal = nomeRaw.trim() || (cnpjFmt ? `Empresa ${cnpjFmt}` : 'Empresa Desconhecida');
    expect(nomeFinal).toBe('Empresa Desconhecida');
    expect(isNomePlaceholder(nomeFinal)).toBe(true);
  });
});
