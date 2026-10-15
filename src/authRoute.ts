export type AuthMode = 'join' | 'signIn' | 'reset' | 'recovery';

export function authModeFromUrl(pathname: string, search: string): AuthMode {
  if (pathname !== '/auth') return 'signIn';
  const mode = new URLSearchParams(search).get('mode');
  return mode === 'signup' ? 'join' : mode === 'reset' ? 'reset' : mode === 'recovery' ? 'recovery' : 'signIn';
}

export function authUrl(mode: AuthMode) {
  return `/auth?mode=${mode === 'join' ? 'signup' : mode === 'signIn' ? 'signin' : mode}`;
}
