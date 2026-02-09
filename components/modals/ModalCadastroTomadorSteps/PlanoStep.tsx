import React from 'react';
import { Plano } from '@/lib/cadastroContratante';
import { formatarValor } from '@/lib/validacoes-contratacao';

interface Props {
  planos: Plano[];
  planoSelecionado: Plano | null;
  setPlanoSelecionado: (p: Plano) => void;
  numeroFuncionarios: number;
  setNumeroFuncionarios: (n: number) => void;
}

export default function PlanoStep({
  planos,
  planoSelecionado,
  setPlanoSelecionado,
  numeroFuncionarios,
  setNumeroFuncionarios,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Selecione seu plano:
        </label>
        <div className="grid grid-cols-1 gap-4">
          {planos.map((plano) => (
            <label key={plano.id} data-testid="plano-card" className="relative">
              <input
                type="radio"
                name="plano"
                value={plano.id}
                checked={planoSelecionado?.id === plano.id}
                onChange={() => setPlanoSelecionado(plano)}
                className="sr-only"
              />
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  planoSelecionado?.id === plano.id
                    ? 'border-orange-500 bg-orange-50 shadow-md'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{plano.nome}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {plano.descricao}
                    </div>
                    {plano.caracteristicas && (
                      <div className="mt-3 space-y-1">
                        {Array.isArray(plano.caracteristicas) ? (
                          plano.caracteristicas.map(
                            (item: any, idx: number) => (
                              <div key={idx} className="text-xs text-gray-500">
                                • {String(item)}
                              </div>
                            )
                          )
                        ) : typeof plano.caracteristicas === 'object' ? (
                          Object.entries(plano.caracteristicas).map(
                            ([key, value]) => (
                              <div key={key} className="text-xs text-gray-500">
                                • {key}: {String(value)}
                              </div>
                            )
                          )
                        ) : (
                          <div className="text-xs text-gray-500">
                            • {String(plano.caracteristicas)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-2xl font-bold text-orange-600">
                      {(() => {
                        const precoNum =
                          typeof plano.preco === 'number'
                            ? plano.preco
                            : Number(
                                String(plano.preco || '').replace(',', '.')
                              ) || 0;
                        return precoNum > 0 ? formatarValor(precoNum) : null;
                      })()}
                    </div>

                    {(() => {
                      const precoNum =
                        typeof plano.preco === 'number'
                          ? plano.preco
                          : Number(
                              String(plano.preco || '').replace(',', '.')
                            ) || 0;

                      if (precoNum <= 0) {
                        return (
                          <div className="text-sm font-semibold text-orange-600">
                            Sob consulta
                          </div>
                        );
                      }

                      return (
                        <div className="text-xs text-gray-500">
                          {plano.tipo === 'fixo'
                            ? '/ ano por funcionário'
                            : '/ mês'}
                          {plano.tipo === 'fixo' &&
                          plano.caracteristicas &&
                          typeof plano.caracteristicas === 'object' &&
                          plano.caracteristicas.parcelas_max ? (
                            <div className="text-xs text-gray-500">
                              Até {plano.caracteristicas.parcelas_max}x sem
                              juros
                            </div>
                          ) : null}
                        </div>
                      );
                    })()}

                    {(() => {
                      const precoNum =
                        typeof plano.preco === 'number'
                          ? plano.preco
                          : Number(
                              String(plano.preco || '').replace(',', '.')
                            ) || 0;
                      if (precoNum > 0 && plano.tipo === 'fixo') {
                        return (
                          <div className="text-xs text-orange-600 font-medium">
                            R$ {formatarValor(precoNum)} por funcionário/ano
                          </div>
                        );
                      }
                      if (plano.tipo === 'personalizado') {
                        return (
                          <div className="text-xs text-orange-600 font-medium">
                            Valor sob consulta
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>

        {planoSelecionado &&
          (planoSelecionado.tipo === 'fixo' ||
            planoSelecionado.tipo === 'personalizado') && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {planoSelecionado.tipo === 'personalizado'
                  ? 'Quantidade estimada de funcionários'
                  : 'Quantidade de funcionários ativos'}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={
                    planoSelecionado.tipo === 'personalizado'
                      ? 1
                      : planoSelecionado.caracteristicas?.minimo_funcionarios ||
                        1
                  }
                  max={
                    planoSelecionado.tipo === 'personalizado'
                      ? undefined
                      : planoSelecionado.caracteristicas?.limite_funcionarios
                  }
                  value={numeroFuncionarios}
                  onChange={(e) => {
                    const valor = Number(e.target.value) || 0;
                    if (planoSelecionado.tipo === 'personalizado') {
                      setNumeroFuncionarios(Math.max(1, valor));
                    } else {
                      const minimo =
                        planoSelecionado.caracteristicas?.minimo_funcionarios ||
                        1;
                      setNumeroFuncionarios(Math.max(minimo, valor));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                />

                {planoSelecionado.tipo === 'fixo' && (
                  <div className="text-sm text-gray-700">
                    <div>
                      <strong>Total anual:</strong>{' '}
                      {(() => {
                        const precoNum =
                          typeof planoSelecionado.preco === 'number'
                            ? planoSelecionado.preco
                            : Number(
                                String(planoSelecionado.preco || '').replace(
                                  ',',
                                  '.'
                                )
                              ) || 0;
                        return formatarValor(precoNum * numeroFuncionarios);
                      })()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {planoSelecionado.caracteristicas?.parcelas_max
                        ? `Pagamento em até ${planoSelecionado.caracteristicas.parcelas_max}x`
                        : 'Pagamento em até 12x'}
                      {planoSelecionado.caracteristicas
                        ?.minimo_funcionarios && (
                        <div className="text-xs text-gray-500">
                          Mínimo:{' '}
                          {planoSelecionado.caracteristicas.minimo_funcionarios}{' '}
                          funcionários
                        </div>
                      )}
                      {planoSelecionado.caracteristicas
                        ?.limite_funcionarios && (
                        <div className="text-xs text-gray-500">
                          Máximo:{' '}
                          {planoSelecionado.caracteristicas.limite_funcionarios}{' '}
                          funcionários
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {planoSelecionado.tipo === 'personalizado' && (
                  <div className="text-sm text-gray-700">
                    <div>
                      <strong>Estimativa para negociação</strong>
                    </div>
                    <div className="text-xs text-gray-500">
                      Valor será definido após análise do admin
                    </div>
                  </div>
                )}
              </div>

              {/* Validações e avisos */}
              {planoSelecionado.tipo === 'fixo' && (
                <>
                  {planoSelecionado.caracteristicas?.minimo_funcionarios &&
                    numeroFuncionarios <
                      planoSelecionado.caracteristicas.minimo_funcionarios && (
                      <div className="mt-2 text-sm text-yellow-600">
                        O número de funcionários deve ser no mínimo{' '}
                        {planoSelecionado.caracteristicas.minimo_funcionarios}{' '}
                        para este plano.
                      </div>
                    )}

                  {planoSelecionado.caracteristicas?.limite_funcionarios &&
                    numeroFuncionarios >
                      planoSelecionado.caracteristicas.limite_funcionarios && (
                      <div className="mt-2 text-sm text-red-600">
                        O número de funcionários excede o limite do plano (máx:{' '}
                        {planoSelecionado.caracteristicas.limite_funcionarios}).
                      </div>
                    )}
                </>
              )}

              {planoSelecionado.tipo === 'personalizado' &&
                numeroFuncionarios < 1 && (
                  <div className="mt-2 text-sm text-yellow-600">
                    Informe a quantidade estimada de funcionários (mínimo: 1).
                  </div>
                )}
            </div>
          )}

        {planos.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Carregando planos disponíveis...
          </div>
        )}
      </div>
    </div>
  );
}
