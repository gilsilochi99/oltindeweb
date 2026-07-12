

'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateUserRole } from "@/lib/actions";
import { MoreHorizontal, Shield, User, Briefcase, ShieldAlert } from "lucide-react";
import type { AppUser } from "@/lib/types";

interface RoleManagerProps {
    userId: string;
    currentRole: AppUser['role'];
}

export function RoleManager({ userId, currentRole }: RoleManagerProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleRoleChange = (newRole: AppUser['role']) => {
        if (newRole === currentRole) return;

        startTransition(async () => {
            const result = await updateUserRole(userId, newRole || 'user');
            if (result.success) {
                toast({
                    title: "Rol Actualizado",
                    description: `El usuario ahora es ${newRole}.`
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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isPending}>
                    <MoreHorizontal className="w-4 h-4"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Cambiar Rol</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleRoleChange('user')} disabled={currentRole === 'user'}>
                    <User className="mr-2 h-4 w-4" />
                    Convertir en Usuario
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleChange('editor')} disabled={currentRole === 'editor'}>
                    <Briefcase className="mr-2 h-4 w-4" />
                    Convertir en Editor
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => handleRoleChange('manager')} disabled={currentRole === 'manager'}>
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Convertir en Manager
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => handleRoleChange('admin')} disabled={currentRole === 'admin'}>
                    <Shield className="mr-2 h-4 w-4" />
                    Convertir en Admin
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
