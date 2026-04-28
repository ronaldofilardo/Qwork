'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Wrench,
  CheckCircle2,
  Link2,
  RefreshCw,
  Send,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { SolicitacaoCard } from './SolicitacaoCard';
import ModalLinkPagamentoEmissao from '@/components/modals/ModalLinkPagamentoEmissao';
import type { Solicitacao } from './types';

interface PagamentoTaxa {
  tipo: 'entidade' | 'empresa_clinica';
  id: number;
  pagamento_id: number;
  nome: string;
  cnpj: string;
  clinica_nome: string | null;
  valor: number;
  status: string;
  criado_em: string;
  link_pagamento_token: string | null;
  link_disponibilizado_em: string | null;
}

interface ModalTaxaState {
  isOpen: boolean;
  token: string;
  pagamentoId: number;
  nome: string;
  valor: number;
}

function formatarCNPJ(cnpj: string): string {
  const c = cnpj.replace(/\D/g, '');
  if (c.length !== 14) return cnpj;
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12, 14)}`;
}

interface TaxaCardProps {
  taxa: PagamentoTaxa;
  processandoTaxa: number | null;
  isDisponibilizandoTaxa: boolean;
  onGerarLink: (taxa: PagamentoTaxa) => void;
  onVerLink: (taxa: PagamentoTaxa) => void;
  onVerificar: (taxa: PagamentoTaxa) => void;
  onDisponibilizar: (pagamentoId: number) => void;
}

function TaxaCard({
  taxa,
  processandoTaxa,
  isDisponibilizandoTaxa,
  onGerarLink,
  onVerLink,
  onVerificar,
  onDisponibilizar,
}: TaxaCardProps) {
  const isProcessando = processandoTaxa === taxa.pagamento_id;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {taxa.tipo === 'empresa_clinica' && taxa.clinica_nome && (
              <p className="text-xs text-gray-500 truncate">
                {taxa.clinica_nome}
              </p>
            )}
          </div>
          <p className="font-semibold text-gray-900 truncate">{taxa.nome}</p>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            {formatarCNPJ(taxa.cnpj)}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border bg-orange-50 text-orange-700 border-orange-200 flex-shrink-0 ml-3">
          <Wrench className="w-3.5 h-3.5" />
          Manutenção Anual
        </span>
      </div>

      {/* Valor */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <p className="text-xs text-gray-500 mb-1">Valor da Taxa</p>
        <p className="text-2xl font-bold text-gray-900">
          R$ {taxa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Ações */}
      {!taxa.link_pagamento_token ? (
        <button
          onClick={() => onGerarLink(taxa)}
          disabled={isProcessando}
          className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Link2 className={`w-4 h-4 ${isProcessando ? 'animate-spin' : ''}`} />
          {isProcessando ? 'Gerando...' : 'Gerar Link de Pagamento'}
        </button>
      ) : (
        <>
          {/* Banner disponibilizar */}
          {!taxa.link_disponibilizado_em ? (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-3">
              <p className="text-sm text-amber-800 font-medium">
                Link pronto para disponibilizar
              </p>
              <button
                onClick={() => onDisponibilizar(taxa.pagamento_id)}
                disabled={isDisponibilizandoTaxa}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0 ml-3"
              >
                <Send className="w-3.5 h-3.5" />
                {isDisponibilizandoTaxa ? 'Enviando...' : 'Disponibilizar'}
              </button>
            </div>
          ) : (
            <p className="text-xs text-green-600 mb-3">
              ✓ Disponibilizado em{' '}
              {new Date(taxa.link_disponibilizado_em).toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </p>
          )}

          {/* Botões principais */}
          <div className="flex gap-3">
            <button
              onClick={() => onVerLink(taxa)}
              disabled={isProcessando}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              Ver Link / QR Code
            </button>
            <button
              onClick={() => onVerificar(taxa)}
              disabled={isProcessando}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${isProcessando ? 'animate-spin' : ''}`}
              />
              Verificar Pagamento
            </button>
          </div>
        </>
      )}
    </div>
  );
}

