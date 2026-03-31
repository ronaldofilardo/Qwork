'use client';

import { Building2, Stethoscope } from 'lucide-react';
import type { TipoEntidade } from '@/lib/cadastroTomador';

interface TipoStepProps {
  tipo: TipoEntidade;
  setTipo: (tipo: TipoEntidade) => void;
}

export function TipoStep({ tipo, setTipo }: TipoStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tipo de cadastro:
        </label>
        <div className="grid grid-cols-1 gap-3">
          <label data-testid="tipo-entidade" className="relative">
            <input
              type="radio"
              name="tipo"
              value="entidade"
              checked={tipo === 'entidade'}
              onChange={(e) => setTipo(e.target.value as TipoEntidade)}
              className="sr-only"
            />
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                tipo === 'entidade'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="font-medium">Empresa Privada</div>
                  <div className="text-sm text-gray-600">
                    Contrato direto com funcionários
                  </div>
                </div>
              </div>
            </div>
          </label>

          <label data-testid="tipo-clinica" className="relative">
            <input
              type="radio"
              name="tipo"
              value="clinica"
              checked={tipo === 'clinica'}
              onChange={(e) => setTipo(e.target.value as TipoEntidade)}
              className="sr-only"
            />
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                tipo === 'clinica'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Stethoscope className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="font-medium">
                    Serviço de Medicina Ocupacional
                  </div>
                  <div className="text-sm text-gray-600">
                    Atendimento a múltiplas empresas
                  </div>
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
