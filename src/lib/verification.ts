'use server';

// Proving a business is really yours, in two steps:
//
// 1. Ownership by code ("Gestionado por su dueño"): someone claiming a listing
//    that has no owner can ask for a 6-digit code sent to the email ALREADY
//    on that listing (not one they type). Entering it makes them the owner —
//    they control the business's official address. Listings without an email
//    still go through the manual claim review (createClaim / processClaim).
//
// 2. "Negocio verificado" badge: the owner sends their business registration
//    or licence and their ID; staff review them. Approval lasts a year
//    (companies.verifiedUntil). Documents stay in the private uploads folder.
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { revalidatePath } from 'next/cache';
import { prisma } from './db';
import { getCurrentCaller, isManagerRole } from './firebase-admin';
import { renderEmail, sendEmail } from './email';
import { sendNotificationToUser } from './notifications';
import { privateKeyBelongsTo } from './uploads';

type Result<T = object> = ({ success: true } & T) | { success: false; message: string };

const CODE_TTL_MIN = 30;
const MAX_CODES_PER_HOUR = 3;
const MAX_ATTEMPTS = 5;
const VERIFIED_FOR_DAYS = 365;

const hashCode = (id: string, code: string) => createHash('sha256').update(`${id}:${code}`).digest('hex');

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const shown = user.length <= 2 ? user[0] : `${user.slice(0, 2)}`;
  return `${shown}${'•'.repeat(Math.max(2, user.length - shown.length))}@${domain}`;
}

// ---------------------------------------------------------------- 1. claim by code

// Which ways the caller can claim this listing (shown on the claim dialog).
export async function getClaimOptions(companyId: string): Promise<{ canClaim: boolean; codeTo?: string; reason?: string }> {
  const caller = await getCurrentCaller();
  if (!caller) return { canClaim: false, reason: 'Inicie sesión para reclamar esta empresa.' };
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerId: true, email: true } });
  if (!company) return { canClaim: false, reason: 'La empresa no existe.' };
  if (company.ownerId) return { canClaim: false, reason: company.ownerId === caller.uid ? 'Ya es el dueño de esta empresa.' : 'Esta empresa ya tiene dueño.' };
  return { canClaim: true, codeTo: company.email ? maskEmail(company.email) : undefined };
}

