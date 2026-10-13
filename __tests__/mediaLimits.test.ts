import { hasExactVideoRatio, MAX_PHOTO_BYTES, MAX_VIDEO_BYTES, photoUploadError, videoUploadError } from '../src/mediaLimits';

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
});
