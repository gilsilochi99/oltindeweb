// The assistant without AI: finds the best answer among the staff answers,
// the user guide and the FAQ (a small BM25 search with Spanish synonyms),
// and adds directory results from the same engine as Búsqueda Inteligente.
// Free, instant, and it can only say things we wrote.
//
// Pure functions (no database access) so it can be tested and tuned offline;
// src/lib/assistant.ts feeds it the data.
import { FAQ_ITEMS, GUIDE_SECTIONS } from './help-content';

export type HelpDoc = { id: string; source: 'staff' | 'faq' | 'guide'; title: string; text: string; link?: string };
export type LocalMatch = { doc: HelpDoc; score: number; coverage: number };

// ---------------------------------------------------------------- text

const STOPWORDS = new Set((
  'a al algo algun alguna algunas alguno algunos ante antes aqui asi aun cada como con contra cual cuales cuando de del desde donde dos el ella ellas ellos en entre era es esa esas ese eso esos esta estan estas este esto estos fue ha hace hacer hay la las le les lo los mas me mi mis mucho muy nada ni no nos nosotros o os otra otro para pero poco por porque pues que quien se sea ser si sin sobre solo son su sus tambien tanto te tengo tiene tu tus un una uno unos unas usted ustedes vez y ya yo hola buenas buenos dias tardes noches gracias favor quiero queria quisiera necesito necesitaria puedo podria puede pueden saber decir'
).split(' '));

// Words people use for the same thing. Each group maps to one canonical stem.
const SYNONYMS: string[][] = [
  ['pagar', 'pago', 'pagos', 'cobro', 'cobrar', 'cobran', 'precio', 'tarifa'],
  ['empresa', 'empresas', 'negocio', 'negocios', 'compania', 'comercio'],
  ['publicar', 'registrar', 'anadir', 'agregar', 'subir', 'anunciar', 'alta', 'crear', 'listar', 'poner'],
  ['alquilar', 'alquiler', 'alquileres', 'rentar', 'renta', 'arrendar', 'arriendo', 'reservar', 'reserva', 'reservas'],
  ['comprar', 'compra', 'compras', 'compro', 'adquirir'],
  ['pedido', 'pedidos', 'pedir', 'orden', 'encargar', 'encargo'],
  ['envio', 'entrega', 'entregar', 'domicilio', 'delivery', 'mandar', 'enviar', 'llevar'],
  ['cuenta', 'perfil', 'usuario', 'inscribirme'],
  ['contrasena', 'clave', 'password', 'acceso'],
  ['coche', 'carro', 'auto', 'vehiculo', 'vehiculos', 'coches'],
  ['casa', 'piso', 'apartamento', 'vivienda', 'habitacion', 'casas', 'pisos'],
  ['premium', 'suscripcion', 'plan'],
  ['verificado', 'verificar', 'verificacion', 'sello', 'insignia'],
  ['reclamar', 'reclamacion', 'dueno', 'propietario', 'mia', 'mio'],
  ['cancelar', 'anular', 'devolver', 'devolucion', 'reembolso'],
  ['contacto', 'contactar', 'soporte', 'ayuda', 'telefono', 'llamar', 'whatsapp', 'correo', 'email'],
  ['farmacia', 'farmacias', 'medicamento', 'medicinas'],
  ['guardia', 'turno', 'abierta', 'abiertas', 'noche'],
  ['trabajo', 'empleo', 'empleos', 'vacante', 'vacantes', 'curro'],
  ['comida', 'restaurante', 'restaurantes', 'menu', 'comer', 'platos'],
  ['opinion', 'resena', 'resenas', 'valoracion', 'comentario', 'estrellas'],
  ['tramite', 'tramites', 'documento', 'documentos', 'requisito', 'requisitos', 'papeles'],
  ['vender', 'vendedor', 'venta', 'ventas', 'producto', 'productos'],
  ['cupon', 'cupones', 'descuento', 'promocion'],
  ['notificacion', 'notificaciones', 'aviso', 'avisos', 'alerta'],
  ['favorito', 'favoritos', 'guardar', 'deseos'],
];

