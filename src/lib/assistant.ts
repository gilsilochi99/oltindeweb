'use server';

// The Oltinde assistant. Every fact the user sees comes from us — it is either
//   1. a help text as it was written (staff answers in Admin → Asistente, the
//      user guide, the FAQ — src/lib/help-content.ts), or
//   2. live results from the database (the same search engine as Búsqueda
//      Inteligente, plus Tienda and Alquileres), or
//   3. a fixed link for the user's own pages (orders, bookings…).
// If nothing fits it says so; those questions show up in the admin so staff
// can add an answer.
//
// The AI (optional) INTERPRETS the question — which help text fits, what to
// search for — and writes only the conversation around it (a short intro and
// a closing question), checked by safeChat() so it can't contain data. Our
// code places the facts from the database between them. Without an AI key, or
// when the AI fails, the no-AI engine (src/lib/assistant-local.ts) does the
// interpretation instead, with no conversational sentences.
//
// AI provider: OpenRouter free models (OPENROUTER_API_KEY), Gemini
// (GEMINI_API_KEY) or Claude (ANTHROPIC_API_KEY), chosen in the admin; models
// can be overridden with OPENROUTER_MODEL / GEMINI_MODEL / ANTHROPIC_MODEL.
import { createHash } from 'crypto';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from './db';
import { getCurrentCaller, isManagerRole } from './firebase-admin';
import { getUniqueCities } from './data';
import { directorySearch, type DirectoryFindings } from './assistant-context';
import type { RankedResults } from './search-engine';
import type { ProductListItem } from './shop/types';
import type { RentalListItem } from './rentals/types';
import {
  UNKNOWN_ANSWER, accountAnswer, accountIntent, buildIndex, builtInDocs, composeLocalAnswer, directoryQuery, normalize, questionKind,
  renderHelpDoc, safeChat, searchHelp, type AccountTopic, type HelpDoc,
} from './assistant-local';

// 'local' = no AI (src/lib/assistant-local.ts): free, always available.
// 'auto' = AI if a key is configured, otherwise local.
export type AssistantProvider = 'auto' | 'local' | 'openrouter' | 'gemini' | 'claude';
export type AssistantSettings = { enabled: boolean; instructions: string; provider: AssistantProvider };
export type AssistantTurn = { role: 'user' | 'assistant'; content: string };
export type AssistantReply =
  | {
      success: true;
      answer: string; // the whole answer as Markdown (older app versions show only this)
      answered: boolean;
      intro?: string; // the AI's checked opening sentence
      body?: string; // a stored text: help, account link, "not found"…
      cierre?: string; // the AI's checked closing question
      results: RankedResults | null; // directory results, to show as cards
      products: ProductListItem[];
      rentals: RentalListItem[];
      total: number;
      query?: { keywords: string; city?: string };
    }
  | { success: false; message: string };

const DEFAULT_SETTINGS: AssistantSettings = { enabled: true, instructions: '', provider: 'auto' };

// Questions per hour that may use the AI; beyond that, answers come from the
// no-AI engine. HARD_LIMIT stops abuse altogether.
const AI_LIMIT_SIGNED_IN = 40;
const AI_LIMIT_ANONYMOUS = 15;
const HARD_LIMIT = 300;
const MAX_QUESTION = 600;

// ---------------------------------------------------------------- settings

async function readSettings(): Promise<AssistantSettings> {
  const row = await prisma.siteSettings.findUnique({ where: { id: 'main' }, select: { assistant: true } });
  return { ...DEFAULT_SETTINGS, ...((row?.assistant as Partial<AssistantSettings> | null) ?? {}) };
}

// Which engine interprets the question. Without a usable AI key it's always
// the free local one.
type Engine = 'openrouter' | 'gemini' | 'claude' | 'local';

const keys = () => ({
  openrouter: !!process.env.OPENROUTER_API_KEY?.trim(),
  gemini: !!process.env.GEMINI_API_KEY?.trim(),
  claude: !!process.env.ANTHROPIC_API_KEY?.trim(),
});

function pickProvider(pref: AssistantProvider): Engine {
  const has = keys();
  if (pref === 'local') return 'local';
  if (pref === 'openrouter' || pref === 'gemini' || pref === 'claude') return has[pref] ? pref : 'local';
  return has.openrouter ? 'openrouter' : has.gemini ? 'gemini' : has.claude ? 'claude' : 'local';
}

export async function getAssistantPublicState(): Promise<{ enabled: boolean }> {
  const s = await readSettings();
  return { enabled: s.enabled };
}

