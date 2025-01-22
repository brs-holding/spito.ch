import express, { type Express, type Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { setupAuth } from "./auth";
import { db } from "@db";
import fs from "fs";
import {
  users,
  patients,
  journalEntries,
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
  calendarEvents,
  calendarEventAttendees,
  insertCalendarEventSchema,
  insertUserSchema,
} from "@db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    organizationId?: number;
    role: string;
    fullName: string;
  };
  isAuthenticated(): boolean;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const fileExt = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${fileExt}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export function registerRoutes(app: Express): Server {
  // Set up authentication first
  setupAuth(app);

  // Middleware for parsing JSON and URL-encoded bodies
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Basic health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Get current user endpoint
  app.get("/api/user", (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    res.json(req.user);
  });

  const httpServer = createServer(app);
  return httpServer;
}