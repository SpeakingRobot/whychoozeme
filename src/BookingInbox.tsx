import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { BookingRequest, readableDay } from './booking';
import { Button, color, Heading } from './UI';

type Props = {
  requests: BookingRequest[];
  replies: Record<string, string>;
  onReply: (id: string, value: string) => void;
  onDecision: (id: string, status: 'accepted' | 'declined') => void;
};

export default function BookingInbox({ requests, replies, onReply, onDecision }: Props) {
  return <View style={{ marginTop: 23 }}><Heading size={23}>Date requests <Text style={{ color: color.coral }}>✦</Text></Heading><Text style={{ fontFamily: 'Nunito', color: color.muted, fontSize: 13, marginTop: 3, marginBottom: 12 }}>Reply to project inquiries and manage your availability.</Text>
    {requests.length ? requests.slice().reverse().map(item => <View key={item.id} style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, borderRadius: 19, padding: 17, marginBottom: 10 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 7 }}><Text style={{ fontFamily: 'Nunito', fontWeight: '900', color: color.ink, fontSize: 17 }}>{item.freelancerName}</Text><Text style={{ fontFamily: 'Nunito', fontWeight: '900', color: item.status === 'accepted' ? '#21845b' : item.status === 'declined' ? color.coral : color.purple, fontSize: 12 }}>{item.status.toUpperCase()}</Text></View><Text style={{ fontFamily: 'Nunito', color: color.purple, fontWeight: '900', fontSize: 13, marginTop: 5 }}>{readableDay(item.start)}{item.end !== item.start ? ` – ${readableDay(item.end)}` : ''}</Text><Text style={{ fontFamily: 'Nunito', color: color.ink, fontSize: 13, marginTop: 8 }}>{item.note}</Text>{item.reply ? <Text style={{ fontFamily: 'Nunito', color: color.muted, fontSize: 12, marginTop: 8 }}>Your reply: {item.reply}</Text> : <><TextInput accessibilityLabel={`Reply to request for ${item.freelancerName}`} value={replies[item.id] || ''} onChangeText={value => onReply(item.id, value)} placeholder="Write a reply, for example: I'm available, or I'm busy..." placeholderTextColor="#9b97a7" multiline style={{ borderWidth: 1, borderColor: color.line, borderRadius: 13, marginTop: 12, padding: 10, minHeight: 63, fontFamily: 'Nunito', color: color.ink, textAlignVertical: 'top' }} /><View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}><Button onPress={() => onDecision(item.id, 'accepted')} style={{ minHeight: 37 }} textStyle={{ fontSize: 12 }}>Accept</Button><Button outline onPress={() => onDecision(item.id, 'declined')} style={{ minHeight: 37 }} textStyle={{ fontSize: 12 }}>Decline</Button></View></>}</View>) : <View style={{ padding: 18, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: color.line }}><Text style={{ fontFamily: 'Nunito', color: color.muted, fontSize: 13 }}>New date requests will appear here. Open your profile to mark busy days.</Text></View>}
  </View>;
}
