import React from 'react';
import { Image, Platform, View } from 'react-native';
import { color, Portrait } from './UI';

export type FramePreset = 'classic' | 'violet' | 'sunset' | 'royal' | 'mint'
  | 'aurora' | 'champagne' | 'cosmic' | 'flame' | 'pearl' | 'sapphire' | 'emerald' | 'rose-gold'
  | 'orbit-glow' | 'golden-shimmer' | 'violet-pulse' | 'rainbow-shift' | 'star-sparkle';
export type ProfileFrameDesign = { id: string; name: string; url: string };
type FrameOption = { key: FramePreset; name: string; premium?: boolean; animated?: boolean };
export const FRAME_PRESETS: FrameOption[] = [
  { key: 'classic', name: 'Classic' }, { key: 'violet', name: 'Violet glow' },
  { key: 'sunset', name: 'Sunset' }, { key: 'royal', name: 'Royal' },
  { key: 'mint', name: 'Mint' },
  { key: 'aurora', name: 'Aurora', premium: true },
  { key: 'champagne', name: 'Champagne', premium: true },
  { key: 'cosmic', name: 'Cosmic', premium: true },
  { key: 'flame', name: 'Flame', premium: true },
  { key: 'pearl', name: 'Pearl', premium: true },
  { key: 'sapphire', name: 'Sapphire', premium: true },
  { key: 'emerald', name: 'Emerald', premium: true },
  { key: 'rose-gold', name: 'Rose gold', premium: true },
  { key: 'orbit-glow', name: 'Orbit glow', premium: true, animated: true },
  { key: 'golden-shimmer', name: 'Golden shimmer', premium: true, animated: true },
  { key: 'violet-pulse', name: 'Violet pulse', premium: true, animated: true },
  { key: 'rainbow-shift', name: 'Rainbow shift', premium: true, animated: true },
  { key: 'star-sparkle', name: 'Star sparkle', premium: true, animated: true },
];

type Palette = { outer: string; inner: string; shadow: string; accent: string };
const palettes: Record<FramePreset, Palette> = {
  classic: { outer: '#e5d3ff', inner: '#fff', shadow: color.purple, accent: '#e5d3ff' },
  violet: { outer: '#b983ff', inner: '#f5e8ff', shadow: color.purple, accent: '#b983ff' },
  sunset: { outer: '#ff8b45', inner: '#ffe1a9', shadow: color.orange, accent: '#ff8b45' },
  royal: { outer: '#6643c7', inner: '#f2c56f', shadow: '#4b30a5', accent: '#f2c56f' },
  mint: { outer: '#37bf9b', inner: '#d9fff0', shadow: '#258d76', accent: '#37bf9b' },
  aurora: { outer: '#5b44ec', inner: '#a8f4e9', shadow: '#5b44ec', accent: '#39d9be' },
  champagne: { outer: '#b58b38', inner: '#fff0bc', shadow: '#aa7931', accent: '#ffe9a0' },
  cosmic: { outer: '#282150', inner: '#bb9fff', shadow: '#6b4ce7', accent: '#d6c5ff' },
  flame: { outer: '#e24e43', inner: '#ffcf82', shadow: '#d84362', accent: '#ffad4f' },
  pearl: { outer: '#c4aeea', inner: '#fffafd', shadow: '#b4a0d6', accent: '#fff' },
  sapphire: { outer: '#2273d2', inner: '#d6f0ff', shadow: '#1454a3', accent: '#94d5ff' },
  emerald: { outer: '#158f72', inner: '#d9fbe7', shadow: '#0e7c61', accent: '#94e7b7' },
  'rose-gold': { outer: '#c77b84', inner: '#ffe3dc', shadow: '#b45e71', accent: '#ffd8ae' },
  'orbit-glow': { outer: '#8152f2', inner: '#eee6ff', shadow: '#7141db', accent: '#b899ff' },
  'golden-shimmer': { outer: '#c88b22', inner: '#fff0ca', shadow: '#b87916', accent: '#ffe28a' },
  'violet-pulse': { outer: '#7948e7', inner: '#e9dcff', shadow: '#6930d6', accent: '#c09aff' },
  'rainbow-shift': { outer: '#5a8af0', inner: '#e8f0ff', shadow: '#8d68df', accent: '#ffa1c4' },
  'star-sparkle': { outer: '#6f4ce0', inner: '#f4eaff', shadow: '#5534ae', accent: '#ffe6a1' },
};

export function FramePortrait({ index, imageUrl, name, size, frame = 'classic', overlayUrl }: {
  index: number; imageUrl?: string; name?: string; size: number; frame?: string; overlayUrl?: string;
}) {
  const option = FRAME_PRESETS.find(item => item.key === frame) || FRAME_PRESETS[0];
  const preset = option.key;
  const style = palettes[preset];
  const inset = Math.max(5, Math.round(size * .026));
  const premium = option.premium;
  return <View {...(Platform.OS === 'web' && option.animated ? { dataSet: { frameEffect: preset } } as any : {})} style={{ width: size, height: size, padding: inset, borderWidth: premium ? 4 : preset === 'classic' ? 2 : 3, borderColor: style.outer, borderRadius: Math.max(20, Math.round(size * .1)), backgroundColor: style.inner, shadowColor: style.shadow, shadowOpacity: premium ? .31 : .19, shadowRadius: premium ? 22 : 15, elevation: premium ? 5 : 3 }}>
    <Portrait index={index} imageUrl={imageUrl} name={name} height={size - inset * 2 - 6} radius={Math.max(14, Math.round(size * .075))} />
    {premium && <><View pointerEvents="none" style={{ position: 'absolute', width: Math.max(6, size * .055), height: Math.max(6, size * .055), borderRadius: size, backgroundColor: style.accent, top: 2, right: 2, borderWidth: 1, borderColor: '#fff' }} /><View pointerEvents="none" style={{ position: 'absolute', width: Math.max(6, size * .055), height: Math.max(6, size * .055), borderRadius: size, backgroundColor: style.accent, bottom: 2, left: 2, borderWidth: 1, borderColor: '#fff' }} /></>}
    {!!overlayUrl && <View pointerEvents="none" style={{ position: 'absolute', width: size, height: size, top: -3, left: -3 }}><Image source={{ uri: overlayUrl }} resizeMode="stretch" style={{ width: size, height: size }} /></View>}
  </View>;
}
