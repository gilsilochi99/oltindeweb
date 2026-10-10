// The Asistente Oltinde — same server function as the website's search and
// "¿Necesita ayuda?" (src/lib/assistant.ts on the web side). It is the app's
// search too (the Buscar tab).
import { rpc } from './api';
import type { RankedResults } from './search-engine';
import type { ProductListItem } from './shop';
import type { RentalListItem } from './rentals';

export type AssistantTurn = { role: 'user' | 'assistant'; content: string };
export type AssistantAnswer = {
  success: true;
  answer: string; // the whole answer as Markdown
  answered: boolean;
  intro?: string; // the AI's opening sentence (checked: no data in it)
  body?: string; // a stored text: help, link to the user's page, "not found"…
  cierre?: string; // the AI's closing question
  results: RankedResults | null; // directory results, shown as cards
  products: ProductListItem[];
  rentals: RentalListItem[];
  total: number;
};
export type AssistantReply = AssistantAnswer | { success: false; message: string };

export const getAssistantPublicState = () => rpc<{ enabled: boolean }>('getAssistantPublicState');
export const askAssistant = (question: string, history: AssistantTurn[]) => rpc<AssistantReply>('askAssistant', question, history);
