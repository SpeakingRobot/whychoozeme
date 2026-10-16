import { DESCRIPTION_LIMIT, formatDescription, insertDescriptionText, parseDescriptionLine } from '../src/descriptionFormatting';

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

  it('supports headings, numbered lines, toggled emphasis and emoji insertion', () => {
    expect(DESCRIPTION_LIMIT).toBe(2500);
    expect(formatDescription('First\nSecond', 0, 12, 'numbered').value).toBe('1. First\n2. Second');
    expect(formatDescription('About me', 0, 8, 'heading').value).toBe('## About me');
    expect(formatDescription('**hello**', 2, 7, 'bold').value).toBe('hello');
    expect(insertDescriptionText('Hello world', 6, 11, '✨').value).toBe('Hello ✨');
  });
});
