import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, MapPin } from "lucide-react";

function InteractiveMapPlaceholder() {
  return (
    <div className="w-full h-[500px] rounded-lg bg-muted flex flex-col justify-center items-center text-center p-8 border-2 border-dashed">
      <MapPin className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold text-muted-foreground">Mapa Interactivo Próximamente</h3>
      <p className="text-muted-foreground max-w-sm">
        Estamos trabajando para traerle un mapa interactivo con las ubicaciones de todas las empresas e instituciones.
      </p>
    </div>
  )
}

export default function MapPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center gap-2">
        <Map className="w-12 h-12 text-primary" />
        <h1 className="text-4xl font-bold font-headline tracking-tighter">Mapa Interactivo</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Explore la ubicación de empresas e instituciones en Guinea Ecuatorial.
        </p>
      </div>
      <Card>
        <CardContent className="p-4 md:p-6">
          <InteractiveMapPlaceholder />
        </CardContent>
      </Card>
    </div>
  );
}
