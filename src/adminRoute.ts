export const ADMIN_PATH = '/goa-ops-8c5d76f19b';

export const isAdminRoute = typeof (globalThis as any).location?.pathname === 'string'
  && (globalThis as any).location.pathname.replace(/\/$/, '') === ADMIN_PATH;
