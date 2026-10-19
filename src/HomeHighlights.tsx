import React, { useState } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Category, Freelancer, RequestPost } from './data';
import { color, Heading, Portrait } from './UI';

type Kind = 'standout' | 'hiring' | 'categories' | 'discover';
type Props = {
  kind: Kind; compact: boolean; people: Freelancer[]; requests: RequestPost[]; categories: Category[];
  onProfile: (person: Freelancer) => void; onCategory: (category: Category) => void; onRequests: () => void;
};
type Highlight = { key: string; eyebrow: string; title: string; detail: string; icon: string; person?: Freelancer; onPress: () => void };

function HighlightCard({ card, width, accent, portraitSize, specialty, denseSpecialty, miniPerson, spotlight }: { card: Highlight; width: any; accent: string; portraitSize: number; specialty?: boolean; denseSpecialty?: boolean; miniPerson?: boolean; spotlight?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={`${card.title}, ${card.detail}`} onPress={card.onPress} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} onFocus={() => setHovered(true)} onBlur={() => setHovered(false)} style={[{
    width, minHeight: spotlight ? 285 : card.person ? portraitSize + (miniPerson ? 20 : 24) : specialty ? 96 : 188, borderRadius: 18, borderWidth: 1,
    borderColor: hovered ? '#cfbafd' : '#eee8e7', backgroundColor: '#fffdfb',
    padding: specialty || miniPerson ? 10 : 12, justifyContent: 'space-between',
    shadowColor: '#6a5471', shadowOpacity: hovered ? .13 : .045,
    shadowRadius: hovered ? 13 : 7, elevation: hovered ? 3 : 1,
    transform: [{ translateY: hovered ? -3 : 0 }],
  }, Platform.OS === 'web' ? { cursor: 'pointer', transition: 'transform 210ms ease, border-color 210ms ease, box-shadow 210ms ease' } as any : null]}>
    {spotlight && card.person ? <View style={{ flex: 1 }}>
      <View style={{ height: 188, overflow: 'hidden', borderRadius: 14, backgroundColor: '#f6efff' }}><Portrait index={card.person.image} imageUrl={card.person.imageUrl} name={card.person.name} height={188} radius={14} /><View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: '#fffdf9', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 }}><Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 10, fontWeight: '900', letterSpacing: .7 }}>{card.eyebrow}</Text></View></View>
      <Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 17, fontWeight: '900', marginTop: 10 }} numberOfLines={1}>{card.title}</Text>
      <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 12, marginTop: 2 }} numberOfLines={1}>{card.person.role} · {card.person.place}</Text>
      <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: '#9a5c0e', fontFamily: 'Nunito', fontSize: 12, fontWeight: '900' }}>{card.person.reviews ? `★ ${card.person.rating.toFixed(1)} · ${card.person.reviews} reviews` : 'New creative'}</Text><Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 12, fontWeight: '900' }}>View profile ↗</Text></View>
    </View> : card.person ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: miniPerson ? 8 : 12, flex: 1 }}>
      <View style={{ width: portraitSize, height: portraitSize, padding: 4, borderRadius: 14, borderWidth: 1, borderColor: '#eee7e4', backgroundColor: '#fff', shadowColor: '#30253c', shadowOpacity: .1, shadowRadius: 8 }}><Portrait index={card.person.image} imageUrl={card.person.imageUrl} name={card.person.name} height={portraitSize - 10} radius={10} /></View>
      <View style={{ flex: 1, minWidth: 0 }}><Text style={{ color: accent, fontFamily: 'Nunito', fontSize: miniPerson ? 9 : 10, fontWeight: '900', letterSpacing: miniPerson ? .3 : .8 }} numberOfLines={1}>{card.eyebrow}</Text><Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: miniPerson ? 12 : portraitSize <= 82 ? 15 : 17, fontWeight: '900', marginTop: 3, lineHeight: miniPerson ? 15 : portraitSize <= 82 ? 18 : 21 }} numberOfLines={miniPerson ? 2 : undefined}>{card.title}</Text><View style={{ alignSelf: 'flex-start', maxWidth: '100%', backgroundColor: '#fff0d9', borderRadius: 12, paddingHorizontal: miniPerson ? 5 : 7, paddingVertical: 3, marginTop: miniPerson ? 4 : 8 }}><Text style={{ color: '#8c541b', fontFamily: 'Nunito', fontSize: miniPerson ? 9 : 10, fontWeight: '900' }} numberOfLines={1}>✦ {card.person.role}</Text></View><Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: miniPerson ? 10 : 11, marginTop: miniPerson ? 3 : 5 }} numberOfLines={1}>⌖ {card.person.place}</Text></View>
    </View> : specialty ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 }}>
      <View style={[{ width: denseSpecialty ? 36 : 45, height: denseSpecialty ? 36 : 45, borderRadius: 13, backgroundColor: '#f6edff', alignItems: 'center', justifyContent: 'center', transform: [{ scale: hovered ? 1.08 : 1 }, { rotate: hovered ? '5deg' : '0deg' }] }, Platform.OS === 'web' ? { transition: 'transform 240ms ease' } as any : null]}><Text style={{ fontSize: denseSpecialty ? 18 : 22 }}>{card.icon}</Text></View>
      <View style={{ flex: 1, minWidth: 0 }}><Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: denseSpecialty ? 12 : 15, fontWeight: '900' }} numberOfLines={1}>{card.title}</Text><Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: denseSpecialty ? 9 : 10, marginTop: 1 }} numberOfLines={1}>{card.eyebrow.toLowerCase()}</Text><Text style={{ color: accent, fontFamily: 'Nunito', fontSize: denseSpecialty ? 10 : 11, fontWeight: '900', marginTop: 4 }}>Explore ↗</Text></View>
    </View> : <>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}><View style={[{ width: 66, height: 66, borderRadius: 19, backgroundColor: '#f6edff', alignItems: 'center', justifyContent: 'center', transform: [{ scale: hovered ? 1.09 : 1 }, { rotate: hovered ? '6deg' : '0deg' }] }, Platform.OS === 'web' ? { transition: 'transform 260ms cubic-bezier(.2,.85,.2,1)' } as any : null]}><View style={Platform.OS === 'web' ? { animation: 'wcm-highlight-icon 4s ease-in-out infinite' } as any : undefined}><Text style={{ fontSize: 30 }}>{card.icon}</Text></View></View><Text style={{ color: accent, fontFamily: 'Nunito', fontSize: 10, fontWeight: '900', letterSpacing: .9 }}>{card.eyebrow}</Text></View>
      <View style={{ marginTop: 12 }}><Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 20, fontWeight: '900' }} numberOfLines={1}>{card.title}</Text><Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 12, marginTop: 4 }}>{card.detail}</Text></View>
      <Text style={{ color: accent, fontFamily: 'Nunito', fontSize: 12, fontWeight: '900', marginTop: 12 }}>Explore  ↗</Text>
    </>}
  </Pressable>;
}

