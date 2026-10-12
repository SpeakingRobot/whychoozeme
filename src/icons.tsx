import React from 'react';
import Svg, { Path } from 'react-native-svg';

export function ChevronDown({ size = 18, color = '#111638', open = false }: { size?: number; color?: string; open?: boolean }) {
  return <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}><Path d="M4.5 6.75 9 11.25l4.5-4.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}
