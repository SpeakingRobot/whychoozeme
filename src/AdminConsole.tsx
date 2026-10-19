import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { account, db, isAdmin, sendEmailCode, signOut, verifyEmailCode } from './liveApi';
import { ADMIN_PATH } from './adminRoute';

type Profile = Record<string, any>;
type AdminUser = {
  id: string;
  email?: string;
  createdAt?: string;
  confirmedAt?: string;
  bannedUntil?: string | null;
  premium: boolean;
  freelancer: Profile | null;
  finder: Profile | null;
  contact: Profile | null;
};
type UserList = { users: AdminUser[]; page: number; hasMore: boolean };
type UserDetail = {
  services: { id: string; title: string; description: string; active: boolean }[];
  media: { id: string; kind: string; file_name: string }[];
  requests: { id: string; title: string; details: string; status: string }[];
  flags: { id: string; reason: string; created_at: string }[];
};
type Tab = 'all' | 'freelancers' | 'finders';
type EditField = { key: string; label: string; multiline?: boolean };

const freelancerFields: EditField[] = [
  { key: 'display_name', label: 'Display name' },
  { key: 'role_title', label: 'Role title' },
  { key: 'category_slug', label: 'Category slug' },
  { key: 'taluka', label: 'Taluka' },
  { key: 'locality', label: 'Locality' },
  { key: 'why_me', label: 'Why choose me', multiline: true },
  { key: 'tags', label: 'Tags, comma separated' },
  { key: 'portfolio', label: 'Portfolio items, one per line', multiline: true },
  { key: 'image_url', label: 'Image URL (HTTPS)' },
];
const finderFields: EditField[] = [
  { key: 'display_name', label: 'Display name' },
  { key: 'taluka', label: 'Taluka' },
];
const ink = '#17172f';
const purple = '#713af0';

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  if (!db) throw new Error('Supabase settings are missing.');
  const { data, error } = await db.functions.invoke('admin-console', { body });
  if (error) {
    let detail = error.message;
    try {
      const response = (error as any).context;
      const payload = await response?.json?.();
      detail = payload?.error || detail;
    } catch { /* Preserve the transport error. */ }
    throw new Error(detail);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

function profileDraft(profile: Profile | null, kind: 'freelancer' | 'finder') {
  const fields = kind === 'freelancer' ? freelancerFields : finderFields;
  return Object.fromEntries(fields.map(field => [field.key,
    Array.isArray(profile?.[field.key])
      ? profile[field.key].join(field.key === 'tags' ? ', ' : '\n')
      : String(profile?.[field.key] ?? ''),
  ])) as Record<string, string>;
}

function isBanned(user: AdminUser) {
  return !!user.bannedUntil && new Date(user.bannedUntil).getTime() > Date.now();
}

export default function AdminConsole() {
  const [authState, setAuthState] = useState<'loading' | 'signed-out' | 'forbidden' | 'admin'>('loading');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSentTo, setCodeSentTo] = useState('');
  const [viewerEmail, setViewerEmail] = useState('');
  const [list, setList] = useState<UserList>({ users: [], page: 1, hasMore: false });
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editKind, setEditKind] = useState<'freelancer' | 'finder'>('freelancer');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async (page: number) => {
    setBusy(true);
    setError('');
    try {
      const result = await invoke<UserList>({ action: 'list', page });
      setList(result);
      setSelectedId(current => result.users.some(user => user.id === current) ? current : result.users[0]?.id || null);
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { user } = await account();
        if (!active) return;
        if (!user?.email_confirmed_at) { setAuthState('signed-out'); return; }
        setViewerEmail(user.email || '');
        const allowed = await isAdmin(user.id);
        if (!active) return;
        setAuthState(allowed ? 'admin' : 'forbidden');
        if (allowed) void load(1);
      } catch (cause) {
        if (active) { setError((cause as Error).message); setAuthState('signed-out'); }
      }
    })();
    return () => { active = false; };
  }, [load]);

  const selected = list.users.find(user => user.id === selectedId) || null;
  const visible = useMemo(() => list.users.filter(user => {
    if (tab === 'freelancers' && !user.freelancer) return false;
    if (tab === 'finders' && !user.finder) return false;
    const terms = `${user.email || ''} ${user.id} ${user.freelancer?.display_name || ''} ${user.finder?.display_name || ''}`.toLowerCase();
    return terms.includes(query.trim().toLowerCase());
  }), [list.users, tab, query]);

  useEffect(() => {
    if (!selected) return;
    const kind = selected.freelancer ? 'freelancer' : 'finder';
    setEditKind(kind);
    setDraft(profileDraft(kind === 'freelancer' ? selected.freelancer : selected.finder, kind));
  }, [selected]);

  useEffect(() => {
    if (!selectedId || authState !== 'admin') { setDetail(null); return; }
    let active = true;
    setDetail(null);
    invoke<UserDetail>({ action: 'detail', userId: selectedId })
      .then(result => { if (active) setDetail(result); })
      .catch(cause => { if (active) setError((cause as Error).message); });
    return () => { active = false; };
  }, [selectedId, authState, list]);

  useEffect(() => { setFlagReason(''); setDeleteConfirm(''); setDeleteOpen(false); }, [selectedId]);

  const chooseKind = (kind: 'freelancer' | 'finder') => {
    setEditKind(kind);
    setDraft(profileDraft(kind === 'freelancer' ? selected?.freelancer || null : selected?.finder || null, kind));
  };
  const mutate = async (body: Record<string, unknown>, success: string) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await invoke<{ auditRecorded?: boolean }>(body);
      setNotice(result.auditRecorded === false ? `${success} Audit log write failed; check function logs.` : success);
      await load(list.page);
      return true;
    } catch (cause) { setError((cause as Error).message); return false; }
    finally { setBusy(false); }
  };
  const saveProfile = () => {
    if (!selected) return;
    const current = editKind === 'freelancer' ? selected.freelancer : selected.finder;
    if (!current) return;
    const fields = editKind === 'freelancer' ? freelancerFields : finderFields;
    const values: Record<string, unknown> = {};
    for (const field of fields) {
      const next = field.key === 'tags' ? draft.tags.split(',').map(v => v.trim()).filter(Boolean)
        : field.key === 'portfolio' ? draft.portfolio.split('\n').map(v => v.trim()).filter(Boolean)
          : field.key === 'image_url' ? (draft.image_url.trim() || null) : draft[field.key].trim();
      const prior = current[field.key] ?? (field.key === 'tags' || field.key === 'portfolio' ? [] : field.key === 'image_url' ? null : '');
      if (JSON.stringify(next) !== JSON.stringify(prior)) values[field.key] = next;
    }
    if (!Object.keys(values).length) { setNotice('No profile changes to save.'); return; }
    void mutate({ action: 'editProfile', userId: selected.id, kind: editKind, values }, 'Profile updated.');
  };
  const doSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      if (!codeSentTo) {
        await sendEmailCode(email.trim().toLowerCase());
        setCodeSentTo(email.trim().toLowerCase());
        setNotice('Enter the 8-digit code sent to your email.');
      } else {
        const user = await verifyEmailCode(codeSentTo, code.trim());
        setCode(''); setCodeSentTo('');
        setViewerEmail(user.email || '');
        const allowed = await isAdmin(user.id);
        setAuthState(allowed ? 'admin' : 'forbidden');
        if (allowed) await load(1);
      }
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  };
  const doSignOut = async () => {
    try { await signOut(); setAuthState('signed-out'); setList({ users: [], page: 1, hasMore: false }); setSelectedId(null); setError(''); }
    catch (cause) { setError((cause as Error).message); }
  };
  const deleteSelected = async () => {
    if (!selected || deleteConfirm !== (selected.email || selected.id)) return;
    if (await mutate({ action: 'deleteUser', userId: selected.id }, 'Auth account and test data permanently deleted. This email can sign up again.')) {
      setDeleteConfirm('');
      setDeleteOpen(false);
      setDetail(null);
    }
  };
  const removeListing = (kind: 'service' | 'media' | 'request', itemId: string, label: string) => {
    if (!selected || !window.confirm(`Permanently remove ${label}?`)) return;
    void mutate({ action: 'removeContent', userId: selected.id, kind, itemId }, `${label} removed.`);
  };
  const flagSelected = async () => {
    if (!selected) return;
    if (await mutate({ action: 'flagUser', userId: selected.id, reason: flagReason.trim() }, 'Flag sent to the user.')) setFlagReason('');
  };

  return <div style={{ minHeight: '100vh', background: '#f8f6fc', color: ink, fontFamily: 'Nunito, sans-serif' }}>
    <header style={{ background: '#fff', borderBottom: '1px solid #e9e4f1', padding: '18px max(24px, calc((100vw - 1360px) / 2))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
      <div><div style={{ fontWeight: 900, fontSize: 22 }}>WhyChoozeMe <span style={{ color: purple }}>Operations</span></div><div style={{ color: '#77748c', fontSize: 12 }}>User and profile management</div></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><a href="/" style={{ color: purple, fontWeight: 800 }}>View site</a>{viewerEmail && <span style={{ fontSize: 13 }}>{viewerEmail}</span>}{authState !== 'signed-out' && authState !== 'loading' && <button style={buttonStyle(true)} onClick={doSignOut}>Sign out</button>}</div>
    </header>
    <main style={{ maxWidth: 1360, margin: '0 auto', padding: '30px 24px 70px' }}>
      {authState === 'loading' && <p>Checking access…</p>}
      {authState === 'signed-out' && <section style={{ ...cardStyle, maxWidth: 450, margin: '60px auto' }}>
        <h1 style={{ marginTop: 0 }}>Admin sign in</h1><p style={{ color: '#67637c' }}>Verify the email of a confirmed Supabase account that has a row in <code>public.admins</code>.</p>
        <form onSubmit={doSignIn} style={{ display: 'grid', gap: 14 }}>
          {!codeSentTo ? <label>Email<input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} style={inputStyle} /></label> : <label>Verification code sent to {codeSentTo}<input inputMode="numeric" pattern="[0-9]{8}" maxLength={8} required autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 8))} style={inputStyle} /></label>}
          <button disabled={busy} style={buttonStyle()}>{busy ? 'Please wait…' : codeSentTo ? 'Verify code' : 'Send code'}</button>
          {!!codeSentTo && <button type="button" disabled={busy} style={buttonStyle(true)} onClick={() => { setCode(''); setCodeSentTo(''); setError(''); }}>Change email</button>}
          {!!notice && <p role="status" style={{ color: '#28654b', margin: 0 }}>{notice}</p>}
          {!!error && <p role="alert" style={{ color: '#bb394c', margin: 0 }}>{error}</p>}
        </form>
      </section>}
      {authState === 'forbidden' && <section style={{ ...cardStyle, maxWidth: 600, margin: '60px auto' }}><h1>Access unavailable</h1><p>This account is signed in but has no admin role. Add its confirmed Auth user ID to <code>public.admins</code> in Supabase, then reload this page.</p></section>}
      {authState === 'admin' && <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 22 }}><div><h1 style={{ fontSize: 30, margin: 0 }}>Users and profiles</h1><p style={{ color: '#77748c', margin: '5px 0 0' }}>Auth users, freelancer profiles, finder profiles, premium and account access.</p></div><button disabled={busy} style={buttonStyle(true)} onClick={() => void load(list.page)}>Refresh</button></div>
        {notice && <p role="status" style={{ color: '#186248', fontWeight: 800 }}>{notice}</p>}
        {error && <p role="alert" style={{ color: '#b72542', fontWeight: 800 }}>{error}</p>}
        <div style={{ ...cardStyle, padding: 18, marginBottom: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {(['all', 'freelancers', 'finders'] as Tab[]).map(value => <button key={value} onClick={() => setTab(value)} style={buttonStyle(tab !== value)}>{value === 'all' ? 'All users' : value === 'freelancers' ? 'Freelancers' : 'Finders'}</button>)}
          <input aria-label="Search current page" placeholder="Search email, name or user ID on this page" value={query} onChange={event => setQuery(event.target.value)} style={{ ...inputStyle, maxWidth: 360, marginLeft: 'auto' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 390px) minmax(0, 1fr)', gap: 18, alignItems: 'start' }} className="admin-layout">
          <section style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}><div style={{ padding: '16px 20px', borderBottom: '1px solid #ece8f2', fontWeight: 900 }}>Page {list.page} · {visible.length} shown</div>
            {visible.map(user => <button key={user.id} onClick={() => setSelectedId(user.id)} style={{ width: '100%', border: 0, borderBottom: '1px solid #eeeaf4', background: user.id === selectedId ? '#f2ebff' : '#fff', padding: '15px 20px', textAlign: 'left', cursor: 'pointer', color: ink }}>
              <span style={{ display: 'block', fontWeight: 900, fontSize: 15 }}>{user.freelancer?.display_name || user.finder?.display_name || user.email || 'Unnamed user'}</span><span style={{ display: 'block', fontSize: 12, color: '#736f84', overflowWrap: 'anywhere' }}>{user.email || user.id}</span><span style={{ display: 'block', marginTop: 7, fontSize: 11, fontWeight: 800, color: isBanned(user) ? '#c0384d' : purple }}>{[user.freelancer && 'Freelancer', user.finder && 'Finder', user.premium && 'Premium', isBanned(user) && 'Banned'].filter(Boolean).join(' · ') || 'Auth only'}</span>
            </button>)}
            {!visible.length && <p style={{ padding: 20, color: '#77748c' }}>No matching users on this page.</p>}
            <div style={{ display: 'flex', gap: 10, padding: 16 }}><button disabled={busy || list.page <= 1} style={buttonStyle(true)} onClick={() => void load(list.page - 1)}>Previous</button><button disabled={busy || !list.hasMore} style={buttonStyle(true)} onClick={() => void load(list.page + 1)}>Next</button></div>
          </section>
          <section style={{ ...cardStyle, minWidth: 0 }}>{selected ? <>
            <h2 style={{ marginTop: 0, overflowWrap: 'anywhere' }}>{selected.freelancer?.display_name || selected.finder?.display_name || selected.email || 'User'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 9, fontSize: 14, overflowWrap: 'anywhere' }}><div><b>Email:</b> {selected.email || '—'}</div><div><b>User ID:</b> {selected.id}</div><div><b>Confirmed:</b> {selected.confirmedAt ? new Date(selected.confirmedAt).toLocaleString() : 'No'}</div><div><b>Created:</b> {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}</div><div><b>Phone:</b> {selected.contact?.phone || '—'}</div><div><b>WhatsApp:</b> {selected.contact?.whatsapp || '—'}</div></div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '20px 0', borderBottom: '1px solid #ece8f2' }}><button disabled={busy} style={buttonStyle(!selected.premium)} onClick={() => void mutate({ action: 'setPremium', userId: selected.id, value: !selected.premium }, selected.premium ? 'Premium removed.' : 'Premium enabled.')}>{selected.premium ? 'Remove premium' : 'Make premium'}</button><button disabled={busy} style={buttonStyle(true)} onClick={() => { if (!isBanned(selected) && !window.confirm(`Ban ${selected.email || selected.id}?`)) return; void mutate({ action: 'setBan', userId: selected.id, value: !isBanned(selected) }, isBanned(selected) ? 'Account unbanned.' : 'Account banned.'); }}>{isBanned(selected) ? 'Unban user' : 'Ban user'}</button><button disabled={busy} aria-expanded={deleteOpen} onClick={() => setDeleteOpen(value => !value)} style={{ ...buttonStyle(true), borderColor: '#de9ca8', color: '#b72542' }}>Delete user &amp; data…</button></div>
            {deleteOpen && <div style={{ background: '#fff5f6', border: '1px solid #efbdc6', borderRadius: 16, padding: 18, marginTop: 16 }}><h3 style={{ color: '#b72542', marginTop: 0 }}>Permanently delete this account</h3><p style={{ color: '#6d6070' }}>Deletes the Supabase Auth user and associated profiles, listings, messages, files and test data. This cannot be undone. Accounts with hiring or agreement history are protected from this test cleanup.</p><label style={{ display: 'block', fontWeight: 800 }}>Type {selected.email || selected.id} to confirm<input aria-label="Confirm user deletion" value={deleteConfirm} onChange={event => setDeleteConfirm(event.target.value)} autoComplete="off" style={inputStyle} /></label><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}><button disabled={busy || deleteConfirm !== (selected.email || selected.id)} style={{ ...buttonStyle(), background: '#b72542', borderColor: '#b72542' }} onClick={() => void deleteSelected()}>Delete Auth user and data permanently</button><button disabled={busy} style={buttonStyle(true)} onClick={() => { setDeleteOpen(false); setDeleteConfirm(''); }}>Cancel</button></div></div>}
            <div style={{ paddingTop: 20 }}><h3 style={{ marginTop: 0 }}>Profile details</h3>{selected.freelancer && <button style={buttonStyle(editKind !== 'freelancer')} onClick={() => chooseKind('freelancer')}>Freelancer profile</button>}{selected.finder && <button style={{ ...buttonStyle(editKind !== 'finder'), marginLeft: 10 }} onClick={() => chooseKind('finder')}>Finder profile</button>}
              {(editKind === 'freelancer' ? selected.freelancer : selected.finder) ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 15, marginTop: 18 }}>{(editKind === 'freelancer' ? freelancerFields : finderFields).map(field => <label key={field.key} style={{ gridColumn: field.multiline ? '1 / -1' : undefined, fontSize: 13, fontWeight: 800 }}>{field.label}{field.multiline ? <textarea value={draft[field.key] || ''} onChange={event => setDraft({ ...draft, [field.key]: event.target.value })} style={{ ...inputStyle, minHeight: 110 }} /> : <input value={draft[field.key] || ''} onChange={event => setDraft({ ...draft, [field.key]: event.target.value })} style={inputStyle} />}</label>)}<div style={{ gridColumn: '1 / -1' }}><button disabled={busy} style={buttonStyle()} onClick={saveProfile}>Save profile changes</button></div></div> : <p style={{ color: '#77748c' }}>This user has no {editKind} profile.</p>}
            </div>
            <div style={{ borderTop: '1px solid #ece8f2', marginTop: 24, paddingTop: 20 }}><h3>What this account has listed</h3>
              {!detail && <p>Loading listings…</p>}
              {detail && <><h4>Services ({detail.services.length})</h4>{detail.services.map(item => <div key={item.id} style={{ marginBottom: 14 }}><b>{item.title}</b> · {item.active ? 'Active' : 'Hidden'}<p style={{ margin: '4px 0' }}>{item.description}</p><button disabled={busy} style={buttonStyle(true)} onClick={() => removeListing('service', item.id, item.title)}>Remove service</button></div>)}
                <h4>Portfolio media ({detail.media.length})</h4>{detail.media.map(item => <div key={item.id} style={{ marginBottom: 10 }}>{item.kind}: {item.file_name} <button disabled={busy} style={buttonStyle(true)} onClick={() => removeListing('media', item.id, item.file_name)}>Remove media</button></div>)}
                <h4>Finder requests ({detail.requests.length})</h4>{detail.requests.map(item => <div key={item.id} style={{ marginBottom: 14 }}><b>{item.title}</b> · {item.status}<p style={{ margin: '4px 0' }}>{item.details}</p><button disabled={busy} style={buttonStyle(true)} onClick={() => removeListing('request', item.id, item.title)}>Remove request</button></div>)}
                {!detail.services.length && !detail.media.length && !detail.requests.length && <p style={{ color: '#77748c' }}>No listings yet.</p>}
                <h4>Previous flags ({detail.flags.length})</h4>{detail.flags.map(item => <p key={item.id}>{item.reason} · {new Date(item.created_at).toLocaleString()}</p>)}
              </>}
            </div>
            <div style={{ borderTop: '1px solid #ece8f2', marginTop: 24, paddingTop: 20 }}><h3>Flag inappropriate content</h3><p style={{ color: '#77748c' }}>The user receives an in-app notification with this reason.</p>
              <textarea aria-label="Reason for flag" value={flagReason} onChange={event => setFlagReason(event.target.value)} maxLength={500} placeholder="Describe the specific listing or behavior (10–500 characters)" style={{ ...inputStyle, minHeight: 90 }} />
              <button disabled={busy || flagReason.trim().length < 10} style={{ ...buttonStyle(true), marginTop: 10 }} onClick={() => void flagSelected()}>Send flag notice</button>
            </div>
          </> : <p>Select a user to inspect and edit their profile.</p>}</section>
        </div>
      </>}
      <p style={{ marginTop: 32, color: '#8b8799', fontSize: 12 }}>Admin console · {ADMIN_PATH}</p>
    </main>
    <style>{'@media(max-width:850px){.admin-layout{grid-template-columns:1fr!important}} button:disabled{opacity:.5;cursor:not-allowed!important}'}</style>
  </div>;
}

const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #eae5f1', borderRadius: 20, padding: 24, boxShadow: '0 10px 35px rgba(54,35,89,.04)' };
const inputStyle: React.CSSProperties = { boxSizing: 'border-box', width: '100%', display: 'block', marginTop: 6, borderRadius: 11, border: '1px solid #ddd8e9', padding: '11px 12px', font: 'inherit', fontSize: 14, color: ink, background: '#fff' };
function buttonStyle(outline = false): React.CSSProperties { return { border: `1px solid ${purple}`, background: outline ? '#fff' : purple, color: outline ? purple : '#fff', borderRadius: 11, padding: '10px 16px', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }; }