// Every help text the assistant can show: staff answers first.
async function helpDocs(): Promise<HelpDoc[]> {
  const entries = await prisma.assistantEntry.findMany({ where: { isActive: true }, orderBy: { updatedAt: 'desc' }, take: 500 });
  return [
    ...entries.map((e) => ({ id: `staff-${e.id}`, source: 'staff' as const, title: e.question, text: e.answer })),
    ...builtInDocs(),
  ];
}

// ---------------------------------------------------------------- without AI

// An answer in parts, so the web and the app can show the directory part as
// cards. `body` is a stored text (help, account link, "not found"…).
type Reply = { intro?: string | null; body: string; cierre?: string | null; answered: boolean; dir?: DirectoryFindings };

async function localReply(q: string, lastUser: string, docs: HelpDoc[]): Promise<Reply> {
  const matches = searchHelp(buildIndex(docs), q, 3);
  const accountish = !!accountIntent(q);
  const wantsListings = questionKind(q) !== 'howto' || /\b(farmacia|guardia)\b/i.test(normalize(q));
  // Follow-ups like "¿y en Bata?" reuse what was asked just before.
  const shortFollowUp = q.split(/\s+/).length <= 4 && /^(y|tambien|en|de)\b/i.test(normalize(q).trim());
  const dirQuery = directoryQuery(shortFollowUp && lastUser ? `${lastUser} ${q}` : q);
  const dir = !accountish && wantsListings && dirQuery ? await directorySearch(dirQuery) : undefined;
  const c = composeLocalAnswer({ question: q, matches, directory: dir?.text ?? '', directoryStrong: dir?.strong });
  return { body: c.help, answered: c.answered, dir: c.showDirectory ? dir : undefined };
}

// ---------------------------------------------------------------- with AI: interpret + chat

// The AI decides what to show (a help text, a search, the user's own page)
// and writes the conversational wrapping: a short intro and an optional
// closing question. The facts in between are always placed by our code.
export type Interpretation = {
  tipo: 'ayuda' | 'buscar' | 'cuenta' | 'no_se';
  ayuda: string | null; // id of a help text
  buscar: string | null; // keywords for the directory search
  ciudad: string | null;
  cuenta: AccountTopic | null;
  intro: string | null; // checked by safeChat()
  cierre: string | null;
};

function interpreterPrompt(docs: HelpDoc[], cities: string[], recent: AssistantTurn[]): string {
  const convo = recent.map((t) => `${t.role === 'user' ? 'Usuario' : 'Asistente'}: ${t.content.replace(/\s+/g, ' ').slice(0, 300)}`).join('\n');
  return `Eres el Asistente de Oltinde (directorio de Guinea Ecuatorial: empresas, trámites, instituciones, salud y farmacias, empleo, eventos, turismo, Tienda online y Alquileres). Hablas con amabilidad, de usted, en el idioma del usuario.

IMPORTANTE: tú NO das datos. Nuestro sistema pondrá debajo de tu frase los datos reales (fichas, teléfonos, enlaces, textos de ayuda). Tú solo decides qué mostrar y escribes la conversación alrededor.

Devuelve SOLO este JSON:
{"tipo": "ayuda" | "buscar" | "cuenta" | "no_se", "ayuda": "<id de la lista AYUDA o null>", "buscar": "<palabras clave o null>", "ciudad": "<una de CIUDADES o null>", "cuenta": "pedidos" | "reservas" | "favoritos" | "notificaciones" | null, "intro": "<1 frase>", "cierre": "<1 pregunta corta o null>"}

Qué mostrar:
- "ayuda": pregunta cómo usar Oltinde (comprar, pagar, publicar, reservar, verificar, cuenta…). Pon el id de la AYUDA que de verdad la responde, o null.
- "buscar": quiere encontrar algo del directorio. Pon 1–4 palabras clave en español, sin la ciudad (ej. "abogados", "pasaporte", "farmacia de guardia", "alquiler coche", "hotel").
- Puede haber "ayuda" y "buscar" a la vez; "tipo" es lo principal.
- "cuenta": pregunta por SUS propios pedidos, reservas, favoritos o avisos.
- "no_se": no tiene que ver con Oltinde, o no hay AYUDA que la responda y no es una búsqueda.
- Usa la conversación reciente para entender seguimientos (ej. "¿y en Bata?").

Cómo escribir "intro" y "cierre":
- "intro": una frase natural que introduzca lo que se va a mostrar, sin afirmar que hay resultados (ej. "¡Claro! Le busco abogados en Bata." o "Le explico cómo pagar en la Tienda."). Si es "no_se", discúlpese con amabilidad.
- "cierre": opcional, una pregunta corta para seguir (ej. "¿Quiere que busque también en Malabo?").
- PROHIBIDO en intro y cierre: números, teléfonos, precios, direcciones, enlaces, emails, nombres de empresas o personas, requisitos o datos de cualquier tipo.
${convo ? `\nConversación reciente:\n${convo}\n` : ''}
CIUDADES: ${cities.join(', ')}

AYUDA (id | título):
${docs.map((d) => `${d.id} | ${d.title}`).join('\n')}`;
}

