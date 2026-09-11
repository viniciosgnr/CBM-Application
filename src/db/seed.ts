import { db } from './index';
import { equipments, equipmentHistory, analysisReports, workOrders } from './schema';
import { sql } from 'drizzle-orm';
import { sbmEquipments } from './sbm-equipments';

import { mockReports } from './mock-reports';

const mockWorkOrders = [
  // UNY FPSO
  {
    reference: '801021309',
    fpso: 'UNY',
    description: 'High vibration alarm on Compressor axial sensors. Verify sensor fastening.',
    priority: 'Accepted',
    status: 'Accepted',
    tagNumber: 'COCE_TIME_NRS_02',
    tagDescription: 'Compressor Performance',
    monitoringTechnique: 'CBM Vibration - Analysis High',
    creationDate: '22/07/2026, 14:10:00',
    dueDate: '25/07/2026, 14:10:00',
    reportId: 1,
    woSite: 'UNY',
    directive: 'VIBRATION SENSOR CHECK',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: 'CBM-VIB/H',
    externalSourceId: 'CBM-1089487',
    faultDesc: 'Anomaly: Instrumentation failure in axial sensors.',
    symptom: 'VIB',
    discovery: '04',
    actionId: '6',
    operationalStatus: '01',
  },
  {
    reference: '801021310',
    fpso: 'UNY',
    description: 'Lube oil level drop & slight metallic wear detected.',
    priority: 'Accepted',
    status: 'Accepted',
    tagNumber: 'COCE_TIME_NRS_03',
    tagDescription: 'Compressor Performance',
    monitoringTechnique: 'CBM Lube Oil - Analysis Medium',
    creationDate: '20/07/2026, 09:30:00',
    dueDate: '27/07/2026, 09:30:00',
    woSite: 'UNY',
    directive: 'OIL REPLACE',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: 'CBM-LUB/M',
    externalSourceId: 'CBM-1089555',
    faultDesc: 'Anomaly: Copper and iron particle increase.',
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
    creationDate: '19/07/2026, 11:00:00',
    dueDate: '29/07/2026, 11:00:00',
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
    status: 'Completed',
    tagNumber: 'TURB_METH_GDS_02',
    tagDescription: 'Turbine Performance',
    monitoringTechnique: 'CBM Vibration - Analysis High',
    creationDate: '15/07/2026, 10:00:00',
    dueDate: '21/07/2026, 10:00:00',
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
    creationDate: '18/07/2026, 16:20:00',
    dueDate: '15/08/2026, 16:20:00',
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
    status: 'In Progress',
    tagNumber: 'TURB_METH_GDS_01',
    tagDescription: 'Turbine Performance',
    monitoringTechnique: 'CBM Electrical - Stator',
    creationDate: '24/07/2026, 10:20:15',
    dueDate: '02/08/2026, 10:20:15',
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
  },
  {
    reference: '801021315',
    fpso: 'UNY',
    description: 'Impeller wear investigation for Cooling Water Pump B.',
    priority: 'Rejected',
    status: 'Cancelled',
    tagNumber: 'PUMP_COOL_AUX_02',
    tagDescription: 'Cooling Water Pump',
    monitoringTechnique: 'CBM Vibration - Analysis High',
    creationDate: '23/07/2026, 07:15:00',
    dueDate: '24/07/2026, 07:15:00',
    woSite: 'UNY',
    directive: 'IMPELLER OVERHAUL',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: 'CBM-VIB/H',
    externalSourceId: '7',
    faultDesc: 'Cavitation noise detected.',
    symptom: 'VIB',
    discovery: '04',
    actionId: '8',
    operationalStatus: '03',
  },

  // CDI FPSO
  {
    reference: '801021320',
    fpso: 'CDI',
    description: 'Emergency bearing replacement and lube oil flush on Crude Oil Transfer Pump B.',
    priority: 'Accepted',
    status: 'In Progress',
    tagNumber: 'CDI_PUMP_OIL_02',
    tagDescription: 'Crude Oil Transfer Pump B',
    monitoringTechnique: 'CBM Vibration - Analysis High',
    creationDate: '24/07/2026, 13:20:00',
    dueDate: '26/07/2026, 13:20:00',
    reportId: 2,
    woSite: 'CDI',
    directive: 'BEARING REPLACEMENT',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: 'CBM-VIB/H',
    externalSourceId: '8',
    faultDesc: 'Overheating thrust bearing.',
    symptom: 'HOT',
    discovery: '04',
    actionId: '1',
    operationalStatus: '01',
  },
  {
    reference: '801021321',
    fpso: 'CDI',
    description: 'Vibration spectral analysis on Main Gas Compressor B.',
    priority: 'Accepted',
    status: 'Accepted',
    tagNumber: 'CDI_COMP_MAIN_02',
    tagDescription: 'Main Gas Compressor B',
    monitoringTechnique: 'CBM Vibration - Spectral',
    creationDate: '20/07/2026, 18:10:00',
    dueDate: '30/07/2026, 18:10:00',
    woSite: 'CDI',
    directive: 'SPECTRAL DIAGNOSTIC',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: 'CBM-VIB/M',
    externalSourceId: '9',
    faultDesc: 'Spectral spike at 2X RPM.',
    symptom: 'VIB',
    discovery: '04',
    actionId: '6',
    operationalStatus: '01',
  },
  {
    reference: '801021322',
    fpso: 'CDI',
    description: 'Dehydration and lube oil purification on Main Power Generator Turb-B.',
    priority: 'Pending',
    status: 'Pending',
    tagNumber: 'CDI_GEN_TURB_02',
    tagDescription: 'Main Power Generator Turb-B',
    monitoringTechnique: 'CBM Lube Oil - Moisture Check',
    creationDate: '16/07/2026, 11:30:00',
    dueDate: '10/08/2026, 11:30:00',
    woSite: 'CDI',
    directive: 'OIL PURIFICATION',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: 'CBM-LUB/M',
    externalSourceId: '10',
    faultDesc: 'Water content exceeds limit.',
    symptom: 'WTR',
    discovery: '04',
    actionId: '7',
    operationalStatus: '01',
  },
  {
    reference: '801021323',
    fpso: 'CDI',
    description: 'Post-commissioning check for Main Gas Compressor A.',
    priority: 'Accepted',
    status: 'Completed',
    tagNumber: 'CDI_COMP_MAIN_01',
    tagDescription: 'Main Gas Compressor A',
    monitoringTechnique: 'CBM Performance Test',
    creationDate: '22/07/2026, 15:45:00',
    dueDate: '23/07/2026, 15:45:00',
    woSite: 'CDI',
    directive: 'PERFORMANCE VERIFY',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: 'CBM-VIB/L',
    externalSourceId: '11',
    faultDesc: 'Recommissioning verify.',
    symptom: 'OK',
    discovery: '04',
    actionId: '9',
    operationalStatus: '01',
  },
  {
    reference: '801021324',
    fpso: 'CDI',
    description: 'Alignment laser check on Crude Oil Transfer Pump A.',
    priority: 'Accepted',
    status: 'In Progress',
    tagNumber: 'CDI_PUMP_OIL_01',
    tagDescription: 'Crude Oil Transfer Pump A',
    monitoringTechnique: 'CBM Laser Alignment',
    creationDate: '17/07/2026, 14:00:00',
    dueDate: '28/07/2026, 14:00:00',
    woSite: 'CDI',
    directive: 'LASER ALIGNMENT',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: 'CBM-VIB/L',
    externalSourceId: '12',
    faultDesc: 'Laser alignment routine.',
    symptom: 'MIS',
    discovery: '04',
    actionId: '6',
    operationalStatus: '01',
  },
  {
    reference: '801021325',
    fpso: 'CDI',
    description: 'High-pressure seal flushing for Water Injection Pump 1.',
    priority: 'Accepted',
    status: 'Completed',
    tagNumber: 'CDI_WATER_INJ_01',
    tagDescription: 'Water Injection Pump 1',
    monitoringTechnique: 'CBM Pressure Check',
    creationDate: '24/07/2026, 16:00:00',
    dueDate: '25/07/2026, 16:00:00',
    woSite: 'CDI',
    directive: 'SEAL FLUSH',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: 'CBM-VIB/L',
    externalSourceId: '13',
    faultDesc: 'High-pressure seal flushing.',
    symptom: 'OK',
    discovery: '04',
    actionId: '9',
    operationalStatus: '01',
  },
  {
    reference: '801021326',
    fpso: 'CDI',
    description: 'Offline preservation inspection for Water Injection Pump 2.',
    priority: 'Pending',
    status: 'Pending',
    tagNumber: 'CDI_WATER_INJ_02',
    tagDescription: 'Water Injection Pump 2',
    monitoringTechnique: 'CBM Preservation Check',
    creationDate: '10/07/2026, 08:00:00',
    dueDate: '10/08/2026, 08:00:00',
    woSite: 'CDI',
    directive: 'PRESERVATION CHECK',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: 'CBM-VIB/L',
    externalSourceId: '14',
    faultDesc: 'Offline unit check.',
    symptom: 'OFF',
    discovery: '04',
    actionId: '9',
    operationalStatus: '01',
  },

  // SEP FPSO
  {
    reference: '801021330',
    fpso: 'SEP',
    description: 'Mechanical seal replacement on Second Stage Separator Pump.',
    priority: 'Accepted',
    status: 'In Progress',
    tagNumber: 'SEP_SEP_HEATER_02',
    tagDescription: 'Second Stage Separator Pump',
    monitoringTechnique: 'CBM Vibration - Analysis High',
    creationDate: '24/07/2026, 06:10:00',
    dueDate: '27/07/2026, 06:10:00',
    woSite: 'SEP',
    directive: 'SEAL REPLACEMENT',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: 'CBM-VIB/H',
    externalSourceId: '15',
    faultDesc: 'Severe mechanical seal leakage.',
    symptom: 'LEAK',
    discovery: '04',
    actionId: '1',
    operationalStatus: '01',
  },
  {
    reference: '801021331',
    fpso: 'SEP',
    description: 'Piston rod packing seal temperature check on Booster Compressor B.',
    priority: 'Accepted',
    status: 'Accepted',
    tagNumber: 'SEP_COMP_BOOST_02',
    tagDescription: 'Gas Booster Compressor B',
    monitoringTechnique: 'CBM Thermography - Rod Seal',
    creationDate: '18/07/2026, 17:40:00',
    dueDate: '28/07/2026, 17:40:00',
    woSite: 'SEP',
    directive: 'PACKING SEAL CHECK',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: 'CBM-VIB/M',
    externalSourceId: '16',
    faultDesc: 'Elevated rod temperature.',
    symptom: 'HOT',
    discovery: '04',
    actionId: '6',
    operationalStatus: '01',
  },
  {
    reference: '801021332',
    fpso: 'SEP',
    description: 'Filter replacement on Produced Water Pump B.',
    priority: 'Pending',
    status: 'Pending',
    tagNumber: 'SEP_WATER_TREAT_02',
    tagDescription: 'Produced Water Pump B',
    monitoringTechnique: 'CBM Delta P - Filter',
    creationDate: '12/07/2026, 10:20:00',
    dueDate: '12/08/2026, 10:20:00',
    woSite: 'SEP',
    directive: 'REPLACE FILTER',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: 'CBM-LUB/M',
    externalSourceId: '17',
    faultDesc: 'High differential pressure across filter.',
    symptom: 'CLOG',
    discovery: '04',
    actionId: '5',
    operationalStatus: '01',
  },
  {
    reference: '801021333',
    fpso: 'SEP',
    description: 'Valve timing diagnostic on Gas Booster Compressor A.',
    priority: 'Accepted',
    status: 'Completed',
    tagNumber: 'SEP_COMP_BOOST_01',
    tagDescription: 'Gas Booster Compressor',
    monitoringTechnique: 'CBM Reciprocating Diagnostic',
    creationDate: '23/07/2026, 11:15:00',
    dueDate: '24/07/2026, 11:15:00',
    woSite: 'SEP',
    directive: 'VALVE TIMING CHECK',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: 'CBM-VIB/L',
    externalSourceId: '18',
    faultDesc: 'Valve timing within specs.',
    symptom: 'OK',
    discovery: '04',
    actionId: '9',
    operationalStatus: '01',
  },
  {
    reference: '801021334',
    fpso: 'SEP',
    description: 'Coupling inspection on First Stage Separator Pump.',
    priority: 'Accepted',
    status: 'In Progress',
    tagNumber: 'SEP_SEP_HEATER_01',
    tagDescription: 'First Stage Separator Pump',
    monitoringTechnique: 'CBM Vibration - Analysis High',
    creationDate: '22/07/2026, 08:50:00',
    dueDate: '31/07/2026, 08:50:00',
    woSite: 'SEP',
    directive: 'INSPECT COUPLING',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: 'CBM-VIB/L',
    externalSourceId: '19',
    faultDesc: 'Coupling elastomeric check.',
    symptom: 'VIB',
    discovery: '04',
    actionId: '6',
    operationalStatus: '01',
  },
  {
    reference: '801021335',
    fpso: 'SEP',
    description: 'Emergency Diesel Generator battery bank voltage test.',
    priority: 'Accepted',
    status: 'Completed',
    tagNumber: 'SEP_TURB_GEN_01',
    tagDescription: 'Emergency Diesel Generator',
    monitoringTechnique: 'CBM Electrical - Battery',
    creationDate: '21/07/2026, 12:00:00',
    dueDate: '22/07/2026, 12:00:00',
    woSite: 'SEP',
    directive: 'BATTERY TEST',
    maintOrg: 'ELEC',
    workType: 'CM',
    externalSource: 'CBM-VIB/L',
    externalSourceId: '20',
    faultDesc: 'Battery bank voltage normal.',
    symptom: 'OK',
    discovery: '04',
    actionId: '9',
    operationalStatus: '01',
  },
  {
    reference: '801021336',
    fpso: 'SEP',
    description: 'VFD drive harmonics check for Flare Gas Blower A.',
    priority: 'Accepted',
    status: 'In Progress',
    tagNumber: 'SEP_FLARE_BLOWER_01',
    tagDescription: 'Flare Gas Blower A',
    monitoringTechnique: 'CBM Electrical - VFD',
    creationDate: '23/07/2026, 09:10:00',
    dueDate: '01/08/2026, 09:10:00',
    woSite: 'SEP',
    directive: 'VFD HARMONICS CHECK',
    maintOrg: 'ELEC',
    workType: 'CM',
    externalSource: 'CBM-VIB/L',
    externalSourceId: '21',
    faultDesc: 'VFD modulation check.',
    symptom: 'ELEC',
    discovery: '04',
    actionId: '6',
    operationalStatus: '01',
  },
  {
    reference: '801021337',
    fpso: 'SEP',
    description: 'Fan blade balancing for Flare Gas Blower B.',
    priority: 'Rejected',
    status: 'Cancelled',
    tagNumber: 'SEP_FLARE_BLOWER_02',
    tagDescription: 'Flare Gas Blower B',
    monitoringTechnique: 'CBM Dynamic Balancing',
    creationDate: '05/07/2026, 14:00:00',
    dueDate: '06/07/2026, 14:00:00',
    woSite: 'SEP',
    directive: 'DYNAMIC BALANCING',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: 'CBM-VIB/L',
    externalSourceId: '22',
    faultDesc: 'Offline unit, deferred.',
    symptom: 'OFF',
    discovery: '04',
    actionId: '8',
    operationalStatus: '03',
  }
];

