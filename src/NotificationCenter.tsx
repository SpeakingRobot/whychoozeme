import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { color } from './UI';

export type ActivityNotice = {
  id: string;
  kind: string;
  title: string;
  created_at: string;
  seen_at: string | null;
  related_id?: string | null;
};

type Filter = 'All' | 'Messages' | 'Activity' | 'System';
const filters: Filter[] = ['All', 'Messages', 'Activity', 'System'];
const isSystem = (item: ActivityNotice) => item.kind === 'admin_flag';
const isMessage = (item: ActivityNotice) => item.kind === 'message' || item.kind === 'inquiry';
const isToday = (value: string) => new Date(value).toDateString() === new Date().toDateString();

function NoticeRow({ item, onOpen }: { item: ActivityNotice; onOpen: (item: ActivityNotice) => void }) {
  const system = isSystem(item);
  const icon = system ? '!' : isMessage(item) ? '●' : item.kind === 'review' ? '★' : item.kind === 'profile_save' ? '♥' : item.kind === 'requirement' ? '✦' : '●';
  const accent = system ? '#c94b66' : item.kind === 'review' ? '#8349ed' : '#18a87a';
  const time = new Date(item.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open notification: ${item.title}`} onPress={() => onOpen(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 9, backgroundColor: system && !item.seen_at ? '#fff0f3' : item.seen_at ? '#fff' : '#f6f2ff', borderWidth: 1, borderColor: system && !item.seen_at ? '#f6d5dd' : '#ece7f5', borderRadius: 16 }}>
    <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: system ? '#ffe0e6' : '#ede5ff', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: accent, fontSize: 21, fontWeight: '900' }}>{icon}</Text></View>
    <View style={{ flex: 1 }}><Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 14, fontWeight: '900' }}>{item.title}</Text><Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 11, marginTop: 5 }}>{time}</Text></View>
    {!item.seen_at && <View accessibilityLabel="Unread" style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: accent }} />}
    <Text style={{ color: color.purple, fontSize: 19 }}>›</Text>
  </Pressable>;
}

export default function NotificationCenter({ notices, unreadChats, onOpen, onChats, onMarkAllRead }: {
  notices: ActivityNotice[];
  unreadChats: number;
  onOpen: (item: ActivityNotice) => void;
  onChats: () => void;
  onMarkAllRead: () => void;
}) {
  const [filter, setFilter] = useState<Filter>('All');
  const unread = notices.filter(item => !item.seen_at).length;
  const filtered = notices.filter(item => filter === 'All' || (filter === 'System' ? isSystem(item) : filter === 'Messages' ? isMessage(item) : !isSystem(item) && !isMessage(item)));
  const recent = filtered.filter(item => isToday(item.created_at));
  const earlier = filtered.filter(item => !isToday(item.created_at));
  return <View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 }}><Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 12 }}>{unread ? `${unread} unread update${unread === 1 ? '' : 's'}` : 'You are all caught up.'}</Text><Pressable accessibilityRole="button" disabled={!unread} onPress={onMarkAllRead}><Text style={{ color: unread ? color.purple : '#aaa3b9', fontFamily: 'Nunito', fontWeight: '900', fontSize: 12 }}>Mark all as read</Text></Pressable></View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>{filters.map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: filter === value }} onPress={() => setFilter(value)} style={{ borderRadius: 18, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: filter === value ? color.purple : '#f5f2fa' }}><Text style={{ color: filter === value ? '#fff' : color.muted, fontFamily: 'Nunito', fontWeight: '900', fontSize: 12 }}>{value}{value === 'Messages' && unreadChats ? ` (${unreadChats})` : value === 'All' && unread ? ` (${unread})` : ''}</Text></Pressable>)}</View>
    {filter === 'Messages' && <Pressable accessibilityRole="button" onPress={onChats} style={{ padding: 19, borderRadius: 16, backgroundColor: '#f5efff', borderWidth: 1, borderColor: '#e3d6fc', marginBottom: 15 }}><Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 15, fontWeight: '900' }}>Open chats →</Text><Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 12, marginTop: 4 }}>{unreadChats ? `${unreadChats} unread message${unreadChats === 1 ? '' : 's'}` : 'Your conversations are up to date.'}</Text></Pressable>}
      {!!recent.length && <><Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900', fontSize: 12, marginBottom: 9 }}>Today</Text>{recent.map(item => <NoticeRow key={item.id} item={item} onOpen={onOpen} />)}</>}
      {!!earlier.length && <><Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900', fontSize: 12, marginTop: recent.length ? 13 : 0, marginBottom: 9 }}>Earlier</Text>{earlier.map(item => <NoticeRow key={item.id} item={item} onOpen={onOpen} />)}</>}
      {!filtered.length && filter !== 'Messages' && <View style={{ padding: 25, backgroundColor: '#f8f5fc', borderRadius: 15 }}><Text style={{ color: color.muted, fontFamily: 'Nunito', textAlign: 'center' }}>No notifications here yet.</Text></View>}
  </View>;
}
