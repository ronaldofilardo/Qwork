import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import FormGroup from '@/components/FormGroup'
import { GrupoAvaliacao } from '@/lib/questoes'

// Mock do RadioScale
jest.mock('@/components/RadioScale', () => {
  return function MockRadioScale({ questionId, questionText, value, onChange }: any) {
    return (
      <div data-testid={`radio-scale-${questionId}`}>
        <label>{questionText}</label>
        <button 
          onClick={() => onChange(75)}
          data-testid={`button-${questionId}`}
        >
          Selecionar
        </button>
        <span data-testid={`value-${questionId}`}>{value || 'null'}</span>
      </div>
    )
  }
})

describe('FormGroup', () => {
  const mockGrupo: GrupoAvaliacao = {
    id: 1,
    titulo: 'Grupo Teste',
    dominio: 'Domínio Teste',
    descricao: 'Descrição do grupo de teste',
    tipo: 'positiva',
    itens: [
      {
        id: 'Q1',
        texto: 'Primeira pergunta de teste?'
      },
      {
        id: 'Q2', 
        texto: 'Segunda pergunta de teste?'
      },
      {
        id: 'Q3',
        texto: 'Terceira pergunta de teste?'
      }
    ]
  }

  const mockRespostas = new Map([
    ['Q1', 75],
    ['Q2', 50]
  ])

  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve renderizar o título e descrição do grupo', () => {
    render(
      <FormGroup
        grupo={mockGrupo}
        respostas={new Map()}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText('Grupo Teste')).toBeInTheDocument()
    expect(screen.getByText('Descrição do grupo de teste')).toBeInTheDocument()
  })

  it('deve renderizar apenas a próxima questão a ser respondida (efeito cascata)', () => {
    render(
      <FormGroup
        grupo={mockGrupo}
        respostas={new Map()}
        onChange={mockOnChange}
      />
    )
    // Só a primeira questão deve aparecer
    expect(screen.getByText(/Primeira pergunta de teste/)).toBeInTheDocument()
    expect(screen.queryByText(/Segunda pergunta de teste/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Terceira pergunta de teste/)).not.toBeInTheDocument()
  })

  it('deve renderizar as instruções', () => {
    render(
      <FormGroup
        grupo={mockGrupo}
        respostas={new Map()}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText(/Instruções:/)).toBeInTheDocument()
    expect(screen.getByText(/Responda todas as perguntas pensando nas últimas 4 semanas/)).toBeInTheDocument()
  })

  it('deve passar valores corretos para RadioScale', () => {
    render(
      <FormGroup
        grupo={mockGrupo}
        respostas={mockRespostas}
        onChange={mockOnChange}
      />
    )

    // Verifica se os valores são passados corretamente
    expect(screen.getByTestId('value-Q1')).toHaveTextContent('75')
    expect(screen.getByTestId('value-Q2')).toHaveTextContent('50')
    expect(screen.getByTestId('value-Q3')).toHaveTextContent('null')
  })

  it('deve chamar onChange quando RadioScale é alterado', () => {
    render(
      <FormGroup
        grupo={mockGrupo}
        respostas={new Map()}
        onChange={mockOnChange}
      />
    )

    fireEvent.click(screen.getByTestId('button-Q1'))
    expect(mockOnChange).toHaveBeenCalledWith('Q1', 75)
  })

  it('deve aplicar classes CSS responsivas corretas', () => {
    render(
      <FormGroup
        grupo={mockGrupo}
        respostas={new Map()}
        onChange={mockOnChange}
      />
    )

    // Verifica container principal
    const container = document.querySelector('.bg-white.rounded-lg.shadow-md')
    expect(container).toBeInTheDocument()

    // Verifica título responsivo
    const titulo = screen.getByText('Grupo Teste')
    expect(titulo).toHaveClass('text-xl', 'sm:text-2xl')
  })

  it('deve liberar as próximas questões conforme as respostas (efeito cascata)', () => {
    const respostas = new Map([
      ['Q1', 75],
      ['Q2', 50],
    ])
    render(
      <FormGroup
        grupo={mockGrupo}
        respostas={respostas}
        onChange={mockOnChange}
      />
    )
    // As duas primeiras respondidas, terceira liberada
    expect(screen.getByTestId('radio-scale-Q1')).toBeInTheDocument()
    expect(screen.getByTestId('radio-scale-Q2')).toBeInTheDocument()
    expect(screen.getByTestId('radio-scale-Q3')).toBeInTheDocument()
  })

  it('deve lidar com grupo vazio', () => {
    const grupoVazio: GrupoAvaliacao = {
      ...mockGrupo,
      itens: []
    }

    render(
      <FormGroup
        grupo={grupoVazio}
        respostas={new Map()}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText('Grupo Teste')).toBeInTheDocument()
    expect(screen.queryByTestId(/radio-scale-/)).not.toBeInTheDocument()
  })

  it('deve lidar com mudanças de respostas', () => {
    const { rerender } = render(
      <FormGroup
        grupo={mockGrupo}
        respostas={new Map()}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByTestId('value-Q1')).toHaveTextContent('null')

    // Simula mudança de resposta
    const novasRespostas = new Map([['Q1', 100]])
    rerender(
      <FormGroup
        grupo={mockGrupo}
        respostas={novasRespostas}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByTestId('value-Q1')).toHaveTextContent('100')
  })

  it('deve passar propriedades corretas para cada RadioScale', () => {
    render(
      <FormGroup
        grupo={mockGrupo}
        respostas={mockRespostas}
        onChange={mockOnChange}
      />
    )

    // Verifica se todas as questões têm seus RadioScales
    mockGrupo.itens.forEach(item => {
      expect(screen.getByTestId(`radio-scale-${item.id}`)).toBeInTheDocument()
      expect(screen.getByText(item.texto)).toBeInTheDocument()
    })
  })
})