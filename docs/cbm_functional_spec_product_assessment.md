# Product Management Assessment of CBM Functional Specification
## Transitioning from Prescriptive Implementation to "Configure First" on PACE & SLB OptiSite

**Reference Document:** `APM CBM PLATFORM - FUNCTIONAL SPECIFICATION (IS93502 / OOSDOMPF000019 / Rev. C1)`  
**Audience:** Business Authors, Product Management, Engineering Leads, Enterprise Architecture  
**Date:** October 2026  
**Tone:** Collaborative & Consultative (Delimiting Functional Ownership vs. Digital Product Design)

---

## 1. Executive Framing: Aligning the Specification with Product Management

This assessment provides a constructive review of the CBM Functional Specification. Our goal is to ensure the specification provides the highest possible value to Product Management and Engineering by clearly delineating **WHAT** the operational business needs and user pain points are, while delegating the **HOW** to Product Management.

### The Core Opportunity: "Configure First" on PACE & OptiSite
The current specification contains extensive, high-value domain knowledge and rigorous business rules. However, it is currently **overly prescriptive regarding digital workflows, screen layouts, and bespoke software implementation**. 

By dictating exact screen forms, button behaviors, and hardcoded database mappings, the specification unintentionally limits the Product team from:
1. **Focusing on Core User Pain Points:** Highlighting what really frustrates offshore technicians, onshore reliability engineers, and asset managers today.
2. **Adopting the "Configure First" Philosophy:** Leveraging ready-to-use, configurable components from the **SLB OptiSite Component Library** and shared platform services rather than developing bespoke, redundant software.
3. **Enabling Native PACE Interoperability:** Designing CBM as a seamlessly connected capability within the wider **PACE ecosystem** (Asset Surveillance, Production Optimization, Maintenance Hub), sharing unified data models rather than creating isolated digital silos.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   TARGET COLLABORATION MODEL                                     │
├─────────────────────────────────────────┬────────────────────────────────────────┤
│  BUSINESS & SPECIFICATION AUTHORS       │  PRODUCT MANAGEMENT & ARCHITECTURE     │
│  (Focus on "THE WHAT")                  │  (Focus on "THE HOW" & "CONFIGURE FIRST")│
├─────────────────────────────────────────┼────────────────────────────────────────┤
│ • Real User Pain Points & Bottlenecks   │ • OptiSite UI/UX Component Selection   │
│ • Operational Ambition & Objectives     │ • PACE Ecosystem Cross-App Integration │
│ • Regulatory / Class Business Rules     │ • Configurable Workflow & Case Engines │
│ • Information & Data Needs              │ • Responsive Interaction Design        │
│ • Target Operational Outcomes & Value   │ • Progressive MVP & Release Roadmap    │
└─────────────────────────────────────────┴────────────────────────────────────────┘
```

---

## 2. De-Prescription & PACE Reusability Matrix (Sections 6 & 9)

> [!IMPORTANT]
> **Product Management Mandate & Ownership Note:**  
> The entries in the **"PACE Platform Evaluation & Reusability"** column below represent architectural evaluation guidelines and capability spaces rather than fixed design decisions. The Product Management team retains full ownership and design autonomy over the **HOW**—empowered to explore, select, and configure the optimal combination of components, shared services, and cross-application integrations available across the PACE platform to address each verified user pain point.

### Section 6: Functional Requirements & Solution Architecture

| Subsection | Prescriptive "HOW" to Remove (Delete from Spec) | Underlying "WHAT" & User Pain Point (Retain / Elevate) | PACE Platform Evaluation & Reusability ("Configure First") |
| :--- | :--- | :--- | :--- |
| **6.1 Solution Overview & Business Objects** | Prescribing proprietary database entity models, custom relation tables, and bespoke system boundaries. | **Pain Point:** CBM data is fragmented across isolated tools; users cannot correlate condition data with maintenance records.<br>**Rule:** Ensure end-to-end traceability across equipment, monitoring data, cases, and work orders. | **Product Team to Evaluate:** Leverage the unified PACE enterprise asset and case data model to ensure native cross-app interoperability, avoiding isolated, bespoke data schemas. |
| **6.2.1 Monitoring Population** | Hardcoding specific IFS Work Task Template IDs (e.g., `P0009A - CBM Generic Vibration Measurement`) directly into the software specification. | **Pain Point:** Maintenance and CBM scopes diverge over time; assets fall through the cracks without monitoring coverage.<br>**Rule:** Software must dynamically identify equipment under active CBM scope without manual audit. | **Product Team to Evaluate:** Implement a configurable business rules engine within PACE where template mappings can be maintained administratively without code deployments. |
| **6.2.2 Monitoring Plan Item** | Prescribing fixed database columns, static attributes, and hardcoded metadata schema. | **Pain Point:** Onshore analysts cannot easily see the planned annual monitoring program per asset or technique.<br>**Need:** Full visibility into monitoring frequency, technique, and compliance status. | **Product Team to Evaluate:** Configure standard data grid and tabular components from the SLB OptiSite library, enabling customizable filtering, column ordering, and export. |
| **6.2.3 Analysis Scheduling** | Dictating exact calendar date calculation routines and rigid software triggers in the spec. | **Pain Point:** Confusion over next analysis due dates leads to missed Class survey deadlines.<br>**Rule:** Vibration, oil, and thermography schedules must be evaluated independently. | **Product Team to Evaluate:** Utilize PACE's shared scheduling and calendar management services, aligning interval calculations with enterprise time-series capabilities. |
| **6.2.4 Measurement Recording** | Specifying exact UI dropdowns, mandatory form field validations, button clicks, and screen inputs for field technicians. | **Pain Point:** Offshore crews face high friction uploading route data; missing routes go unexplained.<br>**Need:** Frictionless recording of measurement events and auditable capture of non-measurement reasons. | **Product Team to Evaluate:** Design responsive data-capture forms leveraging OptiSite standard form controls, incorporating field validation and offline/low-bandwidth patterns. |
| **6.2.5 Monitoring Analysis Record** | Dictating the visual layout of analysis forms, text areas, and engineering log headers. | **Pain Point:** Analysts spend 40% of their time reformatting notes and copying spectral values into reports.<br>**Need:** Rapid, standardized recording of Tier 1-4 diagnostic findings. | **Product Team to Evaluate:** Adopt standard annotation and diagnostic input patterns available in PACE, linking qualitative commentary directly to time-series and condition trends. |
| **6.2.6 Analysis Due Status** | Hardcoding UI status badge labels, RGB color codes, and fixed visual styling for due states. | **Pain Point:** Risk of regulatory non-compliance when analyses drift past due dates without early warning.<br>**Rule:** Standardized due categories (`Not Yet Due`, `Due Soon`, `Overdue`). | **Product Team to Evaluate:** Apply standard OptiSite status tokens and semantic color palettes, ensuring design consistency and accessibility compliance across the platform. |
| **6.2.7 Analysis Overdue Calculation** | Specifying hardcoded calculation algorithms and database query scripts directly in the document. | **Pain Point:** Inability to rank monitoring backlog by asset criticality during peak workloads.<br>**Rule:** Overdue duration must factor into compliance risk scoring. | **Product Team to Evaluate:** Offload calculations to PACE's standard telemetry/KPI computation service, decoupling mathematical logic from front-end presentation. |
| **6.2.8 Analysis Outcome** | Prescribing hardcoded branching logic and forced page redirects after completing an analysis. | **Pain Point:** Analysts are forced into cumbersome multi-step navigation to open follow-up actions.<br>**Need:** Direct, intuitive path from diagnostic finding to CBM Case creation. | **Product Team to Evaluate:** Design streamlined user journeys using PACE contextual action banners and guided workflows to reduce navigation overhead. |
| **6.3 Equipment Surveillance Tier & Health Level** | Prescribing custom client-side mathematical scoring formulas and hardcoded color matrix tables. | **Pain Point:** Fleet leadership lacks a consolidated health index for multi-component machines.<br>**Rule:** Corporate Health Level formula: $\text{Health} = \min(\text{Surveillance Tiers})$. | **Product Team to Evaluate:** Configure existing PACE asset hierarchy and equipment health visualization components to represent multi-tier asset conditions uniformly. |
| **6.4.1 Create CBM Case** | Prescribing UI modal window layouts, button locations, and mandatory input sequences for creating a case. | **Pain Point:** Degradation findings discussed informally via email are forgotten, leading to unexpected trips.<br>**Need:** Governed case container with clear ownership, SLA, and lifecycle tracking. | **Product Team to Evaluate:** Leverage enterprise case management and action-tracking modules within PACE, auto-populating asset context from the shared platform registry. |
| **6.4.2 CBM Case Status** | Dictating hardcoded state machine tables, rigid transition scripts, and software-enforced lockouts. | **Pain Point:** Inability to track where an anomaly is stuck (e.g., waiting for offshore execution vs. waiting for engineering review).<br>**Rule:** 6 core lifecycle states (`Open`, `In Progress`, `Awaiting Action`, `Awaiting Feedback`, `Closed`, `Cancelled`). | **Product Team to Evaluate:** Configure a standardized lifecycle state engine available in the platform, ensuring full audit trail and role-based permissions without custom code. |
| **6.4.3 Technical Assessment** | Dictating specific tab layouts, form groupings, and bespoke field alignments for engineering reports. | **Pain Point:** High cognitive load synthesizing vibration spectra, lubrication data, and operating regime.<br>**Need:** Structured diagnostic assessment capturing failure mechanisms (ISO 14224). | **Product Team to Evaluate:** Compose multi-pane analytical layouts using OptiSite layout containers, integrating shared taxonomy pickers and asset parameter viewers. |
| **6.4.4 Technical Assessment Report** | **Highly Prescriptive:** Mandating the automated generation of static Word (`.docx`) and Excel (`.xlsx`) files with specific page margins and table headers. | **Pain Point:** Trapping engineering intelligence in static documents destroys searchability, AI training, and cross-fleet analytics.<br>**Need:** Auditable, digitally searchable records with export-to-PDF capability for external Class audits. | **Product Team to Evaluate:** Replace static file creation with interactive digital case records in PACE, utilizing the platform's standardized reporting/export services for audit PDFs. |
| **6.4.5 Fault Report Request & Action Follow-Up** | Prescribing screens that mimic IFS ERP maintenance forms and dual-entry UI fields. | **Pain Point:** Reliability engineers waste hours manually re-typing diagnostic findings into the CMMS.<br>**Need:** One-click dispatch of maintenance work requests with full technical context attached. | **Product Team to Evaluate:** Utilize the PACE Maintenance Connector to exchange work requests and statuses asynchronously with the CMMS, eliminating manual double handling. |
| **6.4.6 Result Review & Technical Closure** | Prescribing rigid UI confirmation screens and bespoke sign-off wizards. | **Pain Point:** Offshore repairs are completed, but machines restart with residual defects because engineering was never asked to review post-work data.<br>**Rule:** Maintenance completion cannot close a CBM Case without engineering validation. | **Product Team to Evaluate:** Implement a configurable verification checkpoint in the workflow, enabling engineering review and sign-off within the platform's governance framework. |
| **6.5.1 – 6.5.11 Performance Indicators** | Dictating 11 custom metric formulas, SQL calculation scripts, and table aggregation queries in application code. | **Pain Point:** Operations lacks reliable metrics on CBM effectiveness, bad actors, overdue backlog, and lead times.<br>**Need:** Standardized KPIs for collection compliance, analysis timeliness, and recommendation hit rate. | **Product Team to Evaluate:** Define standardized metric definitions in the PACE analytics layer, rendering KPI rollups natively via OptiSite summary and trend widgets. |
| **6.6.1 – 6.6.5 Visibility, Reporting & Value Creation** | Prescribing exact UI screen designs, card dimensions, table column widths, pie-chart styles, and fixed dashboard mockups. | **Pain Point:** Different user personas (Offshore Tech, Onshore Analyst, Fleet VP) need tailored views rather than one cluttered screen.<br>**Need:** High-impact, responsive visibility across assets, cases, and value metrics. | **Product Team to Evaluate:** Design persona-driven dashboards using the OptiSite dashboard grid system, assembling reusable charts, asset trees, and summary cards. |

---

### Section 9: Communication & External System Integration

| Subsection | Prescriptive "HOW" to Remove (Delete from Spec) | Underlying "WHAT" & User Pain Point (Retain / Elevate) | PACE Platform Evaluation & Reusability ("Configure First") |
| :--- | :--- | :--- | :--- |
| **9.1 Integration Scope & Approved Systems** | Hardcoding named vendor software products (e.g., Bently Nevada System 1, Emerson AMS, SEEQ) as direct system dependencies. | **Pain Point:** Vendor lock-in; swapping or upgrading a vibration tool requires re-architecting the CBM application.<br>**Need:** Standardized condition data ingestion regardless of sensor or software vendor. | **Product Team to Evaluate:** Implement vendor-agnostic API contracts and open ingestion adapters, decoupling CBM business logic from specific vendor product versions. |
| **9.2 Data Exchange Requirements** | Prescribing static CSV/XML file import batch jobs, shared network folders, and manual file uploads. | **Pain Point:** File drops fail silently, corrupting data and leaving analysts with outdated measurements.<br>**Need:** Reliable, automated, and secure data exchange with field systems. | **Product Team to Evaluate:** Leverage PACE enterprise data pipelines and messaging services, incorporating built-in validation, queueing, and error monitoring. |
| **9.3 Synchronization Requirements** | Specifying custom database polling intervals, cron schedules, and point-to-point synchronization routines. | **Pain Point:** Latency between offshore measurement and onshore visibility.<br>**Rule:** Timely synchronization aligned with operational urgency without overloading offshore satellite bandwidth. | **Product Team to Evaluate:** Utilize PACE's cloud-to-edge synchronization capabilities, optimizing data transfer for intermittent satellite links and bandwidth constraints. |
| **9.4 Asset and Data Mapping** | Dictating hardcoded entity cross-reference tables and bespoke database mapping scripts. | **Pain Point:** Asset tag naming inconsistencies between CMMS, SCADA, and CBM cause duplicate records.<br>**Rule:** IFS is the undisputed Master of the Asset Tag Hierarchy. | **Product Team to Evaluate:** Connect to the PACE master asset data registry to resolve tag hierarchies and cross-system mappings centrally. |
| **9.5 Maintenance Management Integration** | Specifying bespoke point-to-point IFS API calls, database triggers, and custom ERP integration code. | **Pain Point:** High maintenance cost of point-to-point ERP interfaces whenever IFS is patched.<br>**Rule:** Bidirectional exchange of Work Orders, fault descriptions, and execution feedback. | **Product Team to Evaluate:** Leverage the standard enterprise ERP integration layer provided by PACE, insulating core CBM features from back-end CMMS upgrades. |
| **9.6 Monitoring & Diagnostic Systems Integration** | Specifying custom desktop tool plugins, direct database queries into vendor systems, and proprietary desktop links. | **Pain Point:** Analysts must juggle 4 different desktop applications to diagnose a single bearing fault.<br>**Need:** Seamless contextual drilldown from high-level fleet anomaly into specialized diagnostic tools. | **Product Team to Evaluate:** Adopt standard web deep-linking and contextual navigation patterns supported across the PACE application suite. |

---

## 3. Revised Section 4: Strengthening the Business Framing Layer

To ensure the specification provides the right operational foundation without slipping into solution design, **Section 4** should be refactored to focus exclusively on user pain points, operational outcomes, and value drivers:

### 4.1 Business Problem (The Operational Reality Today)
* **High Administrative Waste:** Reliability engineers dedicate up to 40% of their time manually compiling reports, chasing updates across spreadsheets, and re-entering data into IFS.
* **Disconnected Maintenance Loop:** Once an engineering recommendation is dispatched, visibility is lost. Maintenance takes place, but observational findings are rarely fed back to CBM engineers.
* **Regulatory Compliance Exposure:** Lack of automated tracking for monitoring and analysis deadlines creates acute risk of overdue surveys during Class audits.
* **Siloed Fleet Knowledge:** Historical diagnoses and recurring failure modes remain trapped in personal folders, preventing organizational learning across sister FPSOs.

### 4.2 Operational Ambition (What "Good CBM" Looks Like)
* **Zero Surprises:** Degradation is detected sufficiently early to plan interventions during scheduled windows rather than emergency shutdowns.
* **Governed Ownership:** Every anomaly has a dedicated case owner and an auditable SLA until physical restoration is verified.
* **Single Truth:** All stakeholders—from offshore operators to executive leadership—view the exact same asset health and risk indicators.
* **Continuous Learning:** Maintenance outcomes systematically calibrate future diagnostic models and maintenance intervals.

### 4.3 Target Business Outcomes
1. **Fleetwide Consistency:** Standardize condition monitoring workflows across all operational assets while allowing necessary unit-level configuration.
2. **Closed-Loop Assurance:** Guarantee that no CBM-initiated maintenance action is closed without engineering review of repair effectiveness.
3. **Risk-Ranked Action:** Prioritize monitoring and maintenance queues dynamically based on asset criticality and confirmed degradation severity.
4. **Audit Readiness:** Provide instantaneous, tamper-evident Class survey compliance reports for ABS and Bureau Veritas.
5. **Measurable Value:** Demonstrate verifiable ROI through tracked avoided breakdowns and extended component run-lives.

---

## 4. Summary Assessment by Dimension

| Dimension | Assessment | Status | Product Management Recommendation |
| :--- | :--- | :---: | :--- |
| **Business Ambition** | Strong | 🟢 | Retain clear ambition for proactive, condition-driven reliability. |
| **User Pain Points** | Needs Focus | 🔴 | **Major gap.** Elevate real user friction (offshore/onshore) over software mechanics. |
| **Work Process Grounding** | Strong | 🟢 | Excellent 3-phase foundation (Data Capture → Assessment → Execution & Closure). |
| **Target Operational Outcomes** | Good | 🟢/🟠 | Sharpen into 5–7 solution-independent business outcomes. |
| **Business Value Case** | Partial | 🟠 | Link operational improvements to quantified downtime and cost reduction hypotheses. |
| **Measurable Targets** | Weak | 🔴 | Establish clear baselines, targets, owners, and timeframes (Section 4.7). |
| **Business Rules** | Very Strong | 🟢 | Maintain corporate risk formulas and Class compliance rules. |
| **AI & Automation Potential** | Weak | 🔴 | **Strategic gap.** Incorporate AI opportunities for triage, ISO coding, and drafting work orders. |
| **"Configure First" / Stack Reuse** | Missing | 🔴 | Replace bespoke software flows with **PACE & SLB OptiSite Component Library** evaluation. |
| **PACE Interoperability** | Missing | 🔴 | Re-architect data models to natively interoperate with other **PACE applications**. |
| **Prescriptive Implementation (HOW)** | Excessive | 🔴 | **Must be removed.** Delete UI mockups, button behaviors, and hardcoded template IDs. |
| **MVP Phasing & Priorities** | Missing | 🔴 | Define MoSCoW prioritization to deliver high-value capabilities incrementally. |

---

## 5. Collaborative Action Plan for Authors & Product Management

To finalize the specification into a high-impact, actionable document, we recommend the following joint next steps:

1. **Authors Refactor Sections 4 & 5 (Focus on the WHAT):**
   * Expand user pain points and operational consequences across offshore and onshore personas.
   * State expected business outcomes independently of software features.
2. **Authors Cleanse Sections 6 & 9 (Remove the HOW):**
   * Apply the De-Prescription Matrix in Section 2, removing UI screen layouts, rigid field behaviors, and hardcoded vendor references.
3. **Product Management Takes Ownership of Solutioning:**
   * Evaluate and configure matching capabilities from the **PACE & OptiSite component ecosystem**.
   * Define cross-app interoperability with existing **PACE modules**.
   * Establish the progressive MVP roadmap and release milestones.
