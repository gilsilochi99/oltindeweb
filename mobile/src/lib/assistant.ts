// The Oltinde assistant (chatbot) — same server function as the website's
// "¿Necesita ayuda?" chat (src/lib/assistant.ts on the web side).
import { rpc } from './api';

export type AssistantTurn = { role: 'user' | 'assistant'; content: string };
export type AssistantReply = { success: true; answer: string; answered: boolean } | { success: false; message: string };

export const getAssistantPublicState = () => rpc<{ enabled: boolean }>('getAssistantPublicState');
export const askAssistant = (question: string, history: AssistantTurn[]) => rpc<AssistantReply>('askAssistant', question, history);
