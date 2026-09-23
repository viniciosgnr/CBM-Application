---
marp: true
theme: gaia
_class: lead
paginate: true
backgroundColor: #0c101d
color: #e2e8f0
style: |
  section {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 40px;
    background-color: #0c101d;
    color: #e2e8f0;
  }
  h1, h2, h3 {
    color: #f8fafc;
  }
  h1 { font-size: 1.8rem; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
  h2 { font-size: 1.4rem; color: #60a5fa; margin-top: 10px; }
  table {
    font-size: 0.78rem;
    border-collapse: collapse;
    width: 100%;
    margin-top: 12px;
  }
  th {
    background-color: #1e293b;
    color: #93c5fd;
    padding: 6px 10px;
    border: 1px solid #334155;
  }
  td {
    padding: 6px 10px;
    border: 1px solid #334155;
    background-color: #111827;
  }
  .highlight { color: #38bdf8; font-weight: bold; }
  .badge-crit { background: rgba(239, 68, 68, 0.2); color: #f87171; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
  .badge-warn { background: rgba(245, 158, 11, 0.2); color: #fbbf24; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
  .badge-ok { background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
  code {
    background-color: #1e2538;
    color: #38bdf8;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.85em;
  }
  .box {
    background: #111625;
    border-left: 4px solid #3b82f6;
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;
    margin: 10px 0;
  }
  .box-amber {
    background: #18161e;
    border-left: 4px solid #f59e0b;
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;
    margin: 10px 0;
  }
  footer {
    font-size: 0.65rem;
    color: #64748b;
  }
---

<!-- Slide 1: Title Slide -->
# Condition Based Maintenance (CBM)
## Fleet Health & Risk Scoring Methodology
### Mathematical Formulation, Standards Alignment & Fleet Deduction Logic

**Presenter:** Reliability & Condition Monitoring Engineering Team  
**System:** CBM Application (OptiSite Alignment)  
**Standard References:** CBMnet User Guide §1.6 & FAR PM Overdue Standard

---

<!-- Slide 2: Executive Summary & Objective -->
# Executive Summary & Objectives

- **Primary Goal**: Establish an objective, transparent, and auditable methodology to quantify:
  1. **Fault Risk** (Physical asset degradation derived from Vibration & Lube Oil);
  2. **Compliance Risk** (Operational overdue exposure against planned PM intervals);
  3. **CBM Total Risk** (Consolidated asset criticality balancing condition and adherence).

- **Fleet Aggregation Innovation**:
  - Replace ambiguous ordinal rankings with a **unified penalty deduction strategy** over **100% Total Health**.
  - Provide individual machine risk scores in standard ratio format (`Fault: X/12`, `Compliance: Y/15`, `Total Risk: Z/15`) for immediate offshore decision-making.

---

<!-- Slide 3: Reference Baseline 1: CBMnet Standard -->
# Reference Baseline: CBMnet Risk Levels (§1.6)

In standard CBMnet documentation, asset risk levels are defined by a **5x5 Matrix**:

1. **Fault Risk (Max 25)**:
   $$\text{Fault Risk} = \text{Highest Likelihood of all Faults (Max 5)} \times \text{Consequence of Failure (Max 5)}$$
2. **Compliance Risk (Max 25)**:
   $$\text{Compliance Risk} = \text{Compliance Level (Max 5)} \times \text{Consequence of Failure (Max 5)}$$
3. **CBMnet Total Risk (Max 30)**:
   $$\text{CBMnet Total Risk} = \text{Fault Risk} + (20\% \times \text{Compliance Risk})$$

<div class="box">
<b>Core Design Principle:</b> Condition severity is prioritized as primary, while maintenance compliance acts as a secondary modifier scaled at 20% (Pareto ratio).
</div>

---

<!-- Slide 4: Reference Baseline 2: PM Overdue Formula -->
# Reference Baseline: PM Overdue Criteria

The operational delay index is governed by the standard **FAR Overdue PM** formula:

$$\text{PM Overdue (\%)} = \frac{\text{Today} - \text{Due Date}}{\text{PM Interval (Days)}} \times 100\%$$

$$\text{Run-Hour Alternative} = \frac{\text{Current Run Hours since Last PM}}{\text{PM Interval Run Hours}} \times 100\%$$

### Standard Overdue Criteria Intervals:
| Status | Overdue Range | Description | Delay Severity |
| :--- | :---: | :--- | :---: |
| **Not Overdue** | $\le 0\%$ | Route completed on or ahead of schedule | Level 0 |
| **Early Overdue** | $0\% - 50\%$ | Minor route slippage within allowable grace | Level 1 |
| **Moderate Overdue** | $50\% - 100\%$ | Exceeded interval by up to 1 full period | Level 2 |
| **High Overdue** | $100\% - 150\%$ | Double inspection cycle missed | Level 3 |
| **Severe Overdue** | $150\% - 200\%$ | Prolonged monitoring gap | Level 4 |
| **Critical Overdue** | $> 200\%$ | Severe blind-spot (> 2x nominal cycle) | Level 5 |

---

<!-- Slide 5: Architectural Adaptation for Offshore CBM -->
# Architectural Adaptation: Real-World Data Integration

Our industrial production environment integrates with **IFS Enterprise Asset Management (EAM)** and **ISO 17359 / Vibration Condition Tiers**:

| Dimension | CBMnet Theoretical | Our CBM Implementation | Justification |
| :--- | :---: | :---: | :--- |
| **Consequence / Criticality** | 5 discrete levels | **3 IFS RAM Classes**<br>(Low = 1, Med = 2, High/SECE = 3) | Pre-determined by Project RAM study and mastered in IFS. Avoids subjective re-classification. |
| **Likelihood / Condition** | 5 arbitrary levels | **4 Standard CBM Tiers**<br>(T4=1, T3=2, T2=3, T1=4) | Certified analyst assessment standard (ISO 10816 / 13373). |
| **Max Fault Score** | 25 points | **12 points** ($4 \text{ Tiers} \times 3 \text{ Crit}$) | Compact, mathematically robust matrix. |
| **Max Compliance Score** | 25 points | **15 points** ($3 \text{ Crit} \times 5 \text{ Index}$) | Combines IFS criticality with 6-stage PM Overdue. |
| **Max Total Risk** | 30 points | **15.0 points** ($12 + 0.2 \times 15$) | Preserves CBMnet's exact 20% compliance weight. |

---

<!-- Slide 6: KPI 1 — Fault Risk Calculation -->
# KPI 1: Fault Risk Formulation (Score 1 to 12)

For each machine $i$, Fault Risk combines analyst surveillance findings with asset criticality:

$$\text{Fault Risk}_i = \text{Worst Condition Tier}_i \times \text{IFS Criticality Weight}_i$$

- **Condition Tier Score**:
  - $\text{Critical (Tier 1)} = 4$
  - $\text{Degraded (Tier 2)} = 3$
  - $\text{Good (Tier 3)} = 2$
  - $\text{Good (Tier 4)} = 1$
- **Multi-technique Consolidation**:
  $$\text{Condition}_i = \max(\text{Tier}(\text{Vibration}_i), \text{Tier}(\text{Lube Oil}_i))$$
- **IFS Criticality Weight**:
  - $\text{High / Critical / SECE} = 3$
  - $\text{Medium} = 2$
  - $\text{Low} = 1$

---

<!-- Slide 7: KPI 1 — Fault Risk Matrix (3 x 4) -->
# KPI 1: Fault Risk Matrix & Category Mapping

$$\begin{array}{c|c|c|c|c}
\textbf{IFS Criticality} & \textbf{Tier 4 (Good)} & \textbf{Tier 3 (Good)} & \textbf{Tier 2 (Degraded)} & \textbf{Tier 1 (Critical)} \\
\hline
\textbf{High / SECE (3)} & 3 \text{ (Low)} & 6 \text{ (Med)} & 9 \text{ (High)} & 12 \text{ (Critical)} \\
\hline
\textbf{Medium (2)} & 2 \text{ (Low)} & 4 \text{ (Med)} & 6 \text{ (Med)} & 8 \text{ (High)} \\
\hline
\textbf{Low (1)} & 1 \text{ (Low)} & 2 \text{ (Low)} & 3 \text{ (Low)} & 4 \text{ (Med)} \\
\end{array}$$

### Fleet Overall Health % (Deduction Logic):
- **Maximum Fleet Potential**: $\text{Max Fault Points} = N \times 12$
- **Penalty Deductions**: Deductions occur **only** for assets exhibiting active anomalies:
  $$\text{Deduction}_i = \begin{cases} \text{Fault Risk}_i, & \text{if Condition}_i \in \{\text{Tier 1}, \text{Tier 2}\} \\ 0, & \text{if Condition}_i \in \{\text{Tier 3}, \text{Tier 4}\} \end{cases}$$
- **Fleet Fault Health %**:
  $$\text{Fault Health \%} = \max\left(0, \frac{\text{Max Fault Points} - \sum \text{Deduction}_i}{\text{Max Fault Points}}\right) \times 100\%$$

---

<!-- Slide 8: KPI 2 — Compliance Risk Calculation -->
# KPI 2: Compliance Risk Formulation (Score 0 to 15)

Combines collection overdue status with the consequence of failure:

$$\text{PM Overdue (\%)}_i = \frac{\text{Today} - (\text{Last Survey}_i + \text{PM Frequency}_i)}{\text{PM Frequency}_i} \times 100\%$$

$$\text{Compliance Risk}_i = \text{IFS Criticality Weight}_i \times \text{Overdue Index}_i$$

### Overdue Index Mapping Table:
$$\begin{array}{|l|c|l|}
\hline
\textbf{PM Overdue Range} & \textbf{Overdue Index} & \textbf{Operational Interpretation} \\
\hline
\le 0\% & 0 & \text{On Schedule (Inspection valid)} \\
0\% - 50\% & 1 & \text{Slight delay within routine rescheduling window} \\
50\% - 100\% & 2 & \text{Moderate delay — 1 missed round} \\
100\% - 150\% & 3 & \text{Significant delay — inspection overdue by full interval} \\
150\% - 200\% & 4 & \text{High delay — asset unmonitored for extended period} \\
> 200\% & 5 & \text{Severe delay — blind spot on operating equipment} \\
\hline
\end{array}$$

---

<!-- Slide 9: KPI 2 — Compliance Risk Matrix (3 x 6) -->
# KPI 2: Compliance Risk Matrix & Multi-Technique Rule

$$\begin{array}{c|c|c|c|c|c|c}
\textbf{IFS Criticality} & \textbf{Index 0} & \textbf{Index 1} & \textbf{Index 2} & \textbf{Index 3} & \textbf{Index 4} & \textbf{Index 5} \\
\hline
\textbf{High / SECE (3)} & 0 & 3 & 6 & 9 & 12 & 15 \text{ (Max)} \\
\hline
\textbf{Medium (2)} & 0 & 2 & 4 & 6 & 8 & 10 \\
\hline
\textbf{Low (1)} & 0 & 1 & 2 & 3 & 4 & 5 \\
\end{array}$$

- **Dual-Surveillance Rule**: Vibration (e.g. 24-day frequency) and Lube Oil (e.g. 84-day frequency) are tracked independently:
  $$\text{Compliance Risk}_i = \max(\text{Crit}_i \times \text{Index}(\text{Vib}_i), \text{Crit}_i \times \text{Index}(\text{Oil}_i))$$

### Fleet Overall Compliance % (Deduction Logic):
$$\text{Max Compliance Points} = N \times 15$$
$$\text{Compliance \%} = \max\left(0, \frac{\text{Max Compliance Points} - \sum_{i=1}^N \text{Compliance Risk}_i}{\text{Max Compliance Points}}\right) \times 100\%$$

---

<!-- Slide 10: KPI 3 — CBM Total Risk Calculation -->
# KPI 3: CBM Total Risk Formulation (Score 1.0 to 15.0)

CBM Total Risk reconciles the physical machinery health with the surveillance coverage:

$$\text{CBM Total Risk}_i = \text{Fault Risk}_i + (0.20 \times \text{Compliance Risk}_i)$$

- **Minimum possible score**: $1 \times 1 + (0.2 \times 0) = \mathbf{1.0}$ (Good Tier 4, Low Crit, On Schedule).
- **Maximum possible score**: $4 \times 3 + (0.2 \times 15) = 12 + 3.0 = \mathbf{15.0}$ (Critical Tier 1, High Crit, Severe Delay).

### Severity Classification Thresholds:
- **Low Risk**: $< 4.0$ (Normal routine operation)
- **Medium Risk**: $4.0 - 7.9$ (Scheduled review required)
- **High Risk**: $8.0 - 11.9$ (Active anomaly or high criticality delay)
- **Critical Risk**: $\ge 12.0$ (Immediate intervention required)

---

<!-- Slide 11: KPI 3 — Fleet Total Health % Deduction Logic -->
# KPI 3: Fleet Total Health % Formulation

The 3rd KPI card reflects the **overall condition integrity of the entire fleet** after accounting for both mechanical defects and overdue monitoring penalties:

$$\text{Max Total Fleet Points} = N \times 15.0$$

$$\text{Machine Deduction}_i = \text{Fault Deduction}_i + (0.20 \times \text{Compliance Risk}_i)$$

$$\text{Fleet Total Health \%} = \max\left(0, \frac{\text{Max Total Points} - \sum_{i=1}^N \text{Machine Deduction}_i}{\text{Max Total Points}}\right) \times 100\%$$

<div class="box">
<b>Property of Coherence:</b> If all machines are healthy (Tier 3/4) and all PM collections are on schedule, then <code>Total Health = 100.0%</code>. Every anomaly and every delayed PM subtracts strictly bounded penalty points.
</div>

---

<!-- Slide 12: Unified Score Representation in Equipment Modal -->
# Equipment Details Modal: Score Harmonization

To avoid cognitive overload during offshore triage, the Equipment Details Modal presents all three parameters as uniform **Scores**:

```
[ Fault: 8/12 ]       [ Compliance: 6/15 ]       [ Total Risk: 9.2/15 ]
```

1. **Fault Badge (`X/12`)**:
   - Explicitly displays condition degradation weighted by criticality.
   - Example: Degraded pump (Tier 2 = 3) on Medium criticality (2) $\to \mathbf{6/12}$.
2. **Compliance Badge (`Y/15`)**:
   - Shows compliance delay weighted by criticality.
   - Example: High criticality pump (3) delayed by 70% (Index 2) $\to \mathbf{6/15}$.
3. **Total Risk Badge (`Z/15`)**:
   - Combined score: $6 + (0.2 \times 6) = \mathbf{7.2/15}$ (Category: Medium Risk).

---

<!-- Slide 13: Comparative Architecture Table -->
# Architecture Alignment: CBMnet Standard vs. CBM App

| Parameter | Standard CBMnet (§1.6) | Our Implemented Model | Validation Note |
| :--- | :---: | :---: | :--- |
| **Criticality Input** | 1 to 5 (Qualitative) | **1 to 3 (IFS RAM Master)** | Linked directly to IFS EAM |
| **Condition Input** | 1 to 5 (Likelihood) | **1 to 4 (ISO 17359 Tiers)** | Driven by certified vibration/oil reports |
| **Compliance Input** | 1 to 5 (Adherence) | **0 to 5 (PM Overdue % Formula)** | Exact mathematical day/interval ratio |
| **Fault Risk Max** | 25 points | **12 points** | $4 \times 3$ matrix |
| **Compliance Risk Max** | 25 points | **15 points** | $3 \times 5$ matrix |
| **Total Risk Max** | 30 points | **15.0 points** | $12 + (0.2 \times 15)$ |
| **Weight of Compliance** | 20% | **20%** | Exact preservation of CBMnet standard |
| **Fleet Level View** | Subjective matrix | **0 - 100% Unified Deductions** | Objective % metric for management |

---

<!-- Slide 14: Practical Offshore Scenario Walkthrough -->
# Practical Example: Offshore Equipment Scoring

### Asset: Crude Oil Export Pump (P-01A)
- **IFS Criticality**: `High` (Weight = 3)
- **Vibration Survey**: Tier 2 (Degraded, bearing inner race defect) $\to$ Tier Score = 3
- **Lube Oil Survey**: Tier 4 (Good) $\to$ Worst Condition = **Tier 2 (Degraded)**
- **Vibration PM Frequency**: 24 days | Last collection: 42 days ago
  $$\text{Overdue Days} = 42 - 24 = 18 \text{ days} \implies \text{Overdue \%} = \frac{18}{24} \times 100\% = 75.0\%$$
  $$75.0\% \text{ falls in } 50\%-100\% \implies \textbf{Overdue Index = 2}$$

### Resulting Scores:
1. **Fault Risk**: $3 \text{ (Crit)} \times 3 \text{ (Tier 2)} = \mathbf{9 / 12}$ <span class="badge-crit">High Risk</span>
2. **Compliance Risk**: $3 \text{ (Crit)} \times 2 \text{ (Index)} = \mathbf{6 / 15}$ <span class="badge-warn">Moderate Delay</span>
3. **CBM Total Risk**: $9 + (0.2 \times 6) = \mathbf{10.2 / 15}$ <span class="badge-crit">High Risk</span>
4. **Fleet Impact**: Deducts $9$ pts from Fault Health, $6$ pts from Compliance, and $10.2$ pts from Total Health.

---

<!-- Slide 15: Management Summary of the 3 KPI Cards -->
# Summary of the 3 KPI Dashboard Cards

```
+---------------------------+---------------------------+---------------------------+
| FAULT RISK & HEALTH       | COMPLIANCE RISK (OVERDUE) | CBM TOTAL RISK            |
+---------------------------+---------------------------+---------------------------+
| Donut: 98.3% Health       | Donut: 95.8% Compliance   | Donut: 97.2% Total Health |
|                           |                           |                           |
| Avg Fault Risk: 2.1 / 12  | Avg Compliance: 0.8 / 15  | Avg Total Risk: 2.3 / 15  |
| Evaluated: 104 machines   | On Schedule: 92 machines  | Crit/High: 2 machines     |
| At Risk: 3 machines       | Overdue PM: 12 machines   | Med/Low: 102 machines     |
| Deduction: -21 pts        | Deduction: -65 pts        | Deduction: -34.0 pts      |
+---------------------------+---------------------------+---------------------------+
```

- **Intuitive Visual Hierarchy**: Donut displays the fleet-wide % health (higher is better).
- **Transparent Accountability**: Every point deducted is traceable to specific assets and specific defect reports.

---

<!-- Slide 16: Verification & Next Steps -->
# Team Review, Governance & Next Steps

1. **Interactive In-App Tooltips**:
   - Every KPI card features an **(i)** Info icon with dynamic formula popovers directly inside the app.
   - Enables any offshore or onshore engineer to immediately review the mathematical logic.

2. **Auditing & Traceability**:
   - Calculations update reactively as soon as new analysis reports are logged or collection dates advance.
   - Complete consistency across Fleet Overview, KPI Cards, and Equipment Modal.

3. **Discussion & Approval**:
   - Open for team feedback on interval definitions or weighting factors.

<br>

<div class="box">
<b>Documentation Reference:</b> <code>docs/cbm_kpi_methodology_presentation.md</code><br>
Exportable to PDF / PowerPoint using Marp CLI: <code>npx @marp-team/marp-cli docs/cbm_kpi_methodology_presentation.md --pdf</code>
</div>
