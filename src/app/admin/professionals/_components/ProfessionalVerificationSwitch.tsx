
'use client';

import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { toggleProfessionalVerification } from "@/lib/actions";
import { useTransition } from "react";

interface ProfessionalVerificationSwitchProps {
    professionalId: string;
    isVerified: boolean;
}

export function ProfessionalVerificationSwitch({ professionalId, isVerified }: ProfessionalVerificationSwitchProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleToggle = () => {
        startTransition(async () => {
            const result = await toggleProfessionalVerification(professionalId);
            if (result.success) {
                toast({
                    title: "Estado Actualizado",
                    description: `El profesional ahora está ${result.newState ? 'verificado' : 'no verificado'}.`
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
            aria-label="Verificación del profesional"
        />
    )
}
