export type SetupRole = 'finder' | 'freelancer';
export type SetupStep = 'role' | 'finder' | 'freelancer';

export type CompletionState = {
  role: SetupRole | null;
  finder: boolean;
  freelancer: boolean;
  photo: boolean;
  description: boolean;
};

export function setupSteps(state: CompletionState): SetupStep[] {
  if (!state.role) return ['role'];
  return state.role === 'finder' ? ['finder'] : ['freelancer'];
}

export function stepComplete(step: SetupStep, state: CompletionState): boolean {
  switch (step) {
    case 'role': return !!state.role;
    case 'finder': return state.finder;
    case 'freelancer': return state.freelancer && state.photo && state.description;
  }
}

export function nextIncompleteStep(state: CompletionState): SetupStep | null {
  return setupSteps(state).find(step => !stepComplete(step, state)) || null;
}
