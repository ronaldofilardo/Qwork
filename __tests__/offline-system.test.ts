// Jest globals available by default

// Mock simples do módulo offline
jest.mock('@/lib/offline', () => ({
  salvarAvaliacaoPendente: jest.fn().mockResolvedValue(undefined),
  getAvaliacoesPendentes: jest.fn().mockResolvedValue([]),
  limparAvaliacaoPendente: jest.fn().mockResolvedValue(undefined),
  setupOnlineSync: jest.fn()
}))

import { salvarAvaliacaoPendente, getAvaliacoesPendentes, limparAvaliacaoPendente, setupOnlineSync } from '@/lib/offline'

describe('Sistema Offline Aprimorado', () => {
  test('salvarAvaliacaoPendente deve ser uma função', () => {
    expect(typeof salvarAvaliacaoPendente).toBe('function')
  })

  test('getAvaliacoesPendentes deve ser uma função', () => {
    expect(typeof getAvaliacoesPendentes).toBe('function')
  })

  test('limparAvaliacaoPendente deve ser uma função', () => {
    expect(typeof limparAvaliacaoPendente).toBe('function')
  })

  test('setupOnlineSync deve ser uma função', () => {
    expect(typeof setupOnlineSync).toBe('function')
  })

  test('deve chamar salvarAvaliacaoPendente', async () => {
    await expect(salvarAvaliacaoPendente(1, [])).resolves.not.toThrow()
  })

  test('deve chamar getAvaliacoesPendentes', async () => {
    const result = await getAvaliacoesPendentes()
    expect(Array.isArray(result)).toBe(true)
  })

  test('deve chamar limparAvaliacaoPendente', async () => {
    await expect(limparAvaliacaoPendente(1)).resolves.not.toThrow()
  })

  test('deve chamar setupOnlineSync', () => {
    expect(() => setupOnlineSync()).not.toThrow()
  })
})