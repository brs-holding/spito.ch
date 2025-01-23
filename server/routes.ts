
import express, { type Express } from "express";
import { type Server } from "http";
import { invoicesRouter } from "./routes/invoices";
import { patientsRouter } from "./routes/patients";
import { billingsRouter } from "./routes/billings";
import { notificationsRouter } from "./routes/notifications";
import { tasksRouter } from "./routes/tasks";
import { organizationRouter } from "./routes/organization";
import { createServer } from "http";
import { setupAuth } from "./auth";

export function registerRoutes(app: Express): Server {
  // Setup authentication
  setupAuth(app);
  
  // API Routes
  app.use("/api/invoices", invoicesRouter);
  app.use("/api/patients", patientsRouter);
  app.use("/api/billings", billingsRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/tasks", tasksRouter);
  app.use("/api/organization", organizationRouter);
  
  // Handle 404 for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({ message: "Not found" });
  });

  return createServer(app);
}
