'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Search,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  Shield,
} from 'lucide-react';
import type { DelecaoPreview, DelecaoHistoricoItem } from './types';
import { formatDate } from './helpers';

// ── Fases da cascata ─────────────────────────────────────────────────────

const FASES = [
  {
    numero: 1,
    titulo: 'Comissões e Vínculos Comerciais',
    descricao:
      'Remove comissões de laudo, vínculos de comissão e desvincula emissores externos.',
    tabelas: [
      'comissoes_laudo',
      'vinculos_comissao',
      'laudos_emissor_desvinculado',
    ],
  },
  {
    numero: 2,
    titulo: 'Laudos e Artefatos',
    descricao:
      'Remove laudos, downloads, arquivos remotos e PDFs associados aos lotes.',
    tabelas: [
      'laudos',
      'laudo_downloads',
      'laudo_arquivos_remotos',
      'pdf_jobs',
    ],
  },
  {
    numero: 3,
    titulo: 'Avaliações e Dados',
    descricao:
      'Remove avaliações, respostas, resultados, análises estatísticas e resets.',
    tabelas: [
      'avaliacoes',
      'respostas',
      'resultados',
      'analise_estatistica',
      'avaliacao_resets',
    ],
  },
  {
    numero: 4,
    titulo: 'Lotes, Jobs e Filas',
    descricao:
      'Remove lotes de avaliação, filas de emissão, jobs e auditoria de laudos.',
    tabelas: [
      'lotes_avaliacao',
      'laudo_generation_jobs',
      'emissao_queue',
      'fila_emissao',
      'auditoria_laudos',
      'notificacoes_admin',
    ],
  },
  {
    numero: 5,
    titulo: 'Financeiro',
    descricao: 'Remove recibos, pagamentos, contratos e tokens de pagamento.',
    tabelas: [
      'recibos',
      'pagamentos',
      'contratos',
      'pdf_jobs',
      'auditoria_recibos',
      'tokens_retomada_pagamento',
      'notificacoes_admin',
    ],
  },
  {
    numero: 6,
    titulo: 'Funcionários e Vínculos',
    descricao:
      'Remove vínculos de funcionários, MFA codes. Preserva funcionários com vínculos em outros tomadores.',
    tabelas: [
      'funcionarios',
      'funcionarios_entidades',
      'funcionarios_clinicas',
      'mfa_codes',
    ],
  },
  {
    numero: 7,
    titulo: 'Senhas e Usuários',
    descricao: 'Remove senhas de gestores/RH e usuários do sistema.',
    tabelas: ['entidades_senhas', 'clinicas_senhas', 'usuarios'],
  },
  {
    numero: 8,
    titulo: 'Leads e Comercial',
    descricao: 'Desvincula leads de representantes (SET NULL).',
    tabelas: ['leads_desvinculados'],
  },
  {
    numero: 9,
    titulo: 'Entidade/Clínica (Root)',
    descricao:
      'Remove a entidade ou clínica e registra auditoria da deleção completa.',
    tabelas: [
      'entidades',
      'clinicas',
      'empresas_clientes',
      'importacoes_clinica',
    ],
  },
] as const;

// ── Componentes auxiliares ───────────────────────────────────────────────

