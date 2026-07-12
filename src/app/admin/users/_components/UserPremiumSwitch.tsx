
'use client';

import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { toggleUserPremiumStatus } from "@/lib/actions";
import { useTransition } from "react";

interface UserPremiumSwitchProps {
    userId: string;
    isPremium: boolean;
}

export function UserPremiumSwitch({ userId, isPremium }: UserPremiumSwitchProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleToggle = () => {
        startTransition(async () => {
            const result = await toggleUserPremiumStatus(userId);
            if (result.success) {
                toast({
                    title: "Estado Actualizado",
                    description: `El usuario ahora es ${result.newState ? 'premium' : 'no premium'}.`
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
            checked={isPremium}
            onCheckedChange={handleToggle}
            disabled={isPending}
            aria-label="Marcar como premium"
        />
    )
}
