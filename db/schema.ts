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

// Relations
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

// Schemas
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

export type User = typeof users.$inferSelect;
export type Patient = typeof patients.$inferSelect;
export type CarePlan = typeof carePlans.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Progress = typeof progress.$inferSelect;
export type HealthMetric = typeof healthMetrics.$inferSelect;