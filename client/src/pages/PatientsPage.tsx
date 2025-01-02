import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Patient } from "@db/schema";
import { Loader2 } from "lucide-react";

export default function PatientsPage() {
  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {patients?.map((patient) => (
              <Card key={patient.id} className="hover:bg-accent/5 transition-colors">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-base sm:text-lg">
                    {patient.firstName} {patient.lastName}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {new Date(patient.dateOfBirth).toLocaleDateString()}
                  </p>
                  <p className="text-xs sm:text-sm mt-1">{patient.email}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}