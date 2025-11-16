'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Flag } from "lucide-react";

export function ReportInfoDialog() {
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
     event.preventDefault();
     // Here you would call a server action with the report
     toast({
       title: "Reporte Enviado",
       description: "Gracias por su colaboración. Revisaremos la información lo antes posible.",
     });
     // Close dialog - this requires managing state or using DialogClose
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Flag className="w-4 h-4 mr-2" />
          Reportar Información Incorrecta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Reportar Información Incorrecta</DialogTitle>
            <DialogDescription>
              Ayúdenos a mantener la información actualizada. Describa qué datos son incorrectos o están desactualizados.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="report-details" className="sr-only">Detalles del reporte</Label>
            <Textarea id="report-details" name="report-details" rows={5} placeholder="Por ejemplo: El número de teléfono ha cambiado, el nuevo es..." required />
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="submit">Enviar Reporte</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
