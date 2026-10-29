import React, { useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { color } from './UI';

type Item = { label: string; icon: string; onPress: () => void; active?: boolean; badge?: number };

export default function AccountDrawer({ visible, onClose, name, imageUrl, role, area, completion, premium, items, onComplete, onHelp }: {
  visible: boolean; onClose: () => void; name: string; imageUrl?: string; role: string; area?: string;
  completion: number; premium: boolean; items: Item[];
  onComplete: () => void; onHelp: () => void;
}) {
  const { width } = useWindowDimensions();
  const [showPremiumInfo, setShowPremiumInfo] = useState(false);
  const choose = (action: () => void) => { onClose(); action(); };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', backgroundColor: 'rgba(21,17,43,.38)' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close account menu" onPress={onClose} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
      <View style={[{ width: Math.min(356, width * .92), height: '100%', backgroundColor: '#fff', shadowColor: '#211847', shadowOpacity: .23, shadowRadius: 25, elevation: 14 }, Platform.OS === 'web' ? { animation: 'wcm-drawer-in 220ms cubic-bezier(.2,.8,.2,1)' } as any : null]}>
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: '#eee8f7', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, overflow: 'hidden', backgroundColor: '#f5ddf4', alignItems: 'center', justifyContent: 'center' }}>{imageUrl ? <Image source={{ uri: imageUrl }} style={{ width: 48, height: 48 }} /> : <Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 22, fontWeight: '900' }}>{name.slice(0, 1).toUpperCase()}</Text>}</View>
          <View style={{ flex: 1, minWidth: 0 }}><Text numberOfLines={1} style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900', fontSize: 16 }}>{name}</Text><Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 12, marginTop: 2 }}>{role}{area ? ` · ${area}` : ''}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close account menu" onPress={onClose} style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4effc' }}><Text style={{ color: color.purple, fontSize: 23, lineHeight: 27 }}>×</Text></Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 17, paddingBottom: 28 }}>
          <View style={{ gap: 3, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee8f7' }}>
            {items.map(item => <Pressable key={item.label} accessibilityRole="button" accessibilityState={{ selected: !!item.active }} onPress={() => choose(item.onPress)} style={({ pressed }) => ({ minHeight: 47, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, paddingHorizontal: 12, backgroundColor: item.active ? '#f1e9ff' : pressed ? '#f8f3ff' : '#fff' })}>
              <Text style={{ width: 22, color: item.active ? color.purple : '#676180', fontSize: 17, textAlign: 'center' }}>{item.icon}</Text>
              <Text style={{ flex: 1, color: item.active ? color.purple : color.ink, fontFamily: 'Nunito', fontWeight: item.active ? '900' : '800', fontSize: 14 }}>{item.label}</Text>
              {!!item.badge && <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: color.coral, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontFamily: 'Nunito', fontWeight: '900', fontSize: 11 }}>{item.badge > 99 ? '99+' : item.badge}</Text></View>}
              {item.active && <Text style={{ color: color.purple, fontSize: 15 }}>✓</Text>}
            </Pressable>)}
          </View>
          {!premium && <View style={{ marginTop: 19, padding: 16, borderRadius: 17, backgroundColor: '#f4eeff', borderWidth: 1, borderColor: '#e4d6ff' }}>
            <Text style={{ color: color.purple, fontSize: 22 }}>♛</Text>
            <Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900', fontSize: 15, marginTop: 4 }}>Upgrade to Premium</Text>
            <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 12, lineHeight: 18, marginTop: 4 }}>Explore exclusive profile frames and more ways to stand out.</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Learn about Premium" onPress={() => setShowPremiumInfo(value => !value)} style={{ marginTop: 12, minHeight: 38, borderRadius: 11, backgroundColor: color.purple, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontFamily: 'Nunito', fontWeight: '900', fontSize: 12 }}>Learn about Premium →</Text></Pressable>
            {showPremiumInfo && <Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 12, lineHeight: 18, marginTop: 11 }}>Premium access is currently enabled by the WhyChoozeMe team. Contact us to ask about upgrading.</Text>}
          </View>}
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile completion in My space" onPress={() => choose(onComplete)} style={{ marginTop: 12, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e3daf5', backgroundColor: '#fff' }}>
            <Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900', fontSize: 13 }}>{completion === 100 ? 'Your profile is complete' : `Your profile is ${completion}% complete`}</Text>
            <View style={{ height: 7, borderRadius: 4, backgroundColor: '#eee8fa', overflow: 'hidden', marginTop: 10 }}><View style={{ width: `${completion}%`, height: 7, borderRadius: 4, backgroundColor: color.purple }} /></View>
            <Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 12, fontWeight: '900', marginTop: 9 }}>{completion === 100 ? 'View My space →' : 'Complete profile →'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => choose(onHelp)} style={{ minHeight: 45, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, marginTop: 18, borderTopWidth: 1, borderTopColor: '#eee8f7' }}><Text style={{ color: color.purple, fontSize: 16 }}>ⓘ</Text><Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '800', fontSize: 13 }}>Help & support</Text><Text style={{ color: color.muted, marginLeft: 'auto' }}>›</Text></Pressable>
        </ScrollView>
      </View>
    </View>
  </Modal>;
}
