'use client';

import { AlertCircle } from 'lucide-react';
import ModalLinkPagamentoEmissao from '../modals/ModalLinkPagamentoEmissao';
import {
  usePagamentosAdmin,
  formatCurrency,
  formatDate,
} from './pagamentos/usePagamentosAdmin';
import { PagamentosFilterTabs } from './pagamentos/PagamentosFilterTabs';
import { SolicitacaoCard } from './pagamentos/SolicitacaoCard';
import { ParcelasAVencer } from './pagamentos/ParcelasAVencer';
import { ManutencaoTab } from './pagamentos/ManutencaoTab';
import { AguardandoPagamentoTab } from './pagamentos/AguardandoPagamentoTab';

export default function PagamentosContent() {
  const {
    loading,
    filterTab,
    setFilterTab,
    modalLink,
    setModalLink,
    processando,
    valorInput,
    setValorInput,
    codigoRepInput,
    setCodigoRepInput,
    carregarSolicitacoes,
    handleDefinirValor,
    handleGerarLink,
    handleVerLink,
    handleVerificarPagamento,
    handleDeletarLink,
    handleDisponibilizarLink,
    handleVincularRepresentante,
    getSolicitacoesFiltradas,
    getTabCount,
  } = usePagamentosAdmin();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando solicitações...</p>
        </div>
      </div>
    );
  }

  const filtradas = getSolicitacoesFiltradas();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Pagamentos de Emissão
          </h2>
          <p className="text-gray-600 mt-1">
            Gerencie as solicitações de pagamento para emissão de laudos
          </p>
        </div>
        <button
          onClick={carregarSolicitacoes}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          Atualizar
        </button>
      </div>

      {/* Tabs de Filtro */}
      <PagamentosFilterTabs
        filterTab={filterTab}
        setFilterTab={setFilterTab}
        getTabCount={getTabCount}
      />

      {/* Lista de Solicitações, Parcelas A Vencer ou Manutenção */}
      {filterTab === 'manutencao' ? (
        <ManutencaoTab />
      ) : filterTab === 'a_vencer' ? (
        <ParcelasAVencer />
      ) : filterTab === 'aguardando_pagamento' ? (
        <AguardandoPagamentoTab
          solicitacoes={filtradas}
          processando={processando}
          valorInput={valorInput}
          setValorInput={setValorInput}
          codigoRepInput={codigoRepInput}
          setCodigoRepInput={setCodigoRepInput}
          onDefinirValor={handleDefinirValor}
          onGerarLink={handleGerarLink}
          onVerLink={handleVerLink}
          onVerificarPagamento={handleVerificarPagamento}
          onDisponibilizarLink={handleDisponibilizarLink}
          onDeletarLink={handleDeletarLink}
          onVincularRepresentante={handleVincularRepresentante}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      ) : filtradas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma solicitação encontrada
          </h3>
          <p className="text-gray-600">
            {filterTab === 'todos'
              ? 'Não há solicitações de emissão no momento.'
              : `Não há solicitações com status "${filterTab}".`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtradas.map((solicitacao) => (
            <SolicitacaoCard
              key={solicitacao.lote_id}
              solicitacao={solicitacao}
              processando={processando}
              valorInput={valorInput}
              setValorInput={setValorInput}
              codigoRepInput={codigoRepInput}
              setCodigoRepInput={setCodigoRepInput}
              onDefinirValor={handleDefinirValor}
              onGerarLink={handleGerarLink}
              onVerLink={handleVerLink}
              onVerificarPagamento={handleVerificarPagamento}
              onDisponibilizarLink={handleDisponibilizarLink}
              onDeletarLink={handleDeletarLink}
              onVincularRepresentante={handleVincularRepresentante}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* Modal de Link/QR Code */}
      {modalLink && (
        <ModalLinkPagamentoEmissao
          isOpen={modalLink.isOpen}
          onClose={() => setModalLink(null)}
          token={modalLink.token}
          loteId={modalLink.loteId}
          nomeTomador={modalLink.nomeTomador}
          valorTotal={modalLink.valorTotal}
          numAvaliacoes={modalLink.numAvaliacoes}
          onDisponibilizarLink={handleDisponibilizarLink}
          isDisponibilizando={processando === modalLink.loteId}
        />
      )}
    </div>
  );
}
