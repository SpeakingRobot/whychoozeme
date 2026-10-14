import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { InquiryIcon } from './icons';
import { color } from './UI';

export default function InquiryActionButton({ onPress, compact = false, name }: { onPress: () => void; compact?: boolean; name?: string }) {
  const [hovered, setHovered] = useState(false);
  const [launching, setLaunching] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);
  const activate = (event: any) => {
    event.stopPropagation?.();
    if (launching) return;
    setLaunching(true);
    timeout.current = setTimeout(() => { setLaunching(false); onPress(); }, 190);
  };
  const active = hovered || launching;
  return <Pressable accessibilityRole="button" accessibilityLabel={name ? `Inquire with ${name}` : 'Inquire'} onPress={activate} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} onFocus={() => setHovered(true)} onBlur={() => setHovered(false)} style={[{
    minWidth: compact ? 92 : 126, minHeight: compact ? 39 : 44, paddingHorizontal: compact ? 10 : 17,
    borderRadius: 24, borderWidth: 1.5, borderColor: active ? color.purple : '#dcd3ed',
    backgroundColor: active ? color.purple : '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    shadowColor: color.purple, shadowOpacity: active ? .25 : .06, shadowRadius: active ? 13 : 5,
    elevation: active ? 4 : 1, transform: [{ translateY: hovered && !launching ? -3 : 0 }, { scale: launching ? .94 : 1 }],
  }, Platform.OS === 'web' ? { cursor: 'pointer', backgroundImage: active ? 'linear-gradient(115deg, #713af0, #9b67fb, #713af0)' : 'none', backgroundSize: '200% 100%', animation: hovered && !launching ? 'wcm-inquiry-shimmer 1.8s linear infinite' : 'none', transition: 'transform 190ms cubic-bezier(.2,.85,.2,1), box-shadow 190ms ease, background-color 190ms ease, border-color 190ms ease' } as any : null]}>
    <View style={[{ width: active ? 17 : 0, opacity: active ? 1 : 0, overflow: 'hidden', transform: [{ translateX: launching ? 4 : 0 }, { rotate: launching ? '-14deg' : '0deg' }] }, Platform.OS === 'web' ? { transition: 'width 180ms ease, opacity 180ms ease, transform 180ms ease' } as any : null]}><InquiryIcon size={17} /></View>
    <Text style={{ color: active ? '#fff' : color.purple, fontFamily: 'Nunito', fontSize: compact ? 12 : 14, fontWeight: '900' }}>Inquire</Text>
  </Pressable>;
}
