'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  DollarSign,
  Download,
  Filter,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getStatusBadge, Parcela } from '@/lib/parcelas-helper';

interface ContratoPlano {
  contratante_id: number;
  cnpj: string;
  contrato_id: number | null;
  plano_id: number | null;
  plano_nome: string | null;
  plano_preco: number | null;
  id: number; // legacy: numero interno utilizado como key
  numero_contrato: number;
  tipo_contratante: 'clinica' | 'entidade';
  nome_contratante: string;
  plano_tipo: string;
  numero_funcionarios_estimado: number | null;
  numero_funcionarios_atual: number | null;
  pagamento_id: number | null;
  pagamento_valor: number | null;
  pagamento_status: string | null;
  modalidade_pagamento: string | null;
  tipo_pagamento: string | null;
  numero_parcelas: number | null;
  parcelas_json: Parcela[] | null;
  valor_pago: number | null;
  status: string;
  data_contratacao: string;
  data_fim_vigencia: string;
  data_pagamento: string | null;
}

export function CobrancaContent() {
  const [contratos, setContratos] = useState<ContratoPlano[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<
    'todos' | 'clinica' | 'entidade'
  >('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [contratoExpandido, setContratoExpandido] = useState<number | null>(
    null
  );
  const [busca, setBusca] = useState('');
  const [cnpjFilter, setCnpjFilter] = useState('');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState('data_pagamento');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchContratos = useCallback(
    async (cnpj?: string, pageParam?: number) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (cnpj) params.set('cnpj', cnpj);
        params.set('page', String(pageParam ?? page));
        params.set('limit', String(limit));
        params.set('sort_by', sortBy);
        params.set('sort_dir', sortDir);

        const url = `/api/admin/cobranca?${params.toString()}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setContratos(data.contratos || []);
          // atualizar meta de pagina
          if (data.page) setPage(data.page);
        }
      } catch (error) {
        console.error('Erro ao buscar contratos:', error);
      } finally {
        setLoading(false);
      }
    },
    [page, limit, sortBy, sortDir]
  );

  useEffect(() => {
    fetchContratos();
  }, [fetchContratos]);

  const contratosFiltrados = contratos.filter((contrato) => {
    // Filtro por tipo
    if (filtroTipo !== 'todos' && contrato.tipo_contratante !== filtroTipo) {
      return false;
    }

    // Filtro por status
    if (filtroStatus !== 'todos' && contrato.status !== filtroStatus) {
      return false;
    }

    // Busca por nome ou CNPJ (normalizar CNPJ para comparação sem formatação)
    if (busca) {
      const buscaLower = busca.toLowerCase();
      const buscaDigits = busca.replace(/\D/g, '');
      return (
        contrato.nome_contratante.toLowerCase().includes(buscaLower) ||
        (contrato.cnpj &&
          contrato.cnpj.replace(/\D/g, '').includes(buscaDigits))
      );
    }

    return true;
  });

  const clinicas = contratosFiltrados.filter(
    (c) => c.tipo_contratante === 'clinica'
  );
  const entidades = contratosFiltrados.filter(
    (c) => c.tipo_contratante === 'entidade'
  );

  const formatarValor = (valor: number | string | null | undefined) => {
    // considerar somente null/undefined como "Não informado" (0 é um valor válido)
    if (valor === null || valor === undefined) return 'Não informado';

    const num = Number(valor);
    // se não for um número finito, evitar passar para Intl e retornar "Não informado"
    if (!Number.isFinite(num)) return 'Não informado';

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const getTipoPagamentoLabel = (tipo: string | null) => {
    const tipos: Record<string, string> = {
      boleto: 'Boleto',
      cartao: 'Cartão',
      pix: 'PIX',
    };
    return tipos[tipo || ''] || 'Não informado';
  };

  const getModalidadeLabel = (modalidade: string | null) => {
    const modalidades: Record<string, string> = {
      a_vista: 'À vista',
      parcelado: 'Parcelado',
    };
    return modalidades[modalidade || ''] || 'Não informado';
  };

  const renderTabelaContratos = (
    contratosParaRenderizar: ContratoPlano[],
    titulo: string
  ) => {
    if (contratosParaRenderizar.length === 0) {
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
                  Contratante ID
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
              {contratosParaRenderizar.map((contrato) => (
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
                        {contrato.contratante_id}
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

                  {/* Linha expandida com detalhes das parcelas */}
                  {contratoExpandido === contrato.id &&
                    contrato.parcelas_json && (
                      <tr>
                        <td colSpan={11} className="px-4 py-4 bg-gray-50">
                          <div className="pl-8">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                              Detalhamento de Parcelas (#
                              {contrato.numero_contrato})
                            </h4>
                            {/* Layout horizontal com scroll */}
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
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Gestão de Cobranças
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Contratos ativos e histórico de pagamentos
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          <Download className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value, 10))}
              className="pl-3 w-full px-4 py-2 border border-gray-300 rounded-md"
              title="Registros por página"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={`${sortBy}:${sortDir}`}
              onChange={(e) => {
                const [sb, sd] = e.target.value.split(':');
                setSortBy(sb);
                setSortDir(sd as 'asc' | 'desc');
              }}
              className="pl-3 w-full px-4 py-2 border border-gray-300 rounded-md"
              title="Ordenar"
            >
              <option value="data_pagamento:desc">Data Pagamento (desc)</option>
              <option value="data_pagamento:asc">Data Pagamento (asc)</option>
              <option value="plano_preco:desc">Plano Preço (desc)</option>
              <option value="plano_preco:asc">Plano Preço (asc)</option>
            </select>
          </div>
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou CNPJ"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Filtro por CNPJ (chamada ao servidor) */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filtrar por CNPJ"
              value={cnpjFilter}
              onChange={(e) => setCnpjFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => fetchContratos(cnpjFilter.replace(/\D/g, ''), 1)}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              title="Filtrar por CNPJ"
            >
              Filtrar CNPJ
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() =>
                fetchContratos(
                  cnpjFilter.replace(/\D/g, ''),
                  Math.max(page - 1, 1)
                )
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              title="Página anterior"
            >
              Anterior
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() =>
                fetchContratos(cnpjFilter.replace(/\D/g, ''), page + 1)
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              title="Próxima página"
            >
              Próxima
            </button>
          </div>

          {/* Filtro por tipo */}
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <select
              value={filtroTipo}
              onChange={(e) =>
                setFiltroTipo(
                  e.target.value as 'todos' | 'clinica' | 'entidade'
                )
              }
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="todos">Todos os tipos</option>
              <option value="clinica">Clínicas</option>
              <option value="entidade">Entidades</option>
            </select>
          </div>

          {/* Filtro por status */}
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="todos">Todos os status</option>
              <option value="ativo">Ativos</option>
              <option value="vencido">Vencidos</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>

          {/* Total filtrado */}
          <div className="flex items-center justify-end">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{contratosFiltrados.length}</span>{' '}
              contrato(s) encontrado(s)
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Carregando contratos...</p>
        </div>
      ) : (
        <>
          {/* Métricas resumidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600">Total Clínicas</div>
              <div className="text-2xl font-bold text-gray-900">
                {clinicas.length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600">Total Entidades</div>
              <div className="text-2xl font-bold text-gray-900">
                {entidades.length}
              </div>
            </div>
            <div className="flex items-center justify-end gap-4 md:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-4 w-48">
                <div className="text-sm text-gray-600">Valor Total Pago</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatarValor(
                    contratos.reduce((sum, c) => {
                      // Valor Total Pago = soma dos "primeiros pagamentos" (entrada / parcela #1 paga)
                      let firstPaid = 0;

                      if (
                        Array.isArray(c.parcelas_json) &&
                        c.parcelas_json.length > 0
                      ) {
                        const first = c.parcelas_json.find(
                          (p) => Number(p.numero) === 1
                        );
                        if (
                          first &&
                          (first.pago === true || first.status === 'pago')
                        ) {
                          firstPaid += Number(first.valor || 0);
                        }
                      } else if (
                        c.pagamento_status === 'pago' &&
                        c.pagamento_valor
                      ) {
                        // pagamento único confirmado no ato
                        firstPaid += Number(c.pagamento_valor || 0);
                      } else if (c.valor_pago) {
                        // fallback legacy
                        firstPaid += Number(c.valor_pago || 0);
                      }

                      return (
                        sum +
                        (Number.isFinite(Number(firstPaid)) ? firstPaid : 0)
                      );
                    }, 0)
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 w-40">
                <div className="text-sm text-gray-600">Valor a Receber</div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatarValor(
                    contratos.reduce((sum, c) => {
                      // Valor a Receber = soma das parcelas pendentes cujo vencimento é no mês corrente
                      let pendingThisMonth = 0;
                      if (
                        Array.isArray(c.parcelas_json) &&
                        c.parcelas_json.length > 0
                      ) {
                        const now = new Date();
                        const currentMonth = now.getMonth();
                        const currentYear = now.getFullYear();
                        pendingThisMonth += c.parcelas_json
                          .filter((p) => {
                            if (!p) return false;
                            const statusPend =
                              p.pago === false || p.status === 'pendente';
                            if (!statusPend) return false;
                            try {
                              const d = new Date(p.data_vencimento);
                              return (
                                d.getMonth() === currentMonth &&
                                d.getFullYear() === currentYear
                              );
                            } catch {
                              return false;
                            }
                          })
                          .reduce((s, p) => s + Number(p.valor || 0), 0);
                      }

                      return (
                        sum +
                        (Number.isFinite(Number(pendingThisMonth))
                          ? pendingThisMonth
                          : 0)
                      );
                    }, 0)
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabelas separadas */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {filtroTipo === 'todos' || filtroTipo === 'clinica'
              ? renderTabelaContratos(
                  clinicas,
                  '📋 Clínicas de Medicina Ocupacional'
                )
              : null}
            {filtroTipo === 'todos' || filtroTipo === 'entidade'
              ? renderTabelaContratos(entidades, '🏢 Empresas/Entidades')
              : null}
          </div>
        </>
      )}
    </div>
  );
}
