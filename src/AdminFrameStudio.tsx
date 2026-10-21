import React, { useEffect, useState } from 'react';
import { db } from './liveApi';

type FrameRow = { id: string; name: string; storage_path: string; active: boolean };

async function checkFrameImage(file: File): Promise<void> {
  if (!['image/png', 'image/webp'].includes(file.type) || file.size > 1024 * 1024 || file.size === 0) throw new Error('Use a transparent PNG or WebP under 1 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Could not read the frame image.')); image.src = url; });
    if (image.naturalWidth !== 1024 || image.naturalHeight !== 1024) throw new Error('Frame artwork must be exactly 1024 × 1024 pixels.');
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not check the transparent photo area.');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(64, 64, 896, 896).data;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 20) throw new Error('Keep the middle 896 × 896 photo area transparent. Use the outer 64 pixels for the frame artwork.');
    }
  } finally { URL.revokeObjectURL(url); }
}

export default function AdminFrameStudio() {
  const [frames, setFrames] = useState<FrameRow[]>([]);
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const refresh = async () => { if (!db) return; const result = await db.from('profile_frames').select('id,name,storage_path,active').order('created_at', { ascending: false }); if (result.error) throw new Error(result.error.message); setFrames(result.data || []); };
  useEffect(() => { void refresh().catch(() => {}); }, []);
  const upload = async () => {
    if (!db || !file || !name.trim()) { setNotice('Enter a frame name and choose the artwork.'); return; }
    setBusy(true); setNotice('');
    try {
      await checkFrameImage(file);
      const path = `${crypto.randomUUID()}.${file.type === 'image/png' ? 'png' : 'webp'}`;
      const uploaded = await db.storage.from('profile-frames').upload(path, file, { contentType: file.type, upsert: false });
      if (uploaded.error) throw new Error(uploaded.error.message);
      const saved = await db.from('profile_frames').insert({ name: name.trim().slice(0, 60), storage_path: path });
      if (saved.error) { await db.storage.from('profile-frames').remove([path]); throw new Error(saved.error.message); }
      setName(''); setFile(null); setNotice('Premium frame added. It appears as a locked choice for regular users.'); await refresh();
    } catch (cause) { setNotice((cause as Error).message); }
    finally { setBusy(false); }
  };
  const toggle = async (frame: FrameRow) => {
    if (!db) return;
    setBusy(true); setNotice('');
    const result = await db.from('profile_frames').update({ active: !frame.active }).eq('id', frame.id);
    if (result.error) setNotice(result.error.message); else await refresh();
    setBusy(false);
  };
  return <section style={{ background: '#fff', border: '1px solid #ded2f8', borderRadius: 20, padding: 24, marginTop: 22 }}>
    <h2 style={{ color: '#17172f', marginTop: 0 }}>Premium profile frames</h2>
    <p style={{ color: '#656a86', lineHeight: 1.5 }}>Design a 1024 × 1024 transparent PNG or WebP. Keep the center 896 × 896 pixels transparent so the photo stays visible. Artwork goes in the outer 64 pixel border.</p>
    <a href="/profile-frame-template.svg" download="whychoozeme-profile-frame-template.svg" style={{ display: 'inline-block', padding: '10px 15px', border: '1px solid #713af0', borderRadius: 12, color: '#713af0', fontWeight: 900, textDecoration: 'none', marginBottom: 17 }}>Download 1024 × 1024 template ↓</a>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'end' }}><label style={{ color: '#17172f', fontWeight: 800 }}>Frame name<input value={name} maxLength={60} onChange={event => setName(event.target.value)} style={{ display: 'block', padding: 10, borderRadius: 10, border: '1px solid #ddd2ee', marginTop: 5 }} /></label><label style={{ color: '#17172f', fontWeight: 800 }}>Transparent artwork<input type="file" accept="image/png,image/webp" onChange={event => setFile(event.target.files?.[0] || null)} style={{ display: 'block', marginTop: 5 }} /></label><button disabled={busy} onClick={() => void upload()} style={{ border: 0, borderRadius: 11, background: '#713af0', color: '#fff', fontWeight: 900, padding: '11px 16px', cursor: 'pointer' }}>Upload frame</button></div>
    {!!notice && <p role="status" style={{ color: '#6133b8' }}>{notice}</p>}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 11, marginTop: 17 }}>{frames.map(frame => <div key={frame.id} style={{ width: 145, border: '1px solid #e4d9f5', borderRadius: 13, padding: 10 }}><img src={db?.storage.from('profile-frames').getPublicUrl(frame.storage_path).data.publicUrl} alt={frame.name} style={{ width: 120, height: 120, background: '#f4eefc', borderRadius: 10 }} /><strong style={{ display: 'block', color: '#17172f' }}>{frame.name}</strong><small>{frame.active ? 'Visible · premium' : 'Hidden'}</small><button disabled={busy} onClick={() => void toggle(frame)} style={{ display: 'block', marginTop: 7, border: '1px solid #713af0', color: '#713af0', background: '#fff', borderRadius: 9, padding: '6px 9px', cursor: 'pointer' }}>{frame.active ? 'Hide' : 'Show'}</button></div>)}</div>
  </section>;
}
