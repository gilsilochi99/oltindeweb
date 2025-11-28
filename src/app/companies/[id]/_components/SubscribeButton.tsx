
'use client';

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export function SubscribeButton({ companyId, companyName }: { companyId: string, companyName: string }) {
    const { user, isSubscribed, addSubscription, removeSubscription, loading } = useAuth();
    const { toast } = useToast();
    const isSub = isSubscribed('company', companyId);

    const handleToggleSubscription = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Inicie sesión para suscribirse", variant: "destructive" });
            return;
        }

        if (isSub) {
            await removeSubscription('company', companyId);
            toast({ title: `Suscripción a ${companyName} cancelada` });
        } else {
            await addSubscription('company', companyId);
            toast({ title: `Suscrito a ${companyName}` });
        }
    };
    
    if (loading || !user) return null;

    return (
        <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 flex-shrink-0" onClick={handleToggleSubscription}>
            <Bell className={cn("w-5 h-5 transition-colors", isSub ? "text-accent fill-accent" : "text-muted-foreground")} />
            <span className="sr-only">{isSub ? 'Cancelar suscripción' : 'Suscribirse'}</span>
        </Button>
    )
}
