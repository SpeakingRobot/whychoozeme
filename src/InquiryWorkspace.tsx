import React, { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { Button, color, Field, Heading, TinyTag } from './UI';
import { Freelancer } from './data';
import { Inquiry, InquiryAttachment, InquiryInput, decideInquiry, listAttachments, referenceUrl, submitInquiry } from './inquiryApi';

const note = { fontFamily: 'Nunito' as const, color: color.muted, fontSize: 13 };
const label = { fontFamily: 'Nunito' as const, color: color.ink, fontWeight: '900' as const, fontSize: 13, marginTop: 13, marginBottom: 6 };

export function InquiryForm({ person, finderId, onClose, onSent, onDemoSubmit }: { person: Freelancer; finderId: string; onClose: () => void; onSent: (failed: string[]) => void; onDemoSubmit?: (value: InquiryInput, files: File[]) => void }) {
  const [value, setValue] = useState<InquiryInput>({ title: '', requirements: '', work_mode: 'either' });
  const [files, setFiles] = useState<File[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const pick = () => {
    if (Platform.OS !== 'web') { setError('Reference image upload is currently available on the web app.'); return; }
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp'; input.multiple = true;
    input.onchange = () => setFiles(previous => [...previous, ...Array.from(input.files || [])].slice(0, 5)); input.click();
  };
  const send = async () => {
    setBusy(true); setError('');
    try { if (onDemoSubmit) { if (value.title.trim().length < 4 || value.requirements.trim().length < 10) throw new Error('Add a title and at least 10 characters of requirements.'); onDemoSubmit(value, files); onSent([]); } else { const result = await submitInquiry(finderId, person.id, value, files); onSent(result.failed); } }
    catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  };
  return <View style={{ paddingBottom: 16 }}>
    <Heading size={25}>Inquire with {person.name}</Heading>
    <Text style={[note, { marginTop: 6 }]}>Share your requirements. Chat opens when {person.name.split(' ')[0]} approves your inquiry.</Text>
    {person.demo && !onDemoSubmit ? <Text style={[note, { marginTop: 16 }]}>This is a sample profile. Inquiries can be sent to freelancers with an active account.</Text> : <>
      <Text style={label}>What do you need?</Text><Field value={value.title} onChangeText={title => setValue({ ...value, title })} placeholder="e.g. Photos for a family celebration" />
      <Text style={label}>Requirements and details</Text><Field value={value.requirements} onChangeText={requirements => setValue({ ...value, requirements })} placeholder="Describe the work, location, schedule and what you expect to receive" multiline />
      <Text style={label}>How can the work happen?</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{(['either', 'remote', 'in_person'] as const).map(mode => <Pressable key={mode} accessibilityRole="button" onPress={() => setValue({ ...value, work_mode: mode })} style={{ paddingHorizontal: 13, paddingVertical: 9, borderRadius: 13, backgroundColor: value.work_mode === mode ? color.purple : '#f0e8f8' }}><Text style={{ fontFamily: 'Nunito', fontWeight: '900', color: value.work_mode === mode ? '#fff' : color.purple }}>{mode === 'either' ? 'Either' : mode === 'remote' ? 'Remote' : 'In person'}</Text></Pressable>)}</View>
      <Text style={label}>Preferred dates (optional)</Text><View style={{ flexDirection: 'row', gap: 8 }}><Field value={value.preferred_start || ''} onChangeText={preferred_start => setValue({ ...value, preferred_start })} placeholder="Start YYYY-MM-DD" style={{ flex: 1 }} /><Field value={value.preferred_end || ''} onChangeText={preferred_end => setValue({ ...value, preferred_end })} placeholder="End YYYY-MM-DD" style={{ flex: 1 }} /></View>
      <Text style={label}>Budget or other notes (optional)</Text><Field value={value.budget_note || ''} onChangeText={budget_note => setValue({ ...value, budget_note })} placeholder="Budget range, timing flexibility, or other context" />
      <Text style={label}>Reference images (optional)</Text><Button outline onPress={pick} style={{ alignSelf: 'flex-start' }}>+ Add images ({files.length}/5)</Button>{files.map((file, index) => <Pressable key={`${file.name}-${index}`} onPress={() => setFiles(files.filter((_, i) => i !== index))}><Text style={[note, { marginTop: 5 }]}>{file.name} · remove ×</Text></Pressable>)}
      {!!error && <Text style={[note, { color: color.coral, marginTop: 10 }]}>{error}</Text>}
      <View style={{ flexDirection: 'row', gap: 9, marginTop: 21 }}><Button onPress={send} disabled={busy}>Send inquiry</Button><Button outline onPress={onClose}>Cancel</Button></View>
    </>}
  </View>;
}

function InquiryCard({ item, ownId, onRefresh, onChat, onDemoDecision, demo }: { item: Inquiry; ownId: string; onRefresh: () => void; onChat: (item: Inquiry) => void; onDemoDecision?: (item: Inquiry, decision: 'approved' | 'declined', response: string) => void; demo: boolean }) {
  const received = demo ? ownId === 'demo-freelancer' : item.freelancer_id === ownId;
  const [attachments, setAttachments] = useState<InquiryAttachment[]>([]), [response, setResponse] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const refreshAttachments = () => { if (!demo) listAttachments(item.id).then(setAttachments).catch(cause => setError((cause as Error).message)); };
  useEffect(() => { if (demo) return; listAttachments(item.id).then(setAttachments).catch(cause => setError((cause as Error).message)); const timer = setTimeout(() => listAttachments(item.id).then(setAttachments).catch(() => {}), 4000); return () => clearTimeout(timer); }, [item.id, demo]);
  const decide = async (decision: 'approved' | 'declined') => { setBusy(true); setError(''); try { if (onDemoDecision) onDemoDecision(item, decision, response); else { await decideInquiry(item.id, decision, response); onRefresh(); } } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); } };
  const openAttachment = async (path: string) => { try { await Linking.openURL(await referenceUrl(path)); } catch (cause) { setError((cause as Error).message); } };
  return <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, borderRadius: 20, padding: 19, marginTop: 12 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}><TinyTag style={{ alignSelf: 'flex-start' }}>{item.status.toUpperCase()}</TinyTag><Text style={note}>{new Date(item.created_at).toLocaleDateString()}</Text></View>
    <Heading size={20} style={{ marginTop: 10 }}>{item.title}</Heading><Text style={[note, { marginTop: 4 }]}>{received ? `From ${item.finder_name} · ${item.finder_taluka}` : `To ${item.freelancer_name}`} · {item.work_mode.replace('_', ' ')}</Text>
    <Text style={{ fontFamily: 'Nunito', color: color.ink, marginTop: 12, lineHeight: 21 }}>{item.requirements}</Text>
    {(item.preferred_start || item.budget_note) && <Text style={[note, { marginTop: 10 }]}>{[item.preferred_start && `Dates: ${item.preferred_start}${item.preferred_end ? ` to ${item.preferred_end}` : ''}`, item.budget_note && `Budget/notes: ${item.budget_note}`].filter(Boolean).join(' · ')}</Text>}
    {!!attachments.length && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>{attachments.map(file => <Pressable key={file.id} accessibilityRole="button" onPress={() => openAttachment(file.storage_path)} style={{ padding: 9, backgroundColor: '#f5efff', borderRadius: 10 }}><Text style={{ fontFamily: 'Nunito', color: color.purple, fontWeight: '900' }}>🖼 {file.file_name} ↗</Text></Pressable>)}</View>}
    {!demo && received && item.status === 'pending' && <Pressable accessibilityRole="button" onPress={refreshAttachments} style={{ marginTop: 9 }}><Text style={{ fontFamily: 'Nunito', color: color.purple, fontWeight: '900', fontSize: 12 }}>Refresh reference images</Text></Pressable>}
    {demo && !!item.reference_names?.length && <Text style={[note, { marginTop: 10 }]}>Reference images: {item.reference_names.join(', ')}</Text>}
    {!!item.response_note && <Text style={[note, { marginTop: 12 }]}>Freelancer response: {item.response_note}</Text>}
    {received && item.status === 'pending' && <><Text style={label}>Reply note (optional)</Text><Field value={response} onChangeText={setResponse} placeholder="Share an initial response" multiline /><View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}><Button disabled={busy} onPress={() => decide('approved')}>Approve & open chat</Button><Button outline disabled={busy} onPress={() => decide('declined')}>Decline</Button></View></>}
    {item.status === 'approved' && <Button onPress={() => onChat(item)} style={{ alignSelf: 'flex-start', marginTop: 14 }}>Open chat →</Button>}
    {item.status === 'pending' && !received && <Text style={[note, { marginTop: 13 }]}>Waiting for {item.freelancer_name} to review your inquiry. Chat opens after approval.</Text>}
    {!!error && <Text style={[note, { color: color.coral, marginTop: 9 }]}>{error}</Text>}
  </View>;
}

