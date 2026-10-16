import { normalizeLinks, normalizeSoftware, publicHttpsUrl, softwareCatalog, softwareIcon } from '../src/software';

test('software search contains broad catalog and familiar tools', () => {
  expect(softwareCatalog.length).toBeGreaterThan(3000);
  expect(softwareCatalog.some(item => item.name === 'Figma')).toBe(true);
  expect(softwareCatalog.some(item => item.name === 'Adobe Photoshop')).toBe(true);
});

test('public profile links cannot use unsafe or local URLs', () => {
  expect(publicHttpsUrl('javascript:alert(1)')).toBeNull();
  expect(publicHttpsUrl('http://example.com')).toBeNull();
  expect(publicHttpsUrl('https://localhost/path')).toBeNull();
  expect(publicHttpsUrl('https://127.0.0.1/path')).toBeNull();
  expect(publicHttpsUrl('https://person:secret@example.com')).toBeNull();
  expect(normalizeLinks([{ title: 'Work', url: 'https://example.com/#section' }, { title: 'Bad', url: 'file:///etc/passwd' }])).toEqual([
    { title: 'Work', url: 'https://example.com/' },
  ]);
});

test('custom software keeps its public site for a favicon', () => {
  const [skill] = normalizeSoftware([{ name: 'A new editor', website: 'https://editor.example.com' }]);
  expect(softwareIcon(skill)).toContain('editor.example.com');
});

test('Adobe apps use their own product icons, including previously saved entries', () => {
  for (const [name, file] of [
    ['Adobe Photoshop', 'photoshop.svg'],
    ['Adobe Illustrator', 'illustrator.svg'],
    ['Adobe InDesign', 'indesign.svg'],
    ['Adobe Lightroom', 'lightroom.svg'],
    ['Adobe Premiere Pro', 'premiere-pro.svg'],
  ]) {
    expect(softwareIcon({ name, website: 'https://www.adobe.com' })?.endsWith(`/${file}`)).toBe(true);
  }
});
