import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuestionModal from '@/components/avaliacao/QuestionModal'

const q1 = {
  grupoId: 1,
  grupoTitulo: 'Grupo A',
  itemId: 'Q34',
  texto: 'Pergunta 34',
}

const q2 = {
  grupoId: 1,
  grupoTitulo: 'Grupo A',
  itemId: 'Q35',
  texto: 'Pergunta 35',
}

const progress = { current: 34, total: 37 }

describe('QuestionModal selection reset', () => {
  it('reseta a seleção ao mudar de questão', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    const onNext = jest.fn()

    const { rerender } = render(
      <QuestionModal
        question={q1}
        progress={progress}
        respostasAnteriores={{}}
        avaliacaoId={123}
        onNext={onNext}
        onClose={onClose}
      />
    )

    // Seleciona a opção 'Sempre' (valor 100) usando o botão como controle
    const sempreBtn = screen.getByRole('button', { name: /Sempre/i })
    await user.click(sempreBtn)

    // Aguarda a classe de selecionado (scale-95) aparecer no botão clicado
    expect(sempreBtn.className).toMatch(/scale-95/)

    // Rerender com a próxima questão
    rerender(
      <QuestionModal
        question={q2}
        progress={{ current: 35, total: 37 }}
        respostasAnteriores={{}}
        avaliacaoId={123}
        onNext={onNext}
        onClose={onClose}
      />
    )

    // Nenhum dos botões da nova questão deve estar marcado como selecionado
    const optionButtons = screen.getAllByRole('button').filter(b => b.textContent && /Nunca|Raramente|Às vezes|Muitas vezes|Sempre/.test(b.textContent))
    const anySelected = optionButtons.some(b => /scale-95/.test(b.className))
    expect(anySelected).toBe(false)
  })
})