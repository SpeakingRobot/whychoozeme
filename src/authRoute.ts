export type AuthMode = 'join' | 'signIn';

export function authModeFromUrl(pathname: string, search: string): AuthMode {
  if (pathname !== '/auth') return 'signIn';
  const mode = new URLSearchParams(search).get('mode');
  return mode === 'signup' ? 'join' : 'signIn';
}

export function authUrl(mode: AuthMode) {
  return `/auth?mode=${mode === 'join' ? 'signup' : 'signin'}`;
}
