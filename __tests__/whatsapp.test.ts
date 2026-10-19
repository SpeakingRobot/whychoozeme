import { publicWhatsapp, whatsappUrl, withoutWhatsapp } from '../src/whatsapp';

test('accepts an international number or a wa.me link', () => {
  expect(whatsappUrl('+91 98765 43210')).toBe('https://wa.me/919876543210');
  expect(whatsappUrl('https://wa.me/919876543210')).toBe('https://wa.me/919876543210');
  expect(whatsappUrl('98765')).toBeNull();
  expect(whatsappUrl('https://example.com/919876543210')).toBeNull();
});

test('only a deliberately labelled WhatsApp link appears as contact', () => {
  const links = [{ title: 'Portfolio', url: 'https://example.com' }, { title: 'WhatsApp', url: 'https://wa.me/919876543210' }];
  expect(publicWhatsapp(links)).toBe('https://wa.me/919876543210');
  expect(withoutWhatsapp(links)).toEqual([links[0]]);
});

test('uses only a published contact fallback when no WhatsApp portfolio link exists', () => {
  const links = [{ title: 'Portfolio', url: 'https://example.com' }];
  expect(publicWhatsapp(links)).toBeNull();
  expect(publicWhatsapp(links, '+91 98765 43210')).toBe('https://wa.me/919876543210');
  expect(publicWhatsapp(links, 'https://example.com/not-whatsapp')).toBeNull();
});
