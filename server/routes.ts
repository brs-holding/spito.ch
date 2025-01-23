
import express, { type Express } from "express";
import { type Server } from "http";
import { invoicesRouter } from "./routes/invoices";

export function registerRoutes(app: Express): Server {
  // API Routes
  app.use("/api/invoices", invoicesRouter);
  
  // Handle 404 for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({ message: "Not found" });
  });

  return require("http").createServer(app);
}
