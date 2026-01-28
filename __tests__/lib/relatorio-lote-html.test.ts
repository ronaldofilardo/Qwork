import { gerarHTMLRelatorioLote } from '@/lib/templates/relatorio-lote-html';

describe('Template relatorio lote - compact', () => {
  it('deve gerar HTML com logo menor e % ao lado do valor', () => {
    const dados = {
      lote: { codigo: '013-180126', titulo: 'Lote Teste' },
      empresa: 'ACME Ltda',
      totalFuncionarios: 1,
      funcionarios: [
        {
          nome: 'João Silva',
          cpf: '12345678901',
          perfil: 'operacional',
          envio: new Date().toISOString(),
          grupos: [
            {
              id: 1,
              titulo: 'Grupo 1',
              dominio: 'Domínio 1',
              media: '31.3',
              classificacao: 'verde',
            },
          ],
        },
      ],
    };

    const html = gerarHTMLRelatorioLote(dados as any);

    expect(html).toMatch(/width:\s*160px/);
    expect(html).toContain('<span class="percent">%</span>');
    expect(html).toMatch(/font-size:\s*15pt/);
  });
});
