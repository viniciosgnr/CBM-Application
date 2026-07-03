import { db } from './index';
import { equipments, equipmentHistory, analysisReports } from './schema';
import { sql } from 'drizzle-orm';

const initialEquipments = [
  {
    tag: 'COCE_TIME_NRS_01',
    fpso: 'UNY',
    name: 'Compressor Performance',
    class: 'COCE - Compressor, Centrifugal',
    system: 'Gas',
    criticality: 'High',
    objectType: 'SECE',
    condition: 'Good',
    vibrationStatus: 'Good',
    lubeOilStatus: 'Good',
    lastUpdate: '23/02/2026, 12:47:04',
    observation: 'The work order for the equipment has been flagged.',
  },
  {
    tag: 'COCE_TIME_NRS_02',
    fpso: 'UNY',
    name: 'Compressor Performance',
    class: 'COCE - Compressor, Centrifugal',
    system: 'Gas',
    criticality: 'Medium',
    objectType: 'NCE',
    condition: 'Critical',
    vibrationStatus: 'Critical',
    lubeOilStatus: 'Good',
    lastUpdate: '23/02/2026, 12:47:04',
    observation: 'High vibration alarm triggered yesterday.',
  },
  {
    tag: 'COCE_TIME_NRS_03',
    fpso: 'UNY',
    name: 'Compressor Performance',
    class: 'COCE - Compressor, Centrifugal',
    system: 'Gas',
    criticality: 'Low',
    objectType: 'SECE',
    condition: 'Degraded',
    vibrationStatus: 'Good',
    lubeOilStatus: 'Degraded',
    lastUpdate: '23/02/2026, 12:47:04',
    observation: 'Lube oil level slightly below nominal.',
  },
  {
    tag: 'COCE_TIME_NRS_04',
    fpso: 'UNY',
    name: 'Compressor Performance',
    class: 'COCE - Compressor, Centrifugal',
    system: 'Gas',
    criticality: 'Medium',
    objectType: 'NCE',
    condition: 'Good',
    vibrationStatus: 'Good',
    lubeOilStatus: 'Good',
    lastUpdate: '23/02/2026, 12:47:04',
    observation: 'Inspection scheduled for upcoming maintenance window.',
  },
  {
    tag: 'COCE_TIME_NRS_05',
    fpso: 'UNY',
    name: 'Compressor Performance',
    class: 'COCE - Compressor, Centrifugal',
    system: 'Gas',
    criticality: 'Low',
    objectType: 'NCE',
    condition: 'Good',
    vibrationStatus: 'Good',
    lubeOilStatus: 'Good',
    lastUpdate: '23/02/2026, 12:47:04',
    observation: 'No issues reported.',
  },
  {
    tag: 'TURB_METH_GDS_01',
    fpso: 'UNY',
    name: 'Turbine Performance',
    class: 'TURB - Turbine, Gas',
    system: 'Gas',
    criticality: 'High',
    objectType: 'SECE',
    condition: 'Good',
    vibrationStatus: 'Good',
    lubeOilStatus: 'Good',
    lastUpdate: '24/02/2026, 10:20:15',
    observation: 'Operating under normal parameters.',
  },
  {
    tag: 'TURB_METH_GDS_02',
    fpso: 'UNY',
    name: 'Turbine Performance',
    class: 'TURB - Turbine, Gas',
    system: 'Gas',
    criticality: 'Medium',
    objectType: 'SECE',
    condition: 'Degraded',
    vibrationStatus: 'Good',
    lubeOilStatus: 'Degraded',
    lastUpdate: '24/02/2026, 11:35:40',
    observation: 'Increased exhaust temperature readings.',
  },
  {
    tag: 'PUMP_COOL_AUX_01',
    fpso: 'UNY',
    name: 'Cooling Pump',
    class: 'PUMP - Centrifugal Pump',
    system: 'Water',
    criticality: 'Low',
    objectType: 'NCE',
    condition: 'Good',
    vibrationStatus: 'Good',
    lubeOilStatus: 'Good',
    lastUpdate: '25/02/2026, 08:00:00',
    observation: 'Seal oil pressure stable.',
  },
];