// Very light Spanish stemmer: enough to match plurals and common endings.
function stem(w: string): string {
  if (w.length <= 4) return w;
  return w
    .replace(/(aciones|iciones|amientos|imientos)$/, 'a')
    .replace(/(acion|icion|amiento|imiento)$/, 'a')
    .replace(/(mente)$/, '')
    .replace(/(es|s)$/, '')
    .replace(/(ando|iendo|ado|ido|ada|ida|ar|er|ir|o|a|e)$/, '')
    .slice(0, 7) || w;
}

const SYNONYM_STEM = new Map<string, string>();
for (const group of SYNONYMS) {
  const canonical = `~${stem(group[0])}`;
  for (const w of group) SYNONYM_STEM.set(stem(w), canonical);
}

// Chat shorthand people type on phones.
const SHORTHAND: Record<string, string> = { k: 'que', q: 'que', xq: 'porque', pq: 'porque', tb: 'tambien', tmb: 'tambien', d: 'de', x: 'por', xfa: 'favor', pls: 'favor' };

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // accents
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((w) => SHORTHAND[w] ?? w)
    .join(' ');
}

// What to send to the directory search: the question without the
// conversational wrapping ("que necesito para sacar el pasaporte" → "pasaporte").
const FILLER = new Set(('necesito necesita quiero queria busco buscar buscando encontrar sacar obtener conseguir hacer tramitar requisitos requisito ' +
  'recomiendas recomienda recomiendan recomendar recomendacion mejor mejores bueno buena buenos buenas barato barata algun alguna ' +
  'hay donde puedo puede conoces conoce sabes sabe dime digame informacion info sobre tienen tiene ver mostrar ensename lista listado').split(' '));

export function directoryQuery(question: string): string {
  return normalize(question)
    .split(/\s+/)
    .filter((w) => w && !FILLER.has(w) && !STOPWORDS.has(w))
    .join(' ');
}

export function terms(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    .map((w) => SYNONYM_STEM.get(stem(w)) ?? stem(w));
}

// ---------------------------------------------------------------- documents

const stripHtml = (s: string) => s.replace(/<a [^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/g, '[$2]($1)').replace(/<[^>]+>/g, '');

export function builtInDocs(): HelpDoc[] {
  const faq: HelpDoc[] = FAQ_ITEMS.map((q, i) => ({ id: `faq-${i}`, source: 'faq', title: q.question, text: stripHtml(q.answer), link: '/faq' }));
  const guide: HelpDoc[] = GUIDE_SECTIONS.flatMap((s) =>
    s.content.map((c, i) => ({
      id: `guide-${s.id}-${i}`,
      source: 'guide' as const,
      title: `${s.title}: ${c.subtitle.replace(/^\d+\.\s*/, '')}`,
      text: stripHtml(c.text),
      link: `/guia-de-usuario#${s.id}`,
    })),
  );
  return [...faq, ...guide];
}

// ---------------------------------------------------------------- BM25

type Indexed = { doc: HelpDoc; title: string[]; body: string[]; len: number };

export function buildIndex(docs: HelpDoc[]) {
  const indexed: Indexed[] = docs.map((doc) => {
    const title = terms(doc.title);
    const body = terms(doc.text);
    return { doc, title, body, len: title.length * 2 + body.length };
  });
  const df = new Map<string, number>();
  for (const d of indexed) for (const t of new Set([...d.title, ...d.body])) df.set(t, (df.get(t) ?? 0) + 1);
  const avg = indexed.reduce((n, d) => n + d.len, 0) / Math.max(1, indexed.length);
  return { indexed, df, avg, n: indexed.length };
}

export type HelpIndex = ReturnType<typeof buildIndex>;

const SOURCE_BOOST = { staff: 1.6, faq: 1.15, guide: 1 } as const;

export function searchHelp(index: HelpIndex, question: string, limit = 3): LocalMatch[] {
  let q = [...new Set(terms(question))];
  // "Oltinde" is in half the texts: only useful when it is all they asked about.
  if (q.length > 1) q = q.filter((t) => t !== 'oltinde');
  if (!q.length) return [];
  const k1 = 1.2, b = 0.75;
  const scored = index.indexed.map((d) => {
    let score = 0;
    let matched = 0;
    let inTitle = 0;
    for (const t of q) {
      // title words count double
      const tf = d.title.filter((x) => x === t).length * 2 + d.body.filter((x) => x === t).length;
      if (!tf) continue;
      matched++;
      if (d.title.includes(t)) inTitle++;
      const idf = Math.log(1 + (index.n - (index.df.get(t) ?? 0) + 0.5) / ((index.df.get(t) ?? 0) + 0.5));
      score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * d.len) / index.avg)));
    }
    // Reward covering more of the question.
    const coverage = matched / q.length;
    // A title that says what was asked is the strongest signal.
    score *= 1 + inTitle / q.length;
    return { doc: d.doc, coverage, score: score * (0.5 + coverage) * SOURCE_BOOST[d.doc.source] };
  });
  return scored.filter((s) => s.score > 0).sort((a, b2) => b2.score - a.score).slice(0, limit);
}

