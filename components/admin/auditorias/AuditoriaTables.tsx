'use client';

import { useMemo, useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { formatDate } from './helpers';
import type {
  AcessoGestorUnificado,
  AcessoOperacional,
  AuditoriaAvaliacao,
  AuditoriaLote,
  AuditoriaLaudo,
  AceiteUsuario,
  AcessoSuporte,
  AcessoComercial,
  AcessoRepresentante,
  AcessoVendedor,
} from './types';

/* ─── Refresh Button ─── */

function RefreshButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <RefreshCw className="w-3.5 h-3.5" />
      )}
      Atualizar
    </button>
  );
}

/* ─── Shared Table Shell ─── */

function TableShell({
  title,
  subtitle,
  headerRight,
  children,
}: {
  title: string;
  subtitle: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
        {headerRight && <div className="flex-shrink-0">{headerRight}</div>}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Th({
  children,
  center,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase ${center ? 'text-center' : 'text-left'}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  mono,
  center,
  className,
}: {
  children: React.ReactNode;
  mono?: boolean;
  center?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`px-4 py-3 text-sm ${center ? 'text-center' : ''} ${mono ? 'font-mono text-xs' : ''} ${className || 'text-gray-600'}`}
    >
      {children}
    </td>
  );
}

/* ─── 1. Gestores (Gestor de Entidade + RH) ─── */

const GESTOR_TIPO_BADGE: Record<string, string> = {
  gestor: 'bg-purple-100 text-purple-800',
  rh: 'bg-blue-100 text-blue-800',
};

const GESTOR_TIPO_LABEL: Record<string, string> = {
  gestor: 'Gestor',
  rh: 'RH',
};

export function TabelaGestores({
  data,
  onAtualizar,
  loading,
}: {
  data: AcessoGestorUnificado[];
  onAtualizar: () => void;
  loading: boolean;
}) {
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEntidade, setFiltroEntidade] = useState('');
  const [filtroClinica, setFiltroClinica] = useState('');

  const entidades = useMemo(() => {
    const set = new Set(
      data.filter((d) => d.empresa_nome).map((d) => d.empresa_nome as string)
    );
    return Array.from(set).sort();
  }, [data]);

  const clinicas = useMemo(() => {
    const set = new Set(
      data.filter((d) => d.clinica_nome).map((d) => d.clinica_nome as string)
    );
    return Array.from(set).sort();
  }, [data]);

  const filtrados = useMemo(() => {
    return data.filter((d) => {
      if (filtroTipo && d.tipo !== filtroTipo) return false;
      if (filtroEntidade && d.empresa_nome !== filtroEntidade) return false;
      if (filtroClinica && d.clinica_nome !== filtroClinica) return false;
      return true;
    });
  }, [data, filtroTipo, filtroEntidade, filtroClinica]);

  const temFiltro = filtroTipo || filtroEntidade || filtroClinica;

  function limparFiltros() {
    setFiltroTipo('');
    setFiltroEntidade('');
    setFiltroClinica('');
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os tipos</option>
          <option value="gestor">Gestor</option>
          <option value="rh">RH</option>
        </select>

        <select
          value={filtroEntidade}
          onChange={(e) => setFiltroEntidade(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as entidades</option>
          {entidades.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>

        <select
          value={filtroClinica}
          onChange={(e) => setFiltroClinica(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as clínicas</option>
          {clinicas.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {temFiltro && (
          <button
            onClick={limparFiltros}
            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Limpar filtros
          </button>
        )}

        <span className="ml-auto text-xs text-gray-500">
          {filtrados.length} de {data.length} registros
        </span>
      </div>

      <TableShell
        title="Acessos de Gestores"
        subtitle="Gestores de Entidade e Gestores RH"
        headerRight={<RefreshButton onClick={onAtualizar} loading={loading} />}
      >
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <Th>Tipo</Th>
              <Th>Empresa / Entidade</Th>
              <Th>Clínica</Th>
              <Th>CNPJ</Th>
              <Th>Login</Th>
              <Th>Logout</Th>
              <Th>IP</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtrados.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-gray-400"
                >
                  {temFiltro
                    ? 'Nenhum resultado para os filtros aplicados.'
                    : 'Clique em "Atualizar" para carregar os dados.'}
                </td>
              </tr>
            )}
            {filtrados.map((a) => (
              <tr key={`${a.tipo}-${a.id}`} className="hover:bg-gray-50">
                <Td>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${GESTOR_TIPO_BADGE[a.tipo] ?? 'bg-gray-100 text-gray-800'}`}
                  >
                    {GESTOR_TIPO_LABEL[a.tipo] ?? a.tipo}
                  </span>
                </Td>
                <Td className="text-gray-900">{a.empresa_nome ?? '—'}</Td>
                <Td>{a.clinica_nome ?? '—'}</Td>
                <Td mono>{a.empresa_cnpj ?? '—'}</Td>
                <Td>{formatDate(a.login_timestamp)}</Td>
                <Td>{formatDate(a.logout_timestamp)}</Td>
                <Td mono>{a.ip_address}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

/* ─── 2. Avaliações ─── */

const AVALIACAO_STATUS_BADGE: Record<string, string> = {
  iniciada: 'bg-blue-100 text-blue-800',
  em_andamento: 'bg-yellow-100 text-yellow-800',
  concluida: 'bg-green-100 text-green-800',
  inativada: 'bg-red-100 text-red-800',
};

const AVALIACAO_STATUS_LABEL: Record<string, string> = {
  iniciada: 'Iniciada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  inativada: 'Inativada',
};

function formatCpfAvaliacao(cpf: string | null | undefined): string {
  if (!cpf) return '—';
  const d = cpf.replace(/\D/g, '').trim();
  if (d.length !== 11) return cpf.trim();
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function TabelaAvaliacoes({
  data,
  onAtualizar,
  loading,
}: {
  data: AuditoriaAvaliacao[];
  onAtualizar: () => void;
  loading: boolean;
}) {
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroLote, setFiltroLote] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  const normalizar = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const filtrados = useMemo(() => {
    return data.filter((a) => {
      if (filtroStatus && a.avaliacao_status !== filtroStatus) return false;

      if (filtroEmpresa.trim()) {
        const termo = normalizar(filtroEmpresa.trim());
        const empresaOk = normalizar(a.empresa_nome ?? '').includes(termo);
        const entidadeOk = normalizar(a.entidade_nome ?? '').includes(termo);
        if (!empresaOk && !entidadeOk) return false;
      }

      if (filtroLote.trim()) {
        if (!a.lote.includes(filtroLote.trim())) return false;
      }

      if (filtroDataInicio) {
        const ref = new Date(filtroDataInicio).getTime();
        const val = a.liberado_em ? new Date(a.liberado_em).getTime() : null;
        if (!val || val < ref) return false;
      }

      if (filtroDataFim) {
        const ref = new Date(filtroDataFim).getTime() + 86399000;
        const val = a.liberado_em ? new Date(a.liberado_em).getTime() : null;
        if (!val || val > ref) return false;
      }

      return true;
    });
  }, [
    data,
    filtroStatus,
    filtroEmpresa,
    filtroLote,
    filtroDataInicio,
    filtroDataFim,
  ]);

  const temFiltro =
    filtroStatus ||
    filtroEmpresa.trim() ||
    filtroLote.trim() ||
    filtroDataInicio ||
    filtroDataFim;

  function limparFiltros() {
    setFiltroStatus('');
    setFiltroEmpresa('');
    setFiltroLote('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          <option value="iniciada">Iniciada</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
          <option value="inativada">Inativada</option>
        </select>

        <input
          type="text"
          placeholder="Empresa ou entidade..."
          value={filtroEmpresa}
          onChange={(e) => setFiltroEmpresa(e.target.value)}
          className="w-52 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="text"
          placeholder="Lote..."
          value={filtroLote}
          onChange={(e) => setFiltroLote(e.target.value)}
          className="w-28 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="date"
          title="Data de liberação — início"
          value={filtroDataInicio}
          onChange={(e) => setFiltroDataInicio(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="date"
          title="Data de liberação — fim"
          value={filtroDataFim}
          onChange={(e) => setFiltroDataFim(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {temFiltro && (
          <button
            onClick={limparFiltros}
            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Limpar filtros
          </button>
        )}

        <span className="ml-auto text-xs text-gray-500">
          {filtrados.length} de {data.length} registros
        </span>
      </div>

      <TableShell
        title="Auditoria de Avaliações"
        subtitle={`Total: ${data.length} registros`}
        headerRight={<RefreshButton onClick={onAtualizar} loading={loading} />}
      >
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <Th>Empresa</Th>
              <Th>Entidade</Th>
              <Th>Clínica</Th>
              <Th>CPF</Th>
              <Th>Lote</Th>
              <Th>Liberação</Th>
              <Th>Conclusão</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtrados.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-sm text-gray-400"
                >
                  {temFiltro
                    ? 'Nenhum resultado para os filtros aplicados.'
                    : 'Clique em "Atualizar" para carregar os dados.'}
                </td>
              </tr>
            )}
            {filtrados.map((a) => (
              <tr key={a.avaliacao_id} className="hover:bg-gray-50">
                <Td>{a.empresa_nome ?? '—'}</Td>
                <Td>{a.entidade_nome ?? '—'}</Td>
                <Td>{a.clinica_nome ?? '—'}</Td>
                <Td mono>{formatCpfAvaliacao(a.cpf)}</Td>
                <Td>{a.lote}</Td>
                <Td>{formatDate(a.liberado_em)}</Td>
                <Td>{formatDate(a.concluida_em)}</Td>
                <Td>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${AVALIACAO_STATUS_BADGE[a.avaliacao_status] ?? 'bg-gray-100 text-gray-800'}`}
                  >
                    {AVALIACAO_STATUS_LABEL[a.avaliacao_status] ??
                      a.avaliacao_status}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

/* ─── 4. Lotes ─── */

const LOTE_STATUS_STYLES: Record<string, string> = {
  // Status legados (dados antigos)
  pendente: 'bg-yellow-100 text-yellow-800',
  em_processamento: 'bg-blue-100 text-blue-800',
  // Status atuais válidos
  rascunho: 'bg-gray-100 text-gray-700',
  ativo: 'bg-blue-100 text-blue-800',
  concluido: 'bg-green-100 text-green-800',
  emissao_solicitada: 'bg-yellow-100 text-yellow-800',
  emissao_em_andamento: 'bg-orange-100 text-orange-800',
  laudo_emitido: 'bg-purple-100 text-purple-800',
  cancelado: 'bg-red-100 text-red-800',
  finalizado: 'bg-teal-100 text-teal-800',
};

const LOTE_STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  ativo: 'Ativo',
  concluido: 'Concluído',
  emissao_solicitada: 'Emissão Solicitada',
  emissao_em_andamento: 'Emissão em Andamento',
  laudo_emitido: 'Laudo Emitido',
  cancelado: 'Cancelado',
  finalizado: 'Finalizado',
};

export function TabelaLotes({
  data,
  onAtualizar,
  loading,
}: {
  data: AuditoriaLote[];
  onAtualizar: () => void;
  loading: boolean;
}) {
  return (
    <TableShell
      title="Auditoria de Lotes"
      subtitle={`Total: ${data.length} registros`}
      headerRight={<RefreshButton onClick={onAtualizar} loading={loading} />}
    >
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <Th>ID / Seq</Th>
            <Th>Tomador</Th>
            <Th>Status</Th>
            <Th center>Avaliações</Th>
            <Th center>Concluídas</Th>
            <Th>Criado em</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((l) => (
            <tr key={l.lote_id} className="hover:bg-gray-50">
              <Td className="font-semibold text-gray-900">
                <span className="text-gray-900">#{l.lote_id}</span>
                <span className="ml-1 text-xs text-gray-400">
                  seq {l.numero_lote}
                </span>
              </Td>
              <Td className="text-gray-700 text-sm">{l.empresa_nome ?? '—'}</Td>
              <Td>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${LOTE_STATUS_STYLES[l.status] ?? 'bg-gray-100 text-gray-800'}`}
                >
                  {LOTE_STATUS_LABELS[l.status] ?? l.status.toUpperCase()}
                </span>
              </Td>
              <Td center className="text-gray-900">
                {l.total_avaliacoes}
              </Td>
              <Td center className="text-gray-900">
                {l.avaliacoes_concluidas}
              </Td>
              <Td>{formatDate(l.criado_em)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableShell>
  );
}

/* ─── 5. Laudos ─── */

const LAUDO_STATUS_STYLES: Record<string, string> = {
  rascunho: 'bg-gray-100 text-gray-700',
  emitido: 'bg-green-100 text-green-800',
  enviado: 'bg-blue-100 text-blue-800',
};

export function TabelaLaudos({
  data,
  onVerDetalhe,
  onAtualizar,
  loading,
}: {
  data: AuditoriaLaudo[];
  onVerDetalhe: (laudoId: number) => void;
  onAtualizar: () => void;
  loading: boolean;
}) {
  return (
    <TableShell
      title="Auditoria de Laudos"
      subtitle={`Total: ${data.length} registros`}
      headerRight={<RefreshButton onClick={onAtualizar} loading={loading} />}
    >
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <Th>ID</Th>
            <Th>Tomador</Th>
            {data.some((l) => l.empresa_cliente_nome) && <Th>Empresa</Th>}
            <Th>Solicitação</Th>
            <Th>Status</Th>
            <Th center>Custódia</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {(() => {
            const hasEmpresa = data.some((l) => l.empresa_cliente_nome);
            return data.map((l) => (
              <tr key={l.laudo_id} className="hover:bg-gray-50">
                <Td className="font-semibold text-gray-900">#{l.lote_id}</Td>
                <Td className="text-gray-900">{l.tomador_nome ?? '—'}</Td>
                {hasEmpresa && (
                  <Td className="text-gray-700 text-sm">
                    {l.empresa_cliente_nome ?? '—'}
                  </Td>
                )}
                <Td>{formatDate(l.solicitado_em ?? l.criado_em)}</Td>
                <Td>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${LAUDO_STATUS_STYLES[l.status] || 'bg-gray-100 text-gray-800'}`}
                  >
                    {l.status.toUpperCase()}
                  </span>
                </Td>
                <Td center>
                  <button
                    onClick={() => onVerDetalhe(l.laudo_id)}
                    className="px-3 py-1 text-xs font-medium rounded bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition-colors"
                  >
                    Detalhe
                  </button>
                </Td>
              </tr>
            ));
          })()}
        </tbody>
      </table>
    </TableShell>
  );
}

/* ─── 5. Operacionais (Suporte + Comercial + Representante + Vendedor) ─── */

function formatCpf(cpf: string | null | undefined): string {
  if (!cpf) return '—';
  const digits = cpf.replace(/\D/g, '').trim();
  if (digits.length !== 11) return cpf.trim();
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

const OPERACIONAL_PERFIL_BADGE: Record<string, string> = {
  suporte: 'bg-sky-100 text-sky-800',
  comercial: 'bg-indigo-100 text-indigo-800',
  representante: 'bg-orange-100 text-orange-800',
  vendedor: 'bg-yellow-100 text-yellow-800',
};

const OPERACIONAL_PERFIL_LABEL: Record<string, string> = {
  suporte: 'Suporte',
  comercial: 'Comercial',
  representante: 'Representante',
  vendedor: 'Vendedor',
};

export function TabelaOperacionais({
  data,
  onAtualizar,
  loading,
}: {
  data: AcessoOperacional[];
  onAtualizar: () => void;
  loading: boolean;
}) {
  const [filtroPerfil, setFiltroPerfil] = useState('');
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroCpf, setFiltroCpf] = useState('');

  const normalizar = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const filtrados = useMemo(() => {
    return data.filter((a) => {
      if (filtroPerfil && a.perfil !== filtroPerfil) return false;

      if (filtroNome.trim()) {
        const termo = normalizar(filtroNome.trim());
        if (!normalizar(a.nome ?? '').includes(termo)) return false;
      }

      if (filtroCpf.trim()) {
        const digits = filtroCpf.replace(/\D/g, '');
        const cpfDigits = (a.cpf ?? '').replace(/\D/g, '');
        if (digits && !cpfDigits.includes(digits)) return false;
      }

      return true;
    });
  }, [data, filtroPerfil, filtroNome, filtroCpf]);

  const temFiltro = filtroPerfil || filtroNome.trim() || filtroCpf.trim();

  function limparFiltros() {
    setFiltroPerfil('');
    setFiltroNome('');
    setFiltroCpf('');
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          value={filtroPerfil}
          onChange={(e) => setFiltroPerfil(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os perfis</option>
          <option value="suporte">Suporte</option>
          <option value="comercial">Comercial</option>
          <option value="representante">Representante</option>
          <option value="vendedor">Vendedor</option>
        </select>

        <input
          type="text"
          placeholder="Filtrar por nome..."
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          className="w-52 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="text"
          placeholder="Filtrar por CPF..."
          value={filtroCpf}
          onChange={(e) => setFiltroCpf(e.target.value)}
          className="w-44 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {temFiltro && (
          <button
            onClick={limparFiltros}
            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Limpar filtros
          </button>
        )}

        <span className="ml-auto text-xs text-gray-500">
          {filtrados.length} de {data.length} registros
        </span>
      </div>

      <TableShell
        title="Acessos Operacionais"
        subtitle="Suporte · Comercial · Representantes · Vendedores"
        headerRight={<RefreshButton onClick={onAtualizar} loading={loading} />}
      >
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <Th>Perfil</Th>
              <Th>Nome</Th>
              <Th>CPF</Th>
              <Th>CNPJ</Th>
              <Th>Login</Th>
              <Th>Logout</Th>
              <Th>IP</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtrados.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-gray-400"
                >
                  {temFiltro
                    ? 'Nenhum resultado para os filtros aplicados.'
                    : 'Clique em "Atualizar" para carregar os dados.'}
                </td>
              </tr>
            )}
            {filtrados.map((a) => (
              <tr key={`${a.perfil}-${a.id}`} className="hover:bg-gray-50">
                <Td>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${OPERACIONAL_PERFIL_BADGE[a.perfil] ?? 'bg-gray-100 text-gray-800'}`}
                  >
                    {OPERACIONAL_PERFIL_LABEL[a.perfil] ?? a.perfil}
                  </span>
                </Td>
                <Td className="text-gray-900">{a.nome ?? '—'}</Td>
                <Td mono>{formatCpf(a.cpf)}</Td>
                <Td mono>{a.cnpj ?? '—'}</Td>
                <Td>{formatDate(a.login_timestamp)}</Td>
                <Td>{formatDate(a.logout_timestamp)}</Td>
                <Td mono>{a.ip_address}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

/* ─── 6. Aceites (consolidado por usuário) ─── */

const PERFIL_BADGE: Record<string, string> = {
  rh: 'bg-blue-100 text-blue-800',
  gestor: 'bg-purple-100 text-purple-800',
  representante: 'bg-orange-100 text-orange-800',
  vendedor: 'bg-yellow-100 text-yellow-800',
  funcionario: 'bg-green-100 text-green-800',
};

const PERFIL_LABEL: Record<string, string> = {
  rh: 'RH',
  gestor: 'Gestor',
  representante: 'Representante',
  vendedor: 'Vendedor',
  funcionario: 'Funcionário',
};

function AceiteCell({
  aceito,
  data,
}: {
  aceito: boolean | null;
  data: string | null;
}) {
  if (aceito === null) {
    return <span className="text-gray-300 text-xs">N/A</span>;
  }
  if (!aceito) {
    return <span className="text-gray-400 text-xs">—</span>;
  }
  return (
    <span
      className="inline-flex flex-col items-center gap-0.5"
      title={data ? formatDate(data) : undefined}
    >
      <span className="text-green-600 font-semibold text-sm">✓</span>
      {data && (
        <span className="text-gray-400 text-xs leading-none">
          {new Date(data).toLocaleDateString('pt-BR')}
        </span>
      )}
    </span>
  );
}

// eslint-disable-next-line max-lines-per-function
export function TabelaAceites({
  data,
  onAtualizar,
  loading,
}: {
  data: AceiteUsuario[];
  onAtualizar: () => void;
  loading: boolean;
}) {
  const [filtroPerfil, setFiltroPerfil] = useState('');
  const [filtroCpf, setFiltroCpf] = useState('');
  const [filtroNome, setFiltroNome] = useState('');

  const normalizar = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const perfisDisponiveis = useMemo(() => {
    const set = new Set(data.map((u) => u.perfil).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  const filtrados = useMemo(() => {
    return data.filter((u) => {
      if (filtroPerfil && u.perfil !== filtroPerfil) return false;

      if (filtroCpf.trim()) {
        const digits = filtroCpf.replace(/\D/g, '');
        const cpfDigits = (u.cpf ?? '').replace(/\D/g, '');
        if (digits && !cpfDigits.includes(digits)) return false;
      }

      if (filtroNome.trim()) {
        const termoNorm = normalizar(filtroNome.trim());
        if (!normalizar(u.nome ?? '').includes(termoNorm)) return false;
      }

      return true;
    });
  }, [filtroPerfil, filtroCpf, filtroNome, data]);

  const temFiltro = filtroPerfil || filtroCpf.trim() || filtroNome.trim();

  function limparFiltros() {
    setFiltroPerfil('');
    setFiltroCpf('');
    setFiltroNome('');
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {/* Filtro por Perfil */}
        <select
          value={filtroPerfil}
          onChange={(e) => setFiltroPerfil(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
        >
          <option value="">Todos os perfis</option>
          {perfisDisponiveis.map((p) => (
            <option key={p} value={p}>
              {PERFIL_LABEL[p] ?? p}
            </option>
          ))}
        </select>

        {/* Filtro por CPF */}
        <input
          type="text"
          placeholder="Filtrar por CPF..."
          value={filtroCpf}
          onChange={(e) => setFiltroCpf(e.target.value)}
          className="w-44 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        {/* Filtro por Nome */}
        <input
          type="text"
          placeholder="Filtrar por nome..."
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          className="w-52 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        {temFiltro && (
          <button
            onClick={limparFiltros}
            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
          >
            Limpar filtros
          </button>
        )}

        <span className="ml-auto text-xs text-gray-500">
          {filtrados.length} de {data.length} usuários
        </span>
      </div>
      <TableShell
        title="Aceites por Usuário"
        subtitle={`Total: ${data.length} usuários`}
        headerRight={<RefreshButton onClick={onAtualizar} loading={loading} />}
      >
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <Th>Perfil</Th>
              <Th>CPF</Th>
              <Th>Nome</Th>
              <Th center>Contrato</Th>
              <Th center>Termos de Uso</Th>
              <Th center>Política Privacidade</Th>
              <Th center>Disclaimer NV</Th>
              <Th center>Conf. Identificação</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtrados.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-sm text-gray-400"
                >
                  {temFiltro
                    ? 'Nenhum resultado para os filtros aplicados.'
                    : 'Clique em "Atualizar" para carregar os dados.'}
                </td>
              </tr>
            )}
            {filtrados.map((u, idx) => (
              <tr
                key={`${u.perfil}-${u.cpf ?? idx}-${idx}`}
                className="hover:bg-gray-50"
              >
                <Td>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${PERFIL_BADGE[u.perfil] ?? 'bg-gray-100 text-gray-800'}`}
                  >
                    {PERFIL_LABEL[u.perfil] ?? u.perfil}
                  </span>
                </Td>
                <Td mono>{formatCpf(u.cpf)}</Td>
                <Td className="text-gray-900 max-w-[180px] truncate">
                  {u.nome ?? '—'}
                </Td>
                <Td center>
                  <AceiteCell
                    aceito={u.aceite_contrato}
                    data={u.aceite_contrato_em}
                  />
                </Td>
                <Td center>
                  <AceiteCell
                    aceito={u.aceite_termos}
                    data={u.aceite_termos_em}
                  />
                </Td>
                <Td center>
                  <AceiteCell
                    aceito={u.aceite_politica_privacidade}
                    data={u.aceite_politica_privacidade_em}
                  />
                </Td>
                <Td center>
                  <AceiteCell
                    aceito={u.aceite_disclaimer_nv}
                    data={u.aceite_disclaimer_nv_em}
                  />
                </Td>
                <Td center>
                  <AceiteCell
                    aceito={u.confirmacao_identificacao}
                    data={u.confirmacao_identificacao_em}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

/* ─── TabelaAcessosSuporte ─── */

export function TabelaAcessosSuporte({
  data,
  onAtualizar,
  loading,
}: {
  data: AcessoSuporte[];
  onAtualizar: () => void;
  loading: boolean;
}) {
  return (
    <TableShell
      title="Acessos — Suporte"
      subtitle={`${data.length} registro(s)`}
      headerRight={<RefreshButton onClick={onAtualizar} loading={loading} />}
    >
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <Th>Nome</Th>
            <Th>CPF</Th>
            <Th>Login</Th>
            <Th>Logout</Th>
            <Th>IP</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <Td>{row.nome ?? '—'}</Td>
              <Td mono>{row.cpf}</Td>
              <Td>{formatDate(row.login_timestamp)}</Td>
              <Td>
                {row.logout_timestamp ? formatDate(row.logout_timestamp) : '—'}
              </Td>
              <Td mono>{row.ip_address ?? '—'}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableShell>
  );
}

/* ─── TabelaAcessosComercial ─── */

export function TabelaAcessosComercial({
  data,
  onAtualizar,
  loading,
}: {
  data: AcessoComercial[];
  onAtualizar: () => void;
  loading: boolean;
}) {
  return (
    <TableShell
      title="Acessos — Comercial"
      subtitle={`${data.length} registro(s)`}
      headerRight={<RefreshButton onClick={onAtualizar} loading={loading} />}
    >
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <Th>Nome</Th>
            <Th>CPF</Th>
            <Th>Login</Th>
            <Th>Logout</Th>
            <Th>IP</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <Td>{row.nome ?? '—'}</Td>
              <Td mono>{row.cpf}</Td>
              <Td>{formatDate(row.login_timestamp)}</Td>
              <Td>
                {row.logout_timestamp ? formatDate(row.logout_timestamp) : '—'}
              </Td>
              <Td mono>{row.ip_address ?? '—'}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableShell>
  );
}

/* ─── TabelaAcessosRepresentante ─── */

export function TabelaAcessosRepresentante({
  data,
  onAtualizar,
  loading,
}: {
  data: AcessoRepresentante[];
  onAtualizar: () => void;
  loading: boolean;
}) {
  return (
    <TableShell
      title="Acessos — Representantes"
      subtitle={`${data.length} registro(s)`}
      headerRight={<RefreshButton onClick={onAtualizar} loading={loading} />}
    >
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <Th>Representante</Th>
            <Th>CPF</Th>
            <Th>Login</Th>
            <Th>Logout</Th>
            <Th>IP</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <Td>{row.representante_nome ?? '—'}</Td>
              <Td mono>{row.cpf}</Td>
              <Td>{formatDate(row.login_timestamp)}</Td>
              <Td>
                {row.logout_timestamp ? formatDate(row.logout_timestamp) : '—'}
              </Td>
              <Td mono>{row.ip_address ?? '—'}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableShell>
  );
}

/* ─── TabelaAcessosVendedor ─── */

export function TabelaAcessosVendedor({
  data,
  onAtualizar,
  loading,
}: {
  data: AcessoVendedor[];
  onAtualizar: () => void;
  loading: boolean;
}) {
  return (
    <TableShell
      title="Acessos — Vendedores"
      subtitle={`${data.length} registro(s)`}
      headerRight={<RefreshButton onClick={onAtualizar} loading={loading} />}
    >
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <Th>Nome</Th>
            <Th>CPF</Th>
            <Th>Login</Th>
            <Th>Logout</Th>
            <Th>IP</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <Td>{row.nome ?? '—'}</Td>
              <Td mono>{row.cpf}</Td>
              <Td>{formatDate(row.login_timestamp)}</Td>
              <Td>
                {row.logout_timestamp ? formatDate(row.logout_timestamp) : '—'}
              </Td>
              <Td mono>{row.ip_address ?? '—'}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableShell>
  );
}
