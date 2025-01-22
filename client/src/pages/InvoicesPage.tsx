import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/invoices/columns";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { format } from "date-fns";

interface Invoice {
  id: number;
  invoiceNumber: string;
  status: "draft" | "pending" | "paid" | "overdue" | "cancelled";
  totalAmount: string;
  createdAt: string;
  dueDate: string;
  recipientType: "insurance" | "patient";
  metadata: {
    purpose: string;
    services: Array<{
      category: string;
      name: string;
      hours: number;
      minutes: number;
      hourlyRate: number;
      amount: number;
    }>;
  };
}

export default function InvoicesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const formattedInvoices = invoices?.map(invoice => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    formattedDate: format(new Date(invoice.createdAt), 'dd.MM.yyyy'),
    formattedDueDate: format(new Date(invoice.dueDate), 'dd.MM.yyyy'),
    formattedAmount: new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(Number(invoice.totalAmount))
  })) ?? [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invoices</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and create invoices for patients and insurance companies
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={formattedInvoices} 
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <CreateInvoiceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}