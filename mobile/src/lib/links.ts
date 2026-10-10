import { Linking } from 'react-native';
import { WEB_APP_URL } from './config';

// Every external link the app opens goes through here. Many come from
// listings (websites, job "apply" links, documents), so only ordinary schemes
// are allowed: a link can't launch other apps through intent:, file: or a
// custom scheme. Bare domains ("empresa.gq") get https://, site paths the website's address.
const ALLOWED = /^(https?:|mailto:|tel:|sms:|whatsapp:)/i;

export function safeExternalUrl(raw: string | null | undefined): string | null {
  const url = String(raw ?? '').trim();
  if (!url) return null;
  if (ALLOWED.test(url)) return url;
  if (/^\/(?!\/)/.test(url)) return `${WEB_APP_URL}${url}`; // site path, e.g. /uploads/...
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return null; // some other scheme
  if (/^[\w-]+(\.[\w-]+)+([/?#].*)?$/.test(url)) return `https://${url}`;
  return null;
}

export async function openExternal(raw: string | null | undefined): Promise<void> {
  const url = safeExternalUrl(raw);
  if (!url) return;
  await Linking.openURL(url).catch(() => {});
}
