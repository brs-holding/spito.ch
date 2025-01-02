import { Request, Response } from "express";
import { db } from "@db";
import { eq } from "drizzle-orm";
import { 
  invoices, 
  invoiceItems, 
  serviceLogs, 
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  type InsertInvoice,
  type InsertInvoiceItem 
} from "@db/schema";

export async function createInvoice(req: Request, res: Response) {
  try {
    const result = insertInvoiceSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        message: "Invalid input", 
        errors: result.error.errors 
      });
    }

    const { startDate, endDate, patientId, ...rest } = result.data;

    // Generate unique invoice number (INVOICE-YYYYMMDD-XXXXX)
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
    const invoiceNumber = `INVOICE-${dateStr}-${random}`;

    // Create invoice
    const [invoice] = await db.insert(invoices)
      .values({
        ...rest,
        invoiceNumber,
        patientId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      })
      .returning();

    return res.status(201).json(invoice);
  } catch (error: any) {
    console.error("Failed to create invoice:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function listInvoices(req: Request, res: Response) {
  try {
    const { patientId, status } = req.query;
    let query = db.select().from(invoices);
    
    if (patientId) {
      query = query.where(eq(invoices.patientId, Number(patientId)));
    }
    
    if (status) {
      query = query.where(eq(invoices.status, String(status)));
    }

    const results = await query;
    return res.json(results);
  } catch (error: any) {
    console.error("Failed to list invoices:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getInvoiceDetails(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [invoice] = await db.select()
      .from(invoices)
      .where(eq(invoices.id, Number(id)))
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

    if (!["draft", "pending", "paid", "overdue", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const [invoice] = await db.update(invoices)
      .set({ status, updatedAt: new Date() })
      .where(eq(invoices.id, Number(id)))
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
    const result = insertInvoiceItemSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: "Invalid input", 
        errors: result.error.errors 
      });
    }

    const [invoice] = await db.select()
      .from(invoices)
      .where(eq(invoices.id, Number(id)))
      .limit(1);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const [item] = await db.insert(invoiceItems)
      .values({ ...result.data, invoiceId: invoice.id })
      .returning();

    return res.status(201).json(item);
  } catch (error: any) {
    console.error("Failed to add invoice item:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