export default function HomeHighlights({ kind, compact, people, requests, categories, onProfile, onCategory, onRequests }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const categoryFor = (id: string) => categories.find(item => item.id === id) || { id, label: id.replace(/-/g, ' '), icon: '✦' };
  const cards: Highlight[] = [];
  let heading = '', subtitle = '';
  if (kind === 'standout' || kind === 'discover') {
    const picks = kind === 'standout'
      ? [...people].sort((a, b) => b.reviews - a.reviews || b.rating - a.rating).slice(0, 4)
      : [...people].sort((a, b) => a.reviews - b.reviews || a.name.localeCompare(b.name)).slice(0, 6);
    heading = kind === 'standout' ? 'People making an impression' : 'Discover someone new';
    subtitle = kind === 'standout' ? 'A closer look at creatives people keep coming back to.' : 'More skills and stories from around Goa.';
    picks.forEach((person, index) => cards.push({ key: person.id, eyebrow: kind === 'standout' ? `SPOTLIGHT 0${index + 1}` : categoryFor(person.category).label.toUpperCase(), title: person.name, detail: `${person.role} · ${person.place}`, icon: '✦', person, onPress: () => onProfile(person) }));
  } else {
    const counts = new Map<string, number>();
    (kind === 'hiring' ? requests.map(item => item.category) : people.map(item => item.category)).forEach(id => counts.set(id, (counts.get(id) || 0) + 1));
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const picks = kind === 'categories'
      ? [...ranked, ...categories.filter(item => item.id !== 'all' && item.id !== 'other' && !counts.has(item.id)).map(item => [item.id, 0] as [string, number])].slice(0, 6)
      : ranked.slice(0, 3);
    heading = kind === 'hiring' ? 'Popular requests right now' : 'Explore by specialty';
    subtitle = kind === 'hiring' ? 'See the kinds of briefs Finders are sharing.' : 'Follow the work that catches your eye.';
    picks.forEach(([id, count]) => { const category = categoryFor(id); cards.push({ key: id, eyebrow: kind === 'hiring' ? `${count} ${count === 1 ? 'BRIEF' : 'BRIEFS'}` : count ? `${count} ${count === 1 ? 'CREATIVE' : 'CREATIVES'}` : 'SPECIALTY', title: category.label, detail: kind === 'hiring' ? 'Explore current requirements.' : 'Meet people in this specialty.', icon: category.icon, onPress: kind === 'hiring' ? onRequests : () => onCategory(category) }); });
  }
  if (!cards.length) return null;
  const cardWidth = kind === 'categories' || kind === 'discover'
    ? screenWidth >= 1050 ? '15.55%' : screenWidth >= 700 ? '30.6%' : screenWidth >= 400 ? '47.5%' : '100%'
    : compact ? '100%' : screenWidth < 1100 ? '47.5%' : kind === 'standout' ? '23.8%' : '30.6%';
  const portraitSize = kind === 'discover' ? screenWidth >= 1400 ? 70 : screenWidth >= 1050 ? 56 : 64 : compact ? 88 : screenWidth < 1100 ? 88 : kind === 'standout' && screenWidth >= 1300 ? 82 : 110;
  const accent = kind === 'hiring' ? '#c56b36' : color.purple;
  return <View style={{ marginTop: 30, paddingVertical: 23, paddingHorizontal: compact ? 14 : 22, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#ede8e7', shadowColor: '#766470', shadowOpacity: .08, shadowRadius: 20, elevation: 2 }}>
    <View style={{ width: 35, height: 3, borderRadius: 3, backgroundColor: accent, marginBottom: 10 }} />
    <Heading size={compact ? 21 : 25}>{heading} <Text style={{ color: color.coral }}>✦</Text></Heading>
    <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 13, marginTop: 3, marginBottom: 18 }}>{subtitle}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 11 }}>{cards.map(card => <HighlightCard key={card.key} card={card} width={cardWidth} accent={accent} portraitSize={portraitSize} specialty={kind === 'categories'} denseSpecialty={kind === 'categories' && screenWidth >= 1050 && screenWidth < 1400} miniPerson={kind === 'discover'} spotlight={kind === 'standout'} />)}</View>
  </View>;
}
