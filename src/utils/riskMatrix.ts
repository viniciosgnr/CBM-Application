export type CriticalityLevel = 'Low' | 'Medium' | 'High';
export type SurveillanceTier = 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4';
export type RiskCategory = 'Low' | 'Moderate' | 'High' | 'Very High';

export interface RiskCalculationResult {
  criticalityScore: number; // 1, 2, 3
  tierScore: number;        // 1, 2, 3, 4
  baseScore: number;        // 1 to 12
  baseCategory: RiskCategory;
  isEscalated: boolean;
  finalCategory: RiskCategory;
  colorHex: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
}

export function parseCriticalityScore(criticality?: string): number {
  if (!criticality) return 2; // default Medium
  const clean = criticality.trim().toLowerCase();
  if (clean === 'high' || clean === 'sece') return 3;
  if (clean === 'low') return 1;
  return 2; // Medium
}

export function parseSurveillanceTier(condition?: string): { tierName: SurveillanceTier; tierScore: number } {
  if (!condition) return { tierName: 'Tier 4', tierScore: 1 };
  const clean = condition.trim();
  if (clean.includes('Tier 1') || clean.startsWith('Critical')) {
    return { tierName: 'Tier 1', tierScore: 4 };
  }
  if (clean.includes('Tier 2') || clean.startsWith('Degraded')) {
    return { tierName: 'Tier 2', tierScore: 3 };
  }
  if (clean.includes('Tier 3')) {
    return { tierName: 'Tier 3', tierScore: 2 };
  }
  return { tierName: 'Tier 4', tierScore: 1 };
}

export function getBaseCategory(score: number): RiskCategory {
  if (score >= 12) return 'Very High';
  if (score >= 8) return 'High';
  if (score >= 4) return 'Moderate';
  return 'Low';
}

export function escalateCategory(cat: RiskCategory): RiskCategory {
  switch (cat) {
    case 'Low':
      return 'Moderate';
    case 'Moderate':
      return 'High';
    case 'High':
      return 'Very High';
    case 'Very High':
      return 'Very High';
    default:
      return cat;
  }
}

export function calculateCombinedRisk(
  criticality?: string,
  condition?: string,
  collectionStatus?: string
): RiskCalculationResult {
  const critScore = parseCriticalityScore(criticality);
  const { tierScore } = parseSurveillanceTier(condition);
  const baseScore = critScore * tierScore;
  const baseCategory = getBaseCategory(baseScore);

  const isOverdue = collectionStatus === 'Overdue';
  const isEscalated = isOverdue && baseCategory !== 'Very High';
  const finalCategory = isOverdue ? escalateCategory(baseCategory) : baseCategory;

  let colorHex = '#22c55e'; // Green
  let badgeBg = 'bg-status-ok/15';
  let badgeText = 'text-status-ok';
  let dotColor = 'bg-status-ok';

  switch (finalCategory) {
    case 'Very High':
      colorHex = '#ef4444';
      badgeBg = 'bg-status-error/15';
      badgeText = 'text-status-error';
      dotColor = 'bg-status-error';
      break;
    case 'High':
      colorHex = '#f97316';
      badgeBg = 'bg-orange-500/15';
      badgeText = 'text-orange-400';
      dotColor = 'bg-orange-500';
      break;
    case 'Moderate':
      colorHex = '#eab308';
      badgeBg = 'bg-status-warn/15';
      badgeText = 'text-status-warn';
      dotColor = 'bg-status-warn';
      break;
    case 'Low':
    default:
      colorHex = '#22c55e';
      badgeBg = 'bg-status-ok/15';
      badgeText = 'text-status-ok';
      dotColor = 'bg-status-ok';
      break;
  }

  return {
    criticalityScore: critScore,
    tierScore,
    baseScore,
    baseCategory,
    isEscalated,
    finalCategory,
    colorHex,
    badgeBg,
    badgeText,
    dotColor,
  };
}
