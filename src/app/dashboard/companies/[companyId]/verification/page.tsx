'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BadgeCheck, Clock, FileText, Loader2, ShieldAlert, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getCompanyById } from '@/lib/data';
import { getVerificationState, submitVerification, type VerificationDoc, type VerificationState } from '@/lib/verification';
import type { Company } from '@/lib/types';

const KINDS: { kind: VerificationDoc['kind']; title: string; help: string }[] = [
  { kind: 'business', title: 'Documento de la empresa', help: 'Registro mercantil, licencia de apertura o documento fiscal (NIF) a nombre de la empresa.' },
  { kind: 'identity', title: 'Su documento de identidad', help: 'DNI o pasaporte de la persona que gestiona la empresa.' },
];

// The owner asks for the "Negocio verificado" badge by sending proof. Files
// go to the private folder via /api/verification-docs; staff review them in
// Admin → Verificaciones.
export default function CompanyVerificationPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [state, setState] = useState<VerificationState | null | undefined>(undefined);
  const [docs, setDocs] = useState<VerificationDoc[]>([]);
  const [uploading, setUploading] = useState<VerificationDoc['kind'] | null>(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const [c, s] = await Promise.all([getCompanyById(companyId), getVerificationState(companyId)]);
    setCompany(c ?? null);
    setState(s);
  }, [companyId]);
  useEffect(() => { load(); }, [load]);

  const upload = async (kind: VerificationDoc['kind'], file: File) => {
    setUploading(kind);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('companyId', companyId);
      const res = await fetch('/api/verification-docs', { method: 'POST', body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'No se pudo subir el archivo.');
      setDocs((prev) => [...prev.filter((d) => d.kind !== kind), { kind, key: body.key, name: body.name }]);
    } catch (e) {
      toast({ title: 'No se pudo subir', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  const send = async () => {
    setSending(true);
    const result = await submitVerification(companyId, docs, note);
    setSending(false);
    if (result.success) {
      toast({ title: 'Solicitud enviada', description: 'Le avisaremos cuando la revisemos (normalmente en 1–3 días).' });
      setDocs([]);
      setNote('');
      load();
    } else {
      toast({ title: 'No se pudo enviar', description: result.message, variant: 'destructive' });
    }
  };

  if (state === undefined) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (state === null || !company) return <p className="py-16 text-center text-muted-foreground">Solo el dueño de la empresa puede ver esta página.</p>;

  const latest = state.latest;
  const pending = latest?.status === 'pending';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Volver al panel</Link>
        <h1 className="text-3xl font-bold font-headline mt-2">Verificación del negocio</h1>
        <p className="text-muted-foreground">{company.name}</p>
      </div>

      {state.isVerified ? (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="p-5 flex gap-3">
            <BadgeCheck className="w-6 h-6 text-green-700 shrink-0" />
            <div>
              <p className="font-semibold">Su empresa tiene el sello de Negocio verificado.</p>
              {state.verifiedUntil && (
                <p className="text-sm text-muted-foreground">Válido hasta el {new Date(state.verifiedUntil).toLocaleDateString('es-ES')}. Le avisaremos para renovarlo.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : pending ? (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-5 flex gap-3">
            <Clock className="w-6 h-6 text-amber-700 shrink-0" />
            <div>
              <p className="font-semibold">Su solicitud está en revisión.</p>
              <p className="text-sm text-muted-foreground">Enviada el {new Date(latest!.createdAt).toLocaleDateString('es-ES')}. Le avisaremos por la app y por email.</p>
            </div>
          </CardContent>
        </Card>
      ) : latest?.status === 'rejected' ? (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-5 flex gap-3">
            <ShieldAlert className="w-6 h-6 text-red-700 shrink-0" />
            <div>
              <p className="font-semibold">Su última solicitud no se aprobó.</p>
              {latest.reviewNote && <p className="text-sm">Motivo: {latest.reviewNote}</p>}
              <p className="text-sm text-muted-foreground">Corrija lo indicado y envíela de nuevo.</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!pending && (
        <Card>
          <CardHeader>
            <CardTitle>{state.isVerified ? 'Renovar la verificación' : 'Pedir el sello de Negocio verificado'}</CardTitle>
            <CardDescription>
              El sello indica a los clientes que Oltinde ha comprobado que la empresa existe y que usted la gestiona. Sus documentos son privados: solo los ve el equipo de Oltinde y nunca se publican.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {KINDS.map(({ kind, title, help }) => {
              const doc = docs.find((d) => d.kind === kind);
              return (
                <div key={kind} className="space-y-2 rounded-md border p-4">
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground">{help}</p>
                  {doc ? (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4" />
                      <span className="flex-1 truncate">{doc.name}</span>
                      <Button variant="ghost" size="icon" onClick={() => setDocs((prev) => prev.filter((d) => d.kind !== kind))} aria-label="Quitar"><X className="w-4 h-4" /></Button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-dashed px-3 py-2 text-sm hover:bg-muted">
                      {uploading === kind ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading === kind ? 'Subiendo…' : 'Elegir PDF o foto'}
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={!!uploading}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(kind, f); e.target.value = ''; }}
                      />
                    </label>
                  )}
                </div>
              );
            })}
            <div className="space-y-2">
              <p className="text-sm font-medium">Comentario para el equipo (opcional)</p>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Ej: la licencia está a nombre de la sociedad, yo soy el administrador." />
            </div>
            <Button onClick={send} disabled={sending || docs.length < 2}>
              {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Enviar para revisión
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
