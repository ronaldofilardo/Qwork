/**
 * Testes de Integração E2E para RLS
 * Valida que o sistema funciona corretamente end-to-end com RLS ativo
 */

import { test, expect } from '@playwright/test';

test.describe('Integração E2E: Funcionário com RLS', () => {
  test.beforeEach(async ({ page }) => {
    // Login como funcionário
    await page.goto('/login');
    await page.fill('input[name="cpf"]', '22222222222');
    await page.fill('input[name="senha"]', 'senha123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('funcionário deve ver apenas suas próprias avaliações', async ({
    page,
  }) => {
    await page.goto('/avaliacao');

    // Verificar que a página carregou
    await expect(page).toHaveURL(/\/avaliacao/);

    // Não deve haver mensagens de erro de RLS
    const errorMessage = page.locator('text=/erro|error|denied|forbidden/i');
    await expect(errorMessage).not.toBeVisible();

    // Deve ver seus dados
    await expect(page.locator('text=Minhas Avaliações')).toBeVisible();
  });

  test('funcionário NÃO deve conseguir acessar dados de RH', async ({
    page,
  }) => {
    // Tentar acessar área de RH
    const response = await page.goto('/rh');

    // Deve ser redirecionado ou ver erro 403
    expect(response?.status()).least(400);
  });
});

test.describe('Integração E2E: RH com RLS', () => {
  test.beforeEach(async ({ page }) => {
    // Login como RH
    await page.goto('/login');
    await page.fill('input[name="cpf"]', '11111111111');
    await page.fill('input[name="senha"]', 'senha123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/rh');
  });

  test('RH deve ver apenas funcionários de sua clínica', async ({ page }) => {
    await page.goto('/rh/funcionarios');

    // Verificar que a lista carregou
    await expect(page.locator('table')).toBeVisible();

    // Não deve haver erros de RLS
    const errorMessage = page.locator('text=/erro|error|denied/i');
    await expect(errorMessage).not.toBeVisible();

    // Deve ver funcionários (pelo menos 1)
    const funcionarios = page.locator('tbody tr');
    await expect(funcionarios).toHaveCount({ min: 1 });
  });

  test('RH deve ver apenas empresas de sua clínica', async ({ page }) => {
    await page.goto('/rh/empresas');

    await expect(page).toHaveURL(/\/rh\/empresas/);

    // Verificar que empresas foram carregadas
    const empresas = page.locator('[data-testid="empresa-item"]');
    await expect(empresas.first()).toBeVisible();
  });

  test('RH NÃO deve ver dados de outras clínicas', async ({ page }) => {
    // Tentar acessar empresa de outra clínica via URL direta
    const response = await page.goto('/rh/empresa/999'); // ID de outra clínica

    // Deve retornar erro ou redirecionar
    expect(response?.status()).least(400);
  });
});

test.describe('Integração E2E: Admin com RLS', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/login');
    await page.fill('input[name="cpf"]', '88888888888');
    await page.fill('input[name="senha"]', 'senha123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('admin NÃO deve ver funcionários operacionais (sem vínculo)', async ({
    page,
  }) => {
    await page.goto('/admin/funcionarios');

    // Verificar que a lista carregou (página acessível)
    await expect(page.locator('table')).toBeVisible();

    // Admin não tem visão operacional: a tabela deve estar vazia ou sem linhas de funcionários
    const funcionarios = page.locator('tbody tr');
    const count = await funcionarios.count();
    expect(count).toBeLessThanOrEqual(0);
  });

  test('admin NÃO deve poder gerenciar empresas/editar (bloqueado)', async ({
    page,
  }) => {
    await page.goto('/admin/empresas');

    // Edit button não deve estar disponível para admin
    expect(await page.locator('[data-testid="edit-empresa"]').count()).toBe(0);
  });
});

test.describe('Auditoria E2E', () => {
  test('ações devem ser registradas em audit_logs', async ({
    page,
    request,
  }) => {
    // Login como admin
    await page.goto('/login');
    await page.fill('input[name="cpf"]', '88888888888');
    await page.fill('input[name="senha"]', 'senha123');
    await page.click('button[type="submit"]');

    // Criar funcionário (ação auditada)
    await page.goto('/admin/funcionarios');
    await page.click('button:has-text("Novo Funcionário")');
    await page.fill('input[name="cpf"]', '99988877766');
    await page.fill('input[name="nome"]', 'Teste Auditoria E2E');
    await page.fill('input[name="email"]', 'teste@example.com');
    await page.click('button[type="submit"]');

    // Verificar que foi criado
    await expect(page.locator('text=Teste Auditoria E2E')).toBeVisible();

    // Verificar audit_log via API (se disponível)
    const response = await request.get('/api/admin/audit-logs?cpf=99988877766');
    expect(response.ok()).toBe(true);

    const logs = await response.json();
    expect(logs).toContainEqual(
      expect.objectContaining({
        action: 'INSERT',
        resource: 'funcionarios',
      })
    );
  });
});
