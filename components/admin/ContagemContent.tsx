'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  FileStack,
  FileCheck,
  CheckCircle2,
  Building2,
  RefreshCw,
  Briefcase,
} from 'lucide-react';

interface ContagemMetricas {
  funcionarios: number;
  lotes: number;
  laudos: number;
  avaliacoes_liberadas: number;
  avaliacoes_concluidas: number;
  entidades?: number;
  clinicas?: number;
}

interface ItemEntidade {
  id: number;
  nome: string;
  ativos: number;
  inativos: number;
}

interface ItemClinica {
  id: number;
  nome: string;
  empresas_clientes: number;
  ativos: number;
  inativos: number;
}

interface ContagemData {
  entidades: ContagemMetricas;
  clinicas: ContagemMetricas;
  lista_entidades: ItemEntidade[];
  lista_clinicas: ItemClinica[];
  success: boolean;
  error?: string;
}

interface MetricaCardProps {
  icon: React.ElementType;
  label: string;
  valor: number;
  cor: string;
}

function MetricaCard({ icon: Icon, label, valor, cor }: MetricaCardProps) {
  return (
    <div
      className="flex items-center gap-4 p-4 border-l-4 border-transparent hover:bg-gray-50 transition-colors"
      style={{ borderLeftColor: cor }}
    >
      <div className="p-3 rounded-lg" style={{ backgroundColor: `${cor}20` }}>
        <Icon size={24} style={{ color: cor }} />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{valor}</p>
      </div>
    </div>
  );
}

function TabelaAtivoInativo({
  loading,
  rows,
  colunaExtra,
}: {
  loading: boolean;
  rows: Array<{
    id: number;
    nome: string;
    extra?: number;
    extraLabel?: string;
    ativos: number;
    inativos: number;
  }>;
  colunaExtra?: string;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic text-center py-4">
        Nenhum registro encontrado
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 pr-3 text-gray-500 font-medium">
              Nome
            </th>
            {colunaExtra && (
              <th className="text-center py-2 px-2 text-gray-500 font-medium whitespace-nowrap">
                {colunaExtra}
              </th>
            )}
            <th className="text-center py-2 px-2 text-emerald-600 font-medium">
              Ativos
            </th>
            <th className="text-center py-2 pl-2 text-red-500 font-medium">
              Inativos
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <td className="py-2 pr-3 text-gray-800 font-medium">
                {row.nome}
              </td>
              {colunaExtra !== undefined && (
                <td className="text-center py-2 px-2 text-gray-700">
                  {row.extra ?? 0}
                </td>
              )}
              <td className="text-center py-2 px-2">
                <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                  {row.ativos}
                </span>
              </td>
              <td className="text-center py-2 pl-2">
                <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold">
                  {row.inativos}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PainelContagemVertical({
  titulo,
  metricas,
  loading,
  listaEntidades,
  listaClinicas,
}: {
  titulo: string;
  metricas: ContagemMetricas;
  loading: boolean;
  listaEntidades?: ItemEntidade[];
  listaClinicas?: ItemClinica[];
}) {
  const isEntidades = titulo === 'Entidades';

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
        <h3 className="text-lg font-bold text-white">{titulo}</h3>
      </div>

      {/* Grid de Métricas */}
      <div className="p-4 space-y-1">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {isEntidades && metricas.entidades !== undefined && (
              <MetricaCard
                icon={Briefcase}
                label="Entidades"
                valor={metricas.entidades}
                cor="#F97316"
              />
            )}
            <MetricaCard
              icon={Users}
              label="Funcionários"
              valor={metricas.funcionarios}
              cor="#3B82F6"
            />
            <MetricaCard
              icon={FileStack}
              label="Lotes"
              valor={metricas.lotes}
              cor="#8B5CF6"
            />
            <MetricaCard
              icon={FileCheck}
              label="Laudos"
              valor={metricas.laudos}
              cor="#10B981"
            />
            <MetricaCard
              icon={CheckCircle2}
              label="Avaliações Liberadas"
              valor={metricas.avaliacoes_liberadas}
              cor="#F59E0B"
            />
            <MetricaCard
              icon={CheckCircle2}
              label="Avaliações Concluídas"
              valor={metricas.avaliacoes_concluidas}
              cor="#06B6D4"
            />
            {metricas.clinicas !== undefined && (
              <MetricaCard
                icon={Building2}
                label="Clínicas"
                valor={metricas.clinicas}
                cor="#EC4899"
              />
            )}
          </>
        )}
      </div>

      {/* Separador + lista detalhada */}
      <div className="border-t border-gray-100 px-4 pb-4 pt-3">
        {isEntidades && listaEntidades !== undefined ? (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Detalhamento por Entidade
            </p>
            <TabelaAtivoInativo
              loading={loading}
              rows={listaEntidades.map((e) => ({
                id: e.id,
                nome: e.nome,
                ativos: e.ativos,
                inativos: e.inativos,
              }))}
            />
          </>
        ) : listaClinicas !== undefined ? (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Detalhamento por Clínica
            </p>
            <TabelaAtivoInativo
              loading={loading}
              colunaExtra="Empresas"
              rows={listaClinicas.map((c) => ({
                id: c.id,
                nome: c.nome,
                extra: c.empresas_clientes,
                ativos: c.ativos,
                inativos: c.inativos,
              }))}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

export function ContagemContent() {
  const [dados, setDados] = useState<ContagemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch('/api/admin/contagem');
      if (!res.ok) throw new Error('Falha ao carregar dados de contagem');

      const json: ContagemData = await res.json();
      setDados(json);
      setUltimaAtualizacao(new Date());
      if (json.error) {
        setErro(json.error);
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar dados');
      console.error('Erro ao carregar contagem:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contagem</h2>
          <p className="text-sm text-gray-600 mt-1">
            Resumo de métricas operacionais
          </p>
        </div>
        <button
          onClick={carregar}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Exibição de Erro */}
      {erro && !loading && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{erro}</p>
        </div>
      )}

      {/* Grid com dois painéis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel Entidades */}
        <PainelContagemVertical
          titulo="Entidades"
          metricas={
            dados?.entidades ?? {
              entidades: 0,
              funcionarios: 0,
              lotes: 0,
              laudos: 0,
              avaliacoes_liberadas: 0,
              avaliacoes_concluidas: 0,
            }
          }
          loading={loading}
          listaEntidades={dados?.lista_entidades}
        />

        {/* Painel Clínicas */}
        <PainelContagemVertical
          titulo="Clínicas"
          metricas={
            dados?.clinicas ?? {
              clinicas: 0,
              funcionarios: 0,
              lotes: 0,
              laudos: 0,
              avaliacoes_liberadas: 0,
              avaliacoes_concluidas: 0,
            }
          }
          loading={loading}
          listaClinicas={dados?.lista_clinicas}
        />
      </div>

      {/* Rodapé com informação de atualização */}
      {ultimaAtualizacao && (
        <div className="text-xs text-gray-500 text-right">
          Última atualização: {ultimaAtualizacao.toLocaleTimeString('pt-BR')}
        </div>
      )}
    </div>
  );
}
