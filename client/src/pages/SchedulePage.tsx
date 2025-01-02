import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ProviderSchedule } from "@db/schema";
import { Loader2 } from "lucide-react";

export default function SchedulePage() {
  const { data: schedules, isLoading } = useQuery<ProviderSchedule[]>({
    queryKey: ["/api/provider-schedules"],
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
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {schedules?.map((schedule) => (
              <Card key={schedule.id}>
                <CardContent className="p-4">
                  <h3 className="font-semibold">
                    Day {schedule.dayOfWeek}
                  </h3>
                  <p className="text-sm">
                    {schedule.startTime} - {schedule.endTime}
                  </p>
                  <p className="text-sm text-gray-500">
                    {schedule.isAvailable ? "Available" : "Unavailable"}
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
