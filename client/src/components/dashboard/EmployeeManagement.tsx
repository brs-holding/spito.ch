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
import { Separator } from "@/components/ui/separator";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";

// Match schema with backend expectations
const employeeSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  city: z.string().min(1, "City is required"),
  hourlyRate: z.number().min(0, "Hourly rate must be positive").nullish(),
  monthlyFixedCosts: z.object({
    healthInsurance: z.number().min(0).nullish(),
    socialSecurity: z.number().min(0).nullish(),
    pensionFund: z.number().min(0).nullish(),
    accidentInsurance: z.number().min(0).nullish(),
    familyAllowances: z.number().min(0).nullish(),
    otherExpenses: z.number().min(0).nullish(),
  }).optional(),
  startDate: z.string(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export function EmployeeManagement() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      monthlyFixedCosts: {
        healthInsurance: null,
        socialSecurity: null,
        pensionFund: null,
        accidentInsurance: null,
        familyAllowances: null,
        otherExpenses: null,
      },
      hourlyRate: null,
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
      // Clean up the data before sending
      const cleanData = {
        ...data,
        hourlyRate: data.hourlyRate ?? 0,
        monthlyFixedCosts: Object.fromEntries(
          Object.entries(data.monthlyFixedCosts || {}).map(([key, value]) => [key, value ?? 0])
        ),
        role: "spitex_employee", // Set role automatically
      };

      console.log('Submitting data:', cleanData); // Debug log

      const response = await fetch("/api/organization/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData),
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
        title: "Success",
        description: "Employee added successfully",
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
      console.error('Form submission error:', error); // Debug log
    },
  });

  const onSubmit = (data: EmployeeFormData) => {
    console.log('Form data:', data); // Debug log
    addEmployeeMutation.mutate(data);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const maxUsers = organization?.maxCaregivers || 3; // Default to 3 if not set

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h2 className="text-2xl font-bold">Employee Management</h2>

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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add New Employee</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Account Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Information</h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
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
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Employment Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Employment Details</h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hourly Rate (CHF)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value ? parseFloat(e.target.value) : null;
                              field.onChange(value);
                            }}
                            value={field.value ?? ''}
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
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Monthly Fixed Costs Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Monthly Fixed Costs</h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    ["healthInsurance", "Health Insurance"],
                    ["socialSecurity", "Social Security"],
                    ["pensionFund", "Pension Fund"],
                    ["accidentInsurance", "Accident Insurance"],
                    ["familyAllowances", "Family Allowances"],
                    ["otherExpenses", "Other Expenses"],
                  ].map(([key, label]) => (
                    <FormField
                      key={key}
                      control={form.control}
                      name={`monthlyFixedCosts.${key}` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{label} (CHF)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value ? parseFloat(e.target.value) : null;
                                field.onChange(value);
                              }}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={addEmployeeMutation.isPending}
                >
                  {addEmployeeMutation.isPending ? "Adding..." : "Add Employee"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Hours Worked</TableHead>
            <TableHead>Clients Managed</TableHead>
            <TableHead>Earnings Generated (CHF)</TableHead>
            <TableHead>Costs (CHF)</TableHead>
            <TableHead>Profit (CHF)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees?.map((employee: any) => (
            <TableRow key={employee.id}>
              <TableCell>{employee.fullName}</TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>{new Date(employee.startDate).toLocaleDateString()}</TableCell>
              <TableCell>{employee.performance?.hoursWorked.toFixed(1) || '0.0'}</TableCell>
              <TableCell>{employee.performance?.clientsManaged || 0}</TableCell>
              <TableCell>{employee.performance?.earningsGenerated.toFixed(2) || '0.00'}</TableCell>
              <TableCell>{employee.performance?.costs.toFixed(2) || '0.00'}</TableCell>
              <TableCell>{employee.performance?.profit.toFixed(2) || '0.00'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}