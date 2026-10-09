'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bot, CheckCircle2, Loader2, Pencil, Plus, Trash2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AssistantMarkdown } from '@/components/shared/AssistantWidget';
import {
  deleteAssistantEntry, getAssistantAdminData, markAssistantLogHandled, saveAssistantEntry, saveAssistantSettings,
  type AssistantAdminData, type AssistantProvider, type AssistantSettings,
} from '@/lib/assistant';

type Draft = { id?: string; question: string; answer: string; isActive: boolean; fromLogId?: string };

// Admin → Asistente: turn the chatbot on/off, give it instructions, write
// answers it must use, and review what people asked — especially what it
// couldn't answer, to add those answers.
export default function AdminAssistantPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<'unanswered' | 'all'>('unanswered');
  const [data, setData] = useState<AssistantAdminData | null>(null);
  const [settings, setSettings] = useState<AssistantSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [savingEntry, setSavingEntry] = useState(false);

  const load = useCallback(async () => {
    const d = await getAssistantAdminData(filter);
    setData(d);
    setSettings((prev) => prev ?? d.settings);
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    const r = await saveAssistantSettings(settings);
    setSavingSettings(false);
    toast(r.success ? { title: 'Ajustes guardados' } : { title: 'No se pudo guardar', description: r.message, variant: 'destructive' });
    load();
  };

  const saveEntry = async () => {
    if (!draft) return;
    setSavingEntry(true);
    const r = await saveAssistantEntry(draft, draft.fromLogId);
    setSavingEntry(false);
    if (r.success) {
      toast({ title: 'Respuesta guardada', description: 'El asistente la usará desde ahora.' });
      setDraft(null);
      load();
    } else {
      toast({ title: 'No se pudo guardar', description: r.message, variant: 'destructive' });
    }
  };

  if (!data || !settings) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  const { providers, stats } = data;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><Bot className="w-7 h-7" /> Asistente</h1>
        <p className="text-muted-foreground">El chat de ayuda de la web y la app. Responde con sus respuestas, la guía, las preguntas frecuentes y los datos del directorio.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Preguntas (7 días)</p><p className="text-2xl font-bold">{stats.last7Days}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Sin respuesta (7 días)</p><p className="text-2xl font-bold">{stats.unanswered7Days}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Respuestas del equipo</p><p className="text-2xl font-bold">{data.entries.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ajustes</CardTitle>
          <CardDescription>
            Responde ahora: <span className="font-medium text-foreground">{providers.active === 'gemini' ? 'Google Gemini (IA)' : providers.active === 'claude' ? 'Anthropic Claude (IA)' : 'Asistente sin IA (gratis)'}</span>.
            {' '}Claves en el servidor: Gemini {providers.gemini ? '✓' : '✗'} · Claude {providers.claude ? '✓' : '✗'} (GEMINI_API_KEY / ANTHROPIC_API_KEY).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border p-4">
            <div>
              <Label className="text-base">Asistente activado</Label>
              <p className="text-sm text-muted-foreground">Muestra el botón «¿Necesita ayuda?» en la web y el asistente en la app.</p>
            </div>
            <Switch checked={settings.enabled} onCheckedChange={(v) => setSettings({ ...settings, enabled: v })} />
          </div>
          <div className="space-y-2 max-w-xs">
            <Label>Proveedor</Label>
            <Select value={settings.provider} onValueChange={(v) => setSettings({ ...settings, provider: v as AssistantProvider })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automático (IA si hay clave; si no, sin IA)</SelectItem>
                <SelectItem value="local">Sin IA (gratis)</SelectItem>
                <SelectItem value="gemini">Google Gemini</SelectItem>
                <SelectItem value="claude">Anthropic Claude</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Instrucciones (tono, estilo, qué destacar)</Label>
            <Textarea rows={4} value={settings.instructions} onChange={(e) => setSettings({ ...settings, instructions: e.target.value })} />
          </div>
          <Button onClick={saveSettings} disabled={savingSettings}>{savingSettings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Guardar ajustes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Preguntas de los usuarios</CardTitle>
            <CardDescription>Las que no supo responder aparecen aquí: escriba la respuesta y la usará la próxima vez.</CardDescription>
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="unanswered">Sin respuesta</TabsTrigger>
              <TabsTrigger value="all">Todas</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {data.logs.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{filter === 'unanswered' ? 'No hay preguntas pendientes.' : 'Todavía no hay preguntas.'}</p>
          ) : (
            <div className="space-y-3">
              {data.logs.map((l) => (
                <div key={l.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold flex-1 min-w-[12rem]">{l.question}</p>
                    {l.answered ? <Badge variant="secondary"><CheckCircle2 className="w-3 h-3 mr-1" />Respondida</Badge> : <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Sin respuesta</Badge>}
                    {l.handled && <Badge variant="outline">Atendida</Badge>}
                    <span className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString('es-ES')}{l.signedIn ? '' : ' · anónimo'}</span>
                  </div>
                  <details className="text-sm text-muted-foreground">
                    <summary className="cursor-pointer">Ver lo que respondió</summary>
                    <div className="mt-2 rounded bg-muted p-2 text-foreground"><AssistantMarkdown text={l.answer} /></div>
                  </details>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setDraft({ question: l.question, answer: '', isActive: true, fromLogId: l.id })}>
                      <Plus className="w-4 h-4 mr-1" />Escribir respuesta
                    </Button>
                    {!l.handled && (
                      <Button size="sm" variant="ghost" onClick={async () => { await markAssistantLogHandled(l.id); load(); }}>Descartar</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Respuestas del equipo</CardTitle>
            <CardDescription>Tienen prioridad sobre la guía y el directorio. Úselas para horarios de soporte, precios de Premium, políticas, etc.</CardDescription>
          </div>
          <Button onClick={() => setDraft({ question: '', answer: '', isActive: true })}><Plus className="w-4 h-4 mr-1" />Nueva</Button>
        </CardHeader>
        <CardContent>
          {data.entries.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Todavía no hay respuestas propias.</p>
          ) : (
            <div className="space-y-2">
              {data.entries.map((e) => (
                <div key={e.id} className="rounded-md border p-3 flex gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-semibold">{e.question} {!e.isActive && <Badge variant="outline" className="ml-1">Desactivada</Badge>}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{e.answer}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setDraft({ id: e.id, question: e.question, answer: e.answer, isActive: e.isActive })} aria-label="Editar"><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={async () => { await deleteAssistantEntry(e.id); load(); }} aria-label="Eliminar"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{draft?.id ? 'Editar respuesta' : 'Nueva respuesta'}</DialogTitle></DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Pregunta</Label>
                <Input value={draft.question} onChange={(e) => setDraft({ ...draft, question: e.target.value })} maxLength={500} placeholder="Ej: ¿Cuánto cuesta Premium?" />
              </div>
              <div className="space-y-2">
                <Label>Respuesta</Label>
                <Textarea rows={6} value={draft.answer} onChange={(e) => setDraft({ ...draft, answer: e.target.value })} placeholder="Puede incluir enlaces así: [Contacto](/contact)" />
              </div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={draft.isActive} onCheckedChange={(v) => setDraft({ ...draft, isActive: v })} />Activa</label>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDraft(null)}>Cancelar</Button>
            <Button onClick={saveEntry} disabled={savingEntry}>{savingEntry && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
