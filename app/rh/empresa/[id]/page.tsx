'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Hooks personalizados
import {
  useEmpresa,
  useFuncionarios,
  useLotesAvaliacao,
  useLaudos,
  useDashboardData,
} from '@/lib/hooks';
import { useLiberarLote } from '@/lib/hooks/useLiberarLote';
import { LiberandoCicloOverlay } from '@/components/LiberandoCicloOverlay';
import { ErrorLiberacaoModal } from '@/components/modals/ErrorLiberacaoModal';

// Componentes principais
import { EmpresaHeader, TabNavigation, LotesGrid } from '@/components/rh';

// Lazy load de componentes grandes
const ModalInserirFuncionario = dynamic(
  () => import('@/components/ModalInserirFuncionario'),
  { ssr: false }
);
const EditEmployeeModal = dynamic(
  () => import('@/components/EditEmployeeModal'),
  { ssr: false }
);
const DetalhesFuncionario = dynamic(
  () => import('@/components/DetalhesFuncionario'),
  { ssr: false }
);
const FuncionariosSection = dynamic(
  () => import('@/components/funcionarios/FuncionariosSection'),
  { ssr: false }
);
const LaudosSection = dynamic(() => import('@/components/LaudosSection'), {
  ssr: false,
});
const PendenciasSection = dynamic(
  () => import('@/components/pendencias/PendenciasSection'),
  { ssr: false }
);

interface Session {
  cpf: string;
  nome: string;
  perfil: 'funcionario' | 'rh' | 'admin';
}

type TabType = 'overview' | 'lotes' | 'laudos' | 'funcionarios' | 'pendencias';

interface Funcionario {
  cpf: string;
  nome: string;
  setor: string;
  funcao: string;
  email: string;
  matricula: string | null;
  nivel_cargo: 'operacional' | 'gestao' | null;
  turno: string | null;
  escala: string | null;
}

/**
 * Dashboard principal de gestão de empresa - Versão refatorada
 * Responsabilidades:
 * - Orquestração de hooks e componentes
 * - Gerenciamento de sessão e navegação
 * - Coordenação de modais e ações globais
 */
