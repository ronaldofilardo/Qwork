import React from 'react'
import { render, screen } from '@testing-library/react'
import ProgressBar from '@/components/ProgressBar'

describe('ProgressBar', () => {
  it('deve renderizar o progresso corretamente', () => {
    render(<ProgressBar currentGroup={3} totalGroups={10} />)
    
    expect(screen.getByText('Grupo 3 de 10')).toBeInTheDocument()
    expect(screen.getByText(/30%\s*conclu[ií]do/i)).toBeInTheDocument()
  })

  it('deve calcular porcentagem corretamente', () => {
    render(<ProgressBar currentGroup={1} totalGroups={4} />)
    
    expect(screen.getByText(/25%\s*conclu[ií]do/i)).toBeInTheDocument()
  })

  it('deve lidar com 100% de progresso', () => {
    render(<ProgressBar currentGroup={10} totalGroups={10} />)
    
    expect(screen.getByText('Grupo 10 de 10')).toBeInTheDocument()
    expect(screen.getByText(/100%\s*conclu[ií]do/i)).toBeInTheDocument()
  })

  it('deve lidar com 0% de progresso', () => {
    render(<ProgressBar currentGroup={0} totalGroups={10} />)
    
    expect(screen.getByText('Grupo 0 de 10')).toBeInTheDocument()
    expect(screen.getByText(/0%\s*conclu[ií]do/i)).toBeInTheDocument()
  })

  it('deve aplicar largura correta da barra de progresso', () => {
    render(<ProgressBar currentGroup={5} totalGroups={10} />)
    
    const progressBar = document.querySelector('[style*="width: 50%"]')
    expect(progressBar).toBeInTheDocument()
  })

  it('deve ter classes CSS corretas', () => {
    render(<ProgressBar currentGroup={2} totalGroups={8} />)
    
    // Verifica container principal
    // O container principal é o mais externo com mb-6
    const container = document.querySelector('.mb-6')
    expect(container).toBeInTheDocument()
    
    // Verifica barra de fundo
    const backgroundBar = document.querySelector('.bg-gray-200')
    expect(backgroundBar).toBeInTheDocument()
    expect(backgroundBar).toHaveClass('rounded-full', 'h-2')
  })

  it('deve renderizar corretamente com valores decimais', () => {
    render(<ProgressBar currentGroup={1} totalGroups={3} />)
    
    // 1/3 = 33.33...%, deve ser arredondado
    expect(screen.getByText(/33%\s*conclu[ií]do/i)).toBeInTheDocument()
  })

  it('deve ter estrutura HTML correta', () => {
    render(<ProgressBar currentGroup={7} totalGroups={10} />)
    
    // Verifica textos
    expect(screen.getByText('Grupo 7 de 10')).toBeInTheDocument()
    expect(screen.getByText(/70%\s*conclu[ií]do/i)).toBeInTheDocument()
    
    // Verifica se a barra de progresso existe
    const progressBar = document.querySelector('.bg-primary')
    expect(progressBar).toBeInTheDocument()
  })

  it('deve lidar com casos extremos', () => {
    // Grupo maior que total (não deveria acontecer, mas teste de segurança)
    render(<ProgressBar currentGroup={12} totalGroups={10} />)
    
    expect(screen.getByText('Grupo 12 de 10')).toBeInTheDocument()
    expect(screen.getByText(/120%\s*conclu[ií]do/i)).toBeInTheDocument()
  })

  it('deve ter barra de progresso com cor primária', () => {
    render(<ProgressBar currentGroup={6} totalGroups={10} />)
    
    const progressBar = document.querySelector('.bg-primary')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveClass('h-2', 'rounded-full')
  })
})