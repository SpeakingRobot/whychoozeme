import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export function ChevronDown({ size = 18, color = '#111638', open = false }: { size?: number; color?: string; open?: boolean }) {
  return <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}><Path d="M4.5 6.75 9 11.25l4.5-4.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

export function TabIcon({ name, color, size = 23 }: { name: 'people' | 'search' | 'map' | 'profile'; color: string; size?: number }) {
  const shared = { stroke: color, strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {name === 'people' && <><Circle cx="9" cy="8" r="3" {...shared} /><Path d="M2.8 19v-1.2a5.4 5.4 0 0 1 10.8 0V19H2.8Z" {...shared} /><Path d="M16.2 5.4a3 3 0 0 1 0 5.8M17 14.3a4.5 4.5 0 0 1 4.2 4.5V19h-4.5" {...shared} /></>}
    {name === 'search' && <><Circle cx="10.6" cy="10.6" r="6.7" {...shared} /><Path d="m15.7 15.7 4.5 4.5" {...shared} /></>}
    {name === 'map' && <><Path d="m3 5.2 6-2 6 2 6-2v15.6l-6 2-6-2-6 2V5.2ZM9 3.2v15.6M15 5.2v15.6" {...shared} /></>}
    {name === 'profile' && <><Circle cx="12" cy="8" r="3.7" {...shared} /><Path d="M4.3 20v-1.4a7.7 7.7 0 0 1 15.4 0V20H4.3Z" {...shared} /></>}
  </Svg>;
}

export function InfoNavIcon({ name, color = '#713af0', size = 17 }: { name: 'about' | 'contact' | 'mission'; color?: string; size?: number }) {
  const shared = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {name === 'about' && <><Circle cx="8" cy="8" r="2.7" {...shared} /><Circle cx="16.5" cy="9" r="2.2" {...shared} /><Path d="M2.7 19v-1.1a5.3 5.3 0 0 1 10.6 0V19H2.7ZM14.8 14.3a4.5 4.5 0 0 1 6.5 4V19h-5" {...shared} /></>}
    {name === 'contact' && <><Path d="M3.5 5.5h17v13h-17v-13ZM3.8 6l8.2 7 8.2-7" {...shared} /></>}
    {name === 'mission' && <><Circle cx="12" cy="12" r="9" {...shared} /><Circle cx="12" cy="12" r="5.5" {...shared} /><Circle cx="12" cy="12" r="1.9" {...shared} /></>}
  </Svg>;
}

export function ChatIcon({ color = '#111638', size = 23 }: { color?: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M20.5 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-3.4-.7L3.5 21l1.6-4.8A8.5 8.5 0 1 1 20.5 11.5Z" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" /><Path d="M8 11.5h8M8 14.6h5.2" stroke={color} strokeWidth={1.9} strokeLinecap="round" /></Svg>;
}

export function CalendarIcon({ color = '#713af0', size = 18 }: { color?: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M4 6.5h16v13H4v-13ZM4 10h16M8 3.5v5M16 3.5v5M8 14h2M12 14h2M16 14h2M8 17h2M12 17h2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

export function CloseIcon({ color = '#111638', size = 22 }: { color?: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M5.5 5.5 18.5 18.5M18.5 5.5 5.5 18.5" stroke={color} strokeWidth={2.1} strokeLinecap="round" /></Svg>;
}
