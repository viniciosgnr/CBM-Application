import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const equipments = sqliteTable('equipments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tag: text('tag').unique().notNull(),
  fpso: text('fpso').notNull(),
  name: text('name').notNull(),
  class: text('class').notNull(),
  system: text('system').notNull(),
  criticality: text('criticality').notNull(),
  objectType: text('object_type').notNull(),
  condition: text('condition').notNull(),
  vibrationStatus: text('vibration_status').notNull(),
  lubeOilStatus: text('lube_oil_status').notNull(),
  lastUpdate: text('last_update').notNull(),
  observation: text('observation'),
});

export const equipmentHistory = sqliteTable('equipment_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  equipmentTag: text('equipment_tag').notNull(),
  vibrationStatus: text('vibration_status').notNull(),
  lubeOilStatus: text('lube_oil_status').notNull(),
  overallCondition: text('overall_condition').notNull(),
  changedAt: text('changed_at').notNull(),
});

export const analysisReports = sqliteTable('analysis_reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  equipmentTag: text('equipment_tag').notNull(),
  vibrationStatus: text('vibration_status').notNull(),
  lubeOilStatus: text('lube_oil_status').notNull(),
  overallCondition: text('overall_condition').notNull(),
  
  // Excel Report fields
  facility: text('facility').notNull(),
  system: text('system').notNull(),
  tagNumber: text('tag_number').notNull(),
  cmmsNumber: text('cmms_number'),
  cof: text('cof'),
  location: text('location'),
  machineName: text('machine_name'),
  mcProtection: text('mc_protection'),
  operatingContext: text('operating_context'),
  technology: text('technology'),
  
  component: text('component'),
  raisedBy: text('raised_by').notNull(),
  raisedDate: text('raised_date').notNull(),
  targetDate: text('target_date'),
  shortDescription: text('short_description').notNull(),
  woNumber: text('wo_number'),
  
  conditionAssessment: text('condition_assessment').notNull(), // Observation
  longDescription: text('long_description').notNull(), // Recommendation
  createdAt: text('created_at').notNull(),
});
