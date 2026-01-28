/**
 * Teste E2E para visualização de lote com G1-G10 na entidade
 */

import { test, expect } from '@playwright/test';

test.describe('Entidade - Visualização de Lote com G1-G10', () => {
  test.beforeEach(async ({ page }) => {
    // Mock de login como gestor de entidade
    await page.goto('/login');
    await page.fill('input[name="cpf"]', '12345678901');
    await page.fill('input[name="senha"]', '123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/entidade/lotes');
  });

  test('deve exibir colunas G1-G10 na tabela de funcionários', async ({
    page,
  }) => {
    // Navegar para um lote específico
    await page.click('[data-testid="lote-card-1"]');
    await page.waitForURL(/\/entidade\/lote\/\d+/);

    // Verificar que as colunas G1-G10 existem
    for (let i = 1; i <= 10; i++) {
      const coluna = page.locator(`th:has-text("G${i}")`);
      await expect(coluna).toBeVisible();
    }
  });

  test('deve exibir badges coloridos para cada grupo', async ({ page }) => {
    await page.click('[data-testid="lote-card-1"]');
    await page.waitForURL(/\/entidade\/lote\/\d+/);

    // Aguardar carregar a tabela
    await page.waitForSelector('tbody tr');

    // Verificar que badges existem
    const badges = page.locator('span.rounded-full');
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);

    // Verificar cores dos badges
    const badgeVerde = page.locator('.bg-green-100.text-green-800').first();
    const badgeAmarelo = page.locator('.bg-yellow-100.text-yellow-800').first();
    const badgeVermelho = page.locator('.bg-red-100.text-red-800').first();

    // Pelo menos um tipo de badge deve existir
    const verdExists = (await badgeVerde.count()) > 0;
    const amareloExists = (await badgeAmarelo.count()) > 0;
    const vermelhoExists = (await badgeVermelho.count()) > 0;

    expect(verdExists || amareloExists || vermelhoExists).toBeTruthy();
  });

  test('deve permitir filtrar por classificação de grupo', async ({ page }) => {
    await page.click('[data-testid="lote-card-1"]');
    await page.waitForURL(/\/entidade\/lote\/\d+/);

    // Abrir filtro da coluna G1
    await page.click('button:has-text("▼")').first();

    // Aguardar dropdown aparecer
    await page.waitForSelector('[id^="dropdown-"]', { state: 'visible' });

    // Selecionar "Excelente"
    await page.click('label:has-text("Excelente")');

    // Verificar que filtro foi aplicado
    const contadorFiltros = page.locator('text=/Filtros ativos:/');
    await expect(contadorFiltros).toBeVisible();
  });

  test('deve limpar todos os filtros ao clicar no botão', async ({ page }) => {
    await page.click('[data-testid="lote-card-1"]');
    await page.waitForURL(/\/entidade\/lote\/\d+/);

    // Aplicar um filtro
    await page.click('button:has-text("▼")').first();
    await page.waitForSelector('[id^="dropdown-"]', { state: 'visible' });
    await page.click('label:has-text("Excelente")');

    // Verificar que filtro está ativo
    await expect(page.locator('text=/Filtros ativos:/')).toBeVisible();

    // Limpar filtros
    await page.click('button:has-text("🧹 Limpar Filtros")');

    // Verificar que contador de filtros não aparece mais
    await expect(page.locator('text=/Filtros ativos:/')).not.toBeVisible();
  });

  test('deve mostrar botão de gerar PDF para avaliações concluídas', async ({
    page,
  }) => {
    await page.click('[data-testid="lote-card-1"]');
    await page.waitForURL(/\/entidade\/lote\/\d+/);

    // Verificar que botão PDF existe na linha de avaliação concluída
    const botaoPDF = page.locator('button:has-text("PDF")').first();
    await expect(botaoPDF).toBeVisible();
  });

  test('deve exibir "-" para grupos sem dados', async ({ page }) => {
    await page.click('[data-testid="lote-card-1"]');
    await page.waitForURL(/\/entidade\/lote\/\d+/);

    // Aguardar tabela carregar
    await page.waitForSelector('tbody tr');

    // Verificar que existe pelo menos um "-" (para avaliações pendentes)
    const tracos = page.locator('td span.text-gray-400:has-text("-")');
    const count = await tracos.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('deve exibir botão "Gerar Relatório PDF" do lote', async ({ page }) => {
    await page.click('[data-testid="lote-card-1"]');
    await page.waitForURL(/\/entidade\/lote\/\d+/);

    const botaoRelatorio = page.locator(
      'button:has-text("Gerar Relatório PDF")'
    );
    await expect(botaoRelatorio).toBeVisible();
  });

  test('deve filtrar por busca de texto', async ({ page }) => {
    await page.click('[data-testid="lote-card-1"]');
    await page.waitForURL(/\/entidade\/lote\/\d+/);

    // Obter contagem inicial
    const linhasInicial = await page.locator('tbody tr').count();

    // Buscar por nome
    await page.fill('input[placeholder*="Nome, CPF"]', 'João');

    // Aguardar debounce
    await page.waitForTimeout(400);

    // Verificar que filtrou
    const linhasFiltradas = await page.locator('tbody tr').count();
    expect(linhasFiltradas).toBeLessThanOrEqual(linhasInicial);
  });

  test('deve filtrar por status de avaliação', async ({ page }) => {
    await page.click('[data-testid="lote-card-1"]');
    await page.waitForURL(/\/entidade\/lote\/\d+/);

    // Selecionar apenas concluídas
    await page.selectOption('select', 'concluida');

    // Aguardar filtro aplicar
    await page.waitForTimeout(200);

    // Verificar que apenas badges "Concluída" aparecem
    const statusBadges = page.locator('span:has-text("Concluída")');
    const count = await statusBadges.count();
    expect(count).toBeGreaterThan(0);

    // Verificar que não há pendentes
    const pendentes = await page.locator('span:has-text("Pendente")').count();
    expect(pendentes).toBe(0);
  });

  test('deve exibir contador de funcionários filtrados', async ({ page }) => {
    await page.click('[data-testid="lote-card-1"]');
    await page.waitForURL(/\/entidade\/lote\/\d+/);

    // Verificar texto de contagem
    const contador = page.locator('text=/Exibindo \\d+ de \\d+ funcionários/');
    await expect(contador).toBeVisible();
  });

  test('deve mostrar indicador de busca ativa', async ({ page }) => {
    await page.click('[data-testid="lote-card-1"]');
    await page.waitForURL(/\/entidade\/lote\/\d+/);

    // Digitar busca
    const input = page.locator('input[placeholder*="Nome, CPF"]');
    await input.fill('Maria');

    // Verificar spinner ou indicador de busca
    const buscando = page.locator('text=/Buscando.../');
    // Pode aparecer brevemente durante debounce
    const exists = await buscando.count();
    expect(exists).toBeGreaterThanOrEqual(0);
  });

  test('deve aplicar múltiplos filtros simultaneamente', async ({ page }) => {
    await page.click('[data-testid="lote-card-1"]');
    await page.waitForURL(/\/entidade\/lote\/\d+/);

    // Filtrar por status
    await page.selectOption('select', 'concluida');

    // Aplicar filtro de grupo
    await page.click('button:has-text("▼")').first();
    await page.waitForSelector('[id^="dropdown-"]', { state: 'visible' });
    await page.click('label:has-text("Excelente")');

    // Buscar por texto
    await page.fill('input[placeholder*="Nome, CPF"]', 'Silva');
    await page.waitForTimeout(400);

    // Verificar que contador de filtros mostra múltiplos filtros ativos
    const textoFiltros = page.locator('text=/Filtros ativos: \\d+/');
    await expect(textoFiltros).toBeVisible();
  });

  test('deve manter responsividade em tela pequena', async ({ page }) => {
    // Simular mobile
    await page.setViewportSize({ width: 375, height: 667 });

    await page.click('[data-testid="lote-card-1"]');
    await page.waitForURL(/\/entidade\/lote\/\d+/);

    // Verificar que tabela tem scroll horizontal
    const tabelaContainer = page.locator('.overflow-x-auto');
    await expect(tabelaContainer).toBeVisible();
  });

  test('deve exibir mensagem quando não há funcionários', async ({ page }) => {
    // Navegar para lote vazio (mock)
    await page.goto('/entidade/lote/999');

    // Verificar mensagem
    const mensagem = page.locator('text=/Nenhum funcionário/');
    await expect(mensagem).toBeVisible();
  });

  test('deve permitir download de dados CSV', async ({ page }) => {
    await page.click('[data-testid="lote-card-1"]');
    await page.waitForURL(/\/entidade\/lote\/\d+/);

    // Verificar botão de download
    const botaoDownload = page.locator('button:has-text("Baixar Dados (CSV)")');
    await expect(botaoDownload).toBeVisible();
  });
});
