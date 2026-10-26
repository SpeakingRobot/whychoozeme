import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Freelancer } from './data';
import { color } from './UI';

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

export function responseBolts(minutes: number) {
  if (minutes <= 15) return { count: 5, ink: '#12845d', background: '#effbf5', label: 'Very fast' };
  if (minutes <= 30) return { count: 4, ink: '#24764f', background: '#f1f9f2', label: 'Fast' };
  if (minutes <= 60) return { count: 3, ink: '#b47a12', background: '#fff9e9', label: 'Moderate' };
  if (minutes <= 180) return { count: 2, ink: '#cf594b', background: '#fff3f1', label: 'Slower' };
  return { count: 1, ink: '#cf594b', background: '#fff3f1', label: 'Slower' };
}

function Bolt({ color: fill, size }: { color: string; size: number }) {
  return <Svg width={size} height={size} viewBox="0 0 14 18"><Path d="M8.2 1 2.7 9.1h4L5.9 17l5.5-8.4H7.5L8.2 1Z" fill={fill} /></Svg>;
}

export default function ResponseBadge({ person, compact = false, side = false, toolbar = false, profile = false }: { person: Freelancer; compact?: boolean; side?: boolean; toolbar?: boolean; profile?: boolean }) {
  const [open, setOpen] = useState(false);
  const tier = responseTier(person.responseMinutes);
  const unrated = !tier;
  const minutes = person.responseMinutes;
  const meter = unrated ? { count: 0, ink: '#79659e', background: '#f5f0ff', label: 'New' } : responseBolts(minutes!);
  const duration = minutes === undefined ? '' : minutes < 60 ? `${Math.max(1, Math.round(minutes))} minutes` : minutes < 1440 ? `${Math.round(minutes / 60)} hours` : `${Math.round(minutes / 1440)} days`;
  const description = unrated
    ? 'Calculated after your first replies to 3 different Finders whose chats started in the last 90 days.'
    : `Typical first-reply time: about ${duration}. Based on chats started in the last 90 days.`;
  const small = side || compact;
  return <Pressable {...(Platform.OS === 'web' ? { dataSet: { responseMeter: 'true' } } as any : {})} accessibilityRole="button" accessibilityLabel={unrated ? `Response rate pending. ${description}` : `Response rate: ${meter.count} out of 5. ${description}`} onPress={event => { event.stopPropagation?.(); if (Platform.OS !== 'web') setOpen(value => !value); }} style={{ alignSelf: 'flex-start', minHeight: profile ? 54 : toolbar ? 40 : 32, minWidth: 0, maxWidth: '100%', justifyContent: 'center', borderRadius: profile ? 0 : 13, borderWidth: profile ? 0 : 1, borderColor: open ? meter.ink : '#e8e5ed', backgroundColor: profile ? 'transparent' : open ? meter.background : '#fff', paddingHorizontal: profile ? 4 : toolbar ? 12 : 8, paddingVertical: 4, zIndex: open ? 20 : 0, ...(Platform.OS === 'web' ? { '--response-ink': meter.ink, '--response-background': meter.background, transition: 'background-color 160ms ease, border-color 160ms ease', cursor: 'help' } as any : {}) }}>
    {profile ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
      <Text style={{ color: color.purple, fontSize: 25, fontWeight: '900' }}>⌁</Text>
      <View><Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 14, fontWeight: '900' }}>Response rate</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}><Text style={{ color: meter.ink, fontFamily: 'Nunito', fontSize: unrated ? 12 : 17, fontWeight: '900' }}>{unrated ? 'New · not calculated' : `${meter.count}/5`}</Text>{!unrated && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>{Array.from({ length: 5 }, (_, index) => <Bolt key={index} color={index < meter.count ? meter.ink : '#dcdfe6'} size={13} />)}</View>}</View></View>
    </View> : <><Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: small ? 8 : 9, lineHeight: 11, fontWeight: '900', letterSpacing: .3 }}>RESPONSE RATE</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: small ? 1 : 2, marginTop: 2 }}>
        {unrated ? <Text style={{ color: meter.ink, fontFamily: 'Nunito', fontSize: small ? 9 : 10, fontWeight: '900' }}>NEW · NOT YET RATED</Text> : Array.from({ length: 5 }, (_, index) => <Bolt key={index} color={index < meter.count ? meter.ink : '#dcdfe6'} size={small ? 11 : 13} />)}
      </View></>}
    {(Platform.OS === 'web' || open) && <View {...(Platform.OS === 'web' ? { dataSet: { responseTooltip: 'true' } } as any : {})} pointerEvents="none" style={{ position: 'absolute', bottom: '100%', left: profile ? 0 : undefined, right: profile ? undefined : 0, marginBottom: 7, width: 230, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: '#20213f', shadowColor: '#16162f', shadowOpacity: .2, shadowRadius: 9, elevation: 7 }}>
      <Text style={{ color: '#fff', fontFamily: 'Nunito', fontSize: 11, fontWeight: '900' }}>{unrated ? 'Response rate pending' : `${meter.label} response`}</Text>
      <Text style={{ color: '#e5e3f4', fontFamily: 'Nunito', fontSize: 10, marginTop: 2 }}>{description}</Text>
    </View>}
  </Pressable>;
}
