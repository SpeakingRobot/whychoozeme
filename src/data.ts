import rawCategories from './categories.json';

export type Category = { id: string; label: string; icon: string };
export const categories = rawCategories as Category[];

export type Taluka = 'Tiswadi' | 'Bardez' | 'Salcete' | 'Mormugao' | 'Ponda' | 'Bicholim' | 'Pernem' | 'Sattari' | 'Quepem' | 'Sanguem' | 'Canacona' | 'Dharbandora';
export const talukaCenters: Record<Taluka, { lat: number; lon: number }> = {
  Tiswadi: { lat: 15.4989, lon: 73.8278 },
  Bardez: { lat: 15.5768, lon: 73.7907 },
  Salcete: { lat: 15.2869, lon: 73.9720 },
  Mormugao: { lat: 15.3986, lon: 73.8089 },
  Ponda: { lat: 15.4021, lon: 74.0127 },
  Bicholim: { lat: 15.5979, lon: 73.9453 },
  Pernem: { lat: 15.7109, lon: 73.7937 },
  Sattari: { lat: 15.5742, lon: 74.1107 },
  Quepem: { lat: 15.2128, lon: 74.0775 },
  Sanguem: { lat: 15.2295, lon: 74.1519 },
  Canacona: { lat: 15.0134, lon: 74.0232 },
  Dharbandora: { lat: 15.3487, lon: 74.1063 },
};

export const places = ['Goa', ...Object.keys(talukaCenters)] as string[];

export type Freelancer = {
  id: string;
  name: string;
  role: string;
  category: string;
  tags: string[];
  taluka: Taluka;
  place: string;
  lat: number;
  lon: number;
  rating: number;
  reviews: number;
  distance: string;
  line: string;
  why: string;
  work: string[];
  image: number;
  imageUrl?: string;
  premium?: boolean;
  demo?: boolean;
  online?: boolean;
};

export const freelancers: Freelancer[] = [
  { id: 'tanya', name: 'Tanya Rodrigues', role: 'Photographer', category: 'photography', tags: ['wedding', 'portrait', 'event photography'], taluka: 'Tiswadi', place: 'Panaji', lat: 15.5001, lon: 73.8273, rating: 4.9, reviews: 62, distance: '1.2 km', line: 'Your go-to wedding photographer in Goa 🌴', why: 'I make real moments feel like memories you can hold. From a quiet proposal to a full family celebration, I bring an easygoing presence and a sharp eye for light.', work: ['Wedding stories', 'Portrait sessions', 'Brand shoots'], image: 0, online: true },
  { id: 'arjun', name: 'Arjun Naik', role: 'Video Editor', category: 'video', tags: ['reels', 'film', 'editing'], taluka: 'Tiswadi', place: 'Panaji', lat: 15.5030, lon: 73.8310, rating: 4.8, reviews: 48, distance: '2.1 km', line: 'I make reels that don’t look boring ⚡', why: 'I turn footage into stories people finish watching. Fast cuts, strong rhythm and a style that feels like you.', work: ['Social reels', 'Event films', 'Brand edits'], image: 1 },
  { id: 'meera', name: 'Meera K.', role: 'Graphic Designer', category: 'design', tags: ['branding', 'logo', 'illustration'], taluka: 'Bardez', place: 'Mapusa', lat: 15.5910, lon: 73.8080, rating: 4.9, reviews: 37, distance: '3.4 km', line: 'Bold designs for bolder brands 💖', why: 'I give small brands a big personality with thoughtful visuals that look joyful and work hard.', work: ['Visual identity', 'Packaging', 'Social templates'], image: 2 },
  { id: 'ishaan', name: 'Ishaan Pereira', role: 'Music Teacher', category: 'music', tags: ['guitar', 'lessons', 'music'], taluka: 'Bardez', place: 'Calangute', lat: 15.5437, lon: 73.7553, rating: 4.7, reviews: 28, distance: '4.1 km', line: 'Let’s make music a bigger part of your life 🎵', why: 'My lessons are built around the songs you love. We learn technique while making music from day one.', work: ['Beginner guitar', 'Songwriting', 'Live music'], image: 3 },
  { id: 'rohan', name: 'Rohan Shetty', role: 'Event Planner', category: 'events', tags: ['party', 'wedding', 'events'], taluka: 'Mormugao', place: 'Vasco', lat: 15.3959, lon: 73.8113, rating: 4.8, reviews: 40, distance: '2.6 km', line: 'From birthdays to beach parties — I got you! 🎉', why: 'I know the right people, places and little details that make a Goa celebration feel effortless.', work: ['Beach parties', 'Weddings', 'Private events'], image: 4 },
  { id: 'diya', name: 'Diya Sharma', role: 'Makeup Artist', category: 'makeup', tags: ['bridal', 'beauty', 'makeup'], taluka: 'Salcete', place: 'Margao', lat: 15.2832, lon: 73.9862, rating: 4.9, reviews: 52, distance: '3.0 km', line: 'Soft glam, bold you 💗', why: 'I listen first, then create a look that feels completely yours and lasts through every happy moment.', work: ['Bridal makeup', 'Editorial looks', 'Events'], image: 5 },
  { id: 'neel', name: 'Neel Coutinho', role: 'Guitar Teacher', category: 'music', tags: ['guitar', 'music', 'performance'], taluka: 'Ponda', place: 'Ponda', lat: 15.4025, lon: 74.0118, rating: 4.6, reviews: 24, distance: '3.8 km', line: 'Learn guitar, meet cool people, vibe together 🎵', why: 'I make guitar practice feel like a jam session. Start with a chord, leave with a song.', work: ['Acoustic lessons', 'Group sessions', 'Performance'], image: 6 },
  { id: 'sara', name: 'Sara Khan', role: 'Tutor', category: 'tutoring', tags: ['math', 'science', 'learning'], taluka: 'Tiswadi', place: 'Panaji', lat: 15.4898, lon: 73.8220, rating: 4.9, reviews: 31, distance: '4.5 km', line: 'Making tough subjects easy (and actually fun!) 📚', why: 'I explain ideas in a way that clicks, build confidence and make every lesson a little less scary.', work: ['Math tutoring', 'Science tutoring', 'Study plans'], image: 7 },
];

