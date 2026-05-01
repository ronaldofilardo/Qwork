'use client';

import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useRouter, useParams } from 'next/navigation';
import ModalInativarAvaliacao from '@/components/ModalInativarAvaliacao';
import ModalResetarAvaliacao from '@/components/ModalResetarAvaliacao';
import toast from 'react-hot-toast';
import {
  ModalConfirmacaoSolicitar,
  foiExibidaParaLote,
} from '@/components/ModalConfirmacaoSolicitar';
import ModalSetorRelatorioPDF from '@/components/ModalSetorRelatorioPDF';
import { ArrowLeft, AlertTriangle, SendHorizontal, ClipboardList, Download, Lock, Copy, CheckCircle2 } from 'lucide-react';

// Função para normalizar strings (remove acentos e converte para minúsculas)
function normalizeString(str: string): string {
  return str
    .normalize('NFD') // Decompor caracteres Unicode
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos
    .toLowerCase()
    .trim();
}

// Função para formatar data
function formatDate(dateString: string): string {
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
  descricao: string | null;
  tipo: string;
  status: string;
  liberado_em: string;
  liberado_por_nome: string | null;
  empresa_nome: string;
  status_pagamento?: string | null;
  emitido_em?: string | null;
  laudo_id?: number | null;
  laudo_status?: string | null;
  laudo_emitido_em?: string | null;
  laudo_enviado_em?: string | null;
  emissao_solicitada?: boolean;
  emissao_solicitado_em?: string | null;
  tem_laudo?: boolean;
  emissor_nome?: string;
  hash_pdf?: string;
  arquivo_remoto_url?: string | null;
}

interface Estatisticas {
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
  avaliacoes_inativadas: number;
  avaliacoes_pendentes: number;
}

interface Funcionario {
  cpf: string;
  nome: string;
  setor: string;
  funcao: string;
  matricula: string | null;
  nivel_cargo: 'operacional' | 'gestao' | null;
  turno: string | null;
  escala: string | null;
  avaliacao: {
    id: number;
    status: string;
    data_inicio: string;
    data_conclusao: string | null;
    data_inativacao: string | null;
    motivo_inativacao: string | null;
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
  const empresaId = params.id as string;
  const loteId = params.loteId as string;

  const [loading, setLoading] = useState(true);
  const [lote, setLote] = useState<LoteInfo | null>(null);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [busca, setBusca] = useState('');
  const [buscaDebouncedValue, setBuscaDebouncedValue] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<
    'todos' | 'concluido' | 'pendente'
  >('todos');
  // Mensagem amigável enviada pelo backend em caso de permissão negada (ex.: mismatch de clínica)
  const [permissionErrorHint, setPermissionErrorHint] = useState<string | null>(
    null
  );
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
    tomadorInfo: {
      nome: string;
      cnpj: string;
      email: string;
      telefone: string;
      endereco: string;
      cidade: string;
      estado: string;
      responsavel_nome: string;
      responsavel_cpf: string;
      responsavel_email: string;
    } | null;
  } | null>(null);

  const [showSetorModal, setShowSetorModal] = useState(false);

  // Filtros por coluna
  const [filtrosColuna, setFiltrosColuna] = useState<Record<string, string[]>>({
    nome: [],
    cpf: [],
    nivel_cargo: [],
    status: [],
  });

