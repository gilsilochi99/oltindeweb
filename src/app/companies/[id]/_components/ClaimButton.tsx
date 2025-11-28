
'use client';

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ShieldQuestion } from "lucide-react";
import { createClaim } from "@/lib/actions";
import { useTransition } from "react";
import type { Company } from "@/lib/types";

interface ClaimButtonProps {
    company: Company;
}

export function ClaimButton({ company }: ClaimButtonProps) {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const handleClaim = () => {
        if (!user) {
            toast({
                title: "Debe iniciar sesión",
                description: "Por favor, inicie sesión para reclamar esta empresa.",
                variant: "destructive"
            });
            return;
        }

        startTransition(async () => {
            const result = await createClaim({
                companyId: company.id,
                companyName: company.name,
                userId: user.uid,
                userName: user.displayName || "N/A",
                userEmail: user.email || "N/A",
            });
            if (result.success) {
                toast({
                    title: "Reclamación Enviada",
                    description: result.message
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
    
    if (loading || company.ownerId) {
        return null; // Don't show if loading or already claimed
    }
    
    return (
        <Button onClick={handleClaim} disabled={isPending}>
            <ShieldQuestion className="mr-2 h-4 w-4" />
            {isPending ? 'Enviando...' : 'Reclamar esta Empresa'}
        </Button>
    )
}
