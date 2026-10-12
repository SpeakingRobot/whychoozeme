import React, { useState } from 'react';
import { Image, LayoutChangeEvent, Platform, Pressable, Text, TextInput, View } from 'react-native';
import portraitSheet from '../assets/freelancer-portraits.png';

export const color = { ink: '#111638', muted: '#656a86', purple: '#713af0', violet: '#843df4', coral: '#ff5269', orange: '#ff8939', pale: '#fff9f0', line: '#eeeaf1' };

export function Portrait({ index, height, radius = 16, imageUrl, name }: { index: number; height: number; radius?: number; imageUrl?: string; name?: string }) {
  const [width, setWidth] = useState(220);
  const col = index % 4;
  const row = Math.floor(index / 4) % 2;
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  return <View onLayout={onLayout} style={{ width: '100%', height, overflow: 'hidden', borderRadius: radius, backgroundColor: '#f2d5c4' }}>
    {imageUrl ? <Image source={{ uri: imageUrl }} resizeMode="cover" style={{ width: '100%', height: '100%' }} /> : index < 0 ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee2ff' }}><Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 54, fontWeight: '900' }}>{(name || '?').charAt(0).toUpperCase()}</Text></View> :
      <Image source={Platform.OS === 'web' ? { uri: portraitSheet as unknown as string } : portraitSheet} resizeMode="stretch" style={{ position: 'absolute', width: width * 4, height: width * 3, left: -col * width, top: -row * width * 1.5 - Math.min(width * .11, Math.max(0, width * 1.5 - height) / 2) }} />}
  </View>;
}

export function Button({ children, onPress, outline = false, style, textStyle, disabled = false }: { children: React.ReactNode; onPress?: () => void; outline?: boolean; style?: any; textStyle?: any; disabled?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={({ pressed }) => [{ minHeight: 42, paddingHorizontal: 20, borderRadius: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: outline ? '#fff' : color.purple, borderWidth: outline ? 1.4 : 0, borderColor: color.purple, opacity: disabled ? .5 : pressed ? .82 : 1, shadowColor: outline ? 'transparent' : color.purple, shadowOpacity: outline ? 0 : hovered ? .23 : .16, shadowRadius: hovered ? 11 : 7, elevation: outline ? 0 : hovered ? 3 : 2, transform: [{ translateY: hovered && !disabled ? -2 : 0 }] }, Platform.OS === 'web' ? { transition: 'transform 170ms ease, box-shadow 170ms ease, opacity 170ms ease' } as any : null, style]}>
    <Text style={[{ color: outline ? color.purple : '#fff', fontWeight: '800', fontSize: 14, fontFamily: 'Nunito' }, textStyle]}>{children}</Text>
  </Pressable>;
}

export function Field({ value, onChangeText, placeholder, multiline = false, keyboardType, secureTextEntry, style }: { value: string; onChangeText: (text: string) => void; placeholder: string; multiline?: boolean; keyboardType?: any; secureTextEntry?: boolean; style?: any }) {
  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9695ad" multiline={multiline} keyboardType={keyboardType} secureTextEntry={secureTextEntry} style={[{ borderWidth: 1, borderColor: '#e9e4ee', backgroundColor: '#fff', borderRadius: 16, minHeight: multiline ? 100 : 48, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: color.ink, fontFamily: 'Nunito', textAlignVertical: multiline ? 'top' : 'center' }, style]} />;
}

export function Heading({ children, size = 25, style }: { children: React.ReactNode; size?: number; style?: any }) {
  return <Text style={[{ fontSize: size, fontWeight: '900', color: color.ink, fontFamily: 'Nunito', letterSpacing: -.6 }, style]}>{children}</Text>;
}

export function TinyTag({ children, accent = color.purple, style }: { children: React.ReactNode; accent?: string; style?: any }) {
  return <View style={[{ backgroundColor: '#f8f4ff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }, style]}><Text style={{ color: accent, fontSize: 12, fontWeight: '800', fontFamily: 'Nunito' }}>{children}</Text></View>;
}
