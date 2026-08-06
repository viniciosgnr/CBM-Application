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
  thermographyStatus: text('thermography_status').notNull().default('Good'),
  lastUpdate: text('last_update').notNull(),
  observation: text('observation'),
});

export const equipmentHistory = sqliteTable('equipment_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  equipmentTag: text('equipment_tag').notNull(),
  vibrationStatus: text('vibration_status').notNull(),
  lubeOilStatus: text('lube_oil_status').notNull(),
  thermographyStatus: text('thermography_status').notNull().default('Good'),
  overallCondition: text('overall_condition').notNull(),
  changedAt: text('changed_at').notNull(),
});

export const analysisReports = sqliteTable('analysis_reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  equipmentTag: text('equipment_tag').notNull(),
  vibrationStatus: text('vibration_status').notNull(),
  lubeOilStatus: text('lube_oil_status').notNull(),
  thermographyStatus: text('thermography_status').notNull().default('Good'),
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
  imageUrl: text('image_url'),
  createdAt: text('created_at').notNull(),
});

export const workOrders = sqliteTable('work_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  fpso: text('fpso').notNull(),
  description: text('description').notNull(),
  priority: text('priority').notNull(), // 'Accepted' | 'Pending' | 'Rejected'
  status: text('status').notNull(), // e.g. 'Pending', 'Observed', 'Under Preparation', etc.
  tagNumber: text('tag_number').notNull(),
  tagDescription: text('tag_description').notNull(),
  monitoringTechnique: text('monitoring_technique').notNull(),
  creationDate: text('creation_date').notNull(),
  dueDate: text('due_date').notNull(),
  
  // Link back to analysis report
  reportId: integer('report_id').references(() => analysisReports.id),

  // CMMS Fault Report Fields
  woSite: text('wo_site').notNull(),
  directive: text('directive').notNull(),
  maintOrg: text('maint_org').notNull(),
  workType: text('work_type').notNull(), // Default 'CM'
  externalSource: text('external_source').notNull(),
  externalSourceId: text('external_source_id').notNull(),
  faultDesc: text('fault_desc').notNull(),
  symptom: text('symptom').notNull(),
  discovery: text('discovery').notNull(), // Default '04'
  actionId: text('action_id').notNull(),
  operationalStatus: text('operational_status').notNull(),
  
  // Simulated File Upload Metadata
  attachedFilename: text('attached_filename'),
  attachedFileSize: integer('attached_file_size'),
});
