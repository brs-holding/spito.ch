import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Patient } from "@db/schema";
import { Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import PatientDetailsDialog from "../patients/PatientDetailsDialog";
import { LoadingTransition } from "@/components/ui/LoadingTransition";
import { t } from "@/lib/i18n";

export default function PatientList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const filteredPatients = patients?.filter(patient => 
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card className="h-[calc(50vh-2rem)]">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t('patients.title')}</CardTitle>
            <Link href="/register-patient">
              <Button size="sm" className="cursor-pointer">
                <UserPlus className="h-4 w-4 mr-2" />
                {t('patients.addPatient')}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-auto max-h-[calc(50vh-12rem)]">
            <LoadingTransition isLoading={isLoading}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>{t('patients.dateOfBirth')}</TableHead>
                    <TableHead>{t('patients.contactInfo')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients?.map((patient) => (
                    <TableRow
                      key={patient.id}
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <TableCell>
                        {patient.firstName} {patient.lastName}
                      </TableCell>
                      <TableCell>
                        {new Date(patient.dateOfBirth).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {patient.phone}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </LoadingTransition>
          </div>
        </CardContent>
      </Card>

      <PatientDetailsDialog 
        patient={selectedPatient}
        open={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
    </>
  );
}