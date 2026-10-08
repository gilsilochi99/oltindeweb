import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Star } from "lucide-react";
import Link from "next/link";
import { PREMIUM_FEATURES, type PremiumFeature } from "@/lib/premium-features";

type Props = {
    companyName: string;
    /** When given and the company is already Premium, the block is the category rule. */
    feature?: PremiumFeature;
    isPremium?: boolean;
    category?: string;
};

export function CompanyPremiumRequired({ companyName, feature, isPremium, category }: Props) {
    if (feature && isPremium) {
        return (
            <Card className="max-w-2xl mx-auto text-center">
                <CardHeader>
                    <div className="mx-auto bg-muted p-3 rounded-full mb-4">
                        <Lock className="w-8 h-8 text-black" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{PREMIUM_FEATURES[feature]} no disponible</CardTitle>
                    <CardDescription>
                        Esta función no está incluida para empresas de la categoría <strong>{category || 'sin categoría'}</strong>.
                        Si <strong>{companyName}</strong> la necesita, contacte con nosotros y la revisaremos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="outline">
                        <Link href="/contact">Contactar con Oltinde</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }
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
