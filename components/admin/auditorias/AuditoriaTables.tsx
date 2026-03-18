import { formatDate, formatDuration } from './helpers';
import type {
  AcessoGestor,
  AcessoRH,
  AuditoriaAvaliacao,
  AuditoriaLote,
  AuditoriaLaudo,
} from './types';

/* ─── Shared Table Shell ─── */

function TableShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
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

/* ─── 1. Acesso Gestor ─── */

export function TabelaAcessosGestor({ data }: { data: AcessoGestor[] }) {
  return (
    <TableShell
      title="Acessos de Gestores de Entidade"
      subtitle={`Total: ${data.length} registros`}
    >
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <Th>Empresa</Th>
            <Th>CNPJ</Th>
            <Th>Login</Th>
            <Th>Logout</Th>
            <Th>Duração</Th>
            <Th>IP</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((a) => (
            <tr key={a.id} className="hover:bg-gray-50">
              <Td className="text-gray-900">{a.empresa_nome ?? '—'}</Td>
              <Td mono>{a.empresa_cnpj ?? '—'}</Td>
              <Td>{formatDate(a.login_timestamp)}</Td>
              <Td>{formatDate(a.logout_timestamp)}</Td>
              <Td>{formatDuration(a.session_duration)}</Td>
              <Td mono>{a.ip_address}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableShell>
  );
}

/* ─── 2. Acesso RH ─── */

export function TabelaAcessosRH({ data }: { data: AcessoRH[] }) {
  return (
    <TableShell
      title="Acessos de Gestores RH"
      subtitle={`Total: ${data.length} registros`}
    >
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <Th>Clínica</Th>
            <Th>Login</Th>
            <Th>Logout</Th>
            <Th>Duração</Th>
            <Th>IP</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((a) => (
            <tr key={a.id} className="hover:bg-gray-50">
              <Td className="text-gray-900">{a.clinica_nome}</Td>
              <Td>{formatDate(a.login_timestamp)}</Td>
              <Td>{formatDate(a.logout_timestamp)}</Td>
              <Td>{formatDuration(a.session_duration)}</Td>
              <Td mono>{a.ip_address}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableShell>
  );
}

/* ─── 3. Avaliações ─── */

export function TabelaAvaliacoes({ data }: { data: AuditoriaAvaliacao[] }) {
  return (
    <TableShell
      title="Auditoria de Avaliações"
      subtitle={`Total: ${data.length} registros`}
    >
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <Th>ID</Th>
            <Th>Tomador / Empresa</Th>
            <Th>Lote</Th>
            <Th>Data Liberação</Th>
            <Th>Data Conclusão</Th>
            <Th center>Concluída</Th>
            <Th center>Inativada</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((a) => (
            <tr key={a.avaliacao_id} className="hover:bg-gray-50">
              <Td className="text-gray-900">{a.avaliacao_id}</Td>
              <Td>{a.empresa_nome ?? '—'}</Td>
              <Td>{a.lote}</Td>
              <Td>{formatDate(a.liberado_em)}</Td>
              <Td>{formatDate(a.concluida_em)}</Td>
              <Td center>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    a.concluida
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {a.concluida ? 'Sim' : 'Não'}
                </span>
              </Td>
              <Td center>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    a.inativada
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {a.inativada ? 'Sim' : 'Não'}
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableShell>
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

export function TabelaLotes({ data }: { data: AuditoriaLote[] }) {
  return (
    <TableShell
      title="Auditoria de Lotes"
      subtitle={`Total: ${data.length} registros`}
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
}: {
  data: AuditoriaLaudo[];
  onVerDetalhe: (laudoId: number) => void;
}) {
  return (
    <TableShell
      title="Auditoria de Laudos"
      subtitle={`Total: ${data.length} registros`}
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
