'use client';

import { normalizeCNPJ } from '@/lib/validators';
import {
  TIPO_CLIENTE_LABEL,
  TIPOS_CLIENTE,
  CUSTO_POR_AVALIACAO,
  calcularValoresComissao,
  calcularComissaoCustoFixo,
} from '@/lib/leads-config';
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
  criarLead: (e: React.FormEvent) => void;
  onClose: () => void;
  percRep: number;
  percComercial: number;
  modeloComissionamento: string | null;
  valorCustoFixoEntidade: number | null;
  valorCustoFixoClinica: number | null;
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
  criarLead,
  onClose,
  percRep,
  percComercial,
  modeloComissionamento,
  valorCustoFixoEntidade,
  valorCustoFixoClinica,
}: NovoLeadModalProps) {
  const valorNegociadoNum =
    parseFloat(
      novoForm.valor_negociado.replace(/[^\d,]/g, '').replace(',', '.')
    ) || 0;
  const numVidasNum = parseInt(novoForm.num_vidas_estimado) || 0;
  const custoMinimo = CUSTO_POR_AVALIACAO[novoForm.tipo_cliente];
  const fmtBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Custo fixo do representante para o tipo de cliente selecionado
  const custoFixoRep =
    modeloComissionamento === 'custo_fixo'
      ? novoForm.tipo_cliente === 'entidade'
        ? (valorCustoFixoEntidade ?? null)
        : (valorCustoFixoClinica ?? null)
      : null;

  // CASO D: custo_fixo model breakdown
  const breakdownCustoFixo =
    modeloComissionamento === 'custo_fixo' &&
    custoFixoRep !== null &&
    valorNegociadoNum > 0
      ? calcularComissaoCustoFixo(
          valorNegociadoNum,
          custoFixoRep,
          percComercial
        )
      : null;

  // CASO C base: percentual model breakdown
  const breakdown =
    modeloComissionamento !== 'custo_fixo' && valorNegociadoNum > 0
      ? calcularValoresComissao(
          valorNegociadoNum,
          percRep,
          percComercial,
          novoForm.tipo_cliente
        )
      : null;

  const percentualTotal = percRep + percComercial;

  // Block submit for custo_fixo when value is below custo_fixo
  const custoFixoInvalido =
    modeloComissionamento === 'custo_fixo' &&
    custoFixoRep !== null &&
    valorNegociadoNum > 0 &&
    valorNegociadoNum < custoFixoRep;
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

          {/* Valor Negociado */}
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
                const formatted = (Number(raw) / 100).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
                setNovoForm((p: NovoLeadForm) => ({
                  ...p,
                  valor_negociado: `R$ ${formatted}`,
                }));
              }}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              required
            />
          </div>

          {/* Nº de Vidas Estimado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nº de Vidas Estimado <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Ex: 150"
              value={novoForm.num_vidas_estimado}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                setNovoForm((p: NovoLeadForm) => ({
                  ...p,
                  num_vidas_estimado: raw,
                }));
              }}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors ${numVidasNum >= 1 ? 'border-green-400 focus:ring-green-400' : 'focus:ring-blue-500'}`}
              required
            />
          </div>

          {/* CASO A: modelo não configurado */}
          {modeloComissionamento === null && (
            <div className="flex items-start gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
              <AlertTriangle
                size={12}
                className="text-blue-500 shrink-0 mt-0.5"
              />
              <p className="text-blue-700 text-xs">
                Modelo de comissionamento ainda não configurado. O lead será
                registrado sem simulação de comissão.
              </p>
            </div>
          )}

          {/* CASO B: percentual zerado */}
          {modeloComissionamento === 'percentual' &&
            percRep === 0 &&
            percComercial === 0 && (
              <div className="flex items-start gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
                <AlertTriangle
                  size={12}
                  className="text-blue-500 shrink-0 mt-0.5"
                />
                <p className="text-blue-700 text-xs">
                  Percentual de comissão zerado. O lead será registrado sem
                  simulação de valores.
                </p>
              </div>
            )}

          {/* CASO C: percentual model — breakdown padrão */}
          {breakdown && modeloComissionamento !== 'custo_fixo' && (
            <div
              className={`rounded-lg px-4 py-3 space-y-1.5 text-xs border ${
                breakdown.abaixoCusto
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <p className="font-semibold text-xs text-gray-600 uppercase tracking-wide mb-2">
                Simulação de Comissão
              </p>
              <div className="flex justify-between">
                <span className="text-gray-500">Valor por vida</span>
                <span className="font-semibold">
                  {fmtBRL(valorNegociadoNum)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">
                  Sua comissão ({percRep.toFixed(1)}%)
                </span>
                <span className="text-blue-700 font-medium">
                  {fmtBRL(breakdown.valorRep)}
                </span>
              </div>
              {percComercial > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Comissão comercial ({percComercial.toFixed(1)}%)
                  </span>
                  <span className="text-purple-700 font-medium">
                    {fmtBRL(breakdown.valorComercial)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-1.5">
                <span
                  className={
                    breakdown.abaixoCusto
                      ? 'text-amber-700 font-semibold'
                      : 'text-gray-600 font-semibold'
                  }
                >
                  QWork recebe
                </span>
                <span
                  className={
                    breakdown.abaixoCusto
                      ? 'text-amber-700 font-semibold'
                      : 'text-gray-700 font-semibold'
                  }
                >
                  {fmtBRL(breakdown.valorQWork)}
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Custo mínimo ({novoForm.tipo_cliente})</span>
                <span>R$ {custoMinimo},00</span>
              </div>
              {breakdown.abaixoCusto && (
                <div className="flex items-start gap-1.5 bg-amber-100 border border-amber-300 rounded px-2 py-1.5 mt-1">
                  <AlertTriangle
                    size={12}
                    className="text-amber-600 shrink-0 mt-0.5"
                  />
                  <p className="text-amber-800 text-xs">
                    Valor abaixo do custo mínimo — este lead precisará de
                    aprovação do comercial.
                  </p>
                </div>
              )}
              {!breakdown.abaixoCusto && percentualTotal > 40 && (
                <div className="flex items-start gap-1.5 bg-amber-100 border border-amber-300 rounded px-2 py-1.5 mt-1">
                  <AlertTriangle
                    size={12}
                    className="text-amber-600 shrink-0 mt-0.5"
                  />
                  <p className="text-amber-800 text-xs">
                    Comissão combinada ({percentualTotal.toFixed(1)}%) excede
                    40%. Lead precisará de aprovação do comercial.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CASO D: custo_fixo model */}
          {modeloComissionamento === 'custo_fixo' &&
            custoFixoRep !== null &&
            valorNegociadoNum > 0 && (
              <div
                className={`rounded-lg px-4 py-3 space-y-1.5 text-xs border ${
                  custoFixoInvalido
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <p className="font-semibold text-xs text-gray-600 uppercase tracking-wide mb-2">
                  Simulação — Custo Fixo
                </p>
                <div className="flex justify-between">
                  <span className="text-gray-500">Valor negociado</span>
                  <span className="font-semibold">
                    {fmtBRL(valorNegociadoNum)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Custo fixo (bruto)</span>
                  <span className="text-gray-700 font-medium">
                    {fmtBRL(custoFixoRep)}
                  </span>
                </div>
                {breakdownCustoFixo && percComercial > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Comissão comercial ({percComercial.toFixed(1)}% do custo
                      fixo)
                    </span>
                    <span className="text-purple-700 font-medium">
                      {fmtBRL(breakdownCustoFixo.valorComercial)}
                    </span>
                  </div>
                )}
                {breakdownCustoFixo && (
                  <div className="flex justify-between border-t pt-1.5">
                    <span className="text-blue-700 font-semibold">
                      Sua comissão
                    </span>
                    <span className="text-blue-700 font-semibold">
                      {fmtBRL(breakdownCustoFixo.valorRep)}
                    </span>
                  </div>
                )}
                {custoFixoInvalido && (
                  <div className="flex items-start gap-1.5 bg-red-100 border border-red-300 rounded px-2 py-1.5 mt-1">
                    <AlertTriangle
                      size={12}
                      className="text-red-600 shrink-0 mt-0.5"
                    />
                    <p className="text-red-800 text-xs">
                      Valor negociado inferior ao custo fixo (
                      {fmtBRL(custoFixoRep)}). Ajuste o valor para continuar.
                    </p>
                  </div>
                )}
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
              disabled={salvando || !formValido || custoFixoInvalido}
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
