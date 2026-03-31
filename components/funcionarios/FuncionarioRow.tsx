'use client';

/**
 * components/funcionarios/FuncionarioRow.tsx
 *
 * Linha da tabela de funcionários. Extraída de FuncionariosSection.tsx.
 * Inclui a coluna complexa "Última Avaliação" com múltiplos badges.
 */

import { Edit, Power } from 'lucide-react';
import type { Funcionario } from './types';

// Helper para formatar datas com fallback
const formatDate = (value?: string | null) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('pt-BR');
};

interface FuncionarioRowProps {
  funcionario: Funcionario;
  onToggleStatus: (cpf: string, currentStatus: boolean) => void;
  onEdit: (funcionario: Funcionario) => void;
}

export default function FuncionarioRow({
  funcionario,
  onToggleStatus,
  onEdit,
}: FuncionarioRowProps) {
  return (
    <tr
      className={`hover:bg-gray-50 transition ${
        !funcionario.ativo ? 'opacity-60' : ''
      }`}
    >
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {funcionario.nome}
        </div>
        <div className="text-xs text-gray-500">{funcionario.email}</div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
        {funcionario.cpf}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
        {funcionario.setor}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
        {funcionario.funcao}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            funcionario.nivel_cargo === 'gestao'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {funcionario.nivel_cargo === 'gestao' ? 'Gestão' : 'Operacional'}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
        <UltimaAvaliacaoCell funcionario={funcionario} />
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onToggleStatus(funcionario.cpf, funcionario.ativo)}
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${
            funcionario.ativo
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-red-100 text-red-800 hover:bg-red-200'
          }`}
          title={
            funcionario.ativo ? 'Clique para inativar' : 'Clique para ativar'
          }
        >
          <Power size={12} />
          {funcionario.ativo ? 'Ativo' : 'Inativo'}
        </button>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onEdit(funcionario)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Editar funcionário"
          >
            <Edit size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ============================================================================
// Sub-componente: Coluna "Última Avaliação"
// ============================================================================

function UltimaAvaliacaoCell({ funcionario }: { funcionario: Funcionario }) {
  const hasAvaliacao =
    funcionario.ultimo_lote_id ||
    funcionario.ultima_avaliacao_status ||
    funcionario.ultima_avaliacao_data_conclusao ||
    funcionario.data_ultimo_lote ||
    (funcionario as any).ultima_avaliacao ||
    ((funcionario as any).avaliacoes &&
      (funcionario as any).avaliacoes.some(
        (a: any) => a.envio || a.inativada_em
      ));

  if (!hasAvaliacao) {
    return <span className="text-sm text-gray-400">Nunca avaliado</span>;
  }

  const dateSource =
    funcionario.ultima_avaliacao_data_conclusao ||
    funcionario.data_ultimo_lote ||
    funcionario.ultima_inativacao_em ||
    (funcionario as any).ultima_avaliacao;
  const formatted = formatDate(dateSource as any);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900">
          {funcionario.ultimo_lote_numero != null
            ? `Lote ${funcionario.ultimo_lote_numero}`
            : funcionario.ultimo_lote_id
              ? `#${funcionario.ultimo_lote_id}`
              : '—'}
        </span>
        <span
          className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
            funcionario.ultima_avaliacao_status === 'concluido'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
          title={
            funcionario.ultima_avaliacao_status === 'inativada' &&
            funcionario.ultimo_motivo_inativacao
              ? `Inativada: ${funcionario.ultimo_motivo_inativacao}`
              : funcionario.ultima_avaliacao_status === 'concluido'
                ? 'Concluída'
                : ''
          }
        >
          {funcionario.ultima_avaliacao_status === 'concluido'
            ? 'Concluída'
            : 'Inativada'}
        </span>
      </div>

      {/* Data da avaliação */}
      {formatted ? (
        <span className="text-xs text-gray-500">{formatted}</span>
      ) : (
        funcionario.ultima_inativacao_em && (
          <span className="text-xs text-gray-500">
            {funcionario.ultima_inativacao_em}
          </span>
        )
      )}

      {/* Badge de inativação */}
      {!funcionario.ultima_avaliacao_data_conclusao &&
        funcionario.ultima_inativacao_em && (
          <div className="mt-1">
            <span
              className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
              title={
                funcionario.ultimo_motivo_inativacao
                  ? `Motivo: ${funcionario.ultimo_motivo_inativacao}`
                  : ''
              }
            >
              Inativada
              {funcionario.ultima_inativacao_lote
                ? ` (${funcionario.ultima_inativacao_lote})`
                : ''}
            </span>
          </div>
        )}

      {/* Badge de avaliação válida */}
      {funcionario.tem_avaliacao_recente && funcionario.data_ultimo_lote && (
        <div className="mt-1">
          <span
            className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
            title="Funcionário possui avaliação concluída há menos de 12 meses - não elegível para nova avaliação"
          >
            ✓ Avaliação válida (
            {new Date(funcionario.data_ultimo_lote).toLocaleDateString('pt-BR')}
            )
          </span>
        </div>
      )}

      {/* Badge de elegibilidade (>12 meses) */}
      {!funcionario.tem_avaliacao_recente &&
        (funcionario.ultima_avaliacao_status === 'concluido' ||
          (!funcionario.ultima_avaliacao_data_conclusao &&
            (funcionario.indice_avaliacao || 0) > 0)) && (
          <div className="mt-1">
            <span
              className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800"
              title="Avaliação concluída há mais de 12 meses - funcionário elegível para nova avaliação"
            >
              ⚠️ Elegível (&gt;12 meses)
            </span>
          </div>
        )}
    </div>
  );
}
