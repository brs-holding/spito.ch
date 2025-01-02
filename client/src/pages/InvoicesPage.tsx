import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Invoice } from "@db/schema";
import InvoiceList from "@/components/invoices/InvoiceList";
import CreateInvoiceDialog from "@/components/invoices/CreateInvoiceDialog";
import { useState } from "react";

export default function InvoicesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invoices</CardTitle>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </CardHeader>
        <CardContent>
          <InvoiceList invoices={invoices || []} isLoading={isLoading} />
        </CardContent>
      </Card>

      <CreateInvoiceDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  );
}
