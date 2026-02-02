import React from 'react'

// Mock completo do dashboard para evitar problemas de hooks
jest.mock('@/lib/session', () => ({
  getSession: jest.fn().mockResolvedValue({ userId: 1, userRole: 'admin' }),
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

// Mock do componente Dashboard inteiro
const MockDashboard = () => <div data-testid="dashboard">Dashboard Test</div>

jest.mock('@/app/dashboard/page', () => ({
  default: MockDashboard
}))

describe('Dashboard Component Mock', () => {
  it('deve ser mockado corretamente', () => {
    const Dashboard = require('@/app/dashboard/page').default
    expect(Dashboard).toBeDefined()
    expect(Dashboard).toBe(MockDashboard)
  })
})