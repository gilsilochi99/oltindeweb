
'use client';

import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { toggleCompanyFeaturedStatus } from "@/lib/actions";
import { useTransition } from "react";

interface FeaturedSwitchProps {
    companyId: string;
    isFeatured: boolean;
}

export function FeaturedSwitch({ companyId, isFeatured }: FeaturedSwitchProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleToggle = () => {
        startTransition(async () => {
            const result = await toggleCompanyFeaturedStatus(companyId);
            if (result.success) {
                toast({
                    title: "Estado Actualizado",
                    description: `La empresa ahora está ${result.newState ? 'destacada' : 'no destacada'}.`
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
            checked={isFeatured}
            onCheckedChange={handleToggle}
            disabled={isPending}
            aria-label="Destacar empresa"
        />
    )
}
