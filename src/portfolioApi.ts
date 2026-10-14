import { db } from './liveApi';
import { documentUploadError, photoUploadError, videoUploadError } from './mediaLimits';

export type MediaKind = 'photo' | 'video' | 'document';
export type PortfolioAsset = {
  id: string; freelancer_id: string; kind: MediaKind; storage_path: string;
  file_name: string; mime_type: string; size_bytes: number; created_at: string; url: string;
};
const bucket = 'portfolio-public';
const client = () => { if (!db) throw new Error('Supabase is not configured.'); return db; };
const checked = (error: { message: string } | null) => { if (error) throw new Error(error.message); };

export async function listPortfolioAssets(freelancerId: string): Promise<PortfolioAsset[]> {
  const { data, error } = await client().from('portfolio_media')
    .select('id,freelancer_id,kind,storage_path,file_name,mime_type,size_bytes,created_at')
    .eq('freelancer_id', freelancerId).order('created_at', { ascending: true });
  checked(error);
  return (data || []).map(row => ({ ...row, url: client().storage.from(bucket).getPublicUrl(row.storage_path).data.publicUrl })) as PortfolioAsset[];
}

export async function uploadPortfolioAsset(freelancerId: string, kind: MediaKind, file: File, existing: PortfolioAsset[]): Promise<PortfolioAsset> {
  const validation = kind === 'photo' ? photoUploadError([file], existing.filter(item => item.kind === 'photo').length)
    : kind === 'video' ? videoUploadError(file)
    : documentUploadError([file], existing.filter(item => item.kind === 'document').reduce((sum, item) => sum + item.size_bytes, 0));
  if (validation) throw new Error(validation);
  const path = await uploadBlob(freelancerId, kind, file);
  const { error } = await client().from('portfolio_media').insert({ freelancer_id: freelancerId, kind,
    storage_path: path, file_name: file.name.slice(0, 180), mime_type: file.type, size_bytes: file.size });
  if (error) {
    await client().storage.from(bucket).remove([path]);
    throw new Error(error.message);
  }
  const assets = await listPortfolioAssets(freelancerId);
  const asset = assets.find(item => item.storage_path === path);
  if (!asset) throw new Error('Upload saved but could not be loaded. Refresh the profile.');
  return asset;
}

async function uploadBlob(freelancerId: string, kind: MediaKind, file: File): Promise<string> {
  const extensions: Record<string, string> = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp',
    'video/mp4':'mp4', 'video/webm':'webm', 'application/pdf':'pdf', 'text/plain':'txt',
    'text/markdown':'md', 'text/csv':'csv', 'application/msword':'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'docx',
    'application/rtf':'rtf', 'application/vnd.oasis.opendocument.text':'odt' };
  const extension = extensions[file.type];
  if (!extension) throw new Error('Unsupported file type.');
  const path = `${freelancerId}/${kind}/${crypto.randomUUID()}.${extension}`;
  const uploaded = await client().storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  checked(uploaded.error);
  return path;
}

export async function replacePortfolioVideo(freelancerId: string, file: File, old?: PortfolioAsset): Promise<void> {
  const validation = videoUploadError(file);
  if (validation) throw new Error(validation);
  const path = await uploadBlob(freelancerId, 'video', file);
  if (old) {
    const removed = await client().from('portfolio_media').delete().eq('id', old.id).eq('freelancer_id', freelancerId).select('id').maybeSingle();
    if (removed.error || !removed.data) {
      await client().storage.from(bucket).remove([path]);
      throw new Error(removed.error?.message || 'Previous video could not be replaced.');
    }
  }
  const { error } = await client().from('portfolio_media').insert({ freelancer_id: freelancerId, kind: 'video',
    storage_path: path, file_name: file.name.slice(0, 180), mime_type: file.type, size_bytes: file.size });
  if (error) {
    await client().storage.from(bucket).remove([path]);
    if (old) {
      const restored = await client().from('portfolio_media').insert({ id: old.id, freelancer_id: freelancerId, kind: 'video',
        storage_path: old.storage_path, file_name: old.file_name, mime_type: old.mime_type, size_bytes: old.size_bytes,
        created_at: old.created_at });
      if (restored.error) throw new Error(`Video update failed and the previous listing could not be restored: ${restored.error.message}`);
    }
    throw new Error(error.message);
  }
  if (old) await client().storage.from(bucket).remove([old.storage_path]);
}

export async function removePortfolioAsset(asset: PortfolioAsset): Promise<void> {
  const removed = await client().storage.from(bucket).remove([asset.storage_path]);
  checked(removed.error);
  const result = await client().from('portfolio_media').delete().eq('id', asset.id).eq('freelancer_id', asset.freelancer_id);
  checked(result.error);
}
