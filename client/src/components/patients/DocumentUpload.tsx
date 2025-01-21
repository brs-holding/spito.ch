import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  patientId: number;
}

export default function DocumentUpload({ patientId }: DocumentUploadProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !title || !type) {
        throw new Error("Please fill in all fields and select a file");
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("type", type);
      formData.append("document", file);

      const response = await fetch(`/api/patients/${patientId}/documents`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error uploading document");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/documents`] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      setTitle("");
      setType("");
      setFile(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Document Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Document Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="type">
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="medical_report">Medical Report</SelectItem>
            <SelectItem value="prescription">Prescription</SelectItem>
            <SelectItem value="insurance">Insurance</SelectItem>
            <SelectItem value="legal">Legal</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">File</Label>
        <Input
          id="file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
      </div>

      <Button
        className="w-full"
        onClick={() => uploadMutation.mutate()}
        disabled={uploadMutation.isPending || !title || !type || !file}
      >
        {uploadMutation.isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-2" />
        )}
        {uploadMutation.isPending ? "Uploading..." : "Upload"}
      </Button>
    </div>
  );
}