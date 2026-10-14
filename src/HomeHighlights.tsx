import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Category, Freelancer, RequestPost } from './data';
import { color, Heading, Portrait } from './UI';

type Kind = 'standout' | 'hiring' | 'categories' | 'discover';
type Props = {
  kind: Kind;
  compact: boolean;
  people: Freelancer[];
  requests: RequestPost[];
  categories: Category[];
  onProfile: (person: Freelancer) => void;
  onCategory: (category: Category) => void;
  onRequests: () => void;
};
type Highlight = { key: string; eyebrow: string; title: string; detail: string; icon: string; person?: Freelancer; onPress: () => void };

export default function HomeHighlights({ kind, compact, people, requests, categories, onProfile, onCategory, onRequests }: Props) {
  const categoryFor = (id: string) => categories.find(item => item.id === id) || { id, label: id.replace(/-/g, ' '), icon: '✦' };
  const cards: Highlight[] = [];
  let heading = '', subtitle = '';

  if (kind === 'standout' || kind === 'discover') {
    const picks = kind === 'standout'
      ? [...people].sort((a, b) => b.reviews - a.reviews || b.rating - a.rating).slice(0, 5)
      : [...people].sort((a, b) => a.reviews - b.reviews || a.name.localeCompare(b.name)).slice(0, 3);
    heading = kind === 'standout' ? 'People making an impression' : 'Discover someone new';
    subtitle = kind === 'standout' ? 'A closer look at creatives people keep coming back to.' : 'More skills and stories from around Goa.';
    picks.forEach((person, index) => cards.push({
      key: person.id, eyebrow: kind === 'standout' ? `SPOTLIGHT ${index + 1}` : categoryFor(person.category).label.toUpperCase(),
      title: person.name, detail: `${person.role} · ${person.place}`, icon: '✦', person, onPress: () => onProfile(person),
    }));
  } else {
    const counts = new Map<string, number>();
    (kind === 'hiring' ? requests.map(item => item.category) : people.map(item => item.category)).forEach(id => counts.set(id, (counts.get(id) || 0) + 1));
    const picks = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3);
    heading = kind === 'hiring' ? 'Popular hiring right now' : 'Explore by specialty';
    subtitle = kind === 'hiring' ? 'See the kinds of briefs Finders are sharing.' : 'Follow the work that catches your eye.';
    picks.forEach(([id, count]) => {
      const category = categoryFor(id);
      cards.push({ key: id, eyebrow: kind === 'hiring' ? `${count} ${count === 1 ? 'BRIEF' : 'BRIEFS'}` : `${count} ${count === 1 ? 'CREATIVE' : 'CREATIVES'}`,
        title: category.label, detail: kind === 'hiring' ? 'Explore current requirements →' : 'Meet people in this specialty →',
        icon: category.icon, onPress: kind === 'hiring' ? onRequests : () => onCategory(category) });
    });
  }

  if (!cards.length) return null;
  return <View style={{ marginTop: 28, paddingVertical: 20, paddingHorizontal: compact ? 14 : 22, backgroundColor: kind === 'hiring' ? '#fff1e8' : '#f5efff', borderRadius: 24 }}>
    <Heading size={compact ? 21 : 25}>{heading} <Text style={{ color: color.coral }}>✦</Text></Heading>
    <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 13, marginTop: 3, marginBottom: 15 }}>{subtitle}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11 }}>{cards.map(card => <Pressable key={card.key} accessibilityRole="button" accessibilityLabel={`${card.title}, ${card.detail}`} onPress={card.onPress} style={{ width: compact ? '100%' : kind === 'standout' ? '18%' : '31%', flexGrow: 1, minWidth: kind === 'standout' ? 165 : 200, minHeight: 135, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: color.line, padding: 16, justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>{card.person ? <View style={{ width: 58, height: 58 }}><Portrait index={card.person.image} imageUrl={card.person.imageUrl} name={card.person.name} height={58} radius={13} /></View> : <View style={{ width: 58, height: 58, borderRadius: 15, backgroundColor: '#f2e6ff', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 27 }}>{card.icon}</Text></View>}<View style={{ flex: 1 }}><Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>{card.eyebrow}</Text><Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 18, fontWeight: '900', marginTop: 3 }} numberOfLines={1}>{card.title}</Text></View></View>
      <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 13, marginTop: 13 }}>{card.detail}</Text>
    </Pressable>)}</View>
  </View>;
}
