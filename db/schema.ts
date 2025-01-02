import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique(),  
  password: text("password").notNull(),
  role: text("role", { enum: ["doctor", "nurse", "admin", "patient"] }).notNull().default("nurse"),
  fullName: text("full_name").notNull().default(''),
});

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
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
  carePlanId: integer("care_plan_id").references(() => carePlans.id).notNull(),
  assignedToId: integer("assigned_to_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status", { enum: ["pending", "in_progress", "completed"] }).notNull().default("pending"),
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
  assignedTasks: many(tasks),
  patient: one(patients, {
    fields: [users.id],
    references: [patients.userId],
  }),
  providedAppointments: many(appointments, { relationName: "provider" }),
  schedules: many(providerSchedules),
}));

export const patientRelations = relations(patients, ({ one, many }) => ({
  user: one(users, {
    fields: [patients.userId],
    references: [users.id],
  }),
  insuranceDetails: many(insuranceDetails),
  documents: many(patientDocuments),
  visitLogs: many(visitLogs),
  carePlans: many(carePlans),
  healthMetrics: many(healthMetrics),
  medicationSchedules: many(medicationSchedules),
  appointments: many(appointments),
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

export const insertProviderScheduleSchema = createInsertSchema(providerSchedules);
export const selectProviderScheduleSchema = createSelectSchema(providerSchedules);
export type ProviderSchedule = typeof providerSchedules.$inferSelect;


export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["doctor", "nurse", "admin", "patient"]).optional(),
  fullName: z.string().optional(),
});

export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const insertPatientSchema = createInsertSchema(patients);
export const selectPatientSchema = createSelectSchema(patients);

export const insertCarePlanSchema = createInsertSchema(carePlans);
export const selectCarePlanSchema = createSelectSchema(carePlans);

export const insertTaskSchema = createInsertSchema(tasks);
export const selectTaskSchema = createSelectSchema(tasks);

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

export type Patient = typeof patients.$inferSelect;
export type CarePlan = typeof carePlans.$inferSelect;
export type Task = typeof tasks.$inferSelect;
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