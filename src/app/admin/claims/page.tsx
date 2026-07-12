
'use client';

import { useEffect, useState, useTransition } from "react";
import { getClaims } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Claim } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { processClaim } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

function ClaimActions({ claim, onClaimProcessed }: { claim: Claim, onClaimProcessed: () => void }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleProcess = (approve: boolean) => {
        startTransition(async () => {
            const result = await processClaim({
                claimId: claim.id,
                companyId: claim.companyId,
                userId: claim.userId,
                approve,
            });

            if (result.success) {
                toast({
                    title: "Reclamación Procesada",
                    description: `La reclamación ha sido ${approve ? 'aprobada' : 'rechazada'}.`
                });
                onClaimProcessed();
            } else {
                toast({
                    title: "Error",
                    description: result.message,
                    variant: "destructive"
                });
            }
        });
    }

    if (claim.status !== 'pending') {
        return (
            <Badge variant={claim.status === 'approved' ? 'secondary' : 'destructive'} className={claim.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {claim.status === 'approved' ? 'Aprobada' : 'Rechazada'}
            </Badge>
        );
    }
    
    return (
        <div className="flex gap-2">
            <Button size="sm" onClick={() => handleProcess(true)} disabled={isPending}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : "Aprobar"}
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleProcess(false)} disabled={isPending}>
                 {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : "Rechazar"}
            </Button>
        </div>
    )
}


export default function AdminClaimsPage() {
    const [claims, setClaims] = useState<Claim[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    async function fetchClaims() {
        setIsLoading(true);
        const data = await getClaims();
        // Sort by date, newest first
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setClaims(data);
        setIsLoading(false);
    }

    useEffect(() => {
        fetchClaims();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline">Gestionar Reclamaciones de Empresas</h1>
                <p className="text-muted-foreground">Revisar y aprobar las solicitudes de los usuarios para gestionar sus perfiles de empresa.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Reclamaciones de Empresas ({claims.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="flex justify-center items-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Empresa Reclamada</TableHead>
                                    <TableHead>Usuario Solicitante</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {claims.map(claim => (
                                    <TableRow key={claim.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/companies/${claim.companyId}`} className="hover:underline text-primary" target="_blank">
                                                {claim.companyName}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <div>{claim.userName}</div>
                                            <div className="text-xs text-muted-foreground">{claim.userEmail}</div>
                                        </TableCell>
                                        <TableCell>{new Date(claim.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={claim.status === 'pending' ? 'default' : claim.status === 'approved' ? 'secondary' : 'destructive'}>{claim.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <ClaimActions claim={claim} onClaimProcessed={fetchClaims} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
