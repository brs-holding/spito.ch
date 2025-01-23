
import express, { Request, Response } from "express";
import { db } from "@db";
import { billings, patients, users } from "@db/schema";
import { eq } from "drizzle-orm";
import { insertBillingSchema } from "@db/schema";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let query = db.select({
      id: billings.id,
      amount: billings.amount,
      time: billings.time,
      notes: billings.notes,
      patientId: billings.patientId,
      employeeId: billings.employeeId,
      patientName: db.sql<string>`CONCAT(${patients.firstName}, ' ', ${patients.lastName})`,
      employeeName: users.username,
    })
    .from(billings)
    .leftJoin(patients, eq(billings.patientId, patients.id))
    .leftJoin(users, eq(billings.employeeId, users.id));

    if (req.user.role === 'spitex_employee') {
      query = query.where(eq(billings.employeeId, req.user.id));
    } else if (req.user.role === 'patient') {
      query = query.where(eq(billings.patientId, req.user.id));
    }

    const results = await query;
    return res.json(results);
  } catch (error: any) {
    console.error("Failed to fetch billings:", error);
    return res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validatedData = insertBillingSchema.parse(req.body);
    
    const [billing] = await db.insert(billings).values({
      ...validatedData,
      employeeId: req.user.id
    }).returning();

    return res.status(201).json(billing);
  } catch (error: any) {
    console.error("Failed to create billing:", error);
    return res.status(500).json({ message: error.message });
  }
});

export const billingsRouter = router;
