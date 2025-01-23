import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import AppointmentScheduler from "../appointments/AppointmentScheduler";
import { Patient, type InsertPatient } from "@db/schema";
import {
  User,
  Phone,
  Mail,
  Home,
  FileText,
  Calendar,
  AlertCircle,
  Edit2,
  Trash2,
  Save,
  X,
} from "lucide-react";
import { LoadingTransition } from "@/components/ui/LoadingTransition";
import DocumentUpload from "./DocumentUpload";
import DocumentList from "./DocumentList";
import JournalSection from "./JournalSection";
import { Book } from "lucide-react";

interface PatientDetailsDialogProps {
  patient: Patient | null;
  open: boolean;
  onClose: () => void;
}

export default function PatientDetailsDialog({
  patient,
  open,
  onClose,
}: PatientDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointments } = useQuery({
    queryKey: [`/api/appointments/${patient?.id}`],
    enabled: !!patient,
  });

  const { data: patientDetails } = useQuery({
    queryKey: [`/api/patients/${patient?.id}`],
    enabled: !!patient,
    select: (data) => ({
      ...data,
      healthInsuranceCompany: data.healthInsuranceCompany || '',
      healthInsuranceNumber: data.healthInsuranceNumber || '',
      healthInsuranceAddress: data.healthInsuranceAddress || '',
      healthInsuranceZip: data.healthInsuranceZip || '',
      healthInsurancePlace: data.healthInsurancePlace || '',
      ahvNumber: data.ahvNumber || ''
    })
  });

  const form = useForm<InsertPatient>({
    defaultValues: {
      firstName: patientDetails?.firstName || "",
      lastName: patientDetails?.lastName || "",
      dateOfBirth: patientDetails?.dateOfBirth
        ? new Date(patientDetails.dateOfBirth).toISOString().split("T")[0]
        : "",
      email: patientDetails?.email || "",
      phone: patientDetails?.phone || "",
      address: patientDetails?.address ? JSON.stringify(patientDetails.address) : "",
      emergencyContact: patientDetails?.emergencyContact
        ? JSON.stringify(patientDetails.emergencyContact)
        : "",
      medicalHistory: patientDetails?.medicalHistory || "",
      currentDiagnoses: patientDetails?.currentDiagnoses || [],
      allergies: patientDetails?.allergies || [],
      gender: patientDetails?.gender || "other",
      primaryPhysicianContact: patientDetails?.primaryPhysicianContact || "",
      familyAccess: patientDetails?.familyAccess || false,
      healthInsuranceCompany: patientDetails?.healthInsuranceCompany || "",
      healthInsuranceNumber: patientDetails?.healthInsuranceNumber || "",
      ahvNumber: patientDetails?.ahvNumber || "",
      healthInsuranceAddress: patientDetails?.healthInsuranceAddress || "",
      healthInsuranceZip: patientDetails?.healthInsuranceZip || "",
      healthInsurancePlace: patientDetails?.healthInsurancePlace || "",
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: async (data: Partial<InsertPatient>) => {
      const response = await fetch(`/api/patients/${patientDetails?.id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Patient information updated successfully",
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

  const deletePatientMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/patients/${patientDetails?.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setShowDeleteDialog(false);
      onClose();
      toast({
        title: "Success",
        description: "Patient deleted successfully",
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

  const onSubmit = (data: InsertPatient) => {
    updatePatientMutation.mutate(data);
  };

  if (!patientDetails) return null;

  const address = typeof patientDetails.address === "string"
    ? JSON.parse(patientDetails.address)
    : patientDetails.address;

  const emergencyContact = typeof patientDetails.emergencyContact === "string"
    ? JSON.parse(patientDetails.emergencyContact)
    : patientDetails.emergencyContact;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle className="text-2xl">
                {patientDetails.firstName} {patientDetails.lastName}
              </DialogTitle>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={() => setIsEditing(false)} variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={form.handleSubmit(onSubmit)}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => setShowDeleteDialog(true)}
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          <LoadingTransition>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-6">
                <TabsTrigger value="basic">
                  <User className="h-4 w-4 mr-2" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="medical">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Medical
                </TabsTrigger>
                <TabsTrigger value="appointments">
                  <Calendar className="h-4 w-4 mr-2" />
                  Appointments
                </TabsTrigger>
                <TabsTrigger value="documents">
                  <FileText className="h-4 w-4 mr-2" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="journal">
                  <Book className="h-4 w-4 mr-2" />
                  Journal
                </TabsTrigger>
                <TabsTrigger value="insurance">
                  <FileText className="h-4 w-4 mr-2" />
                  Versicherung
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          First Name
                        </p>
                        {isEditing ? (
                          <Input {...form.register("firstName")} />
                        ) : (
                          <p className="font-medium">{patientDetails.firstName}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Last Name
                        </p>
                        {isEditing ? (
                          <Input {...form.register("lastName")} />
                        ) : (
                          <p className="font-medium">{patientDetails.lastName}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Date of Birth
                        </p>
                        {isEditing ? (
                          <Input type="date" {...form.register("dateOfBirth")} />
                        ) : (
                          <p className="font-medium">
                            {new Date(patientDetails.dateOfBirth).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Email</p>
                        {isEditing ? (
                          <Input type="email" {...form.register("email")} />
                        ) : (
                          <p className="font-medium">{patientDetails.email}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Phone</p>
                        {isEditing ? (
                          <Input {...form.register("phone")} />
                        ) : (
                          <p className="font-medium">{patientDetails.phone}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Gender</p>
                        {isEditing ? (
                          <select
                            {...form.register("gender")}
                            className="w-full p-2 border rounded"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        ) : (
                          <p className="font-medium capitalize">
                            {patientDetails.gender}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-4">Address</h3>
                    {isEditing ? (
                      <Input
                        {...form.register("address")}
                        placeholder="Enter address as JSON"
                      />
                    ) : (
                      <div className="space-y-2">
                        <p>{address.street}</p>
                        <p>
                          {address.city}, {address.state} {address.zipCode}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-4">Emergency Contact</h3>
                    {isEditing ? (
                      <Input
                        {...form.register("emergencyContact")}
                        placeholder="Enter emergency contact as JSON"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-medium">
                            {emergencyContact.name}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Relationship
                          </p>
                          <p className="font-medium">
                            {emergencyContact.relationship}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">
                            {emergencyContact.phone}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="medical" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-4">Medical History</h3>
                    {isEditing ? (
                      <Input {...form.register("medicalHistory")} />
                    ) : (
                      <p className="text-muted-foreground">
                        {patientDetails.medicalHistory || "No medical history recorded"}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-4">Current Diagnoses</h3>
                    {isEditing ? (
                      <Input
                        {...form.register("currentDiagnoses")}
                        placeholder="Enter diagnoses as comma-separated values"
                      />
                    ) : (
                      <div className="space-y-2">
                        {Array.isArray(patientDetails.currentDiagnoses) &&
                        patientDetails.currentDiagnoses.length > 0 ? (
                          patientDetails.currentDiagnoses.map(
                            (diagnosis: string, index: number) => (
                              <p key={index}>{diagnosis}</p>
                            )
                          )
                        ) : (
                          <p className="text-muted-foreground">
                            No current diagnoses
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-4">Allergies</h3>
                    {isEditing ? (
                      <Input
                        {...form.register("allergies")}
                        placeholder="Enter allergies as comma-separated values"
                      />
                    ) : (
                      <div className="space-y-2">
                        {Array.isArray(patientDetails.allergies) &&
                        patientDetails.allergies.length > 0 ? (
                          patientDetails.allergies.map(
                            (allergy: string, index: number) => (
                              <p key={index}>{allergy}</p>
                            )
                          )
                        ) : (
                          <p className="text-muted-foreground">
                            No known allergies
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="appointments" className="space-y-4">
                <AppointmentScheduler patient={patientDetails} />

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-4">Appointment History</h3>
                    {Array.isArray(appointments) && appointments.length > 0 ? (
                      <div className="space-y-4">
                        {appointments.map((apt: any) => (
                          <div
                            key={apt.id}
                            className="flex items-center justify-between border-b pb-4"
                          >
                            <div>
                              <p className="font-medium">
                                {new Date(apt.scheduledFor).toLocaleDateString()}{" "}
                                {new Date(apt.scheduledFor).toLocaleTimeString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {apt.type}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                apt.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : apt.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {apt.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No appointment history
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-4">Documents</h3>
                    <DocumentUpload patientId={patientDetails.id} />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-4">Document List</h3>
                    <DocumentList patientId={patientDetails.id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="journal" className="space-y-4">
                <JournalSection patientId={patientDetails?.id || 0} />
              </TabsContent>

              <TabsContent value="insurance" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Krankenkasse</p>
                        {isEditing ? (
                          <Input {...form.register("healthInsuranceCompany")} />
                        ) : (
                          <p className="font-medium">{patientDetails.healthInsuranceCompany || "-"}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Versicherungsnummer</p>
                        {isEditing ? (
                          <Input {...form.register("healthInsuranceNumber")} />
                        ) : (
                          <p className="font-medium">{patientDetails.healthInsuranceNumber || "-"}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">AHV-Nummer</p>
                        {isEditing ? (
                          <Input {...form.register("ahvNumber")} />
                        ) : (
                          <p className="font-medium">{patientDetails.ahvNumber || "-"}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Adresse</p>
                        {isEditing ? (
                          <Input {...form.register("healthInsuranceAddress")} />
                        ) : (
                          <p className="font-medium">{patientDetails.healthInsuranceAddress || "-"}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">PLZ</p>
                        {isEditing ? (
                          <Input {...form.register("healthInsuranceZip")} />
                        ) : (
                          <p className="font-medium">{patientDetails.healthInsuranceZip || "-"}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Ort</p>
                        {isEditing ? (
                          <Input {...form.register("healthInsurancePlace")} />
                        ) : (
                          <p className="font-medium">{patientDetails.healthInsurancePlace || "-"}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </LoadingTransition>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this patient?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              patient's record and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePatientMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}