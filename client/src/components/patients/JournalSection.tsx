import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { LoadingTransition } from "@/components/ui/LoadingTransition";
import { format } from "date-fns";

interface JournalEntry {
  id: number;
  content: string;
  documentUrl?: string;
  createdAt: string;
  createdBy: string;
}

interface JournalSectionProps {
  patientId: number;
}

export default function JournalSection({ patientId }: JournalSectionProps) {
  const [newEntry, setNewEntry] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: [`/api/patients/${patientId}/journal`],
  });

  const createEntryMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/patients/${patientId}/journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/journal`] });
      setNewEntry("");
      toast({
        title: "Success",
        description: "Journal entry added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.trim()) return;
    createEntryMutation.mutate(newEntry);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Add a new journal entry..."
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              className="min-h-[100px]"
            />
            <Button
              type="submit"
              disabled={createEntryMutation.isPending || !newEntry.trim()}
            >
              Add Entry
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-4">Journal History</h3>
          <LoadingTransition isLoading={isLoading}>
            <div className="space-y-4">
              {entries?.map((entry) => (
                <div
                  key={entry.id}
                  className="border-b pb-4 last:border-b-0 last:pb-0"
                >
                  <p className="whitespace-pre-wrap">{entry.content}</p>
                  <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                    <span>{entry.createdBy}</span>
                    <span>
                      {format(new Date(entry.createdAt), "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                </div>
              ))}
              {entries?.length === 0 && (
                <p className="text-muted-foreground">No journal entries yet.</p>
              )}
            </div>
          </LoadingTransition>
        </CardContent>
      </Card>
    </div>
  );
}
