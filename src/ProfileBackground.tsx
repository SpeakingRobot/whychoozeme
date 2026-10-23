import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Certification, Freelancer, WorkExperience } from './data';
import { Button, color, Field, Heading } from './UI';

export default function ProfileBackground({ profile, canEdit, onSave }: {
  profile: Freelancer; canEdit: boolean;
  onSave: (certifications: Certification[], experience: WorkExperience[]) => Promise<void>;
}) {
  const [certifications, setCertifications] = useState<Certification[]>(profile.certifications || []);
  const [experience, setExperience] = useState<WorkExperience[]>(profile.experience || []);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async () => {
    if (certifications.some(item => !item.name.trim() || !item.issuer.trim()) || experience.some(item => !item.role.trim() || !item.organization.trim())) {
      setError('Add a title and issuer for each certification, and a role and organization for each experience.'); return;
    }
    setBusy(true); setError('');
    try { await onSave(certifications, experience); setEditing(false); }
    catch (problem) { setError((problem as Error).message); }
    finally { setBusy(false); }
  };
  if (!canEdit && !profile.certifications?.length && !profile.experience?.length) return null;
  const small = { color: color.muted, fontFamily: 'Nunito' as const, fontSize: 12 };
  return <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, borderRadius: 22, padding: 21, marginTop: 18 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}><View><Heading size={22}>Experience & certifications ✦</Heading><Text style={[small, { marginTop: 4 }]}>Shared by {profile.name}; these details are not independently verified.</Text></View>{canEdit && !editing && <Button outline flat onPress={() => setEditing(true)}>{profile.certifications?.length || profile.experience?.length ? 'Edit details' : 'Add details'}</Button>}</View>
    {editing && canEdit ? <View style={{ gap: 16, marginTop: 17 }}>
      <View><Heading size={17}>Certifications</Heading><Text style={small}>Optional · up to 8</Text>{certifications.map((item, index) => <View key={`cert-${index}`} style={{ padding: 12, backgroundColor: '#f9f6ff', borderRadius: 13, gap: 7, marginTop: 8 }}><Field value={item.name} onChangeText={value => setCertifications(items => items.map((entry, at) => at === index ? { ...entry, name: value } : entry))} maxLength={120} placeholder="Certificate or course name" /><Field value={item.issuer} onChangeText={value => setCertifications(items => items.map((entry, at) => at === index ? { ...entry, issuer: value } : entry))} maxLength={120} placeholder="Issuing organization" /><Field value={item.year || ''} onChangeText={value => setCertifications(items => items.map((entry, at) => at === index ? { ...entry, year: value } : entry))} maxLength={20} placeholder="Year (optional)" /><Pressable accessibilityRole="button" onPress={() => setCertifications(items => items.filter((_, at) => at !== index))}><Text style={{ color: color.coral, fontFamily: 'Nunito', fontWeight: '900' }}>Remove certification</Text></Pressable></View>)}{certifications.length < 8 && <Button outline flat onPress={() => setCertifications(items => [...items, { name: '', issuer: '' }])} style={{ alignSelf: 'flex-start', marginTop: 9 }}>+ Add certification</Button>}</View>
      <View><Heading size={17}>Work experience</Heading><Text style={small}>Optional · up to 8</Text>{experience.map((item, index) => <View key={`work-${index}`} style={{ padding: 12, backgroundColor: '#f9f6ff', borderRadius: 13, gap: 7, marginTop: 8 }}><Field value={item.role} onChangeText={value => setExperience(items => items.map((entry, at) => at === index ? { ...entry, role: value } : entry))} maxLength={120} placeholder="Role or project" /><Field value={item.organization} onChangeText={value => setExperience(items => items.map((entry, at) => at === index ? { ...entry, organization: value } : entry))} maxLength={120} placeholder="Company or client" /><Field value={item.period || ''} onChangeText={value => setExperience(items => items.map((entry, at) => at === index ? { ...entry, period: value } : entry))} maxLength={60} placeholder="When, e.g. 2024–2026 (optional)" /><Field value={item.summary || ''} onChangeText={value => setExperience(items => items.map((entry, at) => at === index ? { ...entry, summary: value } : entry))} maxLength={500} multiline placeholder="What you did (optional)" /><Pressable accessibilityRole="button" onPress={() => setExperience(items => items.filter((_, at) => at !== index))}><Text style={{ color: color.coral, fontFamily: 'Nunito', fontWeight: '900' }}>Remove experience</Text></Pressable></View>)}{experience.length < 8 && <Button outline flat onPress={() => setExperience(items => [...items, { role: '', organization: '' }])} style={{ alignSelf: 'flex-start', marginTop: 9 }}>+ Add experience</Button>}</View>
      {!!error && <Text style={{ color: color.coral, fontFamily: 'Nunito', fontSize: 12 }}>{error}</Text>}
      <View style={{ flexDirection: 'row', gap: 9 }}><Button disabled={busy} onPress={() => void save()}>{busy ? 'Saving…' : 'Save background'}</Button><Button disabled={busy} outline onPress={() => { setCertifications(profile.certifications || []); setExperience(profile.experience || []); setEditing(false); setError(''); }}>Cancel</Button></View>
    </View> : <View style={{ gap: 16, marginTop: 16 }}>
      {!!profile.experience?.length && <View><Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900', fontSize: 15, marginBottom: 7 }}>Work experience</Text>{profile.experience.map((item, index) => <View key={`${item.role}-${index}`} style={{ paddingVertical: 9, borderTopWidth: 1, borderTopColor: color.line }}><Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900' }}>{item.role} · {item.organization}</Text>{!!item.period && <Text style={small}>{item.period}</Text>}{!!item.summary && <Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 13, marginTop: 4 }}>{item.summary}</Text>}</View>)}</View>}
      {!!profile.certifications?.length && <View><Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900', fontSize: 15, marginBottom: 7 }}>Certifications</Text>{profile.certifications.map((item, index) => <View key={`${item.name}-${index}`} style={{ paddingVertical: 9, borderTopWidth: 1, borderTopColor: color.line }}><Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900' }}>{item.name}</Text><Text style={small}>{item.issuer}{item.year ? ` · ${item.year}` : ''}</Text></View>)}</View>}
      {!profile.certifications?.length && !profile.experience?.length && <Text style={small}>Add optional background details to help people understand your work.</Text>}
    </View>}
  </View>;
}
