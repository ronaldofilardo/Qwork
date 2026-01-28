'use client'

import { useState, useEffect } from 'react'
import { FileText, Download, Users, TrendingUp } from 'lucide-react'
import QworkLogo from './QworkLogo'

interface FuncionarioSetor {
  cpf: string
  nome: string
  funcao: string
  matricula: string | null
  nivel_cargo: 'operacional' | 'gestao' | null
  turno: string | null
  escala: string | null
  avaliacoes_concluidas: number
  grupo_1?: number | null
  grupo_2?: number | null
  grupo_3?: number | null
  grupo_4?: number | null
  grupo_5?: number | null
  grupo_6?: number | null
  grupo_7?: number | null
  grupo_8?: number | null
  grupo_9?: number | null
  grupo_10?: number | null
}

interface MediaGrupo {
  grupo: number
  dominio: string
  tipo: 'positiva' | 'negativa'
  media: number
  categoria_risco: 'baixo' | 'medio' | 'alto'
  classificacao: 'verde' | 'amarelo' | 'vermelho'
}

interface ResumoRiscos {
  verde: number
  amarelo: number
  vermelho: number
  legenda: Array<{ grupo: number; dominio: string; classificacao: string }>
}

interface RelatorioSetorProps {
  loteId: number
  setores: string[]
  onClose: () => void
}

