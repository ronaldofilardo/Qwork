'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  CheckCircle,
  Clock,
  FileText,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ModalInativarAvaliacao from '@/components/ModalInativarAvaliacao';
import ModalResetarAvaliacao from '@/components/ModalResetarAvaliacao';
import {
  ModalConfirmacaoSolicitar,
  foiExibidaParaLote,
} from '@/components/ModalConfirmacaoSolicitar';
import ModalSetorRelatorioPDF from '@/components/ModalSetorRelatorioPDF';

// Função para normalizar strings (remove acentos e converte para minúsculas)
function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Função para formatar data
function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface LoteInfo {
  id: number;
  // codigo: removido
  titulo: string;
  tipo: string;
  status: string;
  status_pagamento?: string | null;
  criado_em: string;
  liberado_em: string | null;
  emitido_em?: string | null;
  emissao_solicitada?: boolean;
  emissao_solicitado_em?: string | null;
  tem_laudo?: boolean;
  laudo_status?: string | null;
  laudo_id?: number | null;
  hash_pdf?: string | null;
  emissor_cpf?: string | null;
  arquivo_remoto_url?: string | null;
  boleto_asaas_id_pendente?: string | null;
}

interface Estatisticas {
  total_funcionarios: number;
  funcionarios_concluidos: number;
  funcionarios_pendentes: number;
}

interface Funcionario {
  cpf: string;
  nome: string;
  setor: string;
  funcao: string;
  nivel_cargo: string | null;
  avaliacao: {
    id: number;
    status: string;
    data_inicio: string;
    data_conclusao: string | null;
    motivo_inativacao?: string | null;
    inativada_em?: string | null;
    total_respostas?: number;
  };
  grupos?: {
    g1?: number;
    g2?: number;
    g3?: number;
    g4?: number;
    g5?: number;
    g6?: number;
    g7?: number;
    g8?: number;
    g9?: number;
    g10?: number;
  };
}

