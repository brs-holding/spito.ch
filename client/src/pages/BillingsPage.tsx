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
import type { Billing } from "@db/schema";

export default function BillingsPage() {
  const { data: billings, isLoading } = useQuery<Billing[]>({
    queryKey: ["/api/billings"],
  });

  const formattedBillings = billings?.map(billing => ({
    ...billing,
    formattedAmount: new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(Number(billing.amount)),
    formattedTime: new Date(billing.time).toLocaleString('de-CH', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }),
  })) ?? [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Billings</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Billing
            </Button>
          </DialogTrigger>
          <DialogContent>
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
