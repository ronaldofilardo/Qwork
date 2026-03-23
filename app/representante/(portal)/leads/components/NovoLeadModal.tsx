'use client';

import { normalizeCNPJ } from '@/lib/validators';
import { TIPO_CLIENTE_LABEL, TIPOS_CLIENTE } from '@/lib/leads-config';
import type { TipoCliente } from '@/lib/leads-config';
import type { NovoLeadForm, ErrosCampos } from '../types';
import { AlertTriangle } from 'lucide-react';

interface NovoLeadModalProps {
  novoForm: NovoLeadForm;
  setNovoForm: (fn: (p: NovoLeadForm) => NovoLeadForm) => void;
  errosCampos: ErrosCampos;
  salvando: boolean;
  erro: string;
  formValido: boolean;
  handleCNPJChange: (valor: string) => void;
  handleTelefoneChange: (valor: string) => void;
  handleEmailChange: (valor: string) => void;
  handleTipoClienteChange: (tipo: TipoCliente) => void;
  requerAprovacao: boolean;
  custoAtual: number;
  criarLead: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function NovoLeadModal({
  novoForm,
  setNovoForm,
  errosCampos,
  salvando,
  erro,
  formValido,
  handleCNPJChange,
  handleTelefoneChange,
  handleEmailChange,
  handleTipoClienteChange,
  requerAprovacao,
  custoAtual,
  criarLead,
  onClose,
}: NovoLeadModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">
            Registrar Nova Indicação
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
        <form onSubmit={criarLead} className="px-6 py-4 space-y-4">
          {/* Tipo de Cliente — toggle pill */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Cliente *
            </label>
            <div className="flex rounded-lg border overflow-hidden">
              {TIPOS_CLIENTE.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => handleTipoClienteChange(tipo)}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-all duration-150 cursor-pointer ${
                    novoForm.tipo_cliente === tipo
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {TIPO_CLIENTE_LABEL[tipo]}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              Custo mínimo por produto:{' '}
              <span className="font-semibold text-gray-700">
                R$ {custoAtual},00
              </span>
            </p>
          </div>

          {/* CNPJ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CNPJ *
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="00.000.000/0001-00"
              value={novoForm.cnpj}
              onChange={(e) => handleCNPJChange(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors ${errosCampos.cnpj ? 'border-red-400 focus:ring-red-400' : normalizeCNPJ(novoForm.cnpj).length === 14 && !errosCampos.cnpj ? 'border-green-400 focus:ring-green-400' : 'focus:ring-blue-500'}`}
              required
            />
            {errosCampos.cnpj && (
              <p className="mt-1 text-xs text-red-500">{errosCampos.cnpj}</p>
            )}
            {!errosCampos.cnpj &&
              normalizeCNPJ(novoForm.cnpj).length === 14 && (
                <p className="mt-1 text-xs text-green-600">CNPJ válido ✓</p>
              )}
          </div>

          {/* Razão Social */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Razão Social
            </label>
            <input
              type="text"
              value={novoForm.razao_social}
              onChange={(e) =>
                setNovoForm((p) => ({ ...p, razao_social: e.target.value }))
              }
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Nome do Contato + Telefone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Contato
              </label>
              <input
                type="text"
                value={novoForm.contato_nome}
                onChange={(e) =>
                  setNovoForm((p) => ({ ...p, contato_nome: e.target.value }))
                }
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="(11) 91234-5678"
                value={novoForm.contato_telefone}
                onChange={(e) => handleTelefoneChange(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors ${errosCampos.contato_telefone ? 'border-red-400 focus:ring-red-400' : novoForm.contato_telefone.replace(/\D/g, '').length >= 10 && !errosCampos.contato_telefone ? 'border-green-400 focus:ring-green-400' : 'focus:ring-blue-500'}`}
              />
              {errosCampos.contato_telefone && (
                <p className="mt-1 text-xs text-red-500">
                  {errosCampos.contato_telefone}
                </p>
              )}
              {!errosCampos.contato_telefone &&
                novoForm.contato_telefone.replace(/\D/g, '').length >= 10 && (
                  <p className="mt-1 text-xs text-green-600">
                    Telefone válido ✓
                  </p>
                )}
            </div>
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail do Contato
            </label>
            <input
              type="text"
              inputMode="email"
              placeholder="contato@empresa.com.br"
              value={novoForm.contato_email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors ${errosCampos.contato_email ? 'border-red-400 focus:ring-red-400' : novoForm.contato_email && !errosCampos.contato_email ? 'border-green-400 focus:ring-green-400' : 'focus:ring-blue-500'}`}
            />
            {errosCampos.contato_email && (
              <p className="mt-1 text-xs text-red-500">
                {errosCampos.contato_email}
              </p>
            )}
            {!errosCampos.contato_email && novoForm.contato_email && (
              <p className="mt-1 text-xs text-green-600">E-mail válido ✓</p>
            )}
          </div>

          {/* Valor + Comissão */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor Negociado (R$) *
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="R$ 0,00"
                value={novoForm.valor_negociado}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, '');
                  if (!raw) {
                    setNovoForm((p: NovoLeadForm) => ({
                      ...p,
                      valor_negociado: '',
                    }));
                    return;
                  }
                  const formatted = (Number(raw) / 100).toLocaleString(
                    'pt-BR',
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  );
                  setNovoForm((p: NovoLeadForm) => ({
                    ...p,
                    valor_negociado: `R$ ${formatted}`,
                  }));
                }}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                % Comissão *
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00%"
                value={novoForm.percentual_comissao}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, '');
                  if (!raw) {
                    setNovoForm((p: NovoLeadForm) => ({
                      ...p,
                      percentual_comissao: '',
                    }));
                    return;
                  }
                  const val = Number(raw) / 100;
                  if (val > 100) return;
                  const formatted = val.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });
                  setNovoForm((p: NovoLeadForm) => ({
                    ...p,
                    percentual_comissao: `${formatted}%`,
                  }));
                }}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors ${errosCampos.percentual_comissao ? 'border-red-400 focus:ring-red-400' : 'focus:ring-blue-500'}`}
                required
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Valor acordado com a empresa e percentual de comissão
          </p>

          {/* Banner de aprovação necessária */}
          {requerAprovacao && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <AlertTriangle
                size={16}
                className="text-amber-600 mt-0.5 shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Aprovação comercial necessária
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  A margem QWork ficará abaixo do custo mínimo (R$ {custoAtual}
                  ,00). Este lead será encaminhado para aprovação do time
                  Comercial.
                </p>
              </div>
            </div>
          )}

          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || !formValido}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {salvando ? 'Salvando...' : 'Registrar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
