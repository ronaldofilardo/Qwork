'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Hooks personalizados
import {
  useEmpresa,
  useFuncionarios,
  useLotesAvaliacao,
  useAnomalias,
  useLaudos,
  useDashboardData,
} from '@/lib/hooks';

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
const RelatorioSetor = dynamic(() => import('@/components/RelatorioSetor'), {
  ssr: false,
});
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
const LiberarLoteModal = dynamic(
  () =>
    import('@/components/modals/LiberarLoteModal').then((mod) => ({
      default: mod.LiberarLoteModal,
    })),
  { ssr: false }
);

interface Session {
  cpf: string;
  nome: string;
  perfil: 'funcionario' | 'rh' | 'admin';
}

type TabType =
  | 'overview'
  | 'lotes'
  | 'laudos'
  | 'funcionarios'
  | 'pendencias'
  | 'desligamentos';

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
  const {
    anomalias,
    fetchAnomalias,
    loading: loadingAnomalias,
  } = useAnomalias(empresaId);
  const { laudos, downloadingLaudo, handleDownloadLaudo, fetchLaudos } =
    useLaudos(empresaId);
  const { fetchDashboardData } = useDashboardData(empresaId);

  // === ESTADOS DE UI ===
  const [showInserirModal, setShowInserirModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [funcionarioParaEditar, setFuncionarioParaEditar] =
    useState<Funcionario | null>(null);
  const [cpfDetalhes, setCpfDetalhes] = useState<string | null>(null);
  const [showRelatorioSetor, setShowRelatorioSetor] = useState(false);
  const [loteIdRelatorioSetor, setLoteIdRelatorioSetor] = useState<
    number | null
  >(null);
  const [setoresDisponiveis, setSetoresDisponiveis] = useState<string[]>([]);
  const [showLiberarModal, setShowLiberarModal] = useState(false);

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
        fetchAnomalias();
        break;
      case 'desligamentos':
        fetchFuncionarios();
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

  const abrirRelatorioSetor = useCallback(
    async (loteId: number) => {
      try {
        const response = await fetch(
          `/api/rh/funcionarios?empresa_id=${empresaId}`
        );
        if (response.ok) {
          const respData = await response.json();
          const funcionariosList = respData.funcionarios || [];
          const setores = [
            ...new Set(funcionariosList.map((f: any) => f.setor)),
          ].filter(Boolean) as string[];
          setSetoresDisponiveis(setores.sort());
          setLoteIdRelatorioSetor(loteId);
          setShowRelatorioSetor(true);
        }
      } catch (error) {
        console.error('Erro ao buscar setores:', error);
        alert('Erro ao carregar setores disponíveis');
      }
    },
    [empresaId]
  );

  // === LOADING STATE ===
  if (loading || !session || !empresa) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
            if (tab === 'pendencias' && anomalias.length === 0) {
              fetchAnomalias();
            }
          }}
          anomaliasCount={
            anomalias.filter((a) => a.prioridade === 'CRÍTICA').length ||
            anomalias.length
          }
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
                  onClick={() => setShowLiberarModal(true)}
                  className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors font-medium"
                >
                  🚀 Iniciar Novo Ciclo
                </button>
              </div>

              <LotesGrid
                lotes={lotes}
                laudos={laudos}
                downloadingLaudo={downloadingLaudo}
                onLoteClick={(loteId) =>
                  router.push(`/rh/empresa/${empresaId}/lote/${loteId}`)
                }
                onRelatorioSetor={abrirRelatorioSetor}
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

        {activeTab === 'pendencias' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    ⚠️ Pendências de Avaliação
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Funcionários que precisam ser incluídos no próximo lote
                  </p>
                </div>
                <button
                  onClick={fetchAnomalias}
                  disabled={loadingAnomalias}
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover transition-colors text-sm font-medium disabled:bg-gray-400"
                >
                  {loadingAnomalias ? '🔄 Carregando...' : '🔄 Atualizar'}
                </button>
              </div>

              {loadingAnomalias ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">⏳</div>
                  <p className="text-gray-600">Carregando pendências...</p>
                </div>
              ) : anomalias.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✅</div>
                  <h4 className="text-xl font-semibold text-gray-600 mb-2">
                    Nenhuma pendência encontrada
                  </h4>
                  <p className="text-gray-500">
                    Todos os funcionários estão com suas avaliações em dia!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Funcionário
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Setor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Índice
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Última Avaliação
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Prioridade
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Motivo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {anomalias.map((anomalia) => (
                        <tr key={anomalia.cpf} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {anomalia.nome}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {anomalia.cpf}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {anomalia.setor}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 text-xs rounded-full font-medium ${
                                anomalia.indice_avaliacao === 0
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {anomalia.indice_avaliacao === 0
                                ? 'Nunca'
                                : `Índice ${anomalia.indice_avaliacao}`}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {anomalia.data_ultimo_lote
                              ? new Date(
                                  anomalia.data_ultimo_lote
                                ).toLocaleDateString('pt-BR')
                              : '-'}
                            {anomalia.dias_desde_ultima_avaliacao && (
                              <div className="text-xs text-gray-500">
                                {anomalia.dias_desde_ultima_avaliacao} dias
                                atrás
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 text-xs rounded-full font-medium ${
                                anomalia.prioridade === 'CRÍTICA'
                                  ? 'bg-red-100 text-red-800'
                                  : anomalia.prioridade === 'ALTA'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {anomalia.prioridade === 'CRÍTICA'
                                ? '🔴'
                                : anomalia.prioridade === 'ALTA'
                                  ? '🟠'
                                  : '🟡'}{' '}
                              {anomalia.prioridade}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {anomalia.mensagem}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'funcionarios' && (
          <div className="space-y-6">
            <FuncionariosSection
              contexto="clinica"
              empresaId={parseInt(empresaId)}
              empresaNome={empresa.nome}
              onRefresh={fetchFuncionarios}
              defaultStatusFilter="ativos"
            />
          </div>
        )}

        {activeTab === 'desligamentos' && (
          <div className="space-y-6">
            <FuncionariosSection
              contexto="clinica"
              empresaId={parseInt(empresaId)}
              empresaNome={empresa.nome}
              onRefresh={fetchFuncionarios}
              defaultStatusFilter="inativos"
            />
          </div>
        )}
      </main>

      {/* Modais */}
      {showInserirModal && empresa && (
        <ModalInserirFuncionario
          empresaId={parseInt(empresaId)}
          empresaNome={empresa.nome}
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

      {showLiberarModal && empresa && (
        <LiberarLoteModal
          isOpen={showLiberarModal}
          onClose={() => setShowLiberarModal(false)}
          empresaId={parseInt(empresaId)}
          empresaNome={empresa.nome}
          onSuccess={(loteId) => {
            setShowLiberarModal(false);
            fetchLotes();
            router.push(`/rh/empresa/${empresaId}/lote/${loteId}`);
          }}
        />
      )}

      {showRelatorioSetor && loteIdRelatorioSetor && (
        <RelatorioSetor
          loteId={loteIdRelatorioSetor}
          setores={setoresDisponiveis}
          onClose={() => {
            setShowRelatorioSetor(false);
            setLoteIdRelatorioSetor(null);
          }}
        />
      )}

      {cpfDetalhes && (
        <DetalhesFuncionario
          cpf={cpfDetalhes}
          onClose={() => setCpfDetalhes(null)}
        />
      )}
    </div>
  );
}
