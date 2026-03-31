'use client';

import { CreditCard, Smartphone, FileText, Check } from 'lucide-react';

type MetodoPagamento = 'pix' | 'boleto' | 'cartao';

const METODOS = [
  { value: 'pix' as const, Icon: Smartphone, label: 'PIX', desc: 'Aprovação instantânea' },
  { value: 'boleto' as const, Icon: FileText, label: 'Boleto Bancário', desc: 'Vencimento em 3 dias úteis' },
  { value: 'cartao' as const, Icon: CreditCard, label: 'Cartão de Crédito', desc: 'Parcelamento disponível' },
];

interface MetodosPagamentoProps {
  metodoSelecionado: MetodoPagamento | null;
  processando: boolean;
  onChange: (metodo: MetodoPagamento) => void;
}

export function MetodosPagamento({ metodoSelecionado, processando, onChange }: MetodosPagamentoProps) {
  return (
    <div className="space-y-4 mb-6">
      <div data-testid="metodo-selecionado" className="sr-only">{metodoSelecionado}</div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Selecione o método de pagamento:
      </label>
      {METODOS.map(({ value, Icon, label, desc }) => (
        <label key={value} className="relative">
          <input
            type="radio" name="metodo" value={value}
            checked={metodoSelecionado === value}
            onChange={() => onChange(value)}
            disabled={processando} className="sr-only"
          />
          <div className={`p-4 border rounded-lg cursor-pointer transition-all ${
            metodoSelecionado === value ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
          } ${processando ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <div className="flex items-center gap-3">
              <Icon className="w-6 h-6 text-orange-600" />
              <div className="flex-1">
                <div className="font-medium">{label}</div>
                <div className="text-sm text-gray-600">{desc}</div>
              </div>
              {metodoSelecionado === value && <Check className="w-5 h-5 text-orange-600" />}
            </div>
          </div>
        </label>
      ))}
    </div>
  );
}
