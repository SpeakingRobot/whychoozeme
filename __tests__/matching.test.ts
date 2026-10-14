import { Freelancer, requestMatchesFreelancer, requestReach, RequestPost, talukaCenters } from '../src/data';

const posted = Date.UTC(2026, 9, 12);
const request: RequestPost = { id: 'test', title: 'Photos', category: 'photography', details: 'Event', taluka: 'Tiswadi', finder: 'Test', createdAt: posted };
const person = (category: string, taluka: 'Tiswadi' | 'Bardez'): Freelancer => ({
  id: category, name: 'Test freelancer', role: 'Creative', category, tags: [], taluka,
  place: taluka, ...talukaCenters[taluka], rating: 0, reviews: 0, distance: '', line: '', why: '', work: [], image: -1,
});
const tanya = person('photography', 'Tiswadi');
const meera = person('design', 'Bardez');

test('a matching request starts in its taluka and widens to all Goa', () => {
  expect(requestMatchesFreelancer(request, tanya, posted)).toBe(true);
  expect(requestReach(request, posted)).toBe('Same taluka');
  expect(requestReach(request, posted + 3 * 86400000)).toBe('All Goa');
});

test('category mismatch never enters the freelancer feed', () => {
  expect(requestMatchesFreelancer(request, meera, posted + 4 * 86400000)).toBe(false);
});
