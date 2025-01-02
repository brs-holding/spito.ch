import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pill, Check, X, Clock, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { MedicationSchedule, Medication, MedicationAdherence } from "@db/schema";

interface MedicationData {
  schedules: MedicationSchedule[];
  medications: Medication[];
}

export default function MedicationTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);

  const { data: medicationData, isLoading: isLoadingMedications } = useQuery<MedicationData>({
    queryKey: ["/api/patient/medications"],
  });

  const { data: adherenceData, isLoading: isLoadingAdherence } = useQuery<MedicationAdherence[]>({
    queryKey: ["/api/patient/medication-adherence", selectedSchedule],
    enabled: !!selectedSchedule,
  });

  const recordAdherence = useMutation({
    mutationFn: async (data: { scheduleId: number; status: "taken" | "missed" | "delayed" | "skipped"; notes?: string }) => {
      const response = await fetch("/api/patient/medication-adherence", {
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
      queryClient.invalidateQueries({ queryKey: ["/api/patient/medication-adherence", selectedSchedule] });
      toast({
        title: "Success",
        description: "Medication status updated successfully",
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "taken":
        return <Check className="h-4 w-4 text-green-500" />;
      case "missed":
        return <X className="h-4 w-4 text-red-500" />;
      case "delayed":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "skipped":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const formatFrequency = (frequency: any) => {
    if (frequency.times_per_day) {
      return `${frequency.times_per_day}x daily`;
    }
    return "As needed";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Medication Tracker</CardTitle>
          <Pill className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingMedications ? (
          <div className="text-center py-4">Loading medications...</div>
        ) : medicationData?.schedules.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No medications scheduled
          </div>
        ) : (
          <div className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicationData?.schedules.map((schedule) => {
                  const medication = medicationData.medications.find(
                    m => m.id === schedule.medicationId
                  );
                  return (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{medication?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {medication?.dosageForm} - {medication?.strength}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{schedule.dosage}</TableCell>
                      <TableCell>{formatFrequency(schedule.frequency)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              recordAdherence.mutate({
                                scheduleId: schedule.id,
                                status: "taken",
                              });
                            }}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Taken
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedSchedule(schedule.id)}
                          >
                            View History
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {selectedSchedule && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Medication History</h3>
                {isLoadingAdherence ? (
                  <div className="text-center py-4">Loading history...</div>
                ) : adherenceData?.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No history available
                  </div>
                ) : (
                  <div className="space-y-2">
                    {adherenceData?.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center gap-4 p-3 rounded-lg border"
                      >
                        {getStatusIcon(record.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium capitalize">
                              {record.status}
                            </p>
                            <Badge variant="secondary">
                              {new Date(record.takenAt).toLocaleTimeString()}
                            </Badge>
                          </div>
                          {record.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {record.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}