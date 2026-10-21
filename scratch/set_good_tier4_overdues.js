const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

// 1. Convert the two specific equipments from the user screenshot to Good - Tier 4
const specificTags = ['UNY_111-PKPD-5200', 'PTY_111-PKPD-5100'];

for (const tag of specificTags) {
  db.prepare(`
    UPDATE equipments
    SET condition = 'Good - Tier 4',
        vibration_status = 'Good - Tier 4',
        lube_oil_status = 'Good - Tier 4'
    WHERE tag = ?
  `).run(tag);
  console.log(`Converted ${tag} to Good - Tier 4`);
}

// 2. Select additional Good - Tier 4 equipments to make Overdue across FPSOs
const additionalTags = [
  'DNY_111-PKPD-0400',
  'DNY_115-PUCE-9503-B',
  'DNY_116-PURO-0004-B',
  'UNY_115-PUCE-9503-A',
  'UNY_116-PURO-0004-A',
  'PIR_111-PKPD-0100',
  'PIR_111-PKPD-0200',
  'PAR_111-PKPD-0100',
  'PAR_111-PKPD-0200',
];

for (const tag of additionalTags) {
  const eq = db.prepare('SELECT tag FROM equipments WHERE tag = ?').get(tag);
  if (eq) {
    db.prepare(`
      UPDATE equipments
      SET condition = 'Good - Tier 4',
          vibration_status = 'Good - Tier 4',
          lube_oil_status = 'Good - Tier 4',
          last_update = '20/06/2026, 10:30:00',
          last_vibration_update = '20/06/2026, 10:30:00',
          last_lube_oil_update = '10/05/2026, 10:30:00',
          vibration_frequency = '24 DAY',
          lube_oil_frequency = '84 DAY'
      WHERE tag = ?
    `).run(tag);
    console.log(`Updated ${tag} to Overdue + Good - Tier 4`);
  }
}

// Verify results
const rows = db.prepare(`
  SELECT tag, condition, vibration_status, lube_oil_status, last_vibration_update, last_lube_oil_update 
  FROM equipments 
  WHERE condition = 'Good - Tier 4'
`).all();

const today = new Date('2026-08-31T23:59:59Z');
function parseDate(str) {
  if (!str) return null;
  const parts = str.split(',')[0].trim().split('/');
  if (parts.length === 3) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  return new Date(str);
}

const overdueTier4 = rows.filter(r => {
  const dVib = parseDate(r.last_vibration_update);
  let isVibOver = false;
  if (dVib) {
    dVib.setDate(dVib.getDate() + 24);
    isVibOver = today > dVib;
  }
  const dOil = parseDate(r.last_lube_oil_update);
  let isOilOver = false;
  if (dOil) {
    dOil.setDate(dOil.getDate() + 84);
    isOilOver = today > dOil;
  }
  return isVibOver || isOilOver;
});

console.log('Total Good - Tier 4 Overdue equipments now in database:', overdueTier4.length);
console.log('Sample tags:', overdueTier4.map(r => r.tag));
