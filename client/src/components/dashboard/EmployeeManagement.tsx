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

const employeeSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  hourlyRate: z.number().min(0, "Hourly rate must be positive"),
  monthlyFixedCosts: z.object({
    healthInsurance: z.number().min(0).optional(),
    socialSecurity: z.number().min(0).optional(),
    pensionFund: z.number().min(0).optional(),
    accidentInsurance: z.number().min(0).optional(),
    familyAllowances: z.number().min(0).optional(),
    otherExpenses: z.number().min(0).optional(),
  }),
  startDate: z.string(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export function EmployeeManagement() {
  const { toast } = useToast();
  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      monthlyFixedCosts: {},
    },
  });

  const { data: employees, isLoading } = useQuery({
    queryKey: ["/api/organization/employees"],
  });

  const addEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const response = await fetch("/api/organization/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee added successfully",
      });
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
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employee Management</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Employee</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate (CHF)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-4">
                  <h4 className="font-medium">Monthly Fixed Costs</h4>
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
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
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
                <Button type="submit">Add Employee</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Hours Worked</TableHead>
            <TableHead>Clients Managed</TableHead>
            <TableHead>Earnings Generated (CHF)</TableHead>
            <TableHead>Costs (CHF)</TableHead>
            <TableHead>Profit (CHF)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees?.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>{employee.fullName}</TableCell>
              <TableCell>{employee.performance.hoursWorked.toFixed(1)}</TableCell>
              <TableCell>{employee.performance.clientsManaged}</TableCell>
              <TableCell>
                {employee.performance.earningsGenerated.toFixed(2)}
              </TableCell>
              <TableCell>{employee.performance.costs.toFixed(2)}</TableCell>
              <TableCell>{employee.performance.profit.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
