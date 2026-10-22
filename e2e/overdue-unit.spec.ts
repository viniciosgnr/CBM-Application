import { test, expect } from '@playwright/test';
import {
  calculatePMOverdue,
  getPMOverdueIndex,
  calculateEquipmentCbmRisk,
} from '../src/utils/riskMatrix';

test.describe('Overdue Logic & Risk Compliance Unit & Integration Tests', () => {
  const referenceDate = new Date('2026-10-22T12:00:00Z');

  test('deve calcular corretamente overdue para data planejada no passado (Vibração 02/09/2026)', () => {
    // Coleta realizada em 09/08/2026 com frequência de 24 dias -> Próxima: 02/09/2026
    const res = calculatePMOverdue('09/08/2026', '24 days', 24, referenceDate);

    expect(res.plannedDateStr).toBe('02/09/2026');
    expect(res.isOverdue).toBe(true);
    // De 02/09/2026 até 22/10/2026 são 50 dias de atraso
    expect(res.delayDays).toBe(50);
    expect(res.intervalDays).toBe(24);
    // (50 / 24) * 100 = ~208.3%
    expect(res.overduePercent).toBeGreaterThanOrEqual(200);

    const indexInfo = getPMOverdueIndex(res.overduePercent);
    // Atraso > 200% do intervalo => Índice 5
    expect(indexInfo.index).toBe(5);
    expect(indexInfo.label).toBe('>200%');
  });

  test('deve calcular corretamente overdue para data planejada no passado recente (Óleo Lubrificante 17/10/2026)', () => {
    // Coleta realizada em 25/07/2026 com frequência de 84 dias -> Próxima: 17/10/2026
    const res = calculatePMOverdue('25/07/2026', '84 days', 84, referenceDate);

    expect(res.plannedDateStr).toBe('17/10/2026');
    expect(res.isOverdue).toBe(true);
    // De 17/10/2026 até 22/10/2026 são 5 dias de atraso
    expect(res.delayDays).toBe(5);
    expect(res.intervalDays).toBe(84);
    // (5 / 84) * 100 = ~5.95% -> 6.0%
    expect(res.overduePercent).toBe(6.0);

    const indexInfo = getPMOverdueIndex(res.overduePercent);
    // Atraso <= 50% do intervalo => Índice 1 (0-50%)
    expect(indexInfo.index).toBe(1);
    expect(indexInfo.label).toBe('0-50%');
  });

  test('não deve marcar como overdue quando a data planejada é hoje ou no futuro', () => {
    // Mesma data de hoje (22/10/2026)
    const resToday = calculatePMOverdue('22/10/2026', '0 days', 0, referenceDate);
    expect(resToday.isOverdue).toBe(false);
    expect(resToday.delayDays).toBe(0);
    expect(resToday.overduePercent).toBe(0);

    // Data no futuro (ex: 28/10/2026)
    const resFuture = calculatePMOverdue('20/10/2026', '30 days', 30, referenceDate);
    expect(resFuture.isOverdue).toBe(false);
    expect(resFuture.delayDays).toBe(0);
    expect(resFuture.overduePercent).toBe(0);

    const indexInfo = getPMOverdueIndex(resFuture.overduePercent);
    expect(indexInfo.index).toBe(0);
    expect(indexInfo.label).toBe('Not Overdue');
  });

  test('deve calcular Compliance Risk e Total Risk corretamente para o equipamento de exemplo DNY_116-PURO-9001-B', () => {
    const equipment = {
      tag: 'DNY_116-PURO-9001-B',
      name: 'MGO TS Utility Pump B',
      criticality: 'High',
      condition: 'Good - Tier 4',
      vibrationStatus: 'Good - Tier 4',
      lubeOilStatus: 'Good - Tier 4',
      vibrationFrequency: '24 days',
      lubeOilFrequency: '84 days',
      lastVibrationUpdate: '09/08/2026',
      lastLubeOilUpdate: '25/07/2026',
      lastUpdate: '09/08/2026',
    };

    const risk = calculateEquipmentCbmRisk(equipment, 'Both');

    // Criticality High peso 3
    expect(risk.criticalityWeight).toBe(3);

    // Vibração está atrasada desde 02/09/2026 (> 200% de atraso => índice 5)
    expect(risk.vibOverdue.isOverdue).toBe(true);
    expect(risk.vibOverdueIndex).toBe(5);

    // Óleo está atrasado desde 17/10/2026 (atraso <= 50% => índice 1)
    expect(risk.oilOverdue.isOverdue).toBe(true);
    expect(risk.oilOverdueIndex).toBe(1);

    // Compliance Risk = max(3 * 5, 3 * 1) = 15/15
    expect(risk.complianceRisk).toBe(15);
    expect(risk.complianceResult.label).toBe('Severe Delay');

    // Fault Risk (Good Tier 4 High = 3.0) + 20% * 15 = 3.0 + 3.0 = 6.0
    expect(risk.faultRisk).toBe(3.0);
    expect(risk.totalRisk).toBe(6.0);
  });

  test('deve exibir status Overdue e compliance risk atualizado na interface para DNY_116-PURO-9001-B', async ({ page }) => {
    // Configura o equipamento no backend via API com as datas do exemplo
    await page.request.put('/api/equipments/DNY_116-PURO-9001-B', {
      data: {
        criticality: 'High',
        lastVibrationUpdate: '09/08/2026',
        lastLubeOilUpdate: '25/07/2026',
        vibrationFrequency: '24 days',
        lubeOilFrequency: '84 days',
      }
    });

    await page.goto('/');

    // Clica na aba Equipment
    const equipmentTab = page.getByRole('button', { name: /^Equipment$/i });
    await expect(equipmentTab).toBeVisible();
    await equipmentTab.click();

    // Filtra pelo tag DNY_116-PURO-9001-B na coluna TAG
    const tagHeader = page.locator('th', { hasText: 'Tag' });
    const tagFilterTrigger = tagHeader.locator('svg').last();
    await tagFilterTrigger.click();

    const popover = page.locator('div.absolute.top-full');
    await popover.getByPlaceholder('Search...').fill('DNY_116-PURO-9001-B');
    await popover.getByText('(Select All)').click(); // desmarca todos
    await popover.getByText('DNY_116-PURO-9001-B').click(); // marca apenas ele
    await page.keyboard.press('Escape');

    // Linha do equipamento deve estar visível
    const row = page.locator('table tbody tr', { hasText: 'DNY_116-PURO-9001-B' });
    await expect(row).toBeVisible();

    // Verifica que na tabela a coluna Collection Status exibe 'Overdue'
    await expect(row.getByText('Overdue')).toBeVisible();

    // Clica no equipamento para abrir o drawer/modal
    await row.click();

    const drawer = page.getByTestId('equipment-detail-drawer');
    await expect(drawer).toBeVisible();

    // Valida que a análise de vibração exibe a data 02/09/2026
    await expect(drawer.getByText('Vibration Analysis')).toBeVisible();
    await expect(drawer.getByText('02/09/2026')).toBeVisible();

    // Valida que a análise de óleo exibe a data 17/10/2026
    await expect(drawer.getByText('Lube Oil Analysis')).toBeVisible();
    await expect(drawer.getByText('17/10/2026')).toBeVisible();

    // Valida que o indicador de risco de conformidade (Compliance) reflete o atraso (15/15)
    await expect(drawer.getByText(/Compliance:\s*15\/15/)).toBeVisible();
  });
});
