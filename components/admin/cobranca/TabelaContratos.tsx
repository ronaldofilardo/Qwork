'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { getStatusBadge } from '@/lib/parcelas-helper';
import type { ContratoPlano, Parcela } from './types';
import {
  formatarValor,
  formatarData,
  getTipoPagamentoLabel,
  getModalidadeLabel,
} from './utils';

interface TabelaContratosProps {
  contratos: ContratoPlano[];
  titulo: string;
  contratoExpandido: number | null;
  setContratoExpandido: (id: number | null) => void;
}

export function TabelaContratos({
  contratos,
  titulo,
  contratoExpandido,
  setContratoExpandido,
}: TabelaContratosProps) {
  if (contratos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum contrato encontrado
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{titulo}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                tomador ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                CNPJ
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Plano ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Plano Preço
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Funcionários
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Valor Pago
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Data Pagamento
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Pagamento
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Quitação
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Vigência
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contratos.map((contrato) => (
              <>
                <tr key={contrato.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    {contrato.modalidade_pagamento === 'parcelado' &&
                      contrato.parcelas_json && (
                        <button
                          onClick={() =>
                            setContratoExpandido(
                              contratoExpandido === contrato.id
                                ? null
                                : contrato.id
                            )
                          }
                          className="text-orange-600 hover:text-orange-800"
                          title="Ver parcelas"
                        >
                          {contratoExpandido === contrato.id ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>
                      )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">
                      {contrato.tomador_id}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {contrato.cnpj}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {contrato.plano_id ?? '—'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {contrato.plano_preco
                        ? formatarValor(Number(contrato.plano_preco))
                        : 'Não informado'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {contrato.numero_funcionarios_atual || 0} /{' '}
                      {contrato.numero_funcionarios_estimado || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      atual / estimado
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatarValor(
                        contrato.valor_pago ?? contrato.pagamento_valor
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {contrato.pagamento_id ?? '—'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Status: {contrato.pagamento_status ?? '—'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {contrato.data_pagamento
                        ? formatarData(contrato.data_pagamento)
                        : 'Não informado'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getTipoPagamentoLabel(contrato.tipo_pagamento)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getModalidadeLabel(contrato.modalidade_pagamento)}
                      {contrato.numero_parcelas &&
                        contrato.modalidade_pagamento === 'parcelado' &&
                        ` (${contrato.numero_parcelas}x)`}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    {contrato.modalidade_pagamento === 'parcelado' &&
                    contrato.parcelas_json ? (
                      (() => {
                        console.log(
                          'parcelas_json structure:',
                          contrato.parcelas_json
                        );
                        const statusBadge = getStatusBadge(
                          contrato.parcelas_json as Parcela[]
                        );
                        return (
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.colorClass}`}
                          >
                            {statusBadge.label}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Quitado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        contrato.status === 'ativo'
                          ? 'bg-green-100 text-green-800'
                          : contrato.status === 'vencido'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {contrato.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatarData(contrato.data_contratacao)}
                    </div>
                    <div className="text-xs text-gray-500">
                      até {formatarData(contrato.data_fim_vigencia)}
                    </div>
                  </td>
                </tr>

                {/* Parcelas expandidas */}
                {contratoExpandido === contrato.id &&
                  contrato.parcelas_json && (
                    <tr>
                      <td colSpan={11} className="px-4 py-4 bg-gray-50">
                        <div className="pl-8">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            Detalhamento de Parcelas (#
                            {contrato.numero_contrato})
                          </h4>
                          <div className="overflow-x-auto">
                            <div
                              className="flex gap-3 pb-2"
                              style={{ minWidth: 'max-content' }}
                            >
                              {contrato.parcelas_json.map((parcela) => {
                                const isPago =
                                  parcela.status === 'pago' ||
                                  parcela.pago === true;
                                return (
                                  <div
                                    key={parcela.numero}
                                    className={`flex-shrink-0 w-40 p-3 rounded-lg border-2 ${
                                      isPago
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-white border-gray-200'
                                    }`}
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="text-xs font-semibold text-gray-600">
                                        {parcela.numero}/
                                        {contrato.numero_parcelas}
                                      </span>
                                      {isPago && (
                                        <span className="text-xs text-green-600 font-semibold">
                                          ✓
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm font-bold text-gray-900 mb-1">
                                      {formatarValor(parcela.valor)}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      Venc:{' '}
                                      {formatarData(parcela.data_vencimento)}
                                    </div>
                                    {isPago && parcela.data_pagamento && (
                                      <div className="text-xs text-green-600 mt-1">
                                        Pago:{' '}
                                        {formatarData(parcela.data_pagamento)}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
