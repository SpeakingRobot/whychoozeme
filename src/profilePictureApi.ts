import { db } from './liveApi';

const bucket = 'portfolio-public';
const allowed: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function profilePictureError(file: File): string | null {
  if (!allowed[file.type]) return 'Choose a JPEG, PNG or WebP image.';
  if (file.size > 2 * 1024 * 1024) return 'Choose a profile photo under 2 MB.';
  if (!file.size) return 'This image is empty.';
  return null;
}

export async function uploadProfilePicture(userId: string, file: File, previousUrl?: string): Promise<string> {
  const error = profilePictureError(file);
  if (error) throw new Error(error);
  if (!db) throw new Error('Supabase is not configured.');
  const path = `${userId}/photo/avatar-${crypto.randomUUID()}.${allowed[file.type]}`;
  const stored = await db.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (stored.error) throw new Error(stored.error.message);
  const url = db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  const saved = await db.from('freelancer_profiles').update({ image_url: url }).eq('user_id', userId).select('user_id').single();
  if (saved.error || !saved.data) {
    await db.storage.from(bucket).remove([path]);
    throw new Error(saved.error?.message || 'Profile photo could not be saved.');
  }
  const oldPath = previousUrl?.split(`/storage/v1/object/public/${bucket}/`)[1]?.split('?')[0];
  if (oldPath?.startsWith(`${userId}/photo/avatar-`)) await db.storage.from(bucket).remove([oldPath]);
  return url;
}

export async function uploadFinderPicture(userId: string, file: File, previousPath?: string): Promise<string> {
  const error = profilePictureError(file);
  if (error) throw new Error(error);
  if (!db) throw new Error('Supabase is not configured.');
  const avatarBucket = 'finder-avatars';
  const path = `${userId}/${crypto.randomUUID()}.${allowed[file.type]}`;
  const stored = await db.storage.from(avatarBucket).upload(path, file, { contentType: file.type, upsert: false });
  if (stored.error) throw new Error(stored.error.message);
  const saved = await db.from('finder_profiles').update({ avatar_path: path }).eq('user_id', userId).select('user_id').single();
  if (saved.error || !saved.data) {
    await db.storage.from(avatarBucket).remove([path]);
    throw new Error(saved.error?.message || 'Finder photo could not be saved.');
  }
  if (previousPath?.startsWith(`${userId}/`)) await db.storage.from(avatarBucket).remove([previousPath]);
  return path;
}

export async function removeFinderPicture(userId: string, path: string): Promise<void> {
  if (!db) throw new Error('Supabase is not configured.');
  const saved = await db.from('finder_profiles').update({ avatar_path: null }).eq('user_id', userId).select('user_id').single();
  if (saved.error || !saved.data) throw new Error(saved.error?.message || 'Finder photo could not be removed.');
  if (path.startsWith(`${userId}/`)) await db.storage.from('finder-avatars').remove([path]);
}
