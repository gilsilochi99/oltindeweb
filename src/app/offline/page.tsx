import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
      <WifiOff className="w-12 h-12 text-muted-foreground" />
      <h1 className="text-2xl font-bold font-headline">Sin conexión</h1>
      <p className="max-w-md text-muted-foreground">
        No se pudo cargar esta página porque no tiene conexión a internet y todavía no la ha visitado.
        Las páginas que ya visitó siguen disponibles sin conexión.
      </p>
      <Button asChild>
        <Link href="/">Volver al Inicio</Link>
      </Button>
    </div>
  );
}