function parseInterpretation(raw: string, docs: HelpDoc[], cities: string[]): Interpretation | null {
  try {
    const j = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
    const tipo = ['ayuda', 'buscar', 'cuenta', 'no_se'].includes(j.tipo) ? j.tipo : null;
    if (!tipo) return null;
    // The AI only picks things that exist: anything else is dropped.
    const ayuda = typeof j.ayuda === 'string' && docs.some((d) => d.id === j.ayuda) ? j.ayuda : null;
    const buscar = typeof j.buscar === 'string' && j.buscar.trim() ? j.buscar.trim().slice(0, 80) : null;
    const ciudad = typeof j.ciudad === 'string' ? cities.find((c) => normalize(c) === normalize(j.ciudad)) ?? null : null;
    const cuenta = ['pedidos', 'reservas', 'favoritos', 'notificaciones'].includes(j.cuenta) ? j.cuenta : null;
    return { tipo, ayuda, buscar, ciudad, cuenta, intro: safeChat(j.intro), cierre: safeChat(j.cierre, 160) };
  } catch {
    return null;
  }
}

// Builds the answer: the AI's checked sentences around stored texts and
// database results.
async function answerFrom(i: Interpretation, docs: HelpDoc[]): Promise<Reply> {
  const base = { intro: i.intro, cierre: i.cierre };
  if (i.tipo === 'cuenta' && i.cuenta) {
    const a = accountAnswer(i.cuenta);
    if (a) return { ...base, body: a, answered: true };
  }
  const doc = i.ayuda ? docs.find((d) => d.id === i.ayuda) : undefined;
  const body = doc ? renderHelpDoc(doc) : '';
  if (i.buscar && i.tipo !== 'no_se') {
    const dir = await directorySearch(`${i.buscar}${i.ciudad ? ` ${i.ciudad}` : ''}`);
    if (dir.total) return { ...base, body, answered: true, dir };
    if (!doc) {
      return {
        ...base,
        body: `No he encontrado resultados para «${i.buscar}»${i.ciudad ? ` en ${i.ciudad}` : ''} en Oltinde. Pruebe con otras palabras.`,
        answered: false,
      };
    }
  }
  if (doc) return { ...base, body, answered: true };
  return { intro: i.intro, body: UNKNOWN_ANSWER, answered: false };
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
      generationConfig: { temperature: 0.2, maxOutputTokens: 300, responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${body?.error?.message ?? 'error'}`);
  return body?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
}

// OpenRouter (OpenAI-style API). Free models have daily limits and are
// sometimes busy, so it tries each model in turn: OPENROUTER_MODEL (a
// comma-separated list) or, by default, OpenRouter's own free router and then
// Google's Gemma.
const OPENROUTER_DEFAULT_MODELS = ['openrouter/free', 'google/gemma-4-31b-it:free', 'google/gemma-4-26b-a4b-it:free', 'nvidia/nemotron-3-super-120b-a12b:free'];

async function callOpenRouter(system: string, turns: AssistantTurn[]): Promise<string> {
  const models = (process.env.OPENROUTER_MODEL?.split(',').map((m) => m.trim()).filter(Boolean)) || OPENROUTER_DEFAULT_MODELS;
  let lastError = 'sin modelos';
  for (const model of models.length ? models : OPENROUTER_DEFAULT_MODELS) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY!.trim()}`,
          'HTTP-Referer': 'https://oltinde.com',
          'X-Title': 'Oltinde',
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 300,
          response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: system }, ...turns.map((t) => ({ role: t.role, content: t.content }))],
        }),
        signal: AbortSignal.timeout(30_000),
      });
      const body = await res.json().catch(() => ({}));
      const text: string = body?.choices?.[0]?.message?.content ?? '';
      if (res.ok && text.trim()) return text;
      lastError = `${model} ${res.status}: ${body?.error?.message ?? 'respuesta vacía'}`;
    } catch (error) {
      lastError = `${model}: ${error instanceof Error ? error.message : 'error'}`;
    }
  }
  throw new Error(`OpenRouter ${lastError}`);
}