export default function RelatorioSetor({ loteId, setores, onClose }: RelatorioSetorProps) {
  const [setorSelecionado, setSetorSelecionado] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [dados, setDados] = useState<any>(null)
  const [gerandoPDF, setGerandoPDF] = useState(false)

  useEffect(() => {
    // Prevenir scroll do body
    document.body.style.overflow = 'hidden'
    
    // Fechar com ESC
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const handleBuscarRelatorio = async () => {
    if (!setorSelecionado) {
      alert('Selecione um setor')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `/api/rh/relatorio-setor?lote_id=${loteId}&setor=${encodeURIComponent(setorSelecionado)}`
      )
      const data = await response.json()

      if ((data as Record<string, unknown>).success) {
        setDados(data as Record<string, unknown>)
      } else {
        alert('Erro ao buscar relatório: ' + ((data as Record<string, unknown>)['error'] as string | undefined || 'Erro'))
      }
    } catch (err: unknown) {
      console.error('Erro ao buscar relatório:', err)
      alert('Erro ao buscar relatório por setor')
    } finally {
      setLoading(false)
    }
  }

  const handleGerarPDF = async () => {
    if (!dados || !setorSelecionado) return

    setGerandoPDF(true)
    try {
      const response = await fetch(
        `/api/rh/relatorio-setor-pdf?lote_id=${loteId}&setor=${encodeURIComponent(setorSelecionado)}`
      )

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const loteCodigo = ((dados)['lote'] as Record<string, unknown> | undefined)?.['codigo'] as string | undefined
        a.download = `relatorio-setor-${setorSelecionado}-lote-${loteCodigo ?? 'sem-codigo'}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const data = await response.json()
        alert('Erro ao gerar PDF: ' + (((data as Record<string, unknown>)['error']) as string | undefined || 'Erro desconhecido'))
      }
    } catch (err: unknown) {
      console.error('Erro ao gerar PDF:', err)
      alert('Erro ao gerar PDF do relatório')
    } finally {
      setGerandoPDF(false)
    }
  }

  const getCorClassificacao = (classificacao: string) => {
    switch (classificacao) {
      case 'verde': return 'bg-green-100 text-green-800'
      case 'amarelo': return 'bg-yellow-100 text-yellow-800'
      case 'vermelho': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEmojiRisco = (classificacao: string) => {
    switch (classificacao) {
      case 'verde': return '🟢'
      case 'amarelo': return '🟡'
      case 'vermelho': return '🔴'
      default: return '⚪'
    }
  }

  const formatarValor = (valor: number | null | undefined) => {
    if (valor === null || valor === undefined || isNaN(valor)) return '-'
    return valor.toFixed(1)
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const legenda: Array<{ grupo: number; dominio: string; classificacao: string }> = (((dados as unknown as Record<string, unknown>)['resumo_riscos']) as ResumoRiscos | undefined)?.legenda || []

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 overflow-y-auto"
      onClick={handleBackdropClick}
      onKeyDown={(e) => {
        const ev = e
        if (ev.key === 'Escape') {
          onClose()
        }
      }}
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 py-2 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <QworkLogo size="md" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Relatório por Setor - COPSOQ III</h2>
              <p className="text-xs text-gray-600">Análise Psicossocial por Setor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Seleção de Setor */}
        <div className="px-4 py-2 bg-gray-50 border-b">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Selecionar Setor
              </label>
              <select
                value={setorSelecionado}
                onChange={(e) => setSetorSelecionado((e.target as HTMLSelectElement).value)}
                className="w-full border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Selecione um setor --</option>
                {setores.map((setor) => (
                  <option key={setor} value={setor}>
                    {setor}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleBuscarRelatorio}
              disabled={!setorSelecionado || loading}
              className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <TrendingUp className="w-4 h-4" />
              {loading ? 'Carregando...' : 'Gerar'}
            </button>
          </div>
        </div>

        {/* Conteúdo do Relatório */}
        {dados && (
          <div className="px-4 py-2">
            {/* Informações do Lote */}
            <div className="mb-3 bg-blue-50 border border-blue-200 rounded p-2">
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <p className="text-gray-600">Lote</p>
                  <p className="font-semibold text-gray-900">{dados.lote.codigo}</p>
                </div>
                <div>
                  <p className="text-gray-600">Empresa</p>
                  <p className="font-semibold text-gray-900">{dados.lote.empresa_nome}</p>
                </div>
                <div>
                  <p className="text-gray-600">Setor</p>
                  <p className="font-semibold text-gray-900">{dados.setor}</p>
                </div>
                <div>
                  <p className="text-gray-600">Funcionários</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {dados.total_funcionarios}
                  </p>
                </div>
              </div>
            </div>

            {/* Botão Gerar PDF */}
            <div className="mb-2 flex justify-end">
              <button
                onClick={handleGerarPDF}
                disabled={gerandoPDF}
                className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                {gerandoPDF ? 'Gerando...' : 'PDF'}
              </button>
            </div>

            {/* Tabela de Funcionários */}
            <div className="mb-2 overflow-x-auto">
              <h3 className="text-base font-bold text-gray-900 mb-1">Funcionários do Setor</h3>
              <table className="min-w-full bg-white border border-gray-300 rounded text-xs">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="border-b px-2 py-1 text-left font-semibold">Nome</th>
                    <th className="border-b px-2 py-1 text-left font-semibold">Função</th>
                    <th className="border-b px-2 py-1 text-center font-semibold">Nível</th>
                    <th className="border-b px-2 py-1 text-center font-semibold">G1</th>
                    <th className="border-b px-2 py-1 text-center font-semibold">G2</th>
                    <th className="border-b px-2 py-1 text-center font-semibold">G3</th>
                    <th className="border-b px-2 py-1 text-center font-semibold">G4</th>
                    <th className="border-b px-2 py-1 text-center font-semibold">G5</th>
                    <th className="border-b px-2 py-1 text-center font-semibold">G6</th>
                    <th className="border-b px-2 py-1 text-center font-semibold">G7</th>
                    <th className="border-b px-2 py-1 text-center font-semibold">G8</th>
                    <th className="border-b px-2 py-1 text-center font-semibold">G9</th>
                    <th className="border-b px-2 py-1 text-center font-semibold">G10</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.funcionarios.map((func: FuncionarioSetor) => (
                    <tr key={func.cpf} className="hover:bg-gray-50">
                      <td className="border-b px-2 py-1">{func.nome}</td>
                      <td className="border-b px-2 py-1 text-xs text-gray-600">{func.funcao}</td>
                      <td className="border-b px-2 py-1 text-center">
                        <span className={`px-1 py-0.5 rounded text-xs ${func.nivel_cargo === 'gestao' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {func.nivel_cargo === 'gestao' ? 'Gestão' : 'Oper.'}
                        </span>
                      </td>
                      <td className="border-b px-2 py-1 text-center">{formatarValor(func.grupo_1)}</td>
                      <td className="border-b px-2 py-1 text-center">{formatarValor(func.grupo_2)}</td>
                      <td className="border-b px-2 py-1 text-center">{formatarValor(func.grupo_3)}</td>
                      <td className="border-b px-2 py-1 text-center">{formatarValor(func.grupo_4)}</td>
                      <td className="border-b px-2 py-1 text-center">{formatarValor(func.grupo_5)}</td>
                      <td className="border-b px-2 py-1 text-center">{formatarValor(func.grupo_6)}</td>
                      <td className="border-b px-2 py-1 text-center">{formatarValor(func.grupo_7)}</td>
                      <td className="border-b px-2 py-1 text-center">{formatarValor(func.grupo_8)}</td>
                      <td className="border-b px-2 py-1 text-center">{formatarValor(func.grupo_9)}</td>
                      <td className="border-b px-2 py-1 text-center">{formatarValor(func.grupo_10)}</td>
                    </tr>
                  ))}
                  {/* Linha de Médias */}
                  <tr className="bg-blue-50 font-bold">
                    <td className="border-b px-2 py-1 text-right" colSpan={3}>
                      MÉDIA GERAL DO SETOR →
                    </td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((grupo) => {
                      const mediaGrupo = dados.medias_grupos.find((m: MediaGrupo) => m.grupo === grupo)
                      return (
                        <td key={grupo} className="border-b px-2 py-1 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-bold text-sm">
                              {mediaGrupo ? mediaGrupo.media.toFixed(1) : '-'}
                            </span>
                            {mediaGrupo && (
                              <span className="text-sm">
                                {getEmojiRisco(mediaGrupo.classificacao)}
                              </span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                  {/* Linha de Classificação de Risco */}
                  <tr className="bg-gray-100 text-xs">
                    <td className="px-2 py-1 text-right font-semibold" colSpan={3}>
                      CLASSIFICAÇÃO →
                    </td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((grupo) => {
                      const mediaGrupo = dados.medias_grupos.find((m: MediaGrupo) => m.grupo === grupo)
                      return (
                        <td key={grupo} className="px-2 py-1 text-center">
                          {mediaGrupo && (
                            <span className={`px-1 py-0.5 rounded text-xs font-semibold ${getCorClassificacao(mediaGrupo.classificacao)}`}>
                              {mediaGrupo.categoria_risco === 'baixo' ? 'Baixo' : 
                               mediaGrupo.categoria_risco === 'medio' ? 'Médio' : 'Alto'}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Resumo de Riscos */}
            <div className="bg-gray-50 border border-gray-200 rounded p-2">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Resumo de Riscos</h3>
              
              {/* Indicadores Visuais */}
              <div className="flex items-center gap-4 mb-2 text-sm">
                <div className="flex items-center gap-1">
                  <span className="font-bold">{(((dados as unknown as Record<string, unknown>)['resumo_riscos']) as ResumoRiscos | undefined)?.verde ?? '-'}</span>
                  <span>🟢</span>
                  <span className="text-xs text-gray-600">Baixo</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold">{(((dados as unknown as Record<string, unknown>)['resumo_riscos']) as ResumoRiscos | undefined)?.amarelo ?? '-'}</span>
                  <span>🟡</span>
                  <span className="text-xs text-gray-600">Médio</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold">{(((dados as unknown as Record<string, unknown>)['resumo_riscos']) as ResumoRiscos | undefined)?.vermelho ?? '-'}</span>
                  <span>🔴</span>
                  <span className="text-xs text-gray-600">Alto</span>
                </div>
              </div>

              {/* Legenda dos Grupos */}
              <div>
                <p className="font-semibold text-gray-700 text-xs mb-1">Grupos:</p>
                <div className="grid grid-cols-2 gap-1">
                  {legenda.map((item) => (
                    <div key={item.grupo} className="flex items-center gap-1 bg-white p-1 rounded border text-xs">
                      <span>{getEmojiRisco(item.classificacao)}</span>
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900">G{item.grupo}</span>
                        <span className="text-gray-600"> - {item.dominio}</span>
                      </div>
                      <span className={`px-1 py-0.5 rounded text-xs font-semibold ${getCorClassificacao(item.classificacao)}`}>
                        {item.classificacao === 'verde' ? 'B' : 
                         item.classificacao === 'amarelo' ? 'M' : 'A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nota Metodológica */}
              <div className="mt-2 pt-1 border-t border-gray-300 text-xs text-gray-600">
                <p className="font-semibold mb-1">Metodologia:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="font-medium text-xs">Positivos:</p>
                    <ul className="text-xs ml-2 space-y-0.5">
                      <li>🟢 &gt;66% Baixo</li>
                      <li>🟡 33-66% Médio</li>
                      <li>🔴 &lt;33% Alto</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-xs">Negativos:</p>
                    <ul className="text-xs ml-2 space-y-0.5">
                      <li>🟢 &lt;33% Baixo</li>
                      <li>🟡 33-66% Médio</li>
                      <li>🔴 &gt;66% Alto</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estado Vazio */}
        {!dados && !loading && (
          <div className="px-6 py-12 text-center text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">Selecione um setor e clique em &quot;Gerar Relatório&quot;</p>
            <p className="text-sm mt-2">O relatório mostrará todos os funcionários e médias dos grupos COPSOQ</p>
          </div>
        )}
      </div>
    </div>
  )
}
