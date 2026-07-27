# Seed Data Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand `src/db/seed.ts` with 25+ diverse Equipment items and 25+ diverse Work Order items across FPSOs, Systems, Conditions, and Timestamps.

**Architecture:** Update `initialEquipments`, `mockWorkOrders`, `mockHistory`, and `mockReports` in `src/db/seed.ts`. Reset database and run seed script.

**Tech Stack:** TypeScript, Drizzle ORM, SQLite.

## Global Constraints

- Equipments: 25+ items spanning `UNY`, `CDI`, `SEP` FPSOs; `Gas`, `Water`, `Oil`, `Power` systems; `Good`, `Degraded`, `Critical`, `Machine Off` conditions.
- Work Orders: 25+ items spanning `Accepted`, `In Progress`, `Pending`, `Completed`, `Rejected`, `Cancelled` statuses; `Overdue`, `0-7 days`, `8-30 days`, `> 30 days` due dates.

---

### Task 1: Update `src/db/seed.ts` with Expanded Datasets

**Files:**
- Modify: `src/db/seed.ts`

**Interfaces:**
- Consumes: Drizzle schema tables (`equipments`, `equipmentHistory`, `analysisReports`, `workOrders`).
- Produces: 25+ seeded records per main entity table.

- [ ] **Step 1: Write expanded seed dataset in `src/db/seed.ts`**

Update `initialEquipments`, `mockHistory`, `mockReports`, and `mockWorkOrders` arrays with 25+ entries each.

---

### Task 2: Re-seed Database

**Files:**
- Execute script: `npx tsx src/db/run-seed.ts`

- [ ] **Step 1: Reset database file if needed and run seed script**

Run: `npx tsx src/db/run-seed.ts`
Expected output: `Seeding database... Seeding completed successfully.`

---

### Task 3: Verify Build and Linting

- [ ] **Step 1: Run npm run lint**

Run: `npm run lint`
Expected: `✔ No ESLint warnings or errors`

- [ ] **Step 2: Commit implementation**

```bash
git add src/db/seed.ts
git commit -m "feat: expand seed dataset to 25+ records per table"
```
