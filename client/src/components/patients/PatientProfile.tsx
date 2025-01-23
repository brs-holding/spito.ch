import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Patient } from "@db/schema";
import { 
  User, 
  Phone, 
  Mail, 
  Home, 
  Shield, 
  FileText, 
  Calendar,
  ClipboardList,
} from "lucide-react";

interface PatientProfileProps {
  patientId: number;
}

export default function PatientProfile({ patientId }: PatientProfileProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patient, isLoading: isLoadingPatient } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
  });

  const updatePatient = useMutation({
    mutationFn: async (data: Partial<Patient>) => {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: "PUT",
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
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}`] });
      toast({
        title: "Erfolg",
        description: "Patientendaten erfolgreich aktualisiert",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: error.message,
      });
    },
  });

  if (isLoadingPatient) {
    return <div>Lade Patientendaten...</div>;
  }

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList>
        <TabsTrigger value="basic">
          <User className="h-4 w-4 mr-2" />
          Basisdaten
        </TabsTrigger>
        <TabsTrigger value="medical">
          <ClipboardList className="h-4 w-4 mr-2" />
          Medizinische Daten
        </TabsTrigger>
        <TabsTrigger value="appointments">
          <Calendar className="h-4 w-4 mr-2" />
          Termine
        </TabsTrigger>
        <TabsTrigger value="documents">
          <FileText className="h-4 w-4 mr-2" />
          Dokumente
        </TabsTrigger>
        <TabsTrigger value="insurance">
          <Shield className="h-4 w-4 mr-2" />
          Versicherungen
        </TabsTrigger>
        <TabsTrigger value="journal">
          <ClipboardList className="h-4 w-4 mr-2" />
          Journal
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic">
        <Card>
          <CardHeader>
            <CardTitle>Patienteninformationen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Vorname</label>
                <Input
                  value={patient?.firstName}
                  onChange={(e) =>
                    updatePatient.mutate({ firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nachname</label>
                <Input
                  value={patient?.lastName}
                  onChange={(e) =>
                    updatePatient.mutate({ lastName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">E-Mail</label>
                <Input
                  value={patient?.email}
                  type="email"
                  onChange={(e) =>
                    updatePatient.mutate({ email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Telefon</label>
                <Input
                  value={patient?.phone}
                  type="tel"
                  onChange={(e) =>
                    updatePatient.mutate({ phone: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="medical">
        <Card>
          <CardHeader>
            <CardTitle>Medizinische Informationen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Medizinische Vorgeschichte</label>
                <Input
                  value={patient?.medicalHistory || ""}
                  onChange={(e) =>
                    updatePatient.mutate({ medicalHistory: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="appointments">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Termine</CardTitle>
              <Button>
                <Calendar className="h-4 w-4 mr-2" />
                Termin hinzufügen
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div>Keine Termine vorhanden</div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Dokumente</CardTitle>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Dokument hochladen
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div>Keine Dokumente vorhanden</div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="insurance">
        <Card>
          <CardHeader>
            <CardTitle>Versicherungsinformationen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Krankenkasse</label>
                <Input
                  value={patient?.healthInsuranceCompany}
                  onChange={(e) =>
                    updatePatient.mutate({ healthInsuranceCompany: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Versicherungsnummer</label>
                <Input
                  value={patient?.healthInsuranceNumber}
                  onChange={(e) =>
                    updatePatient.mutate({ healthInsuranceNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">AHV-Nummer</label>
                <Input
                  value={patient?.ahvNumber}
                  onChange={(e) =>
                    updatePatient.mutate({ ahvNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Adresse der Krankenkasse</label>
                <Input
                  value={patient?.healthInsuranceAddress}
                  onChange={(e) =>
                    updatePatient.mutate({ healthInsuranceAddress: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">PLZ</label>
                <Input
                  value={patient?.healthInsuranceZip}
                  onChange={(e) =>
                    updatePatient.mutate({ healthInsuranceZip: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ort</label>
                <Input
                  value={patient?.healthInsurancePlace}
                  onChange={(e) =>
                    updatePatient.mutate({ healthInsurancePlace: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="journal">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Journal</CardTitle>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Eintrag hinzufügen
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div>Keine Journal-Einträge vorhanden</div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}