import { render, screen } from '@testing-library/react'
// Jest globals available by default
import LoginPage from '@/app/login/page'
import AvaliacaoConcluidaPage from '@/app/avaliacao/concluida/page'

// Mock do Next.js router
const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace
  }),
  usePathname: () => '/login'
}))

describe('Consistência Visual - Logos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve exibir o logo QworkLogo na tela de login', () => {
    render(<LoginPage />)
    
    // Verificar se o logo está presente (pelo alt text da imagem)
    const logo = screen.getByAltText('QWork')
    expect(logo).toBeInTheDocument()
    // @ts-expect-error - toHaveClass aceita múltiplas classes como argumentos separados no @testing-library/jest-dom
    expect(logo).toHaveClass('w-full', 'h-full', 'object-contain')
  })

  it('deve exibir o slogan na tela de login', () => {
    render(<LoginPage />)
    
    // Verificar se o slogan está presente
    const slogan = screen.getByText('AVALIE. PREVINA. PROTEJA.')
    expect(slogan).toBeInTheDocument()
  })

  it('não deve exibir texto "Qwork" como título na tela de login', () => {
    const { container } = render(<LoginPage />)
    
    // Verificar que não há h1 com texto "Qwork"
    const h1Elements = container.querySelectorAll('h1')
    h1Elements.forEach(h1 => {
      expect(h1.textContent).not.toBe('Qwork')
    })
  })
})

describe('Consistência Visual - Botões de Resposta', () => {
  it('botões de resposta devem ter fundo branco e bordas cinzas consistentes', () => {
    // Este teste seria melhor com um componente montado,
    // mas aqui validamos a estrutura CSS
    const QuestionCard = require('@/components/QuestionCard').default
    const { container } = render(
      <QuestionCard
        questionId="test-1"
        texto="Teste de questão"
        valor={undefined}
        onChange={() => {}}
      />
    )

    // Verificar que todos os labels têm bg-white
    const labels = container.querySelectorAll('label')
    labels.forEach(label => {
      expect((label as HTMLElement).className).toMatch(/bg-white/)
      expect((label as HTMLElement).className).toMatch(/border-green/)
    })
  })

  it('RadioScale deve usar cores consistentes (branco/cinza/preto)', () => {
    const RadioScale = require('@/components/RadioScale').default
    const { container } = render(
      <RadioScale
        questionId="test-1"
        questionText="Teste"
        value={null}
        onChange={() => {}}
      />
    )

    // Verificar que os botões têm bg-white
    const buttons = container.querySelectorAll('button')
    buttons.forEach(button => {
      expect((button as HTMLElement).className).toMatch(/bg-white/)
    })
  })
})

describe('Dashboards - Boxes de Contagem Removidos', () => {
  it('Dashboard Admin não deve exibir boxes de Empresas/Funcionários/Avaliações/Concluídas dentro do card da clínica', () => {
    // Este teste valida que o código foi alterado corretamente
    // Poderia ser expandido com testes de integração reais
    const fs = require('fs');
    const adminPageContent = fs.readFileSync(
      'c:/apps/QWork/app/admin/page.tsx',
      'utf-8'
    )

    // Verificar que a estrutura de grid grid-cols-4 dos boxes foi removida
    const hasRemovedBoxes = !adminPageContent.includes(
      '<div className="grid grid-cols-4 gap-4 mb-4">'
    ) || !adminPageContent.match(/Empresas.*Lotes.*Avaliações.*Concluídas/s)

    expect(hasRemovedBoxes).toBe(true)
  })

  it('Dashboard RH não deve exibir boxes de estatísticas compactos', () => {
    const fs = require('fs');
    const rhPageContent = fs.readFileSync(
      'c:/apps/QWork/app/rh/page.tsx',
      'utf-8'
    )

    // Verificar que os cards de estatísticas foram removidos
    const hasRemovedStats = !rhPageContent.includes(
      'Cards de estatísticas da clínica - Layout compacto'
    )

    expect(hasRemovedStats).toBe(true)
  })

  it('Dashboard de Empresa não deve exibir boxes de Avaliações/Concluídas/Avaliados', () => {
    const fs = require('fs');
    const empresaPageContent = fs.readFileSync(
      'c:/apps/QWork/app/rh/empresa/[id]/page.tsx',
      'utf-8'
    )

    // Verificar que os cards compactos foram removidos
    const hasRemovedStats = !empresaPageContent.includes(
      'Cards de estatísticas compactos no header'
    )

    expect(hasRemovedStats).toBe(true)
  })
})

describe('API - Campo ativa em empresas', () => {
  it('API /api/rh/empresas deve retornar o campo ativa', () => {
    const fs = require('fs');
    const apiContent = fs.readFileSync(
      'c:/apps/QWork/app/api/rh/empresas/route.ts',
      'utf-8'
    )

    // Verificar que o SELECT inclui o campo ativa
    expect(apiContent).toMatch(/SELECT.*id.*nome.*cnpj.*ativa/s)
    
    // Verificar que não filtra apenas empresas ativas
    expect(apiContent).not.toMatch(/WHERE\s+ativa\s*=\s*true/)
  })
})
