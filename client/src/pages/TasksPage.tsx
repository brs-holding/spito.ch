import { useUser } from "@/hooks/use-user";
import TaskBoard from "@/components/dashboard/TaskBoard";

export default function TasksPage() {
  const { user } = useUser();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tasks</h1>
      </div>

      <div className="grid gap-6">
        <TaskBoard userId={user?.id} />
      </div>
    </div>
  );
}
