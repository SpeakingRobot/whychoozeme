import React, { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Category } from './data';
import { ChevronDown, InfoNavIcon } from './icons';
import { color } from './UI';

const groups = [
  { key: 'creative', label: 'Creative & media', ids: ['photography', 'video', 'design', 'writing', 'music', 'makeup'] },
  { key: 'lifestyle', label: 'Events & lifestyle', ids: ['events', 'food', 'fitness'] },
  { key: 'learning', label: 'Learning & tech', ids: ['tutoring', 'tech'] },
];

type Props = {
  categories: Category[];
  onCategory: (category: Category) => void;
  onAll: () => void;
  onMap: () => void;
  onRequests: () => void;
  onInfo?: (topic: 'about' | 'contact' | 'mission') => void;
};

const labelStyle = { color: color.ink, fontFamily: 'Nunito' as const, fontSize: 13, fontWeight: '900' as const };
const motion = Platform.OS === 'web' ? { animation: 'wcm-menu-in 190ms cubic-bezier(.2,.8,.2,1)' } as any : {};
const hoverMotion = Platform.OS === 'web' ? { transition: 'background-color 150ms ease, color 150ms ease, transform 150ms ease', cursor: 'pointer' } as any : {};

function CategoryButton({ category, onPress }: { category: Category; onPress: () => void }) {
  const [hovered, setHovered] = useState(false);
  return <Pressable accessibilityRole="button" onPress={onPress} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 42, paddingHorizontal: 13, borderRadius: 11, backgroundColor: pressed ? '#e9dcff' : hovered ? '#f3edff' : 'transparent', transform: [{ translateX: hovered ? 3 : 0 }], ...hoverMotion })}>
    <Text style={{ width: 24, fontSize: 17, lineHeight: 23, textAlign: 'center' }}>{category.icon}</Text>
    <Text style={[labelStyle, { color: hovered ? color.purple : color.ink }]}>{category.label}</Text>
  </Pressable>;
}

function NavTrigger({ label, open, onPress }: { label: string; open: boolean; onPress: () => void }) {
  const [hovered, setHovered] = useState(false);
  const active = open || hovered;
  return <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onPress} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={{ minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 11, borderRadius: 11, borderWidth: 1, borderColor: active ? '#d9c5ff' : 'transparent', backgroundColor: active ? '#f8f3ff' : 'transparent', transform: [{ translateY: hovered ? -1 : 0 }, { scale: hovered ? 1.012 : 1 }], ...(Platform.OS === 'web' ? { backgroundImage: active ? 'linear-gradient(125deg, rgba(247,239,255,.96), rgba(255,249,252,.96))' : 'none', boxShadow: hovered ? '0 3px 7px rgba(113,58,240,.08)' : 'none', transition: 'transform 210ms cubic-bezier(.2,.85,.2,1), border-color 210ms ease, background-color 210ms ease, box-shadow 210ms ease', cursor: 'pointer' } as any : {}) }}><Text style={[labelStyle, { color: active ? color.purple : color.ink }]}>{label}</Text><View style={{ transform: [{ translateY: hovered && !open ? 1 : 0 }] }}><ChevronDown size={14} color={active ? color.purple : color.muted} open={open} /></View></Pressable>;
}

function BrowseButton({ label, onPress }: { label: string; onPress: () => void }) {
  const [hovered, setHovered] = useState(false);
  return <Pressable accessibilityRole="button" onPress={onPress} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={({ pressed }) => ({ minHeight: 42, justifyContent: 'center', paddingHorizontal: 13, borderRadius: 11, backgroundColor: pressed ? '#e9dcff' : hovered ? '#f3edff' : 'transparent', transform: [{ translateX: hovered ? 3 : 0 }], ...hoverMotion })}><Text style={[labelStyle, { color: hovered ? color.purple : color.ink }]}>{label}</Text></Pressable>;
}

