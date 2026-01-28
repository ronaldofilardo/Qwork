import React from 'react';

interface AcessoRH {
  id: number;
  cpf: string;
  nome: string;
  clinica_id: number;
  clinica_nome: string;
  login_timestamp: string;
  logout_timestamp: string | null;
  session_duration: string | null;
  ip_address: string;
}

interface AcessoFuncionario {
  id: number;
  cpf_anonimizado: string;
  clinica_id: number;
  clinica_nome: string;
  empresa_id: number;
  empresa_nome: string;
  inclusao: string;
  inativacao: string | null;
  login_timestamp: string;
  logout_timestamp: string | null;
}

interface AuditoriaAvaliacao {
  avaliacao_id: number;
  cpf: string;
  clinica_id: number;
  empresa_id: number;
  lote: string;
  liberado: boolean;
  concluida: boolean;
  inativada: boolean;
  iniciada_em: string;
  concluida_em: string | null;
}

interface AuditoriaLote {
  lote_id: number;
  numero_lote: string;
  clinica_id: number;
  empresa_id: number;
  status: string;
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
  mudancas_status: number;
  criado_em: string;
}

interface AuditoriaLaudo {
  laudo_id: number;
  emissor_cpf: string;
  emissor_nome: string;
  clinica_id: number;
  empresa_id: number;
  numero_lote: string;
  status: string;
  hash_pdf: string | null;
  criado_em: string;
  emitido_em: string | null;
  enviado_em: string | null;
}

type AuditoriaSubTab =
  | 'acessos-rh'
  | 'acessos-funcionarios'
  | 'avaliacoes'
  | 'lotes'
  | 'laudos';

interface AuditoriasContentProps {
  auditoriaSubTab: AuditoriaSubTab;
  setAuditoriaSubTab: (tab: AuditoriaSubTab) => void;
  acessosRH: AcessoRH[];
  acessosFuncionarios: AcessoFuncionario[];
  auditoriaAvaliacoes: AuditoriaAvaliacao[];
  auditoriaLotes: AuditoriaLote[];
  auditoriaLaudos: AuditoriaLaudo[];
}

