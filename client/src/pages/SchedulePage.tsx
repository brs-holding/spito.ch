import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { Loader2, Plus, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import type { CalendarEvent } from "@db/schema";

const TIMEZONE = 'Europe/Zurich'; // Swiss timezone preset

type EventFormData = {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendeeIds: string[];
  patientId?: string;
  timezone: string;
};

export default function SchedulePage() {
  const { user } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EventFormData>({
    defaultValues: {
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      attendeeIds: [],
      timezone: TIMEZONE,
    },
  });

  const { data: events, isLoading: isLoadingEvents } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar"],
    select: (data) => {
      // Convert UTC times to Swiss timezone for display
      return data.map(event => ({
        ...event,
        startTime: formatInTimeZone(new Date(event.startTime), TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        endTime: formatInTimeZone(new Date(event.endTime), TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      }));
    }
  });

  const { data: organizationUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/organization/employees"],
    enabled: user?.role === "spitex_org" || user?.role === "spitex_employee",
  });

  const { data: patients = [], isLoading: isLoadingPatients } = useQuery({
    queryKey: ["/api/patients"],
    enabled: user?.role === "spitex_org" || user?.role === "spitex_employee",
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      // Convert local times to UTC before sending to server
      const startTime = toZonedTime(new Date(data.startTime), data.timezone);
      const endTime = toZonedTime(new Date(data.endTime), data.timezone);

      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          attendeeIds: data.attendeeIds.map(id => parseInt(id)),
          patientId: data.patientId ? parseInt(data.patientId) : undefined,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Event created",
        description: "The calendar event has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EventFormData) => {
    createEventMutation.mutate(data);
  };

  // Only allow access to authorized users
  if (!user || (user.role !== "spitex_org" && user.role !== "spitex_employee")) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold text-red-600">
          Not authorized to access scheduling
        </h1>
      </div>
    );
  }

  if (isLoadingEvents || isLoadingUsers || isLoadingPatients) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Schedule</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create Event</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  rules={{ required: "Title is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Event title" {...field} />
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Event description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    rules={{ required: "Start time is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time ({TIMEZONE})</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    rules={{ required: "End time is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time ({TIMEZONE})</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="attendeeIds"
                  rules={{ required: "At least one attendee is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Members</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(Array.isArray(value) ? value : [value])}
                        multiple
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select team members" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizationUsers.map((user: any) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.fullName || user.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {patients.length > 0 && (
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select patient" />
                          </SelectTrigger>
                          <SelectContent>
                            {patients.map((patient: any) => (
                              <SelectItem
                                key={patient.id}
                                value={patient.id.toString()}
                              >
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

                <Button type="submit" className="w-full">
                  {createEventMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Create Event
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events?.map((event) => (
                <Card key={event.id} className="hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <Badge variant={event.status === "completed" ? "secondary" : "default"}>
                        {event.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>
                          {format(new Date(event.startTime), "PPp")} -{" "}
                          {format(new Date(event.endTime), "p")}
                        </span>
                      </div>
                      {event.attendees?.length > 0 && (
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          <span>{event.attendees.length} attendees</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}