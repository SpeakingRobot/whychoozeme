import { documentUploadError, hasExactVideoRatio, MAX_DOCUMENT_BYTES, MAX_PHOTO_BYTES, MAX_VIDEO_BYTES, photoUploadError, videoUploadError } from '../src/mediaLimits';

describe('portfolio media limits', () => {
  const photo = { type: 'image/jpeg', size: MAX_PHOTO_BYTES - 1 };

  it('accepts the twentieth small photo and rejects an extra or oversized photo', () => {
    expect(photoUploadError([photo], 19)).toBeNull();
    expect(photoUploadError([photo], 20)).toMatch(/20/);
    expect(photoUploadError([{ ...photo, size: MAX_PHOTO_BYTES }], 0)).toMatch(/300 KB/);
  });

  it('requires one supported video under 14 MB at exactly 16:9', () => {
    expect(videoUploadError({ type: 'video/mp4', size: MAX_VIDEO_BYTES - 1 })).toBeNull();
    expect(videoUploadError({ type: 'video/mp4', size: MAX_VIDEO_BYTES })).toMatch(/14 MB/);
    expect(hasExactVideoRatio(1920, 1080)).toBe(true);
    expect(hasExactVideoRatio(1080, 1920)).toBe(false);
    expect(hasExactVideoRatio(854, 480)).toBe(false);
  });

  it('limits the whole document collection to 15 MB and rejects images', () => {
    expect(documentUploadError([{ type: 'application/pdf', size: 1024 }], MAX_DOCUMENT_BYTES - 1024)).toBeNull();
    expect(documentUploadError([{ type: 'text/plain', size: 1025 }], MAX_DOCUMENT_BYTES - 1024)).toMatch(/15 MB/);
    expect(documentUploadError([{ type: 'image/png', size: 100 }], 0)).toMatch(/not images/);
  });
});
