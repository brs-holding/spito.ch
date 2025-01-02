import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Patient, InsuranceDetails, PatientDocument, VisitLog } from "@db/schema";
import { 
  User, 
  FilePlus, 
  CalendarPlus, 
  Shield, 
  ClipboardList,
  FileText,
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

  const { data: insurance, isLoading: isLoadingInsurance } = useQuery<InsuranceDetails[]>({
    queryKey: [`/api/patients/${patientId}/insurance`],
  });

  const { data: documents, isLoading: isLoadingDocuments } = useQuery<PatientDocument[]>({
    queryKey: [`/api/patients/${patientId}/documents`],
  });

  const { data: visits, isLoading: isLoadingVisits } = useQuery<VisitLog[]>({
    queryKey: [`/api/patients/${patientId}/visits`],
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
        title: "Success",
        description: "Patient information updated successfully",
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

  if (isLoadingPatient) {
    return <div>Loading patient information...</div>;
  }

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList>
        <TabsTrigger value="basic">
          <User className="h-4 w-4 mr-2" />
          Basic Information
        </TabsTrigger>
        <TabsTrigger value="insurance">
          <Shield className="h-4 w-4 mr-2" />
          Insurance
        </TabsTrigger>
        <TabsTrigger value="documents">
          <FileText className="h-4 w-4 mr-2" />
          Documents
        </TabsTrigger>
        <TabsTrigger value="visits">
          <ClipboardList className="h-4 w-4 mr-2" />
          Visit Logs
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic">
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Basic information form will go here */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input
                  value={patient?.firstName}
                  onChange={(e) =>
                    updatePatient.mutate({ firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={patient?.lastName}
                  onChange={(e) =>
                    updatePatient.mutate({ lastName: e.target.value })
                  }
                />
              </div>
              {/* Add more fields as needed */}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="insurance">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Insurance Information</CardTitle>
              <Button>
                <Shield className="h-4 w-4 mr-2" />
                Add Insurance
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingInsurance ? (
              <div>Loading insurance information...</div>
            ) : insurance?.length === 0 ? (
              <div>No insurance information found</div>
            ) : (
              <div>
                {insurance?.map((ins) => (
                  <div key={ins.id} className="border-b py-4">
                    <h3 className="font-medium">{ins.provider}</h3>
                    <p className="text-sm text-muted-foreground">
                      Policy: {ins.policyNumber}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Documents</CardTitle>
              <Button>
                <FilePlus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingDocuments ? (
              <div>Loading documents...</div>
            ) : documents?.length === 0 ? (
              <div>No documents found</div>
            ) : (
              <div className="space-y-4">
                {documents?.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">{doc.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="visits">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Visit Logs</CardTitle>
              <Button>
                <CalendarPlus className="h-4 w-4 mr-2" />
                Record Visit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingVisits ? (
              <div>Loading visit logs...</div>
            ) : visits?.length === 0 ? (
              <div>No visit logs found</div>
            ) : (
              <div className="space-y-4">
                {visits?.map((visit) => (
                  <div key={visit.id} className="border-b py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">
                          {new Date(visit.startTime).toLocaleDateString()}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {visit.notes}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(visit.startTime).toLocaleTimeString()} -{" "}
                        {visit.endTime
                          ? new Date(visit.endTime).toLocaleTimeString()
                          : "Ongoing"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
