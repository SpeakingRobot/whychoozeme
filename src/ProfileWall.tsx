import React, { useState } from 'react';
import { Linking, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Freelancer } from './data';
import { Button, color, Heading } from './UI';
import PresenceStatus, { presenceLabel } from './PresenceStatus';
import ResponseBadge from './ResponseBadge';
import { SoftwareMark } from './SoftwarePicker';
import { publicWhatsapp } from './whatsapp';
import { FramePortrait } from './ProfileFrame';

type Props = {
  profile: Freelancer;
  compact: boolean;
  narrow: boolean;
  rating: number;
  reviewCount: number;
  saved: boolean;
  onChat: () => void;
  onSave: () => void;
  onMap: () => void;
};

export default function ProfileWall({ profile, compact, narrow, rating, reviewCount, saved, onChat, onSave, onMap }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const isPhone = compact;
  const isTablet = screenWidth < 1100;
  const portraitSize = isPhone ? 170 : isTablet ? 184 : screenWidth >= 1500 ? 320 : 256;
  const text = { fontFamily: 'Nunito' as const, color: color.ink };
  const [showAllSoftware, setShowAllSoftware] = useState(false);
  const whatsapp = publicWhatsapp(profile.links, profile.publicWhatsappUrl);
  const roleBadge = <View accessibilityLabel={`Skill: ${profile.role}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#fff1df', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 8 }}>
    <Text style={{ color: '#bc7416', fontSize: 15 }}>✦</Text>
    <Text style={[text, { color: '#865018', fontSize: 14, fontWeight: '900' }]}>{profile.role}</Text>
  </View>;

  return <View style={{ padding: narrow ? 18 : isTablet ? 25 : 32 }}>
    <View style={{ flexDirection: isPhone ? 'column' : 'row', alignItems: isPhone ? 'center' : 'flex-start', gap: isPhone ? 17 : isTablet ? 24 : 34 }}>
      <View style={{ alignItems: 'center', width: isPhone ? '100%' : portraitSize }}>
        <View style={{ width: portraitSize, height: portraitSize }}>
          <FramePortrait index={profile.image} imageUrl={profile.imageUrl} name={profile.name} size={portraitSize} frame={profile.framePreset} overlayUrl={profile.frameOverlayUrl} />
          {presenceLabel(profile.lastActiveAt) === 'Online now' && <View style={{ position: 'absolute', left: 17, bottom: 17 }}><PresenceStatus person={profile} /></View>}
        </View>
        {!!presenceLabel(profile.lastActiveAt) && presenceLabel(profile.lastActiveAt) !== 'Online now' && <View style={{ marginTop: 11 }}><PresenceStatus person={profile} /></View>}
      </View>

      <View style={{ flex: isPhone ? undefined : 1, width: isPhone ? '100%' : undefined, minWidth: 0, gap: isPhone ? 15 : 17 }}>
        <View style={{ gap: 11, alignItems: isPhone ? 'center' : 'flex-start' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: isPhone ? 'center' : 'space-between', flexWrap: 'wrap', gap: 12, width: '100%' }}>
            <Heading size={isPhone ? 30 : isTablet ? 34 : 42} style={{ textAlign: isPhone ? 'center' : 'left', flexShrink: 1 }}>{profile.name}{profile.premium && <Text style={{ color: color.purple, fontSize: 17 }}>  ✦</Text>}</Heading>
            {!isPhone && roleBadge}
          </View>
          {isPhone && roleBadge}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: isPhone ? 'center' : 'flex-start', flexWrap: 'wrap', gap: 9 }}>
            <View accessibilityLabel={reviewCount ? `${rating.toFixed(1)} out of 5, ${reviewCount} reviews` : 'New profile'} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: '#c68104', fontSize: 18 }}>★</Text>
              <Text style={[text, { fontWeight: '900', fontSize: 16 }]}>{reviewCount ? rating.toFixed(1) : 'New'}</Text>
              {!!reviewCount && <Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 13, fontWeight: '800' }}>· {reviewCount} reviews</Text>}
            </View>
            <View style={{ width: 1, height: 18, backgroundColor: '#e8e0ef' }} />
            <Pressable accessibilityRole="button" accessibilityLabel={`I am located at ${profile.place}, show on map`} onPress={onMap} style={{ paddingVertical: 3 }}><Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 13, fontWeight: '800' }}>⌖ {profile.place}, Goa →</Text></Pressable>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 11, backgroundColor: '#f7f0ff', borderLeftWidth: 4, borderLeftColor: color.purple, borderRadius: 17, paddingHorizontal: isPhone ? 15 : 20, paddingVertical: isPhone ? 14 : 17 }}>
          <Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 28, fontWeight: '900', lineHeight: 29 }}>“</Text>
          <Text style={[text, { flex: 1, fontSize: isPhone ? 15 : 17, lineHeight: isPhone ? 23 : 26, fontWeight: '700' }]} numberOfLines={isPhone ? 3 : 4}>{profile.why}”</Text>
        </View>

        {!!profile.software?.length && <View style={{ alignItems: isPhone ? 'center' : 'flex-start' }}><Text style={{ color: color.muted, fontFamily: 'Nunito', fontWeight: '900', fontSize: 12, marginBottom: 9, letterSpacing: 1.1 }}>SOFTWARE & TOOLS</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: isPhone ? 'center' : 'flex-start', gap: 8 }}>{profile.software.slice(0, showAllSoftware ? undefined : 8).map(skill => <View key={`${skill.name}-${skill.slug || skill.website || ''}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 18, backgroundColor: '#f8f7fb', paddingHorizontal: 11, paddingVertical: 7 }}><SoftwareMark skill={skill} size={18} /><Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 11, fontWeight: '800' }}>{skill.name}</Text></View>)}{profile.software.length > 8 && <Pressable accessibilityRole="button" onPress={() => setShowAllSoftware(value => !value)} style={{ paddingHorizontal: 11, paddingVertical: 9, borderRadius: 16, backgroundColor: '#f1e9ff' }}><Text style={{ color: color.purple, fontSize: 11, fontFamily: 'Nunito', fontWeight: '900' }}>{showAllSoftware ? 'Show less' : `+${profile.software.length - 8} more`}</Text></Pressable>}</View></View>}

        <View style={{ marginTop: isPhone ? 3 : 7, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#eee8f3', flexDirection: isPhone ? 'column' : 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: isPhone ? 'center' : 'flex-start', alignItems: 'center', gap: 12, flex: isPhone ? undefined : 1 }}><ResponseBadge person={profile} profile /></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10, width: isPhone ? '100%' : undefined }}>
            <View style={{ flex: isPhone ? 1 : undefined }}><Button onPress={onChat} flat style={{ minHeight: 52, minWidth: isPhone ? undefined : 150, width: isPhone ? '100%' : undefined }}>Message</Button></View>
            {!!whatsapp && <Button outline onPress={() => Linking.openURL(whatsapp)} style={{ minHeight: 52 }}>WhatsApp ↗</Button>}
            <Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Remove saved profile' : 'Save profile'} onPress={onSave} style={{ width: 52, height: 52, borderRadius: 17, backgroundColor: '#f4edff', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: color.purple, fontSize: 26 }}>{saved ? '♥' : '♡'}</Text></Pressable>
          </View>
        </View>
      </View>
    </View>
  </View>;
}
