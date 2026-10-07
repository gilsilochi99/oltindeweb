import { NextResponse } from 'next/server';
import { getCurrentCaller } from '@/lib/firebase-admin';
import { saveUpload, UploadError, MAX_UPLOAD_BYTES } from '@/lib/uploads';

// Receives one file from useStorage().uploadFile() and stores it on our own
// hosting. Same trust model Firebase Storage had (storage.rules): any
// signed-in user may upload; attaching the returned URL to a company, post,
// etc. is what's authorized, by the Server Action that saves it.
export async function POST(request: Request) {
  const caller = await getCurrentCaller();
  if (!caller) {
    return NextResponse.json({ error: 'Debe iniciar sesión para subir archivos.' }, { status: 401 });
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json({ error: 'El archivo es demasiado grande (máximo 15 MB).' }, { status: 413 });
  }

  try {
    const form = await request.formData();
    const file = form.get('file');
    const path = form.get('path');
    if (!(file instanceof Blob) || typeof path !== 'string') {
      return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 });
    }
    const url = await saveUpload(path, Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error saving upload:', error);
    return NextResponse.json({ error: 'No se pudo guardar el archivo.' }, { status: 500 });
  }
}
