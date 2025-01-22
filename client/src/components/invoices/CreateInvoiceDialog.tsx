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

const SERVICE_CATEGORIES = {
  category_a: {
    name: "Category A: Needs Assessment, Advice, and Coordination",
    description: "Services involving the evaluation of patient needs, providing professional advice, and coordinating care with other healthcare providers.",
    hourlyRate: 76.90
  },
  category_b: {
    name: "Category B: Examination and Treatment",
    description: "Medical services such as administering medications, wound care, and other treatments prescribed by a physician.",
    hourlyRate: 63.00
  },
  category_c: {
    name: "Category C: Basic Care",
    description: "Assistance with daily living activities, including personal hygiene, mobility support, and help with eating or dressing.",
    hourlyRate: 52.60
  }
} as const;

interface ServiceEntry {
  category: keyof typeof SERVICE_CATEGORIES;
  hours: number;
  minutes: number;
  amount: number;
}

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
  const [services, setServices] = useState<ServiceEntry[]>([]);

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
      const totalAmount = services.reduce((sum, service) => sum + service.amount, 0);
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
            services: services.map(service => ({
              category: service.category,
              name: SERVICE_CATEGORIES[service.category].name,
              hours: service.hours,
              minutes: service.minutes,
              hourlyRate: SERVICE_CATEGORIES[service.category].hourlyRate,
              amount: service.amount
            })),
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
      // Invalidate the invoices query to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      onOpenChange(false);
      // Reset form and services
      form.reset();
      setServices([]);
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
    setServices([...services, {
      category: "category_a",
      hours: 0,
      minutes: 0,
      amount: 0
    }]);
  };

  const removeService = (index: number) => {
    const newServices = [...services];
    newServices.splice(index, 1);
    setServices(newServices);
  };

  const calculateAmount = (hours: number, minutes: number, hourlyRate: number) => {
    const totalHours = hours + (minutes / 60);
    return Number((totalHours * hourlyRate).toFixed(2));
  };

  const updateService = (index: number, updates: Partial<ServiceEntry>) => {
    const newServices = [...services];
    const currentService = newServices[index];
    const updatedService = { ...currentService, ...updates };

    // Recalculate amount when either time or category changes
    const hourlyRate = SERVICE_CATEGORIES[updatedService.category].hourlyRate;
    updatedService.amount = calculateAmount(updatedService.hours, updatedService.minutes, hourlyRate);

    newServices[index] = updatedService;
    setServices(newServices);

    // Update total amount in form
    const totalAmount = newServices.reduce((sum, service) => sum + service.amount, 0);
    form.setValue("totalAmount", totalAmount.toString());
  };

  const onSubmit = (data: FormData) => {
    createInvoiceMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Rechnung erstellen</DialogTitle>
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
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <FormLabel>Category</FormLabel>
                      <Select
                        value={service.category}
                        onValueChange={(value: keyof typeof SERVICE_CATEGORIES) =>
                          updateService(index, { category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SERVICE_CATEGORIES).map(([key, category]) => (
                            <SelectItem key={key} value={key}>
                              <div>
                                <div>{category.name}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Rate: CHF {category.hourlyRate.toFixed(2)}/hour
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {SERVICE_CATEGORIES[service.category].description}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-24">
                      <FormLabel>Hours</FormLabel>
                      <Input
                        type="number"
                        min="0"
                        value={service.hours}
                        onChange={(e) =>
                          updateService(index, { hours: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="w-24">
                      <FormLabel>Minutes</FormLabel>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={service.minutes}
                        onChange={(e) =>
                          updateService(index, { minutes: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="w-32">
                      <FormLabel>Amount (CHF)</FormLabel>
                      <p className="mt-2 font-medium">{service.amount.toFixed(2)}</p>
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