export function InquiryInbox({ items, ownId, onRefresh, onChat, onDemoDecision, demo = false }: { items: Inquiry[]; ownId: string; onRefresh: () => void; onChat: (item: Inquiry) => void; onDemoDecision?: (item: Inquiry, decision: 'approved' | 'declined', response: string) => void; demo?: boolean }) {
  const received = demo && ownId === 'demo-freelancer' ? items : items.filter(item => item.freelancer_id === ownId);
  const sent = demo && ownId === 'demo-freelancer' ? [] : items.filter(item => item.finder_id === ownId);
  return <View style={{ width: '100%', maxWidth: 1050, alignSelf: 'center', padding: 24, paddingBottom: 60 }}><Heading size={30}>Inquiries 📥</Heading><Text style={[note, { marginTop: 6, marginBottom: 15 }]}>Review project briefs here. Approving an inquiry opens a private chat for both people.</Text>
    <Heading size={22}>Received ({received.length})</Heading>{received.length ? received.map(item => <InquiryCard key={item.id} item={item} ownId={ownId} onRefresh={onRefresh} onChat={onChat} onDemoDecision={onDemoDecision} demo={demo} />) : <Text style={[note, { marginTop: 9, marginBottom: 18 }]}>No inquiries received yet.</Text>}
    <Heading size={22} style={{ marginTop: 24 }}>Sent ({sent.length})</Heading>{sent.length ? sent.map(item => <InquiryCard key={item.id} item={item} ownId={ownId} onRefresh={onRefresh} onChat={onChat} onDemoDecision={onDemoDecision} demo={demo} />) : <Text style={[note, { marginTop: 9 }]}>No inquiries sent yet.</Text>}
  </View>;
}
