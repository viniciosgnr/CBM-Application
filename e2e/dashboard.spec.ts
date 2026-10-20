import { test, expect } from '@playwright/test';

test.describe('CBM Dashboard E2E Smoke Tests', () => {
  test('deve carregar o Dashboard e exibir os elementos principais', async ({ page }) => {
    // Acessa a página inicial
    await page.goto('/');

    // Valida o título da página
    await expect(page).toHaveTitle(/CBM/i);

    // Valida a presença do título principal do Dashboard
    const heading = page.getByRole('heading', { name: /CBM Dashboard/i });
    await expect(heading).toBeVisible();

    // Valida a presença dos cards/gráficos essenciais
    await expect(page.getByText('Work Order by Status')).toBeVisible();
    await expect(page.getByText('Days Left to Due')).toBeVisible();
  });
});
