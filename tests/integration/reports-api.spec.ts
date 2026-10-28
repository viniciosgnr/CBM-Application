import { test, expect } from '@playwright/test';

test.describe('Integration Tests: /api/reports Lifecycle & Work Order Linkage', () => {
  let targetReportId: number;
  let completedWoRef: string;
  let inProgressWoRef: string;
  let cancelledWoRef: string;

  test.beforeAll(async ({ request }) => {
    // 1. Fetch reports to find a Degraded or Critical report
    const reportsRes = await request.get('/api/reports');
    expect(reportsRes.ok()).toBeTruthy();
    const reports = await reportsRes.json();
    
    const degradedOrCritical = reports.find((r: any) => 
      r.overallCondition?.includes('Degraded') || r.overallCondition?.includes('Critical')
    );
    expect(degradedOrCritical).toBeDefined();
    targetReportId = degradedOrCritical.id;

    // 2. Fetch work orders to find representative statuses
    const wosRes = await request.get('/api/work-orders');
    expect(wosRes.ok()).toBeTruthy();
    const wos = await wosRes.json();

    const completedWo = wos.find((w: any) => w.status === 'Completed');
    expect(completedWo).toBeDefined();
    completedWoRef = completedWo.reference;

    const inProgressWo = wos.find((w: any) => w.status === 'In Progress' || w.status === 'Open');
    expect(inProgressWo).toBeDefined();
    inProgressWoRef = inProgressWo.reference;

    const cancelledWo = wos.find((w: any) => w.status === 'Cancelled');
    expect(cancelledWo).toBeDefined();
    cancelledWoRef = cancelledWo.reference;
  });

  test.afterAll(async ({ request }) => {
    // Reset report back to clean unlinked state
    if (targetReportId) {
      await request.put('/api/reports', {
        data: {
          id: targetReportId,
          woNumber: null,
          effectiveness: 'Pending Assessment',
          cbmCaseStatus: 'Awaiting Action'
        }
      });
    }
  });

  test('1. Vincular Work Order In Progress deve manter status em Awaiting Action e efetividade bloqueada', async ({ request }) => {
    const res = await request.put('/api/reports', {
      data: {
        id: targetReportId,
        woNumber: inProgressWoRef
      }
    });

    expect(res.ok()).toBeTruthy();
    const updated = await res.json();
    expect(updated.woNumber).toBe(inProgressWoRef);
    expect(updated.cbmCaseStatus).toBe('Awaiting Action');
    expect(updated.effectiveness).toBe('Pending Assessment');
  });

  test('2. Vincular Work Order Completed NUNCA deve auto-fechar: deve avançar para Awaiting Feedback com Pending Assessment', async ({ request }) => {
    const res = await request.put('/api/reports', {
      data: {
        id: targetReportId,
        woNumber: completedWoRef
      }
    });

    expect(res.ok()).toBeTruthy();
    const updated = await res.json();
    expect(updated.woNumber).toBe(completedWoRef);
    // CRITICAL: Must be Awaiting Feedback, NEVER Closed automatically!
    expect(updated.cbmCaseStatus).toBe('Awaiting Feedback');
    expect(updated.effectiveness).toBe('Pending Assessment');
  });

  test('3. Atribuir classificação de efetividade (Effective) deve transicionar CBM Case para Closed', async ({ request }) => {
    const res = await request.put('/api/reports', {
      data: {
        id: targetReportId,
        effectiveness: 'Effective'
      }
    });

    expect(res.ok()).toBeTruthy();
    const updated = await res.json();
    expect(updated.cbmCaseStatus).toBe('Closed');
    expect(updated.effectiveness).toBe('Effective');
  });

  test('4. Vincular Work Order Cancelled deve colocar o caso em Cancelled', async ({ request }) => {
    const res = await request.put('/api/reports', {
      data: {
        id: targetReportId,
        woNumber: cancelledWoRef
      }
    });

    expect(res.ok()).toBeTruthy();
    const updated = await res.json();
    expect(updated.woNumber).toBe(cancelledWoRef);
    expect(updated.cbmCaseStatus).toBe('Cancelled');
    expect(updated.effectiveness).toBe('Pending Assessment');
  });

  test('5. Desvincular Work Order (N/A) deve retornar o caso para Awaiting Action e Pending Assessment', async ({ request }) => {
    const res = await request.put('/api/reports', {
      data: {
        id: targetReportId,
        woNumber: null
      }
    });

    expect(res.ok()).toBeTruthy();
    const updated = await res.json();
    expect(updated.woNumber).toBeNull();
    expect(updated.cbmCaseStatus).toBe('Awaiting Action');
    expect(updated.effectiveness).toBe('Pending Assessment');
  });
});
