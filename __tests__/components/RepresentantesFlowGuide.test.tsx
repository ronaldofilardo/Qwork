/**
 * @file __tests__/components/RepresentantesFlowGuide.test.tsx
 * @description Testes do componente RepresentantesFlowGuide
 *
 * Cobre:
 *   - Renderização da seção "ativos"
 *   - Renderização da seção "pendentes"
 *   - Tooltips aparecem ao hover
 *   - Conteúdo de instruções correto para cada seção
 *   - Badges (💡) renderizam corretamente
 *   - Arrows (→) aparecem entre etapas
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RepresentantesFlowGuide from '@/components/RepresentantesFlowGuide';

describe('RepresentantesFlowGuide', () => {
  describe('Seção Ativos', () => {
    beforeEach(() => {
      render(<RepresentantesFlowGuide section="ativos" />);
    });

    it('renderiza o header correto para seção ativos', () => {
      expect(
        screen.getByText('👥 Atribuições do Comercial — Representantes Ativos')
      ).toBeInTheDocument();
    });

    it('renderiza subtexto correto para seção ativos', () => {
      expect(
        screen.getByText(
          /Defina modelo de comissão, resete senhas e gerencie representantes/i
        )
      ).toBeInTheDocument();
    });

    it('renderiza todas as 4 etapas de ativos', () => {
      expect(screen.getByText('1. Verificar Status')).toBeInTheDocument();
      expect(screen.getByText('2. Sem Comissão?')).toBeInTheDocument();
      expect(screen.getByText('3. Definir Modelo')).toBeInTheDocument();
      expect(screen.getByText('4. Resetar Senha')).toBeInTheDocument();
    });

    it('renderiza badge 💡 na etapa 3 de ativos', () => {
      const step3 = screen.getByText('3. Definir Modelo');
      expect(step3).toHaveTextContent('💡');
    });

    it('mostra tooltip ao hover na etapa 1', async () => {
      const step1Button = screen.getByText('1. Verificar Status');
      
      fireEvent.mouseEnter(step1Button);
      
      await waitFor(() => {
        expect(
          screen.getByText(
            /Abra o card do representante para visualizar seu status/i
          )
        ).toBeInTheDocument();
      });
    });

    it('esconde tooltip ao mouse leave', async () => {
      const step1Button = screen.getByText('1. Verificar Status');
      const step2Button = screen.getByText('2. Sem Comissão?');

      fireEvent.mouseEnter(step1Button);
      await waitFor(() => {
        expect(
          screen.getByText(
            /Abra o card do representante para visualizar seu status/i
          )
        ).toBeInTheDocument();
      });

      fireEvent.mouseLeave(step1Button);
      // Simula hover em outro botão
      fireEvent.mouseEnter(step2Button);

      await waitFor(() => {
        expect(
          screen.queryByText(
            /Abra o card do representante para visualizar seu status/i
          )
        ).not.toBeInTheDocument();
      });
    });

    it('tooltip da etapa 3 menciona Custo Fixo Entidade e Clínica', async () => {
      const step3Button = screen.getByText('3. Definir Modelo');
      
      fireEvent.mouseEnter(step3Button);
      
      await waitFor(() => {
        const tooltip = screen.getByText(
          /Custo Fixo Entidade.*Custo Fixo Clínica/s
        );
        expect(tooltip).toBeInTheDocument();
      });
    });

    it('tooltip da etapa 3 contém valores corretos (R$ 6,00 e R$ 14,00)', async () => {
      const step3Button = screen.getByText('3. Definir Modelo');
      
      fireEvent.mouseEnter(step3Button);
      
      await waitFor(() => {
        const tooltip = screen.getByText(/R\$ 6,00.*R\$ 14,00/s);
        expect(tooltip).toBeInTheDocument();
      });
    });
  });

  describe('Seção Pendentes', () => {
    beforeEach(() => {
      render(<RepresentantesFlowGuide section="pendentes" />);
    });

    it('renderiza o header correto para seção pendentes', () => {
      expect(
        screen.getByText(
          '📋 Atribuições do Comercial — Pendentes de Aprovação'
        )
      ).toBeInTheDocument();
    });

    it('renderiza subtexto correto para seção pendentes', () => {
      expect(
        screen.getByText(
          /Analise documentação, aprove candidatos e envie links/i
        )
      ).toBeInTheDocument();
    });

    it('renderiza todas as 4 etapas de pendentes', () => {
      expect(
        screen.getByText('1. Analisar Documentação')
      ).toBeInTheDocument();
      expect(screen.getByText('2. Validar Dados')).toBeInTheDocument();
      expect(screen.getByText('3. Aprovar ou Rejeitar')).toBeInTheDocument();
      expect(screen.getByText('4. Converter & Enviar Link')).toBeInTheDocument();
    });

    it('mostra tooltip ao hover na etapa 1 de pendentes', async () => {
      const step1Button = screen.getByText('1. Analisar Documentação');
      
      fireEvent.mouseEnter(step1Button);
      
      await waitFor(() => {
        expect(
          screen.getByText(/Verifique os documentos enviados pelo candidato/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Elementos Comuns', () => {
    it('renderiza footer com dica', () => {
      render(<RepresentantesFlowGuide section="ativos" />);
      expect(
        screen.getByText(/Passe o mouse sobre cada etapa/i)
      ).toBeInTheDocument();
    });

    it('renderiza arrows (→) entre etapas', () => {
      const { container } = render(
        <RepresentantesFlowGuide section="ativos" />
      );
      const arrows = container.querySelectorAll('span.text-blue-400');
      // Deve ter pelo menos 3 arrows (entre 4 etapas)
      expect(arrows.length).toBeGreaterThanOrEqual(3);
    });

    it('renderiza container com classes corretas de estilo', () => {
      const { container } = render(
        <RepresentantesFlowGuide section="ativos" />
      );
      const guideDiv = container.querySelector('.bg-blue-50');
      expect(guideDiv).toHaveClass('bg-blue-50');
      expect(guideDiv).toHaveClass('border-blue-200');
    });
  });

  describe('Acessibilidade', () => {
    it('botões são teclável (type="button")', () => {
      render(<RepresentantesFlowGuide section="ativos" />);
      const buttons = screen.getAllByRole('button', {
        name: /Verificar Status|Sem Comissão|Definir Modelo|Resetar Senha/i,
      });
      buttons.forEach((btn) => {
        expect(btn).toHaveAttribute('type', 'button');
      });
    });

    it('tooltip possui z-index alto (z-50)', () => {
      const { container } = render(
        <RepresentantesFlowGuide section="ativos" />
      );
      const step1Button = screen.getByText('1. Verificar Status');
      
      fireEvent.mouseEnter(step1Button);
      
      const tooltipDiv = container.querySelector('.z-50');
      expect(tooltipDiv).toBeInTheDocument();
    });
  });
});