export default function DetalhesLotePage() {
  const router = useRouter();
  const params = useParams();
  const loteId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [lote, setLote] = useState<LoteInfo | null>(null);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  // Reconciliação de pagamento boleto: executada automaticamente quando
  // o lote está em "aguardando_pagamento" ao carregar a página.
  const [pagamentoSincronizando, setPagamentoSincronizando] = useState(false);
  const [pagamentoSincronizado, setPagamentoSincronizado] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<
    'todos' | 'concluido' | 'pendente'
  >('todos');
  const [busca, setBusca] = useState('');
  const [buscaDebouncedValue, setBuscaDebouncedValue] = useState('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Modal de inativação
  const [modalInativar, setModalInativar] = useState<{
    avaliacaoId: number;
    funcionarioNome: string;
    funcionarioCpf: string;
  } | null>(null);

  // Modal de reset
  const [modalResetar, setModalResetar] = useState<{
    avaliacaoId: number;
    funcionarioNome: string;
    funcionarioCpf: string;
  } | null>(null);

  // Modal de confirmação pós-solicitação de emissão
  const [modalEmissao, setModalEmissao] = useState<{
    loteId: number;
    gestorEmail: string | null;
    gestorCelular: string | null;
  } | null>(null);

  const [showSetorModal, setShowSetorModal] = useState(false);

  // Filtros por coluna
  const [filtrosColuna, setFiltrosColuna] = useState<{
    nome: string[];
    cpf: string[];
    nivel_cargo: string[];
    status: string[];
    g1: string[];
    g2: string[];
    g3: string[];
    g4: string[];
    g5: string[];
    g6: string[];
    g7: string[];
    g8: string[];
    g9: string[];
    g10: string[];
  }>({
    nome: [],
    cpf: [],
    nivel_cargo: [],
    status: [],
    g1: [],
    g2: [],
    g3: [],
    g4: [],
    g5: [],
    g6: [],
    g7: [],
    g8: [],
    g9: [],
    g10: [],
  });

  const loadLoteData = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true);

        if (!loteId) {
          toast.error('ID do lote inválido');
          router.push('/entidade/lotes');
          return;
        }

        // Cache busting: adicionar timestamp à URL para evitar cache
        const timestamp = new Date().getTime();
        const response = await fetch(
          `/api/entidade/lote/${loteId}?_t=${timestamp}`,
          {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.error || 'Erro ao carregar dados do lote');
          router.push('/entidade/lotes');
          return;
        }

        const data = await response.json();
        setLote(data.lote);
        setEstatisticas(data.estatisticas);
        setFuncionarios(data.funcionarios || []);

        if (forceRefresh) {
          toast.success('Dados atualizados!');
        }
      } catch (error) {
        console.error('Erro ao carregar lote:', error);
        toast.error('Erro ao conectar com o servidor');
        router.push('/entidade/lotes');
      } finally {
        setLoading(false);
      }
    },
    [loteId, router]
  );

  // Função para download de laudo com verificação de integridade
  const handleDownloadLaudo = useCallback(async () => {
    if (!lote?.laudo_id) {
      toast.error('ID do laudo não disponível');
      return;
    }

    try {
      // Passo 1: Verificar integridade do hash
      toast.loading('Verificando integridade do laudo...', {
        id: `laudo-verify-${lote.laudo_id}`,
      });

      const verifyResponse = await fetch(
        `/api/entidade/laudos/${lote.laudo_id}/verify-hash`
      );

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Erro ao verificar laudo');
      }

      const verifyData = await verifyResponse.json();

      if (!verifyData.hash_valido) {
        toast.error(
          '⚠️ ATENÇÃO: O hash do laudo não corresponde ao original! O arquivo pode ter sido modificado.',
          { id: `laudo-verify-${lote.laudo_id}`, duration: 8000 }
        );
        console.error('[HASH INVÁLIDO]', {
          laudo_id: lote.laudo_id,
          hash_armazenado: verifyData.hash_armazenado,
          hash_calculado: verifyData.hash_calculado,
        });
        return;
      }

      // Passo 2: Hash válido - confirmar ao usuário
      toast.success(
        '✅ Integridade verificada! O laudo é autêntico e não foi modificado.',
        {
          id: `laudo-verify-${lote.laudo_id}`,
          duration: 3000,
        }
      );

      // Pequeno delay para o usuário ver a mensagem de verificação
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Passo 3: Fazer o download
      toast.loading('Baixando laudo...', {
        id: `laudo-download-${lote.laudo_id}`,
      });

      const response = await fetch(
        `/api/entidade/laudos/${lote.laudo_id}/download`
      );
      if (!response.ok) throw new Error('Erro ao baixar laudo');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laudo_${lote.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Laudo baixado com sucesso!', {
        id: `laudo-download-${lote.laudo_id}`,
      });
    } catch (error: any) {
      console.error('Erro ao baixar laudo:', error);
      toast.error(error.message || 'Erro ao baixar laudo', {
        id: `laudo-verify-${lote.laudo_id}`,
      });
    }
  }, [lote]);

  useEffect(() => {
    loadLoteData();

    // Polling: atualizar dados a cada 30 segundos
    const intervalId = setInterval(() => {
      loadLoteData();
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [loadLoteData]);

  // Auto-reconciliação de pagamento: quando o lote está aguardando pagamento,
  // consulta o Asaas diretamente para verificar se o boleto foi pago fora da
  // janela de polling do CheckoutAsaas (cenário: usuário pagou horas/dias depois).
  useEffect(() => {
    if (!lote || !loteId) return;
    if (lote.status_pagamento !== 'aguardando_pagamento') return;
    if (pagamentoSincronizando || pagamentoSincronizado) return;

    const reconciliar = async () => {
      setPagamentoSincronizando(true);
      try {
        console.log(
          `[LotePage] Iniciando reconciliação automática para Lote #${loteId}`
        );
        const res = await fetch('/api/pagamento/asaas/sincronizar-lote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lote_id: parseInt(loteId, 10) }),
        });
        const data = await res.json();

        if (data.synced) {
          setPagamentoSincronizado(true);
          toast.success('✅ Pagamento confirmado! Atualizando dados...');
          // Recarregar dados do lote para refletir o novo status
          setTimeout(() => loadLoteData(), 1500);
        }
      } catch (err) {
        console.error('[LotePage] Erro na reconciliação automática:', err);
      } finally {
        setPagamentoSincronizando(false);
      }
    };

    reconciliar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lote?.status_pagamento, loteId]);

  // Debounce para busca (300ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setBuscaDebouncedValue(busca);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [busca]);

  // Fechar dropdowns quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[id^="dropdown-"]') && !target.closest('button')) {
        document.querySelectorAll('[id^="dropdown-"]').forEach((dropdown) => {
          dropdown.classList.add('hidden');
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Função para classificar grupos (reutilizada do RH)
  const _renderClassificacao = useCallback(
    (media: number | undefined, numeroGrupo: number) => {
      if (media === undefined) return <span className="text-gray-400">-</span>;

      const gruposPositivos = [2, 3, 5, 6];
      const isPositivo = gruposPositivos.includes(numeroGrupo);

      let colorClass = '';
      let label = '';

      if (isPositivo) {
        // Grupos positivos: maior é melhor
        if (media > 66) {
          label = 'Excelente';
          colorClass = 'bg-green-100 text-green-800';
        } else if (media >= 33) {
          label = 'Monitorar';
          colorClass = 'bg-yellow-100 text-yellow-800';
        } else {
          label = 'Atenção';
          colorClass = 'bg-red-100 text-red-800';
        }
      } else {
        // Grupos negativos: menor é melhor
        if (media < 33) {
          label = 'Excelente';
          colorClass = 'bg-green-100 text-green-800';
        } else if (media <= 66) {
          label = 'Monitorar';
          colorClass = 'bg-yellow-100 text-yellow-800';
        } else {
          label = 'Atenção';
          colorClass = 'bg-red-100 text-red-800';
        }
      }

      return (
        <span
          className={`px-1 py-0.5 text-[11px] rounded-full font-medium whitespace-nowrap ${colorClass}`}
        >
          {label}
        </span>
      );
    },
    []
  );

  // Função auxiliar para obter apenas o label da classificação (para filtros)
  const getClassificacaoLabel = useCallback(
    (media: number | undefined, numeroGrupo: number): string => {
      if (media === undefined) return '';

      const gruposPositivos = [2, 3, 5, 6];
      const isPositivo = gruposPositivos.includes(numeroGrupo);

      if (isPositivo) {
        if (media > 66) return 'Excelente';
        if (media >= 33) return 'Monitorar';
        return 'Atenção';
      } else {
        if (media < 33) return 'Excelente';
        if (media <= 66) return 'Monitorar';
        return 'Atenção';
      }
    },
    []
  );

  // Obter valores únicos para filtros por coluna
  const getValoresUnicos = useCallback(
    (coluna: keyof typeof filtrosColuna) => {
      // Para colunas de grupos, retornar as opções fixas
      if (coluna.startsWith('g')) {
        return ['Excelente', 'Monitorar', 'Atenção'];
      }

      const valores = funcionarios
        .map((func) => {
          switch (coluna) {
            case 'nome':
              return func.nome;
            case 'cpf':
              return func.cpf;
            case 'nivel_cargo':
              return func.nivel_cargo === 'operacional'
                ? 'Operacional'
                : func.nivel_cargo === 'gestao'
                  ? 'Gestão'
                  : '';
            case 'status':
              return func.avaliacao.status;
            default:
              return '';
          }
        })
        .filter((valor, index, arr) => valor && arr.indexOf(valor) === index);
      return valores.sort();
    },
    [funcionarios]
  );

  // Toggle filtro por coluna
  const toggleFiltroColuna = useCallback(
    (coluna: keyof typeof filtrosColuna, valor: string) => {
      setFiltrosColuna((prev) => {
        const newState = {
          ...prev,
          [coluna]: prev[coluna].includes(valor)
            ? prev[coluna].filter((v) => v !== valor)
            : [...prev[coluna], valor],
        };
        return newState;
      });
    },
    []
  );

  // Limpar todos os filtros por coluna
  const limparFiltrosColuna = useCallback(() => {
    setFiltrosColuna({
      nome: [],
      cpf: [],
      nivel_cargo: [],
      status: [],
      g1: [],
      g2: [],
      g3: [],
      g4: [],
      g5: [],
      g6: [],
      g7: [],
      g8: [],
      g9: [],
      g10: [],
    });
  }, []);

  const funcionariosFiltrados = useMemo(() => {
    return funcionarios.filter((func) => {
      // Filtro de status
      if (
        filtroStatus === 'concluido' &&
        func.avaliacao.status !== 'concluida' &&
        func.avaliacao.status !== 'concluido'
      ) {
        return false;
      }
      if (
        filtroStatus === 'pendente' &&
        (func.avaliacao.status === 'concluida' ||
          func.avaliacao.status === 'concluido')
      ) {
        return false;
      }

      // Filtro de busca com debounce
      if (buscaDebouncedValue.trim()) {
        const termo = normalizeString(buscaDebouncedValue);
        const nomeNormalizado = normalizeString(func.nome);
        const setorNormalizado = normalizeString(func.setor);
        const funcaoNormalizada = normalizeString(func.funcao);

        if (
          !nomeNormalizado.includes(termo) &&
          !func.cpf.includes(termo) &&
          !setorNormalizado.includes(termo) &&
          !funcaoNormalizada.includes(termo)
        ) {
          return false;
        }
      }

      // Filtros por coluna
      if (
        filtrosColuna.nome.length > 0 &&
        !filtrosColuna.nome.includes(func.nome)
      ) {
        return false;
      }
      if (
        filtrosColuna.cpf.length > 0 &&
        !filtrosColuna.cpf.includes(func.cpf)
      ) {
        return false;
      }

      if (filtrosColuna.nivel_cargo.length > 0) {
        const nivelDisplay =
          func.nivel_cargo === 'operacional'
            ? 'Operacional'
            : func.nivel_cargo === 'gestao'
              ? 'Gestão'
              : '';
        if (!filtrosColuna.nivel_cargo.includes(nivelDisplay)) {
          return false;
        }
      }

      if (
        filtrosColuna.status.length > 0 &&
        !filtrosColuna.status.includes(func.avaliacao.status)
      ) {
        return false;
      }

      // Filtros por grupos G1-G10
      for (let i = 1; i <= 10; i++) {
        const grupoKey = `g${i}` as keyof typeof filtrosColuna;
        if (filtrosColuna[grupoKey].length > 0) {
          const media = func.grupos?.[grupoKey as keyof typeof func.grupos];
          const classificacao = getClassificacaoLabel(media, i);
          if (!filtrosColuna[grupoKey].includes(classificacao)) {
            return false;
          }
        }
      }

      return true;
    });
  }, [
    funcionarios,
    filtroStatus,
    buscaDebouncedValue,
    filtrosColuna,
    getClassificacaoLabel,
  ]);

  const setores = useMemo(() => {
    return [
      ...new Set(
        funcionarios
          .filter(
            (f) =>
              f.avaliacao.status === 'concluida' ||
              f.avaliacao.status === 'concluido'
          )
          .map((f) => f.setor)
          .filter(Boolean)
      ),
    ].sort() as string[];
  }, [funcionarios]);

  // Componente de filtro por coluna
  const FiltroColuna = ({
    coluna,
    titulo,
  }: {
    coluna: keyof typeof filtrosColuna;
    titulo: string;
  }) => {
    const valores = getValoresUnicos(coluna);
    const hasFiltros = filtrosColuna[coluna].length > 0;
    const isGrupoColumn = coluna.startsWith('g');

    return (
      <div className="relative inline-block">
        <button
          className={`text-xs px-1 py-0.5 rounded ${
            hasFiltros
              ? 'bg-blue-600 text-white font-bold'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            const dropdown = document.getElementById(`dropdown-${coluna}`);
            if (dropdown) {
              dropdown.classList.toggle('hidden');
            }
          }}
          title={
            isGrupoColumn
              ? hasFiltros
                ? `${filtrosColuna[coluna].length} filtro(s) ativo(s)`
                : 'Filtrar'
              : ''
          }
        >
          {isGrupoColumn ? (
            hasFiltros ? (
              <span className="font-bold">{filtrosColuna[coluna].length}</span>
            ) : (
              <span>▼</span>
            )
          ) : (
            <>
              <span>🔽</span>
              {titulo && <span>{titulo}</span>}
              {hasFiltros && (
                <span
                  className={`${
                    titulo ? 'ml-1' : ''
                  } bg-blue-600 text-white rounded-full px-1 text-xs`}
                >
                  {filtrosColuna[coluna].length}
                </span>
              )}
            </>
          )}
        </button>

        <div
          id={`dropdown-${coluna}`}
          className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-300 rounded shadow-lg z-10 hidden max-h-60 overflow-y-auto"
        >
          <div className="p-2">
            {hasFiltros && (
              <div className="flex items-center justify-end mb-2 pb-2 border-b">
                <button
                  onClick={() => {
                    setFiltrosColuna((prev) => ({ ...prev, [coluna]: [] }));
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  ✕ Limpar
                </button>
              </div>
            )}
            {valores.length === 0 ? (
              <div className="text-sm text-gray-500 py-2">
                Nenhum valor disponível
              </div>
            ) : (
              valores.map((valor) => {
                const isChecked = filtrosColuna[coluna].includes(valor);
                return (
                  <label
                    key={valor}
                    className="flex items-center gap-2 py-1 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleFiltroColuna(coluna, valor)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span
                      className="text-sm text-gray-700 truncate"
                      title={valor}
                    >
                      {valor || '(vazio)'}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  const gerarRelatorioFuncionario = async (cpf: string, nome: string) => {
    if (!confirm(`Gerar relatório PDF de ${nome}?`)) return;

    toast.loading('Gerando relatório...', { id: 'rel-individual' });
    try {
      const response = await fetch(
        `/api/entidade/relatorio-individual-pdf?lote_id=${loteId}&cpf=${cpf}`
      );

      if (!response.ok) {
        throw new Error('Erro ao gerar relatório');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${nome.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Relatório gerado com sucesso!', { id: 'rel-individual' });
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar relatório', { id: 'rel-individual' });
    }
  };

  const abrirModalInativar = (
    avaliacaoId: number,
    nome: string,
    cpf: string
  ) => {
    setModalInativar({
      avaliacaoId,
      funcionarioNome: nome,
      funcionarioCpf: cpf,
    });
  };

  const handleDownloadReport = async () => {
    toast.loading('Gerando relatório...', { id: 'report' });
    try {
      const response = await fetch(
        `/api/entidade/relatorio-lote-pdf?lote_id=${loteId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao gerar relatório');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-lote-${loteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Relatório gerado com sucesso!', { id: 'report' });
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar relatório', { id: 'report' });
    }
  };

  // CSV data download removed (permanent removal of CSV functionality)
  // Function intentionally disabled.

  const gerarRelatorioSetor = async (setor: string) => {
    toast.loading(`Gerando relatório do setor ${setor}...`, {
      id: 'rel-setor',
    });
    try {
      const response = await fetch(
        `/api/entidade/relatorio-setor-pdf?lote_id=${loteId}&setor=${encodeURIComponent(setor)}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao gerar relatório');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-setor-${setor.replace(/\s+/g, '-')}-lote${loteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Relatório gerado com sucesso!', { id: 'rel-setor' });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar relatório', {
        id: 'rel-setor',
      });
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando detalhes do lote...</p>
        </div>
      </div>
    );
  }

  if (!lote || !estatisticas) {
    return (
      <div className="flex items-center justify-center py-20 bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Lote não encontrado</p>
          <button
            onClick={() => router.push('/entidade/lotes')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
          >
            Voltar para Lotes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-screen-2xl mx-auto px-4 py-6">
          <button
            onClick={() => router.push('/entidade/lotes')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Voltar para Lotes
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-800">
                  Lote ID: {lote.id}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    lote.status === 'concluido'
                      ? 'bg-green-100 text-green-800'
                      : lote.status === 'enviado'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {lote.status}
                </span>
              </div>
              <p className="text-gray-600">Código: {lote.id}</p>
              <p className="text-sm text-gray-500 mt-1">
                Tipo: {lote.tipo} | Criado em: {formatDate(lote.criado_em)}
              </p>
              {/* Banner de pagamento pendente com verificação automática */}
              {lote.status_pagamento === 'aguardando_pagamento' && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  {pagamentoSincronizando ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <span>Verificando pagamento...</span>
                    </>
                  ) : pagamentoSincronizado ? (
                    <>
                      <span className="text-green-600 font-semibold">
                        ✅ Pagamento confirmado!
                      </span>
                    </>
                  ) : (
                    <>
                      <span>💳 Aguardando confirmação de pagamento</span>
                      <button
                        onClick={async () => {
                          setPagamentoSincronizando(true);
                          try {
                            const res = await fetch(
                              '/api/pagamento/asaas/sincronizar-lote',
                              {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  lote_id: parseInt(loteId, 10),
                                }),
                              }
                            );
                            const data = await res.json();
                            if (data.synced) {
                              setPagamentoSincronizado(true);
                              toast.success('✅ Pagamento confirmado!');
                              setTimeout(() => loadLoteData(), 1500);
                            } else {
                              toast(
                                'Pagamento ainda não confirmado no gateway.',
                                { icon: 'ℹ️' }
                              );
                            }
                          } catch {
                            toast.error('Erro ao verificar pagamento');
                          } finally {
                            setPagamentoSincronizando(false);
                          }
                        }}
                        className="ml-2 underline text-amber-700 hover:text-amber-900 text-xs font-medium"
                      >
                        Verificar agora
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => loadLoteData(true)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Atualizar dados"
              >
                <svg
                  className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Atualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-2xl mx-auto px-4 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-blue-500" size={32} />
              <span className="text-3xl font-bold text-gray-900">
                {estatisticas.total_funcionarios}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-medium">
              Total de Funcionários
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-green-500" size={32} />
              <span className="text-3xl font-bold text-gray-900">
                {estatisticas.funcionarios_concluidos}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-medium">
              Avaliações Concluídas
            </p>
            {estatisticas.total_funcionarios > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(
                  (estatisticas.funcionarios_concluidos /
                    estatisticas.total_funcionarios) *
                    100
                )}
                % de conclusão
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-orange-500" size={32} />
              <span className="text-3xl font-bold text-gray-900">
                {estatisticas.funcionarios_pendentes}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-medium">
              Avaliações Pendentes
            </p>
          </div>
        </div>

        {/* Ações do Lote */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Ações do Lote
              </h3>
              <p className="text-sm text-gray-600">
                Gerar relatórios e exportar dados
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
              >
                <FileText size={18} />
                Gerar Relatório PDF
              </button>
              <button
                onClick={() => setShowSetorModal(true)}
                disabled={
                  !['emitido', 'enviado'].includes(lote.laudo_status ?? '') ||
                  setores.length === 0
                }
                title={
                  !['emitido', 'enviado'].includes(lote.laudo_status ?? '')
                    ? 'Aguardando emissão do laudo'
                    : setores.length === 0
                      ? 'Nenhum setor disponível neste ciclo'
                      : 'Gerar relatório por setor'
                }
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <FileText size={18} />
                Gerar Relatório por Setor
              </button>
            </div>
          </div>

          {/* Botão de Solicitação de Emissão - só aparece quando lote está concluído (status='concluido'), sem laudo e sem solicitação */}
          {lote &&
            lote.status === 'concluido' &&
            estatisticas &&
            estatisticas.funcionarios_concluidos +
              estatisticas.funcionarios_pendentes >
              0 &&
            estatisticas.funcionarios_pendentes === 0 &&
            !lote.emissao_solicitada &&
            !lote.tem_laudo && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">✅</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Lote Concluído
                      </h4>
                      <p className="text-sm text-gray-700">
                        Todas as avaliações foram finalizadas. Você pode
                        solicitar a emissão do laudo.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const confirmado = confirm(
                        `Confirma a solicitação de emissão do laudo para o lote ${lote.id}?\n\nO laudo será gerado e enviado para o emissor responsável.`
                      );
                      if (!confirmado) return;

                      try {
                        const response = await fetch(
                          `/api/lotes/${lote.id}/solicitar-emissao`,
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                          }
                        );
                        const data = await response.json();
                        if (!response.ok)
                          throw new Error(
                            data.error || 'Erro ao solicitar emissão'
                          );
                        toast.success('Emissão solicitada com sucesso!');

                        // Exibir modal de confirmação (apenas uma vez por lote por sessão)
                        if (!foiExibidaParaLote(lote.id)) {
                          const contato = data.gestor_contato as
                            | { email: string | null; celular: string | null }
                            | undefined;
                          setModalEmissao({
                            loteId: lote.id,
                            gestorEmail: contato?.email ?? null,
                            gestorCelular: contato?.celular ?? null,
                          });
                        } else {
                          setTimeout(() => window.location.reload(), 1500);
                        }
                      } catch (error: any) {
                        toast.error(
                          error.message || 'Erro ao solicitar emissão'
                        );
                      }
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold text-base flex items-center justify-center gap-2 shadow-md"
                  >
                    <span className="text-xl">🚀</span>
                    <span>Solicitar Emissão do Laudo</span>
                  </button>
                </div>
              </div>
            )}

          {/* Mensagem quando emissão já foi solicitada */}
          {lote && lote.emissao_solicitada && !lote.tem_laudo && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Emissão Solicitada
                    </h4>
                    <p className="text-sm text-gray-700">
                      A emissão do laudo foi solicitada em{' '}
                      {lote.emissao_solicitado_em
                        ? formatDate(lote.emissao_solicitado_em)
                        : 'data não disponível'}
                      . O laudo está sendo processado pelo emissor.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mensagem quando laudo já foi emitido */}
          {lote && lote.tem_laudo && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 border-2 border-purple-300 rounded-lg">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Laudo Emitido
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      O laudo deste lote já foi emitido{' '}
                      {lote.laudo_status === 'enviado' ? 'e enviado' : ''}.
                      {lote.emitido_em &&
                        ` Emitido em ${formatDate(lote.emitido_em)}`}
                    </p>
                    {lote.emissor_cpf && (
                      <p className="text-xs text-purple-700">
                        Emissor: {lote.emissor_cpf}
                      </p>
                    )}
                  </div>
                </div>

                {/* Botão Download Laudo - apenas se arquivo está no bucket */}
                {lote.arquivo_remoto_url && (
                  <button
                    onClick={handleDownloadLaudo}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors mb-3 font-medium"
                  >
                    📄 Ver Laudo / Baixar PDF
                  </button>
                )}

                {/* Hash de Integridade - apenas se arquivo está no bucket */}
                {lote.hash_pdf && lote.arquivo_remoto_url && (
                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-purple-800 uppercase">
                        🔒 Hash de Integridade (SHA-256)
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard
                            .writeText(lote.hash_pdf!)
                            .then(() => toast.success('Hash copiado!'))
                            .catch(() => toast.error('Erro ao copiar hash'));
                        }}
                        className="inline-flex items-center gap-1 bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
                      >
                        📋 Copiar
                      </button>
                    </div>
                    <code className="text-[10px] font-mono text-gray-700 break-all block">
                      {lote.hash_pdf}
                    </code>
                    <p className="text-xs text-purple-600 mt-2">
                      Use este hash para verificar a autenticidade e integridade
                      do PDF
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Funcionário
              </label>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome, CPF, setor ou função... (ignora acentos)"
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {busca !== buscaDebouncedValue && (
                <div className="absolute right-3 top-10 transform">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline mr-1" size={16} />
                Filtrar por Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) =>
                  setFiltroStatus(
                    e.target.value as 'todos' | 'concluido' | 'pendente'
                  )
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="todos">Todos</option>
                <option value="concluido">Concluídas</option>
                <option value="pendente">Pendentes</option>
              </select>
            </div>

            <div className="self-end">
              <button
                onClick={limparFiltrosColuna}
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                title="Limpar todos os filtros por coluna"
              >
                🧹 Limpar Filtros
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Exibindo {funcionariosFiltrados.length} de {funcionarios.length}{' '}
            funcionários
            {busca !== buscaDebouncedValue && (
              <span className="ml-2 text-gray-500 italic">• Buscando...</span>
            )}
            {Object.values(filtrosColuna).some((arr) => arr.length > 0) && (
              <span className="ml-2 text-blue-600">
                • Filtros ativos:{' '}
                {Object.values(filtrosColuna).reduce(
                  (acc, arr) => acc + arr.length,
                  0
                )}{' '}
                aplicado(s)
              </span>
            )}
          </div>
        </div>

        {/* Tabela de Funcionários */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-16">
                    ID
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <span>Nome</span>
                      <FiltroColuna coluna="nome" titulo="Nome" />
                    </div>
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <span>CPF</span>
                      <FiltroColuna coluna="cpf" titulo="CPF" />
                    </div>
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <span>Nível</span>
                      <FiltroColuna coluna="nivel_cargo" titulo="Nível" />
                    </div>
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <FiltroColuna coluna="status" titulo="Status" />
                    </div>
                  </th>
                  <th className="px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-28">
                    <div className="flex items-center justify-center">
                      <span>Inativar</span>
                    </div>
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Data Conclusão
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Motivo Inativação
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Data Inativação
                  </th>
                  <th className="px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {funcionariosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={20}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      {busca ||
                      filtroStatus !== 'todos' ||
                      Object.values(filtrosColuna).some((arr) => arr.length > 0)
                        ? 'Nenhum funcionário encontrado com os filtros aplicados'
                        : 'Nenhum funcionário neste lote'}
                    </td>
                  </tr>
                ) : (
                  funcionariosFiltrados.map((func, idx) => (
                    <tr
                      key={`${func.cpf}-${func.avaliacao.id ?? idx}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-2 py-1 text-sm text-gray-600 font-mono">
                        #{func.avaliacao.id}
                      </td>
                      <td
                        className="px-2 py-1 text-sm text-gray-900 max-w-[240px] truncate"
                        title={func.nome}
                      >
                        {func.nome}
                      </td>
                      <td className="px-2 py-1 text-sm text-gray-500">
                        {func.cpf}
                      </td>
                      <td className="px-2 py-1 text-sm text-gray-500">
                        {func.nivel_cargo === 'operacional'
                          ? 'Operacional'
                          : func.nivel_cargo === 'gestao'
                            ? 'Gestão'
                            : '-'}
                      </td>
                      <td className="px-2 py-1 text-sm">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`inline-flex px-1 py-0.5 text-[11px] font-semibold rounded-full ${
                              func.avaliacao.status === 'concluida' ||
                              func.avaliacao.status === 'concluido'
                                ? 'bg-green-100 text-green-800'
                                : func.avaliacao.status === 'em_andamento'
                                  ? 'bg-blue-100 text-blue-800'
                                  : func.avaliacao.status === 'inativada'
                                    ? 'bg-red-100 text-red-800'
                                    : func.avaliacao.status === 'iniciada'
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {func.avaliacao.status === 'concluida' ||
                            func.avaliacao.status === 'concluido'
                              ? 'Concluída'
                              : func.avaliacao.status === 'em_andamento'
                                ? 'Em Andamento'
                                : func.avaliacao.status === 'inativada'
                                  ? 'Inativada'
                                  : func.avaliacao.status === 'iniciada'
                                    ? 'Iniciada'
                                    : 'Pendente'}
                          </span>
                          {func.avaliacao.status !== 'concluida' &&
                            func.avaliacao.status !== 'concluido' &&
                            func.avaliacao.status !== 'inativada' &&
                            func.avaliacao.total_respostas !== undefined && (
                              <span className="text-[10px] text-gray-600">
                                {func.avaliacao.total_respostas}/37 respostas
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-2 py-1 text-sm text-center">
                        <div className="flex gap-1 justify-center">
                          {func.avaliacao.status !== 'concluida' &&
                            func.avaliacao.status !== 'concluido' &&
                            func.avaliacao.status !== 'inativada' &&
                            !lote?.emissao_solicitada &&
                            !lote?.emitido_em && (
                              <button
                                onClick={() =>
                                  abrirModalInativar(
                                    func.avaliacao.id,
                                    func.nome,
                                    func.cpf
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                                title="Inativar avaliação"
                              >
                                🚫 Inativar
                              </button>
                            )}
                          {/* Show Reset for any evaluation that is NOT inativada — backend will enforce single-reset and lote constraints */}
                          {func.avaliacao.status !== 'inativada' &&
                            func.avaliacao.status !== 'concluida' &&
                            func.avaliacao.status !== 'concluido' &&
                            !lote?.emissao_solicitada &&
                            !lote?.emitido_em && (
                              <button
                                onClick={() =>
                                  setModalResetar({
                                    avaliacaoId: func.avaliacao.id,
                                    funcionarioNome: func.nome,
                                    funcionarioCpf: func.cpf,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-600 text-white rounded text-xs hover:bg-amber-700 transition-colors"
                                title="Resetar avaliação (apagar todas as respostas)"
                              >
                                ↻ Reset
                              </button>
                            )}
                        </div>
                      </td>
                      <td className="px-2 py-1 text-sm text-gray-500">
                        {formatDate(func.avaliacao.data_conclusao)}
                      </td>
                      <td
                        className="px-2 py-1 text-sm text-gray-500 max-w-[200px] truncate"
                        title={func.avaliacao.motivo_inativacao || ''}
                      >
                        {func.avaliacao.motivo_inativacao || '-'}
                      </td>
                      <td className="px-2 py-1 text-sm text-gray-500">
                        {formatDate(func.avaliacao.inativada_em)}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {(func.avaliacao.status === 'concluida' ||
                          func.avaliacao.status === 'concluido') && (
                          <button
                            onClick={() =>
                              gerarRelatorioFuncionario(func.cpf, func.nome)
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                            title="Gerar PDF"
                          >
                            <FileText size={14} />
                            PDF
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Inativação */}
      {modalInativar && (
        <ModalInativarAvaliacao
          avaliacaoId={modalInativar.avaliacaoId}
          funcionarioNome={modalInativar.funcionarioNome}
          funcionarioCpf={modalInativar.funcionarioCpf}
          _loteId={loteId}
          contexto="entidade"
          onClose={() => setModalInativar(null)}
          onSuccess={loadLoteData}
        />
      )}

      {/* Modal de Reset */}
      {modalResetar && (
        <ModalResetarAvaliacao
          avaliacaoId={modalResetar.avaliacaoId}
          loteId={loteId}
          funcionarioNome={modalResetar.funcionarioNome}
          funcionarioCpf={modalResetar.funcionarioCpf}
          basePath="/api/entidade"
          onClose={() => setModalResetar(null)}
          onSuccess={loadLoteData}
        />
      )}

      {/* Modal de Confirmação de Solicitação de Emissão */}
      {modalEmissao && (
        <ModalConfirmacaoSolicitar
          isOpen={true}
          onClose={() => {
            setModalEmissao(null);
            window.location.reload();
          }}
          loteId={modalEmissao.loteId}
          gestorEmail={modalEmissao.gestorEmail}
          gestorCelular={modalEmissao.gestorCelular}
        />
      )}

      <ModalSetorRelatorioPDF
        isOpen={showSetorModal}
        setores={setores}
        onClose={() => setShowSetorModal(false)}
        onConfirm={gerarRelatorioSetor}
      />
    </div>
  );
}
