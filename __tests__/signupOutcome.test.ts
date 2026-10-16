import { isExistingSignupError, signupOutcome } from '../src/signupOutcome';

test('a confirmed existing email never counts as a newly created account', () => {
  expect(signupOutcome({ user: { identities: [] }, session: null })).toBe('existing');
  expect(isExistingSignupError({ code: 'user_already_exists', message: 'User already registered' })).toBe(true);
  expect(isExistingSignupError({ code: 'email_exists', message: 'Email address already exists' })).toBe(true);
});

test('new registrations are distinguished by whether confirmation is required', () => {
  expect(signupOutcome({ user: { identities: [{}] }, session: null })).toBe('confirmation');
  expect(signupOutcome({ user: { identities: [{}] }, session: {} })).toBe('active');
});
