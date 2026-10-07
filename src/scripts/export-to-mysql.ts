// Exports all Firestore data (+ Firebase Auth accounts without a user doc)
// into a single .sql file that creates the MySQL schema and inserts the data,
// ready to import through cPanel → phpMyAdmin → Import.
//
// Read-only against Firebase. Safe to re-run: the generated file drops and
// recreates every table, so re-importing it replaces the previous import.
//
//   npm run export:mysql            → migration-output/oltinde.sql
//   npm run export:mysql:local      → migration-output/oltinde-local.sql (images from /uploads, for local dev)
//
// Needs GOOGLE_APPLICATION_CREDENTIALS (from .env.local).

import * as admin from 'firebase-admin';
import { promises as fs } from 'fs';
import path from 'path';

admin.initializeApp();
const db = admin.firestore();

const OUT_DIR = path.resolve(process.cwd(), 'migration-output');
// --local: export for a local dev database — images link to /uploads (served
// from public/uploads) and the production oltinde.sql is left untouched.
const LOCAL = process.argv.includes('--local');
const OUT_FILE = path.join(OUT_DIR, LOCAL ? 'oltinde-local.sql' : 'oltinde.sql');
const SCHEMA_FILE = path.resolve(process.cwd(), 'prisma/migrations/0_init/migration.sql');

// ---------------------------------------------------------------- helpers

const warnings: string[] = [];
const warn = (msg: string) => warnings.push(msg);

// Firebase Storage download links → the same file on our own hosting, where
// `npm run download:files` + `npm run upload:files` put a copy. A link is only
// rewritten when that file was actually downloaded, so nothing can end up
// pointing at a missing file; the rest keep their Firebase link (and warn).
const UPLOADS_DIR = path.resolve(process.cwd(), 'migration-output/uploads');
const UPLOADS_BASE_URL = LOCAL ? '/uploads' : (process.env.UPLOADS_BASE_URL || 'https://oltinde.com/uploads').replace(/\/$/, '');
const STORAGE_URL = /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/oltindeapp\.firebasestorage\.app\/o\/([^?"'\s]+)(\?[^"'\s]*)?/g;
const downloadedFiles = new Set<string>();
const rewriteStats = { rewritten: 0, missing: new Set<string>() };

function rewriteStorageUrls(v: unknown): unknown {
  if (typeof v === 'string') {
    return v.replace(STORAGE_URL, (url, encodedPath: string) => {
      const filePath = decodeURIComponent(encodedPath);
      if (!downloadedFiles.has(filePath)) {
        rewriteStats.missing.add(filePath);
        return url;
      }
      rewriteStats.rewritten++;
      return `${UPLOADS_BASE_URL}/${filePath.split('/').map(encodeURIComponent).join('/')}`;
    });
  }
  if (Array.isArray(v)) return v.map(rewriteStorageUrls);
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, rewriteStorageUrls(x)]));
  }
  return v;
}

async function listDownloadedFiles(dir = UPLOADS_DIR, prefix = ''): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const e of entries) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) await listDownloadedFiles(path.join(dir, e.name), rel);
    else downloadedFiles.add(rel);
  }
}

type Row = Record<string, unknown>;
const tables = new Map<string, Row[]>();
function insert(table: string, row: Row) {
  if (!tables.has(table)) tables.set(table, []);
  tables.get(table)!.push(rewriteStorageUrls(row) as Row);
}

function toDate(v: unknown): Date | null {
  if (v == null || v === '') return null;
  if (v instanceof admin.firestore.Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function requiredDate(v: unknown, where: string): Date {
  const d = toDate(v);
  if (d) return d;
  warn(`${where}: missing/invalid date ${JSON.stringify(v)}, using now`);
  return new Date();
}

// Timestamps nested inside JSON columns become ISO strings, like the rest of the app expects.
function plain(v: unknown): unknown {
  if (v instanceof admin.firestore.Timestamp) return v.toDate().toISOString();
  if (Array.isArray(v)) return v.map(plain);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)]));
  }
  return v;
}

