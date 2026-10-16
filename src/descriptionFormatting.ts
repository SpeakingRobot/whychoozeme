export const DESCRIPTION_LIMIT = 2500;
export type DescriptionFormat = 'bold' | 'italic' | 'underline' | 'bullet' | 'numbered' | 'heading';

export function formatDescription(value: string, start: number, end: number, format: DescriptionFormat) {
  const from = Math.max(0, Math.min(start, value.length));
  const to = Math.max(from, Math.min(end, value.length));
  if (format === 'bullet' || format === 'numbered' || format === 'heading') {
    const lineStart = value.lastIndexOf('\n', from - 1) + 1;
    const lineEndIndex = value.indexOf('\n', to);
    const lineEnd = lineEndIndex < 0 ? value.length : lineEndIndex;
    const lines = value.slice(lineStart, lineEnd).split('\n');
    const replacement = lines.map((line, index) => {
      if (format === 'heading') return line.startsWith('## ') ? line.slice(3) : `## ${line}`;
      if (format === 'bullet') return line.startsWith('• ') ? line : `• ${line}`;
      return /^\d+\. /.test(line) ? line : `${index + 1}. ${line}`;
    }).join('\n');
    return { value: value.slice(0, lineStart) + replacement + value.slice(lineEnd), selection: { start: lineStart + replacement.length, end: lineStart + replacement.length } };
  }
  const marker = format === 'bold' ? '**' : format === 'italic' ? '*' : '++';
  const placeholder = format === 'bold' ? 'bold text' : format === 'italic' ? 'italic text' : 'underlined text';
  const content = value.slice(from, to) || placeholder;
  const alreadyWrapped = from >= marker.length && value.slice(from - marker.length, from) === marker && value.slice(to, to + marker.length) === marker;
  if (alreadyWrapped && to > from) return { value: value.slice(0, from - marker.length) + content + value.slice(to + marker.length), selection: { start: from - marker.length, end: to - marker.length } };
  const replacement = `${marker}${content}${marker}`;
  return { value: value.slice(0, from) + replacement + value.slice(to), selection: { start: from + marker.length, end: from + marker.length + content.length } };
}

export function insertDescriptionText(value: string, start: number, end: number, text: string) {
  const from = Math.max(0, Math.min(start, value.length));
  const to = Math.max(from, Math.min(end, value.length));
  const next = value.slice(0, from) + text + value.slice(to);
  return { value: next, selection: { start: from + text.length, end: from + text.length } };
}

export type DescriptionPart = { text: string; style?: 'bold' | 'italic' | 'underline' };
export function parseDescriptionLine(line: string): DescriptionPart[] {
  const parts: DescriptionPart[] = [];
  const pattern = /(\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|\+\+([^+\n]+)\+\+)/g;
  let cursor = 0;
  for (const match of line.matchAll(pattern)) {
    const index = match.index || 0;
    if (index > cursor) parts.push({ text: line.slice(cursor, index) });
    parts.push({ text: match[2] || match[3] || match[4], style: match[2] ? 'bold' : match[3] ? 'italic' : 'underline' });
    cursor = index + match[0].length;
  }
  if (cursor < line.length || !parts.length) parts.push({ text: line.slice(cursor) });
  return parts;
}
