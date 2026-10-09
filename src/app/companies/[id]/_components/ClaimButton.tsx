'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ShieldQuestion, Clock, Loader2, MailCheck } from "lucide-react";
import { createClaim } from "@/lib/actions";
import { getUserClaimForCompany } from "@/lib/data";
import { confirmClaimCode, getClaimOptions, requestClaimCode } from "@/lib/verification";
import { useTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Company, Claim } from "@/lib/types";

interface ClaimButtonProps {
    company: Company;
}

// Claiming a listing with no owner: the fast way is a code emailed to the
// address already on the listing (proves control of the business's email);
// otherwise a manual claim for staff to review.
export function ClaimButton({ company }: ClaimButtonProps) {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [existingClaim, setExistingClaim] = useState<Claim | undefined>(undefined);
    const [isCheckingClaim, setIsCheckingClaim] = useState(true);
    const [open, setOpen] = useState(false);
    const [codeTo, setCodeTo] = useState<string | undefined>();
    const [codeSent, setCodeSent] = useState(false);
    const [code, setCode] = useState('');

    useEffect(() => {
        if (!user) {
            setIsCheckingClaim(false);
            return;
        }
        setIsCheckingClaim(true);
        Promise.all([getUserClaimForCompany(company.id, user.uid), getClaimOptions(company.id)])
            .then(([claim, options]) => {
                setExistingClaim(claim);
                setCodeTo(options.codeTo);
            })
            .finally(() => setIsCheckingClaim(false));
    }, [company.id, user]);

    const start = () => {
        if (!user) {
            toast({ title: "Debe iniciar sesión", description: "Inicie sesión para reclamar esta empresa.", variant: "destructive" });
            return;
        }
        setOpen(true);
    };

    const sendCode = () => startTransition(async () => {
        const result = await requestClaimCode(company.id);
        if (result.success) {
            setCodeSent(true);
            toast({ title: "Código enviado", description: `Revise el correo ${result.sentTo}.` });
        } else {
            toast({ title: "No se pudo enviar", description: result.message, variant: "destructive" });
        }
    });

    const confirm = () => startTransition(async () => {
        const result = await confirmClaimCode(company.id, code);
        if (result.success) {
            toast({ title: "¡Listo! Ya gestiona esta empresa", description: "Puede editarla desde su panel y pedir el sello de verificado." });
            setOpen(false);
            router.push(`/dashboard/companies/${company.id}/verification`);
        } else {
            toast({ title: "Código no válido", description: result.message, variant: "destructive" });
        }
    });

    const manualClaim = () => startTransition(async () => {
        if (!user) return;
        const result = await createClaim({
            companyId: company.id,
            companyName: company.name,
            userId: user.uid,
            userName: user.displayName || "N/A",
            userEmail: user.email || "N/A",
        });
        if (result.success) {
            toast({ title: "Reclamación enviada", description: result.message });
            setExistingClaim({
                id: '', companyId: company.id, companyName: company.name, userId: user.uid,
                userName: user.displayName || "N/A", userEmail: user.email || "N/A", status: 'pending', createdAt: new Date().toISOString(),
            });
            setOpen(false);
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    });

    if (loading || company.ownerId) {
        return null; // Don't show if loading or already claimed
    }

    const pending = existingClaim?.status === 'pending';

    return (
        <>
            {pending && !codeTo ? (
                <Button disabled variant="outline">
                    <Clock className="mr-2 h-4 w-4" />
                    Reclamación pendiente
                </Button>
            ) : (
                <Button onClick={start} disabled={isCheckingClaim} variant={pending ? 'outline' : 'default'}>
                    {pending ? <Clock className="mr-2 h-4 w-4" /> : <ShieldQuestion className="mr-2 h-4 w-4" />}
                    {pending ? 'Reclamación pendiente · usar código' : '¿Es su empresa? Reclámela'}
                </Button>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gestionar {company.name}</DialogTitle>
                        <DialogDescription>
                            Demuestre que es el dueño para editar la ficha, responder reseñas y publicar en Oltinde.
                        </DialogDescription>
                    </DialogHeader>

                    {codeTo ? (
                        <div className="space-y-3 rounded-md border p-4">
                            <p className="font-semibold flex items-center gap-2"><MailCheck className="w-4 h-4" /> Opción rápida: código por email</p>
                            <p className="text-sm text-muted-foreground">
                                Enviaremos un código de 6 cifras al email de esta empresa, <span className="font-medium text-foreground">{codeTo}</span>. Si tiene acceso a ese correo, la empresa pasa a ser suya al momento.
                            </p>
                            {codeSent ? (
                                <div className="flex gap-2">
                                    <Input
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        inputMode="numeric"
                                        placeholder="123456"
                                        className="font-mono text-lg tracking-widest"
                                        autoFocus
                                    />
                                    <Button onClick={confirm} disabled={isPending || code.length !== 6}>
                                        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Confirmar
                                    </Button>
                                </div>
                            ) : (
                                <Button onClick={sendCode} disabled={isPending}>
                                    {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Enviar código
                                </Button>
                            )}
                            {codeSent && (
                                <button type="button" onClick={sendCode} disabled={isPending} className="text-xs underline text-muted-foreground">
                                    No me ha llegado: enviar otro
                                </button>
                            )}
                        </div>
                    ) : null}

                    <div className="space-y-2 rounded-md border p-4">
                        <p className="font-semibold">{codeTo ? 'No tengo acceso a ese correo' : 'Reclamación manual'}</p>
                        <p className="text-sm text-muted-foreground">
                            Nuestro equipo revisará su solicitud y le contactará. Tarda más, pero sirve si la ficha no tiene un email que usted controle.
                        </p>
                        <Button variant="outline" onClick={manualClaim} disabled={isPending || pending}>
                            {pending ? 'Ya tiene una reclamación en revisión' : 'Enviar reclamación para revisión'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
