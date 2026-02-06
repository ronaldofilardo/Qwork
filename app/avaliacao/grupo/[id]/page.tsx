'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import FormGroup from '@/components/FormGroup';
import ProgressBar from '@/components/ProgressBar';
import { getQuestoesPorNivel } from '@/lib/questoes';

interface Session {
  cpf: string;
  nome: string;
  perfil: 'funcionario' | 'rh' | 'admin';
  nivelCargo?: 'operacional' | 'gestao';
}

// Funções para gerenciar grupo de retomada no sessionStorage
const getGrupoRetomadaFromStorage = (): number | null => {
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem('grupo_retomada');
  return stored ? parseInt(stored, 10) : null;
};

const setGrupoRetomadaInStorage = (grupo: number): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('grupo_retomada', grupo.toString());
  }
};

const clearGrupoRetomadaFromStorage = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('grupo_retomada');
  }
};

export default function AvaliacaoGrupoPage() {
  const params = useParams();
  const router = useRouter();
  const grupoId = parseInt(params.id as string);

  const [session, setSession] = useState<Session | null>(null);
  const [respostas, setRespostas] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [grupoRetomada, setGrupoRetomada] = useState<number | null>(() =>
    getGrupoRetomadaFromStorage()
  );

  // Obter questões baseadas no nível do funcionário
  const grupos = session?.nivelCargo
    ? getQuestoesPorNivel(session.nivelCargo)
    : getQuestoesPorNivel('operacional');
  const grupo = grupos.find((g) => g.id === grupoId);
  const totalGrupos = grupos.length;

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (!response.ok) {
          router.push('/login');
          return;
        }
        const data = await response.json();
        setSession(data);
      } catch {
        router.push('/login');
      }
    };

    const loadRespostas = async () => {
      try {
        // Verificar status da avaliação
        const statusResponse = await fetch('/api/avaliacao/status');
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.status === 'concluido') {
            // Avaliação já concluída, redirecionar para relatório
            router.push('/avaliacao/concluida');
            return;
          }
          // Armazena o grupo de retomada se for uma retomada (grupo_atual > 1) e ainda não foi definido
          if (
            typeof statusData.grupo_atual === 'number' &&
            statusData.grupo_atual > 1 &&
            grupoRetomada === null
          ) {
            setGrupoRetomada(statusData.grupo_atual);
            setGrupoRetomadaInStorage(statusData.grupo_atual);
          }

          // Se a avaliação foi concluída, limpa o grupo de retomada do storage
          if (statusData.status === 'concluido') {
            clearGrupoRetomadaFromStorage();
          }
        }

        // Carregar respostas salvas do grupo
        const response = await fetch(
          `/api/avaliacao/respostas?grupo=${grupoId}`
        );
        if (response.ok) {
          const data = await response.json();
          const respostasMap = new Map<string, number>();
          data.respostas?.forEach((r: { item: string; valor: number }) => {
            respostasMap.set(r.item, r.valor);
          });
          setRespostas(respostasMap);
        }
      } catch (loadError) {
        console.error('Erro ao carregar respostas:', loadError);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
    loadRespostas();
  }, [grupoId, router, grupoRetomada]);

  const handleRespostaChange = async (itemId: string, valor: number) => {
    await Promise.resolve(); // Satisfaz require-await
    setRespostas((prev) => {
      const newMap = new Map(prev);
      newMap.set(itemId, valor);
      return newMap;
    });

    // Se respondeu a última questão do grupo, salva e avança automaticamente
    if (grupo) {
      const todasRespondidas = grupo.itens.every((item) =>
        item.id === itemId ? true : respostas.has(item.id)
      );
      if (todasRespondidas) {
        void setTimeout(async () => {
          setSaving(true);
          try {
            const respostasArray = Array.from(respostas.entries()).map(
              ([item, v]) => ({
                item,
                valor: v,
                grupo: grupoId,
              })
            );
            // Inclui a última resposta
            respostasArray.push({ item: itemId, valor, grupo: grupoId });
            const response = await fetch('/api/avaliacao/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                grupo: grupoId,
                respostas: respostasArray,
              }),
            });

            if (!response.ok) throw new Error('Erro ao salvar respostas');

            const data = await response.json();

            // Se a avaliação foi concluída automaticamente (37 respostas)
            if (data.completed) {
              clearGrupoRetomadaFromStorage();
              router.push('/dashboard');
              return;
            }

            // Caso contrário, continua para próximo grupo
            if (grupoId < totalGrupos) {
              router.push(`/avaliacao/grupo/${grupoId + 1}`);
            }
          } catch (err: unknown) {
            if (err instanceof Error) {
              setError(err.message);
            } else {
              setError(String(err));
            }
          } finally {
            setSaving(false);
          }
        }, 300); // pequeno delay para UX
      }
    }
  };

  const validateGroup = (): boolean => {
    if (!grupo) return false;

    for (const item of grupo.itens) {
      if (!respostas.has(item.id)) {
        setError(`Por favor, responda a pergunta: "${item.texto}"`);
        return false;
      }
    }
    return true;
  };

  const handleSalvar = async () => {
    setError('');

    if (!validateGroup()) return;

    setSaving(true);
    try {
      const respostasArray = Array.from(respostas.entries()).map(
        ([item, v]) => ({
          item,
          valor: v,
          grupo: grupoId,
        })
      );

      const response = await fetch('/api/avaliacao/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupo: grupoId,
          respostas: respostasArray,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar respostas');
      }

      const data = await response.json();

      // Se a avaliação foi concluída automaticamente (37 respostas)
      if (data.completed) {
        clearGrupoRetomadaFromStorage();
        router.push('/dashboard');
        return;
      }

      // Navegar para próximo grupo
      if (grupoId < totalGrupos) {
        router.push(`/avaliacao/grupo/${grupoId + 1}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading || !session || !grupo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <ProgressBar currentGroup={grupoId} totalGroups={totalGrupos} />

          <div className="mt-6">
            <FormGroup
              grupo={grupo}
              respostas={respostas}
              onChange={handleRespostaChange}
            />
          </div>

          {error && (
            <div className="mt-6 bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-start gap-3">
              <svg
                className="w-6 h-6 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="mt-6 sm:mt-8 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {saving && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-800 border-t-transparent"></div>
                  <span>Salvando suas respostas...</span>
                </div>
              )}
            </div>

            <button
              onClick={handleSalvar}
              disabled={saving}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-black text-white border-2 border-black rounded-lg hover:bg-gray-800 hover:border-gray-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-semibold"
            >
              {saving
                ? 'Salvando...'
                : grupoId < totalGrupos
                  ? 'Próximo Grupo →'
                  : 'Finalizar Avaliação'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
