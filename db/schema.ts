import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["doctor", "nurse", "admin", "patient"] }).notNull().default("nurse"),
  fullName: text("full_name").notNull(),
});

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  medicalHistory: text("medical_history"),
  contactInfo: jsonb("contact_info").notNull(),
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
}));

export const patientRelations = relations(patients, ({ many, one }) => ({
  carePlans: many(carePlans),
  healthMetrics: many(healthMetrics),
  medicationSchedules: many(medicationSchedules),
  user: one(users, {
    fields: [patients.userId],
    references: [users.id],
  }),
}));

export const carePlanRelations = relations(carePlans, ({ one, many }) => ({
  patient: one(patients, {
    fields: [carePlans.patientId],
    references: [patients.id],
  }),
  tasks: many(tasks),
  progressRecords: many(progress),
}));

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

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

export type User = typeof users.$inferSelect;
export type Patient = typeof patients.$inferSelect;
export type CarePlan = typeof carePlans.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Progress = typeof progress.$inferSelect;
export type HealthMetric = typeof healthMetrics.$inferSelect;
export type Medication = typeof medications.$inferSelect;
export type MedicationSchedule = typeof medicationSchedules.$inferSelect;
export type MedicationAdherence = typeof medicationAdherence.$inferSelect;