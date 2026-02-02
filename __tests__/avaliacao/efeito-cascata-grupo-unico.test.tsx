import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useParams } from 'next/navigation'

// Mock next/navigation antes de qualquer import do componente
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

// Mock dos componentes filhos
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

// Mock do fetch global
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

jest.mock('@/lib/questoes', () => {
  const grupoUnico = {
    id: 1,
    titulo: 'Grupo 1 - Demandas no Trabalho',
    dominio: 'Demandas no Trabalho',
    descricao: 'Avaliação das exigências quantitativas e ritmo de trabalho',
    tipo: 'negativa',
    itens: [
      {
        id: 'Q1',
        texto: 'Com que frequência você tem muito serviço pra fazer?',
        textoGestao: 'Com que frequência você tem um volume elevado de trabalho?'
      }
    ]
  };
  return {
    __esModule: true,
    grupos: [grupoUnico],
    getQuestoesPorNivel: () => [grupoUnico],
  };
})

import AvaliacaoGrupoPage from '@/app/avaliacao/grupo/[id]/page'

describe('Efeito Cascata - Grupo Único', () => {
  const mockPush = jest.fn()
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(useParams as jest.Mock).mockReturnValue({ id: '1' })

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

  it('deve funcionar com grupo que tem apenas uma questão', async () => {
    // O mock global do jest.mock('@/lib/questoes') já define o grupoUnico e getQuestoesPorNivel
    render(<AvaliacaoGrupoPage />)

    await waitFor(() => {
      expect(screen.getByTestId('mock-form-group')).toBeInTheDocument()
    })

    // O grupoUnico mockado tem apenas uma questão
    const questaoId = 'Q1'
    expect(screen.getByTestId(`question-${questaoId}`)).toBeInTheDocument()

    fireEvent.click(screen.getByTestId(`answer-${questaoId}`))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled()
    })
  })
})