export async function requestClaimCode(companyId: string): Promise<Result<{ sentTo: string }>> {
  try {
    const caller = await getCurrentCaller();
    if (!caller) return { success: false, message: 'Inicie sesión para reclamar esta empresa.' };
    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true, ownerId: true, email: true } });
    if (!company) return { success: false, message: 'La empresa no existe.' };
    if (company.ownerId) return { success: false, message: 'Esta empresa ya tiene dueño.' };
    if (!company.email) return { success: false, message: 'Esta empresa no tiene email en su ficha. Envíe la reclamación para revisión manual.' };

    const recent = await prisma.claimCode.count({
      where: { companyId, userId: caller.uid, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    if (recent >= MAX_CODES_PER_HOUR) return { success: false, message: 'Ha pedido demasiados códigos. Inténtelo de nuevo en una hora.' };

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const row = await prisma.claimCode.create({
      data: { companyId, userId: caller.uid, codeHash: 'pending', sentTo: company.email, expiresAt: new Date(Date.now() + CODE_TTL_MIN * 60 * 1000) },
    });
    await prisma.claimCode.update({ where: { id: row.id }, data: { codeHash: hashCode(row.id, code) } });

    const { html, text } = renderEmail({
      title: `Código para gestionar ${company.name}`,
      paragraphs: [
        `Alguien ha pedido gestionar la ficha de ${company.name} en Oltinde. Si ha sido usted, introduzca este código:`,
        code,
        `Caduca en ${CODE_TTL_MIN} minutos. Si no lo ha pedido usted, ignore este correo: nadie podrá gestionar la ficha sin el código.`,
      ],
      footer: 'Recibe este correo porque es el email de contacto de esta empresa en Oltinde.',
    });
    const sent = await sendEmail({ to: company.email, subject: `Su código de Oltinde: ${code}`, html, text });
    if (!sent) {
      await prisma.claimCode.delete({ where: { id: row.id } });
      return { success: false, message: 'No se pudo enviar el correo ahora mismo. Envíe la reclamación para revisión manual o inténtelo más tarde.' };
    }
    return { success: true, sentTo: maskEmail(company.email) };
  } catch (error) {
    console.error('requestClaimCode failed:', error);
    return { success: false, message: 'No se pudo enviar el código.' };
  }
}

export async function confirmClaimCode(companyId: string, code: string): Promise<Result> {
  try {
    const caller = await getCurrentCaller();
    if (!caller) return { success: false, message: 'Inicie sesión para continuar.' };
    const clean = String(code ?? '').replace(/\D/g, '');
    if (clean.length !== 6) return { success: false, message: 'El código tiene 6 cifras.' };

    const row = await prisma.claimCode.findFirst({
      where: { companyId, userId: caller.uid, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!row) return { success: false, message: 'El código ha caducado. Pida uno nuevo.' };
    if (row.attempts >= MAX_ATTEMPTS) return { success: false, message: 'Demasiados intentos. Pida un código nuevo.' };

    const expected = Buffer.from(row.codeHash, 'hex');
    const given = Buffer.from(hashCode(row.id, clean), 'hex');
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
      await prisma.claimCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
      const left = MAX_ATTEMPTS - row.attempts - 1;
      return { success: false, message: left > 0 ? `Código incorrecto. Le quedan ${left} intentos.` : 'Código incorrecto. Pida un código nuevo.' };
    }

    const company = await prisma.$transaction(async (tx) => {
      // Only if it's still unowned (two people racing for the same listing).
      const taken = await tx.company.updateMany({ where: { id: companyId, ownerId: null }, data: { ownerId: caller.uid } });
      if (taken.count === 0) return null;
      await tx.claimCode.update({ where: { id: row.id }, data: { usedAt: new Date() } });
      await tx.claim.updateMany({ where: { companyId, userId: caller.uid, status: 'pending' }, data: { status: 'approved' } });
      await tx.claim.updateMany({ where: { companyId, status: 'pending' }, data: { status: 'rejected' } });
      return tx.company.findUnique({ where: { id: companyId }, select: { name: true } });
    });
    if (!company) return { success: false, message: 'Esta empresa ya tiene dueño.' };

    await sendNotificationToUser(caller.uid, {
      message: `Ya gestiona "${company.name}" en Oltinde. Puede pedir el sello de Negocio verificado enviando sus documentos.`,
      link: `/dashboard/companies/${companyId}/verification`,
    });
    revalidatePath(`/companies/${companyId}`);
    revalidatePath('/dashboard');
    revalidatePath('/admin/claims');
    return { success: true };
  } catch (error) {
    console.error('confirmClaimCode failed:', error);
    return { success: false, message: 'No se pudo comprobar el código.' };
  }
}

// ---------------------------------------------------------------- 2. verified badge

export type VerificationDoc = { kind: 'business' | 'identity'; key: string; name: string };
export type VerificationRequest = {
  id: string;
  companyId: string;
  status: 'pending' | 'approved' | 'rejected';
  documents: VerificationDoc[];
  note?: string;
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
};
export type VerificationState = {
  isVerified: boolean;
  verifiedUntil?: string;
  latest?: VerificationRequest;
};

const toRequest = (r: { id: string; companyId: string; status: VerificationRequest['status']; documents: unknown; note: string | null; reviewNote: string | null; reviewedAt: Date | null; createdAt: Date }): VerificationRequest => ({
  id: r.id,
  companyId: r.companyId,
  status: r.status,
  documents: (r.documents as VerificationDoc[]) ?? [],
  note: r.note ?? undefined,
  reviewNote: r.reviewNote ?? undefined,
  reviewedAt: r.reviewedAt?.toISOString(),
  createdAt: r.createdAt.toISOString(),
});

async function ownerOrStaff(companyId: string) {
  const caller = await getCurrentCaller();
  if (!caller) return null;
  if (isManagerRole(caller.role)) return caller;
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerId: true } });
  return company?.ownerId === caller.uid ? caller : null;
}

export async function getVerificationState(companyId: string): Promise<VerificationState | null> {
  if (!(await ownerOrStaff(companyId))) return null;
  const [company, latest] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { isVerified: true, verifiedUntil: true } }),
    prisma.companyVerification.findFirst({ where: { companyId }, orderBy: { createdAt: 'desc' } }),
  ]);
  if (!company) return null;
  const active = company.isVerified && (!company.verifiedUntil || company.verifiedUntil > new Date());
  return { isVerified: active, verifiedUntil: company.verifiedUntil?.toISOString(), latest: latest ? toRequest(latest) : undefined };
}

