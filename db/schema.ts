import { pgTable, text, serial, integer, timestamp, boolean, jsonb, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoles = [
  "super_admin",
  "spitex_org",
  "spitex_employee",
  "freelancer",
  "insurance",
  "family_member",
  "patient"
] as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique(),  
  password: text("password").notNull(),
  role: text("role", { enum: userRoles }).notNull().default("family_member"),
  fullName: text("full_name").notNull(),
  organizationId: integer("organization_id"), 
  email: text("email").notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  monthlyFixedCosts: jsonb("monthly_fixed_costs"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["spitex", "insurance"] }).notNull(),
  subscriptionTier: text("subscription_tier", { 
    enum: ["free_trial", "basic", "professional", "enterprise"] 
  }).notNull().default("free_trial"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  maxCaregivers: integer("max_caregivers"),
  address: jsonb("address"),
  contactInfo: jsonb("contact_info"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  gender: text("gender", { enum: ["male", "female", "other"] }).notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: jsonb("address").notNull(),
  emergencyContact: jsonb("emergency_contact").notNull(),
  medicalHistory: text("medical_history"),
  currentDiagnoses: jsonb("current_diagnoses"),
  allergies: jsonb("allergies"),
  primaryPhysicianContact: jsonb("primary_physician_contact"),
  preferences: jsonb("preferences"),
  familyAccess: jsonb("family_access"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insuranceDetails = pgTable("insurance_details", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  provider: text("provider").notNull(),
  policyNumber: text("policy_number").notNull(),
  groupNumber: text("group_number"),
  billingAddress: jsonb("billing_address").notNull(),
  coverageDetails: jsonb("coverage_details"),
  validFrom: timestamp("valid_from").notNull(),
  validTo: timestamp("valid_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const patientDocuments = pgTable("patient_documents", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  type: text("type", {
    enum: ["medical_report", "prescription", "insurance", "legal", "other"]
  }).notNull(),
  title: text("title").notNull(),
  fileUrl: text("file_url").notNull(),
  metadata: jsonb("metadata"),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const visitLogs = pgTable("visit_logs", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  caregiverId: integer("caregiver_id").references(() => users.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  notes: text("notes"),
  tasksSummary: jsonb("tasks_summary"),
  status: text("status", {
    enum: ["scheduled", "in_progress", "completed", "cancelled"]
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  dosageForm: text("dosage_form", {
    enum: ["tablet", "capsule", "liquid", "injection", "other"]
  }).notNull(),
  strength: text("strength").notNull(),
  manufacturer: text("manufacturer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const medicationSchedules = pgTable("medication_schedules", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  medicationId: integer("medication_id").references(() => medications.id).notNull(),
  prescribedById: integer("prescribed_by_id").references(() => users.id).notNull(),
  dosage: text("dosage").notNull(),
  frequency: jsonb("frequency").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  instructions: text("instructions"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const medicationAdherence = pgTable("medication_adherence", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").references(() => medicationSchedules.id).notNull(),
  takenAt: timestamp("taken_at").defaultNow().notNull(),
  status: text("status", {
    enum: ["taken", "missed", "delayed", "skipped"]
  }).notNull(),
  notes: text("notes"),
});

export const healthMetrics = pgTable("health_metrics", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  type: text("type", {
    enum: ["blood_pressure", "weight", "temperature", "blood_sugar", "heart_rate", "pain_level"]
  }).notNull(),
  value: jsonb("value").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  notes: text("notes"),
});

export const carePlans = pgTable("care_plans", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["active", "completed", "cancelled"] }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: timestamp("due_date").notNull(),
  priority: text("priority", { enum: ["high", "medium", "low"] }).notNull().default("medium"),
  status: text("status", { enum: ["pending", "in_progress", "completed"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  carePlanId: integer("care_plan_id").references(() => carePlans.id).notNull(),
  notes: text("notes").notNull(),
  metrics: jsonb("metrics").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  providerId: integer("provider_id").references(() => users.id).notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  duration: integer("duration").notNull(), 
  status: text("status", {
    enum: ["scheduled", "cancelled", "completed", "no_show"]
  }).notNull().default("scheduled"),
  type: text("type", {
    enum: ["initial_consultation", "follow_up", "emergency", "routine_checkup"]
  }).notNull(),
  notes: text("notes"),
  symptoms: text("symptoms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const providerSchedules = pgTable("provider_schedules", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => users.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), 
  startTime: text("start_time").notNull(), 
  endTime: text("end_time").notNull(), 
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const videoSessions = pgTable("video_sessions", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id).notNull(),
  sessionId: text("session_id").notNull(),
  status: text("status", {
    enum: ["pending", "active", "ended", "failed"]
  }).notNull().default("pending"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  metadata: jsonb("metadata"),
});

export const serviceLogs = pgTable("service_logs", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => users.id).notNull(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  serviceDate: timestamp("service_date").notNull(),
  duration: integer("duration").notNull(), 
  billingCode: text("billing_code").notNull(),
  billingAmount: decimal("billing_amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  status: text("status", {
    enum: ["pending", "billed", "paid", "cancelled"]
  }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  recipientType: text("recipient_type", { enum: ["insurance", "patient"] }).notNull(),
  insuranceId: integer("insurance_id").references(() => insuranceDetails.id),
  status: text("status", { 
    enum: ["draft", "pending", "paid", "overdue", "cancelled"] 
  }).notNull().default("draft"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  selbstbehaltAmount: decimal("selbstbehalt_amount", { precision: 10, scale: 2 }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  serviceLogId: integer("service_log_id").references(() => serviceLogs.id).notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  billingCode: text("billing_code").notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method", {
    enum: ["bank_transfer", "credit_card", "cash", "other"]
  }).notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  referenceNumber: text("reference_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const taskAssignments = pgTable("task_assignments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  assignedToId: integer("assigned_to_id").references(() => users.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority", { enum: ["high", "medium", "low"] }).notNull().default("medium"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const taskComments = pgTable("task_comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const taskHistory = pgTable("task_history", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  changeType: text("change_type", {
    enum: ["status_change", "assignment_change", "update", "comment"]
  }).notNull(),
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const medicationScheduleRelations = relations(medicationSchedules, ({ one, many }) => ({
  medication: one(medications, {
    fields: [medicationSchedules.medicationId],
    references: [medications.id],
  }),
  patient: one(patients, {
    fields: [medicationSchedules.patientId],
    references: [patients.id],
  }),
  prescribedBy: one(users, {
    fields: [medicationSchedules.prescribedById],
    references: [users.id],
  }),
  adherenceRecords: many(medicationAdherence),
}));

export const medicationAdherenceRelations = relations(medicationAdherence, ({ one }) => ({
  schedule: one(medicationSchedules, {
    fields: [medicationAdherence.scheduleId],
    references: [medicationSchedules.id],
  }),
}));

export const userRelations = relations(users, ({ many, one }) => ({
  assignedTasks: many(taskAssignments),
  createdTasks: many(tasks, { relationName: "createdBy" }),
  patient: one(patients, {
    fields: [users.id],
    references: [patients.userId],
  }),
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  providedAppointments: many(appointments, { relationName: "provider" }),
  schedules: many(providerSchedules),
  serviceLogs: many(serviceLogs, { relationName: "employee" }),
  notifications: many(notifications),
}));

export const patientRelations = relations(patients, ({ one, many }) => ({
  user: one(users, {
    fields: [patients.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [patients.organizationId],
    references: [organizations.id],
  }),
  insuranceDetails: many(insuranceDetails),
  documents: many(patientDocuments),
  visitLogs: many(visitLogs),
  carePlans: many(carePlans),
  healthMetrics: many(healthMetrics),
  medicationSchedules: many(medicationSchedules),
  appointments: many(appointments),
  journalEntries: many(journalEntries),
}));

export const carePlanRelations = relations(carePlans, ({ one, many }) => ({
  patient: one(patients, {
    fields: [carePlans.patientId],
    references: [patients.id],
  }),
  tasks: many(tasks),
  progressRecords: many(progress),
}));

export const appointmentRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  provider: one(users, {
    fields: [appointments.providerId],
    references: [users.id],
  }),
}));

export const videoSessionRelations = relations(videoSessions, ({ one }) => ({
  appointment: one(appointments, {
    fields: [videoSessions.appointmentId],
    references: [appointments.id],
  }),
}));

export const insuranceDetailsRelations = relations(insuranceDetails, ({ one }) => ({
  patient: one(patients, {
    fields: [insuranceDetails.patientId],
    references: [patients.id],
  }),
}));

export const patientDocumentsRelations = relations(patientDocuments, ({ one }) => ({
  patient: one(patients, {
    fields: [patientDocuments.patientId],
    references: [patients.id],
  }),
  uploadedByUser: one(users, {
    fields: [patientDocuments.uploadedBy],
    references: [users.id],
  }),
}));

export const visitLogsRelations = relations(visitLogs, ({ one }) => ({
  patient: one(patients, {
    fields: [visitLogs.patientId],
    references: [patients.id],
  }),
  caregiver: one(users, {
    fields: [visitLogs.caregiverId],
    references: [users.id],
  }),
}));

export const providerSchedulesRelations = relations(providerSchedules, ({ one }) => ({
  provider: one(users, {
    fields: [providerSchedules.providerId],
    references: [users.id],
  }),
}));

export const organizationRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  employees: many(users),
}));

export const serviceLogRelations = relations(serviceLogs, ({ one }) => ({
  employee: one(users, {
    fields: [serviceLogs.employeeId],
    references: [users.id],
  }),
  patient: one(patients, {
    fields: [serviceLogs.patientId],
    references: [patients.id],
  }),
}));

export const taskRelations = relations(tasks, ({ one, many }) => ({
  patient: one(patients, {
    fields: [tasks.patientId],
    references: [patients.id],
  }),
  createdBy: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
  }),
  assignments: many(taskAssignments),
  comments: many(taskComments),
  history: many(taskHistory),
}));

export const taskAssignmentRelations = relations(taskAssignments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAssignments.taskId],
    references: [tasks.id],
  }),
  assignedTo: one(users, {
    fields: [taskAssignments.assignedToId],
    references: [users.id],
  }),
}));

export const taskCommentRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskComments.userId],
    references: [users.id],
  }),
}));

