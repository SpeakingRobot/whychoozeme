import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { DateRange, inRange, isoDay, readableDay } from './booking';
import { Button, color, Heading } from './UI';

type Props = {
  name: string;
  busy: DateRange[];
  owner: boolean;
  readOnly?: boolean;
  onBlock: (range: DateRange) => void;
  onRequest: (range: DateRange, note: string) => void;
};

export default function AvailabilityCalendar({ name, busy, owner, readOnly = false, onBlock, onRequest }: Props) {
  const today = isoDay(new Date());
  const [monthOffset, setMonthOffset] = useState(0);
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const month = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1);
  const firstWeekday = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: firstWeekday + days }, (_, index) => index < firstWeekday ? null : isoDay(new Date(month.getFullYear(), month.getMonth(), index - firstWeekday + 1)));
  const selected = start ? { start, end: end || start } : null;
  const choose = (day: string) => {
    if (day < today || busy.some(range => inRange(day, range))) return;
    setError('');
    if (!start || end || day < start) { setStart(day); setEnd(null); return; }
    if (busy.some(range => range.start <= day && range.end >= start)) { setError('That range includes booked days. Choose another end date.'); return; }
    setEnd(day);
  };
  const submit = () => {
    if (!selected) { setError('Choose a date or date range first.'); return; }
    if (!owner && note.trim().length < 10) { setError('Tell the freelancer a little about your project (at least 10 characters).'); return; }
    if (owner) onBlock(selected);
    else onRequest(selected, note.trim());
    setStart(null); setEnd(null); setNote(''); setError('');
  };
  return <View style={{ width: '100%', maxWidth: 850, alignSelf: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, borderRadius: 24, padding: 22, marginTop: 19 }}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}><View><Heading size={24}>Availability <Text style={{ color: color.coral }}>✦</Text></Heading><Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 13, marginTop: 3 }}>{owner ? 'Mark days you are unavailable.' : `See when ${name} is free before sending a project request.`}</Text></View><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Pressable accessibilityRole="button" accessibilityLabel="Previous month" disabled={monthOffset === 0} onPress={() => setMonthOffset(value => value - 1)} style={{ padding: 8, opacity: monthOffset === 0 ? .35 : 1 }}><Text style={{ fontSize: 20, color: color.purple }}>‹</Text></Pressable><Text style={{ minWidth: 115, textAlign: 'center', fontFamily: 'Nunito', fontWeight: '900', color: color.ink }}>{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</Text><Pressable accessibilityRole="button" accessibilityLabel="Next month" disabled={monthOffset === 6} onPress={() => setMonthOffset(value => value + 1)} style={{ padding: 8, opacity: monthOffset === 6 ? .35 : 1 }}><Text style={{ fontSize: 20, color: color.purple }}>›</Text></Pressable></View></View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 17 }}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <Text key={day} style={{ width: '14.285%', textAlign: 'center', color: color.muted, fontFamily: 'Nunito', fontWeight: '900', fontSize: 11, paddingVertical: 5 }}>{day}</Text>)}{cells.map((day, index) => {
      if (!day) return <View key={`empty-${index}`} style={{ width: '14.285%', height: 44 }} />;
      const isBusy = busy.some(range => inRange(day, range));
      const isSelected = selected && inRange(day, selected);
      const isPast = day < today;
      return <View key={day} style={{ width: '14.285%', padding: 2 }}><Pressable accessibilityRole="button" accessibilityLabel={`${readableDay(day)}${isBusy ? ', busy' : isPast ? ', past' : ', available'}`} disabled={isPast || isBusy} onPress={() => choose(day)} style={{ height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: isSelected ? color.purple : isBusy ? '#ffe7e6' : '#f8f5fc' }}><Text style={{ fontFamily: 'Nunito', fontWeight: '900', fontSize: 13, color: isSelected ? '#fff' : isBusy ? '#b94e54' : isPast ? '#b4afbb' : color.ink }}>{day.slice(-2).replace(/^0/, '')}</Text></Pressable></View>;
    })}</View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 13, marginTop: 13 }}>{[['#ffe7e6', 'Booked / busy'], ['#f8f5fc', 'Available'], [color.purple, 'Selected']].map(([backgroundColor, title]) => <View key={title} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 11, height: 11, borderRadius: 4, backgroundColor }} /><Text style={{ fontFamily: 'Nunito', color: color.muted, fontSize: 11 }}>{title}</Text></View>)}</View>
    <Text style={{ fontFamily: 'Nunito', color: color.ink, marginTop: 17, fontWeight: '900', fontSize: 13 }}>{selected ? `${readableDay(selected.start)}${selected.end !== selected.start ? ` – ${readableDay(selected.end)}` : ''}` : 'Tap a start date, then an end date.'}</Text>
    {!owner && !readOnly && <TextInput accessibilityLabel="Project details" value={note} onChangeText={setNote} placeholder="Tell them about your project and timing..." placeholderTextColor="#9693ab" multiline style={{ marginTop: 10, minHeight: 77, borderWidth: 1, borderColor: color.line, borderRadius: 14, padding: 12, fontFamily: 'Nunito', color: color.ink, textAlignVertical: 'top' }} />}
    {!!error && <Text style={{ fontFamily: 'Nunito', color: color.coral, fontSize: 12, marginTop: 9 }}>{error}</Text>}
    {!readOnly && <Button onPress={submit} style={{ alignSelf: 'flex-start', marginTop: 13 }}>{owner ? 'Mark as busy' : 'Request these dates'}</Button>}
    <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 11, marginTop: 8 }}>{readOnly ? 'Availability is indicative. Confirm dates in an inquiry and approved chat.' : 'Walkthrough availability is saved on this device.'}</Text>
  </View>;
}
