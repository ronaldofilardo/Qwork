'use client';

import type { LotePageVariant, Funcionario, LoteInfo } from '@/lib/lote/types';
import { formatDate, getStatusBadgeInfo } from '@/lib/lote/utils';
import FiltroColuna from './FiltroColuna';
import type { FiltrosColuna } from '@/lib/lote/types';

interface FuncionariosTableProps {
  variant: LotePageVariant;
  funcionariosFiltrados: Funcionario[];
  funcionariosTotal: number;
  lote: LoteInfo | null;
  busca: string;
  filtroStatus: string;
  filtrosColuna: FiltrosColuna;
  setFiltrosColuna: React.Dispatch<React.SetStateAction<FiltrosColuna>>;
  getValoresUnicos: (coluna: keyof FiltrosColuna) => string[];
  toggleFiltroColuna: (coluna: keyof FiltrosColuna, valor: string) => void;
  onInativar: (avaliacaoId: number, nome: string, cpf: string) => void;
  onResetar: (avaliacaoId: number, nome: string, cpf: string) => void;
}

// eslint-disable-next-line max-lines-per-function
export default function FuncionariosTable({
  variant,
  funcionariosFiltrados,
  lote,
  busca,
  filtroStatus,
  filtrosColuna,
  setFiltrosColuna,
  getValoresUnicos,
  toggleFiltroColuna,
  onInativar,
  onResetar,
}: FuncionariosTableProps) {
  const isEntidade = variant === 'entidade';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-20">
                ID
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>Nome</span>
                  <FiltroColuna
                    coluna="nome"
                    titulo="Nome"
                    filtrosColuna={filtrosColuna}
                    setFiltrosColuna={setFiltrosColuna}
                    getValoresUnicos={getValoresUnicos}
                    toggleFiltroColuna={toggleFiltroColuna}
                  />
                </div>
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>CPF</span>
                  <FiltroColuna
                    coluna="cpf"
                    titulo="CPF"
                    filtrosColuna={filtrosColuna}
                    setFiltrosColuna={setFiltrosColuna}
                    getValoresUnicos={getValoresUnicos}
                    toggleFiltroColuna={toggleFiltroColuna}
                  />
                </div>
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>Nível</span>
                  <FiltroColuna
                    coluna="nivel_cargo"
                    titulo="Nível"
                    filtrosColuna={filtrosColuna}
                    setFiltrosColuna={setFiltrosColuna}
                    getValoresUnicos={getValoresUnicos}
                    toggleFiltroColuna={toggleFiltroColuna}
                  />
                </div>
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <FiltroColuna
                    coluna="status"
                    titulo="Status"
                    filtrosColuna={filtrosColuna}
                    setFiltrosColuna={setFiltrosColuna}
                    getValoresUnicos={getValoresUnicos}
                    toggleFiltroColuna={toggleFiltroColuna}
                  />
                </div>
              </th>
              {isEntidade && (
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-28">
                  Inativar
                </th>
              )}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Data Conclusão
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                {isEntidade ? 'Motivo Inativação' : 'Data/Motivo Inativação'}
              </th>
              {isEntidade && (
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Data Inativação
                </th>
              )}
              {!isEntidade && (
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-28">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {funcionariosFiltrados.length === 0 ? (
              <tr>
                <td
                  colSpan={20}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {busca ||
                  filtroStatus !== 'todos' ||
                  Object.values(filtrosColuna).some((arr) => arr.length > 0)
                    ? 'Nenhum funcionário encontrado com os filtros aplicados'
                    : 'Nenhum funcionário neste lote'}
                </td>
              </tr>
            ) : (
              // eslint-disable-next-line max-lines-per-function, complexity
              funcionariosFiltrados.map((func, idx) => {
                const statusBadge = getStatusBadgeInfo(func.avaliacao.status);
                const isConcluida =
                  func.avaliacao.status === 'concluida' ||
                  func.avaliacao.status === 'concluido';
                const isInativada = func.avaliacao.status === 'inativada';
                const canInativar =
                  !isConcluida &&
                  !isInativada &&
                  !lote?.emissao_solicitada &&
                  !lote?.emitido_em;

                const rowClass = !isEntidade
                  ? isInativada
                    ? 'bg-red-50 border-l-4 border-red-400'
                    : isConcluida
                      ? 'bg-green-50'
                      : ''
                  : '';

                return (
                  <tr
                    key={`${func.cpf}-${func.avaliacao.id ?? idx}`}
                    className={`hover:bg-gray-50 ${rowClass}`}
                  >
                    <td className="px-3 py-2 text-sm text-gray-600 font-mono">
                      #{func.avaliacao.id}
                    </td>
                    <td
                      className="px-3 py-2 text-sm text-gray-900 max-w-[240px] truncate"
                      title={func.nome}
                    >
                      <div className="flex items-center gap-2">
                        {!isEntidade && isInativada && (
                          <span
                            className="text-red-500 text-xs"
                            title="Avaliação inativada"
                          >
                            ⚠️
                          </span>
                        )}
                        {func.nome}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500 font-mono">
                      {func.cpf}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {func.nivel_cargo === 'operacional'
                        ? 'Operacional'
                        : func.nivel_cargo === 'gestao'
                          ? 'Gestão'
                          : '-'}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusBadge.color}`}
                        >
                          {statusBadge.label}
                        </span>
                        {!isConcluida &&
                          !isInativada &&
                          (func.avaliacao.total_respostas ?? 0) > 0 && (
                            <span className="text-[10px] text-gray-600">
                              {func.avaliacao.total_respostas}/37 respostas
                            </span>
                          )}
                      </div>
                    </td>

                    {/* Entidade: coluna Inativar separada */}
                    {isEntidade && (
                      <td className="px-3 py-2 text-sm text-center">
                        <div className="flex gap-1 justify-center">
                          {canInativar && (
                            <button
                              onClick={() =>
                                onInativar(
                                  func.avaliacao.id,
                                  func.nome,
                                  func.cpf
                                )
                              }
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                              title="Inativar avaliação"
                            >
                              🚫 Inativar
                            </button>
                          )}
                          {!isInativada &&
                            !isConcluida &&
                            !lote?.emissao_solicitada &&
                            !lote?.emitido_em && (
                              <button
                                onClick={() =>
                                  onResetar(
                                    func.avaliacao.id,
                                    func.nome,
                                    func.cpf
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-600 text-white rounded text-xs hover:bg-amber-700 transition-colors"
                                title="Resetar avaliação"
                              >
                                ↻ Reset
                              </button>
                            )}
                        </div>
                      </td>
                    )}

                    <td className="px-3 py-2 text-sm text-gray-500">
                      {isEntidade
                        ? formatDate(func.avaliacao.data_conclusao)
                        : isConcluida
                          ? formatDate(func.avaliacao.data_conclusao)
                          : '-'}
                    </td>

                    {/* Motivo inativação */}
                    {isEntidade ? (
                      <>
                        <td
                          className="px-3 py-2 text-sm text-gray-500 max-w-[200px] truncate"
                          title={func.avaliacao.motivo_inativacao || ''}
                        >
                          {func.avaliacao.motivo_inativacao || '-'}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-500">
                          {formatDate(func.avaliacao.inativada_em ?? null)}
                        </td>
                      </>
                    ) : (
                      <td className="px-3 py-2 text-sm text-gray-600">
                        {isInativada && func.avaliacao.data_inativacao ? (
                          <div className="flex gap-2">
                            <span>
                              {formatDate(func.avaliacao.data_inativacao)}
                            </span>
                            {func.avaliacao.motivo_inativacao && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                {func.avaliacao.motivo_inativacao}
                              </span>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    )}

                    {/* RH: coluna Ações */}
                    {!isEntidade && (
                      <td className="px-3 py-2 text-sm text-center">
                        <div className="flex gap-1 justify-center">
                          {canInativar && (
                            <button
                              onClick={() =>
                                onInativar(
                                  func.avaliacao.id,
                                  func.nome,
                                  func.cpf
                                )
                              }
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                              title="Inativar avaliação"
                            >
                              🚫 Inativar
                            </button>
                          )}
                          {(func.avaliacao.status === 'iniciada' ||
                            func.avaliacao.status === 'em_andamento' ||
                            isConcluida) &&
                            !lote?.emissao_solicitada &&
                            !lote?.emitido_em && (
                              <button
                                onClick={() =>
                                  onResetar(
                                    func.avaliacao.id,
                                    func.nome,
                                    func.cpf
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-amber-600 rounded hover:bg-amber-700 transition-colors"
                                title="Resetar avaliação"
                              >
                                ↻ Reset
                              </button>
                            )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
