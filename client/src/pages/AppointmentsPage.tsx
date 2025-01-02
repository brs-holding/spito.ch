import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Appointment } from "@db/schema";
import { Loader2 } from "lucide-react";

export default function AppointmentsPage() {
  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {appointments?.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="p-4">
                  <h3 className="font-semibold">
                    {new Date(appointment.scheduledFor).toLocaleString()}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize">
                    Status: {appointment.status}
                  </p>
                  <p className="text-sm">
                    Duration: {appointment.duration} minutes
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
