'use client';

import { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteSettings } from '@/lib/data';
import { updateSiteSettings } from '@/lib/actions';
import type { SiteSettings } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Partial<SiteSettings>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, startTransition] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        async function fetchSettings() {
            setIsLoading(true);
            const siteSettings = await getSiteSettings();
            setSettings(siteSettings);
            setIsLoading(false);
        }
        fetchSettings();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (checked: boolean, name: keyof SiteSettings) => {
        setSettings(prev => ({ ...prev, [name]: checked }));
    }

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateSiteSettings(settings);
            if (result.success) {
                toast({ title: "Configuración guardada", description: "La información del sitio ha sido actualizada." });
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        });
    };

    if (isLoading) {
        return (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline">Configuración del Sitio</h1>
                <p className="text-muted-foreground">Gestionar la configuración global del sitio.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Información General</CardTitle>
                    <CardDescription>Estos valores se usan en varias partes del sitio, como en el pie de página.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="siteName">Nombre del Sitio</Label>
                        <Input 
                            id="siteName" 
                            name="siteName"
                            value={settings.siteName || ''}
                            onChange={handleInputChange}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="siteSlogan">Eslogan del Sitio</Label>
                        <Input 
                            id="siteSlogan" 
                            name="siteSlogan"
                            value={settings.siteSlogan || ''}
                            onChange={handleInputChange}
                        />
                    </div>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Guardar Cambios
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Funciones de IA</CardTitle>
                    <CardDescription>Activar o desactivar funciones experimentales de IA.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="ai-advisor-switch" className="text-base">Asesor de Negocios IA</Label>
                            <p className="text-sm text-muted-foreground">
                                Permite a los usuarios premium usar el chat de IA en la página del asesor.
                            </p>
                        </div>
                         <Switch
                            id="ai-advisor-switch"
                            checked={settings.isBusinessAdvisorEnabled || false}
                            onCheckedChange={(checked) => handleSwitchChange(checked, 'isBusinessAdvisorEnabled')}
                        />
                    </div>
                     <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Guardar Cambios de IA
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
