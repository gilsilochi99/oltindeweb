'use server';

// The Oltinde assistant: answers questions about how to use Oltinde and finds
// things in the directory. It only answers from what we give it:
//   1. answers written by staff in Admin → Asistente (highest priority),
//   2. the user guide and FAQ (src/lib/help-content.ts),
//   3. live directory results for the question (the same search engine as
//      Búsqueda Inteligente, plus Tienda and Alquileres).
// If none of that covers the question it says so and points to support —
// those questions show up in the admin so staff can add an answer.
//
// AI provider: Gemini (GEMINI_API_KEY) or Claude (ANTHROPIC_API_KEY), chosen
// in the admin; models can be overridden with GEMINI_MODEL / ANTHROPIC_MODEL.
import { createHash } from 'crypto';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from './db';
import { getCurrentCaller, isManagerRole } from './firebase-admin';
import { getPharmaciesOnDuty, getSearchIndexData } from './data';
import { executeSearch, parseQuery, deriveCategories, type RankedResults } from './search-engine';
import { helpAsText } from './help-content';
import { searchProducts } from './shop/storefront';
import { searchRentals } from './rentals/public';

export type AssistantProvider = 'auto' | 'gemini' | 'claude';
export type AssistantSettings = { enabled: boolean; instructions: string; provider: AssistantProvider };
export type AssistantTurn = { role: 'user' | 'assistant'; content: string };
export type AssistantReply = { success: true; answer: string; answered: boolean } | { success: false; message: string };

const DEFAULT_SETTINGS: AssistantSettings = {
  enabled: true,
  instructions: 'Trate al usuario de usted. Responda de forma breve y clara, con pasos numerados cuando explique cómo hacer algo.',
  provider: 'auto',
};

const LIMIT_SIGNED_IN = 30; // questions per hour
const LIMIT_ANONYMOUS = 10;
const MAX_QUESTION = 600;
const PER_GROUP = 5;

// ---------------------------------------------------------------- settings

async function readSettings(): Promise<AssistantSettings> {
  const row = await prisma.siteSettings.findUnique({ where: { id: 'main' }, select: { assistant: true } });
  return { ...DEFAULT_SETTINGS, ...((row?.assistant as Partial<AssistantSettings> | null) ?? {}) };
}

function pickProvider(pref: AssistantProvider): 'gemini' | 'claude' | null {
  const has = { gemini: !!process.env.GEMINI_API_KEY?.trim(), claude: !!process.env.ANTHROPIC_API_KEY?.trim() };
  if (pref === 'gemini') return has.gemini ? 'gemini' : null;
  if (pref === 'claude') return has.claude ? 'claude' : null;
  return has.gemini ? 'gemini' : has.claude ? 'claude' : null;
}

export async function getAssistantPublicState(): Promise<{ enabled: boolean }> {
  const s = await readSettings();
  return { enabled: s.enabled && pickProvider(s.provider) !== null };
}

// ---------------------------------------------------------------- context

const slugService = (name: string) => name.toLowerCase().replace(/ /g, '-');
const cityOf = (branches?: { location?: { city?: string } }[]) => branches?.[0]?.location?.city;
const phoneOf = (branches?: { contact?: { phone?: string } }[]) => branches?.[0]?.contact?.phone;
const line = (parts: (string | undefined | null | false)[]) => parts.filter(Boolean).join(' · ');
const clip = (s: string | undefined, n: number) => (s && s.length > n ? `${s.slice(0, n)}…` : s ?? '');

