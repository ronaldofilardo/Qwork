'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  UserX,
  UserPlus,
  User,
  FileText,
  RefreshCw,
  Clock,
  CheckCircle2,
} from 'lucide-react';

type Motivo =
  | 'INATIVADO_NO_LOTE'
  | 'NUNCA_AVALIADO'
  | 'ADICIONADO_APOS_LOTE'
  | 'SEM_CONCLUSAO_VALIDA';

interface FuncionarioPendente {
  cpf: string;
  nome: string;
  setor: string;
  funcao: string;
  email: string;
  matricula: string | null;
  ativo: boolean;
  criado_em: string;
  inativado_em: string | null;
  inativacao_lote_id: number | null;
  inativacao_lote_numero_ordem: number | null;
  motivo: Motivo;
}

interface LoteReferencia {
  id: number;
  numero_ordem: number;
  descricao: string | null;
  liberado_em: string;
  status: string;
}

interface PendenciasSectionProps {
  empresaId?: number; // RH context: empresa_id; Gestor/entidade: omit (API uses session)
  empresaNome?: string;
}

const MOTIVO_CONFIG: Record<
  Motivo,
  { label: string; desc: string; icon: any; cor: string; badge: string }
> = {
  INATIVADO_NO_LOTE: {
    label: 'Inativados no Lote de Referência',
    desc: 'Avaliação inativada durante o último ciclo liberado',
    icon: UserX,
    cor: 'red',
    badge: 'bg-red-100 text-red-700',
  },
  NUNCA_AVALIADO: {
    label: 'Nunca Avaliados',
    desc: 'Nunca participaram de nenhum ciclo avaliativo desta empresa',
    icon: User,
    cor: 'gray',
    badge: 'bg-gray-100 text-gray-700',
  },
  ADICIONADO_APOS_LOTE: {
    label: 'Adicionados Após o Último Lote',
    desc: 'Cadastrados após a liberação do lote de referência',
    icon: UserPlus,
    cor: 'blue',
    badge: 'bg-blue-100 text-blue-700',
  },
  SEM_CONCLUSAO_VALIDA: {
    label: 'Sem Conclusão Válida',
    desc: 'Participaram de algum ciclo, mas sem avaliação concluída em nenhum lote liberado',
    icon: AlertTriangle,
    cor: 'amber',
    badge: 'bg-amber-100 text-amber-700',
  },
};

const COR_CLASSES: Record<
  string,
  { icon: string; ring: string; avatar: string }
> = {
  red: { icon: 'text-red-600', ring: 'border-red-200', avatar: 'bg-red-100' },
  gray: {
    icon: 'text-gray-500',
    ring: 'border-gray-200',
    avatar: 'bg-gray-100',
  },
  blue: {
    icon: 'text-blue-600',
    ring: 'border-blue-200',
    avatar: 'bg-blue-100',
  },
  amber: {
    icon: 'text-amber-600',
    ring: 'border-amber-200',
    avatar: 'bg-amber-100',
  },
};

