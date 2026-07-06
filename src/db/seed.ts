import { db } from './index';
import { equipments, equipmentHistory, analysisReports, workOrders } from './schema';
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
    woNumber: '801021309',
    
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
    woNumber: '801021310',
    
    conditionAssessment: 'Spectrometric analysis shows a slight increase in copper and iron particles. Viscosity is within limits but on the lower bound. Observation shows slight leakage near the shaft seal.',
    longDescription: 'Top up the lube oil level to nominal immediately. Monitor shaft seal leakage weekly. Plan seal replacement during the next turnaround window. Request filter check for iron particles.',
    createdAt: '2026-06-25T14:30:00Z',
  }
];

const mockWorkOrders = [
  {
    reference: '801021309',
    fpso: 'UNY',
    description: 'High vibration alarm on Compressor axial sensors. Verify sensor fastening and channel cross-substitution.',
    priority: 'Accepted',
    status: 'Accepted',
    tagNumber: 'COCE_TIME_NRS_02',
    tagDescription: 'Compressor Performance',
    monitoringTechnique: 'CBM Vibration - Analysis High',
    creationDate: '23/02/2026, 12:47:04',
    dueDate: '23/02/2026, 12:47:04',
    reportId: 1,
    woSite: 'UNY',
    directive: 'VIBRATION SENSOR CHECK',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: 'CBM-VIB/H',
    externalSourceId: 'CBM-1089487',
    faultDesc: 'Anomaly: Based on trends, instrumentation failure in axial sensors. Recommendation: Verify sensor fastening, check integrity of connections.',
    symptom: 'VIB',
    discovery: '04',
    actionId: '6',
    operationalStatus: '01',
  },
  {
    reference: '801021310',
    fpso: 'UNY',
    description: 'Lube oil level drop & slight metallic wear detected. Viscosity is within limits but on the lower bound.',
    priority: 'Accepted',
    status: 'Accepted',
    tagNumber: 'COCE_TIME_NRS_03',
    tagDescription: 'Compressor Performance',
    monitoringTechnique: 'CBM Lube Oil - Analysis Medium',
    creationDate: '23/02/2026, 12:47:04',
    dueDate: '23/02/2026, 12:47:04',
    reportId: 2,
    woSite: 'UNY',
    directive: 'OIL REPLACE',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: 'CBM-LUB/M',
    externalSourceId: 'CBM-1089555',
    faultDesc: 'Anomaly: Spectrometric analysis shows copper and iron increase. Recommendation: Top up lube oil, monitor seal leakage.',
    symptom: 'ELU',
    discovery: '04',
    actionId: '7',
    operationalStatus: '01',
  },
  {
    reference: '801021311',
    fpso: 'UNY',
    description: 'Pressure transmitter readings unstable on discharge header.',
    priority: 'Pending',
    status: 'Pending',
    tagNumber: 'COCE_TIME_NRS_01',
    tagDescription: 'Compressor Performance',
    monitoringTechnique: 'CBM Pressure - Calibration',
    creationDate: '23/02/2026, 12:47:04',
    dueDate: '23/02/2026, 12:47:04',
    woSite: 'UNY',
    directive: 'CALIBRATE TRANSMITTER',
    maintOrg: 'INSTR',
    workType: 'CM',
    externalSource: 'CBM-VIB/L',
    externalSourceId: '3',
    faultDesc: 'Pressure transmitter readings unstable.',
    symptom: 'STD',
    discovery: '04',
    actionId: '6',
    operationalStatus: '01',
  },
  {
    reference: '801021312',
    fpso: 'UNY',
    description: 'Routine diagnostic inspection on mechanical seal oil.',
    priority: 'Accepted',
    status: 'Accepted',
    tagNumber: 'TURB_METH_GDS_02',
    tagDescription: 'Turbine Performance',
    monitoringTechnique: 'CBM Vibration - Analysis High',
    creationDate: '23/02/2026, 12:47:04',
    dueDate: '23/02/2026, 12:47:04',
    woSite: 'UNY',
    directive: 'INSPECT SEAL OIL',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: 'CBM-VIB/H',
    externalSourceId: '4',
    faultDesc: 'Routine diagnostic inspection on mechanical seal oil.',
    symptom: 'ELP',
    discovery: '04',
    actionId: '9',
    operationalStatus: '01',
  },
  {
    reference: '801021313',
    fpso: 'UNY',
    description: 'Lube oil filter delta pressure alarm triggered.',
    priority: 'Pending',
    status: 'Pending',
    tagNumber: 'COCE_TIME_NRS_04',
    tagDescription: 'Compressor Performance',
    monitoringTechnique: 'CBM Delta P - Filter Check',
    creationDate: '23/02/2026, 12:47:04',
    dueDate: '23/02/2026, 12:47:04',
    woSite: 'UNY',
    directive: 'REPLACE FILTER',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: 'CBM-LUB/M',
    externalSourceId: '5',
    faultDesc: 'Lube oil filter delta pressure alarm triggered.',
    symptom: 'PLU',
    discovery: '04',
    actionId: '5',
    operationalStatus: '02',
  },
  {
    reference: '801021314',
    fpso: 'UNY',
    description: 'Stator winding insulation check required.',
    priority: 'Accepted',
    status: 'Accepted',
    tagNumber: 'TURB_METH_GDS_01',
    tagDescription: 'Turbine Performance',
    monitoringTechnique: 'CBM Electrical - Stator',
    creationDate: '24/02/2026, 10:20:15',
    dueDate: '25/02/2026, 10:20:15',
    woSite: 'UNY',
    directive: 'CHECK INSULATION',
    maintOrg: 'ELEC',
    workType: 'CM',
    externalSource: 'CBM-VIB/H',
    externalSourceId: '6',
    faultDesc: 'Stator winding insulation check required.',
    symptom: 'STD',
    discovery: '04',
    actionId: '6',
    operationalStatus: '01',
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
  
  // Insert reports first and get their inserted IDs
  const insertedReports = await db.insert(analysisReports).values(mockReports).returning();
  
  // Update reportId references in mockWorkOrders
  const updatedWorkOrders = mockWorkOrders.map((wo) => {
    if (wo.reference === '801021309' && insertedReports[0]) {
      return { ...wo, reportId: insertedReports[0].id };
    }
    if (wo.reference === '801021310' && insertedReports[1]) {
      return { ...wo, reportId: insertedReports[1].id };
    }
    return { ...wo, reportId: null };
  });

  await db.insert(workOrders).values(updatedWorkOrders);
  console.log('Seeding completed successfully.');
}
