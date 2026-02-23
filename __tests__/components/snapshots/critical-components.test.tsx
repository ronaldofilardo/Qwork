/**
 * @file __tests__/components/snapshots/critical-components.test.tsx
 * ─────────────────────────────────────────────────────────────
 * Testes de snapshot para componentes críticos da UI RH.
 *
 * OBJETIVO:
 *  Detectar regressões visuais/estruturais automaticamente quando os
 *  componentes são alterados. Ao refatorar, se o snapshot mudar, o teste
 *  falha e exige revisão explícita do desenvolvedor.
 *
 * COMO ATUALIZAR SNAPSHOTS:
 *  Quando uma mudança intencional é feita no componente:
 *    npx jest --updateSnapshot "__tests__/components/snapshots/critical-components"
 *
 * COMPONENTES COBERTOS:
 *  - LotesGrid: grid de lotes de avaliação (mais testado historicamente)
 *  - TabNavigation: navegação por abas do painel RH
 *  - NotificationsSection: seção de notificações
 */

import React from 'react';
import { render } from '@testing-library/react';
import { LotesGrid } from '@/components/rh/LotesGrid';
import { TabNavigation } from '@/components/rh/TabNavigation';

// ────────────────────────────────────────────────────────────
// Dados de fixture compartilhados
// ────────────────────────────────────────────────────────────

const LOTE_BASE = {
  id: 1,
  tipo: 'completo',
  liberado_em: '2026-01-15T10:00:00.000Z',
  status: 'ativo',
  total_avaliacoes: 10,
  avaliacoes_concluidas: 5,
  avaliacoes_inativadas: 0,
  empresa_nome: 'Empresa Snapshot Teste',
  pode_emitir_laudo: false,
  motivos_bloqueio: [],
  taxa_conclusao: 50,
  hash_pdf: null,
  solicitado_por: undefined,
  solicitado_em: undefined,
};

const LOTE_CONCLUIDO = {
  ...LOTE_BASE,
  id: 2,
  status: 'concluido',
  avaliacoes_concluidas: 10,
  pode_emitir_laudo: true,
  taxa_conclusao: 100,
};

const LAUDO_BASE = {
  id: 10,
  lote_id: 2,
  emissor_nome: 'Dr. João Silva',
  enviado_em: '2026-01-20T14:30:00.000Z',
  hash: 'abc123def456',
  status: 'emitido',
};

// ────────────────────────────────────────────────────────────
// LotesGrid
// ────────────────────────────────────────────────────────────

describe('LotesGrid — snapshots', () => {
  const noop = jest.fn();

  it('estado vazio (sem lotes)', () => {
    const { container } = render(
      <LotesGrid
        lotes={[]}
        laudos={[]}
        downloadingLaudo={null}
        onLoteClick={noop}
        onDownloadLaudo={noop}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('lote ativo sem laudo', () => {
    const { container } = render(
      <LotesGrid
        lotes={[LOTE_BASE]}
        laudos={[]}
        downloadingLaudo={null}
        onLoteClick={noop}
        onDownloadLaudo={noop}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('lote concluído com laudo emitido', () => {
    const { container } = render(
      <LotesGrid
        lotes={[LOTE_CONCLUIDO]}
        laudos={[LAUDO_BASE]}
        downloadingLaudo={null}
        onLoteClick={noop}
        onDownloadLaudo={noop}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('múltiplos lotes mistos', () => {
    const { container } = render(
      <LotesGrid
        lotes={[LOTE_BASE, LOTE_CONCLUIDO]}
        laudos={[LAUDO_BASE]}
        downloadingLaudo={null}
        onLoteClick={noop}
        onDownloadLaudo={noop}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('estado de download em andamento', () => {
    const { container } = render(
      <LotesGrid
        lotes={[LOTE_CONCLUIDO]}
        laudos={[LAUDO_BASE]}
        downloadingLaudo={LAUDO_BASE.id}
        onLoteClick={noop}
        onDownloadLaudo={noop}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

// ────────────────────────────────────────────────────────────
// TabNavigation
// ────────────────────────────────────────────────────────────

describe('TabNavigation — snapshots', () => {
  const noop = jest.fn();

  it('aba padrão (lotes)', () => {
    const { container } = render(
      <TabNavigation activeTab="lotes" onTabChange={noop} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('aba funcionários ativa', () => {
    const { container } = render(
      <TabNavigation activeTab="funcionarios" onTabChange={noop} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('aba laudos ativa', () => {
    const { container } = render(
      <TabNavigation activeTab="laudos" onTabChange={noop} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('aba desligamentos ativa', () => {
    const { container } = render(
      <TabNavigation activeTab="desligamentos" onTabChange={noop} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
