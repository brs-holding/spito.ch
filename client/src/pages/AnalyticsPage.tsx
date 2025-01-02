import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Loader2 } from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function AnalyticsPage() {
  const { data: taskMetrics, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["/api/analytics/tasks"],
  });

  const { data: patientMetrics, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["/api/analytics/patients"],
  });

  const { data: employeeMetrics, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["/api/analytics/employees"],
  });

  if (isLoadingTasks || isLoadingPatients || isLoadingEmployees) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Task Completion Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Task Completion Rate</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskMetrics?.completionRate}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskMetrics?.completionRate.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Patient Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={patientMetrics?.growth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="patients"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Employee Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={employeeMetrics?.performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="completedTasks"
                  stroke="#82ca9d"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
