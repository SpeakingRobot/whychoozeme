import React, { useEffect, useRef } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Freelancer } from './data';
import { color, Heading } from './UI';

type Props = {
  title: string;
  detail: string;
  people: Freelancer[];
  width: number;
  cardWidth: number;
  onMore: () => void;
  renderCard: (person: Freelancer, index: number) => React.ReactNode;
};

export default function CarouselRow({ title, detail, people, width, cardWidth, onMore, renderCard }: Props) {
  const scroller = useRef<ScrollView>(null);
  const offset = useRef(0);
  const pausedUntil = useRef(0);
  const step = cardWidth + 13;
  const cards = people;
  const next = (direction = 1) => {
    const max = Math.max(0, cards.length * step - 13 - width);
    if (!max) return;
    const target = direction > 0 && offset.current >= max - 2 ? 0 : Math.max(0, Math.min(max, Math.round(offset.current / step) * step + direction * step));
    scroller.current?.scrollTo({ x: target, animated: target !== 0 });
    offset.current = target;
  };
  useEffect(() => {
    if (cards.length < 2) return;
    let reducedMotion = false;
    if (Platform.OS === 'web' && typeof window !== 'undefined') reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    if (reducedMotion) return;
    const timer = setInterval(() => { if (Date.now() >= pausedUntil.current) next(); }, 4400);
    return () => clearInterval(timer);
  });
  if (!people.length) return null;
  return <View style={{ marginTop: 28 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, marginBottom: 13 }}><View style={{ flex: 1 }}><Heading size={23}>{title} <Text style={{ color: color.orange }}>✦</Text></Heading><Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 12, marginTop: 3 }}>{detail}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`See more ${title}`} onPress={onMore} style={{ paddingHorizontal: 13, paddingVertical: 9, borderRadius: 17, backgroundColor: '#f0e8ff' }}><Text style={{ color: color.purple, fontFamily: 'Nunito', fontWeight: '900', fontSize: 12 }}>See more →</Text></Pressable></View>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}><ScrollView testID={`carousel-${title.toLowerCase().replace(/[^a-z]+/g, '-')}`} ref={scroller} horizontal showsHorizontalScrollIndicator={false} onScroll={event => { offset.current = event.nativeEvent.contentOffset.x; }} onScrollBeginDrag={() => { pausedUntil.current = Date.now() + 15000; }} scrollEventThrottle={32} style={{ width }} contentContainerStyle={{ gap: 13, paddingBottom: 13, paddingTop: 5 }}>{cards.map((person, index) => <View key={`${person.id}-${index}`}>{renderCard(person, index)}</View>)}</ScrollView></View>
    {cards.length > 1 && <View style={{ flexDirection: 'row', gap: 7, justifyContent: 'flex-end' }}><Pressable accessibilityRole="button" accessibilityLabel={`Previous ${title}`} onPress={() => { pausedUntil.current = Date.now() + 10000; next(-1); }} style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: color.line }}><Text style={{ fontSize: 20, color: color.purple }}>‹</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Next ${title}`} onPress={() => { pausedUntil.current = Date.now() + 10000; next(); }} style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: color.line }}><Text style={{ fontSize: 20, color: color.purple }}>›</Text></Pressable></View>}
  </View>;
}
