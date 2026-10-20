import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { ChatMessage, Freelancer } from './data';
import { ChatIcon, CloseIcon, TabIcon } from './icons';
import { ChatInboxEntry } from './chatInbox';
import { color, Portrait } from './UI';
import { publicWhatsapp } from './whatsapp';

type Props = {
  viewerId: string;
  compact: boolean;
  people: Freelancer[];
  selected: Freelancer | null;
  messages: ChatMessage[];
  inbox: Record<string, ChatInboxEntry>;
  unreadTotal: number;
  draft: string;
  role: 'visitor' | 'finder' | 'freelancer';
  messageKey: (person: Freelancer) => string;
  onSelect: (person: Freelancer) => void;
  onBack: () => void;
  onClose: () => void;
  onHome: () => void;
  onAccount: () => void;
  onRequests: () => void;
  onWhatsappSetup?: () => void;
  onDraft: (value: string) => void;
  onSend: () => void;
  onAttach: () => void;
  attaching: boolean;
};

const font = 'Nunito' as const;
const timeLabel = (time: number) => time ? new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
const dayKey = (time: number) => new Date(time).toDateString();
function dayLabel(time: number) {
  const date = new Date(time);
  const today = new Date();
  if (dayKey(time) === today.toDateString()) return 'Today';
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (dayKey(time) === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function RailButton({ label, active, onPress, children, badge }: { label: string; active?: boolean; onPress: () => void; children: React.ReactNode; badge?: number }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? '#eee4ff' : 'transparent' }}>
    {children}
    {!!badge && <View style={{ position: 'absolute', top: 2, right: 0, minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 3, backgroundColor: color.coral, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontFamily: font, fontSize: 10, fontWeight: '900' }}>{badge > 99 ? '99+' : badge}</Text></View>}
  </Pressable>;
}

