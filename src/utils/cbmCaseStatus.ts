/**
 * Business rules for CBM Case Status transitions based on equipment condition,
 * linked Work Order status, and Recommendation Effectiveness.
 */

export function resolveCbmCaseStatus(
  condition: string,
  woStatus?: string | null,
  currentEffectiveness?: string | null
): { cbmCaseStatus: string; effectiveness: string } {
  const isGood =
    condition.includes('Good') ||
    condition.includes('Tier 3') ||
    condition.includes('Tier 4');

  // Good Tier 3 and Good Tier 4: Direct Closed status with N/A effectiveness
  if (isGood) {
    return { cbmCaseStatus: 'Closed', effectiveness: 'N/A' };
  }

  // Degraded or Critical:
  if (woStatus === 'Cancelled') {
    return {
      cbmCaseStatus: 'Cancelled',
      effectiveness: currentEffectiveness || 'Pending Assessment',
    };
  }

  if (woStatus === 'Completed') {
    const validClosedEffectiveness = [
      'Effective',
      'Partially Effective',
      'Ineffective',
      'Not Yet Assessable',
    ];
    if (
      currentEffectiveness &&
      currentEffectiveness !== 'Pending Assessment' &&
      validClosedEffectiveness.includes(currentEffectiveness)
    ) {
      return { cbmCaseStatus: 'Closed', effectiveness: currentEffectiveness };
    }
    return {
      cbmCaseStatus: 'Awaiting Feedback',
      effectiveness: 'Pending Assessment',
    };
  }

  // Without WO or with WO Opened, In Progress, Pending, Accepted, etc.
  return {
    cbmCaseStatus: 'Awaiting Action',
    effectiveness: 'Pending Assessment',
  };
}
