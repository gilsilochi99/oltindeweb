
'use client';

import { useAuth } from "@/hooks/use-auth";
import { getSiteSettings } from "@/lib/data";
import { useEffect, useState } from "react";
import { BusinessAdvisor } from "@/components/shared/BusinessAdvisor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Star, Bot, ShieldOff, Zap } from "lucide-react";
import Link from "next/link";
import type { SiteSettings } from "@/lib/types";

function UpgradeToPremium() {
    return (
        <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
                <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
                    <Zap className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Desbloquee el Asesor de Negocios IA</CardTitle>
                <CardDescription>
                    Esta es una función premium. Actualice su cuenta para obtener acceso instantáneo a nuestro asistente de IA y obtener respuestas expertas para sus negocios en Guinea Ecuatorial.
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

function FeatureDisabled() {
     return (
        <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
                 <div className="mx-auto bg-muted p-3 rounded-full mb-4">
                    <ShieldOff className="w-8 h-8 text-muted-foreground" />
                </div>
                <CardTitle>Función no Disponible</CardTitle>
                <CardDescription>
                    El Asesor de Negocios IA no está activado en este momento. Por favor, inténtelo de nuevo más tarde.
                </CardDescription>
            </CardHeader>
        </Card>
    );
}

export default function AdvisorPage() {
    const { isPremium, loading: authLoading } = useAuth();
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchSettings() {
            const siteSettings = await getSiteSettings();
            setSettings(siteSettings);
            setIsLoading(false);
        }
        fetchSettings();
    }, []);

    const effectiveLoading = authLoading || isLoading;

    if (effectiveLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!settings?.isBusinessAdvisorEnabled) {
        return <FeatureDisabled />;
    }
    
    if (!isPremium) {
        return <UpgradeToPremium />;
    }

    return (
        <div>
            <div className="text-center mb-8">
                <Bot className="w-12 h-12 text-primary mx-auto mb-4" />
                <h1 className="text-4xl font-bold font-headline">Asesor de Negocios IA</h1>
                <p className="max-w-2xl mx-auto mt-2 text-lg text-muted-foreground">
                    ¿Tiene preguntas sobre cómo hacer negocios en Guinea Ecuatorial? Pregunte a nuestro asistente de IA.
                </p>
            </div>
            <BusinessAdvisor />
        </div>
    );
}
