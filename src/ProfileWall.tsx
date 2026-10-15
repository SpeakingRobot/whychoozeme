import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Freelancer } from './data';
import { Button, color, Heading, Portrait } from './UI';
import { CalendarIcon } from './icons';
import InquiryActionButton from './InquiryActionButton';
import PresenceStatus from './PresenceStatus';
import ResponseBadge from './ResponseBadge';

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

  return <View style={{ padding: narrow ? 18 : 28 }}>
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
          <Text style={[text, { fontSize: narrow ? 15 : 17, lineHeight: narrow ? 23 : 26, fontWeight: '700' }]}>“{profile.why}”</Text>
        </View>
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
