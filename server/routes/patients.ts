import express, { Request, Response } from "express";
import { db } from "@db";
import { patients } from "@db/schema";
import { eq, sql } from "drizzle-orm";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Log the incoming request body for debugging
    console.log("Patient registration request body:", req.body);

    const newPatient = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      dateOfBirth: new Date(req.body.dateOfBirth),
      gender: req.body.gender,
      email: req.body.email,
      phone: req.body.phone,
      address: JSON.stringify(req.body.address),
      emergencyContact: JSON.stringify(req.body.emergencyContact),
      currentDiagnoses: JSON.stringify(req.body.currentDiagnoses || []),
      allergies: JSON.stringify(req.body.allergies || []),
      primaryPhysicianContact: JSON.stringify(req.body.primaryPhysicianContact),
      preferences: JSON.stringify({
        specialNeeds: req.body.preferences,
        familyAccess: req.body.familyAccess || [],
      }),
      healthInsuranceCompany: req.body.healthInsuranceCompany || null,
      healthInsuranceAddress: req.body.healthInsuranceAddress || null,
      healthInsuranceZip: req.body.healthInsuranceZip || null,
      healthInsurancePlace: req.body.healthInsurancePlace || null,
      healthInsuranceNumber: req.body.healthInsuranceNumber || null,
      ahvNumber: req.body.ahvNumber || null,
      medicalHistory: req.body.medicalHistory || null,
      organizationId: req.user.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("Formatted patient data:", newPatient);

    const [result] = await db.insert(patients).values(newPatient).returning();
    console.log("Database insert result:", result);

    return res.status(201).json(result);
  } catch (error: any) {
    console.error("Failed to create patient:", error);
    console.error("Error stack trace:", error.stack);
    return res.status(500).json({ 
      message: "Failed to create patient", 
      error: error.message,
      details: error.stack
    });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const baseFields = {
      id: patients.id,
      firstName: patients.firstName,
      lastName: patients.lastName,
      dateOfBirth: patients.dateOfBirth,
      gender: patients.gender,
      email: patients.email,
      phone: patients.phone,
      address: patients.address,
      emergencyContact: patients.emergencyContact,
      createdAt: patients.createdAt,
      organizationId: patients.organizationId,
    };

    let query = db.select(baseFields).from(patients);

    // Filter based on user role and organization
    switch (req.user.role) {
      case "spitex_org":
        // Organization admins see their org's patients
        query = query.where(eq(patients.organizationId, req.user.organizationId));
        break;
      case "spitex_employee":
        // Employees see only their org's patients
        query = query.where(eq(patients.organizationId, req.user.organizationId));
        break;
      case "patient":
        // Patients see only their own record
        query = query.where(eq(patients.userId, req.user.id));
        break;
      case "family_member":
        // Family members see only linked patients
        query = query.where(sql`${patients.familyAccess}->>'${req.user.id}' IS NOT NULL`);
        break;
      case "super_admin":
        // Super admins see all patients
        break;
      default:
        return res.status(403).json({ message: "Insufficient permissions" });
    }

    const results = await query;
    return res.json(results);
  } catch (error: any) {
    console.error("Failed to list patients:", error);
    return res.status(500).json({ 
      message: "Failed to fetch patients", 
      error: error.message 
    });
  }
});

export const patientsRouter = router;