import React from 'react';
import { Platform, Text, View } from 'react-native';
import { Freelancer } from './data';

export function presenceLabel(lastActiveAt?: string, now = Date.now()) {
  if (!lastActiveAt) return null;
  const elapsed = now - new Date(lastActiveAt).getTime();
  if (!Number.isFinite(elapsed) || elapsed < -60_000) return null;
  if (elapsed < 120_000) return 'Online now';
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `Last seen ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Last seen ${days}d ago`;
  return `Last seen ${new Date(lastActiveAt).toLocaleDateString()}`;
}

export default function PresenceStatus({ person, compact = false }: { person: Freelancer; compact?: boolean }) {
  const label = presenceLabel(person.lastActiveAt);
  if (!label) return null;
  const online = label === 'Online now';
  const recentlyActive = !online && !!person.lastActiveAt && Date.now() - new Date(person.lastActiveAt).getTime() < 7 * 86_400_000;
  return <View accessibilityLabel={recentlyActive ? `Recently active. ${label}` : label} style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: online ? 6 : 5, minWidth: 0, minHeight: online ? 23 : recentlyActive ? 30 : 16, paddingHorizontal: online ? 8 : 0, paddingVertical: online ? 3 : 0, borderRadius: 20, backgroundColor: online ? '#e8fff1' : 'transparent', borderWidth: online ? 1 : 0, borderColor: '#a6ecc7', shadowColor: online ? '#20aa69' : 'transparent', shadowOpacity: online ? .12 : 0, shadowRadius: 5 }}>
    {online ? <View style={[{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#9be5bd', alignItems: 'center', justifyContent: 'center' }, Platform.OS === 'web' ? { animation: 'wcm-online-pulse 2s ease-in-out infinite' } as any : null]}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#12a863' }} /></View> : <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: recentlyActive ? '#7b64b6' : '#9aa0ad' }} />}
    {recentlyActive ? <View style={{ minWidth: 0 }}><Text style={{ color: '#604b91', fontFamily: 'Nunito', fontSize: compact ? 10 : 11, fontWeight: '900' }} numberOfLines={1}>Recently active</Text><Text style={{ color: '#7b8091', fontFamily: 'Nunito', fontSize: compact ? 9 : 10, lineHeight: compact ? 11 : 12 }} numberOfLines={1}>{label}</Text></View> : <Text style={{ color: online ? '#087344' : '#7b8091', fontFamily: 'Nunito', fontSize: compact ? 10 : online ? 12 : 11, fontWeight: online ? '900' : '800' }} numberOfLines={1}>{label}</Text>}
  </View>;
}
