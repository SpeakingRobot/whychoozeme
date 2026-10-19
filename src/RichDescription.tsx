import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { color } from './UI';
import { DESCRIPTION_LIMIT, DescriptionFormat, formatDescription, insertDescriptionText, parseDescriptionLine } from './descriptionFormatting';

const emojis = ['✨', '🎨', '📸', '🎥', '🎵', '💡', '🚀', '🤝', '💻', '📍', '✅', '💜', '🌿', '🎉', '⭐', '📚'];

export function DescriptionPreview({ value, fontSize = 16 }: { value: string; fontSize?: number }) {
  const lines = value.trim().split('\n');
  return <View style={{ gap: 5 }}>{lines.map((line, index) => {
    const bullet = /^\s*•\s*/.test(line);
    const numbered = /^\s*(\d+)\.\s+/.exec(line);
    const heading = /^##\s+/.test(line);
    const content = heading ? line.replace(/^##\s+/, '') : bullet ? line.replace(/^\s*•\s*/, '') : numbered ? line.replace(/^\s*\d+\.\s+/, '') : line;
    return <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: bullet || numbered ? 9 : 0 }}>
      {(bullet || numbered) && <Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize, lineHeight: fontSize * 1.6, fontWeight: '900' }}>{bullet ? '•' : `${numbered![1]}.`}</Text>}
      <Text style={{ flex: 1, color: color.ink, fontFamily: 'Nunito', fontSize: heading ? fontSize + 2 : fontSize, fontWeight: heading ? '900' : '400', lineHeight: fontSize * 1.6 }}>
        {parseDescriptionLine(content).map((part, position) => <Text key={position} style={part.style === 'bold' ? { fontWeight: '900' } : part.style === 'italic' ? { fontStyle: 'italic' } : part.style === 'underline' ? { textDecorationLine: 'underline' } : undefined}>{part.text}</Text>)}
      </Text>
    </View>;
  })}</View>;
}

export default function RichDescriptionEditor({ value, onChange, maxLength = DESCRIPTION_LIMIT, placeholder = 'Describe your experience, services, process and the work you love doing', accessibilityLabel = 'Description' }: { value: string; onChange: (value: string) => void; maxLength?: number; placeholder?: string; accessibilityLabel?: string }) {
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [preview, setPreview] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const tools: { format: DescriptionFormat; label: string; symbol: string }[] = [
    { format: 'bold', label: 'Bold', symbol: 'B' }, { format: 'italic', label: 'Italic', symbol: 'I' },
    { format: 'underline', label: 'Underline', symbol: 'U̲' }, { format: 'bullet', label: 'Bullet list', symbol: '• List' },
    { format: 'numbered', label: 'Numbered list', symbol: '1. List' }, { format: 'heading', label: 'Heading', symbol: 'H2' },
  ];
  const apply = (format: DescriptionFormat, range = selection) => {
    const next = formatDescription(value, range.start, range.end, format);
    if (next.value.length > maxLength) return;
    onChange(next.value); setSelection(next.selection); setPreview(false);
  };
  const insertEmoji = (emoji: string) => {
    const next = insertDescriptionText(value, selection.start, selection.end, emoji);
    if (next.value.length > maxLength) return;
    onChange(next.value); setSelection(next.selection); setPreview(false);
  };
  const onWebKeyDown = (event: KeyboardEvent) => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const format = ({ b: 'bold', i: 'italic', u: 'underline' } as const)[event.key.toLowerCase() as 'b' | 'i' | 'u'];
    if (!format) return;
    event.preventDefault();
    const field = event.currentTarget as HTMLTextAreaElement;
    apply(format, { start: field.selectionStart, end: field.selectionEnd });
  };
  useEffect(() => {
    if (Platform.OS !== 'web' || preview) return;
    const node = inputRef.current as unknown as HTMLTextAreaElement | null;
    if (!node?.addEventListener) return;
    node.addEventListener('keydown', onWebKeyDown, true);
    return () => node.removeEventListener('keydown', onWebKeyDown, true);
  });
  return <View style={{ borderWidth: 1, borderColor: '#e6dafa', borderRadius: 18, backgroundColor: '#fff', padding: 12 }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
      {tools.map(tool => <Pressable key={tool.format} accessibilityRole="button" accessibilityLabel={tool.label} onPress={() => apply(tool.format)} style={{ minWidth: 36, paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderColor: '#e9dff5', borderRadius: 10, backgroundColor: '#faf7ff', alignItems: 'center' }}><Text style={{ color: color.purple, fontFamily: 'Nunito', fontWeight: tool.format === 'bold' ? '900' : '800', fontStyle: tool.format === 'italic' ? 'italic' : 'normal', fontSize: 13 }}>{tool.symbol}</Text></Pressable>)}
      <Pressable accessibilityRole="button" accessibilityLabel="Choose an emoji" onPress={() => setShowEmojis(current => !current)} style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: showEmojis ? '#eadcff' : '#faf7ff', borderWidth: 1, borderColor: '#e9dff5' }}><Text style={{ fontSize: 14 }}>😊 Emoji</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => setPreview(current => !current)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: preview ? color.purple : '#f2eaff' }}><Text style={{ color: preview ? '#fff' : color.purple, fontFamily: 'Nunito', fontWeight: '900', fontSize: 12 }}>{preview ? 'Edit' : 'Preview'}</Text></Pressable>
    </View>
    {showEmojis && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, backgroundColor: '#faf7ff', borderRadius: 12, padding: 8, marginBottom: 10 }}>{emojis.map(emoji => <Pressable key={emoji} accessibilityRole="button" accessibilityLabel={`Insert ${emoji}`} onPress={() => insertEmoji(emoji)} style={{ width: 33, height: 33, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: '#fff' }}><Text style={{ fontSize: 20 }}>{emoji}</Text></Pressable>)}</View>}
    {preview ? <View style={{ minHeight: 145, borderWidth: 1, borderColor: '#e6dff0', borderRadius: 13, backgroundColor: '#fff', padding: 12 }}><DescriptionPreview value={value || 'Your text will appear here.'} fontSize={14} /></View> : <TextInput ref={inputRef} accessibilityLabel={accessibilityLabel} value={value} maxLength={maxLength} onChangeText={text => onChange(text.slice(0, maxLength))} onSelectionChange={event => setSelection(event.nativeEvent.selection)} selection={selection} placeholder={placeholder} placeholderTextColor="#9992a8" multiline textAlignVertical="top" style={{ minHeight: 170, borderWidth: 1, borderColor: '#e6dff0', borderRadius: 13, backgroundColor: '#fff', padding: 12, color: color.ink, fontFamily: 'Nunito', fontSize: 14 }} />}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 8 }}><Text style={{ flex: 1, color: color.muted, fontFamily: 'Nunito', fontSize: 11 }}>Select text to format. Ctrl+B, Ctrl+I and Ctrl+U work here (⌘ on Mac).</Text><Text accessibilityLabel={`${value.length} of ${maxLength} characters`} style={{ color: value.length > maxLength * .9 ? color.coral : color.muted, fontFamily: 'Nunito', fontSize: 11, fontWeight: '900' }}>{value.length}/{maxLength}</Text></View>
  </View>;
}
