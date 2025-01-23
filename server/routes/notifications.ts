
import express, { Request, Response } from "express";
import { db } from "@db";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // For now, return empty array until notifications table is implemented
    return res.json([]);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

export const notificationsRouter = router;
