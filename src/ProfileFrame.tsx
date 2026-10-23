import React from 'react';
import { Image, View } from 'react-native';
import { color, Portrait } from './UI';

export type FramePreset = 'classic' | 'violet' | 'sunset' | 'royal' | 'mint' | 'aurora' | 'champagne' | 'cosmic' | 'flame';
export type ProfileFrameDesign = { id: string; name: string; url: string };
export const FRAME_PRESETS: { key: FramePreset; name: string; premium?: boolean }[] = [
  { key: 'classic', name: 'Classic' }, { key: 'violet', name: 'Violet glow' },
  { key: 'sunset', name: 'Sunset' }, { key: 'royal', name: 'Royal' },
  { key: 'mint', name: 'Mint' },
  { key: 'aurora', name: 'Aurora', premium: true },
  { key: 'champagne', name: 'Champagne', premium: true },
  { key: 'cosmic', name: 'Cosmic', premium: true },
  { key: 'flame', name: 'Flame', premium: true },
];

export function FramePortrait({ index, imageUrl, name, size, frame = 'classic', overlayUrl }: {
  index: number; imageUrl?: string; name?: string; size: number; frame?: string; overlayUrl?: string;
}) {
  const preset = FRAME_PRESETS.some(option => option.key === frame) ? frame : 'classic';
  const style = preset === 'violet' ? { outer: '#b983ff', inner: '#f5e8ff', shadow: color.purple, accent: '#b983ff' }
    : preset === 'sunset' ? { outer: '#ff8b45', inner: '#ffe1a9', shadow: color.orange, accent: '#ff8b45' }
      : preset === 'royal' ? { outer: '#6643c7', inner: '#f2c56f', shadow: '#4b30a5', accent: '#f2c56f' }
        : preset === 'mint' ? { outer: '#37bf9b', inner: '#d9fff0', shadow: '#258d76', accent: '#37bf9b' }
          : preset === 'aurora' ? { outer: '#5b44ec', inner: '#a8f4e9', shadow: '#5b44ec', accent: '#39d9be' }
            : preset === 'champagne' ? { outer: '#b58b38', inner: '#fff0bc', shadow: '#aa7931', accent: '#ffe9a0' }
              : preset === 'cosmic' ? { outer: '#282150', inner: '#bb9fff', shadow: '#6b4ce7', accent: '#d6c5ff' }
                : preset === 'flame' ? { outer: '#e24e43', inner: '#ffcf82', shadow: '#d84362', accent: '#ffad4f' }
                  : { outer: '#e5d3ff', inner: '#fff', shadow: color.purple, accent: '#e5d3ff' };
  const inset = Math.max(5, Math.round(size * .026));
  const premium = FRAME_PRESETS.find(option => option.key === preset)?.premium;
  return <View style={{ width: size, height: size, padding: inset, borderWidth: premium ? 4 : preset === 'classic' ? 2 : 3, borderColor: style.outer, borderRadius: Math.max(20, Math.round(size * .1)), backgroundColor: style.inner, shadowColor: style.shadow, shadowOpacity: premium ? .31 : .19, shadowRadius: premium ? 22 : 15, elevation: premium ? 5 : 3 }}>
    <Portrait index={index} imageUrl={imageUrl} name={name} height={size - inset * 2 - 6} radius={Math.max(14, Math.round(size * .075))} />
    {premium && <><View pointerEvents="none" style={{ position: 'absolute', width: Math.max(6, size * .055), height: Math.max(6, size * .055), borderRadius: size, backgroundColor: style.accent, top: 2, right: 2, borderWidth: 1, borderColor: '#fff' }} /><View pointerEvents="none" style={{ position: 'absolute', width: Math.max(6, size * .055), height: Math.max(6, size * .055), borderRadius: size, backgroundColor: style.accent, bottom: 2, left: 2, borderWidth: 1, borderColor: '#fff' }} /></>}
    {!!overlayUrl && <View pointerEvents="none" style={{ position: 'absolute', width: size, height: size, top: -3, left: -3 }}><Image source={{ uri: overlayUrl }} resizeMode="stretch" style={{ width: size, height: size }} /></View>}
  </View>;
}
