
'use client';

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ShieldQuestion, Clock } from "lucide-react";
import { createClaim } from "@/lib/actions";
import { getUserClaimForCompany } from "@/lib/data";
import { useTransition, useEffect, useState } from "react";
import type { Company, Claim } from "@/lib/types";

interface ClaimButtonProps {
    company: Company;
}

export function ClaimButton({ company }: ClaimButtonProps) {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [existingClaim, setExistingClaim] = useState<Claim | undefined>(undefined);
    const [isCheckingClaim, setIsCheckingClaim] = useState(true);

    useEffect(() => {
        if (!user) {
            setIsCheckingClaim(false);
            return;
        }
        setIsCheckingClaim(true);
        getUserClaimForCompany(company.id, user.uid)
            .then(setExistingClaim)
            .finally(() => setIsCheckingClaim(false));
    }, [company.id, user]);

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
                setExistingClaim({
                    id: '',
                    companyId: company.id,
                    companyName: company.name,
                    userId: user.uid,
                    userName: user.displayName || "N/A",
                    userEmail: user.email || "N/A",
                    status: 'pending',
                    createdAt: new Date().toISOString(),
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

    if (existingClaim?.status === 'pending') {
        return (
            <Button disabled variant="outline">
                <Clock className="mr-2 h-4 w-4" />
                Reclamación Pendiente
            </Button>
        );
    }

    return (
        <Button onClick={handleClaim} disabled={isPending || isCheckingClaim}>
            <ShieldQuestion className="mr-2 h-4 w-4" />
            {isPending ? 'Enviando...' : 'Reclamar esta Empresa'}
        </Button>
    )
}
