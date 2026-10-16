import { nextIncompleteStep, setupSteps, stepComplete, type CompletionState } from '../src/profileCompletion';

const empty: CompletionState = { role: null, finder: false, freelancer: false, photo: false, description: false, work: false, signature: false };

test('a new account is asked to choose a path before profile fields', () => {
  expect(setupSteps(empty)).toEqual(['role']);
  expect(nextIncompleteStep(empty)).toBe('role');
});

test('Finder setup keeps the signature separate from the public profile', () => {
  const state = { ...empty, role: 'finder' as const, finder: true };
  expect(setupSteps(state)).toEqual(['finder', 'signature']);
  expect(nextIncompleteStep(state)).toBe('signature');
  expect(nextIncompleteStep({ ...state, signature: true })).toBeNull();
});

test('Freelancer completion needs a photo and description as well as work settings', () => {
  const state = { ...empty, role: 'freelancer' as const, freelancer: true };
  expect(stepComplete('freelancer', state)).toBe(false);
  expect(nextIncompleteStep(state)).toBe('freelancer');
  expect(nextIncompleteStep({ ...state, photo: true, description: true })).toBe('work');
  expect(nextIncompleteStep({ ...state, photo: true, description: true, work: true })).toBe('signature');
});
