'use client';

import {
  CheckCircle,
  XCircle,
  Building2,
  Users,
  Link2,
  UserMinus,
  RotateCcw,
} from 'lucide-react';

interface ImportStats {
  empresas_criadas: number;
  empresas_existentes: number;
  funcionarios_criados: number;
  funcionarios_atualizados: number;
  vinculos_criados: number;
  vinculos_atualizados: number;
  inativacoes: number;
  total_erros: number;
}

interface ImportError {
  linha?: number;
  mensagem: string;
}

interface ImportResultProps {
  sucesso: boolean;
  stats: ImportStats;
  erros: ImportError[];
  tempoMs: number;
  totalLinhas: number;
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
  onNovaImportacao,
}: ImportResultProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className={`rounded-lg p-4 border flex items-center gap-3 ${
          sucesso ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}
      >
        {sucesso ? (
          <CheckCircle size={32} className="text-green-600 flex-shrink-0" />
        ) : (
          <XCircle size={32} className="text-red-600 flex-shrink-0" />
        )}
        <div>
          <h3
            className={`text-lg font-semibold ${sucesso ? 'text-green-800' : 'text-red-800'}`}
          >
            {sucesso ? 'Importação Concluída!' : 'Importação com Erros'}
          </h3>
          <p
            className={`text-sm ${sucesso ? 'text-green-700' : 'text-red-700'}`}
          >
            {totalLinhas} linhas processadas em {(tempoMs / 1000).toFixed(1)}s
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Resultado</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
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
