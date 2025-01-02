import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@db/schema";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, 
  Calendar,
  User,
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock4
} from "lucide-react";
import { format } from "date-fns";

interface TimelineProps {
  carePlanId: number;
}

export default function Timeline({ carePlanId }: TimelineProps) {
  const { data: progressData, isLoading } = useQuery<Progress[]>({
    queryKey: [`/api/progress/${carePlanId}`],
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'billed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Billed</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Paid</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {isLoading ? (
            <div className="text-center py-4">Loading timeline...</div>
          ) : progressData?.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No history records found
            </div>
          ) : (
            <div className="relative">
              {progressData?.map((record) => (
                <div
                  key={record.id}
                  className="mb-8 flex gap-4 relative before:absolute before:left-[17px] before:top-[24px] before:h-full before:w-[2px] before:bg-border last:before:hidden"
                >
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium">
                        {record.title}
                      </h3>
                      {getStatusBadge(record.billingStatus)}
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                      <div className="grid gap-2">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          {format(new Date(record.recordedAt), 'PPP')}
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          {format(new Date(record.recordedAt), 'p')}
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock4 className="h-4 w-4 mr-2 text-muted-foreground" />
                          Duration: {record.timeSpent} minutes
                        </div>
                        <div className="flex items-center text-sm">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          {record.caregiverName}
                        </div>
                        <div className="flex items-center text-sm">
                          <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                          Cost: ${record.cost}
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">
                          {record.notes}
                        </p>
                      </div>
                      {record.attachments && record.attachments.length > 0 && (
                        <div className="mt-4 flex gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {record.attachments.length} attachment(s)
                          </span>
                        </div>
                      )}
                      <div className="mt-4 flex gap-2">
                        {record.tags?.map((tag: string) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
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