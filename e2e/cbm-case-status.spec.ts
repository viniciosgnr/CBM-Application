import { test, expect } from '@playwright/test';
import { resolveCbmCaseStatus } from '../src/utils/cbmCaseStatus';

test.describe('CBM Case Status & Work Order Link Specification Tests', () => {

  test('Unit: Good Tier 4 e Tier 3 devem ter CBM Case Status "Closed" direto e efetividade "N/A"', () => {
    const resT4 = resolveCbmCaseStatus('Good - Tier 4', 'In Progress', null);
    expect(resT4.cbmCaseStatus).toBe('Closed');
    expect(resT4.effectiveness).toBe('N/A');

    const resT3 = resolveCbmCaseStatus('Good - Tier 3', null, 'Effective');
    expect(resT3.cbmCaseStatus).toBe('Closed');
    expect(resT3.effectiveness).toBe('N/A');
  });

  test('Unit: Degraded e Critical sem WO ou com WO Opened/In Progress devem iniciar em "Awaiting Action"', () => {
    const resNoWo = resolveCbmCaseStatus('Degraded - Tier 2', null, null);
    expect(resNoWo.cbmCaseStatus).toBe('Awaiting Action');

    const resInProgress = resolveCbmCaseStatus('Critical - Tier 1', 'In Progress', null);
    expect(resInProgress.cbmCaseStatus).toBe('Awaiting Action');

    const resPending = resolveCbmCaseStatus('Critical - Tier 1', 'Pending', null);
    expect(resPending.cbmCaseStatus).toBe('Awaiting Action');
  });

  test('Unit: Quando WO for "Completed", recomendação deve ir para "Awaiting Feedback" e ao inserir efetividade ir para "Closed"', () => {
    // 1. WO completada sem efetividade inserida
    const resCompletedPending = resolveCbmCaseStatus('Degraded - Tier 2', 'Completed', null);
    expect(resCompletedPending.cbmCaseStatus).toBe('Awaiting Feedback');
    expect(resCompletedPending.effectiveness).toBe('Pending Assessment');

    // 2. Com efetividade Effective -> Closed
    const resEffective = resolveCbmCaseStatus('Degraded - Tier 2', 'Completed', 'Effective');
    expect(resEffective.cbmCaseStatus).toBe('Closed');
    expect(resEffective.effectiveness).toBe('Effective');

    // 3. Com efetividade Partially Effective -> Closed
    const resPartially = resolveCbmCaseStatus('Critical - Tier 1', 'Completed', 'Partially Effective');
    expect(resPartially.cbmCaseStatus).toBe('Closed');

    // 4. Com efetividade Ineffective -> Closed
    const resIneffective = resolveCbmCaseStatus('Degraded - Tier 2', 'Completed', 'Ineffective');
    expect(resIneffective.cbmCaseStatus).toBe('Closed');

    // 5. Com efetividade Not Yet Assessable -> Closed
    const resNotYet = resolveCbmCaseStatus('Degraded - Tier 2', 'Completed', 'Not Yet Assessable');
    expect(resNotYet.cbmCaseStatus).toBe('Closed');
  });

  test('Unit: Se a WO for "Cancelled", a recomendação deve ir para "Cancelled"', () => {
    const resCancelled = resolveCbmCaseStatus('Degraded - Tier 2', 'Cancelled', null);
    expect(resCancelled.cbmCaseStatus).toBe('Cancelled');

    const resCritCancelled = resolveCbmCaseStatus('Critical - Tier 1', 'Cancelled', null);
    expect(resCritCancelled.cbmCaseStatus).toBe('Cancelled');
  });

  test('E2E: Tabela de Recommendations deve exibir a coluna "CBM Case Status" com badges', async ({ page }) => {
    await page.goto('/');

    // Clica na aba Recommendations
    const recomTab = page.getByRole('button', { name: /^Recommendations$/i });
    await expect(recomTab).toBeVisible();
    await recomTab.click();

    // Valida a coluna "CBM Case Status" no cabeçalho
    const header = page.locator('th', { hasText: 'CBM Case Status' });
    await expect(header).toBeVisible();

    // Valida que existem badges de CBM Case Status renderizados
    const closedBadge = page.locator('table tbody tr').getByText('Closed').first();
    await expect(closedBadge).toBeVisible();
  });

  test('E2E: Formulário de envio de relatório deve conter campo Work Order com dropdown', async ({ page }) => {
    await page.goto('/');

    // Navega para Equipment e abre o drawer do primeiro equipamento
    const equipmentTab = page.getByRole('button', { name: /^Equipment$/i });
    await equipmentTab.click();

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    const drawer = page.getByTestId('equipment-detail-drawer');
    await expect(drawer).toBeVisible();

    // Abre o formulário de novo relatório
    const logBtn = drawer.getByRole('button', { name: /Log New Analysis/i });
    await logBtn.click();

    // Valida o título do modal
    await expect(page.getByText('Submit CBM Analysis Report')).toBeVisible();

    // Valida que o campo Work Order Number é um dropdown (select)
    const woLabel = page.getByText('Work Order Number');
    await expect(woLabel).toBeVisible();

    // Procura o select correspondente
    const woSelect = page.locator('select').filter({ hasText: /N\/A \(No Work Order\)/i });
    await expect(woSelect).toBeVisible();

    // Valida que o dropdown foi populado com Work Orders reais para o equipamento além da opção N/A
    const options = await woSelect.locator('option').allInnerTexts();
    expect(options.length).toBeGreaterThan(1);
    expect(options.some(opt => opt.includes('WO-') || opt.includes('Open') || opt.includes('In Progress'))).toBeTruthy();
  });

  test('E2E: Detalhes da recomendação devem exibir WO dropdown, status dinâmico e bloqueio de efetividade', async ({ page }) => {
    await page.goto('/');

    // Navega para Recommendations
    const recomTab = page.getByRole('button', { name: /^Recommendations$/i });
    await recomTab.click();

    // Valida que a tabela de recomendações exibe o design sóbrio (bolinha colorida + texto)
    const soberDot = page.locator('table tbody tr span.rounded-full').first();
    await expect(soberDot).toBeVisible();

    // Clica no primeiro relatório da tabela para abrir os detalhes
    const firstReportRow = page.locator('table tbody tr').first();
    await firstReportRow.click();

    // Modal de detalhes deve abrir
    await expect(page.getByText('CBM Analysis Report Details')).toBeVisible();

    // Banner de CBM Case Status deve estar visível com o design sóbrio
    await expect(page.getByText(/CBM Case Status:/i)).toBeVisible();
    const modalDot = page.locator('.rounded-full.bg-emerald-500, .rounded-full.bg-amber-500, .rounded-full.bg-sky-400').first();
    await expect(modalDot).toBeVisible();

    // Campo WO Number deve ser um select interativo com opções populadas
    const woSelectInDetails = page.locator('select').filter({ hasText: /N\/A/i }).first();
    await expect(woSelectInDetails).toBeVisible();
    const detailOptions = await woSelectInDetails.locator('option').allInnerTexts();
    expect(detailOptions.length).toBeGreaterThan(1);

    // Seção de Recommendation Effectiveness Classification deve estar presente
    await expect(page.getByText(/Recommendation Effectiveness Classification/i)).toBeVisible();
  });
});
