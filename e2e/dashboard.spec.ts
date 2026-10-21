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
    const drawer = page.getByTestId('equipment-detail-drawer');
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

  test('deve exibir e persistir a razão de não coleta (Non-collection Reason) geral quando qualquer técnica estiver overdue', async ({ page }) => {
    // Reseta a razão para null antes do teste para garantir idempotência
    await page.request.put('/api/equipments/DNY_111-PKPD-0300', {
      data: { nonCollectionReason: null }
    });

    await page.goto('/');

    // Navega para a aba de Equipamentos
    const equipmentTab = page.getByRole('button', { name: /^Equipment$/i });
    await expect(equipmentTab).toBeVisible();
    await equipmentTab.click();

    // Valida que existem amostras de equipamentos em atraso (Overdue) visíveis na tabela
    const overdueBadges = page.locator('table tbody tr').getByText('Overdue');
    await expect(overdueBadges.first()).toBeVisible();
    const count = await overdueBadges.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Localiza e clica no equipamento DNY_111-PKPD-0300 (sem razão prévia, deve iniciar com "Not collected")
    const overdueRow = page.locator('table tbody tr', { hasText: 'DNY_111-PKPD-0300' });
    await expect(overdueRow).toBeVisible();
    await overdueRow.click();

    // Valida o Drawer
    const drawer = page.getByTestId('equipment-detail-drawer');
    await expect(drawer).toBeVisible();

    // Verifica que o seletor único geral de Non-collection Reason está visível
    const reasonSelect = drawer.locator('select[aria-label="Non-collection Reason"]');
    await expect(reasonSelect).toBeVisible();

    // Verifica que o valor padrão inicial é "Not collected"
    await expect(reasonSelect).toHaveValue('Not collected');

    // Verifica as opções sanitizadas sem prefixo "No Data"
    await expect(reasonSelect.locator('option', { hasText: 'Not collected' })).toBeAttached();
    await expect(reasonSelect.locator('option', { hasText: 'Awaiting Maintenance' })).toBeAttached();
    await expect(reasonSelect.locator('option', { hasText: 'No Safe Access' })).toBeAttached();
    await expect(reasonSelect.locator('option', { hasText: 'Process Not Running' })).toBeAttached();

    // Seleciona uma nova justificativa e valida o auto-save
    await reasonSelect.selectOption('Awaiting Maintenance');
    await expect(drawer.getByText('Saved ✓')).toBeVisible();

    // Fecha o Drawer
    const closeBtn = page.getByTitle('Close drawer');
    await closeBtn.click();
    await expect(drawer).not.toBeVisible();

    // Reabre o mesmo equipamento e confirma persistência
    await overdueRow.click();
    await expect(drawer).toBeVisible();
    await expect(reasonSelect).toHaveValue('Awaiting Maintenance');
  });

  test('deve exibir a coluna Next Collect na tabela de Equipamentos com ordenação funcional', async ({ page }) => {
    await page.goto('/');

    // Navega para a aba de Equipamentos
    const equipmentTab = page.getByRole('button', { name: /^Equipment$/i });
    await expect(equipmentTab).toBeVisible();
    await equipmentTab.click();

    // Valida a presença da coluna Next Collect no cabeçalho da tabela
    const nextCollectHeader = page.getByTitle('Sort by Next Collect');
    await expect(nextCollectHeader).toBeVisible();

    // Valida que a coluna Observation foi removida da tabela
    await expect(page.locator('table thead').getByText('Observation')).not.toBeVisible();

    // Valida que a tabela já inicia com indicador de ordenação ascendente (▲)
    await expect(nextCollectHeader.locator('text=▲')).toBeVisible();

    // Clica para ordenar de forma descendente (▼)
    await nextCollectHeader.click();
    await expect(nextCollectHeader.locator('text=▼')).toBeVisible();

    // Clica novamente para retornar a ordenação ascendente (▲)
    await nextCollectHeader.click();
    await expect(nextCollectHeader.locator('text=▲')).toBeVisible();
  });
});
