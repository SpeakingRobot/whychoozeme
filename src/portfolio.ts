import wedding from '../assets/portfolio/wedding.jpg';
import design from '../assets/portfolio/design.jpg';
import video from '../assets/portfolio/video.jpg';
import guitar from '../assets/portfolio/guitar.jpg';
import events from '../assets/portfolio/events.jpg';
import makeup from '../assets/portfolio/makeup.jpg';
import tutoring from '../assets/portfolio/tutoring.jpg';
import performance from '../assets/portfolio/performance.jpg';

export type PortfolioPhoto = { source: number; label: string };

const sampleGallery = (photos: PortfolioPhoto[]): PortfolioPhoto[] => Array.from({ length: 10 }, (_, index) => ({
  ...photos[index % photos.length],
  label: `${photos[index % photos.length].label} ${Math.floor(index / photos.length) + 1}`,
}));

export const samplePortfolio: Record<string, PortfolioPhoto[]> = {
  tanya: sampleGallery([{ source: wedding, label: 'Wedding stories' }, { source: events, label: 'Celebrations in Goa' }]),
  arjun: sampleGallery([{ source: video, label: 'Event reel editing' }, { source: events, label: 'Celebration film' }]),
  meera: sampleGallery([{ source: design, label: 'Café identity' }, { source: video, label: 'Digital campaign' }]),
  ishaan: sampleGallery([{ source: guitar, label: 'One-to-one guitar lessons' }, { source: performance, label: 'Live music' }]),
  rohan: sampleGallery([{ source: events, label: 'Beach celebration' }, { source: wedding, label: 'Wedding coordination' }]),
  diya: sampleGallery([{ source: makeup, label: 'Bridal makeup' }, { source: wedding, label: 'Wedding day styling' }]),
  neel: sampleGallery([{ source: performance, label: 'Acoustic performance' }, { source: guitar, label: 'Guitar sessions' }]),
  sara: sampleGallery([{ source: tutoring, label: 'Personal tutoring' }, { source: design, label: 'Creative study materials' }]),
};
