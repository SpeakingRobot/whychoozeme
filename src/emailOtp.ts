import type { SupabaseClient } from '@supabase/supabase-js';

type AuthMethods = Pick<SupabaseClient['auth'], 'signInWithOtp' | 'verifyOtp' | 'signOut'>;
type SignupDetails = { name: string; taluka: string; accountKind: 'finder' | 'freelancer' };

export async function requestEmailOtp(auth: AuthMethods, email: string, signup?: SignupDetails) {
  const { error } = await auth.signInWithOtp({ email, options: {
    shouldCreateUser: !!signup,
    ...(signup ? { data: { display_name: signup.name, taluka: signup.taluka, account_type: signup.accountKind } } : {}),
  } });
  if (error) throw new Error(error.message);
}

export async function confirmEmailOtp(auth: AuthMethods, email: string, token: string) {
  const { data, error } = await auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw new Error(error.message);
  if (!data.session || !data.user?.email_confirmed_at) {
    await auth.signOut();
    throw new Error('Email verification did not finish. Request a new code and try again.');
  }
  return data.user;
}
