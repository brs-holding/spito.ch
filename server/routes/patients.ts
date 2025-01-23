
import express, { Request, Response } from "express";
import { db } from "@db";
import { patients } from "@db/schema";

const router = express.Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const results = await db.select().from(patients);
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
