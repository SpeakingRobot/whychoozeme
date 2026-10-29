import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { color } from './UI';
import { getMyProfileAnalytics, type ProfileAnalytics } from './liveApi';

const font = 'Nunito' as const;
const empty: ProfileAnalytics = { profileViews: 0, uniqueVisitors: 0, contactClicks: 0, whatsappClicks: 0, inquiries: 0, dailyViews: [] };

export default function ProfileAnalyticsDashboard({ premium, saves }: { premium: boolean; saves: number }) {
  const { width } = useWindowDimensions();
  const compact = width < 690;
  const [days, setDays] = useState<7 | 30>(7);
  const [data, setData] = useState<ProfileAnalytics | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!premium) { setData(null); setError(''); return; }
    let current = true;
    setData(null); setError('');
    getMyProfileAnalytics(days).then(result => { if (current) setData(result); }).catch(cause => { if (current) setError((cause as Error).message); });
    return () => { current = false; };
  }, [premium, days]);
  const stats = data || empty;
  const cards = [
    { label: 'Profile views', value: stats.profileViews, icon: '◉', tone: '#f4edff', accent: color.purple },
    { label: 'Unique visitors', value: stats.uniqueVisitors, icon: '♟', tone: '#fff4e8', accent: '#d68025' },
    { label: 'Contact clicks', value: stats.contactClicks, icon: '✉', tone: '#eef8ff', accent: '#237cb6' },
    { label: 'WhatsApp clicks', value: stats.whatsappClicks, icon: '◉', tone: '#eafbf3', accent: '#15976b' },
    { label: 'Inquiries received', value: stats.inquiries, icon: '▢', tone: '#fff0f6', accent: '#dc4d83' },
    { label: 'People who saved you', value: saves, icon: '♥', tone: '#fff1f3', accent: color.coral },
  ];
  const max = Math.max(1, ...stats.dailyViews.map(item => item.views));
  return <View nativeID="profile-activity" style={{ marginTop: 16, padding: compact ? 17 : 24, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d9e7ff', borderRadius: 20 }}>
    <View style={{ flexDirection: compact ? 'column' : 'row', alignItems: compact ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 12 }}>
      <View><Text style={{ color: color.ink, fontFamily: font, fontWeight: '900', fontSize: compact ? 21 : 24 }}>Profile Analytics Dashboard ✦</Text><Text style={{ color: color.muted, fontFamily: font, fontSize: 12, marginTop: 3 }}>See how people discover and interact with your profile.</Text></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: '#f3eaff' }}><Text style={{ color: color.purple, fontFamily: font, fontWeight: '900', fontSize: 11 }}>♛ Premium</Text></View>{([7, 30] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: days === value }} onPress={() => setDays(value)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 13, backgroundColor: days === value ? color.purple : '#f3f0f8' }}><Text style={{ color: days === value ? '#fff' : color.muted, fontFamily: font, fontWeight: '900', fontSize: 11 }}>{value} days</Text></Pressable>)}</View>
    </View>
    <View style={{ position: 'relative', marginTop: 18 }}>
      <View pointerEvents={premium ? 'auto' : 'none'} style={[{ opacity: premium ? 1 : .32 }, !premium && Platform.OS === 'web' ? { filter: 'blur(5px)' } as any : null]}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11 }}>{cards.map(card => <View key={card.label} style={{ width: compact ? '100%' : '31.7%', minWidth: compact ? undefined : 180, flexGrow: 1, borderRadius: 15, backgroundColor: card.tone, padding: 15, minHeight: 95 }}><Text style={{ color: card.accent, fontSize: 19 }}>{card.icon}</Text><Text style={{ color: color.muted, fontFamily: font, fontWeight: '800', fontSize: 11, marginTop: 4 }}>{card.label}</Text><Text style={{ color: color.ink, fontFamily: font, fontWeight: '900', fontSize: 25 }}>{premium && data ? card.value.toLocaleString() : '—'}</Text></View>)}</View>
        <View style={{ marginTop: 14, padding: 17, borderWidth: 1, borderColor: '#e9e1f6', borderRadius: 16, backgroundColor: '#fcfaff' }}><Text style={{ color: color.ink, fontFamily: font, fontWeight: '900', fontSize: 16 }}>{days === 7 ? 'Weekly' : 'Monthly'} profile views</Text><Text style={{ color: color.muted, fontFamily: font, fontSize: 11, marginTop: 2 }}>One view per signed-in visitor per day. Refreshes are not counted again.</Text><View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 145, gap: days === 7 ? 13 : 3, marginTop: 16 }}>{(premium && data ? stats.dailyViews : Array.from({ length: days === 7 ? 7 : 30 }, (_, index) => ({ date: String(index), views: 0 }))).map(item => <View key={item.date} style={{ flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' }}><View style={{ width: '100%', maxWidth: days === 7 ? 30 : 13, height: premium && data ? Math.max(4, item.views / max * 110) : 24, backgroundColor: '#9a6cff', borderRadius: 6 }} />{days === 7 && <Text style={{ color: color.muted, fontFamily: font, fontSize: 9, marginTop: 6 }}>{premium && data ? new Date(`${item.date}T00:00:00Z`).toLocaleDateString([], { weekday: 'short', timeZone: 'UTC' }) : '·'}</Text>}</View>)}</View></View>
      </View>
      {!premium && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', padding: 15 }}><View style={{ maxWidth: 345, padding: 20, borderRadius: 18, borderWidth: 1, borderColor: '#dfd0f7', backgroundColor: '#fff', shadowColor: '#27134a', shadowOpacity: .16, shadowRadius: 18, elevation: 6, alignItems: 'center' }}><Text style={{ fontSize: 25, color: color.purple }}>♛</Text><Text style={{ color: color.ink, fontFamily: font, fontWeight: '900', fontSize: 17, textAlign: 'center', marginTop: 6 }}>Unlock profile analytics</Text><Text style={{ color: color.muted, fontFamily: font, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7 }}>Premium members can see views, unique visitors, contact clicks, inquiries and performance trends. Contact the WhyChoozeMe team to ask about access.</Text></View></View>}
    </View>
    {premium && !data && !error && <ActivityIndicator color={color.purple} style={{ marginTop: 12 }} />}
    {premium && !!error && <Text style={{ color: color.coral, fontFamily: font, fontSize: 12, marginTop: 12 }}>Analytics could not load: {error}</Text>}
    {premium && <Text style={{ color: color.muted, fontFamily: font, fontSize: 11, marginTop: 13 }}>Contact and WhatsApp clicks are counted from this update onward. Signed-in visitor activity only.</Text>}
  </View>;
}
