import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PatientRegistrationForm from "@/components/patients/PatientRegistrationForm";

export default function PatientRegistration() {
  return (
    <div className="container mx-auto py-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Patient Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientRegistrationForm />
        </CardContent>
      </Card>
    </div>
  );
}
