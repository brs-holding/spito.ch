import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/invoices/columns";
import { format } from "date-fns";

export default function PatientInvoicesPage() {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const formattedInvoices = invoices?.map(invoice => ({
    ...invoice,
    formattedDate: format(new Date(invoice.createdAt), 'dd.MM.yyyy'),
    formattedDueDate: format(new Date(invoice.dueDate), 'dd.MM.yyyy'),
    formattedAmount: new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(Number(invoice.totalAmount))
  }));

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Invoices</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage your invoices
          </p>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={formattedInvoices || []} 
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
