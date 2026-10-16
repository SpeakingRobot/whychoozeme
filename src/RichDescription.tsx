import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { color } from './UI';
import { DescriptionFormat, formatDescription, parseDescriptionLine } from './descriptionFormatting';

export function DescriptionPreview({ value, fontSize = 16 }: { value: string; fontSize?: number }) {
  const lines = value.trim().split('\n');
  return <View style={{ gap: 5 }}>{lines.map((line, index) => {
    const bullet = /^\s*•\s*/.test(line);
    const content = bullet ? line.replace(/^\s*•\s*/, '') : line;
    return <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: bullet ? 9 : 0 }}>
      {bullet && <Text style={{ color: color.purple, fontSize, lineHeight: fontSize * 1.6 }}>•</Text>}
      <Text style={{ flex: 1, color: color.ink, fontFamily: 'Nunito', fontSize, lineHeight: fontSize * 1.6 }}>
        {parseDescriptionLine(content).map((part, position) => <Text key={position} style={part.style === 'bold' ? { fontWeight: '900' } : part.style === 'italic' ? { fontStyle: 'italic' } : part.style === 'underline' ? { textDecorationLine: 'underline' } : undefined}>{part.text}</Text>)}
      </Text>
    </View>;
  })}</View>;
}

export default function RichDescriptionEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [preview, setPreview] = useState(false);
  const tools: { format: DescriptionFormat; label: string; symbol: string }[] = [
    { format: 'bold', label: 'Bold', symbol: 'B' }, { format: 'italic', label: 'Italic', symbol: 'I' },
    { format: 'underline', label: 'Underline', symbol: 'U̲' }, { format: 'bullet', label: 'Bullet list', symbol: '• List' },
  ];
  return <View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
      {tools.map(tool => <Pressable key={tool.format} accessibilityRole="button" accessibilityLabel={tool.label} onPress={() => { const next = formatDescription(value, selection.start, selection.end, tool.format); onChange(next.value); setSelection(next.selection); setPreview(false); }} style={{ minWidth: 36, paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderColor: '#e9dff5', borderRadius: 10, backgroundColor: '#faf7ff', alignItems: 'center' }}><Text style={{ color: color.purple, fontFamily: 'Nunito', fontWeight: tool.format === 'bold' ? '900' : '800', fontStyle: tool.format === 'italic' ? 'italic' : 'normal', fontSize: 13 }}>{tool.symbol}</Text></Pressable>)}
      <Pressable accessibilityRole="button" onPress={() => setPreview(current => !current)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: preview ? color.purple : '#f2eaff' }}><Text style={{ color: preview ? '#fff' : color.purple, fontFamily: 'Nunito', fontWeight: '900', fontSize: 12 }}>{preview ? 'Edit' : 'Preview'}</Text></Pressable>
    </View>
    {preview ? <View style={{ minHeight: 125, borderWidth: 1, borderColor: '#e6dff0', borderRadius: 13, backgroundColor: '#fff', padding: 12 }}><DescriptionPreview value={value || 'Your description will appear here.'} fontSize={14} /></View> : <TextInput accessibilityLabel="Description" value={value} onChangeText={onChange} onSelectionChange={event => setSelection(event.nativeEvent.selection)} selection={selection} placeholder="Describe your experience, services, process and the work you love doing" placeholderTextColor="#9992a8" multiline textAlignVertical="top" style={{ minHeight: 125, borderWidth: 1, borderColor: '#e6dff0', borderRadius: 13, backgroundColor: '#fff', padding: 12, color: color.ink, fontFamily: 'Nunito', fontSize: 14 }} />}
    <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 11, marginTop: 5 }}>Select text, then choose a format. Preview shows how it appears on your profile.</Text>
  </View>;
}
