import { useUser } from "@/hooks/use-user";
import Sidebar from "@/components/dashboard/Sidebar";
import PatientList from "@/components/dashboard/PatientList";
import CarePlan from "@/components/dashboard/CarePlan";
import TaskBoard from "@/components/dashboard/TaskBoard";
import ProgressChart from "@/components/dashboard/ProgressChart";
import EmployeeOverview from "@/components/dashboard/EmployeeOverview";
import { useState } from "react";
import { Patient } from "@db/schema";

export default function Dashboard() {
  const { user } = useUser();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user!} />

      <main className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {user?.role === "spitex_org" && <EmployeeOverview />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <PatientList onSelectPatient={setSelectedPatient} />
              {selectedPatient && <CarePlan patient={selectedPatient} />}
            </div>

            <div className="space-y-4">
              <TaskBoard userId={user!.id} />
              <ProgressChart />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}