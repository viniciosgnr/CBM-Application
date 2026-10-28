import { test, expect } from '@playwright/test';
import { resolveCbmCaseStatus } from '../../src/utils/cbmCaseStatus';

test.describe('Unit Tests: CBM Case Status & Recommendation Effectiveness Logic', () => {

  test.describe('1. Good Conditions (Tier 4 and Tier 3)', () => {
    test('Good - Tier 4 deve transicionar direto para Closed com efetividade N/A independente de WO', () => {
      const resNoWo = resolveCbmCaseStatus('Good - Tier 4', null, null);
      expect(resNoWo.cbmCaseStatus).toBe('Closed');
      expect(resNoWo.effectiveness).toBe('N/A');

      const resInProgress = resolveCbmCaseStatus('Good - Tier 4', 'In Progress', null);
      expect(resInProgress.cbmCaseStatus).toBe('Closed');
      expect(resInProgress.effectiveness).toBe('N/A');

      const resCompleted = resolveCbmCaseStatus('Good - Tier 4', 'Completed', null);
      expect(resCompleted.cbmCaseStatus).toBe('Closed');
      expect(resCompleted.effectiveness).toBe('N/A');

      const resCancelled = resolveCbmCaseStatus('Good - Tier 4', 'Cancelled', null);
      expect(resCancelled.cbmCaseStatus).toBe('Closed');
      expect(resCancelled.effectiveness).toBe('N/A');
    });

    test('Good - Tier 3 deve transicionar direto para Closed com efetividade N/A independente de WO', () => {
      const resNoWo = resolveCbmCaseStatus('Good - Tier 3', null, null);
      expect(resNoWo.cbmCaseStatus).toBe('Closed');
      expect(resNoWo.effectiveness).toBe('N/A');

      const resWithEffective = resolveCbmCaseStatus('Good - Tier 3', 'Completed', 'Effective');
      expect(resWithEffective.cbmCaseStatus).toBe('Closed');
      expect(resWithEffective.effectiveness).toBe('N/A');
    });
  });

  test.describe('2. Degraded (Tier 2) & Critical (Tier 1) - Sem WO ou WO Pendente/Aberta', () => {
    test('Degraded - Tier 2 sem WO deve ficar em Awaiting Action e Pending Assessment', () => {
      const res = resolveCbmCaseStatus('Degraded - Tier 2', null, null);
      expect(res.cbmCaseStatus).toBe('Awaiting Action');
      expect(res.effectiveness).toBe('Pending Assessment');
    });

    test('Critical - Tier 1 com WO em status Open, In Progress ou Pending deve permanecer em Awaiting Action', () => {
      const statuses = ['Open', 'In Progress', 'Pending', 'Accepted'];
      for (const st of statuses) {
        const res = resolveCbmCaseStatus('Critical - Tier 1', st, null);
        expect(res.cbmCaseStatus).toBe('Awaiting Action');
        expect(res.effectiveness).toBe('Pending Assessment');
      }
    });

    test('Degraded ou Critical com WO em progresso NUNCA pode ter efetividade atribuída automaticamente', () => {
      const res = resolveCbmCaseStatus('Degraded - Tier 2', 'In Progress', 'Pending Assessment');
      expect(res.cbmCaseStatus).toBe('Awaiting Action');
      expect(res.effectiveness).toBe('Pending Assessment');
    });
  });

  test.describe('3. Degraded (Tier 2) & Critical (Tier 1) - Work Order Completed', () => {
    test('Ao vincular uma WO Completed sem avaliação prévia, deve ir para Awaiting Feedback e Pending Assessment', () => {
      const resDegraded = resolveCbmCaseStatus('Degraded - Tier 2', 'Completed', null);
      expect(resDegraded.cbmCaseStatus).toBe('Awaiting Feedback');
      expect(resDegraded.effectiveness).toBe('Pending Assessment');

      const resCrit = resolveCbmCaseStatus('Critical - Tier 1', 'Completed', 'Pending Assessment');
      expect(resCrit.cbmCaseStatus).toBe('Awaiting Feedback');
      expect(resCrit.effectiveness).toBe('Pending Assessment');
    });

    test('Quando o usuário escolhe qualquer uma das 4 opções de efetividade, deve transicionar para Closed', () => {
      const validOptions = [
        'Effective',
        'Partially Effective',
        'Ineffective',
        'Not Yet Assessable',
      ];

      for (const opt of validOptions) {
        const resDeg = resolveCbmCaseStatus('Degraded - Tier 2', 'Completed', opt);
        expect(resDeg.cbmCaseStatus).toBe('Closed');
        expect(resDeg.effectiveness).toBe(opt);

        const resCrit = resolveCbmCaseStatus('Critical - Tier 1', 'Completed', opt);
        expect(resCrit.cbmCaseStatus).toBe('Closed');
        expect(resCrit.effectiveness).toBe(opt);
      }
    });

    test('Se o valor de efetividade for inválido ou vazio com WO Completed, deve manter Awaiting Feedback', () => {
      const resEmpty = resolveCbmCaseStatus('Degraded - Tier 2', 'Completed', '');
      expect(resEmpty.cbmCaseStatus).toBe('Awaiting Feedback');
      expect(resEmpty.effectiveness).toBe('Pending Assessment');

      const resPending = resolveCbmCaseStatus('Degraded - Tier 2', 'Completed', 'Pending Assessment');
      expect(resPending.cbmCaseStatus).toBe('Awaiting Feedback');
      expect(resPending.effectiveness).toBe('Pending Assessment');
    });
  });

  test.describe('4. Degraded (Tier 2) & Critical (Tier 1) - Work Order Cancelled', () => {
    test('Se a WO for Cancelled, status da recomendação deve ir para Cancelled com efetividade desabilitada', () => {
      const resDeg = resolveCbmCaseStatus('Degraded - Tier 2', 'Cancelled', null);
      expect(resDeg.cbmCaseStatus).toBe('Cancelled');
      expect(resDeg.effectiveness).toBe('Pending Assessment');

      const resCrit = resolveCbmCaseStatus('Critical - Tier 1', 'Cancelled', 'Pending Assessment');
      expect(resCrit.cbmCaseStatus).toBe('Cancelled');
      expect(resCrit.effectiveness).toBe('Pending Assessment');
    });
  });
});
