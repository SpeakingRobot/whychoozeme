import React, { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Freelancer } from './data';
import { Button, color, Heading, Portrait } from './UI';
import { CalendarIcon } from './icons';
import InquiryActionButton from './InquiryActionButton';
import PresenceStatus from './PresenceStatus';
import ResponseBadge from './ResponseBadge';
import { SoftwareMark } from './SoftwarePicker';

type Props = {
  profile: Freelancer;
  compact: boolean;
  narrow: boolean;
  rating: number;
  reviewCount: number;
  saved: boolean;
  onChat: () => void;
  chatReady: boolean;
  onSave: () => void;
  onMap: () => void;
  onAvailability: () => void;
};

export default function ProfileWall({ profile, compact, narrow, rating, reviewCount, saved, onChat, chatReady, onSave, onMap, onAvailability }: Props) {
  const portraitSize = narrow ? 156 : compact ? 190 : 216;
  const text = { fontFamily: 'Nunito' as const, color: color.ink };
  const [availabilityHovered, setAvailabilityHovered] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [showAllSoftware, setShowAllSoftware] = useState(false);

  return <View style={{ padding: narrow ? 18 : 28 }}>
    <Modal visible={descriptionOpen} transparent animationType="fade" onRequestClose={() => setDescriptionOpen(false)}><View style={{ flex: 1, backgroundColor: 'rgba(17,22,56,.60)', justifyContent: 'center', alignItems: 'center', padding: 18 }}><Pressable onPress={() => setDescriptionOpen(false)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} /><View style={{ width: '100%', maxWidth: 650, maxHeight: '82%', backgroundColor: '#fff', borderRadius: 25, padding: narrow ? 20 : 28, shadowColor: color.ink, shadowOpacity: .16, shadowRadius: 25 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><View><Text style={{ color: color.purple, fontFamily: 'Nunito', fontWeight: '900', fontSize: 11, letterSpacing: 1 }}>ABOUT THE WORK</Text><Heading size={25}>Description ✦</Heading></View><Pressable accessibilityRole="button" accessibilityLabel="Close description" onPress={() => setDescriptionOpen(false)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#f4efff', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 24, color: color.purple }}>×</Text></Pressable></View><ScrollView style={{ marginTop: 16 }}><Text style={[text, { fontSize: 15, lineHeight: 24 }]}>{profile.description || profile.why}</Text></ScrollView></View></View></Modal>
    <View style={{ flexDirection: narrow ? 'column' : 'row', alignItems: narrow ? 'stretch' : 'center', gap: narrow ? 18 : 28 }}>
      <View style={{ width: portraitSize, height: portraitSize, alignSelf: narrow ? 'center' : 'auto', padding: 5, borderWidth: 2, borderColor: '#e8d6ff', borderRadius: 27, backgroundColor: '#fbf5ff', shadowColor: color.purple, shadowOpacity: .12, shadowRadius: 15, elevation: 3 }}>
        <Portrait index={profile.image} imageUrl={profile.imageUrl} name={profile.name} height={portraitSize - 14} radius={20} />
      </View>
      <View style={{ flex: 1, gap: 12 }}>
        <View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <Heading size={narrow ? 29 : 37} style={{ flexShrink: 1 }}>{profile.name}{profile.premium && <Text style={{ color: '#a26800', fontSize: 14 }}>  ★ Premium</Text>}</Heading>
            <View style={{ marginLeft: 'auto', marginTop: narrow ? 5 : 8 }}><PresenceStatus person={profile} /></View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            <View accessibilityLabel={`Skill: ${profile.role}`} style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, backgroundColor: '#fff1d9', borderWidth: 1, borderColor: '#f4d49b', borderRadius: 16, paddingHorizontal: 11, paddingVertical: 5 }}>
              <Text style={{ color: '#bc7416', fontSize: 12 }}>✦</Text>
              <Text style={[text, { color: '#865018', fontSize: 14, fontWeight: '900' }]}>{profile.role}</Text>
            </View>
            <Text style={[text, { color: color.muted, fontSize: 14 }]}>⌖ {profile.place}, Goa</Text>
          </View>
        </View>
        <View style={{ backgroundColor: '#f7f0ff', borderLeftWidth: 4, borderLeftColor: color.purple, borderRadius: 16, paddingHorizontal: narrow ? 15 : 19, paddingVertical: 13 }}>
          <Text style={[text, { fontSize: narrow ? 15 : 17, lineHeight: narrow ? 23 : 26, fontWeight: '700' }]} numberOfLines={3}>“{profile.why}”</Text>
        </View>
        {!!(profile.description || profile.why) && <Pressable accessibilityRole="button" accessibilityLabel={`Read ${profile.name}'s description`} onPress={() => setDescriptionOpen(true)} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: '#e7d9ff', backgroundColor: '#fff' }}><Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 12, fontWeight: '900' }}>☰  Description</Text><Text style={{ color: color.purple, fontSize: 13 }}>↗</Text></Pressable>}
        {!!profile.software?.length && <View><Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900', fontSize: 12, marginBottom: 8 }}>SOFTWARE & TOOLS</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{profile.software.slice(0, showAllSoftware ? undefined : 8).map(skill => <View key={`${skill.name}-${skill.slug || skill.website || ''}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 13, backgroundColor: '#fbf9ff', borderWidth: 1, borderColor: '#ede6f6', paddingHorizontal: 7, paddingVertical: 5 }}><SoftwareMark skill={skill} size={17} /><Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 11, fontWeight: '800' }}>{skill.name}</Text></View>)}{profile.software.length > 8 && <Pressable accessibilityRole="button" onPress={() => setShowAllSoftware(value => !value)} style={{ paddingHorizontal: 11, paddingVertical: 9, borderRadius: 12, backgroundColor: '#f1e9ff' }}><Text style={{ color: color.purple, fontSize: 11, fontFamily: 'Nunito', fontWeight: '900' }}>{showAllSoftware ? 'Show less' : `+${profile.software.length - 8} more`}</Text></Pressable>}</View></View>}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {profile.tags.map(tag => <View key={tag} style={{ backgroundColor: '#fff6e9', borderWidth: 1, borderColor: '#ffe5c4', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 6 }}><Text style={[text, { color: '#9a561e', fontSize: 12, fontWeight: '900' }]}>✦ {tag}</Text></View>)}
        </View>
      </View>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', flex: 1 }}>
        <View style={{ backgroundColor: '#fff1d7', borderRadius: 13, paddingHorizontal: 12, paddingVertical: 9 }}><Text style={[text, { fontWeight: '900', color: '#975e00', fontSize: 16 }]}>{reviewCount ? `★ ${rating.toFixed(1)}` : '★ New'} <Text style={{ fontSize: 11, color: color.muted }}>· {reviewCount} reviews</Text></Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`I am located at ${profile.place}, show on map`} onPress={onMap} style={{ borderRadius: 13, backgroundColor: '#f3edff', paddingHorizontal: 12, paddingVertical: 10 }}><Text style={[text, { color: color.purple, fontWeight: '900', fontSize: 12 }]}>⌖ I am located at {profile.place} →</Text></Pressable>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="See availability" onPress={onAvailability} onHoverIn={() => setAvailabilityHovered(true)} onHoverOut={() => setAvailabilityHovered(false)} style={({ pressed }) => [{ minHeight: 40, paddingHorizontal: 17, borderRadius: 22, borderWidth: 1.4, borderColor: color.purple, backgroundColor: availabilityHovered ? color.purple : '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, transform: [{ scale: pressed ? .98 : availabilityHovered ? 1.025 : 1 }], shadowColor: color.purple, shadowOpacity: availabilityHovered ? .2 : 0, shadowRadius: availabilityHovered ? 10 : 0, elevation: availabilityHovered ? 2 : 0 }, Platform.OS === 'web' ? { transition: 'background-color 180ms ease, transform 180ms ease, box-shadow 180ms ease' } as any : null]}>
            <CalendarIcon color={availabilityHovered ? '#fff' : color.purple} size={16} />
            <Text style={{ color: availabilityHovered ? '#fff' : color.purple, fontSize: 12, fontFamily: 'Nunito', fontWeight: '800' }}>See availability</Text>
          </Pressable>
          <ResponseBadge person={profile} toolbar />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 9 }}>
        {chatReady ? <Button onPress={onChat} style={{ minHeight: 42 }}>Open chat</Button> : <InquiryActionButton name={profile.name} onPress={onChat} />}
        <Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Remove saved profile' : 'Save profile'} onPress={onSave} style={{ width: 42, height: 42, borderRadius: 22, backgroundColor: '#f4edff', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: color.purple, fontSize: 24 }}>{saved ? '♥' : '♡'}</Text></Pressable>
      </View>
    </View>
  </View>;
}
