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

export interface OverallHealthResult {
  totalMachines: number;
  maxPoints: number;
  deductedPoints: number;
  healthPoints: number;
  healthPercentage: number;
  tier1Count: number;
  tier2Count: number;
  goodCount: number;
}

export function calculateOverallHealth(
  equipments: Array<{
    condition?: string | null;
    vibrationStatus?: string | null;
    lubeOilStatus?: string | null;
    criticality?: string | null;
  }>
): OverallHealthResult {
  const totalMachines = equipments.length;
  const maxPoints = totalMachines * 12;
  let deductedPoints = 0;
  let tier1Count = 0;
  let tier2Count = 0;
  let goodCount = 0;

  for (const eq of equipments) {
    const resolvedCondition = getWorstTechniqueStatus(
      eq.vibrationStatus,
      eq.lubeOilStatus,
      eq.condition || 'Good - Tier 4'
    );

    if (resolvedCondition.includes('Tier 1') || resolvedCondition.includes('Critical')) {
      const riskScore = calculateRiskScore(resolvedCondition, eq.criticality || 'Medium');
      deductedPoints += riskScore;
      tier1Count++;
    } else if (resolvedCondition.includes('Tier 2') || resolvedCondition.includes('Degraded')) {
      const riskScore = calculateRiskScore(resolvedCondition, eq.criticality || 'Medium');
      deductedPoints += riskScore;
      tier2Count++;
    } else {
      goodCount++;
    }
  }

  const healthPoints = Math.max(0, maxPoints - deductedPoints);
  const healthPercentage = totalMachines > 0 ? (healthPoints / maxPoints) * 100 : 100;

  return {
    totalMachines,
    maxPoints,
    deductedPoints,
    healthPoints,
    healthPercentage: Number(healthPercentage.toFixed(1)),
    tier1Count,
    tier2Count,
    goodCount,
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

// -------------------------------------------------------------
// CBMnet Risk Levels & FAR Overdue PM Matrix (ISO / CBM Standard)
// -------------------------------------------------------------

export type PMImportanceRanking = 'Low' | 'Medium' | 'High';

export function getPMImportanceRanking(criticality?: string | null): PMImportanceRanking {
  if (!criticality) return 'Medium';
  const c = criticality.trim().toLowerCase();
  if (c === 'high' || c === 'critical' || c === 'sece') return 'High';
  if (c === 'low') return 'Low';
  return 'Medium';
}

export function parseDateUtil(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const clean = dateStr.trim();
  if (clean.includes('/')) {
    const datePart = clean.split(',')[0].trim().split(' ')[0];
    const parts = datePart.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        return new Date(y, m, d);
      }
    }
  }
  const parsed = new Date(clean);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function parseFrequencyDays(freqStr?: string | null, defaultDays = 30): number {
  if (!freqStr) return defaultDays;
  const match = freqStr.match(/\d+/);
  return match ? parseInt(match[0], 10) : defaultDays;
}

export interface PMOverdueResult {
  delayDays: number;
  intervalDays: number;
  overduePercent: number; // 0 if on time, e.g. 50 for 50%
  isOverdue: boolean;
  plannedDateStr: string;
}

export function calculatePMOverdue(
  lastUpdateStr?: string | null,
  frequencyStr?: string | null,
  defaultDays = 24,
  anchorDate: Date = new Date('2026-08-31T23:59:59Z')
): PMOverdueResult {
  const lastDate = parseDateUtil(lastUpdateStr) || new Date(2026, 6, 23);
  const intervalDays = parseFrequencyDays(frequencyStr, defaultDays);

  const plannedDate = new Date(lastDate);
  plannedDate.setDate(plannedDate.getDate() + intervalDays);

  const day = String(plannedDate.getDate()).padStart(2, '0');
  const month = String(plannedDate.getMonth() + 1).padStart(2, '0');
  const year = plannedDate.getFullYear();
  const plannedDateStr = `${day}/${month}/${year}`;

  const diffMs = anchorDate.getTime() - plannedDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      delayDays: 0,
      intervalDays,
      overduePercent: 0,
      isOverdue: false,
      plannedDateStr,
    };
  }

  const overduePercent = Number(((diffDays / intervalDays) * 100).toFixed(1));
  return {
    delayDays: diffDays,
    intervalDays,
    overduePercent,
    isOverdue: true,
    plannedDateStr,
  };
}

export interface ComplianceLevelResult {
  level: number; // 0 to 5
  label: 'Not Activated' | 'Very Unlikely' | 'Unlikely' | 'Possible' | 'Likely' | 'Very Likely';
  colorHex: string;
  badgeBg: string;
  badgeText: string;
}

