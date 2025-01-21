import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { crypto } from "./utils/crypto";
import {
  users,
  insertUserSchema,
  patients,
  appointments,
  providerSchedules,
  serviceLogs,
  carePlans,
  tasks,
  taskAssignments,
  insertTaskSchema,
  progress,
  healthMetrics,
  medications,
  medicationSchedules,
  medicationAdherence,
  insuranceDetails,
  patientDocuments,
  visitLogs,
  videoSessions,
  notifications,
  invoices,
  insertInvoiceSchema,
  calendarEvents,
  calendarEventAttendees,
  insertCalendarEventSchema,
} from "@db/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Increase payload size limit for base64 images
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Employee Management Routes for SPITEX Organizations
  app.get("/api/organization/employees", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "spitex_org") {
      return res.status(403).send("Not authorized");
    }

    try {
      const employees = await db
        .select({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          email: users.email,
          isActive: users.isActive,
        })
        .from(users)
        .where(eq(users.organizationId, req.user.organizationId!));

      res.json(employees);
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
      console.log('Received employee data:', req.body);

      const result = insertUserSchema.safeParse({
        ...req.body,
        role: "spitex_employee",
        organizationId: req.user.organizationId,
      });

      if (!result.success) {
        console.error('Validation errors:', result.error.issues);
        return res.status(400).send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      // Hash the password before storing
      const hashedPassword = await crypto.hash(result.data.password);

      const [newEmployee] = await db
        .insert(users)
        .values({
          username: result.data.username,
          password: hashedPassword, // Use the hashed password
          email: result.data.email,
          fullName: result.data.fullName,
          role: "spitex_employee",
          organizationId: req.user.organizationId,
          isActive: true,
          createdAt: new Date(),
        })
        .returning();

      console.log('Created employee:', newEmployee);
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


  // Patient Profile Routes (UPDATED)
  app.get("/api/patients", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      let query;

      // Filter patients based on user role and organization
      if (req.user.role === "spitex_org" || req.user.role === "spitex_employee") {
        if (!req.user.organizationId) {
          return res.status(403).send("No organization assigned");
        }

        // Get organization's patients only
        query = db
          .select({
            id: patients.id,
            firstName: patients.firstName,
            lastName: patients.lastName,
            dateOfBirth: patients.dateOfBirth,
            gender: patients.gender,
            email: patients.email,
            phone: patients.phone,
            address: patients.address,
            emergencyContact: patients.emergencyContact,
            medicalHistory: patients.medicalHistory,
            currentDiagnoses: patients.currentDiagnoses,
            allergies: patients.allergies,
            preferences: patients.preferences,
            createdAt: patients.createdAt,
            updatedAt: patients.updatedAt,
          })
          .from(patients)
          .where(eq(patients.organizationId, req.user.organizationId));
      } else {
        // Other roles are not authorized to view patient data
        return res.status(403).send("Not authorized to view patient data");
      }

      const allPatients = await query;
      res.json(allPatients);
    } catch (error: any) {
      console.error("Error fetching patients:", error);
      res.status(500).json({
        message: "Failed to fetch patients",
        error: error.message,
      });
    }
  });

  // Create patient endpoint (UPDATED)
  app.post("/api/patients", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    if (req.user.role !== "spitex_org" && req.user.role !== "spitex_employee") {
      return res.status(403).send("Not authorized to create patients");
    }

    if (!req.user.organizationId) {
      return res.status(403).send("No organization assigned");
    }

    try {
      const patientData = {
        ...req.body,
        organizationId: req.user.organizationId,
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

  // Get single patient endpoint (UPDATED)
  app.get("/api/patients/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [patient] = await db
        .select()
        .from(patients)
        .where(
          and(
            eq(patients.id, parseInt(req.params.id)),
            eq(patients.organizationId, req.user.organizationId!)
          )
        )
        .limit(1);

      if (!patient) {
        return res.status(404).send("Patient not found");
      }

      res.json(patient);
    } catch (error: any) {
      console.error("Error fetching patient:", error);
      res.status(500).json({
        message: "Failed to fetch patient",
        error: error.message,
      });
    }
  });

  // Update patient endpoint (NEW)
  app.put("/api/patients/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    if (req.user.role !== "spitex_org" && req.user.role !== "spitex_employee") {
      return res.status(403).send("Not authorized to update patient data");
    }

    try {
      const patientId = parseInt(req.params.id);
      const [existingPatient] = await db
        .select()
        .from(patients)
        .where(eq(patients.id, patientId))
        .limit(1);

      if (!existingPatient) {
        return res.status(404).send("Patient not found");
      }

      const updateData = {
        ...req.body,
        dateOfBirth: new Date(req.body.dateOfBirth),
        updatedAt: new Date(),
      };

      const [updatedPatient] = await db
        .update(patients)
        .set(updateData)
        .where(eq(patients.id, patientId))
        .returning();

      res.json(updatedPatient);
    } catch (error: any) {
      console.error("Error updating patient:", error);
      res.status(500).json({
        message: "Failed to update patient",
        error: error.message,
      });
    }
  });

  // Delete patient endpoint (NEW)
  app.delete("/api/patients/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    if (req.user.role !== "spitex_org") {
      return res.status(403).send("Not authorized to delete patients");
    }

    try {
      const patientId = parseInt(req.params.id);
      const [existingPatient] = await db
        .select()
        .from(patients)
        .where(eq(patients.id, patientId))
        .limit(1);

      if (!existingPatient) {
        return res.status(404).send("Patient not found");
      }

      const [deletedPatient] = await db
        .delete(patients)
        .where(eq(patients.id, patientId))
        .returning();

      res.json({ message: "Patient deleted successfully", patient: deletedPatient });
    } catch (error: any) {
      console.error("Error deleting patient:", error);
      res.status(500).json({
        message: "Failed to delete patient",
        error: error.message,
      });
    }
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

  //// Progress
  app.get("/api/progress/:carePlanId", async(req, res) => {
        if (!req.isAuthenticated) {
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

  app.post("/api/patient/medication-adherence", async (reqres) => {
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

    try {
      const scheduleId = parseInt(req.params.scheduleId);
      const adherenceRecords = await db
        .select()
        .from(medicationAdherence)
        .where(eq(medicationAdherence.scheduleId, scheduleId));

      res.json(adherenceRecords);
    } catch (error: any) {
      console.error("Error fetching medication adherence:", error);
      res.status(500).json({
        message: "Failed to fetch medication adherence",
        error: error.message,
      });
    }
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

  // Analytics Routes
  app.get("/api/analytics/tasks", async (req, res) => {
    if (!req.isAuthenticated() || !["spitex_org", "super_admin"].includes(req.user.role)) {
      return res.status(403).send("Not authorized");
    }

    try {
      // Get task completion metrics
      const taskStats = await db
        .select({
          status: tasks.status,
          count: sql<number>`count(*)::int`,
        })
        .from(tasks)
        .groupBy(tasks.status);

      const completionRate = taskStats.map(stat => ({
        name: stat.status,
        value: stat.count,
      }));

      res.json({ completionRate });
    } catch (error: any) {
      console.error("Error fetching task analytics:", error);
      res.status(500).json({
        message: "Failed to fetch task analytics",
        error: error.message,
      });
    }
  });

  app.get("/api/analytics/patients", async (req, res) => {
    if (!req.isAuthenticated() || !["spitex_org", "super_admin"].includes(req.user.role)) {
      return res.status(403).send("Not authorized");
    }

    try {
      // Get patient growth over time (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const patientGrowth = await db
        .select({
          date: sql<string>`date_trunc('month', ${patients.createdAt})::text`,
          patients: sql<number>`count(*)::int`,
        })
        .from(patients)
        .where(gte(patients.createdAt, sixMonthsAgo))
        .groupBy(sql`date_trunc('month', ${patients.createdAt})`)
        .orderBy(sql`date_trunc('month', ${patients.createdAt})`);

      res.json({ growth: patientGrowth });
    } catch (error: any) {
      console.error("Error fetching patient analytics:", error);
      res.status(500).json({
        message: "Failed to fetch patient analytics",
        error: error.message,
      });
    }
  });

  app.get("/api/analytics/employees", async (req, res) => {
    if (!req.isAuthenticated() || !["spitex_org", "super_admin"].includes(req.user.role)) {
      return res.status(403).send("Not authorized");
    }

    try {
      // Get employee performance metrics (tasks completed per month)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const employeePerformance = await db
        .select({
          date: sql<string>`date_trunc('month', ${tasks.updatedAt})::text`,
          completedTasks: sql<number>`count(*)::int`,
        })
        .from(tasks)
        .where(
          and(
            eq(tasks.status, "completed"),
            gte(tasks.updatedAt, sixMonthsAgo)
          )
        )
        .groupBy(sql`date_trunc('month', ${tasks.updatedAt})`)
        .orderBy(sql`date_trunc('month', ${tasks.updatedAt})`);

      res.json({ performance: employeePerformance });
    } catch (error: any) {
      console.error("Error fetching employee analytics:", error);
      res.status(500).json({
        message: "Failed to fetch employee analytics",
        error: error.message,
      });
    }
  });

  // Invoice Routes
  app.get("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      let query = db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          status: invoices.status,
          totalAmount: invoices.totalAmount,
          selbstbehaltAmount: invoices.selbstbehaltAmount,
          createdAt: invoices.createdAt,
          dueDate: invoices.dueDate,
          startDate: invoices.startDate,
          endDate: invoices.endDate,
          recipientType: invoices.recipientType,
          patientId: invoices.patientId,
          metadata: invoices.metadata,
        })
        .from(invoices)
        .orderBy(desc(invoices.createdAt));

      // Filter invoices based on user role
      if (req.user.role === "spitex_org") {
        // Organizations see all their invoices
        query = query.where(eq(invoices.organizationId, req.user.organizationId!));
      } else if (req.user.role === "patient") {
        // Patients only see their invoices
        const [patient] = await db
          .select()
          .from(patients)
          .where(eq(patients.userId, req.user.id))
          .limit(1);

        if (!patient) {
          return res.status(404).send("Patient profile not found");
        }

        query = query.where(eq(invoices.patientId, patient.id));
      } else {
        return res.status(403).send("Not authorized to view invoices");
      }

      const invoicesList = await query;
      res.json(invoicesList);
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({
        message: "Failed to fetch invoices",
        error: error.message,
      });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    if (req.user.role !== "spitex_org") {
      return res.status(403).send("Not authorized to create invoices");
    }

    try {
      // Generate invoice number
      const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      // Prepare the invoice data
      const invoiceData = {
        ...req.body,
        invoiceNumber,
        organizationId: req.user.organizationId,
        createdById: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Ensure all required fields are present and properly formatted
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        dueDate: new Date(req.body.dueDate),
        totalAmount: req.body.totalAmount.toString(),
        selbstbehaltAmount: req.body.selbstbehaltAmount.toString(),
        status: req.body.status || "draft",
        recipientType: req.body.recipientType || "insurance",
        metadata: {
          ...req.body.metadata,
          createdBy: req.user.fullName,
          createdAt: new Date().toISOString(),
        }
      };

      const [newInvoice] = await db
        .insert(invoices)
        .values(invoiceData)
        .returning();

      // Create notification for the patient
      await db.insert(notifications).values({
        userId: invoiceData.patientId,
        title: "New Invoice Created",
        message: `A new invoice (#${invoiceNumber}) has been created for your services`,
        type: "invoice_created",
        priority: "normal",
        isRead: false,
        createdAt: new Date(),
        metadata: {
          invoiceId: newInvoice.id,
          invoiceNumber: invoiceNumber,
        }
      });

      res.json(newInvoice);
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      res.status(500).json({
        message: "Failed to create invoice",
        error: error.message,
      });
    }
  });

  app.get("/api/invoices/:id/pdf", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const invoiceId = parseInt(req.params.id);
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoiceId))
        .limit(1);

      if (!invoice) {
        return res.status(404).send("Invoice not found");
      }

      // Check authorization
      if (req.user.role === "spitex_org") {
        if (invoice.organizationId !== req.user.organizationId) {
          return res.status(403).send("Not authorized to access this invoice");
        }
      } else if (req.user.role === "patient") {
        const [patient] = await db
          .select()
          .from(patients)
          .where(eq(patients.userId, req.user.id))
          .limit(1);

        if (!patient || invoice.patientId !== patient.id) {
          return res.status(403).send("Not authorized to access this invoice");
        }
      } else {
        return res.status(403).send("Not authorized to access invoices");
      }

      // TODO: Generate PDF
      // For now, send a simple text response
      res.setHeader('Content-Type', 'text/plain');
      res.send(`Invoice #${invoice.invoiceNumber}\nAmount: ${invoice.totalAmount}`);
    } catch (error: any) {
      console.error("Error generating invoice PDF:", error);
      res.status(500).json({
        message: "Failed to generate invoice PDF",
        error: error.message,
      });
    }
  });

  // Add these routes after the existing routes
  // Calendar Routes
  app.get("/api/calendar", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      // Get all calendar events for the organization
      const events = await db
        .select({
          id: calendarEvents.id,
          title: calendarEvents.title,
          description: calendarEvents.description,
          startTime: calendarEvents.startTime,
          endTime: calendarEvents.endTime,
          timezone: calendarEvents.timezone,
          status: calendarEvents.status,
          metadata: calendarEvents.metadata,
          createdById: calendarEvents.createdById,
          patientId: calendarEvents.patientId,
          createdAt: calendarEvents.createdAt,
        })
        .from(calendarEvents)
        .where(eq(calendarEvents.organizationId, req.user.organizationId!))
        .orderBy(desc(calendarEvents.startTime));

      // Get attendees for each event
      const eventsWithAttendees = await Promise.all(
        events.map(async (event) => {
          const attendees = await db
            .select({
              id: calendarEventAttendees.id,
              userId: calendarEventAttendees.userId,
              status: calendarEventAttendees.status,
            })
            .from(calendarEventAttendees)
            .where(eq(calendarEventAttendees.eventId, event.id))
            .innerJoin(users, eq(calendarEventAttendees.userId, users.id));

          return {
            ...event,
            attendees,
          };
        })
      );

      res.json(eventsWithAttendees);
    } catch (error: any) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({
        message: "Failed to fetch calendar events",
        error: error.message,
      });
    }
  });

  app.post("/api/calendar", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const result = insertCalendarEventSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).send(
          "Invalid input: " + result.error.issues.map((i) => i.message).join(", ")
        );
      }

      const { title, description, startTime, endTime, timezone = "Europe/Zurich", patientId, status, metadata } = result.data;

      // Create the calendar event
      const [newEvent] = await db
        .insert(calendarEvents)
        .values({
          title,
          description,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          timezone,
          organizationId: req.user.organizationId!,
          createdById: req.user.id,
          patientId,
          status,
          metadata,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Add attendees if provided
      if (req.body.attendeeIds && Array.isArray(req.body.attendeeIds)) {
        const attendeePromises = req.body.attendeeIds.map(async (userId: number) => {
          // Verify user belongs to organization
          const [user] = await db
            .select()
            .from(users)
            .where(
              and(
                eq(users.id, userId),
                eq(users.organizationId, req.user.organizationId!)
              )
            )
            .limit(1);

          if (!user) {
            throw new Error(`User ${userId} not found in organization`);
          }

          const [attendee] = await db
            .insert(calendarEventAttendees)
            .values({
              eventId: newEvent.id,
              userId,
              status: "pending",
              createdAt: new Date(),
            })
            .returning();

          return attendee;
        });

        const attendees = await Promise.all(attendeePromises);
        newEvent.attendees = attendees;
      }

      res.json(newEvent);
    } catch (error: any) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({
        message: "Failed to create calendar event",
        error: error.message,
      });
    }
  });

  app.patch("/api/calendar/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const eventId = parseInt(req.params.id);

      // Verify event belongs to organization
      const [event] = await db
        .select()
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.id, eventId),
            eq(calendarEvents.organizationId, req.user.organizationId!)
          )
        )
        .limit(1);

      if (!event) {
        return res.status(404).send("Event not found");
      }

      const [updatedEvent] = await db
        .update(calendarEvents)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(calendarEvents.id, eventId))
        .returning();

      res.json(updatedEvent);
    } catch (error: any) {
      console.error("Error updating calendar event:", error);
      res.status(500).json({
        message: "Failed to update calendar event",
        error: error.message,
      });
    }
  });

  app.delete("/api/calendar/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const eventId = parseInt(req.params.id);

      // Verify event belongs to organization
      const [event] = await db
        .select()
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.id, eventId),
            eq(calendarEvents.organizationId, req.user.organizationId!)
          )
        )
        .limit(1);

      if (!event) {
        return res.status(404).send("Event not found");
      }

      // Delete attendees first
      await db
        .delete(calendarEventAttendees)
        .where(eq(calendarEventAttendees.eventId, eventId));

      // Delete the event
      const [deletedEvent] = await db
        .delete(calendarEvents)
        .where(eq(calendarEvents.id, eventId))
        .returning();

      res.json({ message: "Event deleted successfully", event: deletedEvent });
    } catch (error: any) {
      console.error("Error deleting calendar event:", error);
      res.status(500).json({
        message: "Failed to delete calendar event",
        error: error.message,
      });
    }
  });

  // Calendar Attendee Routes
  app.post("/api/calendar/:id/attendees", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const eventId = parseInt(req.params.id);
      const { userId } = req.body;

      // Verify event belongs to organization
      const [event] = await db
        .select()
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.id, eventId),
            eq(calendarEvents.organizationId, req.user.organizationId!)
          )
        )
        .limit(1);

      if (!event) {
        return res.status(404).send("Event not found");
      }

      // Verify user belongs to organization
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, userId),
            eq(users.organizationId, req.user.organizationId!)
          )
        )
        .limit(1);

      if (!user) {
        return res.status(404).send("User not found in organization");
      }

      const [attendee] = await db
        .insert(calendarEventAttendees)
        .values({
          eventId,
          userId,
          status: "pending",
          createdAt: new Date(),
        })
        .returning();

      res.json(attendee);
    } catch (error: any) {
      console.error("Error adding calendar event attendee:", error);
      res.status(500).json({
        message: "Failed to add calendar event attendee",
        error: error.message,
      });
    }
  });

  app.patch("/api/calendar/:eventId/attendees/:userId/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const eventId = parseInt(req.params.eventId);
      const userId = parseInt(req.params.userId);
      const { status } = req.body;

      if (!["pending", "accepted", "declined"].includes(status)) {
        return res.status(400).send("Invalid status");
      }

      // Verify event belongs to organization
      const [event] = await db
        .select()
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.id, eventId),
            eq(calendarEvents.organizationId, req.user.organizationId!)
          )
        )
        .limit(1);

      if (!event) {
        return res.status(404).send("Event not found");
      }

      // Update attendee status
      const [updatedAttendee] = await db
        .update(calendarEventAttendees)
        .set({ status })
        .where(
          and(
            eq(calendarEventAttendees.eventId, eventId),
            eq(calendarEventAttendees.userId, userId)
          )
        )
        .returning();

      res.json(updatedAttendee);
    } catch (error: any) {
      console.error("Error updating calendar event attendee status:", error);
      res.status(500).json({
        message: "Failed to update calendar event attendee status",
        error: error.message,
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}