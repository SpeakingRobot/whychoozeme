export type SignupOutcome = 'active' | 'confirmation' | 'existing';

export function signupOutcome(data: { user: { identities?: unknown[] } | null; session: unknown | null }): SignupOutcome {
  // Supabase can return an obfuscated user with no identities for an email that
  // is already registered when email confirmation is enabled.
  if (data.user?.identities?.length === 0) return 'existing';
  if (!data.user) throw new Error('Registration did not return an account. Please try again.');
  return data.session ? 'active' : 'confirmation';
}

export function isExistingSignupError(error: { code?: string; message: string }): boolean {
  return error.code === 'user_already_exists' || error.code === 'email_exists' || /user already registered|email already exists/i.test(error.message);
}
