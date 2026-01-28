import { render, screen } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'

// Mock do useRouter
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock do Header
jest.mock('@/components/Header', () => {
  return function MockHeader({ userName, userRole }: { userName: string; userRole: string }) {
    return <div data-testid="header">Header - {userName} ({userRole})</div>
  }
})

// Mock do fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve renderizar o componente DashboardPage', () => {
    // Mock para evitar loading infinito
    mockFetch.mockImplementationOnce(() =>
      new Promise(() => {}) // Nunca resolve
    )

    render(<DashboardPage />)

    // Verifica se o componente renderiza com loading (já que não resolve o fetch)
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('deve mostrar loading inicialmente', () => {
    mockFetch.mockImplementationOnce(() =>
      new Promise(() => {}) // Nunca resolve para manter loading
    )

    render(<DashboardPage />)

    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })
})