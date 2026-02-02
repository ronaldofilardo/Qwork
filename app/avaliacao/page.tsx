'use client';

import { useState, useEffect } from 'react';
import { getQuestoesPorNivel } from '@/lib/questoes';
import QworkLogo from '@/components/QworkLogo';
import RadioScale from '@/components/RadioScale';

interface Questao {
  grupoId: number;
  grupoTitulo: string;
  itemId: string;
  texto: string;
  inversa: boolean;
}

interface RespostaData {
  item: string;
  valor: number;
}

export default function NovaAvaliacaoPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [respostas, setRespostas] = useState<{ [key: string]: number }>({});
  const [avaliacaoId, setAvaliacaoId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [todasQuestoes, setTodasQuestoes] = useState<Questao[]>([]);

  useEffect(() => {
    async function carregar() {
      try {
        // Verifica login e obtém dados da sessão
        const sessionRes = await fetch('/api/auth/session');
        if (!sessionRes.ok) {
          window.location.href = '/login';
          return;
        }
        const sessionData = await sessionRes.json();
        const userNivelCargo = sessionData.nivelCargo || 'operacional';

        // Carrega as questões baseadas no nível do cargo
        const questoesPorNivel = getQuestoesPorNivel(userNivelCargo);
        console.log('[DEBUG] userNivelCargo:', userNivelCargo);
        console.log(
          '[DEBUG] questoesPorNivel grupos:',
          questoesPorNivel.length
        );

        const todasQuestoesCarregadas = questoesPorNivel.flatMap((grupo) =>
          grupo.itens.map((item) => ({
            grupoId: grupo.id,
            grupoTitulo: grupo.titulo,
            itemId: item.id,
            texto: item.texto,
            inversa: item.invertida || false,
          }))
        );
        console.log(
          '[DEBUG] todasQuestoesCarregadas:',
          todasQuestoesCarregadas.length
        );
        setTodasQuestoes(todasQuestoesCarregadas);

        // Obter ID da avaliação da URL
        const urlParams = new URLSearchParams(window.location.search);
        const idFromUrl = urlParams.get('id');

        let avaliacaoIdToUse: number | null = null;

        if (idFromUrl) {
          // Se tem ID na URL, usar esse
          avaliacaoIdToUse = parseInt(idFromUrl);
        } else {
          // Senão, buscar a mais recente não concluída
          const statusRes = await fetch('/api/avaliacao/status');
          const status = await statusRes.json();
          if (status.status === 'concluida') {
            window.location.href = '/avaliacao/concluida';
            return;
          }
          avaliacaoIdToUse = status.avaliacaoId || null;
        }

        if (!avaliacaoIdToUse) {
          alert('Nenhuma avaliação disponível');
          window.location.href = '/dashboard';
          return;
        }

        setAvaliacaoId(avaliacaoIdToUse);

        console.log('[DEBUG] avaliacaoIdToUse:', avaliacaoIdToUse);

        // Busca respostas já respondidas
        const resp = await fetch(
          `/api/avaliacao/respostas-all?avaliacaoId=${avaliacaoIdToUse}`
        );
        console.log(
          '[DEBUG] API URL:',
          `/api/avaliacao/respostas-all?avaliacaoId=${avaliacaoIdToUse}`
        );

        if (resp.ok) {
          const data = await resp.json();
          console.log('[DEBUG] API retornou avaliacaoId:', data.avaliacaoId);
          console.log(
            '[DEBUG] API retornou respostas.length:',
            data.respostas.length
          );

          const map: { [key: string]: number } = {};
          data.respostas.forEach((r: RespostaData) => {
            map[r.item] = r.valor;
          });
          setRespostas(map);
          setHasStarted(data.respostas.length > 0);

          const respondidas = data.respostas.map((r: RespostaData) =>
            String(r.item)
          );

          const proximo = todasQuestoesCarregadas.findIndex(
            (q) => !respondidas.includes(String(q.itemId))
          );

          console.log('[DEBUG] respondidas:', respondidas.length);
          console.log('[DEBUG] proximo index:', proximo);
          console.log(
            '[DEBUG] todasQuestoesCarregadas length:',
            todasQuestoesCarregadas.length
          );

          setCurrentIndex(
            proximo === -1 ? todasQuestoesCarregadas.length : proximo
          );
        }
      } catch (err) {
        console.error('Erro ao carregar avaliação', err);
      } finally {
        setIsLoading(false);
      }
    }
    carregar();
  }, []);

  const questaoAtual = todasQuestoes[currentIndex];

  async function responder(valor: number) {
    if (!avaliacaoId || !questaoAtual || isSaving) return;

    setIsSaving(true);

    // Se é a primeira resposta, atualizar status para em_andamento
    if (!hasStarted) {
      await fetch('/api/avaliacao/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'em_andamento', avaliacaoId }),
      }).catch((err) => console.warn('Erro ao atualizar status:', err));
      setHasStarted(true);
    }

    // Salvar resposta
    try {
      const saveResponse = await fetch('/api/avaliacao/respostas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avaliacaoId,
          grupo: questaoAtual.grupoId,
          item: questaoAtual.itemId,
          valor,
        }),
      });

      if (saveResponse.ok) {
        const data = await saveResponse.json();

        // Verificar se a avaliação foi concluída automaticamente (37 respostas)
        if (data.completed) {
          console.log('✅ Avaliação concluída automaticamente!');
          setIsFinished(true);
          return;
        }

        setRespostas((prev) => ({ ...prev, [questaoAtual.itemId]: valor }));
        const proximoIndex = currentIndex + 1;

        if (proximoIndex >= todasQuestoes.length) {
          // Última questão respondida - avaliação será concluída automaticamente
          setIsFinished(true);
        } else {
          setCurrentIndex(proximoIndex);
        }
      } else {
        console.error('Erro ao salvar resposta:', await saveResponse.text());
        // Não avançar se não salvou
        alert('Erro ao salvar resposta. Tente novamente.');
      }
    } catch (err) {
      console.warn('Erro de rede ao salvar resposta:', err);
      alert('Erro de conexão. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-6">
            Carregando sua avaliação...
          </p>
        </div>
      </div>
    );
  }

  if (isFinished || !questaoAtual) {
    return (
      <div className="min-h-screen bg-gray-5 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-1 text-center max-w-md">
          <h2 className="text-3xl font-bold text-green-6 mb-4">Parabéns!</h2>
          <p className="text-lg text-gray-7 mb-8">
            Você completou todas as questões.
          </p>
          <a
            href="/dashboard"
            className="bg-primary text-white px-8 py-4 rounded-xl text-lg font-semibold hover:opacity-9 transition"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* Header com progresso */}
      <div className="bg-primary text-white p-5 shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-2">
              <QworkLogo size="sm" showSlogan={false} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Avaliação Psicossocial</h1>
              <p className="text-sm opacity-9">{questaoAtual.grupoTitulo}</p>
            </div>
          </div>
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="p-2 hover:bg-white/2 rounded-full transition"
          >
            <svg
              xmlns="http://www.w3.org/2/svg"
              width="3"
              height="3"
              viewBox="  24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-white/3 rounded-full h-3 overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-5"
            style={{
              width: `${((currentIndex + 1) / todasQuestoes.length) * 100}%`,
            }}
          />
        </div>
        <p className="text-right text-sm mt-2">
          {currentIndex + 1} de {todasQuestoes.length}
        </p>
      </div>

      {/* Questão */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-8 overflow-y-auto">
        <div className="max-w-4xl w-full">
          <RadioScale
            questionId={questaoAtual.itemId}
            questionText={questaoAtual.texto}
            value={respostas[questaoAtual.itemId] ?? null}
            onChange={(valor) => responder(valor)}
            required={true}
          />

          {isSaving && (
            <div className="text-center mt-6 text-gray-600 text-sm">
              Salvando resposta...
            </div>
          )}

          <p className="text-center text-gray-500 mt-12 text-sm">
            Você pode sair a qualquer momento e continuar depois.
          </p>
        </div>
      </div>
    </div>
  );
}