// ---------------------------------------------------------------- intent

// "How do I / what is" questions want help text; "where / find / list"
// questions want directory results.
const HOW_TO = /^(como|que es|que son|que significa|cuanto|cuando|por que|puedo|se puede|es posible|hay que|tengo que|debo|necesito saber)\b/;
const FIND = /\b(busco|buscar|donde|encontrar|hay|lista|listado|recomiend|cerca|telefono de|direccion de|mejor|mejores)\b/;

export function questionKind(question: string): 'howto' | 'find' | 'either' {
  const n = normalize(question).trim().replace(/\s+/g, ' ');
  if (HOW_TO.test(n)) return 'howto';
  if (FIND.test(n)) return 'find';
  return 'either';
}

// Questions about the user's own things: answered with a link to the page.
export type AccountTopic = 'pedidos' | 'reservas' | 'favoritos' | 'notificaciones';
const ACCOUNT_INTENTS: { key: AccountTopic; re: RegExp; answer: string }[] = [
  { key: 'pedidos', re: /\bmis? (pedido|compra|orden)/, answer: 'Puede ver el estado de sus compras en [Mis compras](/dashboard/compras). Si pidió comida, está en [Mis pedidos de comida](/dashboard/orders).' },
  { key: 'reservas', re: /\bmis? reserva/, answer: 'Sus reservas de alquiler y su estado están en [Mis reservas](/dashboard/reservas).' },
  { key: 'favoritos', re: /\bmis? (favorito|lista de deseos)/, answer: 'Lo que ha guardado está en [Favoritos](/favorites) y los productos en la [Lista de deseos](/tienda/deseos).' },
  { key: 'notificaciones', re: /\bmis? (notificacion|aviso)/, answer: 'Sus avisos están en [Notificaciones](/notifications). Puede elegir qué recibir por email en su [Perfil](/profile).' },
];

// Words about using Oltinde itself (not things you'd look up in the directory).
const SITE_WORDS = new Set(
  ['pagar', 'comprar', 'pedido', 'envio', 'cuenta', 'contrasena', 'premium', 'verificado', 'reclamar', 'cancelar', 'contacto',
    'opinion', 'vender', 'cupon', 'notificacion', 'favorito', 'publicar', 'alquilar', 'empresa']
    .map((w) => SYNONYM_STEM.get(stem(w)) ?? stem(w)),
);

// Does the question name something concrete to find (a trade, a product…)?
export function namesSomething(question: string): boolean {
  return terms(question).some((t) => !SITE_WORDS.has(t) && t.length > 3);
}

export const accountAnswer = (topic: AccountTopic) => ACCOUNT_INTENTS.find((i) => i.key === topic)?.answer;

export function accountIntent(question: string): string | undefined {
  const n = normalize(question);
  return ACCOUNT_INTENTS.find((i) => i.re.test(n))?.answer;
}

// ---------------------------------------------------------------- answer

