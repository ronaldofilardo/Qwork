import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuestionModal from '@/components/avaliacao/QuestionModal'

jest.useFakeTimers()

describe('QuestionModal auto-advance behavior', () => {
  it('faz auto-advance com respostasAnteriores sem mostrar seleção', async () => {
    const question = {
      grupoId: 1,
      grupoTitulo: 'Grupo A',
      itemId: 'Q1',
      texto: 'Pergunta automática',
    }

    const onNext = jest.fn()
    const onClose = jest.fn()

    render(
      <QuestionModal
        question={question}
        progress={{ current: 1, total: 10 }}
        respostasAnteriores={{ Q1: 100 }}
        avaliacaoId={123}
        onNext={onNext}
        onClose={onClose}
      />
    )

    // Antes do timeout, não deve ter chamado onNext
    expect(onNext).not.toHaveBeenCalled()

    // Avança o timer que dispara o auto-advance
    jest.advanceTimersByTime(800)

    // onNext deve ter sido chamado com o valor da resposta anterior
    expect(onNext).toHaveBeenCalledWith(100)

    // E ainda assim nenhum botão deve aparecer selecionado visualmente
    const optionButtons = screen.getAllByRole('button').filter(b => b.textContent && /Nunca|Raramente|Às vezes|Muitas vezes|Sempre/.test(b.textContent))
    const anySelected = optionButtons.some(b => /scale-95/.test(b.className))
    expect(anySelected).toBe(false)
  })
})