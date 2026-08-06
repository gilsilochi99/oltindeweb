
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import Link from "next/link";

export function CompanyPremiumRequired({ companyName }: { companyName: string }) {
    return (
        <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
                <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
                    <Star className="w-8 h-8 text-black" />
                </div>
                <CardTitle className="text-2xl font-bold">Función de Empresa Premium</CardTitle>
                <CardDescription>
                    Esta sección solo está disponible para empresas con Empresa Premium activada. Actualice el plan de <strong>{companyName}</strong> para desbloquear esta función.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/list-your-company#plans">Ver Planes Premium</Link>
                </Button>
                <p className="text-xs text-muted-foreground mt-4">Contacte con nosotros para activar su plan.</p>
            </CardContent>
        </Card>
    );
}
