jest.mock('@/lib/questoes', () => {
  const actualQuestoes = jest.requireActual('@/lib/questoes')
  return {
    __esModule: true,
    ...actualQuestoes,
    getQuestoesPorNivel: jest.fn(() => actualQuestoes.grupos)
  }
})

const actualQuestoes = jest.requireActual('@/lib/questoes')

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useParams } from 'next/navigation'
import { grupos, getQuestoesPorNivel } from '@/lib/questoes'
import AvaliacaoGrupoPage from '@/app/avaliacao/grupo/[id]/page'

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <div data-testid="mock-header">Header</div>
  }
})

jest.mock('@/components/ProgressBar', () => {
  return function MockProgressBar({ currentGroup, totalGroups }: any) {
    return <div data-testid="mock-progress">{currentGroup}/{totalGroups}</div>
  }
})

jest.mock('@/components/FormGroup', () => {
  return function MockFormGroup({ grupo, respostas, onChange }: any) {
    return (
      <div data-testid="mock-form-group">
        <h3>{grupo.titulo}</h3>
        {grupo.itens.map((item: any, idx: number) => {
          const liberada = idx <= grupo.itens.findIndex((i: any) => !respostas.has(i.id))
          const respondida = respostas.has(item.id)
          const desabilitada = idx < grupo.itens.findIndex((i: any) => !respostas.has(i.id))
          
          return liberada ? (
            <div
              key={item.id}
              data-testid={`question-${item.id}`}
              className={desabilitada ? 'opacity-50 pointer-events-none' : ''}
            >
              <label>{item.texto}</label>
              <button
                onClick={() => onChange(item.id, 75)}
                disabled={desabilitada}
                data-testid={`answer-${item.id}`}
              >
                Responder
              </button>
              {respondida && <span data-testid={`answered-${item.id}`}>✓</span>}
            </div>
          ) : null
        })}
      </div>
    )
  }
})