export function AuditoriasContent({
  auditoriaSubTab,
  setAuditoriaSubTab,
  acessosRH,
  acessosFuncionarios,
  auditoriaAvaliacoes,
  auditoriaLotes,
  auditoriaLaudos,
}: AuditoriasContentProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatDuration = (duration: unknown) => {
    if (!duration) return '-';

    // Se for um objeto (como INTERVAL do PostgreSQL), formatar adequadamente
    if (typeof duration === 'object' && duration !== null) {
      // Se tem seconds/milliseconds (interval-like)
      if ('seconds' in (duration as Record<string, unknown>)) {
        const d = duration as { seconds?: number; milliseconds?: number };
        const totalSeconds = (d.seconds || 0) + (d.milliseconds || 0) / 1000;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);

        if (hours > 0) {
          return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
          return `${minutes}m ${seconds}s`;
        } else {
          return `${seconds}s`;
        }
      }
      // Desconhecido: retornar representação JSON para evitar stringificação ambígua
      try {
        return JSON.stringify(duration);
      } catch {
        return '(duração desconhecida)';
      }
    }

    // Se for uma string ou primitivo, retornar como está
    return typeof duration === 'string' || typeof duration === 'number'
      ? String(duration)
      : '(duração desconhecida)';
  };

  return (
    <div>
      {/* Sub-navegação de Auditorias */}
      <div className="mb-6 bg-white rounded-lg shadow p-2">
        <nav className="flex flex-wrap gap-2">
          <button
            onClick={() => setAuditoriaSubTab('acessos-rh')}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              auditoriaSubTab === 'acessos-rh'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Acessos RH
          </button>
          <button
            onClick={() => setAuditoriaSubTab('acessos-funcionarios')}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              auditoriaSubTab === 'acessos-funcionarios'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Acessos Funcionários
          </button>
          <button
            onClick={() => setAuditoriaSubTab('avaliacoes')}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              auditoriaSubTab === 'avaliacoes'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Avaliações
          </button>
          <button
            onClick={() => setAuditoriaSubTab('lotes')}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              auditoriaSubTab === 'lotes'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Lotes
          </button>
          <button
            onClick={() => setAuditoriaSubTab('laudos')}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              auditoriaSubTab === 'laudos'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Laudos
          </button>
        </nav>
      </div>

      {/* Conteúdo de Acessos RH */}
      {auditoriaSubTab === 'acessos-rh' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Acessos de Gestores RH
            </h3>
            <p className="text-sm text-gray-600">
              Total: {acessosRH.length} registros
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    CPF
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Clínica
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Login
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Logout
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Duração
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {acessosRH.map((acesso) => (
                  <tr key={acesso.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {acesso.cpf}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {acesso.nome}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {acesso.clinica_nome}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(acesso.login_timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(acesso.logout_timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDuration(acesso.session_duration)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">
                      {acesso.ip_address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo de Acessos Funcionários */}
      {auditoriaSubTab === 'acessos-funcionarios' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Acessos de Funcionários
            </h3>
            <p className="text-sm text-gray-600">
              Total: {acessosFuncionarios.length} registros (CPF anonimizado)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    CPF (Hash)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Clínica
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Empresa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Inclusão
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Inativação
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Login
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Logout
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {acessosFuncionarios.map((acesso) => (
                  <tr key={acesso.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono text-xs">
                      {acesso.cpf_anonimizado}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {acesso.clinica_nome}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {acesso.empresa_nome}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(acesso.inclusao)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(acesso.inativacao)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(acesso.login_timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(acesso.logout_timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo de Avaliações */}
      {auditoriaSubTab === 'avaliacoes' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Auditoria de Avaliações
            </h3>
            <p className="text-sm text-gray-600">
              Total: {auditoriaAvaliacoes.length} registros
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    CPF
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Lote
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Liberado em
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Concluída em
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Inativada
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {auditoriaAvaliacoes.map((avaliacao) => (
                  <tr key={avaliacao.avaliacao_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {avaliacao.avaliacao_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {avaliacao.cpf}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {avaliacao.lote}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(avaliacao.iniciada_em)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(avaliacao.concluida_em)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          avaliacao.inativada
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {avaliacao.inativada ? 'Sim' : 'Não'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo de Lotes */}
      {auditoriaSubTab === 'lotes' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Auditoria de Lotes
            </h3>
            <p className="text-sm text-gray-600">
              Total: {auditoriaLotes.length} registros
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Número
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Avaliações
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Concluídas
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Mudanças
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Criado em
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {auditoriaLotes.map((lote) => (
                  <tr key={lote.lote_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {lote.numero_lote}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          lote.status === 'pendente'
                            ? 'bg-yellow-100 text-yellow-800'
                            : lote.status === 'em_processamento'
                              ? 'bg-blue-100 text-blue-800'
                              : lote.status === 'concluido'
                                ? 'bg-green-100 text-green-800'
                                : lote.status === 'cancelado'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {lote.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-900">
                      {lote.total_avaliacoes}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-900">
                      {lote.avaliacoes_concluidas}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-900">
                      {lote.mudancas_status}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(lote.criado_em)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo de Laudos */}
      {auditoriaSubTab === 'laudos' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Auditoria de Laudos
            </h3>
            <p className="text-sm text-gray-600">
              Total: {auditoriaLaudos.length} registros
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Emissor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Lote
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hash PDF
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Emitido em
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {auditoriaLaudos.map((laudo) => (
                  <tr key={laudo.laudo_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {laudo.laudo_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {laudo.emissor_nome}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {laudo.numero_lote}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          laudo.status === 'emitido'
                            ? 'bg-green-100 text-green-800'
                            : laudo.status === 'enviado'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {laudo.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">
                      {laudo.hash_pdf
                        ? laudo.hash_pdf.substring(0, 16) + '...'
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(laudo.emitido_em)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
