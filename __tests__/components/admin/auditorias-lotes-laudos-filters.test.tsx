/**
 * @file __tests__/components/admin/auditorias-lotes-laudos-filters.test.tsx
 * Testes: Filtros para TabelaLotes e TabelaLaudos
 *
 * Garante que:
 *  1. TabelaLotes renderiza com filtros
 *  2. Filtro por tomador (texto) funciona em Lotes
 *  3. Filtro por status (select) funciona em Lotes
 *  4. Filtros combinados funcionam em Lotes
 *  5. Limpar filtros restaura lista completa em Lotes
 *  6. TabelaLaudos renderiza com filtros
 *  7. Filtro por tomador (texto) funciona em Laudos
 *  8. Filtro por status (select) funciona em Laudos
 *  9. Mensagem de vazio aparece quando sem resultados
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TabelaLotes, TabelaLaudos } from '@/components/admin/auditorias/AuditoriaTables';
import type { AuditoriaLote, AuditoriaLaudo } from '@/components/admin/auditorias/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeLote(overrides: Partial<AuditoriaLote> = {}): AuditoriaLote {
  return {
    lote_id: 1,
    numero_lote: 'SEQ-001',
    clinica_id: 1,
    empresa_id: 1,
    entidade_id: null,
    status: 'ativo',
    tipo: 'audit',
    liberado_em: '2024-03-01T10:00:00Z',
    criado_em: '2024-03-01T08:00:00Z',
    clinica_nome: 'Clínica A',
    empresa_nome: 'Empresa Teste',
    total_avaliacoes: 10,
    avaliacoes_concluidas: 5,
    mudancas_status: 2,
    ...overrides,
  };
}

function makeLaudo(overrides: Partial<AuditoriaLaudo> = {}): AuditoriaLaudo {
  return {
    laudo_id: 1,
    lote_id: 1,
    numero_lote: 'SEQ-001',
    status: 'emitido',
    hash_pdf: 'abc123def456',
    criado_em: '2024-03-01T08:00:00Z',
    emitido_em: '2024-03-01T12:00:00Z',
    enviado_em: null,
    clinica_id: 1,
    clinica_nome: 'Clínica A',
    empresa_id: 1,
    empresa_cliente_nome: 'Empresa Teste',
    tomador_nome: 'Clínica A',
    entidade_id: null,
    solicitado_em: '2024-03-01T10:00:00Z',
    ...overrides,
  };
}

// ── Testes TabelaLotes ───────────────────────────────────────────────────────

describe('TabelaLotes — Filtros', () => {
  const mockAtualizar = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar tabela com dados', () => {
    const data: AuditoriaLote[] = [
      makeLote({
        lote_id: 1,
        empresa_nome: 'Empresa A',
        status: 'ativo',
      }),
      makeLote({
        lote_id: 2,
        empresa_nome: 'Empresa B',
        status: 'concluido',
      }),
    ];

    render(
      <TabelaLotes
        data={data}
        onAtualizar={mockAtualizar}
        loading={false}
      />
    );

    expect(screen.getByText('Auditoria de Lotes')).toBeInTheDocument();
    expect(screen.getByText('Empresa A')).toBeInTheDocument();
    expect(screen.getByText('Empresa B')).toBeInTheDocument();
  });

  it('deve filtrar por tomador (texto)', () => {
    const data: AuditoriaLote[] = [
      makeLote({
        lote_id: 1,
        empresa_nome: 'Empresa ABC',
        status: 'ativo',
      }),
      makeLote({
        lote_id: 2,
        empresa_nome: 'Empresa XYZ',
        status: 'ativo',
      }),
    ];

    render(
      <TabelaLotes
        data={data}
        onAtualizar={mockAtualizar}
        loading={false}
      />
    );

    const inputTomador = screen.getByPlaceholderText('Filtrar por tomador...');
    fireEvent.change(inputTomador, { target: { value: 'ABC' } });

    expect(screen.getByText('Empresa ABC')).toBeInTheDocument();
    expect(screen.queryByText('Empresa XYZ')).not.toBeInTheDocument();
  });

  it('deve filtrar por status (select)', () => {
    const data: AuditoriaLote[] = [
      makeLote({
        lote_id: 1,
        empresa_nome: 'Empresa A',
        status: 'ativo',
      }),
      makeLote({
        lote_id: 2,
        empresa_nome: 'Empresa B',
        status: 'concluido',
      }),
    ];

    render(
      <TabelaLotes
        data={data}
        onAtualizar={mockAtualizar}
        loading={false}
      />
    );

    const selectStatus = screen.getByDisplayValue('Todos os status');
    fireEvent.change(selectStatus, { target: { value: 'ativo' } });

    expect(screen.getByText('Empresa A')).toBeInTheDocument();
    expect(screen.queryByText('Empresa B')).not.toBeInTheDocument();
  });

  it('deve combinar filtros (tomador + status)', () => {
    const data: AuditoriaLote[] = [
      makeLote({
        lote_id: 1,
        empresa_nome: 'Empresa ABC',
        status: 'ativo',
      }),
      makeLote({
        lote_id: 2,
        empresa_nome: 'Empresa ABC',
        status: 'concluido',
      }),
      makeLote({
        lote_id: 3,
        empresa_nome: 'Empresa XYZ',
        status: 'ativo',
      }),
    ];

    render(
      <TabelaLotes
        data={data}
        onAtualizar={mockAtualizar}
        loading={false}
      />
    );

    const inputTomador = screen.getByPlaceholderText('Filtrar por tomador...');
    const selectStatus = screen.getByDisplayValue('Todos os status');

    fireEvent.change(inputTomador, { target: { value: 'ABC' } });
    fireEvent.change(selectStatus, { target: { value: 'ativo' } });

    // Deve mostrar apenas Empresa ABC com status ativo
    const empresaAbcAtivos = screen.getAllByText('Empresa ABC');
    expect(empresaAbcAtivos.length).toBe(1);
    expect(screen.queryByText('Empresa XYZ')).not.toBeInTheDocument();
  });

  it('deve limpar filtros', () => {
    const data: AuditoriaLote[] = [
      makeLote({
        lote_id: 1,
        empresa_nome: 'Empresa A',
        status: 'ativo',
      }),
      makeLote({
        lote_id: 2,
        empresa_nome: 'Empresa B',
        status: 'concluido',
      }),
    ];

    render(
      <TabelaLotes
        data={data}
        onAtualizar={mockAtualizar}
        loading={false}
      />
    );

    const inputTomador = screen.getByPlaceholderText('Filtrar por tomador...');
    fireEvent.change(inputTomador, { target: { value: 'A' } });

    // Botão "Limpar filtros" deve aparecer
    const limparButton = screen.getByText('Limpar filtros');
    fireEvent.click(limparButton);

    // Deve mostrar ambas as empresas novamente
    expect(screen.getByText('Empresa A')).toBeInTheDocument();
    expect(screen.getByText('Empresa B')).toBeInTheDocument();
  });

  it('deve exibir contagem de registros', () => {
    const data: AuditoriaLote[] = [
      makeLote({ lote_id: 1, empresa_nome: 'Empresa A' }),
      makeLote({ lote_id: 2, empresa_nome: 'Empresa B' }),
    ];

    render(
      <TabelaLotes
        data={data}
        onAtualizar={mockAtualizar}
        loading={false}
      />
    );

    expect(screen.getByText('2 de 2 registros')).toBeInTheDocument();
  });

  it('deve exibir mensagem quando nenhum resultado com filtros', () => {
    const data: AuditoriaLote[] = [
      makeLote({ empresa_nome: 'Empresa A', status: 'ativo' }),
    ];

    render(
      <TabelaLotes
        data={data}
        onAtualizar={mockAtualizar}
        loading={false}
      />
    );

    const inputTomador = screen.getByPlaceholderText('Filtrar por tomador...');
    fireEvent.change(inputTomador, { target: { value: 'Inexistente' } });

    expect(
      screen.getByText('Nenhum resultado para os filtros aplicados.')
    ).toBeInTheDocument();
  });
});

// ── Testes TabelaLaudos ──────────────────────────────────────────────────────

describe('TabelaLaudos — Filtros', () => {
  const mockAtualizar = jest.fn();
  const mockVerDetalhe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar tabela com dados', () => {
    const data: AuditoriaLaudo[] = [
      makeLaudo({
        laudo_id: 1,
        tomador_nome: 'Clínica A',
        status: 'emitido',
      }),
      makeLaudo({
        laudo_id: 2,
        tomador_nome: 'Clínica B',
        status: 'rascunho',
      }),
    ];

    render(
      <TabelaLaudos
        data={data}
        onVerDetalhe={mockVerDetalhe}
        onAtualizar={mockAtualizar}
        loading={false}
      />
    );

    expect(screen.getByText('Auditoria de Laudos')).toBeInTheDocument();
    expect(screen.getByText('Clínica A')).toBeInTheDocument();
    expect(screen.getByText('Clínica B')).toBeInTheDocument();
  });

  it('deve filtrar por tomador (texto)', () => {
    const data: AuditoriaLaudo[] = [
      makeLaudo({
        laudo_id: 1,
        tomador_nome: 'Clínica ABC',
        status: 'emitido',
      }),
      makeLaudo({
        laudo_id: 2,
        tomador_nome: 'Clínica XYZ',
        status: 'emitido',
      }),
    ];

    render(
      <TabelaLaudos
        data={data}
        onVerDetalhe={mockVerDetalhe}
        onAtualizar={mockAtualizar}
        loading={false}
      />
    );

    const inputTomador = screen.getByPlaceholderText('Filtrar por tomador...');
    fireEvent.change(inputTomador, { target: { value: 'ABC' } });

    expect(screen.getByText('Clínica ABC')).toBeInTheDocument();
    expect(screen.queryByText('Clínica XYZ')).not.toBeInTheDocument();
  });

  it('deve filtrar por status (select)', () => {
    const data: AuditoriaLaudo[] = [
      makeLaudo({
        laudo_id: 1,
        tomador_nome: 'Clínica A',
        status: 'emitido',
      }),
      makeLaudo({
        laudo_id: 2,
        tomador_nome: 'Clínica B',
        status: 'rascunho',
      }),
    ];

    render(
      <TabelaLaudos
        data={data}
        onVerDetalhe={mockVerDetalhe}
        onAtualizar={mockAtualizar}
        loading={false}
      />
    );

    const selectStatus = screen.getByDisplayValue('Todos os status');
    fireEvent.change(selectStatus, { target: { value: 'emitido' } });

    expect(screen.getByText('Clínica A')).toBeInTheDocument();
    expect(screen.queryByText('Clínica B')).not.toBeInTheDocument();
  });

  it('deve limpar filtros', () => {
    const data: AuditoriaLaudo[] = [
      makeLaudo({ laudo_id: 1, tomador_nome: 'Clínica A' }),
      makeLaudo({ laudo_id: 2, tomador_nome: 'Clínica B' }),
    ];

    render(
      <TabelaLaudos
        data={data}
        onVerDetalhe={mockVerDetalhe}
        onAtualizar={mockAtualizar}
        loading={false}
      />
    );

    const inputTomador = screen.getByPlaceholderText('Filtrar por tomador...');
    fireEvent.change(inputTomador, { target: { value: 'A' } });

    const limparButton = screen.getByText('Limpar filtros');
    fireEvent.click(limparButton);

    expect(screen.getByText('Clínica A')).toBeInTheDocument();
    expect(screen.getByText('Clínica B')).toBeInTheDocument();
  });

  it('deve chamar onVerDetalhe ao clicar em Detalhe', () => {
    const data: AuditoriaLaudo[] = [
      makeLaudo({ laudo_id: 1, tomador_nome: 'Clínica A' }),
    ];

    render(
      <TabelaLaudos
        data={data}
        onVerDetalhe={mockVerDetalhe}
        onAtualizar={mockAtualizar}
        loading={false}
      />
    );

    const detalheButton = screen.getByText('Detalhe');
    fireEvent.click(detalheButton);

    expect(mockVerDetalhe).toHaveBeenCalledWith(1);
  });
});
