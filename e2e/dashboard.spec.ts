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
    // Reseta a razão e garante datas de atraso (Overdue) antes do teste para garantir idempotência
    await page.request.put('/api/equipments/DNY_111-PKPD-0300', {
      data: {
        condition: 'Good - Tier 4',
        lastVibrationUpdate: '01/07/2026, 10:30:00',
        lastLubeOilUpdate: '01/05/2026, 10:00:00',
        nonCollectionReason: null
      }
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

  test('deve permitir seleção em batelada e atualização automática de status (Bulk Update) para equipamentos Overdue Good Tier 4', async ({ page }) => {
    // Garante que o equipamento DNY_111-PKPD-0300 está em Overdue Good - Tier 4
    await page.request.put('/api/equipments/DNY_111-PKPD-0300', {
      data: {
        condition: 'Good - Tier 4',
        lastVibrationUpdate: '01/07/2026, 10:30:00',
        lastLubeOilUpdate: '01/05/2026, 10:00:00',
        nonCollectionReason: null
      }
    });

    await page.goto('/');

    // Navega para a aba de Equipamentos
    const equipmentTab = page.getByRole('button', { name: /^Equipment$/i });
    await expect(equipmentTab).toBeVisible();
    await equipmentTab.click();

    // Valida o checkbox de seleção geral no cabeçalho
    const selectAllCheckbox = page.locator('th input[aria-label="Select all eligible equipments"]');
    await expect(selectAllCheckbox).toBeVisible();

    // Clica para selecionar todos os elegíveis da tabela
    await selectAllCheckbox.click();

    // O botão de Bulk Update deve aparecer no topo da tabela
    const bulkButton = page.getByRole('button', { name: /Update Status in Bulk/i });
    await expect(bulkButton).toBeVisible();

    // Clica no botão para abrir o modal de confirmação
    await bulkButton.click();

    // Valida o modal de confirmação em inglês
    await expect(page.getByText('Good - Tier 4 Overdue Surveillance')).toBeVisible();
    await expect(page.getByText(/Confirm update of/i)).toBeVisible();

    // Clica em Confirm
    const confirmBtn = page.getByRole('button', { name: 'Confirm' });
    await confirmBtn.click();

    // O modal deve fechar e o botão de bulk sumir (pois seleções foram processadas)
    await expect(bulkButton).not.toBeVisible();

    // Re-garante os equipamentos de amostragem em Overdue Good - Tier 4 para visualização do usuário
    await page.request.put('/api/equipments/UNY_111-PKPD-5200', {
      data: {
        condition: 'Good - Tier 4',
        vibrationStatus: 'Good - Tier 4',
        lubeOilStatus: 'Good - Tier 4',
        lastVibrationUpdate: '18/06/2026, 10:30:00',
        lastLubeOilUpdate: '18/04/2026, 10:00:00',
        nonCollectionReason: null,
      },
    });
    await page.request.put('/api/equipments/PTY_111-PKPD-5100', {
      data: {
        condition: 'Good - Tier 4',
        vibrationStatus: 'Good - Tier 4',
        lubeOilStatus: 'Good - Tier 4',
        lastVibrationUpdate: '05/07/2026, 10:30:00',
        lastLubeOilUpdate: '05/05/2026, 10:00:00',
        nonCollectionReason: null,
      },
    });
  });

  test('deve navegar para a aba de KPIs, filtrar por tecnologia/mês, alternar as 3 trends e exibir a tabela de relatório mensal com banner e colunas em inglês', async ({ page }) => {
    await page.goto('/');

    // Navega para a aba de KPIs
    const kpiTab = page.getByRole('button', { name: /^KPIs$/i });
    await expect(kpiTab).toBeVisible();
    await kpiTab.click();

    // Valida os 3 cards de snapshot
    await expect(page.getByRole('heading', { name: /Fault Risk & Overall Health/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Compliance Risk/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /CBM Total Risk/i })).toBeVisible();

    // Valida os dois novos gráficos de rosquinha (Collection Compliance e Failure Mechanisms)
    await expect(page.getByText(/Collection Compliance & Non-Collection Reasons/i)).toBeVisible();
    await expect(page.getByText(/^Failure Mechanisms$/i)).toBeVisible();

    // Valida a barra de filtros: Vessel Scope, Month e Technology
    await expect(page.getByText('Vessel Scope:')).toBeVisible();
    await expect(page.getByText('Month:')).toBeVisible();
    await expect(page.getByText('Technology:')).toBeVisible();

    // Valida os botões exclusivos de tecnologia
    const vibBtn = page.getByRole('button', { name: 'Vibration' });
    const oilBtn = page.getByRole('button', { name: 'Lub Oil' });
    await expect(vibBtn).toBeVisible();
    await expect(oilBtn).toBeVisible();

    // Valida as tabs de tendências no card de trends (todas com azul padrão SLB quando ativas)
    const healthTrendBtn = page.getByRole('button', { name: 'Overall Health' });
    await expect(healthTrendBtn).toBeVisible();
    await expect(healthTrendBtn).toHaveClass(/bg-accent-blue/);

    const compTrendBtn = page.getByRole('button', { name: 'Compliance Risk' });
    await expect(compTrendBtn).toBeVisible();
    await compTrendBtn.click();
    await expect(page.getByText(/Compliance Risk Trend/i)).toBeVisible();
    await expect(compTrendBtn).toHaveClass(/bg-accent-blue/);

    const riskTrendBtn = page.getByRole('button', { name: 'CBM Total Risk' });
    await expect(riskTrendBtn).toBeVisible();
    await riskTrendBtn.click();
    await expect(page.getByText(/CBM Total Risk Trend/i)).toBeVisible();
    await expect(riskTrendBtn).toHaveClass(/bg-accent-blue/);

    // Valida a nova tabela de relatório mensal (Monthly CBM Routine Report)
    await expect(page.getByText('Monthly CBM Routine Report')).toBeVisible();
    await expect(page.getByText(/Vibration Routine/i)).toBeVisible();

    // Valida os cabeçalhos das 5 colunas em inglês (com coluna única para o mês selecionado)
    const reportTable = page.locator('table').last();
    await expect(reportTable.locator('th', { hasText: 'Frequency' })).toBeVisible();
    await expect(reportTable.locator('th', { hasText: 'FPSO' })).toBeVisible();
    await expect(reportTable.locator('th', { hasText: 'Equipment' })).toBeVisible();
    await expect(reportTable.locator('th', { hasText: /Status \(/i })).toBeVisible();
    await expect(reportTable.locator('th', { hasText: 'WO' })).toBeVisible();

    // Valida que a primeira linha exibe o caso mais crítico/degradado no topo com WO
    const firstRow = reportTable.locator('tbody tr').first();
    await expect(firstRow).toBeVisible();
    await expect(firstRow.locator('td').nth(3)).toContainText(/Tier 1|Tier 2/i);

    // Valida que clicar na linha do caso crítico/degradado abre direto o modal CBM Analysis Report Details
    await firstRow.click();
    await expect(page.getByText('CBM Analysis Report Details')).toBeVisible();

    // Fecha o modal de detalhes do relatório
    const closeReportBtn = page.locator('button[title="Close"]').last();
    await closeReportBtn.click();
    await expect(page.getByText('CBM Analysis Report Details')).not.toBeVisible();

    // Testa a alternância para tecnologia Lub Oil
    await oilBtn.click();
    await expect(page.getByText(/Lub Oil Routine/i)).toBeVisible();
  });

  test('deve filtrar corretamente pelas colunas da tabela Equipment List sem bolinhas coloridas nas opções de condição', async ({ page }) => {
    await page.goto('/');

    // Navega para a aba de Equipamentos
    const equipmentTab = page.getByRole('button', { name: /^Equipment$/i });
    await expect(equipmentTab).toBeVisible();
    await equipmentTab.click();

    // 1. Testa filtro da coluna Equip. CBM Condition
    const conditionHeader = page.locator('th', { hasText: 'Equip. CBM Condition' });
    await expect(conditionHeader).toBeVisible();

    // Clica no ícone de filtro da coluna condition
    const conditionFilterTrigger = conditionHeader.locator('svg').last();
    await conditionFilterTrigger.click();

    // Valida opções de Tiers no popover
    const popover = page.locator('div.absolute.top-full');
    await expect(popover.getByText('(Select All)')).toBeVisible();
    await expect(popover.getByText('Critical - Tier 1')).toBeVisible();
    await expect(popover.getByText('Degraded - Tier 2')).toBeVisible();
    await expect(popover.getByText('Good - Tier 3')).toBeVisible();
    await expect(popover.getByText('Good - Tier 4')).toBeVisible();

    // Confirma que não há bolinhas coloridas dentro dos labels do popover
    const coloredDotsInPopover = popover.locator('label span.rounded-full');
    await expect(coloredDotsInPopover).toHaveCount(0);

    // Clica em (Select All) para desmarcar tudo
    await popover.getByText('(Select All)').click();

    // Marca apenas Good - Tier 4
    await popover.getByText('Good - Tier 4').click();

    // Fecha o popover clicando fora ou no cabeçalho
    await conditionHeader.click();

    // Valida que o botão Reset Filters aparece
    const resetFiltersBtn = page.getByRole('button', { name: /Reset Filters/i });
    await expect(resetFiltersBtn).toBeVisible();

    // Clica em Reset Filters
    await resetFiltersBtn.click();
    await expect(resetFiltersBtn).not.toBeVisible();
  });
});
