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
  videoSessions
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
      console.log("Received patient data:", req.body); // Debug log

      const { 
        firstName,
        lastName,
        dateOfBirth,
        gender,
        email,
        phone,
        address,
        emergencyContact
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !dateOfBirth || !gender || !email || !phone || !address || !emergencyContact) {
        return res.status(400).json({
          message: "Failed to create patient",
          error: "Missing required fields",
        });
      }

      // Validate date format
      const parsedDate = new Date(dateOfBirth);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: "Failed to create patient",
          error: "Invalid date format for date of birth",
        });
      }

      // Create the patient record
      const [newPatient] = await db
        .insert(patients)
        .values({
          first_name: firstName,
          last_name: lastName,
          date_of_birth: parsedDate,
          gender,
          email,
          phone,
          address,
          emergency_contact: emergencyContact,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning();

      console.log("Created patient:", newPatient); // Debug log
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

    try {
      const patientId = parseInt(req.params.id);
      const updateData: any = { ...req.body };

      // Handle dateOfBirth if present
      if (updateData.dateOfBirth) {
        try {
          const dateOfBirth = new Date(updateData.dateOfBirth);
          if (isNaN(dateOfBirth.getTime())) {
            throw new Error("Invalid date of birth");
          }
          updateData.dateOfBirth = dateOfBirth;
        } catch (error) {
          return res.status(400).json({
            message: "Failed to update patient",
            error: "Invalid date of birth format",
          });
        }
      }

      // Handle contract.dateOfSigning if present
      if (updateData.contract?.dateOfSigning) {
        try {
          const dateOfSigning = new Date(updateData.contract.dateOfSigning);
          if (isNaN(dateOfSigning.getTime())) {
            throw new Error("Invalid date of signing");
          }
          updateData.contract.dateOfSigning = dateOfSigning;
        } catch (error) {
          return res.status(400).json({
            message: "Failed to update patient",
            error: "Invalid date of signing format",
          });
        }
      }

      // Update timestamp
      updateData.updatedAt = new Date();

      // Parse JSON strings in FormData
      Object.keys(updateData).forEach(key => {
        if (typeof updateData[key] === 'string' && updateData[key].startsWith('{')) {
          try {
            updateData[key] = JSON.parse(updateData[key]);
          } catch (e) {
            // If it's not valid JSON, keep the original string
          }
        }
      });

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