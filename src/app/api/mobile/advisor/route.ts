// The mobile app can't call Next.js Server Actions directly (they're an
// RPC mechanism internal to this app, not a stable cross-client protocol),
// so this thin Route Handler wraps the same businessAdvisor Genkit flow the
// web BusinessAdvisor component calls — one implementation, two clients.
import { NextResponse } from 'next/server';
import { businessAdvisor } from '@/ai/flows/business-advisor';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const question = (body as { question?: unknown })?.question;
  if (typeof question !== 'string' || !question.trim()) {
    return NextResponse.json({ error: 'Missing "question" string' }, { status: 400 });
  }

  try {
    const result = await businessAdvisor({ question });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/mobile/advisor:', error);
    return NextResponse.json({ error: 'No se pudo generar una respuesta.' }, { status: 500 });
  }
}
