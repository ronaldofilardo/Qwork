'use client';

import { useState, useCallback } from 'react';
import {
  Check,
  AlertTriangle,
  Minus,
  ChevronDown,
  ChevronUp,
  Lock,
  Pencil,
} from 'lucide-react';

interface ColumnSuggestion {
  indice: number;
  nomeOriginal: string;
  sugestaoQWork: string | null;
  confianca: number;
  exemploDados: string[];
}

interface CampoQWork {
  campo: string;
  label: string;
  obrigatorio: boolean;
}

interface ColumnMapperProps {
  sugestoes: ColumnSuggestion[];
  camposQWork: CampoQWork[];
  camposObrigatorios: string[];
  initialTemplateMapeamento?: Array<{
    nomeOriginal: string;
    campoQWork: string;
  }>;
  onConfirm: (
    mapeamento: Array<{
      indice: number;
      nomeOriginal: string;
      campoQWork: string;
    }>
  ) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function ColumnMapper({
  sugestoes,
  camposQWork,
  camposObrigatorios,
  initialTemplateMapeamento,
  onConfirm,
  onBack,
  isLoading,
}: ColumnMapperProps) {
  const [mapeamento, setMapeamento] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    for (const s of sugestoes) {
      if (s.sugestaoQWork) {
        initial[s.indice] = s.sugestaoQWork;
      }
    }
    // Aplicar template (por nomeOriginal): sobrescreve sugestões automáticas
    if (initialTemplateMapeamento) {
      for (const tm of initialTemplateMapeamento) {
        const sug = sugestoes.find((s) => s.nomeOriginal === tm.nomeOriginal);
        if (sug && tm.campoQWork) {
          initial[sug.indice] = tm.campoQWork;
        }
      }
    }
    return initial;
  });

  // Bloqueia edição quando um template foi aplicado
  const [isLocked, setIsLocked] = useState(!!initialTemplateMapeamento);

  const [showPreview, setShowPreview] = useState<number | null>(null);

  const camposUsados = new Set(Object.values(mapeamento).filter(Boolean));

  const obrigatoriosMapeados = camposObrigatorios.filter((c) =>
    camposUsados.has(c)
  );
  const obrigatoriosFaltando = camposObrigatorios.filter(
    (c) => !camposUsados.has(c)
  );
  const podeAvancar = obrigatoriosFaltando.length === 0;

  const handleChange = useCallback((indice: number, campo: string) => {
    setMapeamento((prev) => {
      const next = { ...prev };
      if (campo === '') {
        delete next[indice];
      } else {
        // Remover campo de outra coluna se já usado
        for (const key of Object.keys(next)) {
          if (next[Number(key)] === campo) {
            delete next[Number(key)];
          }
        }
        next[indice] = campo;
      }
      return next;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    const result = Object.entries(mapeamento)
      .filter(([, campo]) => campo !== '')
      .map(([indice, campo]) => {
        const sug = sugestoes.find((s) => s.indice === Number(indice));
        return {
          indice: Number(indice),
          nomeOriginal: sug?.nomeOriginal ?? '',
          campoQWork: campo,
        };
      });
    onConfirm(result);
  }, [mapeamento, sugestoes, onConfirm]);

  const getConfiancaIcon = (s: ColumnSuggestion) => {
    const campo = mapeamento[s.indice];
    if (!campo) return <Minus size={16} className="text-gray-400" />;
    if (s.sugestaoQWork === campo && s.confianca >= 0.8)
      return <Check size={16} className="text-green-600" />;
    if (s.sugestaoQWork === campo && s.confianca >= 0.5)
      return <AlertTriangle size={16} className="text-yellow-500" />;
    return <Check size={16} className="text-blue-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Banner: template aplicado */}
      {isLocked && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <Lock size={15} className="flex-shrink-0" />
            <span>
              Mapeamento preenchido pelo template. Clique em{' '}
              <strong>Validar Dados</strong> para continuar.
            </span>
          </div>
          <button
            onClick={() => setIsLocked(false)}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap ml-4"
          >
            <Pencil size={13} />
            Editar manualmente
          </button>
        </div>
      )}

      <div
        className={`bg-white rounded-lg border border-gray-200 overflow-hidden${isLocked ? ' opacity-60 pointer-events-none select-none' : ''}`}
      >
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700">
            <div className="col-span-1" />
            <div className="col-span-4">Coluna da Planilha</div>
            <div className="col-span-4">Campo QWork</div>
            <div className="col-span-3">Exemplos</div>
          </div>
        </div>

        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {sugestoes.map((s) => (
            <div key={s.indice}>
              <div className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-gray-50">
                <div className="col-span-1 flex justify-center">
                  {getConfiancaIcon(s)}
                </div>
                <div className="col-span-4">
                  <span className="text-sm font-medium text-gray-900">
                    {s.nomeOriginal || `Coluna ${s.indice + 1}`}
                  </span>
                </div>
                <div className="col-span-4">
                  <select
                    value={mapeamento[s.indice] ?? ''}
                    onChange={(e) => handleChange(s.indice, e.target.value)}
                    disabled={isLocked}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Não mapear</option>
                    {camposQWork.map((c) => (
                      <option
                        key={c.campo}
                        value={c.campo}
                        disabled={
                          camposUsados.has(c.campo) &&
                          mapeamento[s.indice] !== c.campo
                        }
                      >
                        {c.label}
                        {c.obrigatorio ? ' *' : ''}
                        {camposUsados.has(c.campo) &&
                        mapeamento[s.indice] !== c.campo
                          ? ' (já usado)'
                          : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3 flex items-center gap-1">
                  <span className="text-xs text-gray-500 truncate">
                    {s.exemploDados[0] ?? '—'}
                  </span>
                  {s.exemploDados.length > 1 && (
                    <button
                      onClick={() =>
                        setShowPreview(
                          showPreview === s.indice ? null : s.indice
                        )
                      }
                      className="p-0.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPreview === s.indice ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </button>
                  )}
                </div>
              </div>
              {showPreview === s.indice && s.exemploDados.length > 0 && (
                <div className="px-4 pb-2 ml-12">
                  <div className="bg-gray-50 rounded p-2 text-xs text-gray-600 space-y-0.5">
                    {s.exemploDados.map((ex, i) => (
                      <div key={i}>{ex}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status de campos obrigatórios */}
      <div className="flex flex-wrap gap-2 items-center text-sm">
        <span className="text-gray-600 font-medium">Campos obrigatórios:</span>
        {camposObrigatorios.map((campo) => {
          const campoInfo = camposQWork.find((c) => c.campo === campo);
          const mapeado = obrigatoriosMapeados.includes(campo);
          return (
            <span
              key={campo}
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                mapeado
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {mapeado ? '✓' : '✗'} {campoInfo?.label ?? campo}
            </span>
          );
        })}
      </div>

      {obrigatoriosFaltando.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          <strong>Atenção:</strong> Mapear os campos obrigatórios (
          {obrigatoriosFaltando
            .map((c) => camposQWork.find((q) => q.campo === c)?.label ?? c)
            .join(', ')}
          ) para poder avançar.
        </div>
      )}

      {/* Botões */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          ← Voltar
        </button>
        <button
          onClick={handleConfirm}
          disabled={!podeAvancar || isLoading}
          className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Validando...' : 'Validar Dados →'}
        </button>
      </div>
    </div>
  );
}
