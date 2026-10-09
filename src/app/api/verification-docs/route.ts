import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentCaller, isManagerRole } from '@/lib/firebase-admin';
import { MAX_UPLOAD_BYTES, UploadError, privateKeyBelongsTo, readPrivateUpload, savePrivateUpload } from '@/lib/uploads';

// Verification documents (business registration, owner's ID). Unlike
// /api/upload these go to the private folder: only the company's owner can
// upload them, and only the owner or staff can open them again.

async function allowed(companyId: string) {
  const caller = await getCurrentCaller();
  if (!caller) return null;
  if (isManagerRole(caller.role)) return caller;
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerId: true } });
  return company?.ownerId === caller.uid ? caller : null;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json({ error: 'El archivo es demasiado grande (máximo 15 MB).' }, { status: 413 });
  }
  try {
    const form = await request.formData();
    const file = form.get('file');
    const companyId = form.get('companyId');
    if (!(file instanceof Blob) || typeof companyId !== 'string') {
      return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 });
    }
    if (!(await allowed(companyId))) {
      return NextResponse.json({ error: 'Solo el dueño de la empresa puede enviar estos documentos.' }, { status: 403 });
    }
    const name = (file as File).name || 'documento';
    const key = await savePrivateUpload(companyId, name, Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ key, name });
  } catch (error) {
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('Error saving verification document:', error);
    return NextResponse.json({ error: 'No se pudo guardar el archivo.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key') ?? '';
  const companyId = key.split('/')[1] ?? '';
  if (!privateKeyBelongsTo(key, companyId) || !(await allowed(companyId))) {
    return new NextResponse('No encontrado', { status: 404 });
  }
  const file = await readPrivateUpload(key);
  if (!file) return new NextResponse('No encontrado', { status: 404 });
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      'Content-Type': file.contentType,
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
