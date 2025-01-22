import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SubUserOverview from "./SubUserOverview";
import EmployeeDetailsDialog from "./EmployeeDetailsDialog";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { t } from "@/lib/i18n";

const employeeSchema = z.object({
  username: z.string().min(1, t("common.required")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Valid email is required"),
  fullName: z.string().min(1, t("common.required")),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export function EmployeeManagement() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      fullName: "",
    },
  });

  const { data: organization } = useQuery({
    queryKey: ["/api/organization"],
  });

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["/api/organization/employees"],
  });

  const addEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const response = await fetch("/api/organization/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          role: "spitex_employee",
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: "Mitarbeiter erfolgreich hinzugefügt",
      });
      setDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/organization/employees"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: EmployeeFormData) => {
    addEmployeeMutation.mutate(data);
  };

  if (isLoading) {
    return <div>{t("common.loading")}</div>;
  }

  const maxUsers = organization?.maxCaregivers || 3;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h2 className="text-2xl font-bold">{t('employees.overview')}</h2>

      <SubUserOverview
        totalUsers={employees.length}
        maxUsers={maxUsers}
        onAddEmployee={() => {
          const dialogTrigger = document.querySelector('[data-dialog-trigger="add-employee"]');
          if (dialogTrigger instanceof HTMLElement) {
            dialogTrigger.click();
          }
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <span data-dialog-trigger="add-employee" className="hidden" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('employees.addEmployee')}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.username')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.password')}</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={addEmployeeMutation.isPending}
                >
                  {addEmployeeMutation.isPending ? t("common.loading") : t("employees.addEmployee")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('auth.username')}</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees?.map((employee: any) => (
            <TableRow 
              key={employee.id}
              className="cursor-pointer hover:bg-accent/50"
              onClick={() => setSelectedEmployee(employee)}
            >
              <TableCell>{employee.username}</TableCell>
              <TableCell>{employee.fullName}</TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>{employee.isActive ? "Aktiv" : "Inaktiv"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EmployeeDetailsDialog 
        employee={selectedEmployee}
        open={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />
    </div>
  );
}