function InfoCard({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}): JSX.Element {
  return (
    <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200">
      <div className="text-xs text-gray-500">{label}</div>
      <div
        className={`text-sm font-medium text-gray-900 ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </div>
    </div>
  );
}

function formatCNPJ(cnpj: string): string {
  if (!cnpj || cnpj.length !== 14) return cnpj ?? '—';
  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

// ── Componente Principal ────────────────────────────────────────────────

export function DelecaoTomadorContent(): JSX.Element {
  const [cnpj, setCnpj] = useState('');
  const [preview, setPreview] = useState<DelecaoPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faseAtual, setFaseAtual] = useState(0);
  const [fasesCompletas, setFasesCompletas] = useState<Set<number>>(new Set());
  const [faseExecutando, setFaseExecutando] = useState(false);
  const [faseDeletados, setFaseDeletados] = useState<
    Record<number, Record<string, number>>
  >({});
  const [historico, setHistorico] = useState<DelecaoHistoricoItem[]>([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);

  // Carregar histórico ao montar
  const fetchHistorico = useCallback(async () => {
    setHistoricoLoading(true);
    try {
      const res = await fetch('/api/admin/delecao/historico', {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Erro ao carregar histórico');
      const json = await res.json();
      setHistorico(json.historico ?? []);
    } catch {
      // silencioso — histórico é secundário
    } finally {
      setHistoricoLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  // Buscar preview do tomador
  const buscarTomador = useCallback(async () => {
    const limpo = cnpj.replace(/\D/g, '');
    if (limpo.length !== 14) {
      setError('Informe exatamente 14 dígitos do CNPJ.');
      return;
    }

    setLoading(true);
    setError(null);
    setPreview(null);
    setFaseAtual(0);
    setFasesCompletas(new Set());
    setFaseDeletados({});

    try {
      const res = await fetch(
        `/api/admin/delecao/preview?cnpj=${encodeURIComponent(limpo)}`,
        { cache: 'no-store' }
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Erro ao buscar tomador.');
        return;
      }
      setPreview(json as DelecaoPreview);
    } catch {
      setError('Erro de conexão ao buscar tomador.');
    } finally {
      setLoading(false);
    }
  }, [cnpj]);

  // Executar uma fase
  const executarFase = useCallback(
    async (faseNum: number) => {
      if (!preview) return;

      setFaseExecutando(true);
      setError(null);

      try {
        const res = await fetch('/api/admin/delecao/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cnpj: preview.tomador.cnpj,
            fase: faseNum,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          setError(json.error || `Erro ao executar fase ${faseNum}.`);
          return;
        }

        setFasesCompletas((prev) => new Set([...prev, faseNum]));
        setFaseDeletados((prev) => ({
          ...prev,
          [faseNum]: json.deletados || {},
        }));

        // Avançar para próxima fase automaticamente
        if (faseNum < 9) {
          setFaseAtual(faseNum + 1);
        } else {
          // Deleção completa — recarregar histórico
          setFaseAtual(10);
          fetchHistorico();
        }
      } catch {
        setError('Erro de conexão ao executar deleção.');
      } finally {
        setFaseExecutando(false);
      }
    },
    [preview, fetchHistorico]
  );

  // Reset completo
  const resetar = useCallback(() => {
    setCnpj('');
    setPreview(null);
    setError(null);
    setFaseAtual(0);
    setFasesCompletas(new Set());
    setFaseDeletados({});
  }, []);

  const totalDeletados = Object.values(faseDeletados).reduce(
    (acc, d) => acc + Object.values(d).reduce((s, v) => s + v, 0),
    0
  );

  const delecaoCompleta = faseAtual === 10;

  return (
    <div className="space-y-6">
      {/* Input de CNPJ */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Hard-Delete de Tomador
            </h3>
            <p className="text-sm text-gray-500">
              Deleção física e irreversível de tomador e todos os dados
              relacionados.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={cnpj}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 14);
                setCnpj(v);
              }}
              placeholder="Digite o CNPJ (14 dígitos)"
              disabled={!!preview && !delecaoCompleta}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono
                focus:ring-2 focus:ring-red-500 focus:border-red-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                transition-colors"
              maxLength={14}
              aria-label="CNPJ do tomador"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {cnpj.length}/14
            </span>
          </div>
          {!preview || delecaoCompleta ? (
            <button
              onClick={buscarTomador}
              disabled={loading || cnpj.replace(/\D/g, '').length !== 14}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg
                hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                transition-colors cursor-pointer font-medium text-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Buscar
            </button>
          ) : (
            <button
              onClick={resetar}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg
                hover:bg-gray-700 transition-colors cursor-pointer font-medium text-sm"
            >
              <XCircle className="w-4 h-4" />
              Cancelar
            </button>
          )}
        </div>

        {error && (
          <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Preview do Tomador */}
      {preview && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h4 className="text-lg font-semibold text-gray-900">
              Tomador Encontrado
            </h4>
            {delecaoCompleta && (
              <span className="ml-auto px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Deleção Completa
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <InfoCard label="Nome" value={preview.tomador.nome} />
            <InfoCard
              label="CNPJ"
              value={formatCNPJ(preview.tomador.cnpj)}
              mono
            />
            <InfoCard
              label="Tipo"
              value={
                preview.tomador.tipo === 'entidade' ? 'Entidade' : 'Clínica'
              }
            />
            <InfoCard label="Status" value={preview.tomador.status || '-'} />
          </div>

          {/* Contagens */}
          <div className="mb-6">
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              Registros que serão deletados:
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {Object.entries(preview.contagens)
                .filter(([, v]) => v > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([table, count]) => (
                  <div
                    key={table}
                    className="px-3 py-2 bg-red-50 border border-red-100 rounded text-xs"
                  >
                    <div className="font-mono text-red-800 truncate">
                      {table}
                    </div>
                    <div className="font-bold text-red-600">{count}</div>
                  </div>
                ))}
            </div>
            {Object.values(preview.contagens).every((v) => v === 0) && (
              <p className="text-sm text-gray-500 italic">
                Nenhum registro relacionado encontrado.
              </p>
            )}
          </div>

          {/* Fases de Cascata */}
          {!delecaoCompleta && (
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Confirmação por Fase ({fasesCompletas.size}/9 completas)
              </h5>

              {FASES.map((f) => {
                const completa = fasesCompletas.has(f.numero);
                const ativa = faseAtual === f.numero;
                const pendente = f.numero > faseAtual;
                const deletadosFase = faseDeletados[f.numero];

                return (
                  <div
                    key={f.numero}
                    className={`border rounded-lg transition-all ${
                      completa
                        ? 'border-green-200 bg-green-50'
                        : ativa
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      {/* Indicador */}
                      <div className="flex-shrink-0">
                        {completa ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : ativa ? (
                          <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold ${
                              completa
                                ? 'text-green-700'
                                : ativa
                                  ? 'text-red-700'
                                  : 'text-gray-400'
                            }`}
                          >
                            Fase {f.numero}
                          </span>
                          <span
                            className={`text-sm font-medium ${
                              completa
                                ? 'text-green-800'
                                : ativa
                                  ? 'text-red-800'
                                  : 'text-gray-500'
                            }`}
                          >
                            {f.titulo}
                          </span>
                        </div>
                        <p
                          className={`text-xs mt-0.5 ${
                            completa
                              ? 'text-green-600'
                              : ativa
                                ? 'text-red-600'
                                : 'text-gray-400'
                          }`}
                        >
                          {f.descricao}
                        </p>
                        {/* Deletados nesta fase */}
                        {completa && deletadosFase && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(deletadosFase)
                              .filter(([, v]) => v > 0)
                              .map(([t, v]) => (
                                <span
                                  key={t}
                                  className="text-[10px] px-1.5 py-0.5 bg-green-200 text-green-800 rounded font-mono"
                                >
                                  {t}: {v}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Botão de confirmação */}
                      {ativa && !completa && (
                        <button
                          onClick={() => executarFase(f.numero)}
                          disabled={faseExecutando}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm
                            font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400
                            disabled:cursor-not-allowed transition-colors cursor-pointer flex-shrink-0"
                        >
                          {faseExecutando ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          Confirmar e Executar
                        </button>
                      )}
                      {pendente && !completa && (
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          Aguardando
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Botão iniciar */}
              {faseAtual === 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => setFaseAtual(1)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3
                      bg-red-600 text-white rounded-lg hover:bg-red-700
                      transition-colors cursor-pointer font-medium"
                  >
                    <AlertTriangle className="w-5 h-5" />
                    Iniciar Processo de Deleção
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Cada fase precisa ser confirmada individualmente. A deleção
                    é irreversível.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Mensagem de conclusão */}
          {delecaoCompleta && (
            <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Deleção concluída com sucesso.{' '}
                  {totalDeletados > 0 && (
                    <span className="font-normal">
                      Total: {totalDeletados} registros removidos.
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Histórico de Deleções */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Histórico de Deleções
          </h3>
          <p className="text-sm text-gray-600">
            Registros de tomadores deletados permanentemente.
          </p>
        </div>
        <div className="overflow-x-auto">
          {historicoLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : historico.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Nenhuma deleção registrada.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-left">
                    CNPJ
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-left">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-center">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-left">
                    Admin
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-center">
                    Data/Hora
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-center">
                    Registros
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historico.map((item) => {
                  const totalRegs = Object.values(item.resumo || {}).reduce(
                    (s, v) => s + (typeof v === 'number' ? v : 0),
                    0
                  );
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono">
                        {formatCNPJ(item.cnpj)}
                      </td>
                      <td className="px-4 py-3 text-sm">{item.nome}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            item.tipo === 'entidade'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {item.tipo === 'entidade' ? 'Entidade' : 'Clínica'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.admin_nome}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600">
                        {formatDate(item.criado_em)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center font-medium text-red-600">
                        {totalRegs}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