// A help text shown as it was written (staff answer, FAQ or guide).
export function renderHelpDoc(doc: HelpDoc): string {
  const more = doc.link ? `\n\nMás información: [${doc.source === 'faq' ? 'Preguntas frecuentes' : 'Guía de usuario'}](${doc.link})` : '';
  return `**${doc.title}**\n\n${doc.text}${more}`;
}

export const UNKNOWN_ANSWER =
  'Todavía no tengo una respuesta para eso. Pruebe con la [Búsqueda Inteligente](/search), mire la [Guía de usuario](/guia-de-usuario) o [contacte con soporte](/contact). He guardado su pregunta para que el equipo la responda.';

// Score above which a help text is a confident answer, and above which it's
// worth offering as "maybe this helps".
export const CONFIDENT = 4.5;
export const MAYBE = 2.5;

export function composeLocalAnswer(opts: {
  question: string;
  matches: LocalMatch[];
  directory: string; // Markdown list from the search engine, '' if nothing
  directoryStrong?: boolean; // the search recognised a type or a city
}): { answer: string; answered: boolean } {
  const { question, matches, directoryStrong } = opts;
  let { directory } = opts;
  const account = accountIntent(question);
  if (account) return { answer: account, answered: true };

  const kind = questionKind(question);
  const top = matches[0];
  // Sure only if it also covers most of what was asked.
  const sure = !!top && top.score >= CONFIDENT && top.coverage >= 0.6;
  const parts: string[] = [];
  let answered = false;

  const helpFirst = sure && (kind !== 'find' || !directory);
  // A good help answer plus loosely related listings is just noise.
  // ("¿necesito cuenta para comprar?" is about the site; "necesito un
  // electricista" names a thing to find, so its listings stay.)
  if (helpFirst && kind === 'either' && !directoryStrong && !namesSomething(question)) directory = '';
  if (helpFirst) {
    parts.push(`**${top.doc.title}**\n\n${top.doc.text}`);
    if (top.doc.link) parts.push(`Más información: [${top.doc.source === 'faq' ? 'Preguntas frecuentes' : 'Guía de usuario'}](${top.doc.link})`);
    answered = true;
  }
  if (directory && kind !== 'howto') {
    parts.push(`${helpFirst ? 'También he encontrado' : 'Esto es lo que he encontrado'} en Oltinde:\n\n${directory}`);
    answered = true;
  }
  if (!answered && top && top.score >= MAYBE) {
    parts.push(`Puede que esto le ayude:\n\n**${top.doc.title}**\n\n${top.doc.text}`);
    if (matches[1] && matches[1].score >= MAYBE) parts.push(`O quizá: **${matches[1].doc.title}** — ${matches[1].doc.text.slice(0, 160)}…`);
    answered = top.score >= CONFIDENT * 0.75 && top.coverage >= 0.6;
  }
  if (!parts.length) {
    return {
      answer: 'Todavía no tengo una respuesta para eso. Pruebe con la [Búsqueda Inteligente](/search), mire la [Guía de usuario](/guia-de-usuario) o [contacte con soporte](/contact). He guardado su pregunta para que el equipo la responda.',
      answered: false,
    };
  }
  return { answer: parts.join('\n\n'), answered };
}

// The verifier for the AI's own words: they may only be conversation. Anything
// that looks like data (digits, links, emails, prices, phone talk, markup)
// gets the sentence dropped — the answer then just has no intro/closing.
export function safeChat(text: unknown, max = 220): string | null {
  if (typeof text !== 'string') return null;
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t || t.length > max) return null;
  if (/\d/.test(t)) return null;
  if (/https?:|www\.|\.(com|gq|org|net)\b|@|\[|\]|\(|\)|<|>|\*|#|`|\|/i.test(t)) return null;
  if (/\b(xaf|francos?|cfa|tel[eé]fono|tlf|tel\.|whats ?app|direcci[oó]n|calle|avenida|correo|e-?mail|precio|cuesta|vale|requisito)/i.test(t)) return null;
  return t;
}
