'use client';

import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Users,
  Building2,
  Link2,
  UserMinus,
  UserCheck,
  ArrowRight,
} from 'lucide-react';

interface ValidationIssue {
  linha: number;
  campo: string;
  mensagem: string;
  severidade: string;
  valor?: string;
}

interface ValidationSummary {
  totalLinhas: number;
  linhasValidas: number;
  linhasComErro: number;
  linhasComAviso: number;
  erros: ValidationIssue[];
  avisos: ValidationIssue[];
}

interface DbStats {
  empresasNovas: number;
  empresasExistentes: number;
  funcionariosExistentes: number;
  funcionariosNovos: number;
  funcionariosParaInativar: number;
  funcionariosJaInativos: number;
  funcionariosAReadmitir: number;
}

interface DataPreviewProps {
  validacao: ValidationSummary;
  dbStats: DbStats;
  funcoesComMudancaRole?: string[];
  onConfirm: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'red' | 'yellow';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  };
  return (
    <div className={`rounded-lg border p-3 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

export default function DataPreview({
  validacao,
  dbStats,
  funcoesComMudancaRole = [],
  onConfirm,
  onBack,
  isLoading,
}: DataPreviewProps) {
  const temErros = validacao.linhasComErro > 0;

  return (
    <div className="space-y-4">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Users size={20} />}
          label="Total de Linhas"
          value={validacao.totalLinhas}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          label="Linhas Válidas"
          value={validacao.linhasValidas}
          color="green"
        />
        <StatCard
          icon={<AlertCircle size={20} />}
          label="Linhas com Erro"
          value={validacao.linhasComErro}
          color="red"
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          label="Linhas com Aviso"
          value={validacao.linhasComAviso}
          color="yellow"
        />
      </div>

      {/* DB Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Previsão do Impacto
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-blue-500" />
            <span className="text-gray-600">Empresas novas:</span>
            <span className="font-semibold">{dbStats.empresasNovas}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-gray-400" />
            <span className="text-gray-600">Empresas existentes:</span>
            <span className="font-semibold">{dbStats.empresasExistentes}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-green-500" />
            <span className="text-gray-600">Funcionários novos:</span>
            <span className="font-semibold">{dbStats.funcionariosNovos}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-400" />
            <span className="text-gray-600">Funcionários existentes:</span>
            <span className="font-semibold">
              {dbStats.funcionariosExistentes}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <UserMinus size={16} className="text-orange-500" />
            <span className="text-gray-600">A inativar:</span>
            <span className="font-semibold">
              {dbStats.funcionariosParaInativar}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-gray-400" />
            <span className="text-gray-600">Já inativos:</span>
            <span className="font-semibold">
              {dbStats.funcionariosJaInativos}
            </span>
          </div>
          {dbStats.funcionariosAReadmitir > 0 && (
            <div className="flex items-center gap-2 col-span-2 md:col-span-1">
              <UserCheck size={16} className="text-emerald-500" />
              <span className="text-gray-600">A readmitir:</span>
              <span className="font-semibold text-emerald-600">
                {dbStats.funcionariosAReadmitir}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Erros */}
      {validacao.erros.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-1">
            <AlertCircle size={16} />
            Erros ({validacao.erros.length})
          </h3>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {validacao.erros.map((e, i) => (
              <div key={i} className="text-xs text-red-700">
                <span className="font-medium">Linha {e.linha}:</span> [{e.campo}
                ] {e.mensagem}
                {e.valor && (
                  <span className="text-red-500"> (valor: {e.valor})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Avisos de demissão */}
      {(() => {
        const avisosDemissao = validacao.avisos.filter(
          (a) =>
            a.campo === 'data_demissao' ||
            (a.campo === 'cpf' && a.mensagem.toLowerCase().includes('inativ'))
        );
        if (avisosDemissao.length === 0) return null;
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center gap-1">
              <UserMinus size={16} />
              Funcionários a inativar ({avisosDemissao.length})
            </h3>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {avisosDemissao.map((a, i) => (
                <div key={i} className="text-xs text-yellow-700">
                  <span className="font-medium">Linha {a.linha}:</span>{' '}
                  {a.mensagem}
                  {a.valor && (
                    <span className="text-yellow-600"> (valor: {a.valor})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Avisos de readmissão */}
      {(() => {
        const avisosReadmissao = validacao.avisos.filter(
          (a) =>
            a.campo === 'data_admissao' &&
            a.mensagem.toLowerCase().includes('readmit')
        );
        if (avisosReadmissao.length === 0) return null;
        return (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-emerald-800 mb-2 flex items-center gap-1">
              <UserCheck size={16} />
              Funcionários a readmitir ({avisosReadmissao.length})
            </h3>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {avisosReadmissao.map((a, i) => (
                <div key={i} className="text-xs text-emerald-700">
                  <span className="font-medium">Linha {a.linha}:</span>{' '}
                  {a.mensagem}
                  {a.valor && (
                    <span className="text-emerald-600">
                      {' '}
                      (valor: {a.valor})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Outros avisos */}
      {(() => {
        const outrosAvisos = validacao.avisos.filter(
          (a) =>
            !(
              a.campo === 'data_demissao' ||
              (a.campo === 'cpf' &&
                a.mensagem.toLowerCase().includes('inativ')) ||
              (a.campo === 'data_admissao' &&
                a.mensagem.toLowerCase().includes('readmit'))
            )
        );
        if (outrosAvisos.length === 0) return null;
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center gap-1">
              <AlertTriangle size={16} />
              Avisos ({outrosAvisos.length})
            </h3>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {outrosAvisos.map((a, i) => (
                <div key={i} className="text-xs text-yellow-700">
                  <span className="font-medium">Linha {a.linha}:</span> [
                  {a.campo}] {a.mensagem}
                  {a.valor && (
                    <span className="text-yellow-600"> (valor: {a.valor})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {temErros && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-sm text-red-800">
          <strong>Importação bloqueada:</strong> Corrija os erros na planilha e
          faça upload novamente. Linhas com erro serão ignoradas na importação.
        </div>
      )}

      {!temErros && validacao.linhasValidas > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
          <strong>Pronto para importar!</strong> {validacao.linhasValidas}{' '}
          linha(s) serão processadas.
        </div>
      )}

      {/* Aviso de mudança de função */}
      {funcoesComMudancaRole.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <ArrowRight
              size={15}
              className="text-orange-500 mt-0.5 flex-shrink-0"
            />
            <div>
              <p className="text-sm font-semibold text-orange-800">
                {funcoesComMudancaRole.length} função
                {funcoesComMudancaRole.length > 1
                  ? 'ões alteradas'
                  : ' alterada'}{' '}
                detectada{funcoesComMudancaRole.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-orange-700 mt-0.5">
                Ao confirmar, você será perguntado sobre o nível de cargo de:{' '}
                <span className="font-medium">
                  {funcoesComMudancaRole.join(', ')}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          ← Voltar
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading || validacao.linhasValidas === 0}
          className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? 'Importando...'
            : `Importar ${validacao.linhasValidas} Linhas →`}
        </button>
      </div>
    </div>
  );
}
