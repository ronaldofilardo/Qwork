'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Landmark, RefreshCw, ShieldCheck, Users, Wallet } from 'lucide-react';

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
  representantes: number;
  comercial: number;
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
  valorBruto: number;
  valorImpostos: number;
  valorRepresentante: number;
  valorComercial: number;
  valorSocioRonaldo: number;
  valorSocioAntonio: number;
  representanteNome: string | null;
}

interface SociedadeResponse {
  success: boolean;
  modoOperacao: 'simulacao' | 'real';
  persistenciaDisponivel: boolean;
  qwork: QWorkSociedadeConfig;
  beneficiarios: BeneficiarioSociedade[];
  configuracao: {
    qworkWalletConfigurada: boolean;
    comercialWalletConfigurada: boolean;
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
  mensagensSimuladas: Array<{
    perfil: string;
    titulo: string;
    mensagem: string;
  }>;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

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
        if (response.status === 403 && errorPayload.error === 'MFA_REQUIRED') {
          setError(
            errorPayload.message ??
              'A visualização da Sociedade exige MFA verificado para admins.'
          );
          setData(null);
          return;
        }

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

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
            impostos, representantes, comercial e sócios.
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

      <div className="grid gap-4 md:grid-cols-3">
        {cardsResumo.map(({ label, resumo }) => (
          <div
            key={label}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                {label}
              </span>
              <Landmark className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(resumo.entradaBruta)}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {resumo.totalEventos} eventos auditados
            </p>
            <div className="mt-4 space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Impostos</span>
                <span>{formatCurrency(resumo.impostos)}</span>
              </div>
              <div className="flex justify-between">
                <span>Representantes</span>
                <span>{formatCurrency(resumo.representantes)}</span>
              </div>
              <div className="flex justify-between">
                <span>Comercial</span>
                <span>{formatCurrency(resumo.comercial)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
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
              <div className="mb-1 font-medium text-gray-700">Comercial</div>
              <WalletStatus ok={data.configuracao.comercialWalletConfigurada} />
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

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-orange-500" />
            <h3 className="font-semibold text-gray-900">Mensagens simuladas</h3>
          </div>
          <div className="space-y-3">
            {data.mensagensSimuladas.length === 0 ? (
              <p className="text-sm text-gray-500">
                Nenhuma mensagem simulada ainda.
              </p>
            ) : (
              data.mensagensSimuladas.map((item, index) => (
                <div
                  key={`${item.perfil}-${index}`}
                  className="rounded-lg bg-gray-50 p-3 text-sm"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium text-gray-800">
                      {item.titulo}
                    </span>
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-700">
                      {item.perfil}
                    </span>
                  </div>
                  <p className="text-gray-600">{item.mensagem}</p>
                </div>
              ))
            )}
          </div>
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
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Tomador</th>
                  <th className="px-3 py-2">Bruto</th>
                  <th className="px-3 py-2">Rep.</th>
                  <th className="px-3 py-2">Comercial</th>
                  <th className="px-3 py-2">Impostos</th>
                  <th className="px-3 py-2">Ronaldo</th>
                  <th className="px-3 py-2">Antonio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.eventosRecentes.map((evento) => (
                  <tr key={evento.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-600">
                      {new Date(evento.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-3 py-2 text-gray-800">
                      {evento.tomador}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {formatCurrency(evento.valorBruto)}
                    </td>
                    <td className="px-3 py-2">
                      {formatCurrency(evento.valorRepresentante)}
                    </td>
                    <td className="px-3 py-2">
                      {formatCurrency(evento.valorComercial)}
                    </td>
                    <td className="px-3 py-2">
                      {formatCurrency(evento.valorImpostos)}
                    </td>
                    <td className="px-3 py-2">
                      {formatCurrency(evento.valorSocioRonaldo)}
                    </td>
                    <td className="px-3 py-2">
                      {formatCurrency(evento.valorSocioAntonio)}
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
