import { freelancers, requestMatchesFreelancer, requestReach, RequestPost } from '../src/data';

const posted = Date.UTC(2026, 9, 12);
const request: RequestPost = { id: 'test', title: 'Photos', category: 'photography', details: 'Event', taluka: 'Tiswadi', finder: 'Test', createdAt: posted };
const tanya = freelancers.find(person => person.id === 'tanya')!;
const meera = freelancers.find(person => person.id === 'meera')!;

test('a matching request starts in its taluka and widens to all Goa', () => {
  expect(requestMatchesFreelancer(request, tanya, posted)).toBe(true);
  expect(requestReach(request, posted)).toBe('Same taluka');
  expect(requestReach(request, posted + 3 * 86400000)).toBe('All Goa');
});

test('category mismatch never enters the freelancer feed', () => {
  expect(requestMatchesFreelancer(request, meera, posted + 4 * 86400000)).toBe(false);
});
