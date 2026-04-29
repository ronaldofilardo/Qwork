/**
 * Testes focados nas mudanças de UI no modal de novo lead (20/04/2026)
 *
 * Validações:
 * 1. Modelo PERCENTUAL: remover "Comissão comercial" e "QWork recebe"
 * 2. Modelo CUSTO_FIXO: remover "Sua comissão"
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import NovoLeadModal from '@/app/representante/(portal)/leads/components/NovoLeadModal';
import {
  calcularValoresComissao,
  calcularComissaoCustoFixo,
} from '@/lib/leads-config';

describe('NovoLeadModal — mudanças de UI (20/04/2026)', () => {
  // Mock de props base
  const mockProps = {
    novoForm: {
      cnpj: '12345678000190',
      razao_social: 'Empresa Teste',
      contato_nome: 'Contato',
      contato_email: 'contato@teste.com',
      contato_telefone: '(11) 91234-5678',
      valor_negociado: 'R$ 150,00',
      tipo_cliente: 'entidade' as const,
      num_vidas_estimado: '100',
    },
    setNovoForm: jest.fn(),
    errosCampos: {
      cnpj: '',
      contato_email: '',
      contato_telefone: '',
    },
    salvando: false,
    erro: '',
    formValido: true,
    handleCNPJChange: jest.fn(),
    handleTelefoneChange: jest.fn(),
    handleEmailChange: jest.fn(),
    handleTipoClienteChange: jest.fn(),
    criarLead: jest.fn(),
    onClose: jest.fn(),
    percRep: 10,
    valorCustoFixoEntidade: 12,
    valorCustoFixoClinica: 5,
  };

  describe('Modelo PERCENTUAL — remover "Comissão comercial" e "QWork recebe"', () => {
    it('modelo percentual NÃO exibe "Comissão comercial"', () => {
      const { container } = render(
        <NovoLeadModal {...mockProps} modeloComissionamento="percentual" />
      );

      // Procurar por "Comissão comercial"
      const text = container.textContent ?? '';
      expect(text).not.toMatch(/Comissão comercial/i);
    });

    it('modelo percentual NÃO exibe "QWork recebe"', () => {
      const { container } = render(
        <NovoLeadModal {...mockProps} modeloComissionamento="percentual" />
      );

      const text = container.textContent ?? '';
      expect(text).not.toMatch(/QWork recebe/i);
    });

    it('modelo percentual AINDA exibe "Sua comissão"', () => {
      render(
        <NovoLeadModal {...mockProps} modeloComissionamento="percentual" />
      );

      // "Sua comissão" deve estar visível (em PERCENTUAL)
      expect(screen.getByText(/Sua comissão/i)).toBeInTheDocument();
    });
  });

  describe('Modelo CUSTO_FIXO — remover "Sua comissão"', () => {
    it('modelo custo_fixo NÃO exibe "Sua comissão" como seção separada', () => {
      const { container } = render(
        <NovoLeadModal {...mockProps} modeloComissionamento="custo_fixo" />
      );

      // No bloco CUSTO_FIXO, não deve existir uma div com "Sua comissão"
      // (a comissão é igual ao custo fixo, então não precisa de linha separada)
      const text = container.textContent ?? '';

      // Procurar por padrão de "Sua comissão" que indique uma seção separada
      // (não apenas em contexto de descrição)
      const sectionMarkers = text.match(/Sua comissão/g) ?? [];
      // Em CUSTO_FIXO deve ter 0; em PERCENTUAL deve ter 1
      expect(sectionMarkers.length).toBe(0);
    });

    it('modelo custo_fixo AINDA exibe "Custo fixo (bruto)"', () => {
      render(
        <NovoLeadModal {...mockProps} modeloComissionamento="custo_fixo" />
      );

      expect(screen.getByText(/Custo fixo \(bruto\)/i)).toBeInTheDocument();
    });

    it('modelo custo_fixo NÃO exibe "Comissão comercial"', () => {
      render(
        <NovoLeadModal {...mockProps} modeloComissionamento="custo_fixo" />
      );

      const { container } = render(
        <NovoLeadModal {...mockProps} modeloComissionamento="custo_fixo" />
      );
      const text = container.textContent ?? '';
      expect(text).not.toMatch(/Comissão comercial/i);
    });
  });

  describe('Cálculos de comissionamento não foram afetados', () => {
    it('calcularValoresComissao continua funcionando (percentual)', () => {
      const result = calcularValoresComissao(150, 10, 'entidade');

      expect(result.valorRep).toBe(15); // 10% de 150
      expect(result.valorQWork).toBe(135); // 150 - 15
    });

    it('calcularComissaoCustoFixo continua funcionando (custo_fixo)', () => {
      const result = calcularComissaoCustoFixo(150, 100);

      expect(result.valorRep).toBe(50); // 150 - 100 (margem)
      expect(result.valorQWork).toBe(50); // margem - 0
    });
  });
});