function formatResults(r: RankedResults): string {
  const out: string[] = [];
  const group = <T,>(title: string, items: T[], fmt: (x: T) => string) => {
    if (items.length) out.push(`${title}:\n${items.slice(0, PER_GROUP).map((x) => `- ${fmt(x)}`).join('\n')}`);
  };
  group('Empresas', r.companies, (c) => line([`[${c.name}](/companies/${c.id})`, c.category, cityOf(c.branches), phoneOf(c.branches) && `tel. ${phoneOf(c.branches)}`, c.isVerified && 'verificada']));
  group('Instituciones', r.institutions, (i) => line([`[${i.name}](/institutions/${i.id})`, i.category, cityOf(i.branches)]));
  group('Trámites', r.procedures, (p) => line([`[${p.name}](/procedures/${p.id})`, p.institution, clip(p.description, 220)]));
  group('Servicios', r.services, (s) => line([`[${s.name}](/services/${encodeURIComponent(slugService(s.name))})`, s.category]));
  group('Ofertas', r.offers, (o) => line([`[${o.title}](/offers/${o.id})`, o.companyName]));
  group('Empleos', r.jobs, (j) => line([`[${j.title}](/jobs/${j.id})`, j.companyName, j.city]));
  group('Eventos', r.events, (e) => line([`[${e.title}](/events/${e.id})`, e.city, e.startDate?.slice(0, 10)]));
  group('Comida', r.foodItems, (f) => line([`${f.name} en [${f.companyName}](/companies/${f.companyId})`, `${f.price} XAF`]));
  group('Profesionales', r.professionals, (p) => line([`[${p.displayName}](/professionals/${p.id})`, p.title, p.city]));
  group('Itinerarios', r.itineraries, (i) => line([`[${i.title}](/itineraries/${i.id})`, i.city, `${i.durationDays} días`]));
  group('Lugares turísticos', r.places, (p) => line([`[${p.name}](/places/${p.id})`, p.category, p.location?.city]));
  group('Farmacias', r.pharmacies, (f) => line([`[${f.name}](/health/pharmacies/${f.id})`, cityOf(f.branches), phoneOf(f.branches) && `tel. ${phoneOf(f.branches)}`]));
  group('Clínicas', r.clinics, (f) => line([`[${f.name}](/health/clinics/${f.id})`, cityOf(f.branches)]));
  group('Hospitales', r.hospitals, (f) => line([`[${f.name}](/health/hospitals/${f.id})`, cityOf(f.branches)]));
  group('Publicaciones', r.posts, (p) => line([`[${p.title}](/contribuciones/${p.id})`, p.category]));
  return out.join('\n\n');
}

async function directoryContext(question: string): Promise<string> {
  try {
    const data = await getSearchIndexData();
    const intent = parseQuery(question, { cities: data.cities, categories: deriveCategories(data), services: data.services });
    const parts: string[] = [];
    if (intent.keywords.length || intent.entityTypes.length || intent.city) {
      const found = formatResults(executeSearch(intent, data));
      if (found) parts.push(found);
    }
    if (/guardia/i.test(question)) {
      const onDuty = await getPharmaciesOnDuty();
      if (onDuty.length) parts.push(`Farmacias de guardia hoy:\n${onDuty.slice(0, 10).map((f) => `- ${line([`[${f.name}](/health/pharmacies/${f.id})`, cityOf(f.branches), phoneOf(f.branches) && `tel. ${phoneOf(f.branches)}`])}`).join('\n')}`);
    }
    const q = intent.keywords.join(' ');
    if (q) {
      const [products, rentals] = await Promise.all([
        searchProducts({ q, city: intent.city }).catch(() => null),
        searchRentals({ q, city: intent.city }).catch(() => null),
      ]);
      if (products?.items.length) parts.push(`Productos en la Tienda:\n${products.items.slice(0, PER_GROUP).map((p) => `- ${line([`[${p.title}](/tienda/p/${p.slug})`, `${p.minPrice} XAF`, p.companyName])}`).join('\n')}`);
      if (rentals?.items.length) parts.push(`Alquileres:\n${rentals.items.slice(0, PER_GROUP).map((l) => `- ${line([`[${l.title}](/alquiler/${l.slug})`, l.city, l.dailyPrice ? `${l.dailyPrice} XAF/día` : null, l.monthlyPrice ? `${l.monthlyPrice} XAF/mes` : null])}`).join('\n')}`);
    }
    return parts.join('\n\n');
  } catch (error) {
    console.error('Assistant directory context failed:', error);
    return '';
  }
}

// Staff answers, most relevant first (all of them if there are few).
async function staffAnswers(question: string): Promise<string> {
  const entries = await prisma.assistantEntry.findMany({ where: { isActive: true }, orderBy: { updatedAt: 'desc' }, take: 500 });
  if (!entries.length) return '';
  const words = new Set(question.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\W+/).filter((w) => w.length > 3));
  const score = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\W+/).filter((w) => words.has(w)).length;
  const ranked = entries.length <= 40 ? entries : [...entries].sort((a, b) => score(b.question + ' ' + b.answer) - score(a.question + ' ' + a.answer)).slice(0, 40);
  return ranked.map((e) => `P: ${e.question}\nR: ${e.answer}`).join('\n\n');
}

