import nodemailer, { type Transporter } from 'nodemailer';

// Outgoing email over the hosting's SMTP account. Configured with env vars on
// the server (never in the repo):
//   SMTP_HOST, SMTP_PORT (465 = SSL, 587 = STARTTLS), SMTP_USER, SMTP_PASS,
//   SMTP_FROM (e.g. "Oltinde <notificaciones@oltinde.com>").
// Without them email is simply skipped: notifications still reach the app
// and the website.

const SITE_URL = process.env.SITE_URL || 'https://oltinde.com';

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    transporter = null;
    return transporter;
  }
  const port = Number(SMTP_PORT) || 465;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    // Shared hosting SMTP can be slow; don't hold a request for long.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transporter;
}

export function isEmailConfigured(): boolean {
  return getTransporter() !== null;
}

export const absoluteLink = (link: string) => (link.startsWith('http') ? link : `${SITE_URL}${link.startsWith('/') ? '' : '/'}${link}`);

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// One simple branded layout for every email: logo, title, text, a yellow
// button and a footer saying why they got it and where to turn it off.
export function renderEmail({ title, paragraphs, cta, footer }: { title: string; paragraphs: string[]; cta?: { label: string; link: string }; footer?: string }): { html: string; text: string } {
  const button = cta
    ? `<p style="margin:28px 0"><a href="${escapeHtml(absoluteLink(cta.link))}" style="display:inline-block;background:#FFCD00;color:#000;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:6px">${escapeHtml(cta.label)}</a></p>`
    : '';
  const settings = `${SITE_URL}/profile`;
  const foot = footer ?? 'Recibe este correo por la actividad de su cuenta en Oltinde.';
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#F5F5F5;font-family:Arial,Helvetica,sans-serif;color:#1A1C1C">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F5;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E3E3E3;border-radius:8px">
<tr><td style="padding:20px 28px;border-bottom:4px solid #FFCD00"><img src="${SITE_URL}/oltinde-logo-header.webp" alt="Oltinde" width="132" style="display:block;height:auto"></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3">${escapeHtml(title)}</h1>
${paragraphs.map((p) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.55">${escapeHtml(p)}</p>`).join('')}
${button}
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #E3E3E3;font-size:12px;line-height:1.5;color:#6B6B6B">${escapeHtml(foot)} <a href="${settings}" style="color:#0062A0">Gestionar mis avisos</a></td></tr>
</table></td></tr></table></body></html>`;
  const text = [title, '', ...paragraphs, ...(cta ? ['', `${cta.label}: ${absoluteLink(cta.link)}`] : []), '', foot, `Gestionar mis avisos: ${settings}`].join('\n');
  return { html, text };
}

// Best effort: never throws, so a mail problem can't break the action that
// triggered it. Returns whether it was handed to the SMTP server.
export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }): Promise<boolean> {
  const t = getTransporter();
  if (!t || !to) return false;
  try {
    await t.sendMail({ from: process.env.SMTP_FROM || `Oltinde <${process.env.SMTP_USER}>`, to, subject, html, text });
    return true;
  } catch (error) {
    console.error(`Email to ${to} failed:`, error instanceof Error ? error.message : error);
    return false;
  }
}
