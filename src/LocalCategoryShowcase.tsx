import React, { useState } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Category, Freelancer } from './data';
import { color, Portrait } from './UI';

type CategoryPick = { category: Category; people: Freelancer[] };

function PortraitLayer({ person, icon, tint, position, expanded }: { person?: Freelancer; icon: string; tint: string; position: 'left' | 'right' | 'front'; expanded: boolean }) {
  const front = position === 'front';
  const spread = position === 'left' ? (expanded ? -69 : -59) : (expanded ? -3 : -13);
  return <View style={[{ position: 'absolute', top: front ? (expanded ? 0 : 7) : (expanded ? 3 : 11), left: '50%', marginLeft: front ? -41 : spread, width: front ? 82 : 72, height: front ? 82 : 72, padding: 3, borderRadius: 8, borderWidth: 1, borderColor: '#eae3df', backgroundColor: '#fff', shadowColor: '#342846', shadowOpacity: expanded ? .2 : front ? .17 : .09, shadowRadius: expanded ? 13 : front ? 9 : 5, elevation: front ? 3 : 1, transform: [{ rotate: front ? '0deg' : position === 'left' ? (expanded ? '-16deg' : '-7deg') : (expanded ? '16deg' : '7deg') }, { scale: front && expanded ? 1.05 : 1 }] }, Platform.OS === 'web' ? { transition: 'top 260ms cubic-bezier(.2,.8,.2,1), margin-left 260ms cubic-bezier(.2,.8,.2,1), transform 260ms cubic-bezier(.2,.8,.2,1), box-shadow 260ms ease' } as any : null]}>
    {person ? <Portrait index={person.image} imageUrl={person.imageUrl} name={person.name} height={front ? 74 : 64} radius={5} /> : <View style={{ flex: 1, borderRadius: 5, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 22 }}>{icon}</Text></View>}
  </View>;
}

function CategoryShowcaseCard({ pick, index, width, onPress }: { pick: CategoryPick; index: number; width: number; onPress: () => void }) {
  const [hovered, setHovered] = useState(false);
  const accents = ['#713af0', '#d26740', '#297f85'];
  const washes = ['#faf7ff', '#fff8f2', '#f4fbfb'];
  const accent = accents[index % accents.length];
  const wash = washes[index % washes.length];
  return <Pressable accessibilityRole="button" accessibilityLabel={`${pick.category.label}, ${pick.people.length} ${pick.people.length === 1 ? 'creative' : 'creatives'}. Explore category`} onPress={onPress} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} onFocus={() => setHovered(true)} onBlur={() => setHovered(false)} style={[{ width, minHeight: 155, alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 2, paddingTop: 4, paddingBottom: 7, transform: [{ translateY: hovered ? -3 : 0 }] }, Platform.OS === 'web' ? { cursor: 'pointer', transition: 'transform 220ms ease' } as any : null]}>
    <View style={{ width: '100%', height: 96, position: 'relative' }}>
      <PortraitLayer person={pick.people[1]} icon={pick.category.icon} tint={wash} position="left" expanded={hovered} />
      <PortraitLayer person={pick.people[2]} icon={pick.category.icon} tint={wash} position="right" expanded={hovered} />
      <PortraitLayer person={pick.people[0]} icon={pick.category.icon} tint={wash} position="front" expanded={hovered} />
    </View>
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: hovered ? accent : color.ink, fontFamily: 'Nunito', fontWeight: '900', fontSize: 15, textAlign: 'center' }} numberOfLines={1}>{pick.category.label}</Text>
      <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 11, marginTop: 2 }}>{pick.people.length} {pick.people.length === 1 ? 'creative' : 'creatives'}</Text>
    </View>
    <Text style={{ color: accent, fontFamily: 'Nunito', fontSize: 11, fontWeight: '900', marginTop: 6 }}>Explore  ↗</Text>
  </Pressable>;
}

export default function LocalCategoryShowcase({ people, categories, onCategory }: { people: Freelancer[]; categories: Category[]; onCategory: (category: Category) => void }) {
  const { width: screenWidth } = useWindowDimensions();
  const grouped = new Map<string, Freelancer[]>();
  people.forEach(person => grouped.set(person.category, [...(grouped.get(person.category) || []), person]));
  const picks = [...grouped.entries()].map(([id, categoryPeople]) => ({ category: categories.find(item => item.id === id) || { id, label: id.replace(/-/g, ' '), icon: '✦' }, people: categoryPeople }))
    .sort((a, b) => b.people.length - a.people.length || a.category.label.localeCompare(b.category.label));
  if (!picks.length) return null;
  const columns = screenWidth >= 1500 ? 8 : screenWidth >= 1200 ? 7 : screenWidth >= 900 ? 6 : 4;
  const gap = 9;
  const availableWidth = Math.min(screenWidth, 1540) - 64;
  const itemWidth = Math.floor((availableWidth - gap * (columns - 1)) / columns);
  const visiblePicks = picks.slice(0, columns);
  return <View style={{ maxWidth: 1540, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 19, alignItems: 'center' }}>
    <Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textAlign: 'center' }}>SKILLS AROUND YOU</Text>
    <Text accessibilityRole="header" style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 26, lineHeight: 33, fontWeight: '900', textAlign: 'center', marginTop: 4 }}>We found {people.length} {people.length === 1 ? 'creative' : 'creatives'} in your area</Text>
    <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 16 }}>A closer look at the skills and people nearby.</Text>
    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center', gap }}>{visiblePicks.map((pick, index) => <CategoryShowcaseCard key={pick.category.id} pick={pick} index={index} width={itemWidth} onPress={() => onCategory(pick.category)} />)}</View>
  </View>;
}
