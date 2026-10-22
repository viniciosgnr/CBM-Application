const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../sqlite.db');
const db = new Database(dbPath);

// 1. Add column if not exists
const columns = db.prepare("PRAGMA table_info(analysis_reports)").all();
const hasCbmCaseStatus = columns.some(c => c.name === 'cbm_case_status');

if (!hasCbmCaseStatus) {
  console.log('Adding column cbm_case_status to analysis_reports...');
  db.prepare("ALTER TABLE analysis_reports ADD COLUMN cbm_case_status TEXT").run();
  console.log('Column added successfully.');
} else {
  console.log('Column cbm_case_status already exists.');
}

// 2. Fetch all reports and work orders to calculate statuses
const reports = db.prepare("SELECT * FROM analysis_reports").all();
const workOrders = db.prepare("SELECT * FROM work_orders").all();

const woMap = new Map();
workOrders.forEach(wo => {
  woMap.set(wo.reference, wo);
});

console.log(`Processing ${reports.length} reports...`);

const updateStmt = db.prepare(`
  UPDATE analysis_reports 
  SET cbm_case_status = ?, effectiveness = ?
  WHERE id = ?
`);

const updates = db.transaction(() => {
  let count = 0;
  for (const r of reports) {
    const cond = r.overall_condition || '';
    const isGood = cond.includes('Good') || cond.includes('Tier 3') || cond.includes('Tier 4');
    
    let targetStatus = 'Awaiting Action';
    let targetEffectiveness = r.effectiveness;

    if (isGood) {
      targetStatus = 'Closed';
      targetEffectiveness = 'N/A';
    } else {
      // Degraded or Critical
      const linkedWo = r.wo_number ? woMap.get(r.wo_number) : null;
      const woStatus = linkedWo ? linkedWo.status : null;

      if (woStatus === 'Cancelled') {
        targetStatus = 'Cancelled';
      } else if (woStatus === 'Completed') {
        const hasValidEffectiveness = targetEffectiveness && 
          ['Effective', 'Partially Effective', 'Ineffective', 'Not Yet Assessable'].includes(targetEffectiveness);
        
        if (hasValidEffectiveness) {
          targetStatus = 'Closed';
        } else {
          targetStatus = 'Awaiting Feedback';
          targetEffectiveness = 'Pending Assessment';
        }
      } else {
        // Opened, In Progress, Pending, Accepted, or no WO
        targetStatus = 'Awaiting Action';
        if (!targetEffectiveness || targetEffectiveness === 'N/A') {
          targetEffectiveness = 'Pending Assessment';
        }
      }
    }

    updateStmt.run(targetStatus, targetEffectiveness, r.id);
    count++;
  }
  return count;
});

const updatedCount = updates();
console.log(`Successfully updated ${updatedCount} reports with CBM Case Status!`);

// Print sample
const sample = db.prepare("SELECT id, equipment_tag, overall_condition, wo_number, effectiveness, cbm_case_status FROM analysis_reports LIMIT 10").all();
console.log('Sample updated reports:', sample);
