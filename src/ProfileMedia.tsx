import React from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import { Freelancer } from './data';
import { demoPortfolio } from './portfolio';
import { Button, color, Heading } from './UI';

export type ProfileDocument = { name: string; size: number; uri: string };
const info = { color: color.muted, fontFamily: 'Nunito' as const, fontSize: 12 };

type Props = {
  profile: Freelancer;
  narrow: boolean;
  canEdit: boolean;
  photos: string[];
  video: string | null;
  documents: ProfileDocument[];
  onAddPhotos: () => void;
  onAddVideo: () => void;
  onAddDocuments: () => void;
  onRemovePhoto: (index: number) => void;
  onRemoveVideo: () => void;
  onRemoveDocument: (index: number) => void;
};

export default function ProfileMedia({ profile, narrow, canEdit, photos, video, documents, onAddPhotos, onAddVideo, onAddDocuments, onRemovePhoto, onRemoveVideo, onRemoveDocument }: Props) {
  const section = { borderTopWidth: 1, borderTopColor: color.line, padding: narrow ? 18 : 28 };
  const samples = demoPortfolio[profile.id] || [];
  const gallery = [...samples.map(item => ({ source: Platform.OS === 'web' ? { uri: item.source as unknown as string } : item.source, label: item.label, sample: true, index: -1 })), ...photos.map((uri, index) => ({ source: { uri }, label: `Your photo ${index + 1}`, sample: false, index }))];
  const usedBytes = documents.reduce((total, item) => total + item.size, 0);
  return <View>
    <View style={section}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 9 }}><View><Heading size={25}>The work <Text style={{ color: color.coral }}>✦</Text></Heading><Text style={[info, { marginTop: 3 }]}>A closer look at what {profile.name.split(' ')[0]} creates.</Text></View>{canEdit && <Button outline onPress={onAddPhotos} disabled={photos.length >= 20} style={{ minHeight: 37 }} textStyle={{ fontSize: 12 }}>+ Add photos</Button>}</View>
      {gallery.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 17 }}>{gallery.map((item, index) => <View key={`${item.label}-${index}`} style={{ width: narrow ? '47%' : '31%', flexGrow: 1, height: narrow ? 155 : 225, borderRadius: 16, overflow: 'hidden', backgroundColor: '#f3eaf7' }}><Image source={item.source} resizeMode="cover" style={{ width: '100%', height: '100%' }} /><View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(16,12,41,.7)', paddingHorizontal: 9, paddingVertical: 7, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: '#fff', fontFamily: 'Nunito', fontSize: 11, fontWeight: '900', flex: 1 }} numberOfLines={1}>{item.label}{item.sample ? ' · Sample' : ''}</Text>{canEdit && !item.sample && <Pressable accessibilityRole="button" accessibilityLabel={`Remove photo ${item.index + 1}`} onPress={() => onRemovePhoto(item.index)}><Text style={{ color: '#fff', fontSize: 20 }}>×</Text></Pressable>}</View></View>)}</View> : <View style={{ backgroundColor: '#f7f0ff', borderRadius: 16, padding: 24, marginTop: 15 }}><Text style={info}>Portfolio photos will appear here.</Text></View>}
      {!!profile.work.length && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 16 }}>{profile.work.map(item => <View key={item} style={{ borderRadius: 12, backgroundColor: '#f3edff', paddingHorizontal: 10, paddingVertical: 7 }}><Text style={{ fontFamily: 'Nunito', fontWeight: '900', color: color.purple, fontSize: 12 }}>✦ {item}</Text></View>)}</View>}{canEdit && <Text style={[info, { marginTop: 13 }]}>{photos.length}/20 uploaded photos · JPEG, PNG or WebP · each under 300 KB</Text>}
    </View>
    <View style={section}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}><View><Heading size={24}>In motion <Text style={{ color: color.orange }}>▶</Text></Heading><Text style={[info, { marginTop: 3 }]}>One dedicated video · exact 16:9 · under 14 MB</Text></View>{canEdit && <Button outline onPress={onAddVideo} style={{ minHeight: 37 }} textStyle={{ fontSize: 12 }}>{video ? 'Replace video' : '+ Add video'}</Button>}</View>
      <View style={{ width: '100%', maxWidth: 800, alignSelf: 'center', aspectRatio: 16 / 9, backgroundColor: '#20173f', borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>{video && Platform.OS === 'web' ? React.createElement('video', { src: video, controls: true, preload: 'metadata', style: { width: '100%', height: '100%', objectFit: 'contain' } }) : <View style={{ alignItems: 'center', padding: 22 }}><View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#7b42f6', alignItems: 'center', justifyContent: 'center', marginBottom: 13 }}><Text style={{ color: '#fff', fontSize: 28, marginLeft: 4 }}>▶</Text></View><Text style={{ fontFamily: 'Nunito', color: '#fff', fontWeight: '900', fontSize: narrow ? 16 : 20 }}>A story in motion</Text><Text style={{ fontFamily: 'Nunito', color: '#cbbce9', fontSize: 12, marginTop: 5, textAlign: 'center' }}>{canEdit ? 'Add your best reel, introduction, or work highlight.' : 'A video showcase can appear here.'}</Text></View>}</View>
      {canEdit && <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 11 }}><Text style={info}>Preview uploads last until this page is refreshed.</Text>{video && <Pressable accessibilityRole="button" onPress={onRemoveVideo}><Text style={{ fontFamily: 'Nunito', color: color.coral, fontWeight: '900', fontSize: 12 }}>Remove video</Text></Pressable>}</View>}
    </View>
    <View style={section}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}><View><Heading size={23}>Documents <Text style={{ color: color.purple }}>⌁</Text></Heading><Text style={[info, { marginTop: 3 }]}>PDFs and text documents · 15 MB total</Text></View>{canEdit && <Button outline onPress={onAddDocuments} style={{ minHeight: 37 }} textStyle={{ fontSize: 12 }}>+ Add documents</Button>}</View>
      {documents.length ? <View style={{ gap: 8, marginTop: 14 }}>{documents.map((item, index) => <View key={`${item.uri}-${index}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 13, backgroundColor: '#f8f5fc', padding: 12 }}><Text style={{ fontSize: 22 }}>📄</Text><View style={{ flex: 1 }}>{Platform.OS === 'web' ? React.createElement('a', { href: item.uri, download: item.name, style: { color: color.purple, fontFamily: 'Nunito', fontWeight: '900', fontSize: 13, textDecoration: 'none' } }, item.name) : <Text style={{ fontFamily: 'Nunito', color: color.purple, fontWeight: '900' }}>{item.name}</Text>}<Text style={info}>{(item.size / 1024 / 1024).toFixed(2)} MB</Text></View>{canEdit && <Pressable accessibilityRole="button" accessibilityLabel={`Remove document ${item.name}`} onPress={() => onRemoveDocument(index)}><Text style={{ color: color.coral, fontSize: 21 }}>×</Text></Pressable>}</View>)}</View> : <View style={{ borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: '#ded5ed', padding: 20, marginTop: 14 }}><Text style={[info, { textAlign: 'center' }]}>Project briefs, certificates, and other work files can live here.</Text></View>}
      {canEdit && <Text style={[info, { marginTop: 12 }]}>{(usedBytes / 1024 / 1024).toFixed(2)} / 15 MB used · files stay in this preview until refresh</Text>}
    </View>
  </View>;
}
