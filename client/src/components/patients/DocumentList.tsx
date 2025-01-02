import { useQuery } from "@tanstack/react-query";
import { Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PatientDocument } from "@db/schema";
import { LoadingTransition } from "@/components/ui/LoadingTransition";
import { useState } from "react";

interface DocumentListProps {
  patientId: number;
}

export default function DocumentList({ patientId }: DocumentListProps) {
  const [previewDoc, setPreviewDoc] = useState<PatientDocument | null>(null);
  const { data: documents, isLoading } = useQuery<PatientDocument[]>({
    queryKey: [`/api/patients/${patientId}/documents`],
  });

  const downloadDocument = async (documentId: number) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Fehler beim Herunterladen des Dokuments");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "document"; // The server should set the correct filename
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading document:", error);
    }
  };

  const previewDocument = async (documentId: number) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/preview`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Fehler beim Laden der Vorschau");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error previewing document:", error);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      medical_report: "Medizinischer Bericht",
      prescription: "Rezept",
      insurance: "Versicherung",
      legal: "Rechtlich",
      other: "Sonstiges",
    };
    return types[type] || type;
  };

  return (
    <LoadingTransition isLoading={isLoading}>
      <div className="space-y-4">
        {documents?.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Keine Dokumente vorhanden
          </p>
        ) : (
          documents?.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h4 className="font-medium">{doc.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {getDocumentTypeLabel(doc.type)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => previewDocument(doc.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadDocument(doc.id)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </LoadingTransition>
  );
}