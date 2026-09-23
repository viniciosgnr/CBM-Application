---
marp: true
theme: gaia
_class: lead
paginate: true
backgroundColor: #ffffff
color: #0f172a
style: |
  section {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
    padding: 35px 45px;
    background-color: #ffffff;
    color: #0f172a;
  }
  h1 {
    color: #002e5d;
    font-size: 1.7rem;
    font-weight: 700;
    margin-bottom: 4px;
  }
  h2 {
    color: #002e5d;
    font-size: 1.15rem;
    font-weight: 700;
    text-decoration: underline;
    text-decoration-color: #002e5d;
    margin-top: 10px;
    margin-bottom: 6px;
  }
  .sbm-pill {
    display: inline-block;
    width: 14px;
    height: 24px;
    background-color: #f15a24;
    border-radius: 6px;
    vertical-align: middle;
    margin-right: 8px;
  }
  .sbm-tag {
    color: #f15a24;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .sbm-orange { color: #f15a24; font-weight: 700; }
  .sbm-navy { color: #002e5d; font-weight: 700; }
  table {
    font-size: 0.72rem;
    border-collapse: collapse;
    width: 100%;
    margin-top: 8px;
  }
  th {
    background-color: #002e5d;
    color: #ffffff;
    padding: 5px 8px;
    border: 1px solid #cbd5e1;
    font-weight: 600;
  }
  td {
    padding: 5px 8px;
    border: 1px solid #cbd5e1;
  }
  .td-green { background-color: #e2efda; font-weight: 700; text-align: center; }
  .td-yellow { background-color: #fff2cc; font-weight: 700; text-align: center; }
  .td-orange { background-color: #fce4d6; font-weight: 700; text-align: center; }
  .td-red { background-color: #f8cecc; font-weight: 700; text-align: center; }
  .box-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 14px;
    margin: 8px 0;
  }
  .box-orange {
    background: #fffaf8;
    border-left: 4px solid #f15a24;
    border-radius: 0 8px 8px 0;
    padding: 8px 12px;
    margin: 6px 0;
  }
  footer {
    font-size: 0.65rem;
    color: #64748b;
  }
---

<!-- Slide 1: Title Slide -->
<div style="border-left: 5px solid #f15a24; padding-left: 20px; margin-top: 50px;">
  <span class="sbm-tag">CONDITION BASED MAINTENANCE (CBM)</span>
  <h1 style="font-size: 2.2rem; margin: 8px 0; color: #002e5d;">Fleet Health & Risk Scoring Methodology</h1>
  <p style="font-size: 1.15rem; color: #64748b; margin: 4px 0;">
    Alignment with SBM LOD2-PM, IFS RAM Severity & CBMnet Standards
  </p>
  <p style="font-size: 0.85rem; color: #002e5d; margin-top: 30px; font-weight: 600;">
    Reliability & Condition Monitoring Engineering Team | Technical Validation Deck
  </p>
</div>

<footer>© SBM Offshore. All rights reserved. www.sbmoffshore.com</footer>

---

<!-- Slide 2: SBM LOD2-PM & CBMnet Standards -->
# <span class="sbm-pill"></span>Baseline Context: SBM LOD2-PM & CBMnet Standards

<div style="display: flex; gap: 20px;">
  <div style="flex: 1;" class="box-card">
    <h2>SBM LOD2 - PM Standard</h2>
    <ul style="font-size: 0.78rem; line-height: 1.4; color: #334155;">
      <li><strong class="sbm-navy">Activation Logic:</strong> Activated when PM is overdue; deactivated upon "Work Done".</li>
      <li><strong class="sbm-navy">FAR Score Determination:</strong> Likelihood × RAM-based Severity.</li>
      <li><strong class="sbm-orange">PM Overdue Formula (FAR Standard):</strong><br>
        <code>PM Overdue (%) = [(Today - Due Date) / PM Interval] × 100%</code>
      </li>
      <li><strong class="sbm-navy">Operational Mapping:</strong> Governs surveillance collection adherence into 6 overdue indices (Not Overdue to >200%).</li>
    </ul>
  </div>

  <div style="flex: 1;" class="box-card">
    <h2>CBMnet Standard (§1.6)</h2>
    <ul style="font-size: 0.78rem; line-height: 1.4; color: #334155;">
      <li><strong class="sbm-navy">Fault Risk (Max 25):</strong> Highest Fault Likelihood (Max 5) × Consequence (Max 5).</li>
      <li><strong class="sbm-navy">Compliance Risk (Max 25):</strong> Compliance Level (Max 5) × Consequence (Max 5).</li>
      <li><strong class="sbm-orange">CBMnet Total Risk (Max 30):</strong><br>
        <code>Total Risk = Fault Risk + (20% × Compliance Risk)</code>
      </li>
      <li><strong class="sbm-navy">Pareto Weighting:</strong> Condition severity is primary. Overdue PM acts as a 20% secondary modifier.</li>
    </ul>
  </div>
</div>

<footer>© SBM Offshore. All rights reserved. www.sbmoffshore.com | Slide 2</footer>

---

<!-- Slide 3: KPI 1 — Fault Risk Formulation & Matrix -->
# <span class="sbm-pill"></span>KPI 1: Fault Risk Formulation & Matrix (1 to 12)

<div class="box-orange">
  <span class="sbm-navy" style="font-size: 0.85rem; font-weight: 700;">FORMULA: Fault Risk = Worst Condition Tier (1 to 4) × IFS RAM Criticality (1 to 3)</span><br>
  <span style="font-size: 0.72rem; color: #64748b;">Scale: 1 to 12 pts | Rule: Condition = max(Vibration Tier, Lube Oil Tier)</span>
</div>

<div style="display: flex; gap: 20px; margin-top: 6px;">
  <div style="flex: 1.2;">
    <h2>Fault Risk Matrix (4×3)</h2>
    <table>
      <tr>
        <th>IFS Criticality</th>
        <th>Tier 4 (Good)</th>
        <th>Tier 3 (Good)</th>
        <th>Tier 2 (Degr.)</th>
        <th>Tier 1 (Crit.)</th>
      </tr>
      <tr>
        <td><strong>High / SECE (3)</strong></td>
        <td class="td-green">3</td>
        <td class="td-yellow">6</td>
        <td class="td-orange">9</td>
        <td class="td-red">12</td>
      </tr>
      <tr>
        <td><strong>Medium (2)</strong></td>
        <td class="td-green">2</td>
        <td class="td-yellow">4</td>
        <td class="td-yellow">6</td>
        <td class="td-orange">8</td>
      </tr>
      <tr>
        <td><strong>Low (1)</strong></td>
        <td class="td-green">1</td>
        <td class="td-green">2</td>
        <td class="td-green">3</td>
        <td class="td-yellow">4</td>
      </tr>
    </table>
  </div>

  <div style="flex: 1;" class="box-card">
    <h2>Fleet Overall Health %</h2>
    <ul style="font-size: 0.75rem; line-height: 1.35; color: #334155;">
      <li><strong>Max Fleet Points:</strong> <code>N × 12 points</code></li>
      <li><strong>Active Defect Penalties Only:</strong>
        <ul>
          <li>Tier 1 (Critical): Deducts Fault Risk score</li>
          <li>Tier 2 (Degraded): Deducts Fault Risk score</li>
          <li>Tier 3/4 (Good): Deducts 0 pts</li>
        </ul>
      </li>
      <li><strong class="sbm-orange">Formula:</strong><br>
        <code>Health % = [(Max Pts - Deductions) / Max Pts] × 100%</code>
      </li>
    </ul>
  </div>
</div>

<footer>© SBM Offshore. All rights reserved. www.sbmoffshore.com | Slide 3</footer>

---

<!-- Slide 4: KPI 2 — Compliance Risk & PM Overdue -->
# <span class="sbm-pill"></span>KPI 2: Compliance Risk & PM Overdue (0 to 15)

<div class="box-orange">
  <span class="sbm-navy" style="font-size: 0.85rem; font-weight: 700;">FORMULA: Compliance Risk = IFS RAM Criticality (1 to 3) × PM Overdue Index (0 to 5)</span><br>
  <span style="font-size: 0.72rem; color: #64748b;">Scale: 0 to 15 pts | PM Overdue (%) = [(Today - Planned Date) / PM Interval] × 100%</span>
</div>

<div style="display: flex; gap: 20px; margin-top: 6px;">
  <div style="flex: 1.3;">
    <h2>Compliance Risk Matrix (3×6)</h2>
    <table>
      <tr>
        <th>IFS Criticality</th>
        <th>Idx 0 (0%)</th>
        <th>Idx 1 (50%)</th>
        <th>Idx 2 (100%)</th>
        <th>Idx 3 (150%)</th>
        <th>Idx 4 (200%)</th>
        <th>Idx 5 (>200%)</th>
      </tr>
      <tr>
        <td><strong>High / SECE (3)</strong></td>
        <td class="td-green">0</td>
        <td class="td-green">3</td>
        <td class="td-yellow">6</td>
        <td class="td-orange">9</td>
        <td class="td-red">12</td>
        <td class="td-red">15</td>
      </tr>
      <tr>
        <td><strong>Medium (2)</strong></td>
        <td class="td-green">0</td>
        <td class="td-green">2</td>
        <td class="td-yellow">4</td>
        <td class="td-yellow">6</td>
        <td class="td-orange">8</td>
        <td class="td-orange">10</td>
      </tr>
      <tr>
        <td><strong>Low (1)</strong></td>
        <td class="td-green">0</td>
        <td class="td-green">1</td>
        <td class="td-green">2</td>
        <td class="td-green">3</td>
        <td class="td-yellow">4</td>
        <td class="td-yellow">5</td>
      </tr>
    </table>
  </div>

  <div style="flex: 0.9;" class="box-card">
    <h2>Fleet Compliance %</h2>
    <ul style="font-size: 0.75rem; line-height: 1.35; color: #334155;">
      <li><strong>Max Fleet Points:</strong> <code>N × 15 points</code></li>
      <li><strong>Worst-Case Dual Technique:</strong><br>
        <code>max(Crit × Index(Vib), Crit × Index(Oil))</code>
      </li>
      <li><strong>Overdue Penalty:</strong> Every overdue machine subtracts its Compliance Risk score.</li>
      <li><strong class="sbm-orange">Formula:</strong><br>
        <code>Compliance % = [(Max Pts - Deductions) / Max Pts] × 100%</code>
      </li>
    </ul>
  </div>
</div>

<footer>© SBM Offshore. All rights reserved. www.sbmoffshore.com | Slide 4</footer>

---

<!-- Slide 5: KPI 3 — CBM Total Risk Synthesis -->
# <span class="sbm-pill"></span>KPI 3: CBM Total Risk Synthesis (1.0 to 15.0)

<div class="box-orange">
  <span class="sbm-navy" style="font-size: 0.85rem; font-weight: 700;">FORMULA: CBM Total Risk = Fault Risk (1 to 12) + (20% × Compliance Risk (0 to 15))</span><br>
  <span style="font-size: 0.72rem; color: #64748b;">Scale: 1.0 to 15.0 pts (Minimum: 1.0 | Maximum: 12 + 0.2×15 = 15.0 pts)</span>
</div>

<h2>Risk Severity Classification Tiers</h2>
<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 6px;">
  <div class="box-card" style="border-top: 4px solid #22c55e;">
    <h3 style="font-size: 0.85rem; color: #166534; margin: 0;">LOW RISK</h3>
    <p style="font-size: 0.9rem; font-weight: 700; margin: 4px 0;">&lt; 4.0</p>
    <p style="font-size: 0.68rem; color: #64748b;">Normal baseline operation and on-schedule survey adherence. Routine surveillance.</p>
  </div>

  <div class="box-card" style="border-top: 4px solid #eab308;">
    <h3 style="font-size: 0.85rem; color: #854d0e; margin: 0;">MEDIUM RISK</h3>
    <p style="font-size: 0.9rem; font-weight: 700; margin: 4px 0;">4.0 - 7.9</p>
    <p style="font-size: 0.68rem; color: #64748b;">Early-stage degradation or moderate overdue PM. Engineering monitoring review.</p>
  </div>

  <div class="box-card" style="border-top: 4px solid #f97316;">
    <h3 style="font-size: 0.85rem; color: #9a3412; margin: 0;">HIGH RISK</h3>
    <p style="font-size: 0.9rem; font-weight: 700; margin: 4px 0;">8.0 - 11.9</p>
    <p style="font-size: 0.68rem; color: #64748b;">Substantial degradation (Tier 2 on critical machine) or severe inspection blind spot.</p>
  </div>

  <div class="box-card" style="border-top: 4px solid #ef4444;">
    <h3 style="font-size: 0.85rem; color: #991b1b; margin: 0;">CRITICAL RISK</h3>
    <p style="font-size: 0.9rem; font-weight: 700; margin: 4px 0;">&ge; 12.0</p>
    <p style="font-size: 0.68rem; color: #64748b;">Imminent failure potential (Tier 1 on high criticality machine). Priority intervention.</p>
  </div>
</div>

<div class="box-card" style="margin-top: 10px;">
  <span class="sbm-navy" style="font-size: 0.78rem; font-weight: 700;">Fleet Total Health %:</span>
  <span style="font-size: 0.75rem; color: #334155;">
    <code>Max Potential = N × 15.0 pts | Deduction_i = Fault Deduction_i + 0.2 × Compliance Risk_i | Total Health % = [(Max Pts - Total Deductions) / Max Pts] × 100%</code>
  </span>
</div>

<footer>© SBM Offshore. All rights reserved. www.sbmoffshore.com | Slide 5</footer>

---

<!-- Slide 6: Score Harmonization & Fleet Dashboard -->
# <span class="sbm-pill"></span>Score Harmonization & Fleet Dashboard

<h2>Equipment Details Modal: Score Badges</h2>
<div class="box-card" style="text-align: center; padding: 10px;">
  <span style="font-size: 1.15rem; font-weight: 700; color: #002e5d;">
    [ Fault: 8/12 ] &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [ Compliance: 6/15 ] &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [ Total Risk: 9.2/15 ]
  </span>
</div>

<h2>Fleet KPI Dashboard Cards (100% Potential)</h2>
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 6px;">
  <div class="box-card">
    <strong class="sbm-navy" style="font-size: 0.8rem;">FAULT RISK & HEALTH</strong>
    <h3 style="font-size: 1.6rem; color: #f15a24; text-align: center; margin: 8px 0;">98.3%</h3>
    <p style="font-size: 0.72rem; text-align: center; font-weight: 700; color: #64748b; margin: 0 0 8px 0;">HEALTH</p>
    <ul style="font-size: 0.68rem; line-height: 1.35; color: #334155; margin: 0; padding-left: 14px;">
      <li>Avg Fault Risk: 2.1 / 12</li>
      <li>Evaluated: 104 machines</li>
      <li>At Risk: 3 machines (1 Crit, 2 Deg)</li>
      <li>Deduction: -21 pts</li>
    </ul>
  </div>

  <div class="box-card">
    <strong class="sbm-navy" style="font-size: 0.8rem;">COMPLIANCE RISK</strong>
    <h3 style="font-size: 1.6rem; color: #f15a24; text-align: center; margin: 8px 0;">95.8%</h3>
    <p style="font-size: 0.72rem; text-align: center; font-weight: 700; color: #64748b; margin: 0 0 8px 0;">COMPLIANCE</p>
    <ul style="font-size: 0.68rem; line-height: 1.35; color: #334155; margin: 0; padding-left: 14px;">
      <li>Avg Compliance: 0.8 / 15</li>
      <li>On Schedule: 92 machines</li>
      <li>Overdue PM: 12 machines</li>
      <li>Deduction: -65 pts</li>
    </ul>
  </div>

  <div class="box-card">
    <strong class="sbm-navy" style="font-size: 0.8rem;">CBM TOTAL RISK</strong>
    <h3 style="font-size: 1.6rem; color: #f15a24; text-align: center; margin: 8px 0;">97.2%</h3>
    <p style="font-size: 0.72rem; text-align: center; font-weight: 700; color: #64748b; margin: 0 0 8px 0;">TOTAL HEALTH</p>
    <ul style="font-size: 0.68rem; line-height: 1.35; color: #334155; margin: 0; padding-left: 14px;">
      <li>Avg Total Risk: 2.3 / 15</li>
      <li>Critical / High: 2 machines</li>
      <li>Medium / Low: 102 machines</li>
      <li>Deduction: -34.0 pts</li>
    </ul>
  </div>
</div>

<footer>© SBM Offshore. All rights reserved. www.sbmoffshore.com | Slide 6</footer>

---

<!-- Slide 7: Practical Offshore Case Study -->
# <span class="sbm-pill"></span>Practical Case Study: Crude Export Pump (P-01A)

<div style="display: flex; gap: 20px;">
  <div style="flex: 1;" class="box-card">
    <h2>Asset Operational Inputs</h2>
    <ul style="font-size: 0.78rem; line-height: 1.4; color: #334155;">
      <li><strong class="sbm-navy">Asset:</strong> P-01A (Crude Oil Export Pump)</li>
      <li><strong class="sbm-navy">IFS RAM Criticality:</strong> High (Score = 3)</li>
      <li><strong class="sbm-navy">Surveillance Findings:</strong>
        <ul>
          <li>Vibration Survey: Tier 2 (Degraded bearing = 3)</li>
          <li>Lube Oil Survey: Tier 4 (Good = 1)</li>
          <li>Resolved Worst Condition = <strong>Tier 2 (Degraded = 3 pts)</strong></li>
        </ul>
      </li>
      <li><strong class="sbm-navy">PM Overdue Adherence:</strong>
        <ul>
          <li>Vib PM Frequency: 24 days | Last: 42 days ago</li>
          <li>Overdue: 18 days &rarr; 75.0% &rarr; <strong>Index 2</strong></li>
        </ul>
      </li>
    </ul>
  </div>

  <div style="flex: 1;" class="box-card">
    <h2>Scoring & Fleet Impact</h2>
    <ul style="font-size: 0.78rem; line-height: 1.4; color: #334155;">
      <li><strong class="sbm-navy">1. Fault Risk Score:</strong><br>
        <code>3 (Crit) × 3 (Tier 2) = 9 / 12 pts (High Risk)</code>
      </li>
      <li><strong class="sbm-navy">2. Compliance Risk Score:</strong><br>
        <code>3 (Crit) × 2 (Index) = 6 / 15 pts (Moderate Delay)</code>
      </li>
      <li><strong class="sbm-orange">3. CBM Total Risk Score:</strong><br>
        <code>9 + (0.20 × 6) = 10.2 / 15.0 pts (High Risk)</code>
      </li>
      <li><strong class="sbm-navy">4. Fleet Deduction Impact:</strong><br>
        Deducts 9 pts from Fault Health, 6 pts from Compliance, and 10.2 pts from Total Health. Fully auditable to defect and delay.
      </li>
    </ul>
  </div>
</div>

<footer>© SBM Offshore. All rights reserved. www.sbmoffshore.com | Slide 7</footer>
