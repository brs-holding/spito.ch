import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/billings/columns";
import { BillingForm } from "@/components/billings/BillingForm";
import { format } from "date-fns";
import type { Billing } from "@db/schema";

interface BillingResponse extends Billing {
  patientName: string;
  employeeName: string;
}

export default function BillingsPage() {
  const { data: billings, isLoading } = useQuery<BillingResponse[]>({
    queryKey: ["/api/billings"],
  });

  const formattedBillings = billings?.map(billing => ({
    ...billing,
    formattedAmount: new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(Number(billing.amount)),
    formattedTime: format(new Date(billing.time), 'dd.MM.yyyy HH:mm'),
  })) ?? [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Billings</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all billing records
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Billing
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Billing</DialogTitle>
            </DialogHeader>
            <BillingForm />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Billings</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={formattedBillings}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}