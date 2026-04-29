'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Landmark,
  RefreshCw,
  Save,
  Settings,
  Users,
  Wallet,
} from 'lucide-react';

interface BeneficiarioSociedade {
  id: 'ronaldo' | 'antonio';
  nome: string;
  nomeEmpresarial: string;
  documentoFiscal: string;
  walletId: string | null;
  percentualParticipacao: number;
  ativo: boolean;
  observacoes?: string | null;
}

interface QWorkSociedadeConfig {
  id: 'qwork';
  nome: 'QWork';
  nomeEmpresarial: string;
  documentoFiscal: string;
  walletId: string | null;
  percentualParticipacao: 0;
  ativo: boolean;
  observacoes?: string | null;
}

interface ResumoPeriodo {
  entradaBruta: number;
  impostos: number;
  gateway: number;
  custoOperacional: number;
  representantes: number;
  ronaldo: number;
  antonio: number;
  totalEventos: number;
}

interface EventoSociedade {
  id: string;
  data: string;
  tomador: string;
  pagamentoId: string | null;
  status: string;
  metodo: string;
  numeroParcelas: number | null;
  tipoCobranca: string;
  valorBruto: number;
  valorImpostos: number;
  valorGateway: number;
  valorCustoOperacional: number;
  valorRepresentante: number;
  valorSocioRonaldo: number;
  valorSocioAntonio: number;
  representanteNome: string | null;
  representanteId: number | null;
  loteId: number;
}

interface ConfiguracaoGateway {
  codigo: string;
  descricao: string | null;
  tipo: 'taxa_fixa' | 'percentual';
  valor: number;
  ativo: boolean;
}

type GatewayItemState = {
  valor: string;
  saving: boolean;
  saved: boolean;
  error: string | null;
};

interface SociedadeResponse {
  success: boolean;
  modoOperacao: 'simulacao' | 'real';
  persistenciaDisponivel: boolean;
  qwork: QWorkSociedadeConfig;
  beneficiarios: BeneficiarioSociedade[];
  configuracao: {
    qworkWalletConfigurada: boolean;
    representantesComWallet: number;
    representantesSemWallet: number;
    socioRonaldoWalletConfigurada: boolean;
    socioAntonioWalletConfigurada: boolean;
  };
  resumo: {
    dia: ResumoPeriodo;
    semana: ResumoPeriodo;
    mes: ResumoPeriodo;
  };
  eventosRecentes: EventoSociedade[];
}

function formatCurrency(value: number | undefined | null): string {
  if (value == null || isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatMetodo(metodo: string, parcelas?: number | null): string {
  const m = metodo.toLowerCase();
  if (m.includes('pix')) return 'PIX';
  if (m.includes('boleto')) return 'Boleto';
  if (m.includes('credit') || m.includes('cartao') || m.includes('cartão')) {
    const p = Number(parcelas ?? 1);
    return p > 1 ? `Cartão ${p}x` : 'Cartão 1x';
  }
  return metodo;
}

function MetodoBadge({
  metodo,
  parcelas,
  tipoCobranca,
}: {
  metodo: string;
  parcelas?: number | null;
  tipoCobranca?: string;
}) {
  if (tipoCobranca === 'manutencao') {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700">
        Manutenção
      </span>
    );
  }
  const m = metodo.toLowerCase();
  const isPix = m.includes('pix');
  const isBoleto = m.includes('boleto');
  const isCard =
    m.includes('credit') || m.includes('cartao') || m.includes('cartão');
  const cls = isPix
    ? 'bg-emerald-100 text-emerald-700'
    : isBoleto
      ? 'bg-sky-100 text-sky-700'
      : isCard
        ? 'bg-violet-100 text-violet-700'
        : 'bg-gray-100 text-gray-600';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}
    >
      {formatMetodo(metodo, parcelas)}
    </span>
  );
}

