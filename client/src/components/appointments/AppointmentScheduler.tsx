import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CalendarPlus, Video } from "lucide-react";
import type { Appointment, ProviderSchedule } from "@db/schema";

const APPOINTMENT_TYPES = [
  { value: "initial_consultation", label: "Initial Consultation" },
  { value: "follow_up", label: "Follow-up" },
  { value: "emergency", label: "Emergency" },
  { value: "routine_checkup", label: "Routine Checkup" },
];

export default function AppointmentScheduler() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [symptoms, setSymptoms] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available providers and their schedules
  const { data: providerSchedules, isLoading: isLoadingSchedules } = useQuery<ProviderSchedule[]>({
    queryKey: ['/api/provider-schedules'],
    enabled: !!selectedDate,
  });

  // Fetch existing appointments to check for conflicts
  const { data: existingAppointments, isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments', selectedDate?.toISOString().split('T')[0]],
    enabled: !!selectedDate,
  });

  // Get available time slots based on provider schedules and existing appointments
  const getAvailableTimeSlots = () => {
    if (!selectedDate || !providerSchedules || !existingAppointments) return [];

    const dayOfWeek = selectedDate.getDay();
    const daySchedules = providerSchedules.filter(
      schedule => schedule.dayOfWeek === dayOfWeek && schedule.isAvailable
    );

    // Generate 30-minute slots within provider schedules
    const availableSlots = daySchedules.flatMap(schedule => {
      const slots: string[] = [];
      const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
      const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

      let currentHour = startHour;
      let currentMinute = startMinute;

      while (
        currentHour < endHour || 
        (currentHour === endHour && currentMinute < endMinute)
      ) {
        slots.push(
          `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
        );

        currentMinute += 30;
        if (currentMinute >= 60) {
          currentHour += 1;
          currentMinute = 0;
        }
      }

      return slots;
    });

    // Remove slots that are already booked
    const bookedSlots = existingAppointments
      .filter(apt => {
        const aptDate = new Date(apt.scheduledFor);
        return aptDate.toDateString() === selectedDate.toDateString();
      })
      .map(apt => {
        const aptDate = new Date(apt.scheduledFor);
        return `${aptDate.getHours().toString().padStart(2, '0')}:${aptDate.getMinutes().toString().padStart(2, '0')}`;
      });

    return availableSlots.filter(slot => !bookedSlots.includes(slot));
  };

  const bookAppointment = useMutation({
    mutationFn: async (appointmentData: Partial<Appointment>) => {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Success",
        description: "Appointment scheduled successfully",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedType("");
    setSymptoms("");
  };

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime || !selectedType) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    const scheduledFor = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(":").map(Number);
    scheduledFor.setHours(hours, minutes);

    bookAppointment.mutate({
      scheduledFor,
      type: selectedType as any,
      symptoms,
      duration: 30, // Default duration in minutes
    });
  };

  const availableTimeSlots = getAvailableTimeSlots();

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <CalendarPlus className="h-4 w-4 mr-2" />
          Schedule Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Schedule a Telemedicine Appointment</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <h3 className="font-medium mb-2">Select Date</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dayOfWeek = date.getDay();
                return (
                  date < today || // Can't book past dates
                  dayOfWeek === 0 || // Sunday
                  dayOfWeek === 6 // Saturday
                );
              }}
            />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Select Time</h3>
              <Select 
                value={selectedTime} 
                onValueChange={setSelectedTime}
                disabled={!selectedDate || isLoadingSchedules || isLoadingAppointments}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    isLoadingSchedules || isLoadingAppointments
                      ? "Loading available times..."
                      : "Choose a time slot"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableTimeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableTimeSlots.length === 0 && selectedDate && !isLoadingSchedules && !isLoadingAppointments && (
                <p className="text-sm text-destructive mt-1">
                  No available time slots for this date. Please select another date.
                </p>
              )}
            </div>

            <div>
              <h3 className="font-medium mb-2">Appointment Type</h3>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select appointment type" />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="font-medium mb-2">Symptoms or Concerns</h3>
              <Textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Please describe your symptoms or concerns..."
                className="min-h-[100px]"
              />
            </div>

            <Button 
              className="w-full"
              onClick={handleSubmit}
              disabled={
                !selectedDate || 
                !selectedTime || 
                !selectedType || 
                bookAppointment.isPending || 
                isLoadingSchedules || 
                isLoadingAppointments
              }
            >
              <Video className="h-4 w-4 mr-2" />
              {bookAppointment.isPending ? "Scheduling..." : "Book Telemedicine Appointment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}