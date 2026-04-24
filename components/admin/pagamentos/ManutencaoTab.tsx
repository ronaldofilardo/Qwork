'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Wrench,
  Building2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Calendar,
  Clock,
  Loader2,
} from 'lucide-react';

interface ItemManutencao {
  tipo: 'entidade' | 'empresa_clinica';
  id: number;
  clinica_id: number | null;
  clinica_nome: string | null;
  nome: string;
  cnpj: string;
  limite_cobranca: string;
  dias_vencidos: number;
  valor: number;
}

interface PagamentoAguardandoQuitacao {
  tipo: 'entidade' | 'empresa_clinica';
  id: number;
  pagamento_id: number;
  nome: string;
  cnpj: string;
  clinica_nome: string | null;
  valor: number;
  status: string;
  criado_em: string;
}

interface RelatorioManutencao {
  entidades: ItemManutencao[];
  empresas: ItemManutencao[];
  total: number;
}

interface PagamentosAguardandoQuitacaoData {
  pagamentos: PagamentoAguardandoQuitacao[];
  total: number;
}

interface ConfirmacaoState {
  item: ItemManutencao | null;
  loading: boolean;
}

function formatarCNPJ(cnpj: string): string {
  const c = cnpj.replace(/\D/g, '');
  if (c.length !== 14) return cnpj;
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12, 14)}`;
}

function formatarData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

interface TabelaItemsProps {
  titulo: string;
  icone: React.ReactNode;
  items: ItemManutencao[];
  confirmando: number | null;
  onConfirmar: (item: ItemManutencao) => void;
}

interface TabelaAguardandoQuitacaoProps {
  titulo: string;
  icone: React.ReactNode;
  items: PagamentoAguardandoQuitacao[];
}

function TabelaItems({
  titulo,
  icone,
  items,
  confirmando,
  onConfirmar,
}: TabelaItemsProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          {icone}
          <h3 className="font-semibold text-gray-900">{titulo}</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            0
          </span>
        </div>
        <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-sm">Nenhuma cobrança pendente</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        {icone}
        <h3 className="font-semibold text-gray-900">{titulo}</h3>
        <span className="text-xs text-white bg-orange-500 px-2 py-0.5 rounded-full font-medium">
          {items.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {items[0]?.tipo === 'empresa_clinica'
                  ? 'Clínica / Empresa'
                  : 'Entidade'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CNPJ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Limite
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dias Vencidos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ação
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr
                key={`${item.tipo}-${item.id}`}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">
                  {item.tipo === 'empresa_clinica' && item.clinica_nome ? (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">
                        {item.clinica_nome}
                      </p>
                      <p className="font-medium text-gray-900">{item.nome}</p>
                    </div>
                  ) : (
                    <p className="font-medium text-gray-900">{item.nome}</p>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-600 font-mono">
                  {formatarCNPJ(item.cnpj)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-red-600">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatarData(item.limite_cobranca)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    <Clock className="w-3 h-3" />
                    {item.dias_vencidos}{' '}
                    {item.dias_vencidos === 1 ? 'dia' : 'dias'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-gray-900">
                    R${' '}
                    {item.valor.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onConfirmar(item)}
                    disabled={confirmando === item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {confirmando === item.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Wrench className="w-3.5 h-3.5" />
                        Confirmar Cobrança
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabelaAguardandoQuitacao({
  titulo,
  icone,
  items,
}: TabelaAguardandoQuitacaoProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          {icone}
          <h3 className="font-semibold text-gray-900">{titulo}</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            0
          </span>
        </div>
        <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-sm">Nenhuma cobrança pendente</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        {icone}
        <h3 className="font-semibold text-gray-900">{titulo}</h3>
        <span className="text-xs text-white bg-blue-500 px-2 py-0.5 rounded-full font-medium">
          {items.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {items[0]?.tipo === 'empresa_clinica'
                  ? 'Clínica / Empresa'
                  : 'Entidade'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CNPJ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr
                key={`${item.tipo}-${item.pagamento_id}`}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">
                  {item.tipo === 'empresa_clinica' && item.clinica_nome ? (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">
                        {item.clinica_nome}
                      </p>
                      <p className="font-medium text-gray-900">{item.nome}</p>
                    </div>
                  ) : (
                    <p className="font-medium text-gray-900">{item.nome}</p>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-600 font-mono">
                  {formatarCNPJ(item.cnpj)}
                </td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-gray-900">
                    R${' '}
                    {item.valor.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    Aguardando Pagamento
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ModalConfirmacaoProps {
  item: ItemManutencao | null;
  loading: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

function ModalConfirmacao({
  item,
  loading,
  onConfirmar,
  onCancelar,
}: ModalConfirmacaoProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Wrench className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              Confirmar Taxa de Manutenção
            </h3>
            <p className="text-sm text-gray-500">Gerar cobrança de R$250,00</p>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2 text-sm">
          {item.tipo === 'empresa_clinica' && item.clinica_nome && (
            <div className="flex justify-between">
              <span className="text-gray-500">Clínica:</span>
              <span className="font-medium text-gray-700">
                {item.clinica_nome}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">
              {item.tipo === 'entidade' ? 'Entidade:' : 'Empresa:'}
            </span>
            <span className="font-medium text-gray-700">{item.nome}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">CNPJ:</span>
            <span className="font-mono text-gray-700">
              {formatarCNPJ(item.cnpj)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Data Limite:</span>
            <span className="text-red-600 font-medium">
              {formatarData(item.limite_cobranca)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Dias Vencidos:</span>
            <span className="text-red-600 font-medium">
              {item.dias_vencidos} dias
            </span>
          </div>
          <div className="border-t border-orange-200 pt-2 flex justify-between">
            <span className="font-semibold text-gray-700">Valor a Cobrar:</span>
            <span className="font-bold text-orange-600">
              R${' '}
              {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          Ao confirmar, uma cobrança será gerada com vencimento em 15 dias. Caso
          o tomador pague esta taxa e depois emita um laudo, o valor será
          descontado integralmente no 1º laudo.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancelar}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-60 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-60 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Wrench className="w-4 h-4" />
                Confirmar Cobrança
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ManutencaoTab() {
  const [relatorio, setRelatorio] = useState<RelatorioManutencao | null>(null);
  const [pagamentosAguardandoQuitacao, setPagamentosAguardandoQuitacao] =
    useState<PagamentoAguardandoQuitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmacao, setConfirmacao] = useState<ConfirmacaoState>({
    item: null,
    loading: false,
  });
  const [confirmando, setConfirmando] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    tipo: 'success' | 'error';
    mensagem: string;
  } | null>(null);

  const carregarRelatorio = useCallback(async () => {
    try {
      setLoading(true);
      const [resVencidas, resQuitacao] = await Promise.all([
        fetch('/api/admin/manutencao/relatorio'),
        fetch('/api/admin/manutencao/aguardando-quitacao'),
      ]);

      if (!resVencidas.ok)
        throw new Error('Erro ao carregar relatório de vencidas');
      if (!resQuitacao.ok)
        throw new Error('Erro ao carregar pagamentos aguardando quitação');

      const dataVencidas: RelatorioManutencao = await resVencidas.json();
      const dataQuitacao: PagamentosAguardandoQuitacaoData =
        await resQuitacao.json();

      setRelatorio(dataVencidas);
      setPagamentosAguardandoQuitacao(dataQuitacao.pagamentos);
    } catch (error) {
      console.error('[ManutencaoTab] Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarRelatorio();
  }, [carregarRelatorio]);

  const handleAbrirModal = (item: ItemManutencao) => {
    setConfirmacao({ item, loading: false });
  };

  const handleFecharModal = () => {
    if (!confirmacao.loading) {
      setConfirmacao({ item: null, loading: false });
    }
  };

  const handleConfirmar = async () => {
    if (!confirmacao.item) return;

    const item = confirmacao.item;
    setConfirmacao((prev) => ({ ...prev, loading: true }));
    setConfirmando(item.id);

    try {
      const endpoint =
        item.tipo === 'entidade'
          ? `/api/admin/manutencao/entidade/${item.id}/confirmar`
          : `/api/admin/manutencao/empresa/${item.id}/confirmar`;

      const response = await fetch(endpoint, { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Erro ao gerar cobrança');
      }

      setFeedback({
        tipo: 'success',
        mensagem: `✅ Cobrança gerada! Pagamento #${data.pagamento_id} criado para ${item.nome}. Acesse "Aguardando Pagamento" para gerar o link.`,
      });

      // Recarregar relatório para remover o item confirmado
      await carregarRelatorio();
    } catch (error) {
      setFeedback({
        tipo: 'error',
        mensagem:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao gerar cobrança',
      });
    } finally {
      setConfirmacao({ item: null, loading: false });
      setConfirmando(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto" />
          <p className="text-gray-500 text-sm">
            Carregando relatório de manutenção...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-bold text-gray-900">
                Taxa de Manutenção
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              Gerenciar cobranças de manutenção para tomadores que atingiram 90
              dias sem emitir laudo.
            </p>
          </div>
          <button
            onClick={carregarRelatorio}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>

        {/* Feedback de ação */}
        {feedback && (
          <div
            className={`flex items-start gap-3 p-4 rounded-lg border text-sm ${
              feedback.tipo === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {feedback.tipo === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">{feedback.mensagem}</div>
            <button
              onClick={() => setFeedback(null)}
              className="text-current opacity-60 hover:opacity-100 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Grid: esquerda=Vencidas, direita=AguardandoQuitacao */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SEÇÃO VENCIDAS */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Box Header Vencidas */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-red-800">
                    Vencidas
                  </div>
                  <div className="text-xs text-red-700">
                    {relatorio?.total ?? 0} cobranças para gerar
                  </div>
                </div>
              </div>

              {/* Tabelas Vencidas */}
              <TabelaItems
                titulo="Entidades"
                icone={<Building2 className="w-4 h-4 text-blue-500" />}
                items={relatorio?.entidades ?? []}
                confirmando={confirmando}
                onConfirmar={handleAbrirModal}
              />

              <TabelaItems
                titulo="Empresas de Clínicas"
                icone={<Building2 className="w-4 h-4 text-purple-500" />}
                items={relatorio?.empresas ?? []}
                confirmando={confirmando}
                onConfirmar={handleAbrirModal}
              />
            </div>
          </div>

          {/* SEÇÃO AGUARDANDO QUITAÇÃO */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Box Header Aguardando Quitação */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-blue-800">
                    Aguardando Quitação
                  </div>
                  <div className="text-xs text-blue-700">
                    {pagamentosAguardandoQuitacao.length} cobranças aguardando
                    pagamento
                  </div>
                </div>
              </div>

              {/* Tabelas Aguardando Quitação */}
              <TabelaAguardandoQuitacao
                titulo="Entidades"
                icone={<Building2 className="w-4 h-4 text-blue-500" />}
                items={pagamentosAguardandoQuitacao.filter(
                  (p) => p.tipo === 'entidade'
                )}
              />

              <TabelaAguardandoQuitacao
                titulo="Empresas de Clínicas"
                icone={<Building2 className="w-4 h-4 text-purple-500" />}
                items={pagamentosAguardandoQuitacao.filter(
                  (p) => p.tipo === 'empresa_clinica'
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmação */}
      <ModalConfirmacao
        item={confirmacao.item}
        loading={confirmacao.loading}
        onConfirmar={handleConfirmar}
        onCancelar={handleFecharModal}
      />
    </>
  );
}