const mockHistory = [
  // COCE_TIME_NRS_01
  { equipmentTag: 'COCE_TIME_NRS_01', vibrationStatus: 'Good', lubeOilStatus: 'Good', overallCondition: 'Good', changedAt: '2026-03-26T12:00:00Z' },
  { equipmentTag: 'COCE_TIME_NRS_01', vibrationStatus: 'Good', lubeOilStatus: 'Good', overallCondition: 'Good', changedAt: '2026-04-26T12:00:00Z' },
  { equipmentTag: 'COCE_TIME_NRS_01', vibrationStatus: 'Good', lubeOilStatus: 'Good', overallCondition: 'Good', changedAt: '2026-05-26T12:00:00Z' },

  // COCE_TIME_NRS_02
  { equipmentTag: 'COCE_TIME_NRS_02', vibrationStatus: 'Critical', lubeOilStatus: 'Good', overallCondition: 'Critical', changedAt: '2026-03-26T12:00:00Z' },
  { equipmentTag: 'COCE_TIME_NRS_02', vibrationStatus: 'Critical', lubeOilStatus: 'Good', overallCondition: 'Critical', changedAt: '2026-04-26T12:00:00Z' },
  { equipmentTag: 'COCE_TIME_NRS_02', vibrationStatus: 'Critical', lubeOilStatus: 'Good', overallCondition: 'Critical', changedAt: '2026-05-26T12:00:00Z' },

  // COCE_TIME_NRS_03
  { equipmentTag: 'COCE_TIME_NRS_03', vibrationStatus: 'Good', lubeOilStatus: 'Degraded', overallCondition: 'Degraded', changedAt: '2026-03-26T12:00:00Z' },
  { equipmentTag: 'COCE_TIME_NRS_03', vibrationStatus: 'Good', lubeOilStatus: 'Degraded', overallCondition: 'Degraded', changedAt: '2026-04-26T12:00:00Z' },
  { equipmentTag: 'COCE_TIME_NRS_03', vibrationStatus: 'Good', lubeOilStatus: 'Degraded', overallCondition: 'Degraded', changedAt: '2026-05-26T12:00:00Z' },

  // COCE_TIME_NRS_04
  { equipmentTag: 'COCE_TIME_NRS_04', vibrationStatus: 'Good', lubeOilStatus: 'Good', overallCondition: 'Good', changedAt: '2026-03-26T12:00:00Z' },
  { equipmentTag: 'COCE_TIME_NRS_04', vibrationStatus: 'Good', lubeOilStatus: 'Good', overallCondition: 'Good', changedAt: '2026-05-26T12:00:00Z' },

  // TURB_METH_GDS_02
  { equipmentTag: 'TURB_METH_GDS_02', vibrationStatus: 'Good', lubeOilStatus: 'Good', overallCondition: 'Good', changedAt: '2026-04-24T10:00:00Z' },
  { equipmentTag: 'TURB_METH_GDS_02', vibrationStatus: 'Good', lubeOilStatus: 'Degraded', overallCondition: 'Degraded', changedAt: '2026-05-24T11:00:00Z' },
];

const mockReports = [
  {
    equipmentTag: 'COCE_TIME_NRS_02',
    vibrationStatus: 'Critical',
    lubeOilStatus: 'Good',
    overallCondition: 'Critical',
    
    facility: 'FPSO UNY',
    system: 'Gas',
    tagNumber: 'COCE_TIME_NRS_02',
    cmmsNumber: 'CMMS-9082',
    cof: 'Medium',
    location: 'Module 3',
    machineName: 'MIGC B',
    mcProtection: 'Vibration Trip',
    operatingContext: 'Continuous Gas Export',
    technology: 'Vibration Analysis',
    
    component: 'Compressor',
    raisedBy: 'Gustavo Silva',
    raisedDate: '2026-06-15',
    targetDate: '2026-07-15',
    shortDescription: 'High vibration alarm on Compressor axial sensors',
    woNumber: '1089487',
    
    conditionAssessment: 'Based on the System 1 (S1) trend, the event log, and the typical behavior shown in the plot (abrupt jumps, reading lock-ups, and sudden offset changes), there is strong evidence of an instrumentation failure in the axial (thrust) sensors of the LNA bearing of the Main Gas Compressor C – ADG, rather than an actual mechanical condition of the compressor.',
    longDescription: 'Verify proper sensor fastening regarding the presence of looseness, bending, or sensor displacement. Check the integrity of the sensor connections, as well as their fastening, oxidation, and moisture. Perform channel cross-substitution (channel swap) to confirm whether the fault follows the sensor/cable or remains on the same channel.',
    createdAt: '2026-06-15T12:00:00Z',
  },
  {
    equipmentTag: 'COCE_TIME_NRS_03',
    vibrationStatus: 'Good',
    lubeOilStatus: 'Degraded',
    overallCondition: 'Degraded',
    
    facility: 'FPSO UNY',
    system: 'Gas',
    tagNumber: 'COCE_TIME_NRS_03',
    cmmsNumber: 'CMMS-1212',
    cof: 'Low',
    location: 'Module 3',
    machineName: 'MIGC C',
    mcProtection: 'Level Alarm',
    operatingContext: 'Continuous Gas Export',
    technology: 'Lube Oil Analysis',
    
    component: 'Gearbox Lube System',
    raisedBy: 'Gustavo Silva',
    raisedDate: '2026-06-25',
    targetDate: '2026-07-25',
    shortDescription: 'Lube oil level drop & slight metallic wear detected',
    woNumber: '1089555',
    
    conditionAssessment: 'Spectrometric analysis shows a slight increase in copper and iron particles. Viscosity is within limits but on the lower bound. Observation shows slight leakage near the shaft seal.',
    longDescription: 'Top up the lube oil level to nominal immediately. Monitor shaft seal leakage weekly. Plan seal replacement during the next turnaround window. Request filter check for iron particles.',
    createdAt: '2026-06-25T14:30:00Z',
  }
];

export async function seed() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(equipments);
  if (count > 0) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  console.log('Seeding database...');
  await db.insert(equipments).values(initialEquipments);
  await db.insert(equipmentHistory).values(mockHistory);
  await db.insert(analysisReports).values(mockReports);
  console.log('Seeding completed successfully.');
}
