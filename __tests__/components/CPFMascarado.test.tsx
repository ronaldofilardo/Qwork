/**
 * Testes para Componente CPF Mascarado - LGPD
 */

import { render, screen, fireEvent } from '@testing-library/react';
import CPFMascarado, {
  ConsentimentoBadge,
  DadosAnonimizados,
} from '@/components/common/CPFMascarado';

// Mock das funções de utils
jest.mock('@/lib/cpf-utils', () => ({
  mascararCPF: jest.fn((cpf) => {
    if (!cpf || cpf.length !== 11) return '***.***.***-**';
    return `***.***.*${cpf.slice(7, 9)}-${cpf.slice(9, 11)}`;
  }),
  formatarCPF: jest.fn((cpf) => {
    if (!cpf || cpf.length !== 11) return cpf;
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }),
}));

describe('CPFMascarado Component - LGPD', () => {
  describe('CPFMascarado', () => {
    it('deve renderizar CPF mascarado por padrão', () => {
      render(<CPFMascarado cpf="12345678909" />);

      expect(screen.getByText('***.***.*89-09')).toBeInTheDocument();
      expect(screen.queryByText('123.456.789-09')).not.toBeInTheDocument();
    });

    it('deve mostrar mensagem para CPF não informado', () => {
      render(<CPFMascarado cpf="" />);

      expect(screen.getByText('CPF não informado')).toBeInTheDocument();
    });

    it('deve mostrar botão de revelação quando revelarCompleto=true', () => {
      render(<CPFMascarado cpf="12345678909" revelarCompleto={true} />);

      expect(screen.getByTitle('Revelar CPF completo')).toBeInTheDocument();
      expect(screen.getByText('👁️ Ver')).toBeInTheDocument();
    });

    it('deve alternar entre mascarado e completo ao clicar', () => {
      render(<CPFMascarado cpf="12345678909" revelarCompleto={true} />);

      // Inicialmente mascarado
      expect(screen.getByText('***.***.*89-09')).toBeInTheDocument();

      // Clicar para revelar
      fireEvent.click(screen.getByText('👁️ Ver'));

      expect(screen.getByText('123.456.789-09')).toBeInTheDocument();
      expect(screen.getByTitle('Ocultar CPF')).toBeInTheDocument();
      expect(screen.getByText('🔒 Ocultar')).toBeInTheDocument();

      // Clicar para ocultar novamente
      fireEvent.click(screen.getByText('🔒 Ocultar'));

      expect(screen.getByText('***.***.*89-09')).toBeInTheDocument();
    });

    it('deve aplicar classe CSS adicional', () => {
      render(<CPFMascarado cpf="12345678909" className="text-red-500" />);

      const span = screen.getByText('***.***.*89-09');
      expect(span).toHaveClass('font-mono', 'text-red-500');
    });
  });

  describe('ConsentimentoBadge', () => {
    it('deve mostrar aviso quando não há base legal', () => {
      render(<ConsentimentoBadge />);

      expect(screen.getByText('⚠️ Sem base legal')).toBeInTheDocument();
      expect(screen.getByText('⚠️ Sem base legal')).toHaveClass(
        'bg-yellow-100',
        'text-yellow-800'
      );
    });

    it('deve mostrar badge correto para cada base legal', () => {
      const bases = [
        { base: 'contrato', text: '📄 Contrato', color: 'bg-blue-100' },
        {
          base: 'obrigacao_legal',
          text: '⚖️ Obrigação Legal',
          color: 'bg-green-100',
        },
        {
          base: 'consentimento',
          text: '✅ Consentimento',
          color: 'bg-purple-100',
        },
        {
          base: 'interesse_legitimo',
          text: '🏢 Interesse Legítimo',
          color: 'bg-gray-100',
        },
      ];

      bases.forEach(({ base, text, color }) => {
        const { container } = render(
          <ConsentimentoBadge baseLegal={base as any} />
        );
        expect(screen.getByText(text)).toBeInTheDocument();
        expect(container.firstChild).toHaveClass(color);
      });
    });

    it('deve mostrar tooltip com data de consentimento', () => {
      const data = '2024-01-15T10:30:00Z';
      render(
        <ConsentimentoBadge
          baseLegal="consentimento"
          dataConsentimento={data}
        />
      );

      const badge = screen.getByText('✅ Consentimento');
      expect(badge).toHaveAttribute('title', 'Registrado em: 15/01/2024');
    });
  });

  describe('DadosAnonimizados', () => {
    it('não deve renderizar quando não anonimizada', () => {
      const { container } = render(<DadosAnonimizados anonimizada={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('deve mostrar indicador de dados anonimizados', () => {
      render(<DadosAnonimizados anonimizada={true} />);

      expect(screen.getByText('Dados Anonimizados')).toBeInTheDocument();
      expect(screen.getByText('Dados Anonimizados').parentElement).toHaveClass(
        'bg-gray-100',
        'text-gray-700'
      );
    });

    it('deve mostrar data de anonimizacao quando fornecida', () => {
      const data = '2024-01-15T10:30:00Z';
      render(<DadosAnonimizados anonimizada={true} dataAnonimizacao={data} />);

      expect(screen.getByText('Dados Anonimizados')).toBeInTheDocument();
      expect(screen.getByText('(15/01/2024)')).toBeInTheDocument();
    });
  });
});
