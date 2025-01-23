
import express, { Request, Response } from "express";
import { db } from "@db";
import { patients } from "@db/schema";
import { eq, sql } from "drizzle-orm";

const router = express.Router();

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