export async function seed() {
  console.log('Clearing existing records for seed refresh...');

  // Ensure equipments table has frequency and collection_method columns
  try {
    await db.run(sql`ALTER TABLE equipments ADD COLUMN frequency TEXT DEFAULT 'Monthly';`);
  } catch {}
  try {
    await db.run(sql`ALTER TABLE equipments ADD COLUMN collection_method TEXT DEFAULT 'Online';`);
  } catch {}
  try {
    await db.run(sql`ALTER TABLE equipments ADD COLUMN vibration_frequency TEXT DEFAULT 'Monthly';`);
  } catch {}
  try {
    await db.run(sql`ALTER TABLE equipments ADD COLUMN lube_oil_frequency TEXT DEFAULT 'Monthly';`);
  } catch {}
  try {
    await db.run(sql`ALTER TABLE equipments ADD COLUMN last_vibration_update TEXT;`);
  } catch {}
  try {
    await db.run(sql`ALTER TABLE equipments ADD COLUMN last_lube_oil_update TEXT;`);
  } catch {}

  // Ensure analysis_reports has failure mode columns
  try {
    await db.run(sql`ALTER TABLE analysis_reports ADD COLUMN equipment_class TEXT;`);
  } catch {}
  try {
    await db.run(sql`ALTER TABLE analysis_reports ADD COLUMN subunit TEXT;`);
  } catch {}
  try {
    await db.run(sql`ALTER TABLE analysis_reports ADD COLUMN maintainable_item TEXT;`);
  } catch {}
  try {
    await db.run(sql`ALTER TABLE analysis_reports ADD COLUMN failure_mode_description TEXT;`);
  } catch {}
  try {
    await db.run(sql`ALTER TABLE analysis_reports ADD COLUMN failure_mechanism_subdivision TEXT;`);
  } catch {}

  await db.delete(workOrders);
  await db.delete(analysisReports);
  await db.delete(equipmentHistory);
  await db.delete(equipments);

  console.log('Seeding database with expanded datasets (25+ items per table)...');
  const now = new Date();
  const getRelativeDateStr = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}, 10:30:00`;
  };

  const getRelativeISO = (daysAgo: number, timeStr = '10:30:00Z') => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return `${d.toISOString().split('T')[0]}T${timeStr}`;
  };

  const sanitizedEquipments = sbmEquipments.map((eq: Record<string, string>, index: number) => {
    // Generate distinct relative dates & frequencies for Vibration and Lube Oil
    const vibDaysAgo = index % 5 === 0 ? 3 : index % 3 === 0 ? 12 : index % 2 === 0 ? 22 : 45;
    const oilDaysAgo = index % 4 === 0 ? 5 : index % 3 === 0 ? 18 : index % 2 === 0 ? 28 : 60;

    const vibDateStr = getRelativeDateStr(vibDaysAgo);
    const oilDateStr = getRelativeDateStr(oilDaysAgo);

    // Assign realistic condition distribution across 339 real assets
    let cond = 'Good - Tier 4';
    let vibStat = 'Good - Tier 4';
    let oilStat = 'Good - Tier 4';

    if (index % 17 === 0) {
      cond = 'Critical - Tier 1';
      vibStat = 'Critical - Tier 1';
      oilStat = 'Critical - Tier 1';
    } else if (index % 11 === 0) {
      cond = 'Degraded - Tier 2';
      vibStat = 'Degraded - Tier 2';
      oilStat = 'Good - Tier 4';
    } else if (index % 7 === 0) {
      cond = 'Good - Tier 3';
      vibStat = 'Good - Tier 3';
      oilStat = 'Good - Tier 4';
    }

    const nameLower = (eq.name || '').toLowerCase();
    let crit = 'Medium';
    if (eq.objectType === 'SECE') {
      crit = 'High';
    } else if (
      nameLower.includes('utility') ||
      nameLower.includes('drain') ||
      nameLower.includes('fan') ||
      nameLower.includes('blower') ||
      nameLower.includes('hvac') ||
      nameLower.includes('transfer') ||
      nameLower.includes('sump') ||
      nameLower.includes('package') ||
      index % 5 === 0
    ) {
      crit = 'Low';
    }

    const tagUpper = (eq.tag || '').toUpperCase();
    const nameUpper = (eq.name || '').toUpperCase();
    let eqClass = 'equipmentClass_PUCE';
    if (tagUpper.includes('PURE') || nameUpper.includes('RECIPROCATING')) {
      eqClass = 'equipmentClass_PURE';
    } else if (tagUpper.includes('PUCE') || nameUpper.includes('PUMP')) {
      eqClass = 'equipmentClass_PUCE';
    } else if (tagUpper.includes('COSC') || nameUpper.includes('SCREW')) {
      eqClass = 'equipmentClass_COSC';
    } else if (tagUpper.includes('COCE') || nameUpper.includes('COMPRESSOR')) {
      eqClass = 'equipmentClass_COCE';
    } else if (tagUpper.includes('COBL') || nameUpper.includes('FAN') || nameUpper.includes('BLOWER')) {
      eqClass = 'equipmentClass_COBL';
    } else if (tagUpper.includes('PKAC') || tagUpper.includes('PKPD') || nameUpper.includes('PACKAGE') || nameUpper.includes('AIR')) {
      eqClass = 'equipmentClass_PKAC';
    } else if (tagUpper.includes('DRDE') || nameUpper.includes('DIESEL') || nameUpper.includes('GENERATOR') || nameUpper.includes('TURBINE') || eq.class === 'Power Generator') {
      eqClass = 'equipmentClass_DRDE';
    } else if (eq.class === 'Centrifugal Pump') {
      eqClass = 'equipmentClass_PUCE';
    } else if (eq.class === 'Gas Compressor') {
      eqClass = 'equipmentClass_COCE';
    } else if (eq.class === 'Fan/Blower') {
      eqClass = 'equipmentClass_COBL';
    }

    return {
      tag: eq.tag,
      fpso: eq.tag.includes('_') ? eq.tag.split('_')[0] : (eq.fpso || 'DNY'),
      name: eq.name,
      class: eqClass,
      system: eq.system || 'Process Utilities',
      criticality: crit,
      objectType: eq.objectType || 'SECE',
      condition: cond,
      vibrationStatus: vibStat,
      lubeOilStatus: oilStat,
      lastUpdate: vibDateStr,
      observation: cond.startsWith('Critical') ? 'High vibration amplitude and particle contamination detected.' : cond.startsWith('Degraded') ? 'Slight bearing noise detected during operational run.' : 'Operating normally under scheduled CBM surveillance.',
      frequency: '24 DAY',
      vibrationFrequency: '24 DAY',
      lubeOilFrequency: '84 DAY',
      lastVibrationUpdate: vibDateStr,
      lastLubeOilUpdate: oilDateStr,
      collectionMethod: eq.collectionMethod || 'Online',
    };
  });

  const expandedHistory = sanitizedEquipments.flatMap((eq: Record<string, string>, index: number) => {
    const vibDaysAgo = index % 5 === 0 ? 3 : index % 3 === 0 ? 12 : index % 2 === 0 ? 22 : 45;
    const oilDaysAgo = index % 4 === 0 ? 5 : index % 3 === 0 ? 18 : index % 2 === 0 ? 28 : 60;

    const p1Date = getRelativeISO(120, '09:00:00Z');
    const p2Date = getRelativeISO(75, '11:15:00Z');

    const historyRecords = [
      {
        equipmentTag: eq.tag,
        vibrationStatus: 'Good - Tier 4',
        lubeOilStatus: 'Good - Tier 4',
        overallCondition: 'Good - Tier 4',
        changedAt: p1Date,
      },
      {
        equipmentTag: eq.tag,
        vibrationStatus: 'Good - Tier 3',
        lubeOilStatus: 'Good - Tier 4',
        overallCondition: 'Good - Tier 3',
        changedAt: p2Date,
      },
    ];

    if (vibDaysAgo < oilDaysAgo) {
      // Lube oil analysis was completed first (oilDaysAgo), Vibration analysis completed later (vibDaysAgo)
      historyRecords.push({
        equipmentTag: eq.tag,
        vibrationStatus: 'Good - Tier 3',
        lubeOilStatus: eq.lubeOilStatus,
        overallCondition: eq.lubeOilStatus.startsWith('Critical') ? eq.lubeOilStatus : 'Good - Tier 3',
        changedAt: getRelativeISO(oilDaysAgo, '14:20:00Z'),
      });
      historyRecords.push({
        equipmentTag: eq.tag,
        vibrationStatus: eq.vibrationStatus,
        lubeOilStatus: eq.lubeOilStatus,
        overallCondition: eq.condition,
        changedAt: getRelativeISO(vibDaysAgo, '10:30:00Z'),
      });
    } else if (oilDaysAgo < vibDaysAgo) {
      // Vibration analysis was completed first (vibDaysAgo), Lube oil completed later (oilDaysAgo)
      historyRecords.push({
        equipmentTag: eq.tag,
        vibrationStatus: eq.vibrationStatus,
        lubeOilStatus: 'Good - Tier 4',
        overallCondition: eq.vibrationStatus.startsWith('Critical') ? eq.vibrationStatus : eq.condition,
        changedAt: getRelativeISO(vibDaysAgo, '09:45:00Z'),
      });
      historyRecords.push({
        equipmentTag: eq.tag,
        vibrationStatus: eq.vibrationStatus,
        lubeOilStatus: eq.lubeOilStatus,
        overallCondition: eq.condition,
        changedAt: getRelativeISO(oilDaysAgo, '10:30:00Z'),
      });
    } else {
      historyRecords.push({
        equipmentTag: eq.tag,
        vibrationStatus: eq.vibrationStatus,
        lubeOilStatus: eq.lubeOilStatus,
        overallCondition: eq.condition,
        changedAt: getRelativeISO(vibDaysAgo, '10:30:00Z'),
      });
    }

    return historyRecords;
  });

  await db.insert(equipments).values(sanitizedEquipments);
  await db.insert(equipmentHistory).values(expandedHistory);
  
  const eqClassMap = new Map<string, string>();
  sanitizedEquipments.forEach((e) => {
    eqClassMap.set(e.tag, e.class);
  });

  const enrichedReports = mockReports.map((r) => ({
    ...r,
    equipmentClass: eqClassMap.get(r.equipmentTag) || 'equipmentClass_PUCE',
  }));

  // Insert reports first and get their inserted IDs
  const insertedReports = await db.insert(analysisReports).values(enrichedReports).returning();
  
  // Update reportId references in mockWorkOrders
  const updatedWorkOrders = mockWorkOrders.map((wo) => {
    const matchingReport = insertedReports.find((r) => r.woNumber === wo.reference);
    if (matchingReport) {
      return {
        ...wo,
        reportId: matchingReport.id,
        tagNumber: matchingReport.equipmentTag,
        fpso: matchingReport.facility ? matchingReport.facility.replace(/^FPSO\s+/i, '') : wo.fpso,
        tagDescription: matchingReport.machineName || wo.tagDescription,
        description: matchingReport.shortDescription || wo.description,
      };
    }
    return { ...wo, reportId: null };
  });

  await db.insert(workOrders).values(updatedWorkOrders);
  console.log('Seeding completed successfully with 25+ records per table.');
}
