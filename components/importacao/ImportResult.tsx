'use client';

import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  Users,
  Link2,
  UserMinus,
  RotateCcw,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

interface ImportStats {
  empresas_criadas: number;
  empresas_existentes: number;
  empresas_bloqueadas: number;
  empresas_nome_atualizados?: number;
  funcionarios_criados: number;
  funcionarios_atualizados: number;
  nivel_cargo_alterados: number;
  vinculos_criados: number;
  vinculos_atualizados: number;
  inativacoes: number;
  total_erros: number;
}

interface ImportError {
  linha?: number;
  mensagem: string;
}

interface FuncaoAlterada {
  nome: string;
  funcaoAnterior: string | null;
  funcaoNova: string;
}

interface ImportResultProps {
  sucesso: boolean;
  stats: ImportStats;
  erros: ImportError[];
  tempoMs: number;
  totalLinhas: number;
  funcoesAlteradas?: FuncaoAlterada[];
  hideEmpresaStats?: boolean;
  onNovaImportacao: () => void;
}

function ResultItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-gray-600">{label}:</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export default function ImportResult({
  sucesso,
  stats,
  erros,
  tempoMs,
  totalLinhas,
  funcoesAlteradas,
  hideEmpresaStats = false,
  onNovaImportacao,
}: ImportResultProps) {
  const temBloqueios = !hideEmpresaStats && stats.empresas_bloqueadas > 0;
  const status = !sucesso ? 'erro' : temBloqueios ? 'parcial' : 'sucesso';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className={`rounded-lg p-4 border flex items-center gap-3 ${
          status === 'sucesso'
            ? 'bg-green-50 border-green-200'
            : status === 'parcial'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-red-50 border-red-200'
        }`}
      >
        {status === 'sucesso' ? (
          <CheckCircle size={32} className="text-green-600 flex-shrink-0" />
        ) : status === 'parcial' ? (
          <AlertTriangle size={32} className="text-amber-600 flex-shrink-0" />
        ) : (
          <XCircle size={32} className="text-red-600 flex-shrink-0" />
        )}
        <div>
          <h3
            className={`text-lg font-semibold ${
              status === 'sucesso'
                ? 'text-green-800'
                : status === 'parcial'
                  ? 'text-amber-800'
                  : 'text-red-800'
            }`}
          >
            {status === 'sucesso'
              ? 'Importação Concluída!'
              : status === 'parcial'
                ? 'Importação Parcial'
                : 'Importação com Erros'}
          </h3>
          <p
            className={`text-sm ${
              status === 'sucesso'
                ? 'text-green-700'
                : status === 'parcial'
                  ? 'text-amber-700'
                  : 'text-red-700'
            }`}
          >
            {totalLinhas} linhas processadas em {(tempoMs / 1000).toFixed(1)}s
          </p>
        </div>
      </div>

      {/* Aviso de bloqueio por CNPJ */}
      {temBloqueios && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle
              size={16}
              className="text-amber-600 mt-0.5 flex-shrink-0"
            />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {stats.empresas_bloqueadas} empresa
                {stats.empresas_bloqueadas > 1
                  ? 's bloqueadas'
                  : ' bloqueada'}{' '}
                — CNPJ já cadastrado em outra clínica
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Os funcionários vinculados a
                {stats.empresas_bloqueadas > 1
                  ? ' essas empresas'
                  : ' essa empresa'}{' '}
                não foram importados. Consulte os erros abaixo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Resultado</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {!hideEmpresaStats && (
            <>
              <ResultItem
                icon={<Building2 size={16} className="text-green-500" />}
                label="Empresas criadas"
                value={stats.empresas_criadas}
              />
              <ResultItem
                icon={<Building2 size={16} className="text-gray-400" />}
                label="Empresas existentes"
                value={stats.empresas_existentes}
              />
              {stats.empresas_bloqueadas > 0 && (
                <ResultItem
                  icon={<AlertTriangle size={16} className="text-amber-500" />}
                  label="Empresas bloqueadas"
                  value={stats.empresas_bloqueadas}
                />
              )}
              {(stats.empresas_nome_atualizados ?? 0) > 0 && (
                <ResultItem
                  icon={<Building2 size={16} className="text-teal-500" />}
                  label="Nomes atualizados"
                  value={stats.empresas_nome_atualizados!}
                />
              )}
            </>
          )}
          <ResultItem
            icon={<Users size={16} className="text-green-500" />}
            label="Funcionários criados"
            value={stats.funcionarios_criados}
          />
          <ResultItem
            icon={<Users size={16} className="text-blue-500" />}
            label="Funcionários atualizados"
            value={stats.funcionarios_atualizados}
          />
          {stats.nivel_cargo_alterados > 0 && (
            <ResultItem
              icon={<TrendingUp size={16} className="text-purple-500" />}
              label="Mudanças de nível"
              value={stats.nivel_cargo_alterados}
            />
          )}
          <ResultItem
            icon={<Link2 size={16} className="text-green-500" />}
            label="Vínculos criados"
            value={stats.vinculos_criados}
          />
          <ResultItem
            icon={<Link2 size={16} className="text-blue-500" />}
            label="Vínculos atualizados"
            value={stats.vinculos_atualizados}
          />
          <ResultItem
            icon={<UserMinus size={16} className="text-orange-500" />}
            label="Inativações"
            value={stats.inativacoes}
          />
          {stats.total_erros > 0 && (
            <ResultItem
              icon={<XCircle size={16} className="text-red-500" />}
              label="Erros"
              value={stats.total_erros}
            />
          )}
        </div>
      </div>

      {/* Funções alteradas por mudança de cargo */}
      {funcoesAlteradas && funcoesAlteradas.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
            <ArrowRight size={15} className="text-orange-500" />
            Funções alteradas ({funcoesAlteradas.length})
          </h3>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {funcoesAlteradas.map((f, i) => (
              <div
                key={i}
                className="text-xs text-orange-800 flex items-center gap-1.5"
              >
                <span className="font-medium min-w-0 truncate">{f.nome}</span>
                <span className="text-orange-400 flex-shrink-0">:</span>
                <span className="text-orange-600 flex-shrink-0">
                  {f.funcaoAnterior ?? 'não definida'}
                </span>
                <ArrowRight
                  size={11}
                  className="text-orange-400 flex-shrink-0"
                />
                <span className="font-semibold text-orange-900 flex-shrink-0">
                  {f.funcaoNova}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Erros */}
      {erros.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 mb-2">
            Erros durante a importação ({erros.length})
          </h3>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {erros.map((e, i) => (
              <div key={i} className="text-xs text-red-700">
                {e.linha ? (
                  <span className="font-medium">Linha {e.linha}: </span>
                ) : null}
                {e.mensagem}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botão nova importação */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onNovaImportacao}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors"
        >
          <RotateCcw size={16} />
          Nova Importação
        </button>
      </div>
    </div>
  );
}
