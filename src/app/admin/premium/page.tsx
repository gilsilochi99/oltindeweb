'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Loader2, Search, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { getPremiumFeatureAdminData, savePremiumFeatureRules } from '@/lib/premium-actions';
import { PREMIUM_FEATURE_KEYS, PREMIUM_FEATURES, type PremiumFeature, type PremiumFeatureRules } from '@/lib/premium-features';

type Category = { name: string; companies: number; premium: number };

const HINTS: Partial<Record<PremiumFeature, string>> = {
  rentals: 'Por ejemplo: inmobiliarias, agencias de alquiler de coches, hoteles.',
  menu: 'Si no la configura, solo la ven las categorías que contienen "restaurante".',
  shop: 'Comercios y tiendas que venden productos.',
};

function FeatureRuleCard({ feature, rules, categories, onChange }: {
  feature: PremiumFeature;
  rules: PremiumFeatureRules;
  categories: Category[];
  onChange: (rules: PremiumFeatureRules) => void;
}) {
  const [filter, setFilter] = useState('');
  const rule = rules[feature];
  const mode = rule?.mode ?? 'all';
  const selected = useMemo(() => new Set(rule?.mode === 'categories' ? rule.categories : []), [rule]);
  const visible = categories.filter(c => c.name.toLowerCase().includes(filter.trim().toLowerCase()));
  const premiumReached = categories.filter(c => selected.has(c.name)).reduce((s, c) => s + c.premium, 0);

  const setCategories = (next: Set<string>) => onChange({ ...rules, [feature]: { mode: 'categories', categories: [...next] } });
  const toggle = (name: string, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(name); else next.delete(name);
    setCategories(next);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">{PREMIUM_FEATURES[feature]}</CardTitle>
          {mode === 'all'
            ? <Badge variant="secondary">Todas las categorías</Badge>
            : <Badge>{selected.size} {selected.size === 1 ? 'categoría' : 'categorías'} · {premiumReached} Premium</Badge>}
        </div>
        {HINTS[feature] && <CardDescription>{HINTS[feature]}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={mode}
          onValueChange={v => onChange({ ...rules, [feature]: v === 'all' ? { mode: 'all' } : { mode: 'categories', categories: [...selected] } })}
          className="flex flex-wrap gap-6"
        >
          <div className="flex items-center gap-2"><RadioGroupItem value="all" id={`${feature}-all`} /><Label htmlFor={`${feature}-all`}>Todas las empresas Premium</Label></div>
          <div className="flex items-center gap-2"><RadioGroupItem value="categories" id={`${feature}-cat`} /><Label htmlFor={`${feature}-cat`}>Solo estas categorías</Label></div>
        </RadioGroup>

        {mode === 'categories' && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Buscar categoría..." className="pl-8" />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setCategories(new Set([...selected, ...visible.map(c => c.name)]))}>Marcar visibles</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCategories(new Set())}>Quitar todas</Button>
            </div>
            <ul className="max-h-72 overflow-y-auto rounded-md border divide-y">
              {visible.map(c => (
                <li key={c.name}>
                  <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 text-sm">
                    <Checkbox checked={selected.has(c.name)} onCheckedChange={v => toggle(c.name, v === true)} />
                    <span className="flex-1">{c.name}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {c.companies} {c.companies === 1 ? 'empresa' : 'empresas'}
                      {c.premium > 0 && <> · <Star className="inline w-3 h-3 -mt-0.5 fill-yellow-400 text-yellow-500" /> {c.premium}</>}
                    </span>
                  </label>
                </li>
              ))}
              {visible.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">Ninguna categoría coincide.</li>}
            </ul>
            {selected.size === 0 && <p className="text-sm text-destructive">Marque al menos una categoría.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PremiumFeaturesAdminPage() {
  const { toast } = useToast();
  const [data, setData] = useState<{ rules: PremiumFeatureRules; categories: Category[] } | null | 'forbidden'>(null);
  const [rules, setRules] = useState<PremiumFeatureRules>({});
  const [saved, setSaved] = useState('{}');
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    getPremiumFeatureAdminData().then(d => {
      if (!d) return setData('forbidden');
      setData(d);
      setRules(d.rules);
      setSaved(JSON.stringify(d.rules));
    });
  }, []);

  const dirty = JSON.stringify(rules) !== saved;

  const save = () => startSaving(async () => {
    const r = await savePremiumFeatureRules(rules);
    if (!r.success) {
      toast({ title: 'No se pudo guardar', description: r.message, variant: 'destructive' });
      return;
    }
    setSaved(JSON.stringify(rules));
    toast({ title: 'Reglas guardadas', description: 'Los paneles de las empresas ya muestran solo las funciones permitidas.' });
  });

  if (data === null) return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (data === 'forbidden') return <p className="text-muted-foreground">Solo un administrador puede ver esta página.</p>;

  return (
    <div className="space-y-6 max-w-4xl pb-24">
      <div>
        <h1 className="text-3xl font-bold font-headline">Funciones Premium por categoría</h1>
        <p className="text-muted-foreground mt-1">
          Decida qué funciones Premium puede usar cada categoría de empresa. La empresa sigue necesitando ser Premium;
          estas reglas limitan cada función a las categorías que la necesitan. Los administradores pueden gestionar cualquier empresa.
        </p>
      </div>

      {PREMIUM_FEATURE_KEYS.map(f => (
        <FeatureRuleCard key={f} feature={f} rules={rules} categories={data.categories} onChange={setRules} />
      ))}

      <div className="fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-end gap-3">
          {dirty && <span className="text-sm text-muted-foreground">Cambios sin guardar</span>}
          <Button variant="outline" disabled={!dirty || isSaving} onClick={() => setRules(JSON.parse(saved))}>Descartar</Button>
          <Button disabled={!dirty || isSaving} onClick={save}>{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Guardar reglas</Button>
        </div>
      </div>
    </div>
  );
}