export default function PendenciasSection({
  empresaId,
  empresaNome,
}: PendenciasSectionProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [situacao, setSituacao] = useState<
    'SEM_LOTE' | 'COM_PENDENCIAS' | null
  >(null);
  const [lote, setLote] = useState<LoteReferencia | null>(null);
  const [funcionarios, setFuncionarios] = useState<FuncionarioPendente[]>([]);

  const fetchPendencias = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = empresaId
        ? `/api/pendencias/lote?empresa_id=${empresaId}`
        : '/api/pendencias/lote';
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao buscar pendências');
      }
      const data = await res.json();
      setSituacao(data.situacao);
      setLote(data.lote);
      setFuncionarios(data.funcionarios || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar pendências');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendencias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-500">Carregando pendências...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />
        <p className="text-red-700 font-medium">{error}</p>
        <button
          onClick={fetchPendencias}
          className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // Sem ciclo avaliativo liberado
  if (situacao === 'SEM_LOTE') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Nenhum ciclo avaliativo liberado
        </h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          As pendências serão exibidas após a liberação do primeiro ciclo de
          coleta avaliativa
          {empresaNome ? ` para ${empresaNome}` : ''}.
        </p>
      </div>
    );
  }

  const MOTIVO_ORDER: Motivo[] = [
    'INATIVADO_NO_LOTE',
    'NUNCA_AVALIADO',
    'ADICIONADO_APOS_LOTE',
    'SEM_CONCLUSAO_VALIDA',
  ];

  const grupos = MOTIVO_ORDER.map((motivo) => ({
    motivo,
    lista: funcionarios.filter((f) => f.motivo === motivo),
  })).filter((g) => g.lista.length > 0);

  return (
    <div className="space-y-6">
      {/* Cabeçalho + lote de referência */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Pendências
              {funcionarios.length > 0 && (
                <span className="ml-2 px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                  {funcionarios.length} funcionário
                  {funcionarios.length !== 1 ? 's' : ''}
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Funcionários ativos sem avaliação concluída em nenhum ciclo
              avaliativo liberado
            </p>
          </div>
          <button
            onClick={fetchPendencias}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Atualizar"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {/* Card do lote de referência */}
        {lote && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-4">
            <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900">
                Lote de referência:{' '}
                <strong>
                  Ciclo de Coleta Avaliativa #{lote.numero_ordem ?? lote.id}
                </strong>
              </p>
              <p className="text-xs text-blue-700 mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Liberado em {formatDate(lote.liberado_em)}
                <span className="mx-1">•</span>
                Status:{' '}
                <span className="capitalize font-medium">
                  {lote.status?.replace(/_/g, ' ') || '—'}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sem pendências */}
      {funcionarios.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-500 mb-3" />
          <h3 className="text-lg font-semibold text-green-700 mb-1">
            Nenhuma pendência encontrada
          </h3>
          <p className="text-green-600 text-sm">
            Todos os funcionários ativos possuem avaliação concluída em algum
            ciclo avaliativo liberado.
          </p>
        </div>
      )}

      {/* Grupos por motivo */}
      {grupos.map(({ motivo, lista }) => {
        const cfg = MOTIVO_CONFIG[motivo];
        const cor = COR_CLASSES[cfg.cor];
        const Icon = cfg.icon;

        return (
          <div
            key={motivo}
            className={`bg-white rounded-lg shadow-sm border ${cor.ring}`}
          >
            <div className={`px-6 py-4 border-b ${cor.ring}`}>
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Icon className={`h-5 w-5 ${cor.icon}`} />
                {cfg.label}
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${cfg.badge}`}
                >
                  {lista.length}
                </span>
              </h4>
              <p className="text-xs text-gray-500 mt-1">{cfg.desc}</p>
            </div>

            <div className="divide-y divide-gray-100">
              {lista.map((func) => (
                <div
                  key={func.cpf}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex-shrink-0 h-10 w-10 rounded-full ${cor.avatar} flex items-center justify-center`}
                    >
                      <Icon className={`h-5 w-5 ${cor.icon}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate flex items-center gap-2">
                        {func.nome}
                        {!func.ativo && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600">
                            Inativo
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {[func.setor, func.funcao]
                          .filter(Boolean)
                          .join(' • ') || '—'}
                        {func.matricula ? ` • Mat: ${func.matricula}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-4 space-y-1">
                    {motivo === 'INATIVADO_NO_LOTE' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inativado
                        {func.inativacao_lote_id
                          ? ` (Ciclo de Coleta Avaliativa ID: ${func.inativacao_lote_id})`
                          : ''}
                      </span>
                    )}
                    {func.inativado_em && (
                      <p className="text-xs text-gray-400">
                        {formatDate(func.inativado_em)}
                      </p>
                    )}
                    {motivo === 'ADICIONADO_APOS_LOTE' && (
                      <p className="text-xs text-gray-400">
                        Cadastrado em {formatDate(func.criado_em)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Legenda */}
      {funcionarios.length > 0 && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium mb-2">
            Legenda dos motivos:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MOTIVO_ORDER.filter((m) =>
              funcionarios.some((f) => f.motivo === m)
            ).map((m) => (
              <div
                key={m}
                className="flex items-start gap-2 text-xs text-gray-600"
              >
                <span
                  className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs ${MOTIVO_CONFIG[m].badge}`}
                >
                  {MOTIVO_CONFIG[m].label.split(' ')[0]}
                </span>
                <span>{MOTIVO_CONFIG[m].desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