export type Finder = { name: string; email: string; taluka: Taluka };
export type RequestPost = { id: string; title: string; category: string; details: string; taluka: Taluka; createdAt: number; finder: string; finderId?: string; demo?: boolean };
export type ChatMessage = { id: string; freelancerId: string; body: string; from: 'finder' | 'freelancer'; time: number };

export const walkthroughFinder: Finder = { name: 'Rhea', email: 'preview@whychooseme.local', taluka: 'Tiswadi' };
export const walkthroughRequests: RequestPost[] = [
  { id: 'preview-own-brief', title: 'Photos for a family celebration', category: 'photography', details: 'Looking for warm, candid photos of a small celebration in Panaji next weekend.', taluka: 'Tiswadi', createdAt: Date.now() - 86400000, finder: 'You', finderId: 'preview-finder', demo: true },
  { id: 'preview-design-brief', title: 'A fresh look for my café', category: 'design', details: 'Need a friendly logo and a few social templates for a new café in Mapusa.', taluka: 'Bardez', createdAt: Date.now() - 172800000, finder: 'Nisha', demo: true },
  { id: 'preview-video-brief', title: 'Edit a short event reel', category: 'video', details: 'I have clips from our community event and want a lively 30-second reel.', taluka: 'Tiswadi', createdAt: Date.now() - 259200000, finder: 'Dev', demo: true },
];
export const walkthroughMessages: ChatMessage[] = [
  { id: 'preview-chat-1', freelancerId: 'arjun', body: 'Hi! Could you help me edit a short reel for an event?', from: 'finder', time: Date.now() - 3600000 },
  { id: 'preview-chat-2', freelancerId: 'arjun', body: 'Absolutely. Send me the clips and the style you have in mind.', from: 'freelancer', time: Date.now() - 3300000 },
  { id: 'preview-chat-3', freelancerId: 'meera', body: 'I love your work. Are you available for a café logo?', from: 'finder', time: Date.now() - 7200000 },
  { id: 'preview-inquiry-1', freelancerId: 'preview-finder', body: 'Hi Tanya! Are you available for a family celebration next weekend?', from: 'finder', time: Date.now() - 5400000 },
];

export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function requestReach(post: RequestPost, now = Date.now()) {
  const days = Math.floor((now - post.createdAt) / 86400000);
  return days < 1 ? 'Same taluka' : days < 2 ? 'Nearby talukas' : days < 3 ? 'Across your region' : 'All Goa';
}

export function requestMatchesFreelancer(post: RequestPost, person: Freelancer, now = Date.now()) {
  if (post.category !== 'other' && post.category !== person.category) return false;
  const days = Math.floor((now - post.createdAt) / 86400000);
  if (days >= 3) return true;
  if (days < 1) return person.taluka === post.taluka;
  const km = distanceKm(talukaCenters[post.taluka], person);
  return km <= (days < 2 ? 25 : 60);
}
