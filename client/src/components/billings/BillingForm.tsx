import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { insertBillingSchema, type InsertBilling } from "@db/schema";
import { queryClient } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ServiceTime {
  hours: number;
  minutes: number;
  category: keyof typeof SERVICE_CATEGORIES | "";
}

export function BillingForm() {
  const { toast } = useToast();
  const { user } = useUser();
  const [serviceTime, setServiceTime] = useState<ServiceTime>({
    hours: 0,
    minutes: 0,
    category: "",
  });

  const calculateAmount = () => {
    if (!serviceTime.category) return 0;

    const hourlyRate = SERVICE_CATEGORIES[serviceTime.category].hourlyRate;
    const totalHours = serviceTime.hours + (serviceTime.minutes / 60);
    return hourlyRate * totalHours;
  };

  const form = useForm<InsertBilling>({
    resolver: zodResolver(insertBillingSchema),
    defaultValues: {
      amount: 0,
      time: new Date().toISOString().slice(0, 16),
      notes: "",
      employeeId: user?.id,
    },
  });

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  useEffect(() => {
    const amount = calculateAmount();
    form.setValue("amount", amount);
  }, [serviceTime]);

  async function onSubmit(data: InsertBilling) {
    try {
      const response = await fetch("/api/billings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          employeeId: user?.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create billing');
      }

      toast({
        title: "Success",
        description: "Billing record created successfully",
      });

      form.reset();
      setServiceTime({ hours: 0, minutes: 0, category: "" });

      await queryClient.invalidateQueries({ queryKey: ["/api/billings"] });

      const dialogClose = document.querySelector('[data-dialog-close]');
      if (dialogClose instanceof HTMLElement) {
        dialogClose.click();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create billing",
        variant: "destructive",
      });
    }
  }

  return (
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
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
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

        <FormItem>
          <FormLabel>Service Category</FormLabel>
          <Select
            value={serviceTime.category}
            onValueChange={(value: keyof typeof SERVICE_CATEGORIES) => 
              setServiceTime(prev => ({ ...prev, category: value }))
            }
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select service category" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {Object.entries(SERVICE_CATEGORIES).map(([key, category]) => (
                <SelectItem key={key} value={key}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {serviceTime.category && (
            <FormDescription>
              {SERVICE_CATEGORIES[serviceTime.category].description}
              <br />
              Hourly rate: CHF {SERVICE_CATEGORIES[serviceTime.category].hourlyRate.toFixed(2)}
            </FormDescription>
          )}
        </FormItem>

        <div className="grid grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Hours</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                value={serviceTime.hours}
                onChange={(e) => 
                  setServiceTime(prev => ({
                    ...prev,
                    hours: parseInt(e.target.value) || 0
                  }))
                }
              />
            </FormControl>
          </FormItem>

          <FormItem>
            <FormLabel>Minutes</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                max="59"
                value={serviceTime.minutes}
                onChange={(e) => 
                  setServiceTime(prev => ({
                    ...prev,
                    minutes: parseInt(e.target.value) || 0
                  }))
                }
              />
            </FormControl>
          </FormItem>
        </div>

        {serviceTime.category && (
          <Card className="bg-muted">
            <CardContent className="pt-4">
              <p className="text-sm mb-2">Calculation Breakdown:</p>
              <div className="space-y-1 text-sm">
                <p>Service: {SERVICE_CATEGORIES[serviceTime.category].name}</p>
                <p>Time: {serviceTime.hours}h {serviceTime.minutes}min</p>
                <p>Rate: CHF {SERVICE_CATEGORIES[serviceTime.category].hourlyRate}/hour</p>
                <p className="font-bold pt-2">
                  Total Amount: CHF {calculateAmount().toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date and Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Create Billing
        </Button>
      </form>
    </Form>
  );
}