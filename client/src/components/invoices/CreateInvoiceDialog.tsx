"use client"

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Patient, type InsertInvoice } from "@db/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInvoiceDialog({
  open,
  onOpenChange,
}: CreateInvoiceDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [services, setServices] = useState<Array<{ description: string; amount: number }>>([]);

  type FormData = Omit<InsertInvoice, 'startDate' | 'endDate' | 'dueDate'> & {
    startDate: string;
    endDate: string;
    dueDate: string;
    purpose: string;
  };

  const form = useForm<FormData>({
    defaultValues: {
      recipientType: "insurance",
      status: "draft",
      purpose: "",
      totalAmount: "0",
      startDate: "",
      endDate: "",
      dueDate: "",
    },
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const totalAmount = services.reduce((sum, service) => sum + (service.amount || 0), 0);
      const selbstbehaltAmount = totalAmount * 0.1; // 10% of total amount

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          totalAmount: totalAmount.toString(),
          selbstbehaltAmount: selbstbehaltAmount.toString(),
          startDate: new Date(data.startDate).toISOString(),
          endDate: new Date(data.endDate).toISOString(),
          dueDate: new Date(data.dueDate).toISOString(),
          metadata: {
            purpose: data.purpose,
            services: services,
          },
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const addService = () => {
    setServices([...services, { description: "", amount: 0 }]);
  };

  const removeService = (index: number) => {
    const newServices = [...services];
    newServices.splice(index, 1);
    setServices(newServices);
  };

  const updateService = (index: number, field: "description" | "amount", value: string | number) => {
    const newServices = [...services];
    newServices[index][field] = value as never;
    setServices(newServices);

    // Calculate total amount
    const totalAmount = newServices.reduce((sum, service) => sum + (service.amount || 0), 0);
    form.setValue("totalAmount", totalAmount.toString());
  };

  const onSubmit = (data: FormData) => {
    createInvoiceMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a patient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients?.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id.toString()}>
                          {patient.firstName} {patient.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recipientType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="patient">Patient</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose of Invoice</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the purpose of this invoice (e.g., monthly services, special treatments)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel>Services</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={addService}>
                  Add Service
                </Button>
              </div>

              {services.map((service, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-1">
                    <FormLabel>Description</FormLabel>
                    <Input
                      value={service.description}
                      onChange={(e) => updateService(index, "description", e.target.value)}
                      placeholder="Service description"
                    />
                  </div>
                  <div className="w-32">
                    <FormLabel>Amount (CHF)</FormLabel>
                    <Input
                      type="number"
                      value={service.amount}
                      onChange={(e) => updateService(index, "amount", parseFloat(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="mt-6"
                    onClick={() => removeService(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
                Cancel
              </Button>
              <Button type="submit">Create Invoice</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}