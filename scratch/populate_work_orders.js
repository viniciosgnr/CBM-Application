const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../sqlite.db');
const db = new Database(dbPath);

console.log('--- Seeding Comprehensive Work Orders ---');

// 1. Normalize existing work orders status
db.prepare(`
  UPDATE work_orders 
  SET status = 'Open' 
  WHERE status IN ('Pending', 'Accepted', 'Observed', 'Under Preparation')
`).run();

// 2. Fetch all equipments and existing work orders
const equipments = db.prepare("SELECT * FROM equipments").all();
const existingWos = db.prepare("SELECT * FROM work_orders").all();

console.log(`Found ${equipments.length} equipments and ${existingWos.length} existing work orders.`);

// Find highest existing numeric reference
let maxRef = 801021300;
existingWos.forEach(w => {
  const num = parseInt(w.reference, 10);
  if (!isNaN(num) && num > maxRef) {
    maxRef = num;
  }
});

// Group existing WOs by tag
const wosByTag = new Map();
existingWos.forEach(w => {
  const tag = (w.tag_number || '').trim();
  if (!wosByTag.has(tag)) wosByTag.set(tag, []);
  wosByTag.get(tag).push(w);
});

const insertWoStmt = db.prepare(`
  INSERT INTO work_orders (
    reference, fpso, description, priority, status, tag_number, tag_description,
    monitoring_technique, creation_date, due_date, report_id, wo_site, directive,
    maint_org, work_type, external_source, external_source_id, fault_desc, symptom,
    discovery, action_id, operational_status
  ) VALUES (
    @reference, @fpso, @description, @priority, @status, @tagNumber, @tagDescription,
    @monitoringTechnique, @creationDate, @dueDate, @reportId, @woSite, @directive,
    @maintOrg, @workType, @externalSource, @externalSourceId, @faultDesc, @symptom,
    @discovery, @actionId, @operationalStatus
  )
`);

const pumpDirectives = [
  { dir: 'CHECK BEARING VIBRATION & ALIGNMENT', desc: 'Vibration surveillance: Check non-drive end bearing vibration and shaft alignment.', sym: 'VIB' },
  { dir: 'INSPECT MECHANICAL SEAL', desc: 'Mechanical seal inspection: Check for barrier fluid leakage and replace seal face if damaged.', sym: 'LEK' },
  { dir: 'LUBE OIL SAMPLING & FLUSH', desc: 'Lubrication surveillance: Take lube oil sample, check viscosity and particle contamination.', sym: 'ELU' },
  { dir: 'CHECK SENSOR GAP & FASTENING', desc: 'Instrumentation check: Verify proximity probe gap voltage and accelerometer fastening.', sym: 'STD' },
];

const compDirectives = [
  { dir: 'DRY GAS SEAL LEAKAGE INSPECTION', desc: 'Dry gas seal inspection: Verify primary vent leakage rates and differential pressure.', sym: 'LEK' },
  { dir: 'COMPRESSOR BEARING VIBRATION CHECK', desc: 'Perform vibration spectral analysis on drive-end journal bearing.', sym: 'VIB' },
  { dir: 'LUBE OIL FILTER ELEMENT REPLACEMENT', desc: 'Replace duplex lube oil filter cartridges and inspect differential pressure indicator.', sym: 'ELU' },
  { dir: 'SUCTION VALVE SURVEILLANCE', desc: 'Inspect suction/discharge valve integrity and thermographic heat distribution.', sym: 'TMP' },
];

const genDirectives = [
  { dir: 'TURBINE BEARING VIBRATION CHECK', desc: 'Gas turbine generator: Measure overall 1X and 2X vibration harmonics.', sym: 'VIB' },
  { dir: 'LUBE OIL COOLER CLEANING', desc: 'Clean lube oil heat exchanger and inspect differential temperature.', sym: 'TMP' },
  { dir: 'ELECTRICAL WINDING TEMPERATURE CHECK', desc: 'Generator stator and rotor winding temperature verification and insulation test.', sym: 'ELP' },
];

const generalDirectives = [
  { dir: 'PERIODIC CBM SURVEILLANCE', desc: 'Perform standard periodic condition monitoring and record analytical baseline.', sym: 'STD' },
  { dir: 'DRIVE COUPLING INSPECTION', desc: 'Inspect flexible disc coupling and check angular and radial misalignment.', sym: 'VIB' },
  { dir: 'MOTOR BEARING LUBRICATION', desc: 'Regrease electric motor drive-end and non-drive end rolling element bearings.', sym: 'ELU' },
  { dir: 'THERMOGRAPHIC HOTSPOT SCAN', desc: 'Execute infrared thermography scan on terminal connections and bearing housings.', sym: 'TMP' },
];

// Status cycle distribution: Open, In Progress, Completed, Cancelled
const statusCycle = ['Open', 'In Progress', 'Completed', 'Open', 'In Progress', 'Completed', 'Cancelled'];
const priorityCycle = ['High', 'Medium', 'Low', 'Accepted', 'High', 'Medium'];

