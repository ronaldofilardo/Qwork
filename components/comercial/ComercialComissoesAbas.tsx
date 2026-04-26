'use client';

import { useState } from 'react';
import { LayoutList, DollarSign } from 'lucide-react';
import { ComissoesContent } from '@/components/admin/ComissoesContent';
import { MinhasComissoesComercial } from '@/components/comercial/MinhasComissoesComercial';

type AbaComissao = 'produtividade' | 'minhas-comissoes';

const ABAS: { id: AbaComissao; label: string; icon: React.ReactNode }[] = [
  {
    id: 'produtividade',
    label: 'Produtividade',
    icon: <LayoutList className="w-4 h-4" />,
  },
  {
    id: 'minhas-comissoes',
    label: 'Minhas comissões',
    icon: <DollarSign className="w-4 h-4" />,
  },
];

export function ComercialComissoesAbas() {
  const [aba, setAba] = useState<AbaComissao>('produtividade');

  return (
    <div>
      {/* Barra de abas */}
      <div className="border-b border-gray-200 px-6 bg-white">
        <nav className="flex gap-1" role="tablist">
          {ABAS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={aba === t.id}
              onClick={() => setAba(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                aba === t.id
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo da aba ativa */}
      {aba === 'produtividade' && <ComissoesContent perfil="comercial" />}
      {aba === 'minhas-comissoes' && <MinhasComissoesComercial />}
    </div>
  );
}
