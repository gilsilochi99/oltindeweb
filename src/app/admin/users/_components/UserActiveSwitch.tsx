
'use client';

import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { setUserActive } from "@/lib/actions";
import { useTransition } from "react";

interface UserActiveSwitchProps {
    userId: string;
    isActive: boolean;
    onChanged?: () => void;
}

export function UserActiveSwitch({ userId, isActive, onChanged }: UserActiveSwitchProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleToggle = (checked: boolean) => {
        startTransition(async () => {
            const result = await setUserActive(userId, checked);
            if (result.success) {
                toast({
                    title: checked ? "Cuenta activada" : "Cuenta desactivada",
                    description: checked
                        ? "El usuario puede volver a iniciar sesión."
                        : "El usuario ya no puede iniciar sesión y su contenido público ha sido ocultado."
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
            aria-label="Activar o desactivar cuenta"
        />
    )
}
