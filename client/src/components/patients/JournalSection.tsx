import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LoadingTransition } from "@/components/ui/LoadingTransition";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

interface JournalEntry {
  id: number;
  title: string;
  content: string;
  documentUrl?: string;
  createdAt: string;
  createdBy: string;
}

interface JournalSectionProps {
  patientId: number;
}

export default function JournalSection({ patientId }: JournalSectionProps) {
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: [`/api/patients/${patientId}/journal`],
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: typeof newEntry & { file?: File }) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("content", data.content);
      if (data.file) {
        formData.append("journalDocument", data.file);
      }

      const response = await fetch(`/api/patients/${patientId}/journal`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/journal`] });
      setNewEntry({ title: "", content: "" });
      setFile(null);
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
    if (!newEntry.title.trim() || !newEntry.content.trim()) return;
    createEntryMutation.mutate({ ...newEntry, file: file || undefined });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Entry title..."
                value={newEntry.title}
                onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Add a new journal entry..."
                value={newEntry.content}
                onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document">Attach Document (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="document"
                  type="file"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {file && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {file.name}
                  </div>
                )}
              </div>
            </div>
            <Button
              type="submit"
              disabled={createEntryMutation.isPending || !newEntry.title.trim() || !newEntry.content.trim()}
              className="w-full"
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
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-lg">{entry.title}</h4>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(entry.createdAt), "MMM d, yyyy h:mm a")}
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap mb-2">{entry.content}</p>
                  {entry.documentUrl && (
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      <a
                        href={entry.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline"
                      >
                        View attached document
                      </a>
                    </div>
                  )}
                  <div className="mt-2 text-sm text-muted-foreground">
                    Created by: {entry.createdBy}
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