import { Request, Response } from "express";
import { db } from "@db";
import { eq } from "drizzle-orm";
import { 
  invoices, 
  invoiceItems,
  serviceLogs,
  type InsertInvoice
} from "@db/schema";

export async function createInvoice(req: Request, res: Response) {
  try {
    console.log("Creating invoice with data:", req.body);
    
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const {
      patientId,
      recipientType,
      totalAmount,
      selbstbehaltAmount,
      startDate,
      endDate,
      dueDate,
      metadata,
      purpose
    } = req.body;

    // Validate required fields
    if (!patientId || !totalAmount || !startDate || !endDate || !dueDate) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["patientId", "totalAmount", "startDate", "endDate", "dueDate"]
      });
    }

    // Verify patient exists and belongs to organization
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, Number(patientId)))
      .limit(1);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (patient.organizationId !== req.user.organizationId) {
      return res.status(403).json({ message: "Not authorized to create invoice for this patient" });
    }

    // Generate unique invoice number
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
    const invoiceNumber = `INVOICE-${dateStr}-${random}`;

    // Prepare invoice data
    const invoiceData = {
      invoiceNumber,
      patientId: Number(patientId),
      recipientType: recipientType || "insurance",
      totalAmount: totalAmount.toString(),
      selbstbehaltAmount: selbstbehaltAmount?.toString(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      dueDate: new Date(dueDate),
      status: "draft",
      metadata: {
        ...metadata,
        purpose
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log("Prepared invoice data:", invoiceData);

    // Create invoice
    const [invoice] = await db.insert(invoices)
      .values(invoiceData)
      .returning();

    console.log("Created invoice:", invoice);
    return res.status(201).json(invoice);
  } catch (error: any) {
    console.error("Failed to create invoice:", error);
    return res.status(500).json({ 
      message: "Failed to create invoice", 
      error: error.message 
    });
  }
}

export async function listInvoices(req: Request, res: Response) {
  try {
    const { patientId, status } = req.query;
    let query = db.select().from(invoices);

    if (patientId) {
      const parsedPatientId = Number(patientId);
      if (!isNaN(parsedPatientId)) {
        query = query.where(eq(invoices.patientId, parsedPatientId));
      }
    }

    if (status) {
      query = query.where(eq(invoices.status, String(status)));
    }

    const results = await query;
    return res.json(results);
  } catch (error: any) {
    console.error("Failed to list invoices:", error);
    return res.status(500).json({ 
      message: "Failed to fetch invoices", 
      error: error.message 
    });
  }
}

export async function getInvoiceDetails(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const invoiceId = Number(id);

    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }

    const [invoice] = await db.select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const items = await db.select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoice.id));

    return res.json({ ...invoice, items });
  } catch (error: any) {
    console.error("Failed to get invoice details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateInvoiceStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const invoiceId = Number(id);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }

    if (!["draft", "pending", "paid", "overdue", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const [invoice] = await db.update(invoices)
      .set({ status, updatedAt: new Date() })
      .where(eq(invoices.id, invoiceId))
      .returning();

    return res.json(invoice);
  } catch (error: any) {
    console.error("Failed to update invoice status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function addInvoiceItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const invoiceId = Number(id);

    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }

    const result = insertInvoiceItemSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ 
        message: "Invalid input", 
        errors: result.error.errors 
      });
    }

    const [invoice] = await db.select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const [item] = await db.insert(invoiceItems)
      .values({ ...result.data, invoiceId })
      .returning();

    return res.status(201).json(item);
  } catch (error: any) {
    console.error("Failed to add invoice item:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}