import wedding from '../assets/portfolio/wedding.jpg';
import design from '../assets/portfolio/design.jpg';
import video from '../assets/portfolio/video.jpg';
import guitar from '../assets/portfolio/guitar.jpg';
import events from '../assets/portfolio/events.jpg';
import makeup from '../assets/portfolio/makeup.jpg';
import tutoring from '../assets/portfolio/tutoring.jpg';
import performance from '../assets/portfolio/performance.jpg';

export type PortfolioPhoto = { source: number; label: string };
export type ProfileReview = { id: string; freelancerId: string; author: string; rating: number; body: string; date: string; demo?: boolean };

const demoGallery = (photos: PortfolioPhoto[]): PortfolioPhoto[] => Array.from({ length: 10 }, (_, index) => ({
  ...photos[index % photos.length],
  label: `${photos[index % photos.length].label} ${Math.floor(index / photos.length) + 1}`,
}));

export const demoPortfolio: Record<string, PortfolioPhoto[]> = {
  tanya: demoGallery([{ source: wedding, label: 'Wedding stories' }, { source: events, label: 'Celebrations in Goa' }]),
  arjun: demoGallery([{ source: video, label: 'Event reel editing' }, { source: events, label: 'Celebration film' }]),
  meera: demoGallery([{ source: design, label: 'Café identity' }, { source: video, label: 'Digital campaign' }]),
  ishaan: demoGallery([{ source: guitar, label: 'One-to-one guitar lessons' }, { source: performance, label: 'Live music' }]),
  rohan: demoGallery([{ source: events, label: 'Beach celebration' }, { source: wedding, label: 'Wedding coordination' }]),
  diya: demoGallery([{ source: makeup, label: 'Bridal makeup' }, { source: wedding, label: 'Wedding day styling' }]),
  neel: demoGallery([{ source: performance, label: 'Acoustic performance' }, { source: guitar, label: 'Guitar sessions' }]),
  sara: demoGallery([{ source: tutoring, label: 'Personal tutoring' }, { source: design, label: 'Creative study materials' }]),
};

export const demoReviews: ProfileReview[] = [
  { id: 'tanya-review-1', freelancerId: 'tanya', author: 'Anika P.', rating: 5, body: 'Tanya made us feel relaxed and caught all the little moments we would have missed.', date: 'Sep 2026', demo: true },
  { id: 'tanya-review-2', freelancerId: 'tanya', author: 'Dev R.', rating: 5, body: 'Beautiful photos, quick communication, and such a lovely presence at our event.', date: 'Aug 2026', demo: true },
  { id: 'arjun-review-1', freelancerId: 'arjun', author: 'Nisha M.', rating: 5, body: 'The reel felt exactly like our brand. Sharp pacing and a very easy process.', date: 'Sep 2026', demo: true },
  { id: 'arjun-review-2', freelancerId: 'arjun', author: 'Rohan D.', rating: 5, body: 'He turned a folder of clips into something we were excited to share.', date: 'Aug 2026', demo: true },
  { id: 'meera-review-1', freelancerId: 'meera', author: 'Kavya S.', rating: 5, body: 'Meera understood the personality of our café immediately. The designs feel so us.', date: 'Sep 2026', demo: true },
  { id: 'meera-review-2', freelancerId: 'meera', author: 'Aarav P.', rating: 5, body: 'Thoughtful ideas and polished files ready for print and social.', date: 'Jul 2026', demo: true },
  { id: 'ishaan-review-1', freelancerId: 'ishaan', author: 'Leena G.', rating: 5, body: 'Patient, encouraging, and always finds a song that makes practice fun.', date: 'Sep 2026', demo: true },
  { id: 'ishaan-review-2', freelancerId: 'ishaan', author: 'Sam D.', rating: 4, body: 'I learned my first full song much sooner than I expected.', date: 'Aug 2026', demo: true },
  { id: 'rohan-review-1', freelancerId: 'rohan', author: 'Priya N.', rating: 5, body: 'Every detail was taken care of. We could actually enjoy the party.', date: 'Sep 2026', demo: true },
  { id: 'rohan-review-2', freelancerId: 'rohan', author: 'Joel F.', rating: 5, body: 'Great local recommendations and calm coordination on the day.', date: 'Aug 2026', demo: true },
  { id: 'diya-review-1', freelancerId: 'diya', author: 'Ria K.', rating: 5, body: 'My makeup looked like me, just glowing. It lasted the whole celebration.', date: 'Sep 2026', demo: true },
  { id: 'diya-review-2', freelancerId: 'diya', author: 'Farah A.', rating: 5, body: 'She listened to what I wanted and made the morning feel effortless.', date: 'Aug 2026', demo: true },
  { id: 'neel-review-1', freelancerId: 'neel', author: 'Vikram S.', rating: 5, body: 'Lessons feel like a jam session. I look forward to practicing now.', date: 'Sep 2026', demo: true },
  { id: 'neel-review-2', freelancerId: 'neel', author: 'Maya J.', rating: 4, body: 'Friendly teaching and lots of useful tips between sessions.', date: 'Jul 2026', demo: true },
  { id: 'sara-review-1', freelancerId: 'sara', author: 'Pooja B.', rating: 5, body: 'Sara made the tricky topics click and helped build real confidence.', date: 'Sep 2026', demo: true },
  { id: 'sara-review-2', freelancerId: 'sara', author: 'Ishita R.', rating: 5, body: 'Clear explanations and a plan that made studying less stressful.', date: 'Aug 2026', demo: true },
];