interface AguardandoPagamentoTabProps {
  solicitacoes: Solicitacao[];
  processando: number | null;
  valorInput: Record<number, string>;
  setValorInput: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  codigoRepInput: Record<number, string>;
  setCodigoRepInput: React.Dispatch<
    React.SetStateAction<Record<number, string>>
  >;
  onDefinirValor: (loteId: number) => void;
  onGerarLink: (loteId: number) => void;
  onVerLink: (solicitacao: Solicitacao) => void;
  onVerificarPagamento: (loteId: number) => void;
  onDisponibilizarLink: (loteId: number) => void;
  onDeletarLink: (loteId: number) => void;
  onCancelarCobranca: (loteId: number) => void;
  onConfirmarPagamento: (
    loteId: number,
    metodo: string,
    parcelas: number
  ) => void;
  onVincularRepresentante: (loteId: number) => void;
  formatCurrency: (value: number | null) => string;
  formatDate: (dateString: string | null) => string;
}

export function AguardandoPagamentoTab({
  solicitacoes,
  processando,
  valorInput,
  setValorInput,
  codigoRepInput,
  setCodigoRepInput,
  onDefinirValor,
  onGerarLink,
  onVerLink,
  onVerificarPagamento,
  onDisponibilizarLink,
  onDeletarLink,
  onCancelarCobranca,
  onConfirmarPagamento,
  onVincularRepresentante,
  formatCurrency,
  formatDate,
}: AguardandoPagamentoTabProps) {
  const [taxas, setTaxas] = useState<PagamentoTaxa[]>([]);
  const [loadingTaxas, setLoadingTaxas] = useState(true);
  const [processandoTaxa, setProcessandoTaxa] = useState<number | null>(null);
  const [isDisponibilizandoTaxa, setIsDisponibilizandoTaxa] = useState(false);
  const [modalTaxa, setModalTaxa] = useState<ModalTaxaState>({
    isOpen: false,
    token: '',
    pagamentoId: 0,
    nome: '',
    valor: 0,
  });

  const carregarTaxas = useCallback(async () => {
    try {
      setLoadingTaxas(true);
      const res = await fetch('/api/admin/manutencao/aguardando-quitacao');
      if (!res.ok) throw new Error('Erro ao carregar taxas');
      const data = await res.json();
      setTaxas(data.pagamentos ?? []);
    } catch {
      setTaxas([]);
    } finally {
      setLoadingTaxas(false);
    }
  }, []);

  useEffect(() => {
    carregarTaxas();
  }, [carregarTaxas]);

  const handleGerarLinkTaxa = async (taxa: PagamentoTaxa) => {
    setProcessandoTaxa(taxa.pagamento_id);
    try {
      const res = await fetch(
        `/api/admin/manutencao/pagamentos/${taxa.pagamento_id}/gerar-link`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar link');

      setTaxas((prev) =>
        prev.map((t) =>
          t.pagamento_id === taxa.pagamento_id
            ? {
                ...t,
                link_pagamento_token: data.token,
                status: 'aguardando_pagamento',
              }
            : t
        )
      );

      setModalTaxa({
        isOpen: true,
        token: data.token,
        pagamentoId: taxa.pagamento_id,
        nome: taxa.nome,
        valor: taxa.valor,
      });
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar link');
    } finally {
      setProcessandoTaxa(null);
    }
  };

  const handleVerLinkTaxa = (taxa: PagamentoTaxa) => {
    if (!taxa.link_pagamento_token) return;
    setModalTaxa({
      isOpen: true,
      token: taxa.link_pagamento_token,
      pagamentoId: taxa.pagamento_id,
      nome: taxa.nome,
      valor: taxa.valor,
    });
  };

  const handleDisponibilizarTaxa = async (pagamentoId: number) => {
    setIsDisponibilizandoTaxa(true);
    try {
      const res = await fetch(
        `/api/admin/manutencao/pagamentos/${pagamentoId}/disponibilizar`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao disponibilizar link');

      setTaxas((prev) =>
        prev.map((t) =>
          t.pagamento_id === pagamentoId
            ? { ...t, link_disponibilizado_em: data.link_disponibilizado_em }
            : t
        )
      );
    } catch (err: any) {
      alert(err.message || 'Erro ao disponibilizar link');
    } finally {
      setIsDisponibilizandoTaxa(false);
    }
  };

  const handleVerificarTaxa = async (taxa: PagamentoTaxa) => {
    setProcessandoTaxa(taxa.pagamento_id);
    try {
      const res = await fetch(
        `/api/admin/manutencao/pagamentos/${taxa.pagamento_id}/verificar`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao verificar pagamento');

      if (data.synced) {
        await carregarTaxas();
      } else {
        alert(data.message || 'Pagamento ainda não confirmado');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao verificar pagamento');
    } finally {
      setProcessandoTaxa(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Coluna Esquerda: Lotes */}
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <Package className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-blue-800">Lotes</div>
              <div className="text-xs text-blue-700">
                {solicitacoes.length}{' '}
                {solicitacoes.length === 1
                  ? 'lote aguardando pagamento'
                  : 'lotes aguardando pagamento'}
              </div>
            </div>
          </div>

          {solicitacoes.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 flex items-center justify-center gap-2 py-12 text-gray-400">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-sm">Nenhum lote aguardando pagamento</span>
            </div>
          ) : (
            <div className="space-y-4">
              {solicitacoes.map((solicitacao) => (
                <SolicitacaoCard
                  key={solicitacao.lote_id}
                  solicitacao={solicitacao}
                  processando={processando}
                  valorInput={valorInput}
                  setValorInput={setValorInput}
                  codigoRepInput={codigoRepInput}
                  setCodigoRepInput={setCodigoRepInput}
                  onDefinirValor={onDefinirValor}
                  onGerarLink={onGerarLink}
                  onVerLink={onVerLink}
                  onVerificarPagamento={onVerificarPagamento}
                  onDisponibilizarLink={onDisponibilizarLink}
                  onDeletarLink={onDeletarLink}
                  onCancelarCobranca={onCancelarCobranca}
                  onConfirmarPagamento={onConfirmarPagamento}
                  onVincularRepresentante={onVincularRepresentante}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Coluna Direita: Taxas de Manutenção */}
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3">
            <Wrench className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-orange-800">Taxas</div>
              <div className="text-xs text-orange-700">
                {loadingTaxas
                  ? 'Carregando...'
                  : `${taxas.length} ${taxas.length === 1 ? 'taxa aguardando pagamento' : 'taxas aguardando pagamento'}`}
              </div>
            </div>
          </div>

          {loadingTaxas ? (
            <div className="bg-white rounded-lg border border-gray-200 flex items-center justify-center py-12">
              <div className="animate-spin h-6 w-6 rounded-full border-2 border-orange-500 border-t-transparent" />
            </div>
          ) : taxas.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 flex items-center justify-center gap-2 py-12 text-gray-400">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-sm">Nenhuma taxa aguardando pagamento</span>
            </div>
          ) : (
            <div className="space-y-4">
              {taxas.map((taxa) => (
                <TaxaCard
                  key={taxa.pagamento_id}
                  taxa={taxa}
                  processandoTaxa={processandoTaxa}
                  isDisponibilizandoTaxa={isDisponibilizandoTaxa}
                  onGerarLink={handleGerarLinkTaxa}
                  onVerLink={handleVerLinkTaxa}
                  onVerificar={handleVerificarTaxa}
                  onDisponibilizar={handleDisponibilizarTaxa}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Link de Pagamento - Taxas de Manutenção */}
      {modalTaxa.isOpen && (
        <ModalLinkPagamentoEmissao
          isOpen={modalTaxa.isOpen}
          onClose={() => setModalTaxa((prev) => ({ ...prev, isOpen: false }))}
          token={modalTaxa.token}
          loteId={modalTaxa.pagamentoId}
          nomeTomador={modalTaxa.nome}
          valorTotal={modalTaxa.valor}
          numAvaliacoes={1}
          linkPath="/pagamento/manutencao"
          onDisponibilizarLink={() =>
            handleDisponibilizarTaxa(modalTaxa.pagamentoId)
          }
          isDisponibilizando={isDisponibilizandoTaxa}
        />
      )}
    </>
  );
}