export function getComplianceLevelFromMatrix(
  overduePercent: number,
  importance: PMImportanceRanking
): ComplianceLevelResult {
  if (overduePercent <= 0) {
    return {
      level: 0,
      label: 'Not Activated',
      colorHex: '#22c55e',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-400',
    };
  }

  // 0 - 50%
  if (overduePercent <= 50) {
    if (importance === 'Low') {
      return { level: 1, label: 'Very Unlikely', colorHex: '#10b981', badgeBg: 'bg-teal-500/15', badgeText: 'text-teal-400' };
    }
    if (importance === 'Medium') {
      return { level: 2, label: 'Unlikely', colorHex: '#84cc16', badgeBg: 'bg-lime-500/15', badgeText: 'text-lime-400' };
    }
    return { level: 4, label: 'Likely', colorHex: '#f97316', badgeBg: 'bg-orange-500/15', badgeText: 'text-orange-400' };
  }

  // 50 - 100%
  if (overduePercent <= 100) {
    if (importance === 'Low') {
      return { level: 1, label: 'Very Unlikely', colorHex: '#10b981', badgeBg: 'bg-teal-500/15', badgeText: 'text-teal-400' };
    }
    if (importance === 'Medium') {
      return { level: 3, label: 'Possible', colorHex: '#eab308', badgeBg: 'bg-yellow-500/15', badgeText: 'text-yellow-400' };
    }
    return { level: 5, label: 'Very Likely', colorHex: '#ef4444', badgeBg: 'bg-red-500/15', badgeText: 'text-red-400' };
  }

  // 100 - 150%
  if (overduePercent <= 150) {
    if (importance === 'Low') {
      return { level: 2, label: 'Unlikely', colorHex: '#84cc16', badgeBg: 'bg-lime-500/15', badgeText: 'text-lime-400' };
    }
    if (importance === 'Medium') {
      return { level: 4, label: 'Likely', colorHex: '#f97316', badgeBg: 'bg-orange-500/15', badgeText: 'text-orange-400' };
    }
    return { level: 5, label: 'Very Likely', colorHex: '#ef4444', badgeBg: 'bg-red-500/15', badgeText: 'text-red-400' };
  }

  // 150 - 200%
  if (overduePercent <= 200) {
    if (importance === 'Low') {
      return { level: 3, label: 'Possible', colorHex: '#eab308', badgeBg: 'bg-yellow-500/15', badgeText: 'text-yellow-400' };
    }
    return { level: 5, label: 'Very Likely', colorHex: '#ef4444', badgeBg: 'bg-red-500/15', badgeText: 'text-red-400' };
  }

  // 200 - 250%
  if (overduePercent <= 250) {
    if (importance === 'Low') {
      return { level: 4, label: 'Likely', colorHex: '#f97316', badgeBg: 'bg-orange-500/15', badgeText: 'text-orange-400' };
    }
    return { level: 5, label: 'Very Likely', colorHex: '#ef4444', badgeBg: 'bg-red-500/15', badgeText: 'text-red-400' };
  }

  // 250%+
  return { level: 5, label: 'Very Likely', colorHex: '#ef4444', badgeBg: 'bg-red-500/15', badgeText: 'text-red-400' };
}

export function getCbmTotalRiskCategory(score: number): {
  category: RiskMatrixCategory;
  colorHex: string;
  badgeBg: string;
  badgeText: string;
} {
  if (score >= 12.0) {
    return {
      category: 'Critical',
      colorHex: '#ef4444',
      badgeBg: 'bg-status-error/15',
      badgeText: 'text-status-error',
    };
  }
  if (score >= 8.0) {
    return {
      category: 'High',
      colorHex: '#f97316',
      badgeBg: 'bg-orange-500/15',
      badgeText: 'text-orange-400',
    };
  }
  if (score >= 4.0) {
    return {
      category: 'Medium',
      colorHex: '#eab308',
      badgeBg: 'bg-status-warn/15',
      badgeText: 'text-status-warn',
    };
  }
  return {
    category: 'Low',
    colorHex: '#22c55e',
    badgeBg: 'bg-status-ok/15',
    badgeText: 'text-status-ok',
  };
}

export interface EquipmentCbmRiskResult {
  faultRisk: number; // 1 to 12
  faultCategory: RiskMatrixCategory;
  faultColorHex: string;
  faultBadgeBg: string;
  faultBadgeText: string;
  vibOverdue: PMOverdueResult;
  oilOverdue: PMOverdueResult;
  vibCompliance: ComplianceLevelResult;
  oilCompliance: ComplianceLevelResult;
  complianceRisk: number; // 0 to 5
  complianceResult: ComplianceLevelResult;
  totalRisk: number; // Fault Risk + (0.2 * Compliance Risk) e.g. 1.0 to 13.0
  totalCategory: RiskMatrixCategory;
  totalColorHex: string;
  totalBadgeBg: string;
  totalBadgeText: string;
}