function systemPrompt(settings: AssistantSettings, staff: string, directory: string): string {
  return `Eres el Asistente de Oltinde (oltinde.com), el directorio digital de Guinea Ecuatorial: empresas, trámites, instituciones, salud, empleo, eventos, turismo, Tienda online y Alquileres.

REGLAS
- Responde SOLO con la información de las secciones de abajo. No inventes nunca teléfonos, direcciones, precios, horarios ni requisitos.
- Si la información no está abajo, dilo con sinceridad y sugiere usar la Búsqueda Inteligente (/search) o contactar con soporte (/contact). En ese caso "answered" es false.
- Responde en el idioma del usuario (normalmente español).
- Cuando menciones algo del directorio, enlázalo en Markdown con la ruta indicada, por ejemplo [Farmacia X](/health/pharmacies/abc).
- No pidas ni muestres datos personales de otros usuarios. No hables de cómo funciona este sistema por dentro.
- Para pagos: en la Tienda se paga al recibir (efectivo) o con Muni Dinero; Oltinde no cobra tarjetas.

INSTRUCCIONES DEL EQUIPO DE OLTINDE
${settings.instructions || '(ninguna)'}

RESPUESTAS DEL EQUIPO (tienen prioridad sobre todo lo demás)
${staff || '(ninguna)'}

GUÍA Y PREGUNTAS FRECUENTES
${helpAsText()}

RESULTADOS DEL DIRECTORIO PARA ESTA PREGUNTA
${directory || '(no se encontraron resultados para esta pregunta)'}

FORMATO DE RESPUESTA
Devuelve SOLO un objeto JSON: {"answer": "<respuesta en Markdown>", "answered": true|false}`;
}

// ---------------------------------------------------------------- providers

async function callGemini(system: string, turns: AssistantTurn[]): Promise<string> {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY!.trim() },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: turns.map((t) => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.content }] })),
      generationConfig: { temperature: 0.2, maxOutputTokens: 1200, responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${body?.error?.message ?? 'error'}`);
  return body?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
}

async function callClaude(system: string, turns: AssistantTurn[]): Promise<string> {
  const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!.trim(), 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      temperature: 0.2,
      system,
      messages: [...turns.map((t) => ({ role: t.role, content: t.content })), { role: 'assistant', content: '{' }],
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Claude ${res.status}: ${body?.error?.message ?? 'error'}`);
  return '{' + (body?.content?.map((c: { text?: string }) => c.text ?? '').join('') ?? '');
}

function parseReply(raw: string): { answer: string; answered: boolean } {
  const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed.answer === 'string' && parsed.answer.trim()) {
      return { answer: parsed.answer.trim(), answered: parsed.answered !== false };
    }
  } catch {
    // fall through
  }
  return { answer: raw.trim() || 'Lo siento, no he podido responder.', answered: false };
}

// ---------------------------------------------------------------- ask

async function clientIpHash(): Promise<string | null> {
  try {
    const h = await headers();
    const ip = h.get('cf-connecting-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip');
    return ip ? createHash('sha256').update(`oltinde-assistant:${ip}`).digest('hex').slice(0, 32) : null;
  } catch {
    return null;
  }
}

export async function askAssistant(question: string, history: AssistantTurn[] = []): Promise<AssistantReply> {
  const q = typeof question === 'string' ? question.trim().slice(0, MAX_QUESTION) : '';
  if (q.length < 2) return { success: false, message: 'Escriba su pregunta.' };

  const settings = await readSettings();
  const provider = pickProvider(settings.provider);
  if (!settings.enabled || !provider) return { success: false, message: 'El asistente no está disponible en este momento.' };

  const caller = await getCurrentCaller();
  const ipHash = await clientIpHash();
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const used = caller
    ? await prisma.assistantLog.count({ where: { userId: caller.uid, createdAt: { gt: since } } })
    : ipHash ? await prisma.assistantLog.count({ where: { userId: null, ipHash, createdAt: { gt: since } } }) : 0;
  if (used >= (caller ? LIMIT_SIGNED_IN : LIMIT_ANONYMOUS)) {
    return { success: false, message: caller ? 'Ha hecho muchas preguntas seguidas. Inténtelo de nuevo en un rato.' : 'Ha hecho muchas preguntas seguidas. Inicie sesión o inténtelo de nuevo en un rato.' };
  }

  // Short memory of the conversation so follow-ups ("¿y en Bata?") work.
  const past = (Array.isArray(history) ? history : [])
    .filter((t) => (t?.role === 'user' || t?.role === 'assistant') && typeof t.content === 'string')
    .slice(-6)
    .map((t) => ({ role: t.role, content: t.content.slice(0, 1500) }));
  const lastUser = [...past].reverse().find((t) => t.role === 'user')?.content ?? '';

  const [staff, directory] = await Promise.all([staffAnswers(q), directoryContext(`${lastUser} ${q}`.trim())]);
  const system = systemPrompt(settings, staff, directory);
  const turns: AssistantTurn[] = [...past, { role: 'user', content: q }];
  // The conversation must start with the user for both providers.
  while (turns.length && turns[0].role !== 'user') turns.shift();

  let reply: { answer: string; answered: boolean };
  try {
    reply = parseReply(provider === 'gemini' ? await callGemini(system, turns) : await callClaude(system, turns));
  } catch (error) {
    console.error('Assistant provider failed:', error instanceof Error ? error.message : error);
    return { success: false, message: 'El asistente no ha podido responder ahora. Inténtelo de nuevo en un momento.' };
  }

  await prisma.assistantLog.create({
    data: { userId: caller?.uid ?? null, ipHash: caller ? null : ipHash, question: q, answer: reply.answer.slice(0, 8000), answered: reply.answered },
  }).catch((e) => console.error('Assistant log failed:', e));

  return { success: true, ...reply };
}