const arr = <T = unknown>(v: unknown): T[] => (Array.isArray(v) ? (plain(v) as T[]) : []);
const str = (v: unknown): string | null => (v == null || v === '' ? null : String(v));
const num = (v: unknown): number | null => (typeof v === 'number' && isFinite(v) ? v : null);

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T | null, where: string): T | null {
  if (allowed.includes(v as T)) return v as T;
  if (v != null && v !== '') warn(`${where}: unexpected value ${JSON.stringify(v)}, using ${JSON.stringify(fallback)}`);
  return fallback;
}

// Ids of embedded items (reviews, offers, stops...) were only unique inside
// their parent document; as table primary keys they must be globally unique.
const usedIds = new Map<string, Set<string>>();
function uniqueId(table: string, preferred: unknown, parentId: string, index: number): string {
  if (!usedIds.has(table)) usedIds.set(table, new Set());
  const used = usedIds.get(table)!;
  let id = str(preferred) ?? `${parentId}-${index}`;
  if (used.has(id)) id = `${parentId}-${id}`;
  while (used.has(id)) id = `${id}-${index}`;
  used.add(id);
  return id;
}

// ---------------------------------------------------------------- SQL output

function sqlValue(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'number') return isFinite(v) ? String(v) : 'NULL';
  if (v instanceof Date) return `'${v.toISOString().slice(0, 23).replace('T', ' ')}'`;
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return (
    "'" +
    s.replace(/[\0\n\r\x1a\\']/g, c =>
      ({ '\0': '\\0', '\n': '\\n', '\r': '\\r', '\x1a': '\\Z', '\\': '\\\\', "'": "\\'" })[c]!,
    ) +
    "'"
  );
}

