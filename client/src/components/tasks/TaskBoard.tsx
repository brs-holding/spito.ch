import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import TaskCard from "./TaskCard";
import TaskDetailsDialog from "./TaskDetailsDialog";

type Task = {
  id: number;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  priority: "high" | "medium" | "low";
  dueDate: string;
  createdAt: string;
  updatedAt: string;
};

export default function TaskBoard() {
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const response = await fetch(`/api/tasks/${task.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: task.status }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const pendingTasks = tasks.filter((task) => task.status === "pending");
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress");
  const completedTasks = tasks.filter((task) => task.status === "completed");

  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveId(active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over) return;

    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;

    const containerMap = {
      "pending-container": "pending",
      "in-progress-container": "in_progress",
      "completed-container": "completed",
    } as const;

    const newStatus = containerMap[over.id as keyof typeof containerMap];
    if (task.status !== newStatus) {
      updateTaskMutation.mutate({
        id: task.id,
        status: newStatus,
      });
    }

    setActiveId(null);
  };

  if (isLoading) {
    return <div>Loading tasks...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Task Board</h1>
        <Button onClick={() => setSelectedTask({ status: "pending" } as Task)}>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Not Seen Column */}
          <Card>
            <CardHeader className="bg-background">
              <CardTitle className="text-lg font-semibold">Not Seen</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <SortableContext items={pendingTasks.map((t) => t.id)}>
                <div id="pending-container" className="space-y-4">
                  {pendingTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))}
                </div>
              </SortableContext>
            </CardContent>
          </Card>

          {/* In Progress Column */}
          <Card>
            <CardHeader className="bg-background">
              <CardTitle className="text-lg font-semibold">In Progress</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <SortableContext items={inProgressTasks.map((t) => t.id)}>
                <div id="in-progress-container" className="space-y-4">
                  {inProgressTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))}
                </div>
              </SortableContext>
            </CardContent>
          </Card>

          {/* Done Column */}
          <Card>
            <CardHeader className="bg-background">
              <CardTitle className="text-lg font-semibold">Done</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <SortableContext items={completedTasks.map((t) => t.id)}>
                <div id="completed-container" className="space-y-4">
                  {completedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))}
                </div>
              </SortableContext>
            </CardContent>
          </Card>
        </div>

        <DragOverlay>
          {activeId ? (
            <TaskCard
              task={tasks.find((t) => t.id === activeId)!}
              className="opacity-50"
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailsDialog
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}