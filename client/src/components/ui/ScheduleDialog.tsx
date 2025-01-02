import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Users } from "lucide-react";

interface ScheduleDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function ScheduleDialog({ open, onClose }: ScheduleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Management</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="daily">
          <TabsList>
            <TabsTrigger value="daily">
              <Clock className="h-4 w-4 mr-2" />
              Daily View
            </TabsTrigger>
            <TabsTrigger value="weekly">
              <Calendar className="h-4 w-4 mr-2" />
              Weekly View
            </TabsTrigger>
            <TabsTrigger value="staff">
              <Users className="h-4 w-4 mr-2" />
              Staff Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Daily schedule view will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Weekly schedule view will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Staff schedule will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
