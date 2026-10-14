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
  const icon = <View style={{ width: side || compact ? 23 : 30, height: side || compact ? 23 : 30, borderRadius: 9, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: tier.ink, fontSize: side || compact ? 12 : 15, fontWeight: '900' }}>{tier.icon}</Text></View>;
  const detail = <View style={{ minWidth: 0, alignItems: side ? 'flex-end' : 'flex-start' }}>
    <Text style={{ color: tier.ink, fontFamily: 'Nunito', fontSize: side || compact ? 8 : 10, lineHeight: side || compact ? 11 : 13, fontWeight: '900', letterSpacing: .65 }} numberOfLines={1}>RESPONSE RATE</Text>
    <Text style={{ color: tier.ink, fontFamily: 'Nunito', fontSize: side || compact ? 10 : 12, lineHeight: side || compact ? 14 : 16, fontWeight: '900' }} numberOfLines={1}>{tier.label} · ~{duration}</Text>
  </View>;
  return <View accessibilityLabel={`Response rate: ${tier.label.toLowerCase()}. Typical inquiry response ${duration}.`} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: side || compact ? 5 : 7, minWidth: 0, maxWidth: '100%', borderRadius: side ? 12 : 14, borderWidth: 1, borderColor: tier.border, backgroundColor: tier.background, paddingLeft: side ? 8 : 5, paddingRight: side ? 5 : 10, paddingVertical: side || compact ? 4 : 6, shadowColor: tier.ink, shadowOpacity: side || compact ? 0 : .08, shadowRadius: 6, elevation: side || compact ? 0 : 1 }}>
    {side ? detail : icon}{side ? icon : detail}
  </View>;
}