export async function submitVerification(companyId: string, documents: VerificationDoc[], note?: string): Promise<Result> {
  try {
    const caller = await ownerOrStaff(companyId);
    if (!caller) return { success: false, message: 'Solo el dueño de la empresa puede pedir la verificación.' };
    const docs = (Array.isArray(documents) ? documents : [])
      .filter((d) => (d?.kind === 'business' || d?.kind === 'identity') && typeof d.key === 'string' && privateKeyBelongsTo(d.key, companyId))
      .map((d) => ({ kind: d.kind, key: d.key, name: String(d.name ?? '').slice(0, 200) }));
    if (!docs.some((d) => d.kind === 'business')) return { success: false, message: 'Falta el documento de la empresa (registro mercantil o licencia).' };
    if (!docs.some((d) => d.kind === 'identity')) return { success: false, message: 'Falta su documento de identidad (DNI o pasaporte).' };
    const pending = await prisma.companyVerification.count({ where: { companyId, status: 'pending' } });
    if (pending) return { success: false, message: 'Ya tiene una solicitud en revisión.' };

    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });
    await prisma.companyVerification.create({
      data: { companyId, userId: caller.uid, documents: docs, note: note?.trim().slice(0, 2000) || null },
    });

    // Let staff know there's something to review.
    const staff = await prisma.user.findMany({ where: { role: { in: ['admin', 'manager'] } }, select: { id: true } });
    await Promise.all(staff.map((s) => sendNotificationToUser(s.id, {
      message: `Nueva solicitud de verificación: ${company?.name ?? 'empresa'}.`,
      link: '/admin/verifications',
    })));
    revalidatePath('/admin/verifications');
    return { success: true };
  } catch (error) {
    console.error('submitVerification failed:', error);
    return { success: false, message: 'No se pudo enviar la solicitud.' };
  }
}

export type AdminVerificationRow = VerificationRequest & {
  companyName: string;
  companyLogo?: string;
  companyEmail?: string;
  companyCif?: string;
  userName: string;
  userEmail: string;
};

export async function getVerificationRequests(status: 'pending' | 'approved' | 'rejected' = 'pending'): Promise<AdminVerificationRow[]> {
  const caller = await getCurrentCaller();
  if (!caller || !isManagerRole(caller.role)) return [];
  const rows = await prisma.companyVerification.findMany({
    where: { status },
    include: { company: { select: { name: true, logo: true, email: true, cif: true } }, user: { select: { displayName: true, email: true } } },
    orderBy: { createdAt: status === 'pending' ? 'asc' : 'desc' },
    take: 200,
  });
  return rows.map((r) => ({
    ...toRequest(r),
    companyName: r.company.name,
    companyLogo: r.company.logo ?? undefined,
    companyEmail: r.company.email ?? undefined,
    companyCif: r.company.cif ?? undefined,
    userName: r.user.displayName,
    userEmail: r.user.email,
  }));
}

export async function reviewVerification(requestId: string, approve: boolean, reviewNote?: string): Promise<Result> {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isManagerRole(caller.role)) return { success: false, message: 'No tiene permiso.' };
    const reason = reviewNote?.trim() ?? '';
    if (!approve && reason.length < 5) return { success: false, message: 'Explique el motivo del rechazo para que el dueño pueda corregirlo.' };
    const req = await prisma.companyVerification.findUnique({ where: { id: requestId }, include: { company: { select: { name: true } } } });
    if (!req || req.status !== 'pending') return { success: false, message: 'La solicitud ya no está pendiente.' };

    const until = new Date(Date.now() + VERIFIED_FOR_DAYS * 24 * 60 * 60 * 1000);
    await prisma.$transaction([
      prisma.companyVerification.update({
        where: { id: requestId },
        data: { status: approve ? 'approved' : 'rejected', reviewNote: reason || null, reviewedBy: caller.uid, reviewedAt: new Date() },
      }),
      ...(approve ? [prisma.company.update({ where: { id: req.companyId }, data: { isVerified: true, verifiedUntil: until } })] : []),
    ]);

    await sendNotificationToUser(req.userId, approve
      ? { message: `¡Enhorabuena! "${req.company.name}" ya tiene el sello de Negocio verificado en Oltinde.`, link: `/companies/${req.companyId}` }
      : { message: `La verificación de "${req.company.name}" no se ha aprobado: ${reason}`, link: `/dashboard/companies/${req.companyId}/verification` });

    revalidatePath('/admin/verifications');
    revalidatePath(`/companies/${req.companyId}`);
    revalidatePath('/companies');
    return { success: true };
  } catch (error) {
    console.error('reviewVerification failed:', error);
    return { success: false, message: 'No se pudo guardar la revisión.' };
  }
}
