import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { 
  patients, 
  carePlans, 
  tasks, 
  progress, 
  healthMetrics, 
  medications,
  medicationSchedules,
  medicationAdherence,
  appointments,
  videoSessions,
  insuranceDetails,
  patientDocuments,
  visitLogs,
} from "@db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

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
    const newDocument = await db
      .insert(patientDocuments)
      .values({
        ...req.body,
        patientId: parseInt(req.params.id),
        uploadedBy: req.user!.id,
      })
      .returning();
    res.json(newDocument[0]);
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

    const medicationIds = schedules.map(schedule => schedule.medicationId);
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

  // Appointment Routes
  app.get("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    let appointmentsList;
    if (req.user.role === "patient") {
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
  });

  app.post("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    if (req.user.role === "patient") {
      const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.userId, req.user.id))
        .limit(1);

      if (!patient) {
        return res.status(404).send("Patient profile not found");
      }

      const newAppointment = await db
        .insert(appointments)
        .values({
          ...req.body,
          patientId: patient.id,
        })
        .returning();

      res.json(newAppointment[0]);
    } else {
      return res.status(403).send("Only patients can book appointments");
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