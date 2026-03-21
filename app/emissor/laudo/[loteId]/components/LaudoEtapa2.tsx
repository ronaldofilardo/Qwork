'use client';

import type { LaudoPadronizado } from '@/lib/laudo-tipos';

interface LaudoEtapa2Props {
  etapa2: LaudoPadronizado['etapa2'];
}

export default function LaudoEtapa2({ etapa2 }: LaudoEtapa2Props) {
  if (!etapa2) return null;

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-3 pb-1 border-b-2 border-gray-600">
        2. SCORES MÉDIOS POR GRUPO DE QUESTÕES (escala 0-100)
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-gray-800 to-gray-700">
              <th
                className="border border-gray-500 px-3 py-2 text-center text-xs font-bold text-white"
                style={{ minWidth: '60px' }}
              >
                Grupo
              </th>
              <th className="border border-gray-500 px-2 py-1.5 text-left text-xs font-bold text-white">
                Domínio
              </th>
              <th className="border border-gray-500 px-2 py-1.5 text-left text-xs font-bold text-white">
                Descrição
              </th>
              <th className="border border-gray-500 px-2 py-1.5 text-center text-xs font-bold text-white">
                Tipo
              </th>
              <th className="border border-gray-500 px-2 py-1.5 text-center text-xs font-bold text-white">
                x̄ - s
              </th>
              <th className="border border-gray-500 px-2 py-1.5 text-center text-xs font-bold text-white">
                Média Geral
              </th>
              <th className="border border-gray-500 px-2 py-1.5 text-center text-xs font-bold text-white">
                x̄ + s
              </th>
              <th className="border border-gray-500 px-2 py-1.5 text-center text-xs font-bold text-white">
                Categoria de Risco
              </th>
            </tr>
          </thead>
          <tbody>
            {etapa2.map((score, index) => (
              <tr
                key={score.grupo}
                className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
              >
                <td className="border border-gray-300 px-3 py-2 text-center">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-900 text-sm font-bold">
                    {score.grupo}
                  </div>
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <div className="text-xs font-medium text-gray-800">
                    {score.dominio}
                  </div>
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <div className="text-xs text-gray-600">{score.descricao}</div>
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                      score.tipo === 'positiva'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {score.tipo === 'positiva' ? 'Positiva' : 'Negativa'}
                  </span>
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <span className="text-xs text-gray-700">
                    {score.mediaMenosDP.toFixed(1)}
                  </span>
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <span className="text-xs font-bold text-gray-900">
                    {score.media.toFixed(1)}
                  </span>
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <span className="text-xs text-gray-700">
                    {score.mediaMaisDP.toFixed(1)}
                  </span>
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-bold rounded ${
                      score.classificacaoSemaforo === 'verde'
                        ? 'bg-green-100 text-green-800'
                        : score.classificacaoSemaforo === 'amarelo'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {score.categoriaRisco === 'baixo'
                      ? 'Excelente'
                      : score.categoriaRisco === 'medio'
                        ? 'Monitorar'
                        : 'Atenção Necessária'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 bg-gray-50 rounded p-2 border-l-4 border-gray-500">
        <p className="text-xs text-gray-700">
          <strong>x̄</strong> = média, <strong>s</strong> = desvio-padrão
        </p>
      </div>
      <div className="mt-4 bg-gray-50 rounded-lg p-4 border-l-4 border-gray-500">
        <p className="text-sm text-gray-800 leading-relaxed text-justify">
          A amostragem acima descrita foi submetida à avaliação psicossocial
          para verificação de seu estado de saúde mental, como condição
          necessária à realização do trabalho. Durante o período da avaliação,
          foi possível identificar os pontos acima descritos.
        </p>
      </div>
    </div>
  );
}
