// What a signed-in user publishes themselves: contributions (posts),
// itineraries and their professional profile — the web's /dashboard/
// contribuciones, /dashboard/itineraries and /dashboard/professional, through
// the same server functions (each checks the caller is the author or staff).
import { rpc, rpcAction } from './api';
import type { Itinerary, ItineraryStopLocationType, ItineraryVisibility, Post, ProfessionalAvailability, ProfessionalService } from './types';

// ---------------------------------------------------------------- contributions

export type PostInput = {
  title: string;
  excerpt: string;
  content: string; // HTML, as the web's editor saves it
  category: string;
  featuredImage?: string;
  status: 'draft' | 'published';
};

export const getMyPosts = (uid: string) => rpc<Post[]>('getPostsByAuthor', uid);
export const createPost = (uid: string, input: PostInput) =>
  rpcAction<{ success: boolean; message?: string; postId?: string }>('createPost', { ...input, authorId: uid });
export const updatePost = (postId: string, input: PostInput, currentImage: string) => rpcAction('updatePost', postId, input, currentImage);
export const deletePost = (postId: string) => rpcAction('deletePost', postId);

// The web stores contributions as HTML from a rich-text editor; the app
// edits plain paragraphs.
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Formatting the app's plain editor would drop (lists, headings, links, images…).
export const hasRichFormatting = (html: string) => /<(?!\/?(p|br)\b)[a-z]/i.test(html);

// ---------------------------------------------------------------- itineraries

export type ItineraryInput = {
  title: string;
  description: string;
  city: string;
  durationDays: number;
  coverImage?: string;
  theme: string[];
  visibility: ItineraryVisibility;
  stops: { locationId: string; locationType: ItineraryStopLocationType; order: number; day: number; suggestedTime?: string; notes?: string }[];
};

export const getMyItineraries = (uid: string) => rpc<Itinerary[]>('getItinerariesByAuthor', uid);
export const createItinerary = (uid: string, authorName: string, input: ItineraryInput) =>
  rpcAction<{ success: boolean; message?: string; id?: string }>('createItinerary', uid, authorName, input);
export const updateItinerary = (id: string, uid: string, input: ItineraryInput) => rpcAction('updateItinerary', id, uid, false, input);
export const deleteItinerary = (id: string, uid: string) => rpcAction('deleteItinerary', id, uid, false);

// ---------------------------------------------------------------- professional profile

export type ProfessionalInput = {
  displayName: string;
  title: string;
  photo?: string;
  bio: string;
  category: string;
  city: string;
  availability: ProfessionalAvailability;
  skills: string[];
  services: ProfessionalService[];
  portfolio: string[];
  contact: { phone?: string; whatsapp?: string; email?: string; linkedin?: string };
};

export const createProfessionalProfile = (uid: string, data: ProfessionalInput) =>
  rpcAction('createProfessionalProfile', { userId: uid, data });
export const updateProfessionalProfile = (professionalId: string, data: ProfessionalInput) =>
  rpcAction('updateProfessionalProfile', { professionalId, data });
export const deleteProfessionalProfile = (professionalId: string) => rpcAction('deleteProfessionalProfile', professionalId);
