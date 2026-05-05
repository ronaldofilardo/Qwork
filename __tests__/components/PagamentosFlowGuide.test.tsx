/**
 * @file __tests__/components/PagamentosFlowGuide.test.tsx
 *
 * Testes para o componente PagamentosFlowGuide
 * Guia de fluxo para administração de pagamentos em duas seções:
 * - "aguardando_cobranca": definir valor, gerar link, disponibilizar
 * - "aguardando_pagamento": monitorar, verificar, confirmar manualmente
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PagamentosFlowGuide from '@/components/PagamentosFlowGuide';

describe('PagamentosFlowGuide', () => {
  describe('Section: aguardando_cobranca', () => {
    beforeEach(() => {
      render(
        <PagamentosFlowGuide section="aguardando_cobranca" />
      );
    });

    it('exibe header correto para aguardando_cobranca', () => {
      expect(screen.getByText(/Atribuições do Admin — Aguardando Cobrança/i)).toBeInTheDocument();
    });

    it('exibe subtexto correto para aguardando_cobranca', () => {
      expect(
        screen.getByText(
          /Defina o valor, gere e disponibilize o link de pagamento/i
        )
      ).toBeInTheDocument();
    });

    it('exibe 4 etapas para aguardando_cobranca', () => {
      const steps = [
        'Analisar Solicitação',
        'Definir Valor',
        'Gerar Link',
        'Disponibilizar',
      ];

      steps.forEach((step) => {
        expect(screen.getByText(new RegExp(`^1\\. ${step}|2\\. ${step}|3\\. ${step}|4\\. ${step}`))).toBeInTheDocument();
      });
    });

    it('exibe setas (→) de navegação entre etapas', () => {
      const arrows = screen.getAllByText('→');
      expect(arrows.length).toBe(3); // 4 passos = 3 setas
    });

    it('exibe badge "💡" na etapa 3 (Gerar Link)', () => {
      const badge = screen.getByText('💡');
      expect(badge).toBeInTheDocument();
    });

    it('mostra tooltip ao passar mouse sobre etapa', async () => {
      const user = userEvent.setup();
      const buttons = screen.getAllByRole('button');
      const firstButton = buttons[0];

      // Hover sobre o primeiro botão (Analisar Solicitação)
      await user.hover(firstButton);

      // Procurar pelo tooltip que contém "Abra o card da solicitação"
      expect(
        await screen.findByText(/Abra o card da solicitação/i)
      ).toBeInTheDocument();
    });

    it('dica final exibe instrução sobre mouse hover', () => {
      expect(
        screen.getByText(/Passe o mouse sobre cada etapa/i)
      ).toBeInTheDocument();
    });
  });

  describe('Section: aguardando_pagamento', () => {
    beforeEach(() => {
      render(
        <PagamentosFlowGuide section="aguardando_pagamento" />
      );
    });

    it('exibe header correto para aguardando_pagamento', () => {
      expect(screen.getByText(/Atribuições do Admin — Aguardando Pagamento/i)).toBeInTheDocument();
    });

    it('exibe subtexto correto para aguardando_pagamento', () => {
      expect(
        screen.getByText(
          /Monitore, verifique e confirme pagamentos recebidos/i
        )
      ).toBeInTheDocument();
    });

    it('exibe 4 etapas para aguardando_pagamento', () => {
      const steps = [
        'Monitorar Status',
        'Verificar no Asaas',
        'Confirmar Manualmente',
        'Vincular Representante',
      ];

      steps.forEach((step) => {
        const re = new RegExp(`^1\\. ${step}|2\\. ${step}|3\\. ${step}|4\\. ${step}`);
        expect(screen.getByText(re)).toBeInTheDocument();
      });
    });

    it('exibe badge "⚠️" na etapa 3 (Confirmar Manualmente)', () => {
      const badge = screen.getByText('⚠️');
      expect(badge).toBeInTheDocument();
    });

    it('mostra tooltip ao passar mouse sobre etapa', async () => {
      const user = userEvent.setup();
      const buttons = screen.getAllByRole('button');
      const firstButton = buttons[0];

      // Hover sobre o primeiro botão (Monitorar Status)
      await user.hover(firstButton);

      // Procurar pelo tooltip
      expect(
        await screen.findByText(/Acompanhe os lotes aguardando/i)
      ).toBeInTheDocument();
    });
  });

  describe('Visual Style', () => {
    it('aplica classes de estilo corretas (bg-blue-50, border-blue-200)', () => {
      const { container } = render(
        <PagamentosFlowGuide section="aguardando_cobranca" />
      );

      const guide = container.querySelector('.bg-blue-50');
      expect(guide).toBeInTheDocument();
      expect(guide).toHaveClass('border-blue-200');
    });

    it('botões de step têm classe hover:bg-blue-100', () => {
      const { container } = render(
        <PagamentosFlowGuide section="aguardando_cobranca" />
      );

      const buttons = container.querySelectorAll('.hover\\:bg-blue-100');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Tooltip Behavior', () => {
    it('esconde tooltip quando mouse sai do botão', async () => {
      const user = userEvent.setup();
      render(<PagamentosFlowGuide section="aguardando_cobranca" />);

      const buttons = screen.getAllByRole('button');
      const firstButton = buttons[0];

      // Hover
      await user.hover(firstButton);
      expect(
        await screen.findByText(/Abra o card da solicitação/i)
      ).toBeInTheDocument();

      // Unhover
      await user.unhover(firstButton);
      expect(
        screen.queryByText(/Abra o card da solicitação/i)
      ).not.toBeInTheDocument();
    });
  });
});
