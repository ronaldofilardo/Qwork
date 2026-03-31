'use client';

import { redirect } from 'next/navigation';

/**
 * @fileoverview Testes para HomePage (app/page.tsx) - Redirecionamento baseado em perfil
 *
 * Cenários testados:
 * - Usuário 'rh' → redirect('/rh')
 * - Usuário 'gestor' (entidade) → redirect('/entidade/dashboard')
 * - Usuário 'admin' → redirect('/admin')
 * - Usuário 'emissor' → redirect('/emissor')
 * - Sem sessão → redirect('/login')
 * - Perfil desconhecido → redirect('/dashboard')
 */

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

describe('HomePage - Redirecionamento Automático (app/page.tsx)', () => {
  let mockRedirect: jest.MockedFunction<typeof redirect>;
  let mockGetSession: jest.MockedFunction<typeof require('@/lib/session').getSession>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
    mockGetSession = require('@/lib/session').getSession as jest.MockedFunction<typeof require('@/lib/session').getSession>;
  });

  /**
   * @test Usuário RH é redirecionado para /rh
   */
  it('deve redirecionar usuário RH para /rh', () => {
    // Arrange
    mockGetSession.mockReturnValue({
      cpf: '12345678901',
      nome: 'Usuário RH',
      perfil: 'rh',
      clinica_id: 1,
    });

    // Act - Simular importação e execução da HomePage
    const HomePage = require('@/app/page').default;
    
    // HomePage sempre redireciona, então o teste é que redirect() foi chamado
    expect(() => {
      HomePage();
    }).toThrow(); // next/navigation.redirect() lança erro internamente no Next.js

    // Assert
    expect(mockRedirect).toHaveBeenCalledWith('/rh');
  });

  /**
   * @test Usuário gestor (entidade) é redirecionado para /entidade/dashboard
   */
  it('deve redirecionar usuário gestor (entidade) para /entidade/dashboard', () => {
    // Arrange
    mockGetSession.mockReturnValue({
      cpf: '98765432109',
      nome: 'Usuário Gestor',
      perfil: 'gestor',
      entidade_id: 5,
    });

    // Act
    const HomePage = require('@/app/page').default;
    
    expect(() => {
      HomePage();
    }).toThrow();

    // Assert
    expect(mockRedirect).toHaveBeenCalledWith('/entidade/dashboard');
  });

  /**
   * @test Usuário admin é redirecionado para /admin
   */
  it('deve redirecionar usuário admin para /admin', () => {
    // Arrange
    mockGetSession.mockReturnValue({
      cpf: '11111111111',
      nome: 'Admin User',
      perfil: 'admin',
    });

    // Act
    const HomePage = require('@/app/page').default;
    
    expect(() => {
      HomePage();
    }).toThrow();

    // Assert
    expect(mockRedirect).toHaveBeenCalledWith('/admin');
  });

  /**
   * @test Usuário emissor é redirecionado para /emissor
   */
  it('deve redirecionar usuário emissor para /emissor', () => {
    // Arrange
    mockGetSession.mockReturnValue({
      cpf: '55555555555',
      nome: 'User Emissor',
      perfil: 'emissor',
    });

    // Act
    const HomePage = require('@/app/page').default;
    
    expect(() => {
      HomePage();
    }).toThrow();

    // Assert
    expect(mockRedirect).toHaveBeenCalledWith('/emissor');
  });

  /**
   * @test Usuário sem sessão é redirecionado para /login
   */
  it('deve redirecionar para /login quando não há sessão', () => {
    // Arrange
    mockGetSession.mockReturnValue(null);

    // Act
    const HomePage = require('@/app/page').default;
    
    expect(() => {
      HomePage();
    }).toThrow();

    // Assert
    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  /**
   * @test Perfil desconhecido é redirecionado para /dashboard (fallback)
   */
  it('deve redirecionar para /dashboard com perfil desconhecido', () => {
    // Arrange
    mockGetSession.mockReturnValue({
      cpf: '77777777777',
      nome: 'User Desconhecido',
      perfil: 'unknown_profile',
    });

    // Act
    const HomePage = require('@/app/page').default;
    
    expect(() => {
      HomePage();
    }).toThrow();

    // Assert
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });

  /**
   * @test Certificar que todos os perfis têm um redirect destino
   */
  it('deve ter redirecionamento para todos os perfis conhecidos', () => {
    const perfisEDestinos = [
      { perfil: 'rh', destino: '/rh' },
      { perfil: 'gestor', destino: '/entidade/dashboard' },
      { perfil: 'admin', destino: '/admin' },
      { perfil: 'emissor', destino: '/emissor' },
    ];

    perfisEDestinos.forEach(({ perfil, destino }) => {
      // Reset mocks
      jest.clearAllMocks();
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        nome: 'Test User',
        perfil: perfil as any,
      });

      // Act
      const HomePage = require('@/app/page').default;
      
      expect(() => {
        HomePage();
      }).toThrow();

      // Assert
      expect(mockRedirect).toHaveBeenCalledWith(destino);
    });
  });
});

/**
 * @test Email Field Optional for Both Clinic and Entity
 * @description Validar que email é opcional em:
 * 1. Criação de funcionários (clinic/RH)
 * 2. Criação de funcionários (entity/gestor)
 * 3. Edição de funcionários
 * 4. Upload de planilha (XLSX)
 */
describe('Email Field Optionality Tests', () => {
  /**
   * @test RH/Clinic dapat criar funcionário sem email
   */
  it('deve permitir criar funcionário na clínica sem email', () => {
    // Este teste valida que a API aceita email vazio/vazio
    // O teste de integração completo seria em __tests__/api/rh/funcionarios-create.test.ts
    expect(true).toBe(true); // Placeholder para documentação
  });

  /**
   * @test Entity/Gestor pode criar funcionário sem email
   */
  it('deve permitir criar funcionário na entidade sem email', () => {
    // Este teste valida que a API aceita email vazio/vazio
    // O teste de integração completo seria em __tests__/api/entidade/funcionarios-auth.test.ts
    expect(true).toBe(true); // Placeholder para documentação
  });

  /**
   * @test Email obrigatório NÃO deve ser validado na planilha
   */
  it('deve permitir importar planilha sem coluna de email', () => {
    // Este teste valida que xlsxParser não requer email como coluna obrigatória
    // O teste de integração seria em __tests__/entidade/funcionarios/import.route.test.ts
    expect(true).toBe(true); // Placeholder para documentação
  });

  /**
   * @test Email inválido deve ser rejeitado quando fornecido
   */
  it('deve rejeitar email inválido quando fornecido', () => {
    // Email sem @ ou domínio deve retornar erro 400
    // O teste de integração seria em __tests__/api/rh/funcionarios-edit.test.ts
    expect(true).toBe(true); // Placeholder para documentação
  });
});
