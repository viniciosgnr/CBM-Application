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
  if (clean === 'high' || clean === 'critical' || clean === 'sece') return 3;
  if (clean === 'medium') return 2;
  return 1; // Low
}

export function calculateRiskScore(condition?: string, criticality?: string): number {
  const critScore = parseCriticalityScore(criticality);
  const { tierScore } = parseSurveillanceTier(condition);
  return critScore * tierScore;
}

export type RiskMatrixCategory = 'Critical' | 'High' | 'Medium' | 'Low';

export function getRiskCategory(score: number): {
  category: RiskMatrixCategory;
  colorClass: string;
  badgeBg: string;
  badgeText: string;
  hex: string;
} {
  if (score >= 12) {
    return {
      category: 'Critical',
      colorClass: 'text-status-error',
      badgeBg: 'bg-status-error/15',
      badgeText: 'text-status-error',
      hex: '#ef4444',
    };
  }
  if (score >= 8) {
    return {
      category: 'High',
      colorClass: 'text-orange-400',
      badgeBg: 'bg-orange-500/15',
      badgeText: 'text-orange-400',
      hex: '#f97316',
    };
  }
  if (score >= 4) {
    return {
      category: 'Medium',
      colorClass: 'text-status-warn',
      badgeBg: 'bg-status-warn/15',
      badgeText: 'text-status-warn',
      hex: '#eab308',
    };
  }
  return {
    category: 'Low',
    colorClass: 'text-status-ok',
    badgeBg: 'bg-status-ok/15',
    badgeText: 'text-status-ok',
    hex: '#22c55e',
  };
}

export function formatSurveillanceTier(status?: string | null): string {
  if (!status) return 'Good - Tier 4';
  if (status.includes(' - Tier ')) return status;
  if (status.includes('Tier 1') || status.startsWith('Critical')) return 'Critical - Tier 1';
  if (status.includes('Tier 2') || status.startsWith('Degraded')) return 'Degraded - Tier 2';
  if (status.includes('Tier 3')) return 'Good - Tier 3';
  if (status.includes('Tier 4') || status.startsWith('Good')) return 'Good - Tier 4';
  return status;
}

export function getTierSeverity(status?: string | null): number {
  if (!status) return 1;
  const s = status.toLowerCase();
  if (s.includes('tier 1') || s.includes('critical')) return 4;
  if (s.includes('tier 2') || s.includes('degraded')) return 3;
  if (s.includes('tier 3')) return 2;
  if (s.includes('tier 4') || s.includes('good')) return 1;
  return 1;
}

export function getWorstTechniqueStatus(
  vibStatus?: string | null,
  oilStatus?: string | null,
  fallbackCondition?: string | null
): string {
  const formattedVib = vibStatus ? formatSurveillanceTier(vibStatus) : null;
  const formattedOil = oilStatus ? formatSurveillanceTier(oilStatus) : null;

  if (!formattedVib && !formattedOil) {
    return formatSurveillanceTier(fallbackCondition);
  }
  if (formattedVib && !formattedOil) return formattedVib;
  if (!formattedVib && formattedOil) return formattedOil;

  const rankVib = getTierSeverity(formattedVib);
  const rankOil = getTierSeverity(formattedOil);

  // Worst condition has higher severity: Tier 1 (4) > Tier 2 (3) > Tier 3 (2) > Tier 4 (1)
  return rankVib >= rankOil ? formattedVib! : formattedOil!;
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
