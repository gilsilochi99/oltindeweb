
'use client';

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function FavoriteButton({ procedureId }: { procedureId: string }) {
    const { user, isFavorite, addFavorite, removeFavorite, loading } = useAuth();
    const { toast } = useToast();
    const isFav = isFavorite('procedure', procedureId);

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Inicie sesión para guardar favoritos", variant: "destructive" });
            return;
        }

        if (isFav) {
            await removeFavorite('procedure', procedureId);
            toast({ title: "Eliminado de favoritos" });
        } else {
            await addFavorite('procedure', procedureId);
            toast({ title: "Añadido a favoritos" });
        }
    };
    
    if (loading) return null;

    return (
        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 flex-shrink-0" onClick={handleToggleFavorite}>
            <Star className={cn("w-5 h-5 transition-colors", isFav ? "text-accent fill-accent" : "text-muted-foreground")} />
            <span className="sr-only">Añadir a favoritos</span>
        </Button>
    )
}
