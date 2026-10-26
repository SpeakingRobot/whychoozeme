import React, { useState } from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import type { Certification, Freelancer, WorkExperience } from './data';
import { Button, color, Field, Heading } from './UI';
import { certificationImageUrl, removeCertificationImages, uploadCertificationImage } from './certificationImages';

export default function ProfileBackground({ profile, canEdit, narrow, onSave }: {
  profile: Freelancer; canEdit: boolean; narrow: boolean;
  onSave: (certifications: Certification[], experience: WorkExperience[]) => Promise<void>;
}) {
  const [certifications, setCertifications] = useState<Certification[]>(profile.certifications || []);
  const [experience, setExperience] = useState<WorkExperience[]>(profile.experience || []);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pendingImages, setPendingImages] = useState<(File | null)[]>([]);
  const [showAllExperience, setShowAllExperience] = useState(false);
  const [showAllCertifications, setShowAllCertifications] = useState(false);
  const pickImage = (index: number) => {
    if (Platform.OS !== 'web') return;
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size) { setError('Choose a JPEG, PNG or WebP certificate image.'); return; }
      setPendingImages(items => { const next = [...items]; next[index] = file; return next; });
      setError('');
    };
    input.click();
  };
  const save = async () => {
    if (certifications.some(item => !item.name.trim() || !item.issuer.trim()) || experience.some(item => !item.role.trim() || !item.organization.trim())) {
      setError('Add a title and issuer for each certification, and a role and organization for each experience.'); return;
    }
    setBusy(true); setError('');
    const uploaded: string[] = [];
    let saved = false;
    try {
      const prepared = [...certifications];
      for (let index = 0; index < prepared.length; index++) {
        const file = pendingImages[index];
        if (!file) continue;
        const imagePath = await uploadCertificationImage(profile.id, file);
        uploaded.push(imagePath);
        prepared[index] = { ...prepared[index], imagePath };
      }
      await onSave(prepared, experience);
      saved = true;
      const oldPaths = (profile.certifications || []).map(item => item.imagePath).filter((path): path is string => !!path && !prepared.some(item => item.imagePath === path));
      if (oldPaths.length) void removeCertificationImages(oldPaths).catch(() => {});
      setCertifications(prepared); setPendingImages([]); setEditing(false);
    }
    catch (problem) { setError((problem as Error).message); }
    finally { if (uploaded.length && !saved) void removeCertificationImages(uploaded).catch(() => {}); setBusy(false); }
  };
  if (!canEdit && !profile.certifications?.length && !profile.experience?.length) return null;
  const small = { color: color.muted, fontFamily: 'Nunito' as const, fontSize: 12 };
  const visibleExperience = showAllExperience ? profile.experience || [] : (profile.experience || []).slice(0, 2);
  const visibleCertifications = showAllCertifications ? profile.certifications || [] : (profile.certifications || []).slice(0, 3);
  return <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, borderRadius: 22, padding: 21, marginTop: 18 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}><View><Heading size={22}>Experience & certifications ✦</Heading><Text style={[small, { marginTop: 4 }]}>Professional journey and credentials shared by {profile.name}. These details are self-reported.</Text></View>{canEdit && !editing && <Button outline flat onPress={() => setEditing(true)}>{profile.certifications?.length || profile.experience?.length ? 'Edit details' : '+ Add details'}</Button>}</View>
    {editing && canEdit ? <View style={{ gap: 16, marginTop: 17 }}>
      <View><Heading size={17}>Certifications</Heading><Text style={small}>Optional · up to 8 · one image per certificate</Text>{certifications.map((item, index) => <View key={`cert-${index}`} style={{ padding: 13, backgroundColor: '#f9f6ff', borderRadius: 13, marginTop: 8 }}>
        <View style={{ flexDirection: narrow ? 'column' : 'row', gap: 12 }}>
          <View style={{ flex: 1, gap: 7 }}><Field value={item.name} onChangeText={value => setCertifications(items => items.map((entry, at) => at === index ? { ...entry, name: value } : entry))} maxLength={120} placeholder="Certificate or course name" /><Field value={item.issuer} onChangeText={value => setCertifications(items => items.map((entry, at) => at === index ? { ...entry, issuer: value } : entry))} maxLength={120} placeholder="Issuing organization" /><Field value={item.year || ''} onChangeText={value => setCertifications(items => items.map((entry, at) => at === index ? { ...entry, year: value } : entry))} maxLength={20} placeholder="Year (optional)" /></View>
          <View style={{ width: narrow ? '100%' : 152, minHeight: 136, borderRadius: 13, borderWidth: 1, borderStyle: 'dashed', borderColor: '#cdb8f1', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 10, gap: 7 }}>
            {!!item.imagePath && <Image source={{ uri: certificationImageUrl(item.imagePath) }} resizeMode="contain" style={{ width: 82, height: 64, borderRadius: 7 }} />}
            {!item.imagePath && <Text style={{ color: color.purple, fontSize: 24 }}>▧</Text>}
            <Button outline flat disabled={busy} onPress={() => pickImage(index)} style={{ minHeight: 32 }} textStyle={{ fontSize: 11 }}>{item.imagePath || pendingImages[index] ? 'Replace image' : 'Upload image'}</Button>
            {!!pendingImages[index] && <Text numberOfLines={2} style={{ ...small, textAlign: 'center' }}>{pendingImages[index]?.name}</Text>}
            {!item.imagePath && !pendingImages[index] && <Text style={{ ...small, textAlign: 'center' }}>JPEG, PNG or WebP · 300 KB after resizing</Text>}
            {!!item.imagePath && !pendingImages[index] && <Pressable accessibilityRole="button" onPress={() => setCertifications(items => items.map((entry, at) => at === index ? { ...entry, imagePath: undefined } : entry))}><Text style={{ color: color.coral, fontFamily: 'Nunito', fontSize: 11, fontWeight: '900' }}>Remove image</Text></Pressable>}
          </View>
        </View>
        <Pressable accessibilityRole="button" onPress={() => { setCertifications(items => items.filter((_, at) => at !== index)); setPendingImages(items => items.filter((_, at) => at !== index)); }} style={{ alignSelf: 'flex-start', marginTop: 9 }}><Text style={{ color: color.coral, fontFamily: 'Nunito', fontWeight: '900' }}>Remove certification</Text></Pressable>
      </View>)}{certifications.length < 8 && <Button outline flat onPress={() => setCertifications(items => [...items, { name: '', issuer: '' }])} style={{ alignSelf: 'flex-start', marginTop: 9 }}>+ Add certification</Button>}</View>
      <View><Heading size={17}>Work experience</Heading><Text style={small}>Optional · up to 8</Text>{experience.map((item, index) => <View key={`work-${index}`} style={{ padding: 12, backgroundColor: '#f9f6ff', borderRadius: 13, gap: 7, marginTop: 8 }}><Field value={item.role} onChangeText={value => setExperience(items => items.map((entry, at) => at === index ? { ...entry, role: value } : entry))} maxLength={120} placeholder="Role or project" /><Field value={item.organization} onChangeText={value => setExperience(items => items.map((entry, at) => at === index ? { ...entry, organization: value } : entry))} maxLength={120} placeholder="Company or client" /><Field value={item.period || ''} onChangeText={value => setExperience(items => items.map((entry, at) => at === index ? { ...entry, period: value } : entry))} maxLength={60} placeholder="When, e.g. 2024–2026 (optional)" /><Field value={item.summary || ''} onChangeText={value => setExperience(items => items.map((entry, at) => at === index ? { ...entry, summary: value } : entry))} maxLength={500} multiline placeholder="What you did (optional)" /><Pressable accessibilityRole="button" onPress={() => setExperience(items => items.filter((_, at) => at !== index))}><Text style={{ color: color.coral, fontFamily: 'Nunito', fontWeight: '900' }}>Remove experience</Text></Pressable></View>)}{experience.length < 8 && <Button outline flat onPress={() => setExperience(items => [...items, { role: '', organization: '' }])} style={{ alignSelf: 'flex-start', marginTop: 9 }}>+ Add experience</Button>}</View>
      {!!error && <Text style={{ color: color.coral, fontFamily: 'Nunito', fontSize: 12 }}>{error}</Text>}
      <View style={{ flexDirection: 'row', gap: 9 }}><Button disabled={busy} onPress={() => void save()}>{busy ? 'Saving…' : 'Save background'}</Button><Button disabled={busy} outline onPress={() => { setCertifications(profile.certifications || []); setExperience(profile.experience || []); setPendingImages([]); setEditing(false); setError(''); }}>Cancel</Button></View>
    </View> : <View style={{ flexDirection: narrow ? 'column' : 'row', gap: 12, marginTop: 17 }}>
      <View style={{ flex: 1, borderWidth: 1, borderColor: '#e8e9f8', borderRadius: 15, padding: 17, minWidth: 0 }}>
        <Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900', fontSize: 16, marginBottom: 8 }}>▣  Experience</Text>
        {visibleExperience.map((item, index) => <View key={`${item.role}-${index}`} style={{ borderLeftWidth: 2, borderLeftColor: color.purple, paddingLeft: 14, paddingBottom: 15, marginLeft: 5 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.purple, position: 'absolute', left: -5, top: 5 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 5 }}><Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900', fontSize: 13 }}>{item.role} · {item.organization}</Text>{!!item.period && <Text style={small}>{item.period}</Text>}</View>
          {!!item.summary && <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 12, lineHeight: 18, marginTop: 4 }}>{item.summary}</Text>}
        </View>)}
        {!profile.experience?.length && <Text style={small}>No experience added yet.</Text>}
        {(profile.experience?.length || 0) > 2 && <Pressable accessibilityRole="button" onPress={() => setShowAllExperience(value => !value)}><Text style={{ color: color.purple, fontFamily: 'Nunito', fontWeight: '900', fontSize: 12 }}>{showAllExperience ? 'Show less' : 'View all experience →'}</Text></Pressable>}
      </View>
      <View style={{ flex: 1, borderWidth: 1, borderColor: '#e8e9f8', borderRadius: 15, padding: 17, minWidth: 0 }}>
        <Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900', fontSize: 16, marginBottom: 8 }}>✧  Certifications</Text>
        {visibleCertifications.map((item, index) => <View key={`${item.name}-${index}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 8 }}>
          <View style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: '#f2f5ff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {item.imagePath ? <Image source={{ uri: certificationImageUrl(item.imagePath) }} resizeMode="cover" style={{ width: 52, height: 52 }} /> : <Text style={{ color: color.purple, fontSize: 22 }}>▧</Text>}
          </View>
          <View style={{ flex: 1 }}><Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900', fontSize: 13 }}>{item.name}</Text><Text style={small}>{item.issuer}{item.year ? ` · ${item.year}` : ''}</Text></View>
        </View>)}
        {!profile.certifications?.length && <Text style={small}>No certifications added yet.</Text>}
        {(profile.certifications?.length || 0) > 3 && <Pressable accessibilityRole="button" onPress={() => setShowAllCertifications(value => !value)}><Text style={{ color: color.purple, fontFamily: 'Nunito', fontWeight: '900', fontSize: 12 }}>{showAllCertifications ? 'Show less' : 'View all certifications →'}</Text></Pressable>}
      </View>
    </View>}
  </View>;
}
