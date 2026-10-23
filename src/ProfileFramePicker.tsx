import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Freelancer } from './data';
import { color } from './UI';
import { FRAME_PRESETS, FramePortrait, type ProfileFrameDesign } from './ProfileFrame';

export default function ProfileFramePicker({ person, designs, onChoose }: {
  person: Freelancer; designs: ProfileFrameDesign[];
  onChoose: (preset: string, customId: string | null) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const choose = async (preset: string, customId: string | null) => {
    if (busy) return;
    setBusy(true); setError('');
    try { await onChoose(preset, customId); }
    catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  };
  return <View style={{ marginTop: 18, padding: 18, borderWidth: 1, borderColor: '#dfd0f7', borderRadius: 19, backgroundColor: '#fbf8ff' }}>
    <Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 18, fontWeight: '900' }}>Dress up your profile photo ✦</Text>
    <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 12, marginTop: 3 }}>Choose a frame. Your photo stays yours, and this outline appears on your public profile.</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11, marginTop: 15 }}>
      {FRAME_PRESETS.map(option => <Pressable key={option.key} accessibilityRole="button" accessibilityLabel={`${option.name} frame${option.premium && !person.premium ? ', premium locked' : ''}`} disabled={busy || (option.premium && !person.premium)} onPress={() => void choose(option.key, null)} style={{ alignItems: 'center', width: 105, padding: 8, borderRadius: 14, borderWidth: 2, borderColor: !person.frameCustomId && (person.framePreset || 'classic') === option.key ? color.purple : '#ece3f6', backgroundColor: '#fff', opacity: option.premium && !person.premium ? .68 : 1 }}><FramePortrait index={person.image} imageUrl={person.imageUrl} name={person.name} size={72} frame={option.key} /><Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 11, fontWeight: '900', textAlign: 'center', marginTop: 7 }}>{option.name}</Text>{option.premium && <Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 10, fontWeight: '900' }}>{person.premium ? '✦ Premium' : '🔒 Premium'}</Text>}</Pressable>)}
      {designs.map(design => <Pressable key={design.id} accessibilityRole="button" accessibilityLabel={`${design.name} premium frame${person.premium ? '' : ', locked'}`} disabled={busy || !person.premium} onPress={() => void choose('classic', design.id)} style={{ alignItems: 'center', width: 105, padding: 8, borderRadius: 14, borderWidth: 2, borderColor: person.frameCustomId === design.id ? color.purple : '#ece3f6', backgroundColor: '#fff', opacity: person.premium ? 1 : .7 }}><FramePortrait index={person.image} imageUrl={person.imageUrl} name={person.name} size={72} overlayUrl={design.url} /><Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 11, fontWeight: '900', textAlign: 'center', marginTop: 7 }}>{design.name}</Text>{!person.premium && <Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 10, fontWeight: '900' }}>🔒 Premium</Text>}</Pressable>)}
      {!designs.length && <View accessibilityLabel="More premium frames coming soon" style={{ alignItems: 'center', justifyContent: 'center', width: 105, minHeight: 116, padding: 8, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: '#dbcaf4', backgroundColor: '#f7f1ff' }}><Text style={{ fontSize: 24 }}>✦</Text><Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 11, fontWeight: '900', textAlign: 'center' }}>More frames</Text><Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 10 }}>Coming soon</Text></View>}
    </View>
    {!!error && <Text style={{ color: '#b63756', fontFamily: 'Nunito', marginTop: 10 }}>{error}</Text>}
  </View>;
}
