export const MAX_PHOTOS = 20;
export const MAX_PHOTO_BYTES = 300 * 1024;
export const MAX_VIDEO_BYTES = 14 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
export const DOCUMENT_MIME_TYPES = [
  'application/pdf', 'text/plain', 'text/markdown', 'text/csv',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/rtf', 'application/vnd.oasis.opendocument.text',
] as const;

type PickedFile = { type: string; size: number };

export function photoUploadError(files: PickedFile[], currentCount: number): string | null {
  if (currentCount + files.length > MAX_PHOTOS) return 'You can add up to 20 portfolio photos.';
  if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size <= 0 || file.size >= MAX_PHOTO_BYTES)) return 'Each photo must be JPEG, PNG or WebP and under 300 KB.';
  return null;
}

export function videoUploadError(file: PickedFile): string | null {
  return ['video/mp4', 'video/webm'].includes(file.type) && file.size > 0 && file.size < MAX_VIDEO_BYTES ? null : 'Choose one MP4 or WebM video under 14 MB.';
}

export function hasExactVideoRatio(width: number, height: number): boolean {
  return width > 0 && height > 0 && width * 9 === height * 16;
}

export function documentUploadError(files: PickedFile[], currentBytes: number): string | null {
  if (!files.length || files.some(file => !DOCUMENT_MIME_TYPES.includes(file.type as typeof DOCUMENT_MIME_TYPES[number]) || file.size <= 0)) return 'Choose supported PDF, text, or word processing documents, not images or videos.';
  if (currentBytes + files.reduce((sum, file) => sum + file.size, 0) > MAX_DOCUMENT_BYTES) return 'All documents together must stay within 15 MB.';
  return null;
}
