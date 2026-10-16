import { formatDescription, parseDescriptionLine } from '../src/descriptionFormatting';

describe('profile description formatting', () => {
  it('formats a selected phrase without changing surrounding text', () => {
    expect(formatDescription('I make portraits in Goa', 7, 16, 'bold').value).toBe('I make **portraits** in Goa');
    expect(formatDescription('hello', 0, 5, 'underline').value).toBe('++hello++');
  });

  it('bullets each selected line and keeps existing bullets', () => {
    const value = 'Intro\nFirst\n• Second\nOutro';
    expect(formatDescription(value, 6, 20, 'bullet').value).toBe('Intro\n• First\n• Second\nOutro');
  });

  it('parses emphasis into display parts without treating it as HTML', () => {
    expect(parseDescriptionLine('A **bold** and *warm* ++underlined++ note')).toEqual([
      { text: 'A ' }, { text: 'bold', style: 'bold' }, { text: ' and ' },
      { text: 'warm', style: 'italic' }, { text: ' ' },
      { text: 'underlined', style: 'underline' }, { text: ' note' },
    ]);
  });
});
