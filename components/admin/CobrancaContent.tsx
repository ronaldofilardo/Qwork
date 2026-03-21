'use client';

import { useEffect, useState, useCallback } from 'react';
import { DollarSign, Download, Filter, Search, Calendar } from 'lucide-react';
import { Parcela } from '@/lib/parcelas-helper';
import TabelaContratosSection from '@/components/admin/TabelaContratosSection';

interface ContratoPlano {
  tomador_id: number;
  cnpj: string;
  contrato_id: number | null;
  id: number; // legacy: numero interno utilizado como key
  numero_contrato: number;
  tipo_tomador: 'clinica' | 'entidade';
  nome_tomador: string;
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
    if (filtroTipo !== 'todos' && contrato.tipo_tomador !== filtroTipo) {
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
        contrato.nome_tomador.toLowerCase().includes(buscaLower) ||
        (contrato.cnpj &&
          contrato.cnpj.replace(/\D/g, '').includes(buscaDigits))
      );
    }

    return true;
  });

  const clinicas = contratosFiltrados.filter(
    (c) => c.tipo_tomador === 'clinica'
  );
  const entidades = contratosFiltrados.filter(
    (c) => c.tipo_tomador === 'entidade'
  );

  const formatarValor = (valor: number | string | null | undefined) => {
    if (valor === null || valor === undefined) return 'Não informado';
    const num = Number(valor);
    if (!Number.isFinite(num)) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
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
            {filtroTipo === 'todos' || filtroTipo === 'clinica' ? (
              <TabelaContratosSection
                contratos={clinicas}
                titulo="📋 Clínicas de Medicina Ocupacional"
                contratoExpandido={contratoExpandido}
                onToggleExpand={setContratoExpandido}
              />
            ) : null}
            {filtroTipo === 'todos' || filtroTipo === 'entidade' ? (
              <TabelaContratosSection
                contratos={entidades}
                titulo="🏢 Empresas/Entidades"
                contratoExpandido={contratoExpandido}
                onToggleExpand={setContratoExpandido}
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
