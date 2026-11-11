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
  frequency: text('frequency').notNull().default('Monthly'),
  vibrationFrequency: text('vibration_frequency').notNull().default('Monthly'),
  lubeOilFrequency: text('lube_oil_frequency').notNull().default('Monthly'),
  lastVibrationUpdate: text('last_vibration_update'),
  lastLubeOilUpdate: text('last_lube_oil_update'),
  vibrationNonCollectionReason: text('vibration_non_collection_reason'),
  lubeOilNonCollectionReason: text('lube_oil_non_collection_reason'),
  nonCollectionReason: text('non_collection_reason'),
  collectionMethod: text('collection_method').notNull().default('Online'),
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
  // Failure Mode fields
  equipmentClass: text('equipment_class'),
  subunit: text('subunit'),
  maintainableItem: text('maintainable_item'),
  failureModeDescription: text('failure_mode_description'),
  failureMechanismSubdivision: text('failure_mechanism_subdivision'),
  effectiveness: text('effectiveness'),
  cbmCaseStatus: text('cbm_case_status'),
  taskId: integer('task_id'),
  taskNumber: text('task_number'),

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
  entryDate: text('entry_date'),
  reportedBy: text('reported_by'),
  itemClassId: text('item_class_id'),
  actionTakenOnField: integer('action_taken_on_field').default(0),
  performedWork: text('performed_work'),
  incidentManagement: text('incident_management'),
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

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskReference: text('task_reference').notNull().unique(), // e.g. TSK-1001
  reportId: integer('report_id').references(() => analysisReports.id),
  equipmentTag: text('equipment_tag').notNull(),
  type: text('type').notNull().default('Corrective Maintenance'),
  title: text('title').notNull(),
  description: text('description').notNull(),
  assignedTo: text('assigned_to').notNull(),
  priority: text('priority').notNull(), // 'High' | 'Medium' | 'Low' | 'Very Low'
  dueDate: text('due_date').notNull(),
  associatedEvent: text('associated_event'),
  associatedEntity: text('associated_entity'),
  faultReportOption: text('fault_report_option').notNull(), // 'none' | 'create' | 'link'
  workOrderId: integer('work_order_id'),
  workOrderReference: text('work_order_reference'),
  attachedFilename: text('attached_filename'),
  attachedFileSize: integer('attached_file_size'),
  sparePartNumber: text('spare_part_number'),
  purchaseOrderRef: text('purchase_order_ref'),
  quantity: text('quantity'),
  unitOfQuantity: text('unit_of_quantity'),
  status: text('status').notNull().default('New'),
  historyJson: text('history_json'),
  commentsJson: text('comments_json'),
  createdAt: text('created_at').notNull(),
});
