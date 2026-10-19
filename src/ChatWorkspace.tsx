import React from 'react';
import { Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ChatMessage, Freelancer } from './data';
import { ChatIcon, CloseIcon } from './icons';
import { Button, color, Heading, Portrait } from './UI';
import { publicWhatsapp } from './whatsapp';

type Props = {
  compact: boolean;
  people: Freelancer[];
  selected: Freelancer | null;
  messages: ChatMessage[];
  draft: string;
  role: 'visitor' | 'finder' | 'freelancer';
  messageKey: (person: Freelancer) => string;
  onSelect: (person: Freelancer) => void;
  onBack: () => void;
  onClose: () => void;
  onDraft: (value: string) => void;
  onSend: () => void;
};

export default function ChatWorkspace({ compact, people, selected, messages, draft, role, messageKey, onSelect, onBack, onClose, onDraft, onSend }: Props) {
  const ownSide = role === 'freelancer' ? 'freelancer' : 'finder';
  const conversation = selected ? messages.filter(message => message.freelancerId === messageKey(selected)) : [];
  return <View style={{ width: '100%', maxWidth: 1160, alignSelf: 'center', paddingHorizontal: compact ? 14 : 24, paddingTop: 24, paddingBottom: 50 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 5 }}><ChatIcon color={color.purple} size={29} /><Heading size={compact ? 27 : 32}>Chats</Heading><Pressable accessibilityRole="button" accessibilityLabel="Close chats" onPress={onClose} style={{ marginLeft: 'auto', width: 42, height: 42, borderRadius: 21, backgroundColor: '#f1e8ff', borderWidth: 1, borderColor: '#e6d8fb', alignItems: 'center', justifyContent: 'center' }}><CloseIcon color={color.ink} size={20} /></Pressable></View>
    <Text style={{ fontFamily: 'Nunito', fontSize: 14, color: color.muted, marginBottom: 19 }}>Message each other directly. Arrange any work and payment between yourselves, outside WhyChoozeMe.</Text>
    <View style={{ flexDirection: compact ? 'column' : 'row', minHeight: compact ? 450 : 550, borderWidth: 1, borderColor: color.line, borderRadius: 23, backgroundColor: '#fff', overflow: 'hidden' }}>
      {(!compact || !selected) && <View style={{ width: compact ? '100%' : 318, borderRightWidth: compact ? 0 : 1, borderRightColor: color.line }}>
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: color.line }}><Text style={{ fontFamily: 'Nunito', fontWeight: '900', color: color.ink, fontSize: 17 }}>Inbox <Text style={{ color: color.purple }}>({people.length})</Text></Text></View>
        {people.map(person => { const last = messages.filter(message => message.freelancerId === messageKey(person)).at(-1); return <Pressable key={person.id} accessibilityRole="button" accessibilityLabel={`Open chat with ${person.name}`} onPress={() => onSelect(person)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, minHeight: 77, backgroundColor: selected?.id === person.id ? '#f6efff' : '#fff', borderBottomWidth: 1, borderBottomColor: '#f5f1f6' }}><View style={{ width: 48 }}><Portrait index={person.image} imageUrl={person.imageUrl} name={person.name} height={48} radius={24} /></View><View style={{ flex: 1 }}><Text style={{ fontFamily: 'Nunito', color: color.ink, fontSize: 15, fontWeight: '900' }}>{person.name}</Text><Text numberOfLines={1} style={{ fontFamily: 'Nunito', color: color.muted, fontSize: 12, marginTop: 3 }}>{last?.body || 'Start a conversation'}</Text></View><Text style={{ color: color.purple, fontSize: 17 }}>›</Text></Pressable>; })}
      </View>}
      {(!compact || selected) && <View style={{ flex: 1, minHeight: 480 }}>
        {selected ? <><View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 15, borderBottomWidth: 1, borderBottomColor: color.line }}>
          {compact && <Pressable accessibilityRole="button" accessibilityLabel="Back to inbox" onPress={onBack} style={{ paddingRight: 4 }}><Text style={{ color: color.purple, fontSize: 24 }}>‹</Text></Pressable>}
          <View style={{ width: 42 }}><Portrait index={selected.image} imageUrl={selected.imageUrl} name={selected.name} height={42} radius={21} /></View><View style={{flexShrink:1}}><Text numberOfLines={1} style={{ fontFamily: 'Nunito', color: color.ink, fontSize: 16, fontWeight: '900' }}>{selected.name}</Text><Text style={{ fontFamily: 'Nunito', color: color.muted, fontSize: 12 }}>{selected.role} · Goa</Text></View>{publicWhatsapp(selected.links) && <Button outline onPress={() => Linking.openURL(publicWhatsapp(selected.links)!)} style={{ marginLeft: 'auto', minHeight: 36 }} textStyle={{ fontSize: 12 }}>WhatsApp ↗</Button>}
        </View><ScrollView style={{ flex: 1, backgroundColor: '#fbf8ff' }} contentContainerStyle={{ padding: 17, minHeight: 320, justifyContent: 'flex-end' }}>
          {conversation.length ? conversation.map(message => <View key={message.id} style={{ alignSelf: message.from === ownSide ? 'flex-end' : 'flex-start', maxWidth: '82%', borderRadius: 17, backgroundColor: message.from === ownSide ? color.purple : '#fff', paddingHorizontal: 14, paddingVertical: 10, marginBottom: 9, borderWidth: message.from === ownSide ? 0 : 1, borderColor: color.line }}><Text style={{ fontFamily: 'Nunito', fontSize: 14, color: message.from === ownSide ? '#fff' : color.ink }}>{message.body}</Text></View>) : <Text style={{ fontFamily: 'Nunito', color: color.muted, textAlign: 'center', marginBottom: 120 }}>Say hello to {selected.name.split(' ')[0]}.</Text>}
        </ScrollView><View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, borderTopWidth: 1, borderTopColor: color.line }}><TextInput accessibilityLabel="Write a message" value={draft} onChangeText={onDraft} onSubmitEditing={onSend} placeholder="Write a message..." placeholderTextColor="#9693ab" style={{ flex: 1, minHeight: 44, borderWidth: 1, borderColor: color.line, borderRadius: 22, paddingHorizontal: 15, fontFamily: 'Nunito', color: color.ink }} /><Button onPress={onSend} disabled={!draft.trim()} style={{ minHeight: 44 }}>Send</Button></View></> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}><View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: '#f1e8ff', alignItems: 'center', justifyContent: 'center' }}><ChatIcon color={color.purple} size={31} /></View><Heading size={23} style={{ marginTop: 17 }}>Your conversations</Heading><Text style={{ fontFamily: 'Nunito', color: color.muted, fontSize: 14, textAlign: 'center', marginTop: 5 }}>{people.length ? 'Choose a person from the inbox to open a chat.' : 'Find a freelancer and tap Message to start.'}</Text></View>}
      </View>}
    </View>
  </View>;
}
