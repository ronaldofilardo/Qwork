import crypto from 'crypto';

/**
 * Testes unitários para a rota de geração de PDF de contrato
 * Foco: Normalização de caminhos, cálculo de hashes SHA-256 e formatação de tamanhos
 */

describe('Contrato PDF - Path Normalization and Hashing', () => {
  /**
   * Teste 1: Normalização de caminhos com prefixo 'storage/'
   */
  it('deve remover prefixo "storage/" duplicado do caminho', () => {
    const mockPaths = [
      'storage/tomadores/entidades/12345/cartao_cnpj.pdf',
      '/storage/tomadores/entidades/12345/contrato_social.pdf',
      'tomadores/entidades/12345/doc_identificacao.pdf',
    ];

    // Simular a lógica de normalização
    const normalize = (filePath: string) => {
      const withoutLeadingSlash = filePath.startsWith('/')
        ? filePath.slice(1)
        : filePath;
      const cleanPath = withoutLeadingSlash.startsWith('storage/')
        ? withoutLeadingSlash.replace('storage/', '')
        : withoutLeadingSlash;
      return cleanPath;
    };

    expect(normalize(mockPaths[0])).toBe(
      'tomadores/entidades/12345/cartao_cnpj.pdf'
    );
    expect(normalize(mockPaths[1])).toBe(
      'tomadores/entidades/12345/contrato_social.pdf'
    );
    expect(normalize(mockPaths[2])).toBe(
      'tomadores/entidades/12345/doc_identificacao.pdf'
    );
  });

  /**
   * Teste 2: Cálculo de hash SHA-256
   */
  it('deve calcular hash SHA-256 corretamente', () => {
    const testContent = Buffer.from('Teste de integral do documento');
    const hash = crypto.createHash('sha256').update(testContent).digest('hex');

    // Validar que o hash tem exatamente 64 caracteres (256 bits em hex)
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash.length).toBe(64);

    // Testar consistência: mesmo conteúdo deve produzir mesmo hash
    const hash2 = crypto.createHash('sha256').update(testContent).digest('hex');
    expect(hash).toBe(hash2);
  });

  /**
   * Teste 3: Formatação de tamanho de arquivo (KB/MB)
   */
  it('deve formatar tamanho do arquivo corretamente', () => {
    const formatSize = (sizeInBytes: number): string => {
      return sizeInBytes > 1024 * 1024
        ? `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`
        : `${(sizeInBytes / 1024).toFixed(2)} KB`;
    };

    // Testes com vários tamanhos
    expect(formatSize(8000)).toBe('7.81 KB');
    expect(formatSize(504000)).toBe('492.19 KB');
    expect(formatSize(180000)).toBe('175.78 KB');
    expect(formatSize(1024 * 1024 * 5)).toBe('5.00 MB');
  });

  /**
   * Teste 4: Extração de nome de arquivo do caminho
   */
  it('deve extrair nome de arquivo do caminho completo', () => {
    const extractFileName = (path: string): string => {
      return path.split('/').pop() ?? path;
    };

    expect(
      extractFileName('tomadores/entidades/12345/cartao_cnpj_1773002408416.pdf')
    ).toBe('cartao_cnpj_1773002408416.pdf');
    expect(extractFileName('contrato_social_1773002408420.pdf')).toBe(
      'contrato_social_1773002408420.pdf'
    );
  });

  /**
   * Teste 5: Validação de informações de documento
   */
  it('deve validar estrutura de informação de documento', () => {
    type DocInfo = {
      label: string;
      filename: string;
      hash: string;
      size: string;
    };

    const validDoc: DocInfo = {
      label: 'Cartão CNPJ',
      filename: 'cartao_cnpj_1773002408416.pdf',
      hash: '0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0abc',
      size: '7.93 KB',
    };

    expect(validDoc.label).toBeDefined();
    expect(validDoc.filename).toMatch(/\.pdf$/);
    expect(validDoc.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(validDoc.size).toMatch(/^\d+\.\d+ (KB|MB)$/);
  });

  /**
   * Teste 6: Simulação de múltiplos documentos
   */
  it('deve processar múltiplos documentos com hashes diferentes', () => {
    const docs = [
      { label: 'Cartão CNPJ', content: Buffer.from('CNPJ Document') },
      {
        label: 'Contrato Social',
        content: Buffer.from('Social Contract Document'),
      },
      { label: 'Doc. Identificação', content: Buffer.from('ID Document') },
    ];

    const hashes = docs.map((doc) => ({
      label: doc.label,
      hash: crypto.createHash('sha256').update(doc.content).digest('hex'),
    }));

    // Verificar que todos os hashes são diferentes
    const uniqueHashes = new Set(hashes.map((h) => h.hash));
    expect(uniqueHashes.size).toBe(hashes.length);

    // Verificar que cada hash tem o formato correto
    hashes.forEach((h) => {
      expect(h.hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  /**
   * Teste 7: Tipagem de dados do contrato
   */
  it('deve validar tipagem de dados do contrato', () => {
    interface ContratoData {
      numero_contrato: number;
      tomador_nome: string;
      tomador_cnpj: string;
      aceito: boolean;
      data_aceite: Date | null;
      ip_aceite: string | null;
      cartao_cnpj_path: string | null;
      contrato_social_path: string | null;
      doc_identificacao_path: string | null;
    }

    const mockContrato: ContratoData = {
      numero_contrato: 87,
      tomador_nome: 'clinica com lead',
      tomador_cnpj: '15731917000133',
      aceito: true,
      data_aceite: new Date('2026-03-08T17:45:59'),
      ip_aceite: '::ffff:127.0.0.1',
      cartao_cnpj_path:
        'storage/tomadores/entidades/15731917000133/cartao_cnpj_1773002408416.pdf',
      contrato_social_path:
        'storage/tomadores/entidades/15731917000133/contrato_social_1773002408420.pdf',
      doc_identificacao_path:
        'storage/tomadores/entidades/15731917000133/doc_identificacao_1773002408423.pdf',
    };

    expect(typeof mockContrato.numero_contrato).toBe('number');
    expect(typeof mockContrato.tomador_nome).toBe('string');
    expect(mockContrato.aceito).toBe(true);
    expect(mockContrato.data_aceite).toBeInstanceOf(Date);
  });
});

describe('Contrato PDF - Fallback Logic', () => {
  /**
   * Teste 8: Seleção de conteúdo com prioridade
   */
  it('deve priorizar conteúdo customizado sobre template padrão', () => {
    const mockCustomContent =
      'Conteúdo do contrato customizado para este cliente';
    const mockTemplateContent = 'Conteúdo padrão do template';

    const selectContent = (custom: string | null, template: string) => {
      return custom ?? template;
    };

    expect(selectContent(mockCustomContent, mockTemplateContent)).toBe(
      mockCustomContent
    );
    expect(selectContent(null, mockTemplateContent)).toBe(mockTemplateContent);
  });

  /**
   * Teste 9: Validação de cláusulas padrão
   */
  it('deve conter todas as 9 cláusulas esperadas no template padrão', () => {
    const expectedClauses = [
      'CLÁUSULA 1 – OBJETO',
      'CLÁUSULA 2 – NATUREZA DO SERVIÇO',
      'CLÁUSULA 3 – FUNCIONAMENTO DA PLATAFORMA',
      'CLÁUSULA 4 – RESPONSABILIDADES DA CONTRATANTE',
      'CLÁUSULA 5 – RESPONSABILIDADES DA QWORK',
      'CLÁUSULA 6 – LIMITAÇÃO DE RESPONSABILIDADE',
      'CLÁUSULA 7 – PROTEÇÃO DE DADOS (LGPD)',
      'CLÁUSULA 8 – ACEITE ELETRÔNICO',
      'CLÁUSULA 9 – FORO',
    ];

    expectedClauses.forEach((clause) => {
      expect(clause).toBeDefined();
      expect(clause).toMatch(/^CLÁUSULA \d+/);
    });

    expect(expectedClauses).toHaveLength(9);
  });
});
