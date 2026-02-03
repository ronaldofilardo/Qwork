import { gerarHTMLRelatorioIndividual } from '@/lib/templates/relatorio-individual-html';

describe('gerarHTMLRelatorioIndividual', () => {
  it('deve retornar HTML contendo título, dados do funcionário e grupos', () => {
    const html = gerarHTMLRelatorioIndividual({
      funcionario: {
        nome: 'Fulano Teste',
        cpf: '12345678901',
        perfil: 'operacional',
        empresa: 'ACME',
        setor: 'Operações',
        funcao: 'Analista',
        matricula: 'A1',
      },
      lote: { id: 1, codigo: 'L1', titulo: 'Lote 1' },
      envio: '01/02/2026, 10:00:00',
      grupos: [
        {
          id: 1,
          titulo: 'Grupo 1',
          dominio: 'Demandas',
          media: '62.5',
          classificacao: 'amarelo',
          corClassificacao: '#f59e0b',
        },
        {
          id: 2,
          titulo: 'Grupo 2',
          dominio: 'Organização',
          media: '95',
          classificacao: 'verde',
          corClassificacao: '#166534',
        },
      ],
    } as any);

    expect(html).toContain('Relatório Individual de Avaliação');
    expect(html).toContain('Fulano Teste');
    expect(html).toContain('CPF');
    expect(html).toContain('Lote 1');
    expect(html).toContain('Demandas - Grupo 1 - Grupo 1');
    expect(html).toContain('Média: 62.5');
  });
});
