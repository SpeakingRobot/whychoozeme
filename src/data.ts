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
  description?: string;
  software?: import('./software').SoftwareSkill[];
  links?: import('./software').PortfolioLink[];
  publicWhatsappUrl?: string;
  work: string[];
  image: number;
  imageUrl?: string;
  certifications?: Certification[];
  experience?: WorkExperience[];
  framePreset?: string;
  frameCustomId?: string;
  frameOverlayUrl?: string;
  premium?: boolean;
  demo?: boolean;
  lastActiveAt?: string;
  responseMinutes?: number;
  responseSamples?: number;
};

export type Certification = { name: string; issuer: string; year?: string; imagePath?: string };
export type WorkExperience = { role: string; organization: string; period?: string; summary?: string };
export type Finder = { name: string; email: string; taluka: Taluka; avatarPath?: string; imageUrl?: string };
export type RequestPost = { id: string; title: string; category: string; details: string; taluka: Taluka; createdAt: number; finder: string; finderId?: string; moderationStatus?: 'clear' | 'under_review' };
export type ChatMessage = { id: string; freelancerId: string; body: string; from: 'finder' | 'freelancer'; time: number; attachment?: import('./liveApi').ChatAttachment };

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
