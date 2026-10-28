import { test, expect } from '@playwright/test';

test.describe('E2E Tests: CBM Case Status & Recommendation Drawer Interaction Flow', () => {

  test('1. Tabela de Recomendações deve exibir coluna CBM Case Status e lista de relatórios', async ({ page }) => {
    await page.goto('/');

    // 1. Aguarda hidratação completa da aplicação Next.js
    await expect(page.locator('main[data-hydrated="true"]')).toBeVisible({ timeout: 15000 });

    // 2. Clica na aba Recommendations e aguarda ativação
    const recomTab = page.getByRole('button', { name: /^Recommendations$/i });
    await recomTab.click();
    await expect(page.locator('main[data-active-tab="recommendations"]')).toBeVisible({ timeout: 10000 });

    // 3. Valida que o cabeçalho da tabela exibe a coluna CBM Case Status
    const thCaseStatus = page.locator('th', { hasText: 'CBM Case Status' });
    await expect(thCaseStatus).toBeVisible({ timeout: 10000 });

    // 4. Valida que as linhas da tabela contêm os badges de CBM Case Status
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    await expect(firstRow.locator('span.rounded-full').first()).toBeVisible();
  });

  test('2. Fluxo completo no Drawer: Vincular WO Completed -> Awaiting Feedback -> Avaliar Efetividade -> Closed', async ({ page }) => {
    await page.goto('/');

    // 1. Aguarda hidratação e navega para aba Recommendations
    await expect(page.locator('main[data-hydrated="true"]')).toBeVisible({ timeout: 15000 });
    const recomTab = page.getByRole('button', { name: /^Recommendations$/i });
    await recomTab.click();
    await expect(page.locator('main[data-active-tab="recommendations"]')).toBeVisible({ timeout: 10000 });

    // 2. Localiza e clica em uma linha da tabela para abrir o Drawer SLB
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });
    await tableRows.first().click();

    // 3. Drawer lateral deve abrir exibindo o Card Details
    const detailsCard = page.locator('h4', { hasText: /^Details$/i });
    await expect(detailsCard).toBeVisible({ timeout: 10000 });

    // 4. Localiza o dropdown de Work Order Number no card Details
    const woSelect = page.locator('select[title="Select Work Order assigned to this equipment"]');
    await expect(woSelect).toBeVisible({ timeout: 10000 });

    // 5. Verifica opções no dropdown
    const options = await woSelect.locator('option').allInnerTexts();
    expect(options.length).toBeGreaterThan(0);
    expect(options[0]).toContain('N/A');

    // 6. Seleciona uma WO Completed e valida comportamento do fluxo
    const completedOption = options.find(opt => opt.includes('Completed'));
    if (completedOption) {
      const woVal = await woSelect.locator(`option:has-text("${completedOption}")`).getAttribute('value');
      if (woVal) {
        await woSelect.selectOption(woVal);

        // Status deve ir para Awaiting Feedback (NUNCA auto-fechar para Closed!)
        await expect(page.getByText('Awaiting Feedback').first()).toBeVisible({ timeout: 5000 });

        // Seletor de efetividade deve estar DESBLOQUEADO
        const effSelect = page.locator('select').filter({ hasText: /Pending Assessment/i });
        await expect(effSelect).toBeVisible();
        await expect(effSelect).toBeEnabled();

        // Usuário seleciona 'Effective'
        await effSelect.selectOption('Effective');

        // Status deve transicionar automaticamente para Closed
        await expect(page.getByText('Closed').first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