export function DesktopCategoryNavigation({ categories, onCategory, onAll, onMap, onRequests }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const items = [...groups, { key: 'all', label: 'All skills', ids: categories.filter(item => item.id !== 'all').map(item => item.id) }];
  return <View style={{ borderTopWidth: 1, borderTopColor: '#f3eff0', borderBottomWidth: 1, borderBottomColor: '#f3eff0', backgroundColor: '#fff', zIndex: 20 }}>
    <View style={{ maxWidth: 1000, width: '100%', alignSelf: 'center', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22, minHeight: 52 }}>
      {items.map(group => {
        const choices = group.ids.map(id => categories.find(item => item.id === id)).filter((item): item is Category => !!item);
        if (!choices.length) return null;
        return <View key={group.key} style={{ position: 'relative', zIndex: open === group.key ? 30 : 1 }}>
          <NavTrigger label={group.label} open={open === group.key} onPress={() => setOpen(open === group.key ? null : group.key)} />
          {open === group.key && <View style={{ position: 'absolute', top: 51, left: 0, width: 250, maxHeight: 370, backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, borderRadius: 16, padding: 7, shadowColor: '#211847', shadowOpacity: .18, shadowRadius: 15, elevation: 8, ...motion }}><ScrollView>{choices.map(item => <CategoryButton key={item.id} category={item} onPress={() => { setOpen(null); onCategory(item); }} />)}</ScrollView></View>}
        </View>;
      })}
      <View style={{ position: 'relative', zIndex: open === 'browse' ? 30 : 1 }}><NavTrigger label="Browse" open={open === 'browse'} onPress={() => setOpen(open === 'browse' ? null : 'browse')} />
        {open === 'browse' && <View style={{ position: 'absolute', top: 51, right: 0, width: 230, backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, borderRadius: 16, padding: 7, shadowColor: '#211847', shadowOpacity: .18, shadowRadius: 15, elevation: 8, ...motion }}>{[['All creatives', onAll], ['Explore map', onMap], ['Browse requirements', onRequests]].map(([name, action]) => <BrowseButton key={name as string} label={name as string} onPress={() => { setOpen(null); (action as () => void)(); }} />)}</View>}
      </View>
    </View>
  </View>;
}

export function MobileCategoryNavigation({ visible, onClose, categories, onCategory, onAll, onMap, onRequests, onInfo }: Props & { visible: boolean; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const assigned = new Set(groups.flatMap(group => group.ids));
  const sections = [...groups, { key: 'more', label: 'More skills', ids: categories.filter(item => item.id !== 'all' && !assigned.has(item.id)).map(item => item.id) }];
  const choose = (action: () => void) => { onClose(); action(); };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: 'rgba(15,13,43,.44)' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={onClose} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      <View style={{ width: Math.min(380, width * .88), height: '100%', backgroundColor: '#fffaf7', paddingTop: 18, paddingHorizontal: 17, shadowColor: '#211847', shadowOpacity: .2, shadowRadius: 18, elevation: 9 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}><Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 23, fontWeight: '900' }}>Explore</Text><Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={onClose} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#f0e8ff', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: color.purple, fontSize: 24 }}>×</Text></Pressable></View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {onInfo && <View style={{ marginBottom: 13, gap: 3 }}>{([['about', 'Who are we?'], ['contact', 'Contact us'], ['mission', 'Our mission']] as const).map(([topic, label]) => <Pressable key={topic} accessibilityRole="button" onPress={() => onInfo(topic)} style={{ minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 12, borderRadius: 11 }}><InfoNavIcon name={topic} size={18} color={color.purple} /><Text style={[labelStyle, { fontSize: 14 }]}>{label}</Text></Pressable>)}</View>}
          {[['All creatives', onAll], ['Explore map', onMap], ['Browse requirements', onRequests]].map(([name, action]) => <Pressable key={name as string} accessibilityRole="button" onPress={() => choose(action as () => void)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 13, borderRadius: 12, backgroundColor: '#f4ecff', marginBottom: 6 }}><Text style={[labelStyle, { color: color.purple, fontSize: 14 }]}>{name as string} →</Text></Pressable>)}
          {sections.map(section => {
            const choices = section.ids.map(id => categories.find(item => item.id === id)).filter((item): item is Category => !!item);
            if (!choices.length) return null;
            return <View key={section.key} style={{ marginTop: 18 }}><Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 5, marginLeft: 12 }}>{section.label.toUpperCase()}</Text>{choices.map(item => <CategoryButton key={item.id} category={item} onPress={() => choose(() => onCategory(item))} />)}</View>;
          })}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}
