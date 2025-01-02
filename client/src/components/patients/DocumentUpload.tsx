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
import { Upload } from "lucide-react";
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
      if (!file || !type || !title) {
        throw new Error("Bitte füllen Sie alle Felder aus");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      formData.append("title", title);

      const response = await fetch(`/api/patients/${patientId}/documents`, {
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
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/documents`] });
      toast({
        title: "Erfolgreich",
        description: "Dokument wurde hochgeladen",
      });
      setTitle("");
      setType("");
      setFile(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: error.message,
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Dokumenttitel</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Geben Sie einen Titel ein"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Dokumenttyp</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="type">
            <SelectValue placeholder="Wählen Sie einen Typ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="medical_report">Medizinischer Bericht</SelectItem>
            <SelectItem value="prescription">Rezept</SelectItem>
            <SelectItem value="insurance">Versicherung</SelectItem>
            <SelectItem value="legal">Rechtlich</SelectItem>
            <SelectItem value="other">Sonstiges</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">Datei</Label>
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
        disabled={uploadMutation.isPending}
      >
        <Upload className="h-4 w-4 mr-2" />
        {uploadMutation.isPending ? "Wird hochgeladen..." : "Hochladen"}
      </Button>
    </div>
  );
}
