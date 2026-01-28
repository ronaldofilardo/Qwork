import { render, screen } from '@testing-library/react'
import QuestionModal from '@/components/avaliacao/QuestionModal'

const question = {
  grupoId: 1,
  grupoTitulo: 'Grupo A',
  itemId: 'Q1',
  texto: 'Pergunta de teste',
}

const progress = { current: 1, total: 10 }

describe('QuestionModal', () => {
  it('renderiza botão de sair com cor branca e label acessível', () => {
    render(
      <QuestionModal
        question={question}
        progress={progress}
        respostasAnteriores={{}}
        avaliacaoId={123}
        onNext={() => {}}
        onClose={() => {}}
      />
    )

    const btn = screen.getByLabelText('Sair')
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveClass('text-white')
  })
})
