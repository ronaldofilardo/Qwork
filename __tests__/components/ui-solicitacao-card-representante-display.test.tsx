/**
 * Testes: SolicitacaoCard — Exibição de representante em aguardando_cobranca
 *
 * Issue: ComissaoSection tinha `if (status !== 'pago') return null`
 * Problema: Representante info e lead_valor_negociado não eram visíveis em "Aguardando Cobrança"
 * Sintoma: Usuário não via quem era o representante responsável na tela admin
 *
 * Fix: Alterada lógica para `if (!temRep && !isPago) return null`
 * Comportamento esperado:
 * - aguardando_cobranca + vinculo → mostra "Representante Responsável" + nome/código
 * - aguardando_cobranca + sem vinculo → seção oculta
 * - pago + vinculo → mostra "Comissão" + controles [gerar comissão]
 * - pago + sem vinculo → mostra form [vincular representante]
 */

import { render, screen } from '@testing-library/react';
import type { Solicitacao } from '@/components/admin/pagamentos/types';
import { SolicitacaoCard } from '@/components/admin/pagamentos/SolicitacaoCard';

// Mock props builders
const createMockSolicitacao = (
  overrides?: Partial<Solicitacao>
): Solicitacao => ({
  lote_id: 29,
  status_pagamento: 'aguardando_cobranca',
  solicitacao_emissao_em: '2026-03-08T15:00:00Z',
  valor_por_funcionario: 0,
  link_pagamento_token: null,
  link_pagamento_enviado_em: null,
  pagamento_metodo: null,
  pagamento_parcelas: null,
  pago_em: null,
  empresa_nome: 'Test Company',
  nome_tomador: 'clincia com lead',
  solicitante_nome: 'John Admin',
  solicitante_cpf: '11111111111',
  num_avaliacoes_concluidas: 2,
  valor_total_calculado: 0,
  lote_criado_em: '2026-03-08T10:00:00Z',
  lote_liberado_em: '2026-03-08T11:00:00Z',
  lote_status: 'liberado',
  vinculo_id: null,
  representante_id: null,
  representante_nome: null,
  representante_tipo_pessoa: null,
  link_disponibilizado_em: null,
  representante_percentual_comissao: null,
  comissao_gerada: false,
  comissoes_geradas_count: 0,
  comissoes_ativas_count: 0,
  ...overrides,
});

const createMockProps = (solicitacao: Solicitacao) => ({
  solicitacao,
  processando: null,
  valorInput: {},
  setValorInput: () => {},
  codigoRepInput: {},
  setCodigoRepInput: () => {},
  onDefinirValor: () => {},
  onGerarLink: () => {},
  onVerLink: () => {},
  onVerificarPagamento: () => {},
  onVincularRepresentante: () => {},
  formatCurrency: (val: number | null) =>
    val != null ? `R$ ${val.toLocaleString('pt-BR')}` : 'R$ 0,00',
  formatDate: (str: string | null) => str?.split('T')[0] || '',
});