// Helper para simular Response do fetch
function createFetchResponse(data: any, ok = true, status = 200) {
  return {
    ok,
    status,
    headers: { get: () => null },
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as any;
}

global.fetch = jest.fn()

describe('Efeito Cascata - AvaliacaoGrupoPage', () => {
  const mockPush = jest.fn()
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(useParams as jest.Mock).mockReturnValue({ id: '1' })

    // Reset mock to default
    ;(getQuestoesPorNivel as jest.MockedFunction<typeof getQuestoesPorNivel>).mockReturnValue(actualQuestoes.grupos)

    // Mock session
    mockFetch.mockImplementation((url) => {
      if (url === '/api/auth/session') {
        return Promise.resolve(createFetchResponse({
          cpf: '12345678901',
          nome: 'Test User',
          perfil: 'funcionario',
          nivelCargo: 'operacional',
        }))
      }
      if (url === '/api/avaliacao/status') {
        return Promise.resolve(createFetchResponse({ status: 'em_andamento', grupo_atual: 1 }))
      }
      if (url?.toString().includes('/api/avaliacao/respostas')) {
        return Promise.resolve(createFetchResponse({ respostas: [] }))
      }
      if (url === '/api/avaliacao/save') {
        return Promise.resolve(createFetchResponse({ success: true }))
      }
      return Promise.resolve(createFetchResponse({}))
    })
  })

  it('deve exibir apenas a primeira questão inicialmente', async () => {
    render(<AvaliacaoGrupoPage />)

    await waitFor(() => {
      expect(screen.getByTestId('mock-form-group')).toBeInTheDocument()
    })

    const grupo = grupos[0] // Primeiro grupo
    
    // Primeira questão deve estar visível
    expect(screen.getByTestId(`question-${grupo.itens[0].id}`)).toBeInTheDocument()
    
    // Demais questões não devem estar visíveis ainda
    if (grupo.itens.length > 1) {
      expect(screen.queryByTestId(`question-${grupo.itens[1].id}`)).not.toBeInTheDocument()
    }
  })

  it('deve liberar próxima questão ao responder a atual', async () => {
    render(<AvaliacaoGrupoPage />)

    await waitFor(() => {
      expect(screen.getByTestId('mock-form-group')).toBeInTheDocument()
    })

    const grupo = grupos[0]
    const primeiraQuestao = grupo.itens[0]
    const segundaQuestao = grupo.itens[1]

    // Responder primeira questão
    fireEvent.click(screen.getByTestId(`answer-${primeiraQuestao.id}`))

    await waitFor(() => {
      // Segunda questão deve aparecer
      expect(screen.getByTestId(`question-${segundaQuestao.id}`)).toBeInTheDocument()
      
      // Primeira questão deve estar marcada como respondida e desabilitada
      expect(screen.getByTestId(`answered-${primeiraQuestao.id}`)).toBeInTheDocument()
      const primeiraQuestaoEl = screen.getByTestId(`question-${primeiraQuestao.id}`)
      expect(primeiraQuestaoEl).toHaveClass('opacity-50', 'pointer-events-none')
    })
  })

  it('deve avançar automaticamente para próximo grupo ao responder última questão', async () => {
    render(<AvaliacaoGrupoPage />)

    await waitFor(() => {
      expect(screen.getByTestId('mock-form-group')).toBeInTheDocument()
    })

    const grupo = grupos[0]
    
    // Responder todas as questões menos a última
    for (let i = 0; i < grupo.itens.length - 1; i++) {
      const questao = grupo.itens[i]
      fireEvent.click(screen.getByTestId(`answer-${questao.id}`))
      
      await waitFor(() => {
        expect(screen.getByTestId(`answered-${questao.id}`)).toBeInTheDocument()
      })
    }

    // Responder última questão
    const ultimaQuestao = grupo.itens[grupo.itens.length - 1]
    fireEvent.click(screen.getByTestId(`answer-${ultimaQuestao.id}`))

    await waitFor(() => {
      // Deve ter chamado o save
      expect(mockFetch).toHaveBeenCalledWith('/api/avaliacao/save', expect.any(Object))
      
      // Deve navegar para próximo grupo
      expect(mockPush).toHaveBeenCalledWith('/avaliacao/grupo/2')
    })
  })

  it('não deve permitir voltar para questões já respondidas', async () => {
    render(<AvaliacaoGrupoPage />)

    await waitFor(() => {
      expect(screen.getByTestId('mock-form-group')).toBeInTheDocument()
    })

    const grupo = grupos[0]
    const primeiraQuestao = grupo.itens[0]

    // Responder primeira questão
    fireEvent.click(screen.getByTestId(`answer-${primeiraQuestao.id}`))

    await waitFor(() => {
      const primeiraQuestaoEl = screen.getByTestId(`question-${primeiraQuestao.id}`)
      const botaoResposta = screen.getByTestId(`answer-${primeiraQuestao.id}`)
      
      // Questão deve estar desabilitada
      expect(primeiraQuestaoEl).toHaveClass('opacity-50', 'pointer-events-none')
      expect(botaoResposta).toBeDisabled()
    })
  })


  it('deve preservar estado das questões ao navegar entre elas', async () => {
    render(<AvaliacaoGrupoPage />)

    await waitFor(() => {
      expect(screen.getByTestId('mock-form-group')).toBeInTheDocument()
    })

    const grupo = grupos[0]
    
    // Responder primeira questão
    fireEvent.click(screen.getByTestId(`answer-${grupo.itens[0].id}`))
    
    await waitFor(() => {
      expect(screen.getByTestId(`answered-${grupo.itens[0].id}`)).toBeInTheDocument()
    })

    // Responder segunda questão
    fireEvent.click(screen.getByTestId(`answer-${grupo.itens[1].id}`))

    await waitFor(() => {
      // Ambas questões devem estar marcadas como respondidas
      expect(screen.getByTestId(`answered-${grupo.itens[0].id}`)).toBeInTheDocument()
      expect(screen.getByTestId(`answered-${grupo.itens[1].id}`)).toBeInTheDocument()
      
      // Primeira questão deve estar desabilitada
      const primeiraQuestao = screen.getByTestId(`question-${grupo.itens[0].id}`)
      expect(primeiraQuestao).toHaveClass('opacity-50', 'pointer-events-none')
    })
  })
})