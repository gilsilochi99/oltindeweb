
'use client';

import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { setCompanyActive } from "@/lib/actions";
import { useTransition } from "react";

interface CompanyActiveSwitchProps {
    companyId: string;
    isActive: boolean;
    onChanged?: () => void;
}

export function CompanyActiveSwitch({ companyId, isActive, onChanged }: CompanyActiveSwitchProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleToggle = (checked: boolean) => {
        startTransition(async () => {
            const result = await setCompanyActive(companyId, checked);
            if (result.success) {
                toast({
                    title: checked ? "Empresa activada" : "Empresa desactivada",
                    description: checked
                        ? "La empresa vuelve a ser visible en el sitio."
                        : "La empresa, sus empleos, menú y anuncios ya no son visibles públicamente."
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
            checked={isActive}
            onCheckedChange={handleToggle}
            disabled={isPending}
            aria-label="Activar o desactivar empresa"
        />
    )
}
