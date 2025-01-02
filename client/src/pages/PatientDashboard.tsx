import { useUser } from "@/hooks/use-user";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { HealthMetric } from "@db/schema";
import { Activity, PlusCircle } from "lucide-react";

export default function PatientDashboard() {
  const { user } = useUser();
  const [metricType, setMetricType] = useState<string>("blood_pressure");
  
  const { data: healthMetrics, isLoading } = useQuery<HealthMetric[]>({
    queryKey: [`/api/patient/health-metrics`],
  });

  const filteredMetrics = healthMetrics?.filter(
    (metric) => metric.type === metricType
  ) || [];

  const chartData = filteredMetrics.map((metric) => ({
    date: new Date(metric.recordedAt).toLocaleDateString(),
    value: 
      metricType === "blood_pressure" 
        ? (metric.value as { systolic: number; diastolic: number }).systolic
        : (metric.value as { value: number }).value,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Welcome, {user?.fullName}</h1>
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Record New Measurement
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Latest Blood Pressure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">120/80</div>
              <p className="text-xs text-muted-foreground">Last updated: Today</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">72 bpm</div>
              <p className="text-xs text-muted-foreground">Last updated: Today</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Weight</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">70 kg</div>
              <p className="text-xs text-muted-foreground">Last updated: Yesterday</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Daily Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8,432 steps</div>
              <p className="text-xs text-muted-foreground">Today's progress</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Health Trends</CardTitle>
              <Select
                value={metricType}
                onValueChange={(value) => setMetricType(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blood_pressure">Blood Pressure</SelectItem>
                  <SelectItem value="heart_rate">Heart Rate</SelectItem>
                  <SelectItem value="weight">Weight</SelectItem>
                  <SelectItem value="temperature">Temperature</SelectItem>
                  <SelectItem value="blood_sugar">Blood Sugar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 10,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    style={{ fontSize: '12px' }}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    style={{ fontSize: '12px' }}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
