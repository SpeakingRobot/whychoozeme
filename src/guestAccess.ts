export const GUEST_PROFILE_LIMIT = 3;

export function guestProfileVisit(viewedIds: string[], profileId: string) {
  const viewed = [...new Set(viewedIds.filter(id => typeof id === 'string'))];
  if (viewed.includes(profileId)) return { allowed: true, viewed };
  if (viewed.length >= GUEST_PROFILE_LIMIT) return { allowed: false, viewed };
  return { allowed: true, viewed: [...viewed, profileId] };
}
