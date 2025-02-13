import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task, TaskAssignment } from "@db/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, PlayCircle, Plus, AlertTriangle, Users } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Combobox } from "@/components/ui/combobox";
import { t } from "@/lib/i18n";

interface TaskBoardProps {
  userId?: number;
  patientId?: number;
  minimal?: boolean;
}

type TaskStatus = "pending" | "in_progress" | "completed";
type TaskPriority = "high" | "medium" | "low";

type TaskWithAssignments = Task & {
  assignments?: TaskAssignment[];
  status: TaskStatus;
  priority: TaskPriority;
};

export default function TaskBoard({ userId, patientId, minimal = false }: TaskBoardProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch tasks based on context (all tasks, patient-specific, or user-specific)
  const queryKey = patientId
    ? `/api/patients/${patientId}/tasks`
    : `/api/tasks`;

  const { data: tasks, isLoading } = useQuery<TaskWithAssignments[]>({
    queryKey: [queryKey],
  });

  // Fetch available employees for task assignment
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/organization/employees'],
    enabled: user?.role === 'spitex_org' || user?.role === 'super_admin',
  });

  // Fetch available patients if no specific patient is provided
  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients'],
    enabled: !patientId && (user?.role === 'spitex_org' || user?.role === 'super_admin'),
  });

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      assignedToIds: userId ? [userId] : [],
      patientId: patientId || "",
      dueDate: "",
      priority: "medium" as const,
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/tasks", {
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
        title: "Task created",
        description: "The task has been created successfully.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
  });

  const getStatusIcon = (status: string, priority: string) => {
    switch (status) {
      case "pending":
        return priority === "high" ? (
          <AlertTriangle className="h-4 w-4 text-red-500" />
        ) : (
          <Clock className="h-4 w-4 text-yellow-500" />
        );
      case "in_progress":
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "";
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "outline";
      case "in_progress":
        return "default";
      default:
        return "secondary";
    }
  };

  const filteredTasks = tasks?.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  }) ?? [];

  const onSubmit = async (data: any) => {
    try {
      await createTaskMutation.mutateAsync(data);
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await updateTaskStatusMutation.mutateAsync({ taskId, status: newStatus });
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  const canCreateTasks = user?.role === "spitex_org" || user?.role === "super_admin";
  const showAddButton = canCreateTasks && !minimal;

  return (
    <Card className={minimal ? "border-0 shadow-none" : undefined}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{t('tasks.title')}</CardTitle>
          <div className="flex items-center gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder={t('tasks.filterBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('tasks.allTasks')}</SelectItem>
                <SelectItem value="pending">{t('tasks.pending')}</SelectItem>
                <SelectItem value="in_progress">{t('tasks.inProgress')}</SelectItem>
                <SelectItem value="completed">{t('tasks.completed')}</SelectItem>
              </SelectContent>
            </Select>
            {showAddButton && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    {t('tasks.addTask')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('tasks.createTask')}</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('tasks.taskTitle')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('tasks.taskTitle')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('tasks.taskDescription')}</FormLabel>
                            <FormControl>
                              <Textarea placeholder={t('tasks.taskDescription')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {!patientId && (
                        <FormField
                          control={form.control}
                          name="patientId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('patients.title')}</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value ? String(field.value) : undefined}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t('patients.select')} />
                                </SelectTrigger>
                                <SelectContent>
                                  {patients?.map((patient: any) => (
                                    <SelectItem key={patient.id} value={String(patient.id)}>
                                      {patient.firstName} {patient.lastName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <FormField
                        control={form.control}
                        name="assignedToIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('tasks.assignedTo')}</FormLabel>
                            <Combobox
                              items={employees?.map((emp: any) => ({
                                label: emp.fullName,
                                value: String(emp.id)
                              })) ?? []}
                              values={field.value.map(String)}
                              onChange={(values) => field.onChange(values.map(Number))}
                              placeholder={t('employees.select')}
                              multiple
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('tasks.priority.title')}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('tasks.selectPriority')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="high">{t('tasks.priority.high')}</SelectItem>
                                <SelectItem value="medium">{t('tasks.priority.medium')}</SelectItem>
                                <SelectItem value="low">{t('tasks.priority.low')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('tasks.dueDateLabel')}</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full">
                        {t('tasks.createTask')}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">{t('common.loading')}</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {t('tasks.noTasks')} {filter !== "all" ? `(${filter})` : ""}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                {getStatusIcon(task.status, task.priority)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm truncate">
                      {task.title}
                    </h4>
                    <Badge
                      variant={getBadgeVariant(task.status)}
                      className="capitalize"
                    >
                      {t(`tasks.${task.status || "pending"}`)}
                    </Badge>
                    <Badge className={getPriorityColor(task.priority || "medium")}>
                      {t(`tasks.priority.${task.priority || "medium"}`)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {task.description}
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    <p className="text-xs text-muted-foreground">
                      {t('tasks.dueDate')}: {new Date(task.dueDate).toLocaleDateString('de-DE')}
                    </p>
                    {task.assignments?.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {task.assignments.length} {t('tasks.assigned')}
                      </div>
                    )}
                    {!minimal && (
                      <Select
                        value={task.status}
                        onValueChange={(value) => handleStatusChange(task.id, value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder={t('common.status')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{t('tasks.pending')}</SelectItem>
                          <SelectItem value="in_progress">{t('tasks.inProgress')}</SelectItem>
                          <SelectItem value="completed">{t('tasks.completed')}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}