function insertStatements(table: string, rows: Row[]): string {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const head = `INSERT INTO \`${table}\` (${cols.map(c => `\`${c}\``).join(', ')}) VALUES\n`;
  const out: string[] = [];
  // Batches of 100 rows keep each statement well under max_allowed_packet.
  for (let i = 0; i < rows.length; i += 100) {
    const values = rows.slice(i, i + 100).map(r => '(' + cols.map(c => sqlValue(r[c])).join(', ') + ')');
    out.push(head + values.join(',\n') + ';\n');
  }
  return `-- ${table}: ${rows.length} rows\n` + out.join('\n');
}

// ---------------------------------------------------------------- read Firestore

async function readCollection(name: string) {
  const snap = await db.collection(name).get();
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, any>) }));
}

async function main() {
  await listDownloadedFiles();
  const names = [
    'users', 'companies', 'claims', 'services', 'institutions', 'procedures',
    'jobPostings', 'events', 'touristLocations', 'itineraries', 'healthFacilities',
    'professionals', 'posts', 'menuItems', 'foodOrders', 'notifications', 'settings',
  ] as const;
  const data = Object.fromEntries(
    await Promise.all(names.map(async n => [n, await readCollection(n)] as const)),
  ) as unknown as Record<(typeof names)[number], Record<string, any>[]>;

  const known = await db.listCollections();
  for (const c of known) if (!(names as readonly string[]).includes(c.id)) warn(`collection "${c.id}" is not exported`);

  // ------------------------------------------------------------ users
  const authUsers: admin.auth.UserRecord[] = [];
  let pageToken: string | undefined;
  do {
    const page = await admin.auth().listUsers(1000, pageToken);
    authUsers.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);
  const authById = new Map(authUsers.map(u => [u.uid, u]));

  // Some people have several user docs with the same email: leftovers from
  // old sign-ins whose Auth account no longer exists. MySQL needs emails to be
  // unique, so each group is merged into one canonical user — the one that
  // still has an Auth account (most recently signed in) — and every reference
  // to the leftover ids is rewritten to it via canon().
  const alias = new Map<string, string>();
  const canon = (id: string) => alias.get(id) ?? id;
  const byEmail = new Map<string, Record<string, any>[]>();
  for (const u of data.users) {
    const email = (str(u.email) ?? authById.get(u.id)?.email ?? '').toLowerCase();
    if (email) byEmail.set(email, [...(byEmail.get(email) ?? []), u]);
  }
  const lastSignIn = (id: string) => toDate(authById.get(id)?.metadata.lastSignInTime)?.getTime() ?? -1;
  const mergedDocs = new Map<string, Record<string, any>[]>(); // canonical id → all its docs
  for (const [email, docs] of byEmail) {
    const [keep, ...rest] = [...docs].sort((a, b) => lastSignIn(b.id) - lastSignIn(a.id));
    mergedDocs.set(keep.id, docs);
    for (const d of rest) {
      alias.set(d.id, keep.id);
      const note = d.role && d.role !== keep.role ? ` (it had role "${d.role}", kept "${keep.role ?? 'user'}")` : '';
      warn(`users/${d.id}: same email as ${keep.id} (${email}), merged into it${note}`);
    }
  }

  const userIds = new Set<string>();
  function addUser(row: Row) {
    userIds.add(row.id as string);
    insert('users', row);
  }

  for (const u of data.users) {
    if (alias.has(u.id)) continue;
    const auth = authById.get(u.id);
    const email = str(u.email) ?? auth?.email;
    if (!email) {
      warn(`users/${u.id}: no email, skipped`);
      continue;
    }
    const docs = mergedDocs.get(u.id) ?? [u];
    addUser({
      id: u.id,
      email,
      displayName: str(u.displayName) ?? auth?.displayName ?? email.split('@')[0],
      photoURL: str(u.photoURL),
      title: str(u.title),
      twitter: str(u.socials?.twitter),
      linkedin: str(u.socials?.linkedin),
      role: oneOf(u.role, ['admin', 'manager', 'editor', 'pharmacist', 'user'] as const, 'user', `users/${u.id}.role`),
      isPremium: !!u.isPremium,
      isActive: u.isActive !== false,
      notificationSettings: u.notificationSettings ? plain(u.notificationSettings) : null,
      createdAt: toDate(u.createdAt) ?? toDate(auth?.metadata.creationTime),
    });
    if (!userIds.has(u.id)) continue;

    // Lists from merged duplicate docs are combined.
    const union = (get: (d: Record<string, any>) => unknown) => new Set(docs.flatMap(d => arr<string>(get(d))));
    for (const type of ['companies', 'procedures', 'institutions', 'jobs', 'events', 'places', 'itineraries', 'professionals']) {
      for (const entityId of union(d => d.favorites?.[type])) {
        insert('user_favorites', { userId: u.id, type, entityId, createdAt: new Date() });
      }
    }
    for (const [kind, key] of [['company', 'companies'], ['category', 'categories']] as const) {
      for (const value of union(d => d.subscriptions?.[key])) {
        insert('user_subscriptions', { userId: u.id, kind, value });
      }
    }
    for (const token of union(d => d.fcmTokens)) {
      insert('fcm_tokens', { token, userId: u.id, createdAt: new Date() });
    }
    const favSub = await db.collection('users').doc(u.id).collection('favorites').get();
    if (!favSub.empty) warn(`users/${u.id}/favorites subcollection (${favSub.size} docs, legacy) not exported`);
  }

  // Accounts that can sign in but never got a user document.
  const knownEmails = new Set(byEmail.keys());
  for (const a of authUsers) {
    if (userIds.has(a.uid) || alias.has(a.uid) || !a.email || knownEmails.has(a.email.toLowerCase())) continue;
    addUser({
      id: a.uid,
      email: a.email,
      displayName: a.displayName ?? a.email.split('@')[0],
      photoURL: a.photoURL ?? null,
      title: null, twitter: null, linkedin: null,
      role: 'user', isPremium: false, isActive: true, notificationSettings: null,
      createdAt: toDate(a.metadata.creationTime),
    });
  }

  // Every user reference below goes through these, so merged duplicates resolve to their canonical id.
  const userId = (v: unknown): string => canon(String(v ?? ''));
  const hasUser = (v: unknown) => userIds.has(userId(v));
  const userRef = (v: unknown, where: string): string | null => {
    const id = str(v) && userId(v);
    if (id && !userIds.has(id)) {
      warn(`${where}: user ${id} does not exist, set to NULL`);
      return null;
    }
    return id;
  };

  // ------------------------------------------------------------ shared: branches & reviews
  function addBranches(owner: 'companyId' | 'institutionId' | 'healthFacilityId', parentId: string, branches: unknown) {
    arr<any>(branches).forEach((b, i) => {
      insert('branches', {
        id: uniqueId('branches', b.id, parentId, i),
        companyId: owner === 'companyId' ? parentId : null,
        institutionId: owner === 'institutionId' ? parentId : null,
        healthFacilityId: owner === 'healthFacilityId' ? parentId : null,
        position: i,
        name: str(b.name) ?? 'Principal',
        address: str(b.location?.address) ?? '',
        city: str(b.location?.city) ?? '',
        lat: num(b.location?.lat),
        lng: num(b.location?.lng),
        phone: str(b.contact?.phone),
        email: str(b.contact?.email),
        workingHours: arr(b.workingHours),
        servicesOffered: arr(b.servicesOffered),
      });
    });
  }

  function addReviews(targetType: string, parentId: string, reviews: unknown) {
    arr<any>(reviews).forEach((r, i) => {
      insert('reviews', {
        id: uniqueId('reviews', r.id, parentId, i),
        targetType,
        targetId: parentId,
        author: str(r.author) ?? 'Anónimo',
        authorId: r.authorId ? userId(r.authorId) : null,
        rating: Math.round(num(r.rating) ?? 0),
        comment: str(r.comment) ?? '',
        date: requiredDate(r.date, `${targetType}/${parentId} review ${i}`),
        source: str(r.source),
        replyText: str(r.reply?.comment),
        replyDate: toDate(r.reply?.date),
      });
    });
  }

  // ------------------------------------------------------------ companies
  const companyIds = new Set(data.companies.map(c => c.id));
  const googlePlaceIds = new Set<string>();
  for (const c of data.companies) {
    const where = `companies/${c.id}`;
    let googlePlaceId = str(c.googlePlaceId);
    if (googlePlaceId && googlePlaceIds.has(googlePlaceId)) {
      warn(`${where}: duplicate googlePlaceId ${googlePlaceId}, cleared`);
      googlePlaceId = null;
    }
    if (googlePlaceId) googlePlaceIds.add(googlePlaceId);

    insert('companies', {
      id: c.id,
      ownerId: userRef(c.ownerId, `${where}.ownerId`),
      name: str(c.name) ?? '(sin nombre)',
      legalForm: str(c.legalForm),
      cif: str(c.cif),
      logo: str(c.logo),
      image: str(c.image),
      category: str(c.category) ?? '',
      description: str(c.description) ?? '',
      email: str(c.contact?.email),
      website: str(c.contact?.website),
      socialMedia: c.contact?.socialMedia ? plain(c.contact.socialMedia) : null,
      // A few legacy companies store products as plain names instead of Product objects.
      products: arr<any>(c.products).map((p, i) =>
        typeof p === 'string' ? { id: `${c.id}-p${i}`, name: p, description: '', image: '' } : p,
      ),
      highlights: arr(c.highlights),
      documents: arr(c.documents),
      gallery: arr(c.gallery),
      yearEstablished: num(c.yearEstablished),
      isVerified: !!c.isVerified,
      isFeatured: !!c.isFeatured,
      isActive: c.isActive !== false,
      isPremium: !!c.isPremium,
      companySize: str(c.companySize),
      capitalOwnership: str(c.capitalOwnership),
      geographicScope: str(c.geographicScope),
      purpose: str(c.purpose),
      fiscalRegime: str(c.fiscalRegime),
      googlePlaceId,
      createdAt: requiredDate(c.createdAt, `${where}.createdAt`),
    });
    addBranches('companyId', c.id, c.branches);
    addReviews('company', c.id, c.reviews);
    arr<any>(c.announcements).forEach((a, i) =>
      insert('company_announcements', {
        id: uniqueId('company_announcements', a.id, c.id, i),
        companyId: c.id,
        title: str(a.title) ?? '',
        content: str(a.content) ?? '',
        image: str(a.image),
        createdAt: requiredDate(a.createdAt, `${where} announcement ${i}`),
      }),
    );
    arr<any>(c.offers).forEach((o, i) =>
      insert('company_offers', {
        id: uniqueId('company_offers', o.id, c.id, i),
        companyId: c.id,
        title: str(o.title) ?? '',
        description: str(o.description) ?? '',
        discount: str(o.discount) ?? '',
        validUntil: toDate(o.validUntil), // missing = no expiry date
        image: str(o.image),
        createdAt: requiredDate(o.createdAt, `${where} offer ${i}.createdAt`),
      }),
    );
  }

  for (const c of data.claims) {
    const where = `claims/${c.id}`;
    if (!companyIds.has(c.companyId) || !hasUser(c.userId)) {
      warn(`${where}: company or user no longer exists, skipped`);
      continue;
    }
    insert('claims', {
      id: c.id,
      companyId: c.companyId,
      companyName: str(c.companyName) ?? '',
      userId: userId(c.userId),
      userName: str(c.userName) ?? '',
      userEmail: str(c.userEmail) ?? '',
      status: oneOf(c.status, ['pending', 'approved', 'rejected'] as const, 'pending', where),
      createdAt: requiredDate(c.createdAt, where),
    });
  }

  for (const s of data.services) {
    insert('services', {
      id: s.id,
      name: str(s.name) ?? '',
      description: str(s.description) ?? '',
      category: str(s.category) ?? '',
    });
  }

  // ------------------------------------------------------------ institutions & procedures
  const institutionIds = new Set(data.institutions.map(i => i.id));
  for (const inst of data.institutions) {
    insert('institutions', {
      id: inst.id,
      name: str(inst.name) ?? '',
      logo: str(inst.logo),
      image: str(inst.image),
      category: str(inst.category) ?? '',
      description: str(inst.description) ?? '',
      responsiblePersonName: str(inst.responsiblePerson?.name),
      responsiblePersonTitle: str(inst.responsiblePerson?.title),
      email: str(inst.contact?.email),
      website: str(inst.contact?.website),
      whatsapp: str(inst.contact?.whatsapp),
    });
    addBranches('institutionId', inst.id, inst.branches);
    addReviews('institution', inst.id, inst.reviews);
  }

  for (const p of data.procedures) {
    const where = `procedures/${p.id}`;
    let institutionId = str(p.institutionId);
    if (institutionId && !institutionIds.has(institutionId)) {
      warn(`${where}: institution ${institutionId} does not exist, set to NULL`);
      institutionId = null;
    }
    insert('procedures', {
      id: p.id,
      name: str(p.name) ?? '',
      category: str(p.category) ?? '',
      description: str(p.description) ?? '',
      institutionId,
      institutionName: str(p.institution) ?? '',
      requirements: arr(p.requirements),
      steps: arr(p.steps),
      cost: str(p.cost) ?? '',
      documents: arr(p.documents),
    });
    addReviews('procedure', p.id, p.reviews);
  }

  // ------------------------------------------------------------ jobs & events
  for (const j of data.jobPostings) {
    const where = `jobPostings/${j.id}`;
    if (!companyIds.has(j.companyId)) {
      warn(`${where}: company ${j.companyId} does not exist, skipped`);
      continue;
    }
    insert('job_postings', {
      id: j.id,
      companyId: j.companyId,
      companyName: str(j.companyName) ?? '',
      companyLogo: str(j.companyLogo),
      ownerId: userId(j.ownerId),
      title: str(j.title) ?? '',
      description: str(j.description) ?? '',
      sector: str(j.sector) ?? '',
      city: str(j.city) ?? '',
      employmentType: str(j.employmentType) ?? '',
      salaryRange: str(j.salaryRange),
      requirements: arr(j.requirements),
      responsibilities: arr(j.responsibilities),
      academicLevel: str(j.academicLevel),
      experience: arr(j.experience),
      skills: arr(j.skills),
      applicationMethod: oneOf(j.applicationMethod, ['email', 'link'] as const, 'email', where),
      applicationValue: str(j.applicationValue) ?? '',
      applicationInstructions: str(j.applicationInstructions),
      status: oneOf(j.status, ['open', 'closed'] as const, 'open', where),
      deadline: toDate(j.deadline),
      applicationClickCount: num(j.applicationClickCount) ?? 0,
      createdAt: requiredDate(j.createdAt, where),
    });
  }

  for (const e of data.events) {
    const where = `events/${e.id}`;
    insert('events', {
      id: e.id,
      title: str(e.title) ?? '',
      description: str(e.description) ?? '',
      category: str(e.category) ?? '',
      city: str(e.city) ?? '',
      address: str(e.address),
      startDate: requiredDate(e.startDate, `${where}.startDate`),
      endDate: toDate(e.endDate),
      organizerType: oneOf(e.organizerType, ['company', 'institution'] as const, 'company', where),
      organizerId: str(e.organizerId) ?? '',
      organizerName: str(e.organizerName) ?? '',
      organizerLogo: str(e.organizerLogo),
      ownerId: e.ownerId ? userId(e.ownerId) : null,
      registrationMethod: oneOf(e.registrationMethod, ['email', 'link', 'none'] as const, 'none', where),
      registrationValue: str(e.registrationValue),
      status: oneOf(e.status, ['scheduled', 'cancelled'] as const, 'scheduled', where),
      createdAt: requiredDate(e.createdAt, where),
    });
  }

  // ------------------------------------------------------------ tourism
  for (const t of data.touristLocations) {
    const where = `touristLocations/${t.id}`;
    let linkedCompanyId = str(t.linkedCompanyId);
    if (linkedCompanyId && !companyIds.has(linkedCompanyId)) {
      warn(`${where}: linked company ${linkedCompanyId} does not exist, set to NULL`);
      linkedCompanyId = null;
    }
    insert('tourist_locations', {
      id: t.id,
      name: str(t.name) ?? '',
      description: str(t.description) ?? '',
      category: str(t.category) ?? '',
      address: str(t.location?.address) ?? '',
      city: str(t.location?.city) ?? '',
      lat: num(t.location?.lat),
      lng: num(t.location?.lng),
      image: str(t.image),
      gallery: arr(t.gallery),
      priceRange: str(t.priceRange),
      openingHours: arr(t.openingHours),
      linkedCompanyId,
      status: oneOf(t.status, ['pending', 'approved', 'rejected'] as const, 'pending', where),
      submittedBy: userId(t.submittedBy),
      isFeatured: !!t.isFeatured,
      createdAt: requiredDate(t.createdAt, where),
    });
    addReviews('touristLocation', t.id, t.reviews);
  }

  for (const it of data.itineraries) {
    const where = `itineraries/${it.id}`;
    if (!hasUser(it.authorId)) {
      warn(`${where}: author ${it.authorId} does not exist, skipped`);
      continue;
    }
    insert('itineraries', {
      id: it.id,
      title: str(it.title) ?? '',
      description: str(it.description) ?? '',
      coverImage: str(it.coverImage),
      authorId: userId(it.authorId),
      authorName: str(it.authorName) ?? '',
      city: str(it.city) ?? '',
      durationDays: num(it.durationDays) ?? 1,
      theme: arr(it.theme),
      visibility: oneOf(it.visibility, ['public', 'unlisted'] as const, 'public', where),
      isFeatured: !!it.isFeatured,
      createdAt: requiredDate(it.createdAt, where),
    });
    arr<any>(it.stops).forEach((s, i) =>
      insert('itinerary_stops', {
        id: uniqueId('itinerary_stops', s.id, it.id, i),
        itineraryId: it.id,
        locationId: str(s.locationId) ?? '',
        locationType: oneOf(s.locationType, ['place', 'company'] as const, 'place', `${where} stop ${i}`),
        order: num(s.order) ?? i,
        day: num(s.day) ?? 1,
        suggestedTime: str(s.suggestedTime),
        notes: str(s.notes),
      }),
    );
    addReviews('itinerary', it.id, it.reviews);
  }

  // ------------------------------------------------------------ health
  for (const h of data.healthFacilities) {
    const where = `healthFacilities/${h.id}`;
    insert('health_facilities', {
      id: h.id,
      type: oneOf(h.type, ['hospital', 'clinic', 'pharmacy'] as const, 'clinic', where),
      name: str(h.name) ?? '',
      ownership: oneOf(h.ownership, ['public', 'private'] as const, 'private', where),
      description: str(h.description) ?? '',
      services: arr(h.services),
      specialties: arr(h.specialties),
      emergencyServices: !!h.emergencyServices,
      whatsapp: str(h.contact?.whatsapp),
      image: str(h.image),
      isVerified: !!h.isVerified,
      isFeatured: !!h.isFeatured,
      createdAt: requiredDate(h.createdAt, where),
    });
    addBranches('healthFacilityId', h.id, h.branches);
    for (const d of new Set(arr<string>(h.onDutyDates))) {
      const date = toDate(d);
      if (date) insert('pharmacy_duty_dates', { facilityId: h.id, date: date.toISOString().slice(0, 10) });
      else warn(`${where}: invalid onDutyDate ${JSON.stringify(d)}, skipped`);
    }
  }

  // ------------------------------------------------------------ professionals
  for (const p of data.professionals) {
    const where = `professionals/${p.id}`;
    if (!hasUser(p.ownerId)) {
      warn(`${where}: owner ${p.ownerId} does not exist, skipped`);
      continue;
    }
    insert('professionals', {
      id: p.id,
      ownerId: userId(p.ownerId),
      displayName: str(p.displayName) ?? '',
      title: str(p.title) ?? '',
      photo: str(p.photo),
      bio: str(p.bio) ?? '',
      category: str(p.category) ?? '',
      skills: arr(p.skills),
      services: arr(p.services),
      portfolio: arr(p.portfolio),
      city: str(p.city) ?? '',
      availability: oneOf(p.availability, ['Disponible', 'Ocupado', 'A demanda'] as const, null, where),
      phone: str(p.contact?.phone),
      whatsapp: str(p.contact?.whatsapp),
      email: str(p.contact?.email),
      linkedin: str(p.contact?.linkedin),
      isVerified: !!p.isVerified,
      createdAt: requiredDate(p.createdAt, where),
    });
    addReviews('professional', p.id, p.reviews);
  }

  // ------------------------------------------------------------ blog
  for (const p of data.posts) {
    const where = `posts/${p.id}`;
    if (!hasUser(p.authorId)) {
      warn(`${where}: author ${p.authorId} does not exist, skipped`);
      continue;
    }
    const createdAt = requiredDate(p.createdAt, `${where}.createdAt`);
    insert('posts', {
      id: p.id,
      slug: str(p.slug) ?? p.id,
      title: str(p.title) ?? '',
      content: str(p.content) ?? '',
      excerpt: str(p.excerpt) ?? '',
      featuredImage: str(p.featuredImage),
      imageDescription: str(p.imageDescription),
      authorId: userId(p.authorId),
      authorName: str(p.authorName) ?? '',
      category: str(p.category),
      status: oneOf(p.status, ['draft', 'pending', 'published'] as const, 'draft', where),
      createdAt,
      updatedAt: toDate(p.updatedAt) ?? createdAt,
    });
    arr<any>(p.comments).forEach((c, i) => {
      if (!hasUser(c.userId)) {
        warn(`${where} comment ${i}: user ${c.userId} does not exist, skipped`);
        return;
      }
      insert('post_comments', {
        id: uniqueId('post_comments', c.id, p.id, i),
        postId: p.id,
        userId: userId(c.userId),
        authorName: str(c.authorName) ?? '',
        comment: str(c.comment) ?? '',
        createdAt: requiredDate(c.createdAt, `${where} comment ${i}`),
      });
    });
  }

  // ------------------------------------------------------------ food
  for (const m of data.menuItems) {
    const where = `menuItems/${m.id}`;
    if (!companyIds.has(m.companyId)) {
      warn(`${where}: company ${m.companyId} does not exist, skipped`);
      continue;
    }
    insert('menu_items', {
      id: m.id,
      companyId: m.companyId,
      companyName: str(m.companyName) ?? '',
      ownerId: userId(m.ownerId),
      name: str(m.name) ?? '',
      description: str(m.description) ?? '',
      price: num(m.price) ?? 0,
      image: str(m.image),
      foodType: str(m.foodType) ?? '',
      isMenuDelDia: !!m.isMenuDelDia,
      available: m.available !== false,
      optionGroups: arr(m.optionGroups),
      createdAt: requiredDate(m.createdAt, where),
    });
  }

  for (const o of data.foodOrders) {
    const where = `foodOrders/${o.id}`;
    if (!companyIds.has(o.companyId)) {
      warn(`${where}: company ${o.companyId} does not exist, skipped`);
      continue;
    }
    insert('food_orders', {
      id: o.id,
      companyId: o.companyId,
      companyName: str(o.companyName) ?? '',
      customerId: userRef(o.customerId, `${where}.customerId`),
      customerName: str(o.customerName) ?? '',
      customerPhone: str(o.customerPhone) ?? '',
      items: arr(o.items),
      subtotal: num(o.subtotal) ?? 0,
      deliveryMethod: oneOf(o.deliveryMethod, ['pickup', 'situka'] as const, 'pickup', where),
      deliveryAddress: str(o.deliveryAddress),
      paymentMethod: oneOf(o.paymentMethod, ['none', 'muni_dinero'] as const, 'none', where),
      paymentStatus: oneOf(o.paymentStatus, ['not_applicable', 'pending', 'paid'] as const, 'not_applicable', where),
      commissionPercent: num(o.commissionPercent) ?? 0,
      commissionAmount: num(o.commissionAmount) ?? 0,
      status: oneOf(o.status, ['placed', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'] as const, 'placed', where),
      notes: str(o.notes),
      createdAt: requiredDate(o.createdAt, where),
    });
  }

  // ------------------------------------------------------------ notifications & settings
  for (const n of data.notifications) {
    const where = `notifications/${n.id}`;
    if (!hasUser(n.userId)) {
      warn(`${where}: user ${n.userId} does not exist, skipped`);
      continue;
    }
    insert('notifications', {
      id: n.id,
      userId: userId(n.userId),
      message: str(n.message) ?? '',
      link: str(n.link) ?? '/',
      isRead: !!n.isRead,
      createdAt: requiredDate(n.createdAt, where),
    });
  }

  const s = data.settings.find(x => x.id === 'main');
  if (s) {
    insert('site_settings', {
      id: 'main',
      siteName: str(s.siteName) ?? 'Oltinde',
      siteSlogan: str(s.siteSlogan) ?? '',
      logoUrl: str(s.logoUrl),
      cities: arr(s.cities),
      isBusinessAdvisorEnabled: !!s.isBusinessAdvisorEnabled,
      socialMedia: s.socialMedia ? plain(s.socialMedia) : null,
      foodDeliveryFees: s.foodDeliveryFees ? plain(s.foodDeliveryFees) : null,
    });
  }

  // ------------------------------------------------------------ write file
  const schemaSql = await fs.readFile(SCHEMA_FILE, 'utf8');
  const createdTables = [...schemaSql.matchAll(/CREATE TABLE `(\w+)`/g)].map(m => m[1]);

  const parts = [
    `-- Oltinde: Firestore export generated ${new Date().toISOString()}`,
    `-- Import into an EMPTY database (or one created by a previous import of this file).`,
    `SET NAMES utf8mb4;`,
    `SET FOREIGN_KEY_CHECKS = 0;`,
    `SET time_zone = '+00:00';`,
    ...createdTables.map(t => `DROP TABLE IF EXISTS \`${t}\`;`),
    '',
    schemaSql,
    '',
    ...[...tables.entries()].map(([t, rows]) => insertStatements(t, rows)),
    `SET FOREIGN_KEY_CHECKS = 1;`,
    '',
  ];
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, parts.join('\n'), 'utf8');

  console.log('Rows per table:');
  for (const t of createdTables) console.log(`  ${t.padEnd(24)} ${tables.get(t)?.length ?? 0}`);
  if (!downloadedFiles.size) {
    warn('migration-output/uploads is empty — file links still point to Firebase Storage (run `npm run download:files` first)');
  } else {
    console.log(`\nFile links: ${rewriteStats.rewritten} rewritten to ${UPLOADS_BASE_URL}/...`);
    rewriteStats.missing.forEach(f => warn(`file "${f}" is linked but not in Firebase Storage/downloads — link left unchanged`));
  }
  console.log(`\n${warnings.length} warning(s)${warnings.length ? ':' : ''}`);
  warnings.forEach(w => console.log('  - ' + w));
  const size = (await fs.stat(OUT_FILE)).size;
  console.log(`\nWrote ${path.relative(process.cwd(), OUT_FILE)} (${(size / 1024).toFixed(0)} KB)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
