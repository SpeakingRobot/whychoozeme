import { confirmEmailOtp, requestEmailOtp } from '../src/emailOtp';

function fakeAuth() {
  return {
    signInWithOtp: jest.fn().mockResolvedValue({ error: null }),
    verifyOtp: jest.fn(),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  } as any;
}

test('sign in cannot create a new user, while sign up preserves the chosen role', async () => {
  const auth = fakeAuth();
  await requestEmailOtp(auth, 'member@example.com');
  expect(auth.signInWithOtp).toHaveBeenLastCalledWith({ email: 'member@example.com', options: { shouldCreateUser: false } });
  await requestEmailOtp(auth, 'new@example.com', { name: 'New Member', taluka: 'Bardez', accountKind: 'freelancer' });
  expect(auth.signInWithOtp).toHaveBeenLastCalledWith({ email: 'new@example.com', options: {
    shouldCreateUser: true, data: { display_name: 'New Member', taluka: 'Bardez', account_type: 'freelancer' },
  } });
});

test('a code is required and an unconfirmed session is rejected', async () => {
  const auth = fakeAuth();
  auth.verifyOtp.mockResolvedValueOnce({ data: { session: null, user: null }, error: null });
  await expect(confirmEmailOtp(auth, 'member@example.com', '12345678')).rejects.toThrow('verification did not finish');
  expect(auth.signOut).toHaveBeenCalledTimes(1);
  auth.verifyOtp.mockResolvedValueOnce({ data: { session: {}, user: { id: 'member', email_confirmed_at: null } }, error: null });
  await expect(confirmEmailOtp(auth, 'member@example.com', '12345678')).rejects.toThrow('verification did not finish');
  expect(auth.signOut).toHaveBeenCalledTimes(2);
  auth.verifyOtp.mockResolvedValueOnce({ data: { session: {}, user: { id: 'member', email_confirmed_at: '2026-10-16' } }, error: null });
  await expect(confirmEmailOtp(auth, 'member@example.com', '12345678')).resolves.toMatchObject({ id: 'member' });
  expect(auth.verifyOtp).toHaveBeenLastCalledWith({ email: 'member@example.com', token: '12345678', type: 'email' });
});
