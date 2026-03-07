import crypto from 'node:crypto';

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

const HTML_ESCAPE_RE = /[&<>"']/g;

export function sanitizeHtml(input: string | null | undefined): string {
  if (input == null) return '';
  return String(input).replace(HTML_ESCAPE_RE, (ch) => HTML_ESCAPE_MAP[ch]);
}

export function maskToken(token: string | null | undefined): string {
  if (!token || token.length < 8) return '****';
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

export function generateCsrfState(): string {
  return crypto.randomBytes(32).toString('hex');
}
