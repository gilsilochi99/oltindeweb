'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { getVerificationRequests, reviewVerification, type AdminVerificationRow } from '@/lib/verification';

const KIND_LABEL = { business: 'Documento de la empresa', identity: 'Documento de identidad' } as const;
type Tab = 'pending' | 'approved' | 'rejected';

// Staff review of "Negocio verificado" requests: open the private documents,
// compare with the listing (name, NIF/CIF), approve or reject with a reason.
export default function AdminVerificationsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('pending');
  const [rows, setRows] = useState<AdminVerificationRow[] | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    setRows(await getVerificationRequests(tab));
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  const review = async (id: string, approve: boolean) => {
    setBusy(id);
    const result = await reviewVerification(id, approve, reasons[id]);
    setBusy(null);
    if (result.success) {
      toast({ title: approve ? 'Empresa verificada' : 'Solicitud rechazada', description: 'Se ha avisado al dueño por la app y por email.' });
      load();
    } else {
      toast({ title: 'No se pudo guardar', description: result.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><BadgeCheck className="w-7 h-7" /> Verificaciones</h1>
        <p className="text-muted-foreground">Compruebe que los documentos corresponden a la empresa y a la persona que la gestiona. El sello dura un año.</p>
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="approved">Aprobadas</TabsTrigger>
          <TabsTrigger value="rejected">Rechazadas</TabsTrigger>
        </TabsList>
      </Tabs>

      {!rows ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No hay solicitudes {tab === 'pending' ? 'pendientes' : tab === 'approved' ? 'aprobadas' : 'rechazadas'}.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  {r.companyName}
                  <Link href={`/companies/${r.companyId}`} target="_blank" className="text-sm font-normal underline inline-flex items-center gap-1">Ver ficha <ExternalLink className="w-3.5 h-3.5" /></Link>
                </CardTitle>
                <CardDescription>
                  Pedida por {r.userName} ({r.userEmail}) el {new Date(r.createdAt).toLocaleDateString('es-ES')}
                  {r.companyCif ? ` · NIF/CIF en la ficha: ${r.companyCif}` : ' · La ficha no tiene NIF/CIF'}
                  {r.companyEmail ? ` · Email de la ficha: ${r.companyEmail}` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {r.documents.map((d) => (
                    <Button key={d.key} variant="outline" size="sm" asChild>
                      <a href={`/api/verification-docs?key=${encodeURIComponent(d.key)}`} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-4 h-4 mr-2" />{KIND_LABEL[d.kind]}
                      </a>
                    </Button>
                  ))}
                </div>
                {r.note && <p className="text-sm"><span className="font-semibold">Comentario del dueño:</span> {r.note}</p>}
                {r.status === 'pending' ? (
                  <div className="space-y-2">
                    <Textarea
                      rows={2}
                      placeholder="Motivo (obligatorio si rechaza). Ej: el documento está caducado o no coincide el nombre."
                      value={reasons[r.id] ?? ''}
                      onChange={(e) => setReasons((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => review(r.id, true)} disabled={busy === r.id}>
                        {busy === r.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Aprobar y verificar
                      </Button>
                      <Button variant="outline" className="text-destructive" onClick={() => review(r.id, false)} disabled={busy === r.id}>Rechazar</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {r.status === 'approved' ? 'Aprobada' : 'Rechazada'}{r.reviewedAt ? ` el ${new Date(r.reviewedAt).toLocaleDateString('es-ES')}` : ''}{r.reviewNote ? ` · ${r.reviewNote}` : ''}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