export const taskHistoryRelations = relations(taskHistory, ({ one }) => ({
  task: one(tasks, {
    fields: [taskHistory.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskHistory.userId],
    references: [users.id],
  }),
}));

export const invoiceRelations = relations(invoices, ({ one, many }) => ({
  patient: one(patients, {
    fields: [invoices.patientId],
    references: [patients.id],
  }),
  insurance: one(insuranceDetails, {
    fields: [invoices.insuranceId],
    references: [insuranceDetails.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  serviceLog: one(serviceLogs, {
    fields: [invoiceItems.serviceLogId],
    references: [serviceLogs.id],
  }),
}));

export const paymentRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const insertProviderScheduleSchema = createInsertSchema(providerSchedules);
export const selectProviderScheduleSchema = createSelectSchema(providerSchedules);
export type ProviderSchedule = typeof providerSchedules.$inferSelect;

export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(userRoles),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  organizationId: z.number().optional(),
  hourlyRate: z.number().optional(),
  monthlyFixedCosts: z.object({
    healthInsurance: z.number().optional(),
    socialSecurity: z.number().optional(),
    pensionFund: z.number().optional(),
    accidentInsurance: z.number().optional(),
    familyAllowances: z.number().optional(),
    otherExpenses: z.number().optional(),
  }).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const insertPatientSchema = createInsertSchema(patients);
export const selectPatientSchema = createSelectSchema(patients);

export const insertCarePlanSchema = createInsertSchema(carePlans);
export const selectCarePlanSchema = createSelectSchema(carePlans);

export const insertProgressSchema = createInsertSchema(progress);
export const selectProgressSchema = createSelectSchema(progress);

export const insertHealthMetricSchema = createInsertSchema(healthMetrics);
export const selectHealthMetricSchema = createSelectSchema(healthMetrics);

export const insertMedicationSchema = createInsertSchema(medications);
export const selectMedicationSchema = createSelectSchema(medications);

export const insertMedicationScheduleSchema = createInsertSchema(medicationSchedules);
export const selectMedicationScheduleSchema = createSelectSchema(medicationSchedules);

export const insertMedicationAdherenceSchema = createInsertSchema(medicationAdherence);
export const selectMedicationAdherenceSchema = createSelectSchema(medicationAdherence);

export const insertAppointmentSchema = createInsertSchema(appointments);
export const selectAppointmentSchema = createSelectSchema(appointments);

export const insertVideoSessionSchema = createInsertSchema(videoSessions);
export const selectVideoSessionSchema = createSelectSchema(videoSessions);

export const insertInsuranceDetailsSchema = createInsertSchema(insuranceDetails);
export const selectInsuranceDetailsSchema = createSelectSchema(insuranceDetails);

export const insertPatientDocumentSchema = createInsertSchema(patientDocuments);
export const selectPatientDocumentSchema = createSelectSchema(patientDocuments);

export const insertVisitLogSchema = createInsertSchema(visitLogs);
export const selectVisitLogSchema = createSelectSchema(visitLogs);

export const insertOrganizationSchema = createInsertSchema(organizations);
export const selectOrganizationSchema = createSelectSchema(organizations);

export type Patient = typeof patients.$inferSelect;
export type CarePlan = typeof carePlans.$inferSelect;
export type Progress = typeof progress.$inferSelect;
export type HealthMetric = typeof healthMetrics.$inferSelect;
export type Medication = typeof medications.$inferSelect;
export type MedicationSchedule = typeof medicationSchedules.$inferSelect;
export type MedicationAdherence = typeof medicationAdherence.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type VideoSession = typeof videoSessions.$inferSelect;
export type InsuranceDetails = typeof insuranceDetails.$inferSelect;
export type PatientDocument = typeof patientDocuments.$inferSelect;
export type VisitLog = typeof visitLogs.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

export const insertServiceLogSchema = createInsertSchema(serviceLogs);
export const selectServiceLogSchema = createSelectSchema(serviceLogs);
export type ServiceLog = typeof serviceLogs.$inferSelect;
export type InsertServiceLog = typeof serviceLogs.$inferInsert;

export const insertNotificationSchema = createInsertSchema(notifications);
export const selectNotificationSchema = createSelectSchema(notifications);
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const insertTaskSchema = createInsertSchema(tasks, {
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["high", "medium", "low"]).optional().default("medium"),
  status: z.enum(["pending", "in_progress", "completed"]).optional().default("pending"),
  patientId: z.number().min(1, "Patient is required"),
  createdById: z.number(),
  assignedToIds: z.array(z.number()).min(1, "At least one assignee is required"),
});

export const selectTaskSchema = createSelectSchema(tasks);
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type InsertTaskAssignment = typeof taskAssignments.$inferInsert;

export const insertInvoiceSchema = createInsertSchema(invoices);
export const selectInvoiceSchema = createSelectSchema(invoices);

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems);
export const selectInvoiceItemSchema = createSelectSchema(invoiceItems);

export const insertPaymentSchema = createInsertSchema(payments);
export const selectPaymentSchema = createSelectSchema(payments);

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

export const insertTaskCommentSchema = createInsertSchema(taskComments, {
  content: z.string().min(1, "Comment cannot be empty"),
});

export const selectTaskCommentSchema = createSelectSchema(taskComments);

export const insertTaskHistorySchema = createInsertSchema(taskHistory);
export const selectTaskHistorySchema = createSelectSchema(taskHistory);

export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = typeof taskComments.$inferInsert;
export type TaskHistory = typeof taskHistory.$inferSelect;
export type InsertTaskHistory = typeof taskHistory.$inferInsert;


export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  timezone: text("timezone").default("Europe/Zurich").notNull(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  patientId: integer("patient_id").references(() => patients.id),
  status: text("status", {
    enum: ["scheduled", "cancelled", "completed"]
  }).default("scheduled").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const calendarEventAttendees = pgTable("calendar_event_attendees", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => calendarEvents.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: text("status", {
    enum: ["pending", "accepted", "declined"]
  }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const calendarEventRelations = relations(calendarEvents, ({ one, many }) => ({
  creator: one(users, {
    fields: [calendarEvents.createdById],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [calendarEvents.organizationId],
    references: [organizations.id],
  }),
  patient: one(patients, {
    fields: [calendarEvents.patientId],
    references: [patients.id],
  }),
  attendees: many(calendarEventAttendees),
}));

export const calendarEventAttendeeRelations = relations(calendarEventAttendees, ({ one }) => ({
  event: one(calendarEvents, {
    fields: [calendarEventAttendees.eventId],
    references: [calendarEvents.id],
  }),
  user: one(users, {
    fields: [calendarEventAttendees.userId],
    references: [users.id],
  }),
}));

export const insertCalendarEventSchema = createInsertSchema(calendarEvents, {
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  timezone: z.string().optional(),
  patientId: z.number().optional(),
  status: z.enum(["scheduled", "cancelled", "completed"]).optional(),
  metadata: z.object({}).passthrough().optional(),
});

export const selectCalendarEventSchema = createSelectSchema(calendarEvents);

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEventAttendee = typeof calendarEventAttendees.$inferSelect;

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  title: text("title"), 
  content: text("content").notNull(),
  documentUrl: text("document_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
});

export const journalEntryRelations = relations(journalEntries, ({ one }) => ({
  patient: one(patients, {
    fields: [journalEntries.patientId],
    references: [patients.id],
  }),
  creator: one(users, {
    fields: [journalEntries.createdBy],
    references: [users.id],
  }),
}));

export const insertJournalEntrySchema = createInsertSchema(journalEntries);
export const selectJournalEntrySchema = createSelectSchema(journalEntries);
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = typeof journalEntries.$inferInsert;