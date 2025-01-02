import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ClipboardList, Users } from "lucide-react";

interface CarePlansDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CarePlansDialog({ open, onClose }: CarePlansDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Care Plans</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">
              <Users className="h-4 w-4 mr-2" />
              Active Plans
            </TabsTrigger>
            <TabsTrigger value="templates">
              <ClipboardList className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Active care plans will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Care plan templates will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Care plan schedules will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