async function callClaude(system: string, turns: AssistantTurn[]): Promise<string> {
  const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!.trim(), 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model,
      max_tokens: 300,
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

// What the screens receive: the parts (to show results as cards) and the
// same answer as one Markdown text (for app versions that only read `answer`).
function toPublic(r: Reply): AssistantReply {
  const listing = r.dir?.total ? `${r.body ? 'También he encontrado' : 'Esto es lo que he encontrado'} en Oltinde:\n\n${r.dir.text}` : '';
  return {
    success: true,
    answer: [r.intro, r.body, listing, r.cierre].filter(Boolean).join('\n\n'),
    answered: r.answered,
    intro: r.intro ?? undefined,
    body: r.body || undefined,
    cierre: r.cierre ?? undefined,
    results: r.dir?.results ?? null,
    products: r.dir?.products ?? [],
    rentals: r.dir?.rentals ?? [],
    total: r.dir?.total ?? 0,
    query: r.dir?.total ? r.dir.query : undefined,
  };
}

export async function askAssistant(question: string, history: AssistantTurn[] = []): Promise<AssistantReply> {
  const q = typeof question === 'string' ? question.trim().slice(0, MAX_QUESTION) : '';
  if (q.length < 2) return { success: false, message: 'Escriba su pregunta.' };

  const settings = await readSettings();
  if (!settings.enabled) return { success: false, message: 'El asistente no está disponible en este momento.' };

  const caller = await getCurrentCaller();
  const ipHash = await clientIpHash();
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const used = caller
    ? await prisma.assistantLog.count({ where: { userId: caller.uid, createdAt: { gt: since } } })
    : ipHash ? await prisma.assistantLog.count({ where: { userId: null, ipHash, createdAt: { gt: since } } }) : 0;
  if (used >= HARD_LIMIT) return { success: false, message: 'Ha hecho muchas búsquedas seguidas. Inténtelo de nuevo en un rato.' };
  // Past the AI allowance it keeps working, just without AI (saves the free quota).
  const provider = used >= (caller ? AI_LIMIT_SIGNED_IN : AI_LIMIT_ANONYMOUS) ? 'local' : pickProvider(settings.provider);

  // Recent conversation, to understand follow-ups ("¿y en Bata?").
  const recent = (Array.isArray(history) ? history : [])
    .filter((t) => (t?.role === 'user' || t?.role === 'assistant') && typeof t.content === 'string')
    .slice(-6)
    .map((t) => ({ role: t.role, content: t.content.slice(0, 600) }));
  const lastUser = [...recent].reverse().find((t) => t.role === 'user')?.content.slice(0, 300) ?? '';

  const docs = await helpDocs();
  let reply: Reply | null = null;
  if (provider !== 'local') {
    try {
      const cities = await getUniqueCities();
      const system = interpreterPrompt(docs, cities, recent);
      const turns: AssistantTurn[] = [{ role: 'user', content: q }];
      const raw = provider === 'openrouter' ? await callOpenRouter(system, turns) : provider === 'gemini' ? await callGemini(system, turns) : await callClaude(system, turns);
      const interpretation = parseInterpretation(raw, docs, cities);
      if (interpretation) reply = await answerFrom(interpretation, docs);
      else console.error('Assistant: unreadable interpretation, answering without AI:', raw.slice(0, 200));
    } catch (error) {
      // Out of quota, network… interpret without AI instead of failing.
      console.error('Assistant provider failed, answering without AI:', error instanceof Error ? error.message : error);
    }
  }
  if (!reply) reply = await localReply(q, lastUser, docs);
  const out = toPublic(reply);

  await prisma.assistantLog.create({
    data: { userId: caller?.uid ?? null, ipHash: caller ? null : ipHash, question: q, answer: out.success ? out.answer.slice(0, 8000) : '', answered: reply.answered },
  }).catch((e) => console.error('Assistant log failed:', e));

  return out;
}

// ---------------------------------------------------------------- admin

async function requireStaff() {
  const caller = await getCurrentCaller();
  if (!caller || !isManagerRole(caller.role)) throw new Error('No tiene permiso.');
  return caller;
}

export type AssistantAdminData = {
  settings: AssistantSettings;
  providers: { openrouter: boolean; gemini: boolean; claude: boolean; active: Engine };
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
    providers: { ...keys(), active: pickProvider(settings.provider) },
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
      provider: ['auto', 'local', 'openrouter', 'gemini', 'claude'].includes(input.provider) ? input.provider : 'auto',
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
