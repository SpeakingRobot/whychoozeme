import rawCatalog from './softwareCatalog.json';

export type SoftwareSkill = { name: string; slug?: string; website?: string };
export type PortfolioLink = { title: string; url: string };
export const softwareCatalog = rawCatalog as SoftwareSkill[];

export function publicHttpsUrl(input: string): string | null {
  try {
    const url = new URL(input.trim());
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !host.includes('.') ||
      host === 'localhost' || host.endsWith('.local') || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) ||
      host.includes('..')) return null;
    url.hash = '';
    return url.toString();
  } catch { return null; }
}

export function softwareIcon(skill: SoftwareSkill): string | null {
  if (skill.slug && /^[a-z0-9_]+$/.test(skill.slug))
    return `https://cdn.jsdelivr.net/npm/simple-icons@16.35.0/icons/${skill.slug}.svg`;
  const website = skill.website && publicHttpsUrl(skill.website);
  return website ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(website).hostname)}&sz=64` : null;
}

export function normalizeSoftware(value: unknown): SoftwareSkill[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 50).filter(item => item && typeof item.name === 'string' && item.name.trim().length > 0).map(item => ({
    name: item.name.trim().slice(0, 80),
    ...(typeof item.slug === 'string' && /^[a-z0-9_]+$/.test(item.slug) ? { slug: item.slug } : {}),
    ...(typeof item.website === 'string' && publicHttpsUrl(item.website) ? { website: publicHttpsUrl(item.website)! } : {}),
  }));
}

export function normalizeLinks(value: unknown): PortfolioLink[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 30).flatMap(item => {
    const url = typeof item?.url === 'string' ? publicHttpsUrl(item.url) : null;
    if (!url) return [];
    const title = typeof item.title === 'string' && item.title.trim() ? item.title.trim().slice(0, 100) : new URL(url).hostname;
    return [{ title, url }];
  });
}
