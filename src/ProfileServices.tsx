import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Freelancer } from './data';
import { Button, color, Field, Heading } from './UI';
import { getServices, reorderServices, saveService, ServiceListing, setServiceActive } from './serviceApi';

const locationLabel: Record<ServiceListing['location'], string> = {
  remote: 'Remote', hybrid: 'Hybrid', on_site: 'On site',
};

export default function ProfileServices({ profile, isOwner, narrow }: { profile: Freelancer; isOwner: boolean; narrow: boolean }) {
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(!profile.demo);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<ServiceListing['location']>('remote');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (profile.demo) return;
    try { setServices(await getServices(profile.id)); setError(''); }
    catch (cause) { setError((cause as Error).message); }
    finally { setLoading(false); }
  }, [profile.demo, profile.id]);
  useEffect(() => { void reload(); }, [reload]);

  const startEdit = (service?: ServiceListing) => {
    setEditing(service?.id || 'new');
    setTitle(service?.title || '');
    setDescription(service?.description || '');
    setLocation(service?.location || 'remote');
    setError('');
  };
  const save = async () => {
    if (title.trim().length < 4 || title.trim().length > 140) { setError('Use a service title between 4 and 140 characters.'); return; }
    if (description.trim().length < 10 || description.trim().length > 4000) { setError('Describe the service in 10 to 4,000 characters.'); return; }
    setBusy(true);
    try {
      await saveService(profile.id, { id: editing === 'new' ? undefined : editing || undefined, title, description, location, category: profile.category, sortOrder: editing === 'new' ? services.length : services.find(item => item.id === editing)?.sort_order || 0 });
      setEditing(null);
      await reload();
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  };
  const toggle = async (service: ServiceListing) => {
    setBusy(true);
    try { await setServiceActive(profile.id, service.id, !service.active); await reload(); }
    catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  };
  const move = async (index: number, direction: -1 | 1) => {
    const ordered = [...services];
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    setBusy(true);
    try { await reorderServices(profile.id, ordered.map(item => item.id)); setServices(ordered); await reload(); }
    catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  };

  const visible = services.filter(item => item.active || isOwner);
  return <View style={{ borderTopWidth: 1, borderTopColor: color.line, padding: narrow ? 18 : 28 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
      <View><Heading size={25}>Services <Text style={{ color: color.coral }}>✦</Text></Heading><Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 13, marginTop: 3 }}>What {profile.name.split(' ')[0]} can help you with.</Text></View>
      {isOwner && <Button outline flat onPress={() => startEdit()} style={{ minHeight: 38 }}>+ Add service</Button>}
    </View>
    {loading && <Text style={{ color: color.muted, fontFamily: 'Nunito', marginTop: 16 }}>Loading services…</Text>}
    {!loading && profile.demo && !!profile.work.length && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 17 }}>{profile.work.map((item, index) => <View key={`${item}-${index}`} style={{ borderRadius: 16, backgroundColor: '#f7f1ff', paddingHorizontal: 15, paddingVertical: 11 }}><Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900' }}>{item}</Text></View>)}</View>}
    {!loading && !profile.demo && !visible.length && <Text style={{ color: color.muted, fontFamily: 'Nunito', marginTop: 16 }}>{isOwner ? 'Add a service so visitors know exactly what you offer.' : 'This freelancer has not listed any services yet.'}</Text>}
    {!!visible.length && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 }}>{visible.map((service, index) => <View key={service.id} style={{ width: narrow ? '100%' : '48.5%', minWidth: narrow ? undefined : 260, borderWidth: 1, borderColor: '#ece4f7', backgroundColor: service.active ? '#fdfbff' : '#f6f5f7', borderRadius: 18, padding: 17 }}>
      <Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 17, fontWeight: '900' }}>{service.title}</Text>
      <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 13, lineHeight: 19, marginTop: 7 }}>{service.description}</Text>
      <Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 12, fontWeight: '900', marginTop: 12 }}>Work mode: {locationLabel[service.location] || 'Remote'}{!service.active ? ' · Hidden' : ''}</Text>
      {isOwner && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}><Button outline flat disabled={busy} onPress={() => startEdit(service)} style={{ minHeight: 32 }} textStyle={{ fontSize: 11 }}>Edit</Button><Button outline flat disabled={busy} onPress={() => void toggle(service)} style={{ minHeight: 32 }} textStyle={{ fontSize: 11 }}>{service.active ? 'Hide' : 'Show'}</Button><Button outline flat disabled={busy || index === 0} onPress={() => void move(index, -1)} style={{ minHeight: 32 }} textStyle={{ fontSize: 11 }}>↑</Button><Button outline flat disabled={busy || index === services.length - 1} onPress={() => void move(index, 1)} style={{ minHeight: 32 }} textStyle={{ fontSize: 11 }}>↓</Button></View>}
    </View>)}</View>}
    {isOwner && editing && <View style={{ marginTop: 17, padding: 17, backgroundColor: '#faf6ff', borderRadius: 17, gap: 9 }}><Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 16, fontWeight: '900' }}>{editing === 'new' ? 'Add a service' : 'Edit service'}</Text><Field value={title} onChangeText={setTitle} placeholder="e.g. Brand identity design" /><Field value={description} onChangeText={setDescription} placeholder="What is included?" multiline style={{ minHeight: 90 }} /><Text style={{ color: color.muted, fontFamily: 'Nunito', fontWeight: '900', fontSize: 12 }}>Where can you work?</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{(Object.keys(locationLabel) as ServiceListing['location'][]).map(option => <Pressable key={option} accessibilityRole="button" onPress={() => setLocation(option)} style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 14, backgroundColor: location === option ? color.purple : '#eee8f6' }}><Text style={{ color: location === option ? '#fff' : color.ink, fontFamily: 'Nunito', fontWeight: '900', fontSize: 12 }}>{locationLabel[option]}</Text></Pressable>)}</View><View style={{ flexDirection: 'row', gap: 8, marginTop: 5 }}><Button disabled={busy} onPress={() => void save()}>{busy ? 'Saving…' : 'Save service'}</Button><Button outline flat disabled={busy} onPress={() => setEditing(null)}>Cancel</Button></View></View>}
    {!!error && <Text style={{ color: color.coral, fontFamily: 'Nunito', marginTop: 11 }}>{error}</Text>}
  </View>;
}
