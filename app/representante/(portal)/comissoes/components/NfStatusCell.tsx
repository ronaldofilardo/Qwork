'use client';

import type { Comissao } from '../types';

interface NfStatusCellProps {
  comissao: Comissao;
  onUpload: () => void;
}

export default function NfStatusCell({
  comissao,
  onUpload,
}: NfStatusCellProps) {
  if (comissao.nf_rpa_aprovada_em) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700">
        ✅ NF Aprovada
      </span>
    );
  }
  if (comissao.nf_rpa_rejeitada_em) {
    return (
      <div>
        <span className="inline-flex items-center gap-1 text-xs text-red-600">
          ❌ NF Rejeitada
        </span>
        {comissao.nf_rpa_motivo_rejeicao && (
          <p
            className="text-xs text-gray-400 mt-0.5"
            title={comissao.nf_rpa_motivo_rejeicao}
          >
            {comissao.nf_rpa_motivo_rejeicao.length > 40
              ? comissao.nf_rpa_motivo_rejeicao.slice(0, 40) + '...'
              : comissao.nf_rpa_motivo_rejeicao}
          </p>
        )}
        <button
          onClick={onUpload}
          className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Reenviar
        </button>
      </div>
    );
  }
  if (comissao.nf_rpa_enviada_em) {
    return (
      <div>
        <span className="inline-flex items-center gap-1 text-xs text-yellow-700">
          📤 Enviada
        </span>
        <p className="text-xs text-gray-400 mt-0.5">
          {comissao.nf_nome_arquivo}
        </p>
      </div>
    );
  }
  const podeEnviar = ['pendente_nf', 'congelada_aguardando_admin'].includes(
    comissao.status
  );
  if (!podeEnviar) return <span className="text-xs text-gray-400">—</span>;
  return (
    <button
      onClick={onUpload}
      className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      📤 Enviar NF
    </button>
  );
}
