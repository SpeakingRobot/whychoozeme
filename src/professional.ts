import type { Certification, WorkExperience } from './data';

const clean = (value: unknown, limit: number) => typeof value === 'string' ? value.trim().slice(0, limit) : '';

export function normalizeCertifications(value: unknown): Certification[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).map(item => ({
    name: clean(item?.name, 120), issuer: clean(item?.issuer, 120), year: clean(item?.year, 20),
    imagePath: clean(item?.imagePath, 180),
  })).filter(item => item.name && item.issuer);
}

export function normalizeExperience(value: unknown): WorkExperience[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).map(item => ({
    role: clean(item?.role, 120), organization: clean(item?.organization, 120),
    period: clean(item?.period, 60), summary: clean(item?.summary, 500),
  })).filter(item => item.role && item.organization);
}
