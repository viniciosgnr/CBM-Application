const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../sqlite.db');
const db = new Database(dbPath);

console.log('--- 1. Enriquecendo Non-Collection Reasons dos Equipamentos ---');
const allEquipments = db.prepare('SELECT id, tag, condition FROM equipments ORDER BY id ASC').all();
console.log(`Total de equipamentos: ${allEquipments.length}`);

// Razões realistas para os ~20% não coletados
const reasonsPool = [
  'Process Not Running',
  'Operational Constraints',
  'Awaiting Maintenance',
  'Process Not Running',
  'No Safe Access',
  'Operational Constraints',
  'Not collected',
  'Awaiting Maintenance',
  'Process Not Running',
  'Operational Constraints',
];

const updateEqStmt = db.prepare(`
  UPDATE equipments
  SET non_collection_reason = ?,
      vibration_non_collection_reason = ?,
      lube_oil_non_collection_reason = ?
  WHERE id = ?
`);

let nonCollectedCount = 0;
let surveyedCount = 0;

const updateEqs = db.transaction(() => {
  allEquipments.forEach((eq, index) => {
    // A cada 5 equipamentos (~20%), atribuímos um motivo de não-coleta
    if (index % 5 === 0) {
      const reason = reasonsPool[(index / 5) % reasonsPool.length];
      const vibReason = index % 2 === 0 ? reason : null;
      const oilReason = index % 3 === 0 ? reason : null;

      updateEqStmt.run(reason, vibReason || reason, oilReason || reason, eq.id);
      nonCollectedCount++;
    } else {
      updateEqStmt.run(null, null, null, eq.id);
      surveyedCount++;
    }
  });
});

updateEqs();
console.log(`Equipamentos atualizados: ${surveyedCount} Surveyed (~${Math.round(surveyedCount / allEquipments.length * 100)}%), ${nonCollectedCount} com motivos de não coleta (~${Math.round(nonCollectedCount / allEquipments.length * 100)}%)`);

console.log('--- 2. Enriquecendo Relatórios com Failure Mechanisms para 2026-10 e 2026-09 ---');
const reports = db.prepare('SELECT id, raised_date, technology, failure_mechanism_subdivision FROM analysis_reports ORDER BY id ASC').all();
console.log(`Total de relatórios existentes: ${reports.length}`);

// Mecanismos para distribuir entre vibração e óleo
const vibMechanisms = [
  'Mechanical Failure - Unbalance',
  'Mechanical Failure - Misalignment',
  'Material Failure - Wear',
  'Mechanical Failure - Cavitation',
  'Mechanical Failure - Looseness',
  'Hydrodynamic Instability - Oil Whirl',
  'Mechanical Failure - Vibration',
];

const oilMechanisms = [
  'Fluid Degradation - Water Ingress',
  'Fluid Degradation - Fuel Dilution',
  'Material Failure - Wear',
  'External Influence - Contamination',
  'Material Failure - Fatigue',
  'Fluid Degradation - Fuel Dilution',
];

const updateRepStmt = db.prepare(`
  UPDATE analysis_reports
  SET raised_date = ?,
      failure_mechanism_subdivision = ?
  WHERE id = ?
`);

const updateReports = db.transaction(() => {
  reports.forEach((rep, index) => {
    const isVib = (rep.technology || '').toLowerCase().includes('vib');
    const pool = isVib ? vibMechanisms : oilMechanisms;
    const selectedMech = pool[index % pool.length];

    // Distribuir as datas de relatórios para abranger 2026-10 (mês atual), 2026-09, 2026-08, 2026-07, 2026-06
    let targetMonth = '2026-10';
    if (index % 5 === 1) targetMonth = '2026-09';
    else if (index % 5 === 2) targetMonth = '2026-08';
    else if (index % 5 === 3) targetMonth = '2026-07';
    else if (index % 5 === 4) targetMonth = '2026-06';

    const day = String((index % 28) + 1).padStart(2, '0');
    const newRaisedDate = `${targetMonth}-${day}`;

    updateRepStmt.run(newRaisedDate, selectedMech, rep.id);
  });
});

updateReports();
console.log('Relatórios atualizados com sucesso para meses recentes!');

// Verificação dos resultados
const countReasons = db.prepare(`
  SELECT COALESCE(non_collection_reason, 'Surveyed') as reason, COUNT(*) as count 
  FROM equipments 
  GROUP BY reason 
  ORDER BY count DESC
`).all();
console.log('\nDistribuição de Collection Compliance:');
console.table(countReasons);

const countMechsOct = db.prepare(`
  SELECT failure_mechanism_subdivision, COUNT(*) as count 
  FROM analysis_reports 
  WHERE raised_date LIKE '2026-10%'
  GROUP BY failure_mechanism_subdivision 
  ORDER BY count DESC
`).all();
console.log('\nDistribuição de Failure Mechanisms para Outubro/2026:');
console.table(countMechsOct);

db.close();
console.log('\nConcluído!');