  const loadLoteData = useCallback(async () => {
    try {
      setLoading(true);

      // Validar parâmetros
      if (!empresaId || !loteId) {
        alert('Parâmetros inválidos');
        router.push('/rh');
        return;
      }

      const response = await fetch(
        `/api/rh/lotes/${loteId}/funcionarios?empresa_id=${empresaId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        // Caso de mismatch de clínica - exibimos a hint amigável na UI sem redirecionar automaticamente
        if (
          response.status === 403 &&
          errorData?.error_code === 'permission_clinic_mismatch'
        ) {
          setPermissionErrorHint(
            errorData.hint || 'Acesso negado. Verifique sua clínica.'
          );
          setLoading(false);
          return;
        }

        alert(`Erro: ${errorData.error || 'Erro ao carregar dados'}`);
        router.push(`/rh/empresa/${empresaId}`);
        return;
      }

      const data = await response.json();

      if (!data.success) {
        alert(`Erro: ${data.error || 'Resposta inválida do servidor'}`);
        router.push(`/rh/empresa/${empresaId}`);
        return;
      }

      setLote(data.lote);
      setEstatisticas(data.estatisticas);
      setFuncionarios(data.funcionarios || []);
    } catch (error) {
      console.error('Erro ao carregar dados do lote:', error);
      alert('Erro ao carregar dados do lote. Por favor, tente novamente.');
      router.push(`/rh/empresa/${empresaId}`);
    } finally {
      setLoading(false);
    }
  }, [empresaId, loteId, router]);

  useEffect(() => {
    const checkSessionAndLoad = async () => {
      try {
        // Verificar sessão
        const sessionRes = await fetch('/api/auth/session');
        if (!sessionRes.ok) {
          router.push('/login');
          return;
        }

        const sessionData = await sessionRes.json();
        if (sessionData.perfil !== 'rh' && sessionData.perfil !== 'admin') {
          alert('Acesso negado. Apenas usuários RH podem acessar esta página.');
          router.push('/dashboard');
          return;
        }

        // Carregar dados do lote e funcionários
        await loadLoteData();
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        router.push('/login');
      }
    };
    checkSessionAndLoad();
  }, [loadLoteData, router]);

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

  const gerarRelatorioLote = async () => {
    if (!lote) return;

    if (!confirm(`Gerar relatório PDF do lote ${lote.id}?`)) return;

    try {
      // Nova API usando Puppeteer (server-side)
      const response = await fetch(
        `/api/rh/relatorio-lote-pdf?lote_id=${loteId}`
      );

      if (!response.ok) {
        const error = await response.json();
        alert(
          'Erro ao gerar relatório: ' + (error.error || 'Erro desconhecido')
        );
        return;
      }

      // Download do PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-lote-${lote.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert(
        'Erro ao gerar relatório: ' +
          (error instanceof Error ? error.message : 'Erro desconhecido')
      );
    }
  };

  const gerarRelatorioSetor = async (setor: string) => {
    try {
      const response = await fetch(
        `/api/rh/relatorio-setor-pdf?lote_id=${loteId}&empresa_id=${empresaId}&setor=${encodeURIComponent(setor)}`
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
    } catch (error) {
      console.error('Erro ao gerar relatório de setor:', error);
      throw error;
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

  const formatarData = useCallback((data: string | null) => {
    if (!data) return '-';
    try {
      const date = new Date(data);
      if (isNaN(date.getTime())) return '-';
      return (
        date.toLocaleDateString('pt-BR') +
        ' às ' +
        date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      return '-';
    }
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    const statusMap: { [key: string]: { label: string; color: string } } = {
      concluida: { label: 'Concluída', color: 'bg-green-100 text-green-800' },
      concluido: { label: 'Concluída', color: 'bg-green-100 text-green-800' }, // Legado - mesmo que concluida
      em_andamento: {
        label: 'Em andamento',
        color: 'bg-yellow-100 text-yellow-800',
      },
      iniciada: { label: 'Iniciada', color: 'bg-blue-100 text-blue-800' },
      inativada: { label: 'Inativada', color: 'bg-red-100 text-red-800' },
    };

    const statusInfo = statusMap[status] || {
      label: status,
      color: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`px-2 py-1 text-xs rounded-full font-medium ${statusInfo.color}`}
      >
        {statusInfo.label}
      </span>
    );
  }, []);

  // Função para classificar risco dos grupos
  const _getClassificacaoGrupo = useCallback(
    (media: number | undefined, numeroGrupo: number) => {
      if (media === undefined) return null;

      // Grupos positivos: 2, 3, 5, 6 (maior é melhor)
      // Grupos negativos: 1, 4, 7, 8, 9, 10 (menor é melhor)
      const gruposPositivos = [2, 3, 5, 6];
      const isPositivo = gruposPositivos.includes(numeroGrupo);

      let _categoria: string;
      let label: string;
      let colorClass: string;

      if (isPositivo) {
        // Grupos positivos: maior é melhor
        if (media > 66) {
          _categoria = 'baixo';
          label = 'Excelente';
          colorClass = 'bg-green-100 text-green-800';
        } else if (media >= 33) {
          _categoria = 'medio';
          label = 'Monitorar';
          colorClass = 'bg-yellow-100 text-yellow-800';
        } else {
          _categoria = 'alto';
          label = 'Atenção';
          colorClass = 'bg-red-100 text-red-800';
        }
      } else {
        // Grupos negativos: menor é melhor
        if (media < 33) {
          _categoria = 'baixo';
          label = 'Excelente';
          colorClass = 'bg-green-100 text-green-800';
        } else if (media <= 66) {
          _categoria = 'medio';
          label = 'Monitorar';
          colorClass = 'bg-yellow-100 text-yellow-800';
        } else {
          _categoria = 'alto';
          label = 'Atenção';
          colorClass = 'bg-red-100 text-red-800';
        }
      }

      return (
        <span
          className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${colorClass}`}
        >
          {label}
        </span>
      );
    },
    []
  );

