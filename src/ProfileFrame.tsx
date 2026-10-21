import React from 'react';
import { Image, View } from 'react-native';
import { color, Portrait } from './UI';

export type FramePreset = 'classic' | 'violet' | 'sunset' | 'royal' | 'mint';
export type ProfileFrameDesign = { id: string; name: string; url: string };
export const FRAME_PRESETS: { key: FramePreset; name: string }[] = [
  { key: 'classic', name: 'Classic' }, { key: 'violet', name: 'Violet glow' },
  { key: 'sunset', name: 'Sunset' }, { key: 'royal', name: 'Royal' },
  { key: 'mint', name: 'Mint' },
];

export function FramePortrait({ index, imageUrl, name, size, frame = 'classic', overlayUrl }: {
  index: number; imageUrl?: string; name?: string; size: number; frame?: string; overlayUrl?: string;
}) {
  const preset = FRAME_PRESETS.some(option => option.key === frame) ? frame : 'classic';
  const style = preset === 'violet' ? { outer: '#b983ff', inner: '#f5e8ff', shadow: color.purple }
    : preset === 'sunset' ? { outer: '#ff8b45', inner: '#ffe1a9', shadow: color.orange }
      : preset === 'royal' ? { outer: '#6643c7', inner: '#f2c56f', shadow: '#4b30a5' }
        : preset === 'mint' ? { outer: '#37bf9b', inner: '#d9fff0', shadow: '#258d76' }
          : { outer: '#e5d3ff', inner: '#fff', shadow: color.purple };
  const inset = Math.max(5, Math.round(size * .026));
  return <View style={{ width: size, height: size, padding: inset, borderWidth: preset === 'classic' ? 2 : 3, borderColor: style.outer, borderRadius: Math.max(20, Math.round(size * .1)), backgroundColor: style.inner, shadowColor: style.shadow, shadowOpacity: .19, shadowRadius: 15, elevation: 3 }}>
    <Portrait index={index} imageUrl={imageUrl} name={name} height={size - inset * 2 - 6} radius={Math.max(14, Math.round(size * .075))} />
    {!!overlayUrl && <View pointerEvents="none" style={{ position: 'absolute', width: size, height: size, top: -3, left: -3 }}><Image source={{ uri: overlayUrl }} resizeMode="stretch" style={{ width: size, height: size }} /></View>}
  </View>;
}
