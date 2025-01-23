
import express, { Request, Response } from "express";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

const router = express.Router();

router.get("/employees", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const employees = await db.select().from(users).where(eq(users.organizationId, req.user.organizationId));
    return res.json(employees);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

export const organizationRouter = router;