export function calculateEquipmentCbmRisk(eq: {
  condition?: string | null;
  vibrationStatus?: string | null;
  lubeOilStatus?: string | null;
  criticality?: string | null;
  lastUpdate?: string | null;
  lastVibrationUpdate?: string | null;
  lastLubeOilUpdate?: string | null;
  vibrationFrequency?: string | null;
  lubeOilFrequency?: string | null;
}): EquipmentCbmRiskResult {
  const worstCondition = getWorstTechniqueStatus(
    eq.vibrationStatus,
    eq.lubeOilStatus,
    eq.condition || 'Good - Tier 4'
  );
  const faultRisk = calculateRiskScore(worstCondition, eq.criticality || 'Medium');
  const faultCatInfo = getRiskCategory(faultRisk);

  const importance = getPMImportanceRanking(eq.criticality);

  const vibDate = eq.lastVibrationUpdate || eq.lastUpdate;
  const oilDate = eq.lastLubeOilUpdate || eq.lastUpdate;

  const vibOverdue = calculatePMOverdue(vibDate, eq.vibrationFrequency, 24);
  const oilOverdue = calculatePMOverdue(oilDate, eq.lubeOilFrequency, 84);

  const vibCompliance = getComplianceLevelFromMatrix(vibOverdue.overduePercent, importance);
  const oilCompliance = getComplianceLevelFromMatrix(oilOverdue.overduePercent, importance);

  // Worst case consolidation: higher compliance level represents greater risk
  const worstCompliance = vibCompliance.level >= oilCompliance.level ? vibCompliance : oilCompliance;
  const complianceRisk = worstCompliance.level; // 0 to 5 directly as requested by user

  // CBM Total Risk = Fault Risk + 20% * Compliance Risk (Ranges from 1.0 to 13.0)
  const rawTotalRisk = faultRisk + (0.2 * complianceRisk);
  const totalRisk = Number(rawTotalRisk.toFixed(1));
  const totalCatInfo = getCbmTotalRiskCategory(totalRisk);

  return {
    faultRisk,
    faultCategory: faultCatInfo.category,
    faultColorHex: faultCatInfo.hex,
    faultBadgeBg: faultCatInfo.badgeBg,
    faultBadgeText: faultCatInfo.badgeText,
    vibOverdue,
    oilOverdue,
    vibCompliance,
    oilCompliance,
    complianceRisk,
    complianceResult: worstCompliance,
    totalRisk,
    totalCategory: totalCatInfo.category,
    totalColorHex: totalCatInfo.colorHex,
    totalBadgeBg: totalCatInfo.badgeBg,
    totalBadgeText: totalCatInfo.badgeText,
  };
}

export interface FleetCbmRiskSummary {
  totalMachines: number;
  avgFaultRisk: number;
  avgComplianceRisk: number;
  avgTotalRisk: number;
  complianceCount: {
    onSchedule: number; // level 0
    lowDelay: number;    // level 1-2
    moderateDelay: number; // level 3-4
    severeDelay: number; // level 5
  };
  totalRiskCount: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export function calculateFleetCbmRiskSummary(equipments: Array<any>): FleetCbmRiskSummary {
  const total = equipments.length;
  if (total === 0) {
    return {
      totalMachines: 0,
      avgFaultRisk: 0,
      avgComplianceRisk: 0,
      avgTotalRisk: 0,
      complianceCount: { onSchedule: 0, lowDelay: 0, moderateDelay: 0, severeDelay: 0 },
      totalRiskCount: { low: 0, medium: 0, high: 0, critical: 0 },
    };
  }

  let sumFault = 0;
  let sumComp = 0;
  let sumTotal = 0;
  const compCount = { onSchedule: 0, lowDelay: 0, moderateDelay: 0, severeDelay: 0 };
  const riskCount = { low: 0, medium: 0, high: 0, critical: 0 };

  for (const eq of equipments) {
    const res = calculateEquipmentCbmRisk(eq);
    sumFault += res.faultRisk;
    sumComp += res.complianceRisk;
    sumTotal += res.totalRisk;

    if (res.complianceRisk === 0) compCount.onSchedule++;
    else if (res.complianceRisk <= 2) compCount.lowDelay++;
    else if (res.complianceRisk <= 4) compCount.moderateDelay++;
    else compCount.severeDelay++;

    if (res.totalCategory === 'Critical') riskCount.critical++;
    else if (res.totalCategory === 'High') riskCount.high++;
    else if (res.totalCategory === 'Medium') riskCount.medium++;
    else riskCount.low++;
  }

  return {
    totalMachines: total,
    avgFaultRisk: Number((sumFault / total).toFixed(1)),
    avgComplianceRisk: Number((sumComp / total).toFixed(1)),
    avgTotalRisk: Number((sumTotal / total).toFixed(1)),
    complianceCount: compCount,
    totalRiskCount: riskCount,
  };
}

export function formatEquipmentClass(rawClass?: string | null): string {
  if (!rawClass) return 'N/A';
  const clean = rawClass.trim();
  const stripped = clean.replace(/^(equipmentClass_|EquipmentClass_)/i, '');
  return stripped || 'N/A';
}
