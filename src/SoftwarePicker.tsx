import React, { useMemo, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Button, color, Field } from './UI';
import { publicHttpsUrl, SoftwareSkill, softwareCatalog, softwareIcon } from './software';

export function SoftwareMark({ skill, size = 24 }: { skill: SoftwareSkill; size?: number }) {
  const [failed, setFailed] = useState(false);
  const icon = softwareIcon(skill);
  return <View style={{ width: size + 12, height: size + 12, borderRadius: 10, backgroundColor: '#f5f0ff', alignItems: 'center', justifyContent: 'center' }}>
    {Platform.OS === 'web' && icon && !failed ? <Image source={{ uri: icon }} onError={() => setFailed(true)} style={{ width: size, height: size }} resizeMode="contain" />
      : <Text style={{ color: color.purple, fontSize: size * .55, fontWeight: '900' }}>{skill.name.slice(0, 1).toUpperCase()}</Text>}
  </View>;
}

export default function SoftwarePicker({ value, onChange }: { value: SoftwareSkill[]; onChange: (next: SoftwareSkill[]) => void }) {
  const [query, setQuery] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState('');
  const results = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return softwareCatalog.slice(0, 24);
    return softwareCatalog.filter(item => item.name.toLowerCase().includes(search)).sort((a, b) =>
      Number(b.name.toLowerCase().startsWith(search)) - Number(a.name.toLowerCase().startsWith(search))).slice(0, 40);
  }, [query]);
  const addCustom = () => {
    const website = publicHttpsUrl(customUrl);
    if (!website) { setError('Enter a public HTTPS website link for the software.'); return; }
    const name = customName.trim() || new URL(website).hostname.replace(/^www\./, '').split('.')[0];
    if (!name || name.length > 80) { setError('Use a software name under 80 characters.'); return; }
    if (value.some(item => item.name.toLowerCase() === name.toLowerCase() || item.website === website)) { setError('This software is already selected.'); return; }
    if (value.length >= 50) { setError('You can show up to 50 tools.'); return; }
    onChange([...value, { name, website }]); setCustomUrl(''); setCustomName(''); setError('');
  };
  return <View>
    <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 12, marginBottom: 9 }}>Search {softwareCatalog.length.toLocaleString()} tools and brands. Choose the software you know.</Text>
    <Field value={query} onChangeText={setQuery} placeholder="Search software, e.g. Figma or Blender" />
    <ScrollView style={{ maxHeight: 205, marginTop: 8, borderWidth: 1, borderColor: color.line, borderRadius: 15 }} nestedScrollEnabled>
      {results.map(item => { const selected = value.some(skill => skill.name.toLowerCase() === item.name.toLowerCase()); return <Pressable key={item.slug || item.name} accessibilityRole="button" accessibilityLabel={`${selected ? 'Remove' : 'Add'} ${item.name}`} onPress={() => { onChange(selected ? value.filter(skill => skill.name.toLowerCase() !== item.name.toLowerCase()) : value.length < 50 ? [...value, item] : value); setError(value.length >= 50 && !selected ? 'You can show up to 50 tools.' : ''); }} style={{ paddingHorizontal: 11, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f2eef5', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: selected ? '#f5efff' : '#fff' }}><SoftwareMark skill={item} size={20} /><Text style={{ flex: 1, color: color.ink, fontFamily: 'Nunito', fontWeight: '800' }}>{item.name}</Text><Text style={{ color: color.purple, fontWeight: '900' }}>{selected ? '✓' : '+'}</Text></Pressable>; })}
      {!results.length && <Text style={{ padding: 14, color: color.muted, fontFamily: 'Nunito' }}>No match. Add its website below.</Text>}
    </ScrollView>
    {!!value.length && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 }}>{value.map(skill => <Pressable key={`${skill.name}-${skill.slug || skill.website || ''}`} accessibilityRole="button" accessibilityLabel={`Remove ${skill.name}`} onPress={() => onChange(value.filter(item => item !== skill))} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f4efff', borderRadius: 15, paddingHorizontal: 10, paddingVertical: 6 }}><Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 12, fontWeight: '900' }}>{skill.name} ×</Text></Pressable>)}</View>}
    <Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900', marginTop: 17, marginBottom: 6 }}>Tool missing from the list?</Text>
    <Field value={customName} onChangeText={setCustomName} placeholder="Software name (optional)" />
    <Field value={customUrl} onChangeText={setCustomUrl} placeholder="https://software-website.com" style={{ marginTop: 7 }} />
    <Button outline flat onPress={addCustom} style={{ alignSelf: 'flex-start', marginTop: 8, minHeight: 36 }} textStyle={{ fontSize: 12 }}>Add website and favicon</Button>
    {!!error && <Text style={{ color: color.coral, fontFamily: 'Nunito', fontSize: 12, marginTop: 5 }}>{error}</Text>}
  </View>;
}
