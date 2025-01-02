import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import AppointmentScheduler from "../appointments/AppointmentScheduler";
import { Patient } from "@db/schema";
import {
  User,
  Phone,
  Mail,
  Home,
  FileText,
  Calendar,
  AlertCircle,
} from "lucide-react";

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

  const { data: appointments } = useQuery({
    queryKey: [`/api/appointments/${patient?.id}`],
    enabled: !!patient,
  });

  if (!patient) return null;

  const address = typeof patient.address === 'string' 
    ? JSON.parse(patient.address) 
    : patient.address;

  const emergencyContact = typeof patient.emergencyContact === 'string'
    ? JSON.parse(patient.emergencyContact)
    : patient.emergencyContact;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {patient.firstName} {patient.lastName}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4">
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
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">
                      {patient.firstName} {patient.lastName}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">
                      {new Date(patient.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{patient.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{patient.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Address</h3>
                <div className="space-y-2">
                  <p>{address.street}</p>
                  <p>
                    {address.city}, {address.state} {address.zipCode}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{emergencyContact.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Relationship</p>
                    <p className="font-medium">{emergencyContact.relationship}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{emergencyContact.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medical" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Medical History</h3>
                <p className="text-muted-foreground">
                  {patient.medicalHistory || "No medical history recorded"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Current Diagnoses</h3>
                <div className="space-y-2">
                  {patient.currentDiagnoses?.length > 0 ? (
                    patient.currentDiagnoses.map((diagnosis: string, index: number) => (
                      <p key={index}>{diagnosis}</p>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No current diagnoses</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Allergies</h3>
                <div className="space-y-2">
                  {patient.allergies?.length > 0 ? (
                    patient.allergies.map((allergy: string, index: number) => (
                      <p key={index}>{allergy}</p>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No known allergies</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <AppointmentScheduler patient={patient} />
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Appointment History</h3>
                {appointments?.length > 0 ? (
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
                  <p className="text-muted-foreground">No appointment history</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            {/* Document upload and management will be implemented in the next iteration */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Documents</h3>
                <p className="text-muted-foreground">
                  Document management feature coming soon
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
