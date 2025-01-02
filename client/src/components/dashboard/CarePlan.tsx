import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Patient, CarePlan as ICarePlan } from "@db/schema";
import { CalendarPlus, ClipboardList } from "lucide-react";

interface CarePlanProps {
  patient: Patient;
}

export default function CarePlan({ patient }: CarePlanProps) {
  const { data: carePlans, isLoading } = useQuery<ICarePlan[]>({
    queryKey: [`/api/care-plans/${patient.id}`],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "completed":
        return "bg-blue-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Care Plans</CardTitle>
          <Button size="sm">
            <CalendarPlus className="h-4 w-4 mr-2" />
            New Plan
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading care plans...</div>
        ) : carePlans?.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No care plans found for this patient
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {carePlans?.map((plan) => (
              <AccordionItem key={plan.id} value={plan.id.toString()}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    <span>{plan.title}</span>
                    <Badge
                      className={`ml-2 ${getStatusColor(plan.status)}`}
                    >
                      {plan.status}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(plan.createdAt).toLocaleDateString()}
                      <br />
                      Updated: {new Date(plan.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
