import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, AlertCircle } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

type Task = {
  id: number;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  dueDate: string;
  status: "pending" | "in_progress" | "completed";
};

interface Props {
  task: Task;
  onClick?: () => void;
  className?: string;
}

export default function TaskCard({ task, onClick, className }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    high: "text-red-500 bg-red-100",
    medium: "text-yellow-500 bg-yellow-100",
    low: "text-green-500 bg-green-100",
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-move hover:shadow-md transition-shadow",
        isDragging && "opacity-50",
        className
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <CardHeader className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold line-clamp-2">{task.title}</h3>
            <Badge variant="outline" className={priorityColors[task.priority]}>
              {task.priority}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="w-4 h-4 mr-1" />
          <span>Due: {format(new Date(task.dueDate), "MMM d, yyyy")}</span>
        </div>
      </CardContent>
    </Card>
  );
}