import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTransition, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useStorage } from "@/hooks/use-storage";
import { addDocument } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from 'uuid';
import { Document } from "@/lib/types";


const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  file: z.any().refine(file => file instanceof File, "Se requiere un archivo."),
});

type DocumentFormValues = z.infer<typeof formSchema>;

interface AddDocumentFormProps {
  companyId: string;
  onDocumentAdded: (newDocument: Document) => void;
}

export default function AddDocumentForm({ companyId, onDocumentAdded }: AddDocumentFormProps) {
  const { toast } = useToast();
  const { uploadFile, isUploading } = useStorage();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPending, startTransition] = useTransition();

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      file: undefined,
    },
  });

  const onSubmit = (values: DocumentFormValues) => {
    startTransition(async () => {
      try {
        if (!values.file) {
          throw new Error("File is required.");
        }

        const file = values.file as File;

        // Define a unique path for the file in storage
        const storagePath = `documents/${companyId}/${uuidv4()}-${file.name}`;

        // Call the corrected uploadFile function with path and progress handler
        const fileUrl = await uploadFile(
          file,
          storagePath,
          setUploadProgress
        );

        const documentData = {
          name: values.name,
          url: fileUrl,
          size: file.size
        };

        const result = await addDocument(companyId, documentData);

        if (!result.success || !result.newDocument) {
          throw new Error(result.message || "Failed to save the document.");
        }

        toast({
          title: "Documento Subido",
          description: `"${values.name}" ha sido añadido con éxito.`,
        });
        onDocumentAdded(result.newDocument);
        form.reset();

      } catch (err: any) {
        console.error("Error during document upload:", err);
        toast({
            title: "Error al guardar",
            description: err.message || 'An unexpected error occurred.',
            variant: "destructive"
        });
      } finally {
        setUploadProgress(0); // Reset progress on completion or failure
      }
    });
  };

  const isProcessing = isPending || isUploading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir Nuevo Documento</CardTitle>
        <CardDescription>Añada documentos a su perfil (PDF, DOCX, etc). Límite de 5MB.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del documento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Licencia de apertura" {...field} disabled={isProcessing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, ...rest } }) => (
                <FormItem>
                  <FormLabel>Archivo</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)} 
                      disabled={isProcessing} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%`}}></div>
              </div>
            )}
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? 'Subiendo...' : 'Guardar Documento'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}