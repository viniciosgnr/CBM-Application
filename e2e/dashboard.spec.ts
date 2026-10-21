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

  test('deve abrir o Drawer lateral de equipamento padronizado no Design System SLB', async ({ page }) => {
    await page.goto('/');

    // Navega para a aba de Equipamentos
    const equipmentTab = page.getByRole('button', { name: /^Equipment$/i });
    await expect(equipmentTab).toBeVisible();
    await equipmentTab.click();

    // Clica no primeiro equipamento da tabela para abrir o Drawer
    const firstEquipmentRow = page.locator('table tbody tr').first();
    await expect(firstEquipmentRow).toBeVisible();
    await firstEquipmentRow.click();

    // Valida os componentes do Design System SLB no Drawer lateral
    const drawer = page.locator('aside');
    await expect(drawer.getByText('Overall Status')).toBeVisible();
    await expect(drawer.getByText('Equipment Class')).toBeVisible();
    await expect(drawer.getByText('Latest Observation')).toBeVisible();
    await expect(drawer.getByText('Risk Indicators')).toBeVisible();
    await expect(drawer.getByText('Vibration Analysis')).toBeVisible();
    await expect(drawer.getByText('Lube Oil Analysis')).toBeVisible();
    await expect(drawer.getByText('Historical condition trend')).toBeVisible();
    await expect(drawer.getByRole('button', { name: /Log New Analysis/i })).toBeVisible();

    // Valida o botão de expandir/recolher
    const expandBtn = page.getByTitle('Expand drawer');
    await expect(expandBtn).toBeVisible();
    await expandBtn.click();
    await expect(page.getByTitle('Collapse drawer')).toBeVisible();

    // Fecha o Drawer pelo botão X
    const closeBtn = page.getByTitle('Close drawer');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Verifica que o Drawer fechou
    await expect(page.getByText('Overall Status')).not.toBeVisible();
  });
});