export default function EmpresaDashboardPage() {
  // === NAVEGAÇÃO E SESSÃO ===
  const router = useRouter();
  const params = useParams();
  const empresaId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('lotes');

  // === HOOKS DE DADOS ===
  const { empresa } = useEmpresa(empresaId);
  const { fetchFuncionarios } = useFuncionarios(empresaId, session?.perfil);
  const {
    lotes,
    fetchLotes,
    errorHint: lotesErrorHint,
  } = useLotesAvaliacao(empresaId);
  const { laudos, downloadingLaudo, handleDownloadLaudo, fetchLaudos } =
    useLaudos(empresaId);
  const { fetchDashboardData } = useDashboardData(empresaId);
  const {
    liberarLote,
    loading: liberandoLote,
    error: erroLiberacao,
    errorModalOpen,
    closeErrorModal,
  } = useLiberarLote();

  // === ESTADOS DE UI ===
  const [showInserirModal, setShowInserirModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [funcionarioParaEditar, setFuncionarioParaEditar] =
    useState<Funcionario | null>(null);
  const [cpfDetalhes, setCpfDetalhes] = useState<string | null>(null);

  // === VERIFICAÇÃO DE SESSÃO ===
  useEffect(() => {
    const checkSessionAndLoad = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session');
        if (!sessionRes.ok) {
          router.push('/login');
          return;
        }
        const sessionData = await sessionRes.json();

        if (sessionData.perfil !== 'rh' && sessionData.perfil !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setSession(sessionData);

        // Primeiro carregar a empresa para validar permissões
        const empresaRes = await fetch('/api/rh/empresas');
        if (!empresaRes.ok) {
          console.error('Erro ao carregar empresas');
          router.push('/rh');
          return;
        }

        const empresasData = await empresaRes.json();
        const empresaAtual = empresasData.find(
          (e: any) => e.id.toString() === empresaId
        );

        if (!empresaAtual) {
          console.error('Empresa não encontrada ou sem permissão');
          router.push('/rh');
          return;
        }

        // Empresa válida, carregar dados iniciais em paralelo
        await Promise.all([
          fetchDashboardData(),
          fetchFuncionarios(),
          fetchLotes(),
          fetchLaudos(),
        ]);
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    checkSessionAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  // === RECARREGAR DADOS AO TROCAR ABA ===
  useEffect(() => {
    if (!session || !empresaId) return;

    switch (activeTab) {
      case 'overview':
        fetchDashboardData();
        break;
      case 'lotes':
        fetchLotes();
        break;
      case 'laudos':
        fetchLaudos();
        break;
      case 'funcionarios':
        fetchFuncionarios();
        break;
      case 'pendencias':
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, empresaId]);

  // === HANDLERS ===
  const handleVoltar = useCallback(() => {
    router.push('/rh');
  }, [router]);

  const handleSair = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }, [router]);

  const handleIniciarCiclo = useCallback(async () => {
    const result = await liberarLote({ empresaId: parseInt(empresaId) });

    if (result && result.success && result.loteId) {
      router.push(`/rh/empresa/${empresaId}/lote/${result.loteId}`);
    }
    // Erro é tratado pelo hook que abre o modal automaticamente
  }, [liberarLote, empresaId, router]);

  // === LOADING STATE ===
  if (loading || !session || !empresa) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          role="status"
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
        ></div>
      </div>
    );
  }

  // === RENDER ===
  return (
    <div>
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Header */}
        <EmpresaHeader
          empresaNome={empresa.nome}
          empresaCnpj={empresa.cnpj}
          onVoltar={handleVoltar}
          onSair={handleSair}
        />

        {/* Navegação por abas */}
        {/* Exibir hint de permissão para lotes (se presente) */}
        {lotesErrorHint && (
          <div className="max-w-3xl mx-auto mt-4 p-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-700 font-semibold">
                  Acesso restrito
                </div>
                <div className="flex-1 text-sm text-yellow-800">
                  {lotesErrorHint}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  onClick={() => handleVoltar()}
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        )}

        <TabNavigation
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
          }}
        />

        {/* Conteúdo das abas */}
        {activeTab === 'lotes' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Botão Liberar Lote */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Ciclos de Coletas Avaliativas
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Gerencie os ciclos de coletas avaliativas da empresa
                  </p>
                </div>
                <button
                  onClick={handleIniciarCiclo}
                  disabled={liberandoLote}
                  className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {liberandoLote ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Liberando...
                    </>
                  ) : (
                    '\u{1F680} Iniciar Novo Ciclo'
                  )}
                </button>
              </div>

              <LotesGrid
                lotes={lotes}
                laudos={laudos}
                downloadingLaudo={downloadingLaudo}
                onLoteClick={(loteId) =>
                  router.push(`/rh/empresa/${empresaId}/lote/${loteId}`)
                }
                onDownloadLaudo={handleDownloadLaudo}
              />
            </div>
          </div>
        )}

        {activeTab === 'laudos' && (
          <div className="space-y-6">
            <LaudosSection empresaId={parseInt(empresaId, 10)} />
          </div>
        )}

        {activeTab === 'funcionarios' && (
          <div className="space-y-6">
            <FuncionariosSection
              contexto="clinica"
              empresaId={parseInt(empresaId)}
              empresaNome={empresa.nome}
              onRefresh={fetchFuncionarios}
              defaultStatusFilter="todos"
            />
          </div>
        )}

        {activeTab === 'pendencias' && (
          <div className="space-y-6">
            <PendenciasSection empresaId={parseInt(empresaId)} />
          </div>
        )}
      </main>

      {/* Modais */}
      <ErrorLiberacaoModal
        isOpen={errorModalOpen}
        onClose={closeErrorModal}
        mensagem={erroLiberacao || ''}
        title="Não foi possível criar o ciclo"
      />

      {showInserirModal && empresa && session && (
        <ModalInserirFuncionario
          empresaId={parseInt(empresaId)}
          empresaNome={empresa.nome}
          responsavelCpf={session.cpf}
          onClose={() => setShowInserirModal(false)}
          onSuccess={() => {
            fetchFuncionarios();
            setShowInserirModal(false);
          }}
        />
      )}

      {showEditModal && funcionarioParaEditar && (
        <EditEmployeeModal
          funcionario={funcionarioParaEditar}
          onClose={() => {
            setShowEditModal(false);
            setFuncionarioParaEditar(null);
          }}
          onSuccess={() => {
            fetchFuncionarios();
            setShowEditModal(false);
            setFuncionarioParaEditar(null);
          }}
        />
      )}

      {cpfDetalhes && (
        <DetalhesFuncionario
          cpf={cpfDetalhes}
          onClose={() => setCpfDetalhes(null)}
        />
      )}

      <LiberandoCicloOverlay
        visible={liberandoLote}
        empresaNome={empresa?.nome}
      />
    </div>
  );
}
