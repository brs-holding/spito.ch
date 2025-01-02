import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import {
  patients,
  appointments,
  providerSchedules,
  users,
  carePlans,
  tasks,
  progress,
  healthMetrics,
  medications,
  medicationSchedules,
  medicationAdherence,
  insuranceDetails,
  patientDocuments,
  visitLogs,
  videoSessions,
  serviceLogs,
  insertUserSchema,
} from "@db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Employee Management Routes for SPITEX Organizations
  app.get("/api/organization/employees", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "spitex_org") {
      return res.status(403).send("Not authorized");
    }

    try {
      const employees = await db
        .select()
        .from(users)
        .where(eq(users.organizationId, req.user.organizationId!));

      const employeePerformance = await Promise.all(
        employees.map(async (employee) => {
          // Get service logs for employee
          const logs = await db
            .select({
              totalHours: sql<number>`sum(${serviceLogs.duration}) / 60.0`,
              totalBilled: sql<number>`sum(${serviceLogs.billingAmount})`,
              patientCount: sql<number>`count(distinct ${serviceLogs.patientId})`,
            })
            .from(serviceLogs)
            .where(eq(serviceLogs.employeeId, employee.id))
            .limit(1);

          const hourlyRate = employee.hourlyRate || 0;
          const monthlyFixedCosts = employee.monthlyFixedCosts || {};
          const totalFixedCosts = Object.values(monthlyFixedCosts).reduce((sum, cost) => sum + (cost || 0), 0);

          const totalCosts = (logs[0]?.totalHours || 0) * hourlyRate + totalFixedCosts;
          const profit = (logs[0]?.totalBilled || 0) - totalCosts;

          return {
            ...employee,
            performance: {
              hoursWorked: logs[0]?.totalHours || 0,
              clientsManaged: logs[0]?.patientCount || 0,
              earningsGenerated: logs[0]?.totalBilled || 0,
              costs: totalCosts,
              profit,
            }
          };
        })
      );

      res.json(employeePerformance);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
      res.status(500).json({
        message: "Failed to fetch employees",
        error: error.message,
      });
    }
  });

  app.post("/api/organization/employees", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "spitex_org") {
      return res.status(403).send("Not authorized");
    }

    try {
      const result = insertUserSchema.safeParse({
        ...req.body,
        role: "spitex_employee",
        organizationId: req.user.organizationId,
      });

      if (!result.success) {
        return res.status(400).send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      const [newEmployee] = await db
        .insert(users)
        .values(result.data)
        .returning();

      res.json(newEmployee);
    } catch (error: any) {
      console.error("Error creating employee:", error);
      res.status(500).json({
        message: "Failed to create employee",
        error: error.message,
      });
    }
  });

  app.put("/api/organization/employees/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "spitex_org") {
      return res.status(403).send("Not authorized");
    }

    try {
      const employeeId = parseInt(req.params.id);

      // Verify employee belongs to organization
      const [employee] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, employeeId),
            eq(users.organizationId, req.user.organizationId!)
          )
        )
        .limit(1);

      if (!employee) {
        return res.status(404).send("Employee not found");
      }

      const [updatedEmployee] = await db
        .update(users)
        .set(req.body)
        .where(eq(users.id, employeeId))
        .returning();

      res.json(updatedEmployee);
    } catch (error: any) {
      console.error("Error updating employee:", error);
      res.status(500).json({
        message: "Failed to update employee",
        error: error.message,
      });
    }
  });

  // Service Logs Routes
  app.get("/api/service-logs", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      let query = db.select().from(serviceLogs);

      if (req.user.role === "spitex_employee") {
        // Employees can only see their own logs
        query = query.where(eq(serviceLogs.employeeId, req.user.id));
      } else if (req.user.role === "spitex_org") {
        // Organizations can see logs of all their employees
        query = query.where(
          eq(serviceLogs.employeeId, req.user.organizationId!)
        );
      }

      const logs = await query;
      res.json(logs);
    } catch (error: any) {
      console.error("Error fetching service logs:", error);
      res.status(500).json({
        message: "Failed to fetch service logs",
        error: error.message,
      });
    }
  });

  app.post("/api/service-logs", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const employeeId = req.user.role === "spitex_employee" 
        ? req.user.id 
        : req.body.employeeId;

      const [newLog] = await db
        .insert(serviceLogs)
        .values({
          ...req.body,
          employeeId,
        })
        .returning();

      res.json(newLog);
    } catch (error: any) {
      console.error("Error creating service log:", error);
      res.status(500).json({
        message: "Failed to create service log",
        error: error.message,
      });
    }
  });

  // Provider Schedule Routes
  app.get("/api/provider-schedules", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const schedules = await db
        .select()
        .from(providerSchedules)
        .innerJoin(users, eq(providerSchedules.providerId, users.id))
        .where(
          and(
            eq(users.role, "doctor"),
            eq(providerSchedules.isAvailable, true)
          )
        );

      res.json(schedules);
    } catch (error: any) {
      console.error("Error fetching provider schedules:", error);
      res.status(500).json({
        message: "Failed to fetch provider schedules",
        error: error.message,
      });
    }
  });
  // Appointment Routes
  app.get("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { date } = req.query;
      let appointmentsList;

      if (date) {
        const startDate = new Date(date as string);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        appointmentsList = await db
          .select()
          .from(appointments)
          .where(
            and(
              gte(appointments.scheduledFor, startDate),
              lte(appointments.scheduledFor, endDate)
            )
          );
      } else if (req.user.role === "patient") {
        const [patient] = await db
          .select()
          .from(patients)
          .where(eq(patients.userId, req.user.id))
          .limit(1);

        if (!patient) {
          return res.status(404).send("Patient profile not found");
        }

        appointmentsList = await db
          .select()
          .from(appointments)
          .where(eq(appointments.patientId, patient.id));
      } else {
        appointmentsList = await db
          .select()
          .from(appointments)
          .where(eq(appointments.providerId, req.user.id));
      }

      res.json(appointmentsList);
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({
        message: "Failed to fetch appointments",
        error: error.message,
      });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      // Check for scheduling conflicts
      const startTime = new Date(req.body.scheduledFor);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + req.body.duration);

      const existingAppointments = await db
        .select()
        .from(appointments)
        .where(
          and(
            gte(appointments.scheduledFor, startTime),
            lte(appointments.scheduledFor, endTime)
          )
        );

      if (existingAppointments.length > 0) {
        return res.status(400).send("Time slot already booked");
      }

      // Get available provider
      const [provider] = await db
        .select()
        .from(users)
        .where(eq(users.role, "doctor"))
        .limit(1);

      if (!provider) {
        return res.status(404).send("No providers available");
      }

      // Get patient profile
      const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.userId, req.user.id))
        .limit(1);

      if (!patient) {
        return res.status(404).send("Patient profile not found");
      }

      const appointmentData = {
        ...req.body,
        patientId: patient.id,
        providerId: provider.id,
        status: "scheduled",
      };

      const [newAppointment] = await db
        .insert(appointments)
        .values(appointmentData)
        .returning();

      res.json(newAppointment);
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      res.status(500).json({
        message: "Failed to create appointment",
        error: error.message,
      });
    }
  });

  app.patch("/api/appointments/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { status } = req.body;
    const appointmentId = parseInt(req.params.id);

    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment) {
      return res.status(404).send("Appointment not found");
    }

    if (req.user.role !== "patient" && appointment.providerId !== req.user.id) {
      return res.status(403).send("Not authorized to update this appointment");
    }

    const [updatedAppointment] = await db
      .update(appointments)
      .set({ status })
      .where(eq(appointments.id, appointmentId))
      .returning();

    res.json(updatedAppointment);
  });


  // Patient Profile Routes
  app.get("/api/patients", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const allPatients = await db.select().from(patients);
    res.json(allPatients);
  });

  app.get("/api/patients/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, parseInt(req.params.id)))
      .limit(1);

    if (!patient) {
      return res.status(404).send("Patient not found");
    }
    res.json(patient);
  });

  app.post("/api/patients", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const patientData = {
        ...req.body,
        dateOfBirth: new Date(req.body.dateOfBirth),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [newPatient] = await db
        .insert(patients)
        .values(patientData)
        .returning();

      res.json(newPatient);
    } catch (error: any) {
      console.error("Error creating patient:", error);
      res.status(500).json({
        message: "Failed to create patient",
        error: error.message,
      });
    }
  });

  app.put("/api/patients/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const [updatedPatient] = await db
      .update(patients)
      .set(req.body)
      .where(eq(patients.id, parseInt(req.params.id)))
      .returning();
    res.json(updatedPatient);
  });

  // Insurance Details Routes
  app.get("/api/patients/:id/insurance", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const patientInsurance = await db
      .select()
      .from(insuranceDetails)
      .where(eq(insuranceDetails.patientId, parseInt(req.params.id)));
    res.json(patientInsurance);
  });

  app.post("/api/patients/:id/insurance", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const newInsurance = await db
      .insert(insuranceDetails)
      .values({
        ...req.body,
        patientId: parseInt(req.params.id),
      })
      .returning();
    res.json(newInsurance[0]);
  });

  // Document Routes
  app.get("/api/patients/:id/documents", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const documents = await db
      .select()
      .from(patientDocuments)
      .where(eq(patientDocuments.patientId, parseInt(req.params.id)));
    res.json(documents);
  });

  app.post("/api/patients/:id/documents", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { title, type, metadata } = req.body;

      // Basic validation
      if (!title || !type) {
        return res.status(400).send("Title and type are required");
      }

      // Create document record
      const documentData = {
        patientId: parseInt(req.params.id),
        uploadedBy: req.user!.id,
        title,
        type,
        fileUrl: `document_${Date.now()}.pdf`, // For now using a placeholder URL
        uploadedAt: new Date(),
        metadata: metadata || {},
      };

      const [newDocument] = await db
        .insert(patientDocuments)
        .values(documentData)
        .returning();

      res.json(newDocument);
    } catch (error: any) {
      console.error("Error uploading document:", error);
      res.status(500).json({
        message: "Failed to upload document",
        error: error.message,
      });
    }
  });

  app.get("/api/documents/:id/preview", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const documentId = parseInt(req.params.id);
      const [document] = await db
        .select()
        .from(patientDocuments)
        .where(eq(patientDocuments.id, documentId))
        .limit(1);

      if (!document) {
        return res.status(404).send("Document not found");
      }

      // For now, we'll send a sample PDF file
      const samplePdfPath = path.join(__dirname, "..", "sample.pdf");
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=document.pdf');
      res.sendFile(samplePdfPath);
    } catch (error: any) {
      console.error("Error previewing document:", error);
      res.status(500).json({
        message: "Failed to preview document",
        error: error.message,
      });
    }
  });

  app.get("/api/documents/:id/download", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const documentId = parseInt(req.params.id);
      const [document] = await db
        .select()
        .from(patientDocuments)
        .where(eq(patientDocuments.id, documentId))
        .limit(1);

      if (!document) {
        return res.status(404).send("Document not found");
      }

      // For now, we'll send a sample PDF file
      const samplePdfPath = path.join(__dirname, "..", "sample.pdf");
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=document.pdf');
      res.sendFile(samplePdfPath);
    } catch (error: any) {
      console.error("Error downloading document:", error);
      res.status(500).json({
        message: "Failed to download document",
        error: error.message,
      });
    }
  });

  // Visit Logs Routes
  app.get("/api/patients/:id/visits", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const visits = await db
      .select()
      .from(visitLogs)
      .where(eq(visitLogs.patientId, parseInt(req.params.id)));
    res.json(visits);
  });

  app.post("/api/patients/:id/visits", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const newVisit = await db
      .insert(visitLogs)
      .values({
        ...req.body,
        patientId: parseInt(req.params.id),
        caregiverId: req.user!.id,
      })
      .returning();
    res.json(newVisit[0]);
  });

  // Care Plans
  app.get("/api/care-plans/:patientId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const patientCarePlans = await db
      .select()
      .from(carePlans)
      .where(eq(carePlans.patientId, parseInt(req.params.patientId)));
    res.json(patientCarePlans);
  });

  app.post("/api/care-plans", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const newCarePlan = await db.insert(carePlans).values(req.body).returning();
    res.json(newCarePlan[0]);
  });

  // Tasks
  app.get("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.assignedToId, req.user!.id));
    res.json(userTasks);
  });

  app.post("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const newTask = await db.insert(tasks).values(req.body).returning();
    res.json(newTask[0]);
  });

  // Progress
  app.get("/api/progress/:carePlanId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const carePlanProgress = await db
      .select()
      .from(progress)
      .where(eq(progress.carePlanId, parseInt(req.params.carePlanId)));
    res.json(carePlanProgress);
  });

  app.post("/api/progress", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const newProgress = await db.insert(progress).values(req.body).returning();
    res.json(newProgress[0]);
  });

  // Medication Routes
  app.get("/api/medications", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const allMedications = await db.select().from(medications);
    res.json(allMedications);
  });

  app.get("/api/patient/medications", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.userId, req.user!.id))
      .limit(1);

    if (!patient) {
      return res.status(404).send("Patient profile not found");
    }

    const schedules = await db
      .select()
      .from(medicationSchedules)
      .where(
        and(
          eq(medicationSchedules.patientId, patient.id),
          eq(medicationSchedules.active, true)
        )
      );

    const medicationIds = schedules.map((schedule) => schedule.medicationId);
    const medicationDetails = await db
      .select()
      .from(medications)
      .where(eq(medications.id, medicationIds[0])); // Using first ID as example

    res.json({ schedules, medications: medicationDetails });
  });

  app.post("/api/patient/medication-adherence", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.userId, req.user!.id))
      .limit(1);

    if (!patient) {
      return res.status(404).send("Patient profile not found");
    }

    const newAdherence = await db
      .insert(medicationAdherence)
      .values(req.body)
      .returning();

    res.json(newAdherence[0]);
  });

  app.get("/api/patient/medication-adherence/:scheduleId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const adherenceRecords = await db
      .select()
      .from(medicationAdherence)
      .where(eq(medicationAdherence.scheduleId, parseInt(req.params.scheduleId)));

    res.json(adherenceRecords);
  });

  // Patient Portal Routes
  app.get("/api/patient/health-metrics", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    if (req.user.role !== "patient") {
      return res.status(403).send("Not authorized");
    }

    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.userId, req.user.id))
      .limit(1);

    if (!patient) {
      return res.status(404).send("Patient profile not found");
    }

    const metrics = await db
      .select()
      .from(healthMetrics)
      .where(eq(healthMetrics.patientId, patient.id));

    res.json(metrics);
  });

  app.post("/api/patient/health-metrics", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    if (req.user.role !== "patient") {
      return res.status(403).send("Not authorized");
    }

    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.userId, req.user.id))
      .limit(1);

    if (!patient) {
      return res.status(404).send("Patient profile not found");
    }

    const newMetric = await db
      .insert(healthMetrics)
      .values({ ...req.body, patientId: patient.id })
      .returning();

    res.json(newMetric[0]);
  });

  // Video Session Routes
  app.post("/api/appointments/:id/session", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const appointmentId = parseInt(req.params.id);
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment) {
      return res.status(404).send("Appointment not found");
    }

    if (appointment.providerId !== req.user.id && req.user.role !== "patient") {
      return res.status(403).send("Not authorized to create video session");
    }

    const [videoSession] = await db
      .insert(videoSessions)
      .values({
        appointmentId,
        sessionId: req.body.sessionId,
        status: "pending",
      })
      .returning();

    res.json(videoSession);
  });

  app.patch("/api/video-sessions/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { status } = req.body;
    const sessionId = parseInt(req.params.id);

    const [updatedSession] = await db
      .update(videoSessions)
      .set({
        status,
        ...(status === "active" ? { startedAt: new Date() } : {}),
        ...(status === "ended" ? { endedAt: new Date() } : {}),
      })
      .where(eq(videoSessions.id, sessionId))
      .returning();

    res.json(updatedSession);
  });

  const httpServer = createServer(app);
  return httpServer;
}