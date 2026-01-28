import { gerarHTMLRelatorioIndividual } from '@/lib/templates/relatorio-individual-html';

describe('Template relatorio individual - compacto', () => {
  it('deve gerar HTML sem bloco de respostas e com grid de 3 colunas', () => {
    const dados = {
      funcionario: {
        nome: 'João Silva',
        cpf: '12345678901',
        perfil: 'operacional',
        empresa: 'ACME Ltda',
        setor: 'Operações',
        funcao: 'Operador',
        matricula: 'M-1234',
      },
      lote: { id: 1, codigo: '013-180126', titulo: 'Lote Teste' },
      envio: new Date().toISOString(),
      grupos: [
        {
          id: 1,
          titulo: 'Grupo 1',
          dominio: 'Domínio 1',
          media: '31.3',
          classificacao: 'verde',
          corClassificacao: '#10b981',
          respostas: [],
        },
        {
          id: 2,
          titulo: 'Grupo 2',
          dominio: 'Domínio 2',
          media: '56.3',
          classificacao: 'amarelo',
          corClassificacao: '#f59e0b',
          respostas: [],
        },
        {
          id: 10,
          titulo: 'Grupo 10 - Endividamento',
          dominio: 'Endividamento Financeiro',
          media: '75.0',
          classificacao: 'vermelho',
          corClassificacao: '#ef4444',
          respostas: [],
        },
      ],
    };

    const html = gerarHTMLRelatorioIndividual(dados as any);

    // Não deve conter bloco de respostas
    expect(html).not.toContain('respostas-lista');
    expect(html).not.toContain('resposta-item');

    // Deve usar grid de 3 colunas para compactação
    expect(html).toMatch(/grid-template-columns:\s*repeat\(3,\s*1fr\)/);

    // Título do grupo não deve repetir prefixo 'Grupo N - '
    expect(html).not.toContain('Grupo 10 - Endividamento');
    expect(html).toContain('Endividamento');
    expect(html).toContain('G10');

    // Deve incluir símbolo '%' pequeno ao lado do valor
    expect(html).toContain('<span class="percent">%</span>');

    // Font-size da media reduzida (~17pt)
    expect(html).toMatch(/font-size:\s*17pt/);

    // Slogan removido
    expect(html).not.toContain('AVALIE. PREVINA. PROTEJA.');

    // Deve apresentar as médias dos grupos
    expect(html).toContain('31.3');
    expect(html).toContain('56.3');
    expect(html).toContain('75.0');
  });
});
