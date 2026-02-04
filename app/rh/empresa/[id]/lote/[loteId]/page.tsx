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
    'todos' | 'concluida' | 'pendente'
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

  const gerarRelatorioFuncionario = async (cpf: string, nome: string) => {
    if (!confirm(`Gerar relatório PDF de ${nome}?`)) return;

    try {
      // Nova API usando Puppeteer (server-side)
      const response = await fetch(
        `/api/rh/relatorio-individual-pdf?lote_id=${loteId}&cpf=${cpf}`
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
      a.download = `relatorio-individual-${nome.replace(/\s+/g, '-')}.pdf`;
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
  const getClassificacaoGrupo = useCallback(
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
        (filtroStatus === 'concluida' &&
          func.avaliacao.status === 'concluida') ||
        (filtroStatus === 'pendente' &&
          func.avaliacao.status !== 'concluida' &&
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

      // Filtros de grupos (G1-G10) - usando getClassificacaoLabel para comparação
      const matchG1 =
        filtrosColuna.g1.length === 0 ||
        (func.grupos?.g1 !== undefined &&
          filtrosColuna.g1.includes(getClassificacaoLabel(func.grupos.g1, 1)));
      const matchG2 =
        filtrosColuna.g2.length === 0 ||
        (func.grupos?.g2 !== undefined &&
          filtrosColuna.g2.includes(getClassificacaoLabel(func.grupos.g2, 2)));
      const matchG3 =
        filtrosColuna.g3.length === 0 ||
        (func.grupos?.g3 !== undefined &&
          filtrosColuna.g3.includes(getClassificacaoLabel(func.grupos.g3, 3)));
      const matchG4 =
        filtrosColuna.g4.length === 0 ||
        (func.grupos?.g4 !== undefined &&
          filtrosColuna.g4.includes(getClassificacaoLabel(func.grupos.g4, 4)));
      const matchG5 =
        filtrosColuna.g5.length === 0 ||
        (func.grupos?.g5 !== undefined &&
          filtrosColuna.g5.includes(getClassificacaoLabel(func.grupos.g5, 5)));
      const matchG6 =
        filtrosColuna.g6.length === 0 ||
        (func.grupos?.g6 !== undefined &&
          filtrosColuna.g6.includes(getClassificacaoLabel(func.grupos.g6, 6)));
      const matchG7 =
        filtrosColuna.g7.length === 0 ||
        (func.grupos?.g7 !== undefined &&
          filtrosColuna.g7.includes(getClassificacaoLabel(func.grupos.g7, 7)));
      const matchG8 =
        filtrosColuna.g8.length === 0 ||
        (func.grupos?.g8 !== undefined &&
          filtrosColuna.g8.includes(getClassificacaoLabel(func.grupos.g8, 8)));
      const matchG9 =
        filtrosColuna.g9.length === 0 ||
        (func.grupos?.g9 !== undefined &&
          filtrosColuna.g9.includes(getClassificacaoLabel(func.grupos.g9, 9)));
      const matchG10 =
        filtrosColuna.g10.length === 0 ||
        (func.grupos?.g10 !== undefined &&
          filtrosColuna.g10.includes(
            getClassificacaoLabel(func.grupos.g10, 10)
          ));

      const matches =
        matchBusca &&
        matchStatus &&
        matchNome &&
        matchCpf &&
        matchNivel &&
        matchStatusColuna &&
        matchG1 &&
        matchG2 &&
        matchG3 &&
        matchG4 &&
        matchG5 &&
        matchG6 &&
        matchG7 &&
        matchG8 &&
        matchG9 &&
        matchG10;

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
    getClassificacaoLabel,
  ]);

  // Calcular se lote está pronto com useMemo
  const isPronto = useMemo(() => {
    if (!estatisticas) return false;
    return (
      estatisticas.avaliacoes_concluidas ===
      estatisticas.total_avaliacoes - estatisticas.avaliacoes_inativadas
    );
  }, [estatisticas]);

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
    const isGrupoColumn = coluna.startsWith('g') && coluna.length <= 3;

    return (
      <div className="relative">
        <button
          className={`flex items-center justify-center gap-1 rounded transition-colors ${
            isGrupoColumn
              ? `w-6 h-6 text-xs ${
                  hasFiltros
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-300'
                }`
              : `px-2 py-1 text-xs border ${
                  hasFiltros
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`
          }`}
          onClick={() => {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
      <div className="min-h-screen bg-gray-50">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
            className="bg-primary hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            ← Voltar para Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 text-sm"
          >
            ← Voltar para Dashboard
          </button>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="mb-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Lote ID
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {lote.id}
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
                  <div>
                    <span className="text-gray-500">Empresa:</span>{' '}
                    <span className="font-medium">{lote.empresa_nome}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tipo:</span>{' '}
                    <span className="font-medium">
                      {lote.tipo === 'completo'
                        ? 'Completo'
                        : lote.tipo === 'operacional'
                          ? 'Operacional'
                          : 'Gestão'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Liberado em:</span>{' '}
                    <span className="font-medium">
                      {formatarData(lote.liberado_em)}
                    </span>
                  </div>
                  {lote.liberado_por_nome && (
                    <div>
                      <span className="text-gray-500">Liberado por:</span>{' '}
                      <span className="font-medium">
                        {lote.liberado_por_nome}
                      </span>
                    </div>
                  )}
                </div>
                {lote.descricao && (
                  <p className="mt-3 text-sm text-gray-600 italic">
                    {lote.descricao}
                  </p>
                )}
              </div>

              <div className="lg:w-64">
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center border border-blue-200">
                    <div className="text-3xl font-bold text-blue-700">
                      {estatisticas.total_avaliacoes}
                    </div>
                    <div className="text-xs font-medium text-blue-600 mt-1">
                      Total
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center border border-green-200">
                    <div className="text-3xl font-bold text-green-700">
                      {estatisticas.avaliacoes_concluidas}
                    </div>
                    <div className="text-xs font-medium text-green-600 mt-1">
                      Concluídas
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3 text-center border border-yellow-200">
                    <div className="text-3xl font-bold text-yellow-700">
                      {estatisticas.avaliacoes_pendentes}
                    </div>
                    <div className="text-xs font-medium text-yellow-600 mt-1">
                      Pendentes
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 text-center border border-red-200">
                    <div className="text-3xl font-bold text-red-700">
                      {estatisticas.avaliacoes_inativadas}
                    </div>
                    <div className="text-xs font-medium text-red-600 mt-1">
                      Inativadas
                    </div>
                  </div>
                </div>

                <button
                  onClick={gerarRelatorioLote}
                  disabled={!isPronto}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {isPronto
                    ? '📊 Gerar Relatório PDF'
                    : '⏳ Aguardando conclusão'}
                </button>

                {estatisticas.avaliacoes_inativadas > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 text-sm">⚠️</span>
                      <div className="text-sm text-amber-800">
                        <p className="font-medium mb-1">
                          Avaliações inativadas
                        </p>
                        <p className="text-xs">
                          {estatisticas.avaliacoes_inativadas} avaliação
                          {estatisticas.avaliacoes_inativadas !== 1
                            ? 'ões'
                            : ''}{' '}
                          inativada
                          {estatisticas.avaliacoes_inativadas !== 1
                            ? 's'
                            : ''}{' '}
                          não{' '}
                          {estatisticas.avaliacoes_inativadas !== 1
                            ? 'contam'
                            : 'conta'}{' '}
                          para a prontidão do lote. O relatório será gerado
                          quando todas as avaliações ativas forem concluídas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botão de Solicitação de Emissão - só aparece quando lote está concluído, sem laudo e sem solicitação */}
            {lote &&
              lote.status === 'concluido' &&
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
                          setTimeout(() => loadLoteData(), 1500);
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
                      {lote.emissor_nome && (
                        <p className="text-xs text-purple-700">
                          Emissor: {lote.emissor_nome}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bot\u00e3o Download Laudo */}
                  {lote.laudo_id && (
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(
                            `/api/rh/laudos/${lote.laudo_id}/download`
                          );
                          if (!response.ok)
                            throw new Error('Erro ao baixar laudo');
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `Laudo_${lote.id}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                          toast.success('Laudo baixado com sucesso!');
                        } catch {
                          toast.error('Erro ao baixar laudo');
                        }
                      }}
                      className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors mb-3 font-medium"
                    >
                      📄 Ver Laudo / Baixar PDF
                    </button>
                  )}

                  {/* Hash de Integridade */}
                  {lote.hash_pdf && (
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
                        Use este hash para verificar a autenticidade e
                        integridade do PDF
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar por nome, CPF, setor, função, matrícula... (ignora acentos)"
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
                    e.target.value as 'todos' | 'concluida' | 'pendente'
                  )
                }
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="todos">Todos os status</option>
                <option value="concluida">Concluídas</option>
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
                  <th className="px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-24">
                    <div className="flex flex-col items-center gap-1">
                      <span>G1</span>
                      <FiltroColuna coluna="g1" titulo="" />
                    </div>
                  </th>
                  <th className="px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-24">
                    <div className="flex flex-col items-center gap-1">
                      <span>G2</span>
                      <FiltroColuna coluna="g2" titulo="" />
                    </div>
                  </th>
                  <th className="px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-24">
                    <div className="flex flex-col items-center gap-1">
                      <span>G3</span>
                      <FiltroColuna coluna="g3" titulo="" />
                    </div>
                  </th>
                  <th className="px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-24">
                    <div className="flex flex-col items-center gap-1">
                      <span>G4</span>
                      <FiltroColuna coluna="g4" titulo="" />
                    </div>
                  </th>
                  <th className="px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-24">
                    <div className="flex flex-col items-center gap-1">
                      <span>G5</span>
                      <FiltroColuna coluna="g5" titulo="" />
                    </div>
                  </th>
                  <th className="px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-24">
                    <div className="flex flex-col items-center gap-1">
                      <span>G6</span>
                      <FiltroColuna coluna="g6" titulo="" />
                    </div>
                  </th>
                  <th className="px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-24">
                    <div className="flex flex-col items-center gap-1">
                      <span>G7</span>
                      <FiltroColuna coluna="g7" titulo="" />
                    </div>
                  </th>
                  <th className="px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-24">
                    <div className="flex flex-col items-center gap-1">
                      <span>G8</span>
                      <FiltroColuna coluna="g8" titulo="" />
                    </div>
                  </th>
                  <th className="px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-24">
                    <div className="flex flex-col items-center gap-1">
                      <span>G9</span>
                      <FiltroColuna coluna="g9" titulo="" />
                    </div>
                  </th>
                  <th className="px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-24">
                    <div className="flex flex-col items-center gap-1">
                      <span>G10</span>
                      <FiltroColuna coluna="g10" titulo="" />
                    </div>
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
                      colSpan={17}
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
                          ? 'bg-red-50 border-l-4 border-red-400'
                          : ''
                      }`}
                    >
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          {func.avaliacao.status === 'inativada' && (
                            <span
                              className="text-red-500 text-xs"
                              title="Avaliação inativada - não conta para prontidão do lote"
                            >
                              ⚠️
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
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600">
                        {func.avaliacao.status === 'concluida'
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
                      <td className="px-1 py-2 text-sm text-center">
                        {getClassificacaoGrupo(func.grupos?.g1, 1)}
                      </td>
                      <td className="px-1 py-2 text-sm text-center">
                        {getClassificacaoGrupo(func.grupos?.g2, 2)}
                      </td>
                      <td className="px-1 py-2 text-sm text-center">
                        {getClassificacaoGrupo(func.grupos?.g3, 3)}
                      </td>
                      <td className="px-1 py-2 text-sm text-center">
                        {getClassificacaoGrupo(func.grupos?.g4, 4)}
                      </td>
                      <td className="px-1 py-2 text-sm text-center">
                        {getClassificacaoGrupo(func.grupos?.g5, 5)}
                      </td>
                      <td className="px-1 py-2 text-sm text-center">
                        {getClassificacaoGrupo(func.grupos?.g6, 6)}
                      </td>
                      <td className="px-1 py-2 text-sm text-center">
                        {getClassificacaoGrupo(func.grupos?.g7, 7)}
                      </td>
                      <td className="px-1 py-2 text-sm text-center">
                        {getClassificacaoGrupo(func.grupos?.g8, 8)}
                      </td>
                      <td className="px-1 py-2 text-sm text-center">
                        {getClassificacaoGrupo(func.grupos?.g9, 9)}
                      </td>
                      <td className="px-1 py-2 text-sm text-center">
                        {getClassificacaoGrupo(func.grupos?.g10, 10)}
                      </td>
                      <td className="px-3 py-2 text-sm text-center">
                        <div className="flex gap-1 justify-center">
                          {func.avaliacao.status !== 'concluida' &&
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
                            func.avaliacao.status === 'concluida' ||
                            func.avaliacao.status === 'em_andamento') &&
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
                          <button
                            onClick={() =>
                              gerarRelatorioFuncionario(func.cpf, func.nome)
                            }
                            disabled={func.avaliacao.status !== 'concluida'}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            title={
                              func.avaliacao.status === 'concluida'
                                ? 'Gerar relatório PDF'
                                : 'Relatório disponível apenas para avaliações concluídas'
                            }
                          >
                            📄 PDF
                          </button>
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
    </div>
  );
}