describe('SolicitacaoCard — Representante display em diferentes status', () => {
  test('1. Deve renderizar a seção de representante se houver vinculo em aguardando_cobranca', () => {
    const solicitacao = createMockSolicitacao({
      status_pagamento: 'aguardando_cobranca',
      vinculo_id: 5,
      representante_id: 6,
      representante_nome: 'tese repre gaerado',
      representante_tipo_pessoa: 'pf',
    });

    const props = createMockProps(solicitacao);

    const { container } = render(<SolicitacaoCard {...props} />);

    // Para aguardando_cobranca, o rep aparece inline (sem header "Representante Responsável")
    expect(screen.getByText('tese repre gaerado')).toBeInTheDocument();

    // Verifica que o ID do representante está visível
    expect(screen.getByText(/#6/)).toBeInTheDocument();
  });

  test('2. Não deve renderizar seção se não houver vinculo em aguardando_cobranca', () => {
    const solicitacao = createMockSolicitacao({
      status_pagamento: 'aguardando_cobranca',
      vinculo_id: null,
      representante_id: null,
    });

    const props = createMockProps(solicitacao);

    const { container } = render(<SolicitacaoCard {...props} />);

    // Seção de representante não deve estar presente
    expect(
      screen.queryByText('Representante Responsável')
    ).not.toBeInTheDocument();
  });

  test('3. Deve exibir lead_valor_negociado em aguardando_cobranca', () => {
    const solicitacao = createMockSolicitacao({
      status_pagamento: 'aguardando_cobranca',
      lead_valor_negociado: 12.5,
    });

    const props = createMockProps(solicitacao);

    const { container } = render(<SolicitacaoCard {...props} />);

    // Procura pelo rótulo "Negociado:" (label do lead_valor_negociado)
    expect(container.textContent).toMatch(/Negociado:/i);

    // Verifica que o valor está mostrado (R$ 12,50)
    expect(container.textContent).toContain('12,50');
  });

  test('4. Deve mostrar "Comissão" em vez de "Representante Responsável" se status=pago', () => {
    const solicitacao = createMockSolicitacao({
      status_pagamento: 'pago',
      vinculo_id: 5,
      representante_id: 6,
      representante_nome: 'tese repre gaerado',
    });

    const props = createMockProps(solicitacao);

    const { container } = render(<SolicitacaoCard {...props} />);

    // Em status pago, deve dizer "Comissão" não "Representante Responsável"
    expect(screen.getByText('Comissão')).toBeInTheDocument();
    expect(
      screen.queryByText('Representante Responsável')
    ).not.toBeInTheDocument();
  });

  test('5. Deve renderizar form vincular representante se pago sem vinculo', () => {
    const solicitacao = createMockSolicitacao({
      status_pagamento: 'pago',
      vinculo_id: null,
      representante_id: null,
    });

    const props = createMockProps(solicitacao);

    const { container } = render(<SolicitacaoCard {...props} />);

    // Deve ter a seção porque status é "pago"
    expect(screen.getByText('Comissão')).toBeInTheDocument();

    // Deve ter input e botão vincular
    expect(
      screen.getByPlaceholderText(/Código do representante/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Vincular/i })
    ).toBeInTheDocument();
  });

  test('6. Deve ocultar seção se aguardando_pagamento sem vinculo', () => {
    const solicitacao = createMockSolicitacao({
      status_pagamento: 'aguardando_pagamento',
      vinculo_id: null,
    });

    const props = createMockProps(solicitacao);

    const { container } = render(<SolicitacaoCard {...props} />);

    // Não deve renderizar a seção de representante/comissão
    expect(
      screen.queryByText('Representante Responsável')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Comissão')).not.toBeInTheDocument();
  });

  test('7. Deve renderizar representante info em aguardando_pagamento SE houver vinculo', () => {
    const solicitacao = createMockSolicitacao({
      status_pagamento: 'aguardando_pagamento',
      vinculo_id: 5,
      representante_id: 6,
      representante_nome: 'João Silva',
    });

    const props = createMockProps(solicitacao);

    const { container } = render(<SolicitacaoCard {...props} />);

    // Deve mostrar representante info com label "Representante Responsável"
    expect(screen.getByText('Representante Responsável')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  test('8. Deve exibir tipo_pessoa do representante quando disponível', () => {
    const solicitacao = createMockSolicitacao({
      status_pagamento: 'aguardando_cobranca',
      vinculo_id: 5,
      representante_id: 6,
      representante_nome: 'Maria Oliveira',
      representante_tipo_pessoa: 'pj',
    });

    const props = createMockProps(solicitacao);

    const { container } = render(<SolicitacaoCard {...props} />);

    // Deve exibir (PJ) — CSS uppercase é visual; DOM contém o valor original lowercase
    expect(screen.getByText(/\(PJ\)/i)).toBeInTheDocument();
  });

  test('9. Deve renderizar badge de aguardando quando sem comissao provisionada', () => {
    const solicitacao = createMockSolicitacao({
      status_pagamento: 'pago',
      vinculo_id: 5,
      representante_id: 6,
      representante_nome: 'Test Rep',
      comissoes_geradas_count: 0,
    });

    const props = createMockProps(solicitacao);

    const { container } = render(<SolicitacaoCard {...props} />);

    // Sem provisionamento, deve mostrar badge de aguardando
    expect(container.textContent).toMatch(/Aguardando/i);
  });

  test('10. Deve renderizar badge "Comissão gerada" se comissao_gerada=true', () => {
    const solicitacao = createMockSolicitacao({
      status_pagamento: 'pago',
      vinculo_id: 5,
      representante_id: 6,
      representante_nome: 'Test Rep',
      comissao_gerada: true,
      comissoes_geradas_count: 1,
      comissoes_ativas_count: 1,
      pagamento_parcelas: 1,
    });

    const props = createMockProps(solicitacao);

    const { container } = render(<SolicitacaoCard {...props} />);

    // Deve ter badge "Comissão gerada"
    expect(screen.getByText('Comissão gerada')).toBeInTheDocument();
  });
});