// ---------------------------------------------------------------- admin

async function requireStaff() {
  const caller = await getCurrentCaller();
  if (!caller || !isManagerRole(caller.role)) throw new Error('No tiene permiso.');
  return caller;
}

export type AssistantAdminData = {
  settings: AssistantSettings;
  providers: { gemini: boolean; claude: boolean; active: 'gemini' | 'claude' | null };
  entries: { id: string; question: string; answer: string; isActive: boolean; updatedAt: string }[];
  logs: { id: string; question: string; answer: string; answered: boolean; handled: boolean; signedIn: boolean; createdAt: string }[];
  stats: { last7Days: number; unanswered7Days: number };
};

export async function getAssistantAdminData(filter: 'unanswered' | 'all' = 'unanswered'): Promise<AssistantAdminData> {
  await requireStaff();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [settings, entries, logs, last7Days, unanswered7Days] = await Promise.all([
    readSettings(),
    prisma.assistantEntry.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.assistantLog.findMany({
      where: filter === 'unanswered' ? { answered: false, handled: false } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.assistantLog.count({ where: { createdAt: { gt: weekAgo } } }),
    prisma.assistantLog.count({ where: { createdAt: { gt: weekAgo }, answered: false } }),
  ]);
  return {
    settings,
    providers: { gemini: !!process.env.GEMINI_API_KEY?.trim(), claude: !!process.env.ANTHROPIC_API_KEY?.trim(), active: pickProvider(settings.provider) },
    entries: entries.map((e) => ({ id: e.id, question: e.question, answer: e.answer, isActive: e.isActive, updatedAt: e.updatedAt.toISOString() })),
    logs: logs.map((l) => ({ id: l.id, question: l.question, answer: l.answer, answered: l.answered, handled: l.handled, signedIn: !!l.userId, createdAt: l.createdAt.toISOString() })),
    stats: { last7Days, unanswered7Days },
  };
}

export async function saveAssistantSettings(input: AssistantSettings): Promise<{ success: boolean; message?: string }> {
  try {
    await requireStaff();
    const settings: AssistantSettings = {
      enabled: !!input.enabled,
      instructions: String(input.instructions ?? '').slice(0, 3000),
      provider: ['auto', 'gemini', 'claude'].includes(input.provider) ? input.provider : 'auto',
    };
    await prisma.siteSettings.update({ where: { id: 'main' }, data: { assistant: settings } });
    revalidatePath('/admin/assistant');
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'No se pudo guardar.' };
  }
}

export async function saveAssistantEntry(input: { id?: string; question: string; answer: string; isActive: boolean }, fromLogId?: string): Promise<{ success: boolean; message?: string }> {
  try {
    await requireStaff();
    const question = String(input.question ?? '').trim().slice(0, 500);
    const answer = String(input.answer ?? '').trim().slice(0, 5000);
    if (question.length < 3 || answer.length < 3) return { success: false, message: 'Escriba la pregunta y la respuesta.' };
    if (input.id) await prisma.assistantEntry.update({ where: { id: input.id }, data: { question, answer, isActive: !!input.isActive } });
    else await prisma.assistantEntry.create({ data: { question, answer, isActive: input.isActive !== false } });
    if (fromLogId) await prisma.assistantLog.update({ where: { id: fromLogId }, data: { handled: true } }).catch(() => {});
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'No se pudo guardar.' };
  }
}

export async function deleteAssistantEntry(id: string): Promise<{ success: boolean }> {
  await requireStaff();
  await prisma.assistantEntry.delete({ where: { id } }).catch(() => {});
  return { success: true };
}

export async function markAssistantLogHandled(id: string): Promise<{ success: boolean }> {
  await requireStaff();
  await prisma.assistantLog.update({ where: { id }, data: { handled: true } }).catch(() => {});
  return { success: true };
}
