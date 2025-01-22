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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { insertBillingSchema, type InsertBilling } from "@db/schema";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";

export function BillingForm() {
  const { toast } = useToast();
  const { user } = useUser();

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
        title: "Erfolg",
        description: "Abrechnung erfolgreich erstellt",
      });

      // Reset form
      form.reset();

      // Refresh billing data
      await queryClient.invalidateQueries({ queryKey: ["/api/billings"] });

      // Close dialog if needed
      const dialogClose = document.querySelector('[data-dialog-close]');
      if (dialogClose instanceof HTMLElement) {
        dialogClose.click();
      }
    } catch (error) {
      toast({
        title: "Fehler",
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
                    <SelectValue placeholder="Patient auswählen" />
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Betrag (CHF)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zeit</FormLabel>
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
              <FormLabel>Notizen</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Abrechnung erstellen
        </Button>
      </form>
    </Form>
  );
}