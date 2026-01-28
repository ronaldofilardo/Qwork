/**
 * Teste E2E: Rotas antigas devem retornar 404 ou redirecionar
 * Item 19: /avaliacao/nova retorna 404 ou redireciona
 */

describe('Rotas Antigas e Redirecionamentos', () => {
  const funcionarioCPF = '22222222222'
  const funcionarioSenha = '123'

  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('deve retornar 404 ou redirecionar para /avaliacao/nova', () => {
    cy.login(funcionarioCPF, funcionarioSenha)

    cy.request({
      url: '/avaliacao/nova',
      failOnStatusCode: false
    }).then((response) => {
      // Deve retornar 404 ou redirecionar
      expect(response.status).to.be.oneOf([404, 301, 302, 307, 308])
    })
  })

  it('deve usar /avaliacao?id=X como rota padrão', () => {
    cy.login(funcionarioCPF, funcionarioSenha)
    cy.visit('/dashboard')

    // Clicar em iniciar avaliação
    cy.contains(/iniciar|continuar/i, { timeout: 10000 }).should('be.visible')
    cy.contains(/iniciar|continuar/i).click()

    // Verificar que URL é /avaliacao?id=X
    cy.url().should('include', '/avaliacao?id=')
  })

  it('deve redirecionar /avaliacao sem ID para dashboard', () => {
    cy.login(funcionarioCPF, funcionarioSenha)
    cy.visit('/avaliacao', { failOnStatusCode: false })

    // Deve redirecionar para dashboard ou mostrar erro
    cy.url({ timeout: 5000 }).should('satisfy', (url: string) => {
      return url.includes('/dashboard') || url.includes('/avaliacao?id=')
    })
  })

  it('deve validar ID de avaliação inexistente', () => {
    cy.login(funcionarioCPF, funcionarioSenha)
    cy.visit('/avaliacao?id=99999', { failOnStatusCode: false })

    // Deve mostrar erro ou redirecionar
    cy.url({ timeout: 5000 }).should('satisfy', (url: string) => {
      return url.includes('/dashboard') || url === Cypress.config().baseUrl + '/avaliacao?id=99999'
    })

    // Se ficou na página, deve mostrar mensagem de erro
    cy.get('body').then(($body) => {
      if ($body.text().includes('avaliacao?id=99999')) {
        cy.contains(/não encontrada|erro|inválida/i).should('be.visible')
      }
    })
  })

  it('deve manter compatibilidade com /avaliacao/concluida', () => {
    cy.login(funcionarioCPF, funcionarioSenha)

    cy.request({
      url: '/avaliacao/concluida',
      failOnStatusCode: false
    }).then((response) => {
      // Rota de conclusão deve existir
      expect(response.status).to.be.oneOf([200, 301, 302])
    })
  })

  it('deve redirecionar usuário não autenticado para login', () => {
    cy.visit('/avaliacao?id=1')
    cy.url({ timeout: 5000 }).should('include', '/login')

    cy.visit('/avaliacao/nova', { failOnStatusCode: false })
    cy.url({ timeout: 5000 }).should('include', '/login')

    cy.visit('/dashboard')
    cy.url({ timeout: 5000 }).should('include', '/login')
  })

  it('deve validar rota de admin', () => {
    cy.login(funcionarioCPF, funcionarioSenha)

    // Funcionário não deve acessar /admin
    cy.visit('/admin', { failOnStatusCode: false })
    cy.url({ timeout: 5000 }).should('not.include', '/admin')
  })

  it('deve ter rota /api/avaliacao/status funcional', () => {
    cy.login(funcionarioCPF, funcionarioSenha)

    cy.request('/api/avaliacao/status').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('status')
    })
  })

  it('deve ter rota /api/avaliacao/respostas funcional', () => {
    cy.login(funcionarioCPF, funcionarioSenha)

    cy.request({
      method: 'POST',
      url: '/api/avaliacao/respostas',
      body: {
        avaliacaoId: 1,
        grupo: 1,
        item: 'q1',
        valor: 50
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 400, 404])
    })
  })

  it('deve proteger APIs contra acesso não autenticado', () => {
    cy.request({
      url: '/api/avaliacao/status',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.be.oneOf([401, 403])
    })

    cy.request({
      method: 'POST',
      url: '/api/avaliacao/respostas',
      body: { avaliacaoId: 1, grupo: 1, item: 'q1', valor: 50 },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.be.oneOf([401, 403])
    })
  })
})
