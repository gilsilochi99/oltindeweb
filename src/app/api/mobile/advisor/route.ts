import { NextResponse } from 'next/server';

// The old business advisor was replaced by the Asistente Oltinde (askAssistant
// through /api/mobile/rpc). Older app versions still call this.
export async function POST() {
  return NextResponse.json({ error: 'El asesor se ha sustituido por el Asistente Oltinde. Use la pestaña Buscar o actualice la app.' }, { status: 410 });
}