let createdCount = 0;

const insertTransaction = db.transaction(() => {
  equipments.forEach((eq, eqIdx) => {
    const tag = (eq.tag || '').trim();
    const existing = wosByTag.get(tag) || [];

    // Aim for 2 to 3 work orders per equipment so dropdowns are always populated
    const needed = Math.max(0, 2 - existing.length);
    if (needed === 0) return;

    const fpso = (eq.fpso || 'UNY').replace(/^FPSO\s+/i, '').trim();
    const name = eq.name || 'Equipment';
    const isPump = (eq.class || '').toLowerCase().includes('pump') || tag.includes('PU');
    const isComp = (eq.class || '').toLowerCase().includes('compressor') || tag.includes('CO');
    const isGen = (eq.class || '').toLowerCase().includes('generator') || (eq.class || '').toLowerCase().includes('turbine') || tag.includes('TURB');

    const directivePool = isPump ? pumpDirectives : isComp ? compDirectives : isGen ? genDirectives : generalDirectives;

    for (let i = 0; i < needed; i++) {
      maxRef += 1;
      const refStr = String(maxRef);
      const chosenDirective = directivePool[(eqIdx + i) % directivePool.length];
      const chosenStatus = statusCycle[(eqIdx + i) % statusCycle.length];
      const chosenPriority = priorityCycle[(eqIdx + i) % priorityCycle.length];

      insertWoStmt.run({
        reference: refStr,
        fpso: fpso,
        description: `${chosenDirective.dir}: ${chosenDirective.desc}`,
        priority: chosenPriority,
        status: chosenStatus,
        tagNumber: tag,
        tagDescription: name,
        monitoringTechnique: 'CBM Vibration Analysis',
        creationDate: '15/08/2026, 09:00:00',
        dueDate: '15/09/2026, 17:00:00',
        reportId: null,
        woSite: fpso,
        directive: chosenDirective.dir,
        maintOrg: 'MECHTS',
        workType: 'CM',
        externalSource: 'CBM-VIB/H',
        externalSourceId: `CBM-${refStr}`,
        faultDesc: chosenDirective.desc,
        symptom: chosenDirective.sym,
        discovery: '04',
        actionId: '6',
        operationalStatus: '01',
      });
      createdCount++;
    }
  });
});

insertTransaction();

console.log(`Successfully generated and inserted ${createdCount} new Work Orders!`);

// 3. Verify total WOs count and status distribution
const totalWos = db.prepare("SELECT count(*) as total FROM work_orders").get();
const distribution = db.prepare("SELECT status, count(*) as count FROM work_orders GROUP BY status").all();
console.log('Total Work Orders in DB:', totalWos.total);
console.log('Status Distribution:', distribution);

// 4. Update reports cbm_case_status to ensure consistency
function resolveCbmCaseStatus(condition, woStatus, currentEffectiveness) {
  const isGood =
    (condition || '').includes('Good') ||
    (condition || '').includes('Tier 3') ||
    (condition || '').includes('Tier 4');

  if (isGood) {
    return { cbmCaseStatus: 'Closed', effectiveness: 'N/A' };
  }

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
    if (currentEffectiveness && validClosedEffectiveness.includes(currentEffectiveness)) {
      return { cbmCaseStatus: 'Closed', effectiveness: currentEffectiveness };
    }
    return {
      cbmCaseStatus: 'Awaiting Feedback',
      effectiveness: 'Pending Assessment',
    };
  }

  return {
    cbmCaseStatus: 'Awaiting Action',
    effectiveness:
      currentEffectiveness && currentEffectiveness !== 'N/A'
        ? currentEffectiveness
        : 'Pending Assessment',
  };
}
const allReports = db.prepare("SELECT * FROM analysis_reports").all();
const allWosMap = new Map();
db.prepare("SELECT * FROM work_orders").all().forEach(w => allWosMap.set(w.reference, w));

const updateReportStmt = db.prepare(`
  UPDATE analysis_reports 
  SET cbm_case_status = ?, effectiveness = ?
  WHERE id = ?
`);

let reportsUpdated = 0;
const reportTx = db.transaction(() => {
  allReports.forEach(r => {
    const linkedWo = r.wo_number ? allWosMap.get(r.wo_number) : null;
    const woStatus = linkedWo ? linkedWo.status : null;
    const res = resolveCbmCaseStatus(r.overall_condition, woStatus, r.effectiveness);
    updateReportStmt.run(res.cbmCaseStatus, res.effectiveness, r.id);
    reportsUpdated++;
  });
});
reportTx();
console.log(`Updated ${reportsUpdated} reports with synchronized CBM Case Status!`);

const reportDist = db.prepare("SELECT cbm_case_status, count(*) as count FROM analysis_reports GROUP BY cbm_case_status").all();
console.log('Reports CBM Case Status Distribution:', reportDist);
