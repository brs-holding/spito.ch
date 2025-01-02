import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  TimelineConnector,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
  TimelineContent,
} from "recharts";
import { Progress } from "@db/schema";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimelineProps {
  carePlanId: number;
}

export default function Timeline({ carePlanId }: TimelineProps) {
  const { data: progressData, isLoading } = useQuery<Progress[]>({
    queryKey: [`/api/progress/${carePlanId}`],
  });

  const getStatusColor = (value: number) => {
    if (value >= 80) return "bg-green-500";
    if (value >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="text-center py-4">Loading timeline...</div>
          ) : progressData?.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No progress records found
            </div>
          ) : (
            <div className="relative">
              {progressData?.map((progress, index) => (
                <div
                  key={progress.id}
                  className="mb-8 flex gap-4 relative before:absolute before:left-[17px] before:top-[24px] before:h-full before:w-[2px] before:bg-border last:before:hidden"
                >
                  <div className={`h-9 w-9 rounded-full ${getStatusColor((progress.metrics as { value: number })?.value || 0)} flex items-center justify-center shrink-0`}>
                    <span className="text-white text-sm font-medium">
                      {(progress.metrics as { value: number })?.value || 0}%
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="mb-2">
                      <p className="text-sm font-medium">
                        {new Date(progress.recordedAt).toLocaleDateString()} at{" "}
                        {new Date(progress.recordedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                      <p className="text-sm text-muted-foreground">
                        {progress.notes}
                      </p>
                      <div className="mt-2 flex gap-2">
                        {Object.entries(progress.metrics as Record<string, number>)
                          .filter(([key]) => key !== "value")
                          .map(([key, value]) => (
                            <Badge key={key} variant="secondary">
                              {key}: {value}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
