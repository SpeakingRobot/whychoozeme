import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Freelancer } from './data';
import { ChatIcon } from './icons';
import { Button, color, Heading, Portrait } from './UI';

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
  onAvailability: () => void;
};

export default function ProfileWall({ profile, compact, narrow, rating, reviewCount, saved, onChat, onSave, onMap, onAvailability }: Props) {
  const portraitSize = narrow ? 156 : compact ? 190 : 216;
  const text = { fontFamily: 'Nunito' as const, color: color.ink };

  return <View style={{ padding: narrow ? 18 : 28 }}>
    <View style={{ flexDirection: narrow ? 'column' : 'row', alignItems: narrow ? 'stretch' : 'center', gap: narrow ? 18 : 28 }}>
      <View style={{ width: portraitSize, height: portraitSize, alignSelf: narrow ? 'center' : 'auto', padding: 5, borderWidth: 2, borderColor: '#e8d6ff', borderRadius: 27, backgroundColor: '#fbf5ff', shadowColor: color.purple, shadowOpacity: .12, shadowRadius: 15, elevation: 3 }}>
        <Portrait index={profile.image} imageUrl={profile.imageUrl} name={profile.name} height={portraitSize - 14} radius={20} />
      </View>
      <View style={{ flex: 1, gap: 12 }}>
        <View>
          <Heading size={narrow ? 29 : 37}>{profile.name} <Text style={{ color: '#3278ff' }}>✿</Text>{profile.premium && <Text style={{ color: '#a26800', fontSize: 14 }}>  ★ Premium</Text>}</Heading>
          <Text style={[text, { color: color.muted, fontSize: 15, marginTop: 2 }]}>{profile.role} · {profile.place}, Goa</Text>
        </View>
        <View style={{ backgroundColor: '#f7f0ff', borderLeftWidth: 4, borderLeftColor: color.purple, borderRadius: 16, paddingHorizontal: narrow ? 15 : 19, paddingVertical: 13 }}>
          <Text accessibilityRole="header" style={[text, { color: color.purple, fontSize: narrow ? 20 : 24, fontWeight: '900', letterSpacing: -.6 }]}>Why Choose Me<Text style={{ color: color.coral }}>?</Text></Text>
          <Text style={[text, { fontSize: narrow ? 15 : 17, lineHeight: narrow ? 23 : 26, marginTop: 5, fontWeight: '700' }]}>“{profile.why}”</Text>
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
        <Button outline onPress={onAvailability} style={{ minHeight: 40 }} textStyle={{ fontSize: 12 }}>See availability</Button>
      </View>
      <View style={{ flexDirection: 'row', gap: 9 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Open in-app chat with ${profile.name}`} onPress={onChat} style={{ width: 42, height: 42, borderRadius: 22, backgroundColor: color.purple, alignItems: 'center', justifyContent: 'center' }}><ChatIcon color="#fff" size={20} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Remove saved profile' : 'Save profile'} onPress={onSave} style={{ width: 42, height: 42, borderRadius: 22, backgroundColor: '#f4edff', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: color.purple, fontSize: 24 }}>{saved ? '♥' : '♡'}</Text></Pressable>
      </View>
    </View>
  </View>;
}
