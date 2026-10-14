import React from 'react';
import { Text, View } from 'react-native';
import { Freelancer } from './data';

export function responseTier(minutes?: number) {
  if (minutes === undefined || !Number.isFinite(minutes) || minutes < 0) return null;
  if (minutes <= 15) return { label: 'Very fast', icon: '⚡', ink: '#087c58', background: '#e9fff4', border: '#b9efd6' };
  if (minutes <= 30) return { label: 'Fast', icon: '↗', ink: '#4e3a9c', background: '#f2eeff', border: '#ddd4fc' };
  if (minutes <= 60) return { label: 'Moderate', icon: '◷', ink: '#7e5718', background: '#fff7e6', border: '#f1dfb7' };
  return { label: 'Typical', icon: '◷', ink: '#686b7e', background: '#f6f5f8', border: '#e4e2e9' };
}

export function responseDuration(minutes: number) {
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
}

export default function ResponseBadge({ person, compact = false, side = false }: { person: Freelancer; compact?: boolean; side?: boolean }) {
  const tier = responseTier(person.responseMinutes);
  if (!tier) return null;
  const duration = responseDuration(person.responseMinutes!);
  if (side) return <View accessibilityLabel={`Response rate: ${tier.label.toLowerCase()}. Typical inquiry response ${duration}.`} style={{ flexDirection: 'row', alignItems: 'flex-start', alignSelf: 'flex-start', gap: 5, minWidth: 0, minHeight: 30, marginTop: 2 }}>
    <View style={{ minWidth: 0, alignItems: 'flex-end' }}><Text style={{ color: tier.ink, fontFamily: 'Nunito', fontSize: 11, lineHeight: 14, fontWeight: '900' }} numberOfLines={1}>Response rate</Text><Text style={{ color: '#7b8091', fontFamily: 'Nunito', fontSize: 10, lineHeight: 12 }} numberOfLines={1}>{tier.label} · ~{duration}</Text></View>
    <Text style={{ color: tier.ink, fontSize: 12, lineHeight: 14, marginTop: 1 }}>{tier.icon}</Text>
  </View>;
  return <View accessibilityLabel={`Response rate: ${tier.label.toLowerCase()}. Typical inquiry response ${duration}.`} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%', borderRadius: 14, borderWidth: 1, borderColor: tier.border, backgroundColor: tier.background, paddingHorizontal: compact ? 6 : 8, paddingVertical: compact ? 2 : 4 }}>
    <Text style={{ fontSize: compact ? 10 : 11, color: tier.ink }}>{tier.icon}</Text>
    <Text style={{ fontFamily: 'Nunito', fontSize: compact ? 9 : 10, fontWeight: '900', color: tier.ink }} numberOfLines={1}>{compact ? tier.label : `Response rate · ${tier.label} · ~${duration}`}</Text>
  </View>;
}
