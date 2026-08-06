
'use client';

import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { setCompanyPremium } from "@/lib/actions";
import { useTransition } from "react";

interface CompanyPremiumSwitchProps {
    companyId: string;
    isPremium: boolean;
    onChanged?: () => void;
}

export function CompanyPremiumSwitch({ companyId, isPremium, onChanged }: CompanyPremiumSwitchProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleToggle = (checked: boolean) => {
        startTransition(async () => {
            const result = await setCompanyPremium(companyId, checked);
            if (result.success) {
                toast({
                    title: checked ? "Empresa Premium activada" : "Empresa Premium desactivada",
                    description: checked
                        ? "La empresa ya tiene acceso a Documentos, Ofertas, Anuncios, Empleos, Eventos y Menú."
                        : "La empresa perdió el acceso a las funciones premium."
                });
                onChanged?.();
            } else {
                toast({
                    title: "Error",
                    description: result.message,
                    variant: "destructive"
                });
            }
        });
    }

    return (
        <Switch
            checked={isPremium}
            onCheckedChange={handleToggle}
            disabled={isPending}
            aria-label="Activar o desactivar Empresa Premium"
        />
    )
}
