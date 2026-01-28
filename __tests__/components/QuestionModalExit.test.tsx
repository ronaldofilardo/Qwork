import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuestionModal from '@/components/avaliacao/QuestionModal'

const question = {
  grupoId: 1,
  grupoTitulo: 'Grupo A',
  itemId: 'Q1',
  texto: 'Pergunta de teste',
}

const progress = { current: 1, total: 10 }

describe('QuestionModal exit affordance', () => {
  it('mostra botão visível de sair e chama onClose quando clicado', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()

    render(
      <QuestionModal
        question={question}
        progress={progress}
        respostasAnteriores={{}}
        avaliacaoId={123}
        onNext={() => {}}
        onClose={onClose}
      />
    )

    const btn = screen.getByRole('button', { name: /Sair e continuar depois/i })
    expect(btn).toBeInTheDocument()

    await user.click(btn)
    expect(onClose).toHaveBeenCalled()
  })
})
