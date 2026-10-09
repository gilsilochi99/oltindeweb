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
import { helpAsText } from './help-content';
import { directoryContext, directorySearch } from './assistant-context';
import { accountIntent, buildIndex, builtInDocs, composeLocalAnswer, directoryQuery, normalize, questionKind, searchHelp, type HelpDoc } from './assistant-local';

// 'local' = no AI (src/lib/assistant-local.ts): free, always available.
// 'auto' = AI if a key is configured, otherwise local.
export type AssistantProvider = 'auto' | 'local' | 'gemini' | 'claude';
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

// ---------------------------------------------------------------- settings

async function readSettings(): Promise<AssistantSettings> {
  const row = await prisma.siteSettings.findUnique({ where: { id: 'main' }, select: { assistant: true } });
  return { ...DEFAULT_SETTINGS, ...((row?.assistant as Partial<AssistantSettings> | null) ?? {}) };
}

// Which engine answers. Without a usable AI key it's always the free local one.
function pickProvider(pref: AssistantProvider): 'gemini' | 'claude' | 'local' {
  const has = { gemini: !!process.env.GEMINI_API_KEY?.trim(), claude: !!process.env.ANTHROPIC_API_KEY?.trim() };
  if (pref === 'local') return 'local';
  if (pref === 'gemini') return has.gemini ? 'gemini' : 'local';
  if (pref === 'claude') return has.claude ? 'claude' : 'local';
  return has.gemini ? 'gemini' : has.claude ? 'claude' : 'local';
}

export async function getAssistantPublicState(): Promise<{ enabled: boolean }> {
  const s = await readSettings();
  return { enabled: s.enabled };
}

// The answer without AI: best matching staff answer / guide / FAQ text, plus
// directory results when the question is looking for something.
async function localReply(q: string, lastUser: string): Promise<{ answer: string; answered: boolean }> {
  const entries = await prisma.assistantEntry.findMany({ where: { isActive: true }, orderBy: { updatedAt: 'desc' }, take: 500 });
  const docs: HelpDoc[] = [
    ...entries.map((e) => ({ id: `staff-${e.id}`, source: 'staff' as const, title: e.question, text: e.answer })),
    ...builtInDocs(),
  ];
  const matches = searchHelp(buildIndex(docs), q, 3);
  const accountish = !!accountIntent(q);
  const wantsListings = questionKind(q) !== 'howto' || /\b(farmacia|guardia)\b/i.test(normalize(q));
  // Follow-ups like "¿y en Bata?" reuse what was asked just before.
  const shortFollowUp = q.split(/\s+/).length <= 4 && /^(y|tambien|en|de)\b/i.test(normalize(q).trim());
  const dirQuery = directoryQuery(shortFollowUp && lastUser ? `${lastUser} ${q}` : q);
  const dir = !accountish && wantsListings && dirQuery ? await directorySearch(dirQuery) : { text: '', strong: false };
  return composeLocalAnswer({ question: q, matches, directory: dir.text, directoryStrong: dir.strong });
}

// Staff answers, most relevant first (all of them if there are few).
async function staffAnswers(question: string): Promise<string> {
  const entries = await prisma.assistantEntry.findMany({ where: { isActive: true }, orderBy: { updatedAt: 'desc' }, take: 500 });
  if (!entries.length) return '';
  const words = new Set(question.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').split(/\W+/).filter((w) => w.length > 3));
  const score = (t: string) => t.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').split(/\W+/).filter((w) => words.has(w)).length;
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
  if (!settings.enabled) return { success: false, message: 'El asistente no está disponible en este momento.' };

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

  let reply: { answer: string; answered: boolean };
  if (provider === 'local') {
    reply = await localReply(q, lastUser);
  } else {
    const [staff, directory] = await Promise.all([staffAnswers(q), directoryContext(`${lastUser} ${q}`.trim())]);
    const system = systemPrompt(settings, staff, directory);
    const turns: AssistantTurn[] = [...past, { role: 'user', content: q }];
    // The conversation must start with the user for both providers.
    while (turns.length && turns[0].role !== 'user') turns.shift();
    try {
      reply = parseReply(provider === 'gemini' ? await callGemini(system, turns) : await callClaude(system, turns));
    } catch (error) {
      // Out of quota, network… answer without AI instead of failing.
      console.error('Assistant provider failed, answering without AI:', error instanceof Error ? error.message : error);
      reply = await localReply(q, lastUser);
    }
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
  providers: { gemini: boolean; claude: boolean; active: 'gemini' | 'claude' | 'local' };
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
      provider: ['auto', 'local', 'gemini', 'claude'].includes(input.provider) ? input.provider : 'auto',
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
