import { compressChatImage, CHAT_IMAGE_TARGET_BYTES } from './chatImages';
import { db } from './liveApi';

const bucket = 'certificate-images';
const mimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const client = () => { if (!db) throw new Error('Supabase is not configured.'); return db; };

export function certificationImageUrl(path?: string): string | undefined {
  return path ? client().storage.from(bucket).getPublicUrl(path).data.publicUrl : undefined;
}

export async function uploadCertificationImage(userId: string, file: File): Promise<string> {
  if (!mimeTypes.has(file.type)) throw new Error('Choose a JPEG, PNG or WebP certificate image.');
  if (!file.size) throw new Error('Choose a non-empty certificate image.');
  const image = await compressChatImage(file);
  if (!mimeTypes.has(image.type) || image.size > CHAT_IMAGE_TARGET_BYTES) throw new Error('Could not resize this image below 300 KB.');
  const extension = image.type === 'image/jpeg' ? 'jpg' : image.type === 'image/png' ? 'png' : 'webp';
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const result = await client().storage.from(bucket).upload(path, image, { contentType: image.type, upsert: false });
  if (result.error) throw new Error(result.error.message);
  return path;
}

export async function removeCertificationImages(paths: string[]): Promise<void> {
  if (!paths.length) return;
  const result = await client().storage.from(bucket).remove(paths);
  if (result.error) throw new Error(result.error.message);
}