export default function ChatWorkspace({ viewerId, compact, people, selected, messages, inbox, unreadTotal, draft, role, messageKey, onSelect, onBack, onClose, onHome, onAccount, onRequests, onWhatsappSetup, onDraft, onSend, onAttach, attaching }: Props) {
  const { height } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const threadScroll = useRef<ScrollView>(null);
  const ownSide = role === 'freelancer' ? 'freelancer' : 'finder';
  const conversation = selected ? messages.filter(message => message.freelancerId === messageKey(selected)) : [];
  const whatsapp = selected ? publicWhatsapp(selected.links, selected.publicWhatsappUrl) : null;
  const filteredPeople = useMemo(() => people.filter(person => {
    const matches = !search.trim() || `${person.name} ${person.role}`.toLowerCase().includes(search.trim().toLowerCase());
    return matches && (!onlyUnread || (inbox[person.id]?.unread || 0) > 0);
  }), [people, search, onlyUnread, inbox]);
  useEffect(() => { threadScroll.current?.scrollToEnd({ animated: false }); }, [selected?.id, conversation.length]);

  const rail = <View style={{ flexDirection: compact ? 'row' : 'column', alignItems: 'center', justifyContent: compact ? 'space-around' : 'flex-start', gap: compact ? 4 : 11, paddingVertical: compact ? 5 : 18, paddingHorizontal: compact ? 8 : 10, backgroundColor: '#f8f3ff', borderRightWidth: compact ? 0 : 1, borderBottomWidth: compact ? 1 : 0, borderColor: '#e8def6' }}>
    <RailButton label="Home" onPress={onHome}><TabIcon name="people" color={color.muted} size={22} /></RailButton>
    <RailButton label="Chats" active onPress={onBack} badge={unreadTotal}><ChatIcon color={color.purple} size={23} /></RailButton>
    <RailButton label="Browse requirements" onPress={onRequests}><Text style={{ color: color.muted, fontSize: 24 }}>▤</Text></RailButton>
    <RailButton label="Your account" onPress={onAccount}><TabIcon name="profile" color={color.muted} size={22} /></RailButton>
  </View>;

  const chatList = <View style={{ width: compact ? '100%' : 350, flex: compact ? 1 : undefined, minHeight: 0, backgroundColor: '#fff', borderRightWidth: compact ? 0 : 1, borderRightColor: '#eee9f2' }}>
    <View style={{ paddingHorizontal: 18, paddingTop: 18, paddingBottom: 13, gap: 13 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: color.ink, fontFamily: font, fontSize: 25, fontWeight: '900' }}>Messages</Text><Pressable accessibilityRole="button" accessibilityLabel="Leave chats" onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#f6f1fb', alignItems: 'center', justifyContent: 'center' }}><CloseIcon color={color.muted} size={16} /></Pressable></View>
      <TextInput accessibilityLabel="Search conversations" placeholder="Search conversations" placeholderTextColor="#9994a8" value={search} onChangeText={setSearch} style={{ minHeight: 43, backgroundColor: '#f7f5fa', color: color.ink, borderRadius: 14, paddingHorizontal: 15, fontFamily: font, fontSize: 14 }} />
      <View style={{ flexDirection: 'row', gap: 7 }}><Pressable accessibilityRole="button" accessibilityState={{ selected: !onlyUnread }} onPress={() => setOnlyUnread(false)} style={{ borderRadius: 17, paddingHorizontal: 15, paddingVertical: 7, backgroundColor: onlyUnread ? '#f7f3fb' : '#ede3ff' }}><Text style={{ color: onlyUnread ? color.muted : color.purple, fontFamily: font, fontSize: 12, fontWeight: '900' }}>All</Text></Pressable><Pressable accessibilityRole="button" accessibilityState={{ selected: onlyUnread }} onPress={() => setOnlyUnread(true)} style={{ borderRadius: 17, paddingHorizontal: 15, paddingVertical: 7, backgroundColor: onlyUnread ? '#ede3ff' : '#f7f3fb' }}><Text style={{ color: onlyUnread ? color.purple : color.muted, fontFamily: font, fontSize: 12, fontWeight: '900' }}>Unread {unreadTotal ? `(${unreadTotal})` : ''}</Text></Pressable></View>
    </View>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 9, paddingBottom: 18 }}>
      {filteredPeople.length ? filteredPeople.map(person => { const entry = inbox[person.id]; const isSelected = selected?.id === person.id; return <Pressable key={person.id} accessibilityRole="button" accessibilityLabel={`Open chat with ${person.name}${entry?.unread ? `, ${entry.unread} unread messages` : ''}`} onPress={() => onSelect(person)} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 74, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 15, backgroundColor: isSelected ? '#f3edff' : entry?.unread ? '#fff3f1' : '#fff', borderLeftWidth: entry?.unread ? 3 : 0, borderLeftColor: color.coral }}>
        <View style={{ width: 49 }}><Portrait index={person.image} imageUrl={person.imageUrl} name={person.name} height={49} radius={25} /></View>
        <View style={{ flex: 1, minWidth: 0 }}><Text numberOfLines={1} style={{ color: color.ink, fontFamily: font, fontSize: 15, fontWeight: entry?.unread ? '900' : '800' }}>{person.name}</Text><Text numberOfLines={1} style={{ color: entry?.unread ? color.ink : color.muted, fontFamily: font, fontSize: 12, marginTop: 3 }}>{entry?.lastBody ? `${entry.lastSenderId === viewerId ? 'You: ' : ''}${entry.lastBody}` : 'Start a conversation'}</Text></View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}><Text style={{ color: entry?.unread ? color.purple : '#9995a9', fontFamily: font, fontSize: 10 }}>{timeLabel(entry?.lastAt || 0)}</Text>{!!entry?.unread && <View style={{ minWidth: 21, height: 21, borderRadius: 11, paddingHorizontal: 5, backgroundColor: color.coral, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontFamily: font, fontWeight: '900', fontSize: 11 }}>{entry.unread > 99 ? '99+' : entry.unread}</Text></View>}</View>
      </Pressable>; }) : <Text style={{ color: color.muted, fontFamily: font, padding: 18, textAlign: 'center' }}>{onlyUnread ? 'You’re all caught up.' : search ? 'No conversations match that search.' : 'Your conversations will appear here.'}</Text>}
    </ScrollView>
    {!!onWhatsappSetup && <Pressable accessibilityRole="button" onPress={onWhatsappSetup} style={{ margin: 12, padding: 13, borderRadius: 15, backgroundColor: '#ecfbf2', borderWidth: 1, borderColor: '#c9eed8' }}><Text style={{ color: '#087a4c', fontFamily: font, fontSize: 12, fontWeight: '900' }}>Add your public WhatsApp number ↗</Text><Text style={{ color: '#3d755a', fontFamily: font, fontSize: 11, marginTop: 3 }}>Give clients another way to reach you.</Text></Pressable>}
  </View>;

  const chatPanel = <View style={{ flex: 1, minHeight: 0, backgroundColor: '#f8f6fb' }}>
    {selected ? <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 68, paddingHorizontal: compact ? 13 : 21, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ede8f2' }}>
        {compact && <Pressable accessibilityRole="button" accessibilityLabel="Back to inbox" onPress={onBack} style={{ paddingRight: 5 }}><Text style={{ color: color.purple, fontSize: 27 }}>‹</Text></Pressable>}
        <View style={{ width: 42 }}><Portrait index={selected.image} imageUrl={selected.imageUrl} name={selected.name} height={42} radius={21} /></View>
        <View style={{ flex: 1, minWidth: 0 }}><Text numberOfLines={1} style={{ color: color.ink, fontFamily: font, fontSize: 16, fontWeight: '900' }}>{selected.name}</Text><Text numberOfLines={1} style={{ color: color.muted, fontFamily: font, fontSize: 11 }}>{selected.role} · {selected.place}</Text></View>
        {!!whatsapp && <Pressable accessibilityRole="link" accessibilityLabel={`Open ${selected.name}'s WhatsApp`} onPress={() => void Linking.openURL(whatsapp)} style={{ backgroundColor: '#e7f9ef', borderRadius: 17, paddingHorizontal: 12, paddingVertical: 9 }}><Text style={{ color: '#087a4c', fontFamily: font, fontSize: 12, fontWeight: '900' }}>WhatsApp ↗</Text></Pressable>}
      </View>
      <ScrollView ref={threadScroll} style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: compact ? 15 : 31, paddingVertical: 22, gap: 9 }} onContentSizeChange={() => threadScroll.current?.scrollToEnd({ animated: false })}>
        {conversation.length ? conversation.map((message, index) => { const mine = message.from === ownSide; const firstOfDay = !index || dayKey(conversation[index - 1].time) !== dayKey(message.time); return <React.Fragment key={message.id}>{firstOfDay && <View style={{ alignSelf: 'center', backgroundColor: '#eee8f7', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 5, marginVertical: 7 }}><Text style={{ color: '#665c7a', fontFamily: font, fontSize: 11, fontWeight: '900' }}>{dayLabel(message.time)}</Text></View>}<View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: compact ? '88%' : '72%', minWidth: 95, borderRadius: 16, borderBottomRightRadius: mine ? 5 : 16, borderBottomLeftRadius: mine ? 16 : 5, backgroundColor: mine ? '#e6dbff' : '#fff', borderWidth: 1, borderColor: mine ? '#dccbff' : '#eee9f2', paddingHorizontal: 13, paddingVertical: 9 }}>
          {message.attachment ? <Pressable accessibilityRole="link" accessibilityLabel={`Open ${message.attachment.fileName}`} onPress={() => void Linking.openURL(message.attachment!.url)} style={{ gap: 7 }}>
            {message.attachment.mimeType.startsWith('image/') && <Image source={{ uri: message.attachment.url }} resizeMode="cover" style={{ width: compact ? 210 : 260, height: compact ? 150 : 185, borderRadius: 10 }} />}
            <Text style={{ color: color.purple, fontFamily: font, fontWeight: '900', fontSize: 13 }}>{message.attachment.mimeType === 'application/pdf' ? '📄' : '🖼️'} {message.attachment.fileName} ↗</Text>
            <Text style={{ color: color.muted, fontFamily: font, fontSize: 10 }}>{(message.attachment.sizeBytes / 1024 / 1024).toFixed(1)} MB · Private to this chat</Text>
          </Pressable> : <Text style={{ color: color.ink, fontFamily: font, fontSize: 14, lineHeight: 20 }}>{message.body}</Text>}
          <Text style={{ color: '#847e98', fontFamily: font, fontSize: 10, textAlign: 'right', marginTop: 4 }}>{timeLabel(message.time)}</Text></View></React.Fragment>; }) : <View style={{ alignSelf: 'center', maxWidth: 330, padding: 19, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee9f2' }}><Text style={{ color: color.ink, fontFamily: font, fontSize: 16, fontWeight: '900', textAlign: 'center' }}>Start a conversation with {selected.name.split(' ')[0]}</Text><Text style={{ color: color.muted, fontFamily: font, fontSize: 12, textAlign: 'center', marginTop: 5 }}>Say hello and discuss what you need.</Text></View>}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#ede8f2' }}><Pressable accessibilityRole="button" accessibilityLabel="Attach PDF or image" disabled={attaching} onPress={onAttach} style={{ width: 43, height: 43, borderRadius: 22, backgroundColor: '#f3edff', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: color.purple, fontSize: 23 }}>{attaching ? '…' : '+'}</Text></Pressable><TextInput accessibilityLabel="Write a message" value={draft} onChangeText={onDraft} onSubmitEditing={onSend} placeholder="Type a message" placeholderTextColor="#9693ab" style={{ flex: 1, minHeight: 46, maxHeight: 120, borderRadius: 23, paddingHorizontal: 17, paddingVertical: 10, backgroundColor: '#f7f5fa', fontFamily: font, color: color.ink, fontSize: 14 }} /><Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={!draft.trim()} onPress={onSend} style={{ minWidth: 67, height: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: draft.trim() ? color.purple : '#d9d3e3' }}><Text style={{ color: '#fff', fontFamily: font, fontSize: 13, fontWeight: '900' }}>Send</Text></Pressable></View>
    </> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}><View style={{ width: 68, height: 68, borderRadius: 24, backgroundColor: '#eee4ff', alignItems: 'center', justifyContent: 'center' }}><ChatIcon color={color.purple} size={32} /></View><Text style={{ color: color.ink, fontFamily: font, fontSize: 24, fontWeight: '900', marginTop: 17 }}>Your conversations</Text><Text style={{ color: color.muted, fontFamily: font, fontSize: 14, textAlign: 'center', marginTop: 5 }}>Choose a chat on the left to start talking.</Text></View>}
  </View>;

  return <View style={{ width: '100%', maxWidth: 1540, alignSelf: 'center', paddingHorizontal: compact ? 8 : 24, paddingTop: compact ? 10 : 22, paddingBottom: compact ? 15 : 30 }}>
    <View style={{ flexDirection: compact ? 'column' : 'row', height: compact ? Math.max(540, height - 40) : Math.max(580, height - 80), borderRadius: 20, borderWidth: 1, borderColor: '#e8e0ef', overflow: 'hidden', backgroundColor: '#fff', shadowColor: '#473760', shadowOpacity: .08, shadowRadius: 18 }}>
      {rail}
      {(!compact || !selected) && chatList}
      {(!compact || selected) && chatPanel}
    </View>
  </View>;
}
