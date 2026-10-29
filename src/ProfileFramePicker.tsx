import React, { useState } from 'react';
import { Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Freelancer } from './data';
import { color } from './UI';
import { FRAME_PRESETS, FramePortrait, type ProfileFrameDesign } from './ProfileFrame';

type LockedFrame = { name: string; preset: string; overlayUrl?: string };

export default function ProfileFramePicker({ person, designs, onChoose }: {
  person: Freelancer; designs: ProfileFrameDesign[];
  onChoose: (preset: string, customId: string | null) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lockedFrame, setLockedFrame] = useState<LockedFrame | null>(null);
  const [upgradeInfo, setUpgradeInfo] = useState(false);
  const { width } = useWindowDimensions();
  const closePrompt = () => { setLockedFrame(null); setUpgradeInfo(false); };
  const choose = async (preset: string, customId: string | null) => {
    if (busy) return;
    setBusy(true); setError('');
    try { await onChoose(preset, customId); }
    catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  };
  const openPremium = (frame: LockedFrame) => { setUpgradeInfo(false); setLockedFrame(frame); };
  const lockBadge = <View pointerEvents="none" style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e4d9f8', shadowColor: '#30205e', shadowOpacity: .15, shadowRadius: 4, elevation: 2 }}><Text style={{ fontSize: 11 }}>🔒</Text></View>;
  const presetCard = (option: typeof FRAME_PRESETS[number]) => {
    const locked = !!option.premium && !person.premium;
    return <Pressable key={option.key} accessibilityRole="button" accessibilityLabel={`${option.name} ${option.animated ? 'animated ' : ''}frame${locked ? ', Premium locked. View upgrade information' : ''}`} disabled={busy} onPress={() => locked ? openPremium({ name: option.name, preset: option.key }) : void choose(option.key, null)} style={{ alignItems: 'center', width: 105, padding: 8, borderRadius: 14, borderWidth: 2, borderColor: !person.frameCustomId && (person.framePreset || 'classic') === option.key ? color.purple : '#ece3f6', backgroundColor: '#fff' }}>
      <View><FramePortrait index={person.image} imageUrl={person.imageUrl} name={person.name} size={72} frame={option.key} />{locked && lockBadge}</View>
      <Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 11, fontWeight: '900', textAlign: 'center', marginTop: 7 }}>{option.name}</Text>
      {option.premium && <Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 10, fontWeight: '900' }}>✦ Premium</Text>}
    </Pressable>;
  };
  return <View style={{ marginTop: 18, padding: 18, borderWidth: 1, borderColor: '#dfd0f7', borderRadius: 19, backgroundColor: '#fbf8ff' }}>
    <Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 18, fontWeight: '900' }}>Dress up your profile photo ✦</Text>
    <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 12, marginTop: 3 }}>Choose a frame. Your photo stays yours, and this outline appears on your public profile.</Text>
    <Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 12, fontWeight: '900', marginTop: 17, marginBottom: 8 }}>Your frames</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11 }}>{FRAME_PRESETS.filter(option => !option.premium).map(presetCard)}</View>
    <Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 12, fontWeight: '900', marginTop: 20, marginBottom: 8 }}>✦ Premium frames</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11 }}>
      {FRAME_PRESETS.filter(option => option.premium && !option.animated).map(presetCard)}
      {designs.map(design => {
        const locked = !person.premium;
        return <Pressable key={design.id} accessibilityRole="button" accessibilityLabel={`${design.name} premium frame${locked ? ', locked. View upgrade information' : ''}`} disabled={busy} onPress={() => locked ? openPremium({ name: design.name, preset: 'classic', overlayUrl: design.url }) : void choose('classic', design.id)} style={{ alignItems: 'center', width: 105, padding: 8, borderRadius: 14, borderWidth: 2, borderColor: person.frameCustomId === design.id ? color.purple : '#ece3f6', backgroundColor: '#fff' }}>
          <View><FramePortrait index={person.image} imageUrl={person.imageUrl} name={person.name} size={72} overlayUrl={design.url} />{locked && lockBadge}</View>
          <Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 11, fontWeight: '900', textAlign: 'center', marginTop: 7 }}>{design.name}</Text>
          <Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 10, fontWeight: '900' }}>✦ Premium</Text>
        </Pressable>;
      })}
      {!designs.length && <View accessibilityLabel="More premium frames coming soon" style={{ alignItems: 'center', justifyContent: 'center', width: 105, minHeight: 116, padding: 8, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: '#dbcaf4', backgroundColor: '#f7f1ff' }}><Text style={{ fontSize: 24 }}>✦</Text><Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 11, fontWeight: '900', textAlign: 'center' }}>More frames</Text><Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 10 }}>Coming soon</Text></View>}
    </View>
    <Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 12, fontWeight: '900', marginTop: 20, marginBottom: 8 }}>✧ Animated frames</Text>
    <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 11, marginBottom: 9 }}>Premium motion appears on the website; reduced-motion settings show a still frame.</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11 }}>{FRAME_PRESETS.filter(option => option.animated).map(presetCard)}</View>
    {!!error && <Text style={{ color: '#b63756', fontFamily: 'Nunito', marginTop: 10 }}>{error}</Text>}
    <Modal visible={!!lockedFrame} transparent animationType="fade" onRequestClose={closePrompt}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(23, 20, 43, .42)' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close Premium frame information" onPress={closePrompt} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
        <View style={{ width: '100%', maxWidth: 520, borderRadius: 22, borderWidth: 1, borderColor: '#e4d8f6', backgroundColor: '#fff', padding: width >= 580 ? 24 : 19, shadowColor: '#261c48', shadowOpacity: .17, shadowRadius: 24, elevation: 12 }}>
          <View style={{ flexDirection: width >= 580 ? 'row' : 'column', alignItems: width >= 580 ? 'center' : 'flex-start', gap: 20 }}>
            <View style={{ alignItems: 'center', alignSelf: width >= 580 ? 'auto' : 'center', padding: 9, borderRadius: 18, backgroundColor: '#faf7ff', borderWidth: 1, borderColor: '#eee6fa' }}>
              <FramePortrait index={person.image} imageUrl={person.imageUrl} name={person.name} size={124} frame={lockedFrame?.preset} overlayUrl={lockedFrame?.overlayUrl} />
              <Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900', fontSize: 12, marginTop: 8 }}>{lockedFrame?.name}</Text>
            </View>
            <View style={{ flex: width >= 580 ? 1 : undefined }}>
              <Text style={{ color: color.purple, fontFamily: 'Nunito', fontWeight: '900', fontSize: 12 }}>🔒 PREMIUM FRAME ✦</Text>
              <Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900', fontSize: 20, marginTop: 6 }}>Unlock Premium frames</Text>
              <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 13, lineHeight: 19, marginTop: 7 }}>The {lockedFrame?.name} frame is for Premium members. Your photo and this design are shown here in full so you can preview the look.</Text>
            </View>
          </View>
          {upgradeInfo && <View style={{ backgroundColor: '#f7f1ff', borderRadius: 12, padding: 12, marginTop: 18 }}><Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 12, lineHeight: 18 }}>Premium access is currently enabled by the WhyChooseMe team. Please contact the team to upgrade; this frame will remain available to preview until then.</Text></View>}
          <View style={{ flexDirection: width >= 420 ? 'row' : 'column', gap: 10, marginTop: 21 }}>
            <Pressable accessibilityRole="button" onPress={() => setUpgradeInfo(true)} style={{ flex: 1, minHeight: 44, borderRadius: 11, justifyContent: 'center', alignItems: 'center', backgroundColor: color.purple, paddingHorizontal: 14 }}><Text style={{ color: '#fff', fontFamily: 'Nunito', fontWeight: '900', fontSize: 13 }}>Upgrade to Premium</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={closePrompt} style={{ flex: 1, minHeight: 44, borderRadius: 11, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f4fb', borderWidth: 1, borderColor: '#e6deed', paddingHorizontal: 14 }}><Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900', fontSize: 13 }}>Maybe later</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  </View>;
}
