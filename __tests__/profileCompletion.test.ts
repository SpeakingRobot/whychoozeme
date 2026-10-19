import { nextIncompleteStep, setupSteps, stepComplete, type CompletionState } from '../src/profileCompletion';

const empty: CompletionState = { role: null, finder: false, freelancer: false, photo: false, description: false };

test('a new account is asked to choose a path before profile fields', () => {
  expect(setupSteps(empty)).toEqual(['role']);
  expect(nextIncompleteStep(empty)).toBe('role');
});

test('Finder setup is complete once the Finder profile is saved', () => {
  const state = { ...empty, role: 'finder' as const, finder: true };
  expect(setupSteps(state)).toEqual(['finder']);
  expect(nextIncompleteStep(state)).toBeNull();
});

test('Freelancer completion needs a photo and description', () => {
  const state = { ...empty, role: 'freelancer' as const, freelancer: true };
  expect(stepComplete('freelancer', state)).toBe(false);
  expect(nextIncompleteStep(state)).toBe('freelancer');
  expect(nextIncompleteStep({ ...state, photo: true, description: true })).toBeNull();
});
