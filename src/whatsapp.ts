import { PortfolioLink } from './software';

const phonePattern = /^[1-9]\d{7,14}$/;

export function whatsappUrl(input: string): string | null {
  const trimmed = input.trim();
  const fromLink = /^https:\/\/wa\.me\/([1-9]\d{7,14})\/?$/i.exec(trimmed);
  if (fromLink) return `https://wa.me/${fromLink[1]}`;
  const digits = trimmed.replace(/[\s()+-]/g, '');
  return phonePattern.test(digits) ? `https://wa.me/${digits}` : null;
}

export function publicWhatsapp(links: PortfolioLink[] | undefined, publicContactUrl?: string): string | null {
  const link = links?.find(item => item.title.trim().toLowerCase() === 'whatsapp');
  return (link && whatsappUrl(link.url)) || (publicContactUrl && whatsappUrl(publicContactUrl)) || null;
}

export function withoutWhatsapp(links: PortfolioLink[] | undefined): PortfolioLink[] {
  return (links || []).filter(item => item.title.trim().toLowerCase() !== 'whatsapp');
}
