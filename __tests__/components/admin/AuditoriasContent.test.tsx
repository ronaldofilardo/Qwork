/**
 * @file __tests__/components/admin/AuditoriasContent.test.tsx
 * Testes: AuditoriasContent
 *
 * Garante que:
 *  1. Sub-tabs de auditoria são renderizadas corretamente
 *  2. Interface AuditoriaLaudo usa campos corretos (clinica_nome, empresa_cliente_nome, tomador_nome)
 *  3. Coluna "Tomador" é exibida (não "Emissor")
 *  4. Troca de sub-tab funciona
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuditoriasContent } from '@/components/admin/AuditoriasContent';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeLaudo = (overrides: Record<string, unknown> = {}) => ({
  laudo_id: 1,
  lote_id: 10,
  clinica_nome: 'Clínica Teste',
  empresa_cliente_nome: 'Empresa Teste',
  tomador_nome: 'Tomador Teste SA',
  clinica_id: 1,
  empresa_id: 2,
  entidade_id: 3,
  numero_lote: 'LOTE-001',
  status: 'emitido',
  hash_pdf: null,
  criado_em: '2026-02-18T10:00:00Z',
  emitido_em: '2026-02-18T11:00:00Z',
  enviado_em: null,
  atualizado_em: null,
  solicitado_em: '2026-02-18T09:00:00Z',
  ...overrides,
});

const defaultProps = {
  auditoriaSubTab: 'laudos' as const,
  setAuditoriaSubTab: jest.fn(),
  acessosRH: [],
  acessosFuncionarios: [],
  auditoriaAvaliacoes: [],
  auditoriaLotes: [],
  auditoriaLaudos: [makeLaudo()],
};

// ── Testes ─────────────────────────────────────────────────────────────────────

describe('AuditoriasContent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deve renderizar as sub-tabs de auditoria', () => {
    render(<AuditoriasContent {...defaultProps} />);
    expect(screen.getByText('Acessos RH')).toBeInTheDocument();
    expect(screen.getByText('Acessos Funcionários')).toBeInTheDocument();
    expect(screen.getByText('Avaliações')).toBeInTheDocument();
    expect(screen.getByText('Lotes')).toBeInTheDocument();
    expect(screen.getByText('Laudos')).toBeInTheDocument();
  });

  it('deve chamar setAuditoriaSubTab ao clicar em uma sub-tab', () => {
    const setAuditoriaSubTab = jest.fn();
    render(
      <AuditoriasContent
        {...defaultProps}
        setAuditoriaSubTab={setAuditoriaSubTab}
      />
    );
    fireEvent.click(screen.getByText('Acessos RH'));
    expect(setAuditoriaSubTab).toHaveBeenCalledWith('acessos-rh');
  });

  describe('sub-tab laudos', () => {
    it('deve exibir coluna "Tomador" (não "Emissor")', () => {
      render(<AuditoriasContent {...defaultProps} />);
      expect(screen.getByText('Tomador')).toBeInTheDocument();
      expect(screen.queryByText('Emissor')).toBeNull();
    });

    it('deve exibir tomador_nome do laudo', () => {
      render(<AuditoriasContent {...defaultProps} />);
      expect(screen.getByText('Tomador Teste SA')).toBeInTheDocument();
    });

    it('deve exibir número de lote', () => {
      render(<AuditoriasContent {...defaultProps} />);
      expect(screen.getByText('LOTE-001')).toBeInTheDocument();
    });

    it('deve exibir contagem total de laudos', () => {
      const laudos = [makeLaudo({ laudo_id: 1 }), makeLaudo({ laudo_id: 2 })];
      render(
        <AuditoriasContent {...defaultProps} auditoriaLaudos={laudos} />
      );
      expect(screen.getByText(/Total: 2/)).toBeInTheDocument();
    });

    it('deve NÃO exibir emissor_cpf nem emissor_nome (campos removidos)', () => {
      render(<AuditoriasContent {...defaultProps} />);
      expect(screen.queryByText('emissor_cpf')).toBeNull();
      expect(screen.queryByText('Emissor CPF')).toBeNull();
    });
  });

  describe('sub-tab acessos-rh', () => {
    it('deve exibir tabela de acessos RH quando sub-tab for acessos-rh', () => {
      render(
        <AuditoriasContent
          {...defaultProps}
          auditoriaSubTab="acessos-rh"
          acessosRH={[
            {
              id: 1,
              cpf: '12345678901',
              nome: 'Gestor RH',
              clinica_id: 1,
              clinica_nome: 'Clínica A',
              login_timestamp: '2026-02-18T08:00:00Z',
              logout_timestamp: null,
              session_duration: null,
              ip_address: '127.0.0.1',
            },
          ]}
        />
      );
      expect(screen.getByText('Acessos de Gestores RH')).toBeInTheDocument();
      expect(screen.getByText('Gestor RH')).toBeInTheDocument();
    });
  });
});