  // Obter valores únicos para filtros por coluna
  const getValoresUnicos = useCallback(
    (coluna: keyof typeof filtrosColuna) => {
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

  // Filtrar funcionários com useMemo para performance
  const funcionariosFiltrados = useMemo(() => {
    const filtered = funcionarios.filter((func) => {
      // Filtro de busca geral com normalização Unicode (ignora acentos)
      const matchBusca =
        buscaDebouncedValue === '' ||
        (() => {
          const buscaNorm = normalizeString(buscaDebouncedValue);
          return (
            normalizeString(func.nome || '').includes(buscaNorm) ||
            normalizeString(func.cpf || '').includes(buscaNorm) ||
            normalizeString(func.setor || '').includes(buscaNorm) ||
            normalizeString(func.funcao || '').includes(buscaNorm) ||
            (func.matricula &&
              normalizeString(func.matricula).includes(buscaNorm))
          );
        })();

      // Filtro de status geral
      const matchStatus =
        filtroStatus === 'todos' ||
        (filtroStatus === 'concluido' &&
          (func.avaliacao.status === 'concluida' ||
            func.avaliacao.status === 'concluido')) ||
        (filtroStatus === 'pendente' &&
          func.avaliacao.status !== 'concluida' &&
          func.avaliacao.status !== 'concluido' &&
          func.avaliacao.status !== 'inativada');

      // Filtros por coluna
      const matchNome =
        filtrosColuna.nome.length === 0 ||
        filtrosColuna.nome.includes(func.nome);
      const matchCpf =
        filtrosColuna.cpf.length === 0 || filtrosColuna.cpf.includes(func.cpf);

      // Correção: converter o nível do funcionário para o formato usado no filtro
      const nivelDisplay =
        func.nivel_cargo === 'operacional'
          ? 'Operacional'
          : func.nivel_cargo === 'gestao'
            ? 'Gestão'
            : '';
      const matchNivel =
        filtrosColuna.nivel_cargo.length === 0 ||
        filtrosColuna.nivel_cargo.includes(nivelDisplay);

      const matchStatusColuna =
        filtrosColuna.status.length === 0 ||
        filtrosColuna.status.includes(func.avaliacao.status);

      const matches =
        matchBusca &&
        matchStatus &&
        matchNome &&
        matchCpf &&
        matchNivel &&
        matchStatusColuna;

      return matches;
    });

    // Debug: log filtros e primeiros resultados (apenas em desenvolvimento)
    try {
      // eslint-disable-next-line no-console
      console.debug(
        '[Filtro] buscaDebouncedValue:',
        buscaDebouncedValue,
        'filtrosColuna:',
        filtrosColuna
      );
      // eslint-disable-next-line no-console
      console.debug(
        '[Filtro] resultados filtrados (sample):',
        filtered.slice(0, 6).map((f) => ({ cpf: f.cpf, nome: f.nome })),
        'count:',
        filtered.length
      );
    } catch {
      // ignore
    }

    return filtered;
  }, [
    funcionarios,
    buscaDebouncedValue,
    filtroStatus,
    filtrosColuna,
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

    return (
      <div className="relative">
        <button
          className={`flex items-center justify-center gap-1 rounded transition-colors px-2 py-1 text-xs border ${
            hasFiltros
              ? 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => {
            const dropdown = document.getElementById(`dropdown-${coluna}`);
            if (dropdown) {
              dropdown.classList.toggle('hidden');
            }
          }}
        >
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
        </button>

        <div
          id={`dropdown-${coluna}`}
          className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded shadow-lg z-10 hidden max-h-60 overflow-y-auto"
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-gray-50">
        <div className="text-center">
          <div
            role="status"
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
          ></div>
          <p className="text-gray-600">Carregando dados do lote...</p>
        </div>
      </div>
    );
  }

  if (permissionErrorHint) {
    return (
      <div className="bg-gray-50">
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-3xl mx-auto mt-6 p-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-700 font-semibold">
                  Acesso restrito
                </div>
                <div className="flex-1 text-sm text-yellow-800">
                  {permissionErrorHint}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  onClick={() => router.push(`/rh/empresa/${empresaId}`)}
                >
                  Voltar para empresa
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!lote || !estatisticas) {
    return (
      <div className="flex items-center justify-center py-20 bg-gray-50">
        <div className="text-center bg-white rounded-lg shadow-sm p-8">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Lote não encontrado
          </h2>
          <p className="text-gray-600 mb-4">
            O lote solicitado não existe ou você não tem permissão para
            acessá-lo.
          </p>
          <button
            onClick={() => router.push(`/rh/empresa/${empresaId}`)}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg transition-colors"
          >
            ← Voltar para Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <main className="container mx-auto px-4 py-6">
        {/* Mensagem de permissão (vinda do servidor) */}
        {permissionErrorHint && (
          <div className="max-w-3xl mx-auto mt-6 p-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-700 font-semibold">
                  Acesso restrito
                </div>
                <div className="flex-1 text-sm text-yellow-800">
                  {permissionErrorHint}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  onClick={() => router.push(`/rh/empresa/${empresaId}`)}
                >
                  Voltar para empresa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header com breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/rh/empresa/${empresaId}`)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar para Dashboard
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1.5">
                  Detalhes do Lote
                </p>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  #{lote.id}
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Empresa</span>{' '}
                    <span className="font-medium text-gray-800">{lote.empresa_nome}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Tipo</span>{' '}
                    <span className="font-medium">
                      {lote.tipo === 'completo'
                        ? 'Completo'
                        : lote.tipo === 'operacional'
                          ? 'Operacional'
                          : 'Gestão'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Liberado em</span>{' '}
                    <span className="font-medium">
                      {formatarData(lote.liberado_em)}
                    </span>
                  </div>
                  {lote.liberado_por_nome && (
                    <div>
                      <span className="text-gray-400">Liberado por</span>{' '}
                      <span className="font-medium">
                        {lote.liberado_por_nome}
                      </span>
                    </div>
                  )}
                </div>
                {lote.descricao && (
                  <p className="mt-3 text-sm text-gray-500 italic border-l-2 border-gray-200 pl-3">
                    {lote.descricao}
                  </p>
                )}
              </div>

            <div className="flex-shrink-0 flex flex-col gap-2 lg:items-end">
              <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={gerarRelatorioLote}
                      disabled={
                        !['emitido', 'enviado'].includes(
                          lote.laudo_status ?? ''
                        )
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      title={
                        !['emitido', 'enviado'].includes(
                          lote.laudo_status ?? ''
                        )
                          ? 'Aguardando emissão do laudo'
                          : 'Gerar relatório do lote'
                      }
                    >
                      {['emitido', 'enviado'].includes(lote.laudo_status ?? '')
                        ? 'Gerar Relatório PDF'
                        : 'Aguardando emissão'}
                    </button>

                    <button
                      onClick={() => setShowSetorModal(true)}
                      disabled={
                        !['emitido', 'enviado'].includes(
                          lote.laudo_status ?? ''
                        ) || setores.length === 0
                      }
                      className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                      aria-label="Gerar Relatório PDF por Setor"
                      title={
                        !['emitido', 'enviado'].includes(
                          lote.laudo_status ?? ''
                        )
                          ? 'Aguardando emissão do laudo'
                          : setores.length === 0
                            ? 'Nenhum setor cadastrado neste ciclo'
                            : 'Gerar relatório por setor'
                      }
                    >
                      {['emitido', 'enviado'].includes(lote.laudo_status ?? '')
                        ? 'Por Setor'
                        : 'Aguardando laudo'}
                    </button>

                    {estatisticas.avaliacoes_inativadas > 0 && (
                      <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 max-w-xs">
                        <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
                        <p>
                          <span className="font-semibold">{estatisticas.avaliacoes_inativadas}</span> removida
                          {estatisticas.avaliacoes_inativadas !== 1 ? 's' : ''} — contam no denominador dos 70%.
                        </p>
                      </div>
                    )}
                </div>
            </div>
          </div>

            {/* Botão de Solicitação de Emissão - aparece quando lote atingiu 70% (status='concluido'), sem laudo e sem solicitação pendente */}
            {lote &&
              lote.status === 'concluido' &&
              !lote.emissao_solicitada &&
              !lote.tem_laudo && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-l-4 border-emerald-400 rounded-lg mb-3">
                    <div className="flex-shrink-0 w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Pronto para emissão</h4>
                      <p className="text-sm text-gray-600">
                        70% ou mais das avaliações foram concluídas. Solicite a emissão do laudo.
                      </p>
                    </div>
                  </div>
                  <button
                      onClick={async () => {
                        const confirmado = confirm(
                          `Confirma a solicitação de emissão do laudo para o lote ${lote.id}?\n\nAvaliações ainda pendentes serão inativadas automaticamente.\nO laudo será gerado e enviado para o emissor responsável.`
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
                              tomadorInfo:
                                (data.tomador_info as {
                                  nome: string;
                                  cnpj: string;
                                  email: string;
                                  telefone: string;
                                  endereco: string;
                                  cidade: string;
                                  estado: string;
                                  responsavel_nome: string;
                                  responsavel_cpf: string;
                                  responsavel_email: string;
                                } | null) ?? null,
                            });
                          } else {
                            setTimeout(() => loadLoteData(), 1500);
                          }
                        } catch (error: any) {
                          toast.error(
                            error.message || 'Erro ao solicitar emissão'
                          );
                        }
                      }}
                      className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <SendHorizontal className="w-4 h-4" />
                      Solicitar Emissão do Laudo
                    </button>
                </div>
              )}

            {/* Mensagem quando emissão já foi solicitada */}
            {lote && lote.emissao_solicitada && !lote.tem_laudo && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-l-4 border-blue-400 rounded-lg">
                  <div className="flex-shrink-0 w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Emissão Solicitada</h4>
                    <p className="text-sm text-gray-600">
                      Solicitado em{' '}
                      {lote.emissao_solicitado_em
                        ? formatDate(lote.emissao_solicitado_em)
                        : 'data não disponível'}
                      . O laudo está sendo processado pelo emissor.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mensagem quando laudo já foi emitido */}
            {lote && lote.tem_laudo && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div>
                  <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-l-4 border-emerald-400 rounded-lg mb-3">
                    <div className="flex-shrink-0 w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-0.5">
                        Laudo Emitido{lote.laudo_status === 'enviado' ? ' e Enviado' : ''}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {lote.emitido_em ? <>Emitido em {formatDate(lote.emitido_em)}.</> : 'Laudo disponível.'}
                        {lote.emissor_nome && <> Por {lote.emissor_nome}.</>}
                      </p>
                    </div>
                  </div>

                  {/* Botão Download Laudo - apenas se arquivo está no bucket */}
                  {lote.laudo_id && lote.arquivo_remoto_url && (
                    <button
                      onClick={async () => {
                        try {
                          toast.loading('Baixando laudo...', {
                            id: 'laudo-download',
                          });
                          const response = await fetch(
                            `/api/rh/laudos/${lote.laudo_id}/download`
                          );

                          if (!response.ok) {
                            throw new Error('Erro ao baixar laudo');
                          }

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
                            id: 'laudo-download',
                          });
                        } catch (err) {
                          console.error('Erro ao baixar laudo:', err);
                          toast.error('Erro ao baixar laudo', {
                            id: 'laudo-download',
                          });
                        }
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors mb-3"
                    >
                      <Download className="w-4 h-4" />
                      Ver Laudo / Baixar PDF
                    </button>
                  )}

                  {/* Hash de Integridade - apenas se arquivo está no bucket */}
                  {lote.hash_pdf && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Lock className="w-3 h-3" />
                          Verificação do PDF (SHA-256)
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard
                              .writeText(lote.hash_pdf!)
                              .then(() => toast.success('Hash copiado!'))
                              .catch(() => toast.error('Erro ao copiar hash'));
                          }}
                          className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs hover:bg-gray-200 transition-colors border border-gray-200"
                        >
                          <Copy className="w-3 h-3" />
                          Copiar
                        </button>
                      </div>
                      <code className="text-[10px] font-mono text-gray-600 break-all block">
                        {lote.hash_pdf}
                      </code>
                      <p className="text-xs text-gray-400 mt-1.5">
                        Compare este hash para verificar a autenticidade do PDF.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar funcionário (nome, CPF, setor...)"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {busca !== buscaDebouncedValue && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <select
                value={filtroStatus}
                onChange={(e) =>
                  setFiltroStatus(
                    e.target.value as 'todos' | 'concluido' | 'pendente'
                  )
                }
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="todos">Todos os status</option>
                <option value="concluido">Concluídas</option>
                <option value="pendente">Pendentes</option>
              </select>
              <button
                onClick={limparFiltrosColuna}
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                title="Limpar todos os filtros por coluna"
              >
                🧹 Limpar Filtros
              </button>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Mostrando {funcionariosFiltrados.length} de {funcionarios.length}{' '}
            funcionário(s)
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
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-20">
                    ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <span>Nome</span>
                      <FiltroColuna coluna="nome" titulo="Nome" />
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <span>CPF</span>
                      <FiltroColuna coluna="cpf" titulo="CPF" />
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <span>Nível</span>
                      <FiltroColuna coluna="nivel_cargo" titulo="Nível" />
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <FiltroColuna coluna="status" titulo="Status" />
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Data Conclusão
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Data/Motivo Inativação
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {funcionariosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={18}
                      className="px-3 py-6 text-center text-gray-500 text-sm"
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
                      className={`hover:bg-gray-50 ${
                        func.avaliacao.status === 'inativada'
                          ? 'border-l-4 border-red-400'
                          : ''
                      }`}
                    >
                      <td className="px-3 py-2 text-sm text-gray-500 font-mono">
                        #{func.avaliacao.id}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          {func.avaliacao.status === 'inativada' && (
                            <span title="Avaliação removida — não conta para prontidão do lote">
                              <AlertTriangle
                                size={13}
                                className="text-red-400 shrink-0"
                              />
                            </span>
                          )}
                          {func.nome}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600 font-mono">
                        {func.cpf}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600">
                        {func.nivel_cargo === 'operacional'
                          ? 'Operacional'
                          : func.nivel_cargo === 'gestao'
                            ? 'Gestão'
                            : '-'}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {getStatusBadge(func.avaliacao.status)}
                        {(func.avaliacao.status === 'iniciada' ||
                          func.avaliacao.status === 'em_andamento') &&
                          (func.avaliacao.total_respostas ?? 0) > 0 && (
                            <span className="block text-[10px] text-gray-600 mt-1">
                              {func.avaliacao.total_respostas}/37 respostas
                            </span>
                          )}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600">
                        {func.avaliacao.status === 'concluido' ||
                        func.avaliacao.status === 'concluida'
                          ? formatarData(func.avaliacao.data_conclusao)
                          : '-'}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600">
                        {func.avaliacao.status === 'inativada' &&
                        func.avaliacao.data_inativacao ? (
                          <div className="flex gap-2">
                            <span>
                              {formatarData(func.avaliacao.data_inativacao)}
                            </span>
                            {func.avaliacao.motivo_inativacao && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                {func.avaliacao.motivo_inativacao}
                              </span>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm text-center">
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
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                                title="Inativar avaliação com validação"
                              >
                                🚫 Inativar
                              </button>
                            )}
                          {(func.avaliacao.status === 'iniciada' ||
                            func.avaliacao.status === 'em_andamento' ||
                            func.avaliacao.status === 'concluida' ||
                            func.avaliacao.status === 'concluido') &&
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
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-amber-600 rounded hover:bg-amber-700 transition-colors"
                                title="Resetar avaliação (apagar todas as respostas)"
                              >
                                ↻ Reset
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal de Inativação */}
      {modalInativar && (
        <ModalInativarAvaliacao
          avaliacaoId={modalInativar.avaliacaoId}
          funcionarioNome={modalInativar.funcionarioNome}
          funcionarioCpf={modalInativar.funcionarioCpf}
          _loteId={loteId}
          contexto="rh"
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
          basePath="/api/rh"
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
            void loadLoteData();
          }}
          loteId={modalEmissao.loteId}
          gestorEmail={modalEmissao.gestorEmail}
          gestorCelular={modalEmissao.gestorCelular}
          tomadorInfo={modalEmissao.tomadorInfo}
          contexto="rh"
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
