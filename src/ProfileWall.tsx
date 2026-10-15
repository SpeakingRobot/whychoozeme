import React, { useState } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
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
  const { width: screenWidth } = useWindowDimensions();
  const isPhone = compact;
  const isTablet = screenWidth < 1100;
  const compactMeta = isTablet && !isPhone;
  const portraitSize = isPhone ? 156 : isTablet ? 166 : 214;
  const text = { fontFamily: 'Nunito' as const, color: color.ink };
  const [availabilityHovered, setAvailabilityHovered] = useState(false);
  const [showAllSoftware, setShowAllSoftware] = useState(false);

  return <View style={{ padding: narrow ? 18 : 28 }}>
    <View style={{ flexDirection: isPhone ? 'column' : 'row', alignItems: isPhone ? 'center' : 'flex-start', gap: isPhone ? 0 : isTablet ? 22 : 32 }}>
      <View style={{ alignItems: 'center', width: isPhone ? '100%' : portraitSize, paddingTop: isPhone ? 4 : 2, paddingBottom: isPhone ? 18 : 0 }}>
        <View style={{ width: portraitSize, height: portraitSize, padding: 5, borderWidth: 2, borderColor: '#e8d6ff', borderRadius: 27, backgroundColor: '#fbf5ff', shadowColor: color.purple, shadowOpacity: .12, shadowRadius: 15, elevation: 3 }}>
          <Portrait index={profile.image} imageUrl={profile.imageUrl} name={profile.name} height={portraitSize - 14} radius={20} />
        </View>
      </View>
      <View style={{ flex: isPhone ? undefined : 1, width: isPhone ? '100%' : undefined, gap: isPhone ? 13 : 12 }}>
        <View style={{ alignItems: isPhone ? 'center' : 'flex-start', gap: 7, marginBottom: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: isPhone ? 'center' : 'space-between', flexWrap: 'wrap', gap: 10, width: '100%' }}>
            <Heading size={isPhone ? 29 : isTablet ? 33 : 38} style={{ textAlign: isPhone ? 'center' : 'left', flexShrink: 1 }}>{profile.name}{profile.premium && <Text style={{ color: '#a26800', fontSize: 14 }}>  ★ Premium</Text>}</Heading>
            {!isPhone && <PresenceStatus person={profile} />}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: isPhone ? 'center' : 'flex-start', flexWrap: 'wrap', gap: 8, width: '100%' }}>
            <View accessibilityLabel={`Skill: ${profile.role}`} style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, backgroundColor: '#fff1d9', borderWidth: 1, borderColor: '#f4d49b', borderRadius: 16, paddingHorizontal: 11, paddingVertical: 5 }}>
              <Text style={{ color: '#bc7416', fontSize: 12 }}>✦</Text>
              <Text style={[text, { color: '#865018', fontSize: 14, fontWeight: '900' }]}>{profile.role}</Text>
            </View>
            <Text style={[text, { color: color.muted, fontSize: 14 }]}>⌖ {profile.place}, Goa</Text>
          </View>
          {isPhone && <View style={{ marginTop: 2 }}><PresenceStatus person={profile} /></View>}
        </View>
        <View style={{ backgroundColor: '#f7f0ff', borderLeftWidth: 4, borderLeftColor: color.purple, borderRadius: 16, paddingHorizontal: isPhone ? 15 : 19, paddingVertical: isPhone ? 14 : 15 }}>
          <Text style={[text, { fontSize: isPhone ? 15 : 17, lineHeight: isPhone ? 23 : 26, fontWeight: '700' }]} numberOfLines={isPhone ? 3 : 4}>“{profile.why}”</Text>
        </View>
        {!!profile.software?.length && <View style={{ alignItems: isPhone ? 'center' : 'flex-start', marginTop: 2 }}><Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900', fontSize: 12, marginBottom: 8, letterSpacing: .4 }}>SOFTWARE & TOOLS</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: isPhone ? 'center' : 'flex-start', gap: 7 }}>{profile.software.slice(0, showAllSoftware ? undefined : 8).map(skill => <View key={`${skill.name}-${skill.slug || skill.website || ''}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 13, backgroundColor: '#fbf9ff', borderWidth: 1, borderColor: '#ede6f6', paddingHorizontal: 7, paddingVertical: 5 }}><SoftwareMark skill={skill} size={17} /><Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 11, fontWeight: '800' }}>{skill.name}</Text></View>)}{profile.software.length > 8 && <Pressable accessibilityRole="button" onPress={() => setShowAllSoftware(value => !value)} style={{ paddingHorizontal: 11, paddingVertical: 9, borderRadius: 12, backgroundColor: '#f1e9ff' }}><Text style={{ color: color.purple, fontSize: 11, fontFamily: 'Nunito', fontWeight: '900' }}>{showAllSoftware ? 'Show less' : `+${profile.software.length - 8} more`}</Text></Pressable>}</View></View>}
      <View style={{ height: 1, backgroundColor: '#efe9f2', marginTop: 5 }} />
      <View style={{ flexDirection: isTablet ? 'column' : 'row', alignItems: isTablet ? 'stretch' : 'center', justifyContent: 'space-between', gap: isTablet ? 10 : 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: isPhone ? 'center' : 'flex-start', gap: 8 }}>
        <View accessibilityLabel={`${reviewCount ? `${rating.toFixed(1)} out of 5, ${reviewCount} reviews` : 'New profile'}`} style={{ minHeight: 40, justifyContent: 'center', backgroundColor: '#fff1d7', borderRadius: 13, paddingHorizontal: compactMeta ? 9 : 12 }}><Text style={[text, { fontWeight: '900', color: '#975e00', fontSize: compactMeta ? 13 : 15 }]}>{reviewCount ? `★ ${rating.toFixed(1)}` : '★ New'} <Text style={{ fontSize: compactMeta ? 10 : 11, color: color.muted }}>· {reviewCount}{compactMeta ? '' : ' reviews'}</Text></Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`I am located at ${profile.place}, show on map`} onPress={onMap} style={{ minHeight: 40, justifyContent: 'center', borderRadius: 13, backgroundColor: '#f3edff', paddingHorizontal: compactMeta ? 9 : 12 }}><Text style={[text, { color: color.purple, fontWeight: '900', fontSize: compactMeta ? 11 : 12 }]}>⌖ {compactMeta ? profile.place : `I am located at ${profile.place}`} →</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="See availability" onPress={onAvailability} onHoverIn={() => setAvailabilityHovered(true)} onHoverOut={() => setAvailabilityHovered(false)} style={({ pressed }) => [{ minHeight: 40, paddingHorizontal: compactMeta ? 11 : 17, borderRadius: 22, borderWidth: 1.4, borderColor: color.purple, backgroundColor: availabilityHovered ? color.purple : '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, transform: [{ scale: pressed ? .98 : availabilityHovered ? 1.025 : 1 }], shadowColor: color.purple, shadowOpacity: availabilityHovered ? .2 : 0, shadowRadius: availabilityHovered ? 10 : 0, elevation: availabilityHovered ? 2 : 0 }, Platform.OS === 'web' ? { transition: 'background-color 180ms ease, transform 180ms ease, box-shadow 180ms ease' } as any : null]}>
          <CalendarIcon color={availabilityHovered ? '#fff' : color.purple} size={16} />
          <Text style={{ color: availabilityHovered ? '#fff' : color.purple, fontSize: compactMeta ? 11 : 12, fontFamily: 'Nunito', fontWeight: '800' }}>{compactMeta ? 'Availability' : 'See availability'}</Text>
        </Pressable>
        <ResponseBadge person={profile} toolbar />
      </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: isPhone ? 'center' : 'flex-end', alignSelf: isPhone ? 'stretch' : 'flex-end', gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 9, width: isPhone ? '100%' : undefined }}>
        <View style={{ flex: isPhone ? 1 : undefined }}>{chatReady ? <Button onPress={onChat} style={{ minHeight: 44, width: isPhone ? '100%' : undefined }}>Open chat</Button> : <InquiryActionButton name={profile.name} onPress={onChat} />}</View>
        <Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Remove saved profile' : 'Save profile'} onPress={onSave} style={{ width: 42, height: 42, borderRadius: 22, backgroundColor: '#f4edff', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: color.purple, fontSize: 24 }}>{saved ? '♥' : '♡'}</Text></Pressable>
      </View>
    </View>
    </View>
    </View>
    </View>
  </View>;
}
