
'use client';

import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { toggleCompanyVerification } from "@/lib/actions";
import { useState, useTransition } from "react";

interface VerificationSwitchProps {
    companyId: string;
    isVerified: boolean;
}

export function VerificationSwitch({ companyId, isVerified }: VerificationSwitchProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleToggle = () => {
        startTransition(async () => {
            const result = await toggleCompanyVerification(companyId);
            if (result.success) {
                toast({
                    title: "Estado Actualizado",
                    description: `La empresa ahora está ${result.newState ? 'verificada' : 'no verificada'}.`
                });
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
            checked={isVerified}
            onCheckedChange={handleToggle}
            disabled={isPending}
            aria-label="Verificación de la empresa"
        />
    )
}