const GATEWAY_CONFIG_LABELS: ReadonlyArray<{ codigo: string; label: string }> =
  [
    { codigo: 'impostos', label: 'Impostos' },
    { codigo: 'boleto', label: 'Boleto' },
    { codigo: 'pix', label: 'PIX' },
    { codigo: 'credit_card_1x', label: 'Cartão 1x' },
    { codigo: 'credit_card_2_6x', label: 'Cartão 2–6x' },
    { codigo: 'credit_card_7_12x', label: 'Cartão 7–12x' },
    { codigo: 'taxa_transacao', label: 'Taxa/transação' },
  ];

function WalletStatus({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
      }`}
    >
      {ok ? 'Configurada' : 'Pendente'}
    </span>
  );
}

export default function SociedadeContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SociedadeResponse | null>(null);
  const [gatewayConfigs, setGatewayConfigs] = useState<ConfiguracaoGateway[]>(
    []
  );
  const [gatewayState, setGatewayState] = useState<
    Record<string, GatewayItemState>
  >({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/financeiro/sociedade', {
        cache: 'no-store',
      });

      const payload = (await response.json().catch(() => ({}))) as unknown;
      const errorPayload =
        payload && typeof payload === 'object'
          ? (payload as { error?: string; message?: string })
          : {};

      if (!response.ok) {
        throw new Error(
          errorPayload.message ??
            errorPayload.error ??
            'Não foi possível carregar a auditoria da Sociedade.'
        );
      }

      const successPayload = payload as SociedadeResponse;
      setData(successPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGatewayConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/financeiro/gateway-config', {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const payload = (await res.json()) as {
        configuracoes: ConfiguracaoGateway[];
      };
      const configs = payload.configuracoes ?? [];
      setGatewayConfigs(configs);
      const state: Record<string, GatewayItemState> = {};
      for (const c of configs) {
        state[c.codigo] = {
          valor: String(c.valor),
          saving: false,
          saved: false,
          error: null,
        };
      }
      setGatewayState(state);
    } catch {
      // não crítico — gateway config é opcional
    }
  }, []);

  const handleSaveGatewayConfig = useCallback(
    async (codigo: string) => {
      const config = gatewayConfigs.find((c) => c.codigo === codigo);
      if (!config) return;
      const valor = Number(gatewayState[codigo]?.valor ?? 0);
      if (!Number.isFinite(valor) || valor < 0) return;

      setGatewayState((prev) => ({
        ...prev,
        [codigo]: { ...prev[codigo], saving: true, error: null },
      }));

      try {
        const res = await fetch('/api/admin/financeiro/gateway-config', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo, valor }),
        });
        const responseData = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(responseData.error ?? 'Erro ao salvar');
        setGatewayState((prev) => ({
          ...prev,
          [codigo]: {
            ...prev[codigo],
            saving: false,
            saved: true,
            error: null,
          },
        }));
        setTimeout(() => {
          setGatewayState((prev) => ({
            ...prev,
            [codigo]: { ...prev[codigo], saved: false },
          }));
        }, 2000);
      } catch (err) {
        setGatewayState((prev) => ({
          ...prev,
          [codigo]: {
            ...prev[codigo],
            saving: false,
            error: err instanceof Error ? err.message : 'Erro',
          },
        }));
      }
    },
    [gatewayConfigs, gatewayState]
  );

  useEffect(() => {
    void loadData();
    void loadGatewayConfigs();
  }, [loadData, loadGatewayConfigs]);

  const cardsResumo = useMemo(() => {
    if (!data) return [];

    return [
      { label: 'Hoje', resumo: data.resumo.dia },
      { label: '7 dias', resumo: data.resumo.semana },
      { label: '30 dias', resumo: data.resumo.mes },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
        Carregando auditoria da Sociedade...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4 p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error ?? 'Sem dados para exibir no momento.'}
        </div>
        <button
          onClick={() => void loadData()}
          className="inline-flex cursor-pointer items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sociedade</h2>
          <p className="mt-1 text-sm text-gray-600">
            Auditoria dos valores que entram no sistema e sua distribuição entre
            impostos, representantes e sócios.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              data.modoOperacao === 'real'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {data.modoOperacao === 'real'
              ? 'Split real habilitado'
              : 'Modo simulação ativo'}
          </span>
          <button
            onClick={() => void loadData()}
            className="inline-flex cursor-pointer items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </button>
        </div>
      </div>

      {!data.persistenciaDisponivel && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          A estrutura já está pronta em modo de simulação. A persistência
          definitiva dos beneficiários societários será habilitada ao aplicar a
          migration da Sociedade.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-200 px-6 py-4">
          <Landmark className="h-4 w-4 text-orange-500" />
          <h3 className="font-semibold text-gray-900">Resumo por período</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Período
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">
                  Entrada bruta
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">
                  Impostos
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">
                  Tx. transação
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">
                  Custo oper.
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">
                  Representantes
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">
                  Ronaldo
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">
                  Antonio
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">
                  Eventos
                </th>
              </tr>
            </thead>
            <tbody>
              {cardsResumo.map(({ label, resumo }) => (
                <tr
                  key={label}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {label}
                  </td>
                  <td className="px-6 py-3 text-right font-semibold text-gray-900">
                    {formatCurrency(resumo.entradaBruta)}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-700">
                    {formatCurrency(resumo.impostos)}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-700">
                    {formatCurrency(resumo.gateway)}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-700">
                    {formatCurrency(resumo.custoOperacional ?? 0)}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-700">
                    {formatCurrency(resumo.representantes)}
                  </td>
                  <td className="px-6 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(resumo.ronaldo)}
                  </td>
                  <td className="px-6 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(resumo.antonio)}
                  </td>
                  <td className="px-6 py-3 text-right text-xs text-gray-500">
                    {resumo.totalEventos}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-orange-500" />
            <h3 className="font-semibold text-gray-900">
              Prontidão das wallets
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <div className="mb-1 font-medium text-gray-700">QWork</div>
              <WalletStatus ok={data.configuracao.qworkWalletConfigurada} />
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <div className="mb-1 font-medium text-gray-700">
                Representantes
              </div>
              <div className="text-gray-700">
                {data.configuracao.representantesComWallet} com wallet ·{' '}
                {data.configuracao.representantesSemWallet} pendentes
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <div className="mb-1 font-medium text-gray-700">Sócios</div>
              <div className="flex gap-2">
                <WalletStatus
                  ok={data.configuracao.socioRonaldoWalletConfigurada}
                />
                <WalletStatus
                  ok={data.configuracao.socioAntonioWalletConfigurada}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Taxas */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4 text-orange-500" />
            <h3 className="font-semibold text-gray-900">Taxas</h3>
          </div>
          {gatewayConfigs.length === 0 ? (
            <p className="text-sm text-gray-400">
              Configurações indisponíveis.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {GATEWAY_CONFIG_LABELS.map(({ codigo, label }) => {
                const config = gatewayConfigs.find((c) => c.codigo === codigo);
                if (!config) return null;
                const gs = gatewayState[codigo] ?? {
                  valor: '0',
                  saving: false,
                  saved: false,
                  error: null,
                };
                const unidade = config.tipo === 'taxa_fixa' ? 'R$' : '%';
                const isSaved = gs.saved;
                return (
                  <div
                    key={codigo}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-sm transition-colors ${
                      isSaved
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-gray-600">
                        {label}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {unidade === 'R$' ? 'Taxa fixa' : 'Percentual'}
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] text-gray-400">
                      {unidade}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={gs.valor}
                      onChange={(e) =>
                        setGatewayState((prev) => ({
                          ...prev,
                          [codigo]: { ...prev[codigo], valor: e.target.value },
                        }))
                      }
                      className="w-16 rounded border border-gray-200 bg-white px-1.5 py-1 text-right text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <button
                      onClick={() => void handleSaveGatewayConfig(codigo)}
                      disabled={gs.saving}
                      title="Salvar"
                      className={`flex shrink-0 items-center justify-center rounded p-1 text-white transition-colors disabled:opacity-50 ${
                        isSaved
                          ? 'bg-emerald-500'
                          : 'bg-orange-500 hover:bg-orange-600'
                      }`}
                    >
                      {gs.saving ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : isSaved ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {Object.values(gatewayState).some((s) => s.error) && (
            <p className="mt-2 text-xs text-red-600">
              {Object.values(gatewayState).find((s) => s.error)?.error}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-orange-500" />
          <h3 className="font-semibold text-gray-900">
            Eventos recentes de distribuição
          </h3>
        </div>
        {data.eventosRecentes.length === 0 ? (
          <p className="text-sm text-gray-500">
            Ainda não há pagamentos auditados no período selecionado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">Lote</th>
                  <th className="px-3 py-2">Rep.</th>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Tomador</th>
                  <th className="px-3 py-2">Tipo Pgto</th>
                  <th className="px-3 py-2">Bruto</th>
                  <th className="px-3 py-2">Rep.</th>
                  <th className="px-3 py-2">Impostos</th>
                  <th className="px-3 py-2">Tx. Transação</th>
                  <th className="px-3 py-2">Custo Oper.</th>
                  <th className="px-3 py-2">Ronaldo</th>
                  <th className="px-3 py-2">Antonio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.eventosRecentes.map((evento) => (
                  <tr key={evento.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs font-semibold text-blue-600">
                      #{evento.loteId}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-600">
                      {evento.representanteId
                        ? `#${evento.representanteId}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {new Date(evento.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-3 py-2 text-gray-800">
                      {evento.tomador}
                    </td>
                    <td className="px-3 py-2">
                      <MetodoBadge
                        metodo={evento.metodo}
                        parcelas={evento.numeroParcelas}
                        tipoCobranca={evento.tipoCobranca}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {formatCurrency(evento.valorBruto)}
                    </td>
                    <td className="px-3 py-2">
                      <div>{formatCurrency(evento.valorRepresentante)}</div>
                      <div className="mt-0.5 tabular-nums text-xs text-gray-400">
                        {evento.valorBruto > 0
                          ? (
                              (evento.valorRepresentante / evento.valorBruto) *
                              100
                            ).toFixed(1) + '%'
                          : '—'}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div>{formatCurrency(evento.valorImpostos)}</div>
                      <div className="mt-0.5 tabular-nums text-xs text-gray-400">
                        {evento.valorBruto > 0
                          ? (
                              (evento.valorImpostos / evento.valorBruto) *
                              100
                            ).toFixed(1) + '%'
                          : '—'}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div>{formatCurrency(evento.valorGateway)}</div>
                      <div className="mt-0.5 tabular-nums text-xs text-gray-400">
                        {evento.valorBruto > 0
                          ? (
                              (evento.valorGateway / evento.valorBruto) *
                              100
                            ).toFixed(1) + '%'
                          : '—'}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div>
                        {formatCurrency(evento.valorCustoOperacional ?? 0)}
                      </div>
                      <div className="mt-0.5 tabular-nums text-xs text-gray-400">
                        {evento.valorBruto > 0 &&
                        (evento.valorCustoOperacional ?? 0) > 0
                          ? (
                              ((evento.valorCustoOperacional ?? 0) /
                                evento.valorBruto) *
                              100
                            ).toFixed(1) + '%'
                          : '—'}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div>{formatCurrency(evento.valorSocioRonaldo)}</div>
                      <div className="mt-0.5 tabular-nums text-xs text-gray-400">
                        {evento.valorBruto > 0
                          ? (
                              (evento.valorSocioRonaldo / evento.valorBruto) *
                              100
                            ).toFixed(1) + '%'
                          : '—'}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div>{formatCurrency(evento.valorSocioAntonio)}</div>
                      <div className="mt-0.5 tabular-nums text-xs text-gray-400">
                        {evento.valorBruto > 0
                          ? (
                              (evento.valorSocioAntonio / evento.valorBruto) *
                              100
                            ).toFixed(1) + '%'
                          : '—'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
