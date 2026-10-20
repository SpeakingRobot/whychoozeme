import React from 'react';

export type FlagTarget = { kind: 'account' | 'service' | 'media' | 'request'; id?: string; title: string };
const accountReasons = ['Suspicious or fraudulent activity', 'Spam or repeated misuse', 'Harassment or abusive behaviour', 'Fake or impersonation account', 'Violation of platform policies', 'Other'];
export const contentReasons = ['Spam or misleading content', 'Inappropriate or offensive content', 'Fraud or scam', 'Copyright violation', 'Harassment or abuse', 'Other'];
const navy = '#173b6d';
const blue = '#176deb';

export default function AdminFlagFlow({ target, user, reason, note, confirming, busy, onReason, onNote, onReview, onConfirm, onBack, onCancel }: {
  target: FlagTarget;
  user: { id: string; name: string; email?: string };
  reason: string;
  note: string;
  confirming: boolean;
  busy: boolean;
  onReason: (value: string) => void;
  onNote: (value: string) => void;
  onReview: () => void;
  onConfirm: () => void;
  onBack: () => void;
  onCancel: () => void;
}) {
  const account = target.kind === 'account';
  const reasons = account ? accountReasons : contentReasons;
  const valid = !!reason && (reason !== 'Other' || note.trim().length >= 10);
  return <section id="admin-flag-flow" style={{ marginTop: 23, border: '1px solid #c9dcf6', borderRadius: 18, overflow: 'hidden', background: '#fff', boxShadow: '0 12px 26px rgba(30,72,130,.08)' }}>
    <div style={{ background: navy, color: '#fff', padding: '19px 22px' }}><div style={{ fontSize: 20, fontWeight: 900 }}>⚑ Flag {account ? 'account' : 'content'}</div><div style={{ opacity: .8, fontSize: 12, marginTop: 3 }}>Select the target, give a reason, then confirm the action.</div></div>
    <div style={{ display: 'flex', gap: 8, padding: '15px 20px', borderBottom: '1px solid #e4ecf8', flexWrap: 'wrap' }}>{['1  Selected', '2  Reason', '3  Confirm'].map((label, index) => <span key={label} style={{ borderRadius: 18, padding: '7px 13px', background: index === 2 && confirming ? '#e7f1ff' : index < 2 ? '#e8f8f1' : '#f3f6fb', color: index === 2 && confirming ? blue : index < 2 ? '#118c62' : '#7b89a1', fontWeight: 900, fontSize: 11 }}>{label}</span>)}</div>
    <div className="admin-flag-columns" style={{ display: 'grid', gridTemplateColumns: 'minmax(190px, .8fr) minmax(250px, 1.2fr)', gap: 18, padding: 20 }}>
      <div style={{ border: '1px solid #dce8fa', borderRadius: 13, padding: 16, background: '#f7fbff', alignSelf: 'start' }}><div style={{ color: '#5480ae', fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>SELECTED {account ? 'ACCOUNT' : 'LISTING'}</div><div style={{ color: navy, fontWeight: 900, fontSize: 16, marginTop: 9, overflowWrap: 'anywhere' }}>{account ? user.name : target.title}</div><div style={{ color: '#6680a3', fontSize: 12, marginTop: 7 }}>{account ? user.email || user.id : `${target.kind} · ${user.name}`}</div><div style={{ color: '#8a9cb5', fontSize: 10, marginTop: 10, overflowWrap: 'anywhere' }}>ID: {account ? user.id : target.id}</div></div>
      <div><div style={{ color: navy, fontWeight: 900, marginBottom: 8 }}>Reason for flagging <span style={{ color: '#d34360' }}>*</span></div><div role="radiogroup" aria-label="Reason for flagging" style={{ display: 'grid', gap: 7 }}>{reasons.map(value => <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', color: reason === value ? navy : '#506584', fontSize: 13, fontWeight: reason === value ? 900 : 700, padding: '7px 9px', background: reason === value ? '#eaf2ff' : 'transparent', borderRadius: 9 }}><input type="radio" name="flag-reason" value={value} checked={reason === value} onChange={() => onReason(value)} />{value}</label>)}</div><label style={{ display: 'block', color: navy, fontSize: 13, fontWeight: 900, marginTop: 15 }}>Admin note {reason === 'Other' ? '(required)' : '(optional)'}<textarea aria-label="Admin note" value={note} maxLength={400} onChange={event => onNote(event.target.value)} placeholder="Add context for the owner and moderation history" style={{ width: '100%', boxSizing: 'border-box', minHeight: 85, marginTop: 6, border: '1px solid #ccd9ed', borderRadius: 10, padding: 11, font: 'inherit', fontSize: 13, resize: 'vertical' }} /></label><div style={{ color: '#8393aa', textAlign: 'right', fontSize: 10 }}>{note.length}/400</div><div style={{ display: 'flex', gap: 9, marginTop: 13, flexWrap: 'wrap' }}><button disabled={!valid || busy} onClick={onReview} style={primary}>Review flag →</button><button disabled={busy} onClick={onCancel} style={secondary}>Cancel</button></div></div>
    </div>
    {confirming && <div role="dialog" aria-modal="true" aria-label="Confirm flag" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,29,63,.52)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}><div style={{ width: '100%', maxWidth: 470, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 17, padding: 23, boxShadow: '0 25px 70px rgba(7,29,68,.28)' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h3 style={{ margin: 0, color: navy, fontSize: 21 }}>Confirm {account ? 'account' : 'content'} flag</h3><button aria-label="Close confirmation" onClick={onBack} style={{ ...secondary, padding: '4px 9px' }}>×</button></div><div style={{ borderTop: '1px solid #e5ebf5', marginTop: 15, paddingTop: 15 }}><div style={{ fontWeight: 900, color: navy }}>{user.name}</div><div style={{ color: '#677d9c', fontSize: 12 }}>{user.email || user.id}</div>{!account && <div style={{ marginTop: 13, color: '#526b91', fontSize: 13 }}><b>Selected {target.kind}:</b> {target.title}</div>}<div style={{ marginTop: 13, color: navy, fontSize: 13 }}><b>Reason:</b> {reason}</div>{!!note.trim() && <div style={{ marginTop: 9, color: '#526b91', fontSize: 13 }}><b>Admin note:</b> {note.trim()}</div>}</div><p style={{ background: '#eff6ff', padding: 12, borderRadius: 10, color: '#496482', fontSize: 12, lineHeight: 1.5 }}>{account ? 'The user will be notified. Flagging does not automatically ban their account.' : 'The owner will be notified and this listing will be hidden from public views while it is under review.'}</p><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9 }}><button disabled={busy} onClick={onBack} style={secondary}>Cancel</button><button disabled={busy} onClick={onConfirm} style={primary}>{busy ? 'Submitting…' : 'Submit flag'}</button></div></div></div>}
  </section>;
}

const primary: React.CSSProperties = { border: '1px solid #176deb', background: '#176deb', color: '#fff', borderRadius: 9, padding: '10px 16px', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer' };
const secondary: React.CSSProperties = { border: '1px solid #b6cdef', background: '#fff', color: '#176deb', borderRadius: 9, padding: '10px 16px', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer' };
