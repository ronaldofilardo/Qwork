'use client';

import { useState } from 'react';
import {
  X,
  Loader2,
  Percent,
  DollarSign,
  BadgeCheck,
  AlertCircle,
  Wallet,
} from 'lucide-react';

interface Props {
  repId: number;
  repNome: string;
  modeloAtual: 'percentual' | 'custo_fixo' | null;
  percentualAtual: number | null;
  percentualComercialAtual: number | null;
  walletIdAtual: string | null;
  valorCFEntidadeAtual?: number | null;
  valorCFClinicaAtual?: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AprovarComissaoModal({
  repId,
  repNome,
  modeloAtual,
  percentualAtual,
  percentualComercialAtual,
  walletIdAtual,
  valorCFEntidadeAtual,
  valorCFClinicaAtual,
  onClose,
  onSuccess,
}: Props) {
  const [modelo, setModelo] = useState<'percentual' | 'custo_fixo' | null>(
    modeloAtual ?? null
  );
  const [percentual, setPercentual] = useState<string>(
    percentualAtual != null ? String(percentualAtual) : ''
  );
  const [percentualComercial, setPercentualComercial] = useState<string>(
    percentualComercialAtual != null ? String(percentualComercialAtual) : '0'
  );
  const [valorCFEntidade, setValorCFEntidade] = useState<string>(
    valorCFEntidadeAtual != null ? String(valorCFEntidadeAtual) : ''
  );
  const [valorCFClinica, setValorCFClinica] = useState<string>(
    valorCFClinicaAtual != null ? String(valorCFClinicaAtual) : ''
  );
  const [walletId, setWalletId] = useState<string>(walletIdAtual ?? '');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const pctNum = parseFloat(percentual);
  const pctComNum = parseFloat(percentualComercial);
  const cfEntidadeNum = parseFloat(valorCFEntidade);
  const cfClinicaNum = parseFloat(valorCFClinica);
  const somaPerc =
    (isNaN(pctNum) ? 0 : pctNum) + (isNaN(pctComNum) ? 0 : pctComNum);

  // Validações modelo percentual
  const pctValido =
    modelo !== 'percentual' || (!isNaN(pctNum) && pctNum > 0 && pctNum <= 40);
  const pctComValido =
    modelo !== 'percentual' ||
    (!isNaN(pctComNum) && pctComNum >= 0 && pctComNum <= 40);
  const somaValida = modelo !== 'percentual' || somaPerc <= 40;

  // Validações modelo custo_fixo
  const cfEntidadeValido =
    modelo !== 'custo_fixo' || (!isNaN(cfEntidadeNum) && cfEntidadeNum > 0);
  const cfClinicaValido =
    modelo !== 'custo_fixo' || (!isNaN(cfClinicaNum) && cfClinicaNum > 0);
  const cfPercComValido =
    modelo !== 'custo_fixo' ||
    (!isNaN(pctComNum) && pctComNum >= 0 && pctComNum <= 40);

  // Preview para custo_fixo: comercial recebe pctComNum% do custo_fixo
  const previewComercialEntidade =
    modelo === 'custo_fixo' && !isNaN(cfEntidadeNum) && !isNaN(pctComNum)
      ? Math.round(((cfEntidadeNum * pctComNum) / 100) * 100) / 100
      : null;
  const previewComercialClinica =
    modelo === 'custo_fixo' && !isNaN(cfClinicaNum) && !isNaN(pctComNum)
      ? Math.round(((cfClinicaNum * pctComNum) / 100) * 100) / 100
      : null;

  const semWallet = walletId.trim() === '' && walletIdAtual === null;
  const podeSubmeter =
    modelo !== null &&
    pctValido &&
    pctComValido &&
    somaValida &&
    cfEntidadeValido &&
    cfClinicaValido &&
    cfPercComValido &&
    !loading;

  const handleSubmit = async () => {
    if (!podeSubmeter) return;
    setLoading(true);
    setErro(null);
    try {
      const body: {
        modelo: string;
        percentual?: number;
        percentual_comissao_comercial?: number;
        valor_custo_fixo_entidade?: number;
        valor_custo_fixo_clinica?: number;
        asaas_wallet_id?: string;
      } = { modelo };
      if (modelo === 'percentual') {
        body.percentual = pctNum;
        const derivedCom = !isNaN(pctNum) && pctNum > 0 ? 40 - pctNum : 0;
        body.percentual_comissao_comercial = derivedCom;
      }
      if (modelo === 'custo_fixo') {
        body.valor_custo_fixo_entidade = cfEntidadeNum;
        body.valor_custo_fixo_clinica = cfClinicaNum;
        body.percentual_comissao_comercial = isNaN(pctComNum) ? 0 : pctComNum;
      }
      if (walletId.trim()) body.asaas_wallet_id = walletId.trim();
      const res = await fetch(
        `/api/comercial/representantes/${repId}/aprovar-comissao`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErro(d.error ?? 'Erro ao definir comissionamento');
        return;
      }
      onSuccess();
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              Definir Comissionamento
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">{repNome}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Seleção de modelo */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Modelo de comissionamento
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setModelo('percentual')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                modelo === 'percentual'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <Percent size={24} />
              <span className="text-sm font-bold">Percentual</span>
              <span className="text-[11px] text-center text-gray-400">
                % sobre cada emissão
              </span>
            </button>
            <button
              onClick={() => setModelo('custo_fixo')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                modelo === 'custo_fixo'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <DollarSign size={24} />
              <span className="text-sm font-bold">Custo Fixo</span>
              <span className="text-[11px] text-center text-gray-400">
                Valor fixo por ciclo
              </span>
            </button>
          </div>
        </div>

        {/* Campo percentual condicional */}
        {modelo === 'percentual' && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Percentual (0,01% – 40%)
            </label>
            <div className="relative">
              <input
                type="number"
                min={0.01}
                max={40}
                step={0.01}
                value={percentual}
                onChange={(e) => setPercentual(e.target.value)}
                placeholder="Ex: 5.00"
                className="w-full pr-8 pl-3 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                %
              </span>
            </div>
            {percentual !== '' &&
              !isNaN(pctNum) &&
              (pctNum <= 0 || pctNum > 40) && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={11} />
                  Percentual deve ser entre 0,01% e 40%
                </p>
              )}
          </div>
        )}

        {/* Campo percentual comercial (modelo percentual) — derivado automaticamente */}
        {modelo === 'percentual' && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              % Comissão Comercial
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="text-blue-700 font-bold text-sm">
                {!isNaN(pctNum) && pctNum > 0
                  ? (40 - pctNum).toFixed(2)
                  : '—'}%
              </span>
              <span className="text-xs text-blue-500">
                calculado automaticamente (40% − {!isNaN(pctNum) ? pctNum : '?'}% Rep)
              </span>
            </div>
            {!isNaN(pctNum) && pctNum > 0 && (
              <p className="text-xs text-gray-500">
                Total: 40% · QWork fica com {(60).toFixed(2)}%
              </p>
            )}
          </div>
        )}

        {/* Campos custo fixo (modelo custo_fixo) */}
        {modelo === 'custo_fixo' && (
          <div className="space-y-4">
            {/* Custo fixo Entidade */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Custo Fixo — Entidade (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                  R$
                </span>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={valorCFEntidade}
                  onChange={(e) => setValorCFEntidade(e.target.value)}
                  placeholder="Ex: 15.00"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              {valorCFEntidade !== '' &&
                !isNaN(cfEntidadeNum) &&
                cfEntidadeNum <= 0 && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={11} />
                    Valor deve ser maior que zero
                  </p>
                )}
            </div>

            {/* Custo fixo Clínica */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Custo Fixo — Clínica (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                  R$
                </span>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={valorCFClinica}
                  onChange={(e) => setValorCFClinica(e.target.value)}
                  placeholder="Ex: 8.00"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              {valorCFClinica !== '' &&
                !isNaN(cfClinicaNum) &&
                cfClinicaNum <= 0 && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={11} />
                    Valor deve ser maior que zero
                  </p>
                )}
            </div>

            {/* % Comissão Comercial sobre o custo fixo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                % Comissão Comercial (0% – 40% do custo fixo)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={40}
                  step={0.01}
                  value={percentualComercial}
                  onChange={(e) => setPercentualComercial(e.target.value)}
                  placeholder="Ex: 10.00"
                  className="w-full pr-8 pl-3 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                  %
                </span>
              </div>
              {!cfPercComValido && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={11} />
                  Percentual deve ser entre 0% e 40%
                </p>
              )}
              {/* Preview distribuição */}
              {!isNaN(pctComNum) &&
                pctComNum >= 0 &&
                pctComNum <= 40 &&
                previewComercialEntidade !== null &&
                previewComercialClinica !== null && (
                  <div className="mt-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs space-y-1">
                    <p className="font-semibold text-blue-700 text-[11px] uppercase tracking-wide">
                      Distribuição por avaliação (custo fixo)
                    </p>
                    {cfEntidadeNum > 0 && (
                      <div className="flex justify-between text-blue-700">
                        <span>Comercial recebe (entidade)</span>
                        <span className="font-semibold">
                          {pctComNum.toFixed(1)}% de R${' '}
                          {cfEntidadeNum.toFixed(2)} = R${' '}
                          {previewComercialEntidade.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {cfClinicaNum > 0 && (
                      <div className="flex justify-between text-blue-700">
                        <span>Comercial recebe (clínica)</span>
                        <span className="font-semibold">
                          {pctComNum.toFixed(1)}% de R${' '}
                          {cfClinicaNum.toFixed(2)} = R${' '}
                          {previewComercialClinica.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <p className="text-[11px] text-blue-600 pt-0.5">
                      Rep recebe: valor negociado − custo fixo (diferença
                      inteira)
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Wallet ID Asaas */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Wallet size={12} />
            Wallet ID Asaas
            {semWallet && (
              <span className="ml-1 px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[9px] font-bold uppercase">
                Necessário para pagamento
              </span>
            )}
          </label>
          <input
            type="text"
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            placeholder="Ex: 7e6b5490-a88e-4c36-8f5e-..."
            className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:ring-2 focus:border-transparent transition-all font-mono ${
              semWallet
                ? 'border-orange-300 focus:ring-orange-400 bg-orange-50/30'
                : 'focus:ring-green-500'
            }`}
          />
          {semWallet && (
            <p className="text-xs text-orange-600 flex items-center gap-1">
              <AlertCircle size={11} />
              Sem Wallet ID, o pagamento de comissão via split Asaas não
              funcionará.
            </p>
          )}
        </div>

        {/* Nota do fluxo de 2 etapas */}
        <p className="text-xs text-gray-400">
          Após confirmar, o Suporte ativará a subconta Asaas do representante.
        </p>

        {/* Erro */}
        {erro && (
          <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            {erro}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm border rounded-xl hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!podeSubmeter}
            className="flex-1 px-4 py-2.5 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <BadgeCheck size={14} />
            )}
            {loading ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
