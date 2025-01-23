import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Patient } from "@db/schema";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/patients/columns";
import { useToast } from "@/hooks/use-toast";
import PatientDetailsDialog from "@/components/patients/PatientDetailsDialog";

export default function PatientsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Filter patients based on search query
  const filteredPatients = patients?.filter(patient => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      patient.firstName.toLowerCase().includes(searchLower) ||
      patient.lastName.toLowerCase().includes(searchLower) ||
      patient.email.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Patients</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage patient records
              </p>
            </div>
            <Input
              placeholder="Search patients..."
              className="max-w-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns}
            data={filteredPatients || []}
            isLoading={isLoading}
            onRowClick={(row) => setSelectedPatient(row.original)}
            onRowClick={(row) => setSelectedPatient(row.original)}
          />
        </CardContent>
      </Card>

      <PatientDetailsDialog
        patient={selectedPatient}
        open={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
    </div>
  );
}