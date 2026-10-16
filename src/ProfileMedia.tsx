import React, { useState } from 'react';
import { Image, Linking, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Freelancer } from './data';
import { samplePortfolio } from './portfolio';
import { Button, color, Field, Heading } from './UI';
import { PortfolioLink, publicHttpsUrl } from './software';
import { DescriptionPreview } from './RichDescription';

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
  onSaveLinks: (links: PortfolioLink[]) => Promise<void>;
};

type WorkTab = 'Description' | 'Photos' | 'Video' | 'Documents' | 'Links';
export default function ProfileMedia({ profile, narrow, canEdit, photos, video, documents, onAddPhotos, onAddVideo, onAddDocuments, onRemovePhoto, onRemoveVideo, onRemoveDocument, onSaveLinks }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [tab, setTab] = useState<WorkTab>('Description');
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');
  const [savingLink, setSavingLink] = useState(false);
  const section = { borderTopWidth: 1, borderTopColor: color.line, padding: narrow ? 18 : 28 };
  const samples = samplePortfolio[profile.id.replace(/^sample-/, '')] || [];
  const gallery = [...samples.map(item => ({ source: Platform.OS === 'web' ? { uri: item.source as unknown as string } : item.source, label: item.label, sample: true, index: -1 })), ...photos.map((uri, index) => ({ source: { uri }, label: `Your photo ${index + 1}`, sample: false, index }))];
  const usedBytes = documents.reduce((total, item) => total + item.size, 0);
  const links = profile.links || [];
  const description = profile.description?.trim() || profile.why?.trim() || 'No description added yet.';
  const longDescription = description.length > 850;
  const visibleDescription = longDescription && !descriptionExpanded ? `${description.slice(0, 850).replace(/\s+\S*$/, '')}…` : description;
  const saveLink = async (next: PortfolioLink[]) => {
    setSavingLink(true); setLinkError('');
    try { await onSaveLinks(next); setLinkTitle(''); setLinkUrl(''); }
    catch (error) { setLinkError((error as Error).message); }
    finally { setSavingLink(false); }
  };
  const addLink = () => {
    const url = publicHttpsUrl(linkUrl);
    if (!url) { setLinkError('Use a public HTTPS link.'); return; }
    if (links.length >= 30) { setLinkError('You can add up to 30 links.'); return; }
    if (links.some(item => item.url === url)) { setLinkError('That link is already listed.'); return; }
    saveLink([...links, { title: (linkTitle.trim() || new URL(url).hostname).slice(0, 100), url }]);
  };
  return <View>
    <Modal visible={expanded !== null} transparent animationType="fade" onRequestClose={() => setExpanded(null)}><View style={{ flex: 1, backgroundColor: 'rgba(13,9,34,.92)', alignItems: 'center', justifyContent: 'center', padding: 20 }}><Pressable accessibilityRole="button" accessibilityLabel="Close enlarged image" onPress={() => setExpanded(null)} style={{ position: 'absolute', top: 28, right: 25, zIndex: 2, width: 46, height: 46, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 27, color: color.ink }}>×</Text></Pressable>{expanded !== null && gallery[expanded] && <><Image source={gallery[expanded].source} resizeMode="contain" style={{ width: '100%', height: '80%', maxWidth: 1200 }} /><Text style={{ color: '#fff', fontFamily: 'Nunito', marginTop: 12 }}>{gallery[expanded].label}</Text></>}</View></Modal>
    <View style={{ borderTopWidth: 1, borderTopColor: color.line, paddingHorizontal: narrow ? 18 : 28, paddingTop: narrow ? 18 : 25, paddingBottom: narrow ? 18 : 22 }}>
      <Heading size={25}>The work <Text style={{ color: color.coral }}>✦</Text></Heading>
      <Text style={[info, { marginTop: 3 }]}>Explore {profile.name.split(' ')[0]}'s description, photos, video, documents and links.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, maxWidth: '100%', marginTop: 16 }}>
        <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: 7, padding: 5, borderRadius: 18, backgroundColor: '#f7f3fb' }}>
          {(['Description', 'Photos', 'Video', 'Documents', 'Links'] as WorkTab[]).map(item => <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: tab === item }} onPress={() => setTab(item)} style={{ paddingHorizontal: narrow ? 11 : 18, paddingVertical: 10, borderRadius: 14, backgroundColor: tab === item ? '#fff' : 'transparent', borderWidth: tab === item ? 1 : 0, borderColor: '#ebe2f7', shadowColor: color.purple, shadowOpacity: tab === item ? .08 : 0, shadowRadius: 7 }}><Text style={{ color: tab === item ? color.purple : color.muted, fontFamily: 'Nunito', fontWeight: '900', fontSize: narrow ? 12 : 13 }}>{item}{item === 'Photos' && gallery.length ? ` ${gallery.length}` : item === 'Documents' && documents.length ? ` ${documents.length}` : item === 'Links' && links.length ? ` ${links.length}` : ''}</Text></Pressable>)}
        </View>
      </ScrollView>
    </View>
    {tab === 'Description' && <View style={section}>
      <View style={{ maxWidth: 850, gap: 10 }}>
        <Heading size={23}>Description <Text style={{ color: color.coral }}>✦</Text></Heading>
        <DescriptionPreview value={visibleDescription} fontSize={narrow ? 15 : 16} />
        {longDescription && <Pressable accessibilityRole="button" onPress={() => setDescriptionExpanded(value => !value)} style={{ alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 8, backgroundColor: '#f1e9ff' }}><Text style={{ color: color.purple, fontFamily: 'Nunito', fontWeight: '900', fontSize: 12 }}>{descriptionExpanded ? 'Show less ↑' : 'Read full description ↓'}</Text></Pressable>}
      </View>
    </View>}
    {tab === 'Photos' && <View style={section}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 9 }}><Text style={[info, { fontWeight: '800' }]}>Photos and portfolio highlights</Text>{canEdit && <Button outline onPress={onAddPhotos} disabled={photos.length >= 20} style={{ minHeight: 37 }} textStyle={{ fontSize: 12 }}>+ Add photos</Button>}</View>
      {gallery.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 17 }}>{gallery.map((item, index) => <Pressable key={`${item.label}-${index}`} accessibilityRole="button" accessibilityLabel={`Enlarge ${item.label}`} onPress={() => setExpanded(index)} style={{ width: narrow ? '48%' : '32%', aspectRatio: 3 / 2, borderRadius: 16, overflow: 'hidden', backgroundColor: '#f3eaf7' }}><Image source={item.source} resizeMode="cover" style={{ width: '100%', height: '100%' }} /><View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(16,12,41,.7)', paddingHorizontal: 9, paddingVertical: 7, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: '#fff', fontFamily: 'Nunito', fontSize: 11, fontWeight: '900', flex: 1 }} numberOfLines={1}>{item.label}</Text>{canEdit && !item.sample && <Pressable accessibilityRole="button" accessibilityLabel={`Remove photo ${item.index + 1}`} onPress={event => { event.stopPropagation?.(); onRemovePhoto(item.index); }}><Text style={{ color: '#fff', fontSize: 20 }}>×</Text></Pressable>}</View></Pressable>)}</View> : <View style={{ backgroundColor: '#f7f0ff', borderRadius: 16, padding: 24, marginTop: 15 }}><Text style={info}>Portfolio photos will appear here.</Text></View>}
      {!!profile.work.length && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 16 }}>{profile.work.map(item => <View key={item} style={{ borderRadius: 12, backgroundColor: '#f3edff', paddingHorizontal: 10, paddingVertical: 7 }}><Text style={{ fontFamily: 'Nunito', fontWeight: '900', color: color.purple, fontSize: 12 }}>✦ {item}</Text></View>)}</View>}{canEdit && <Text style={[info, { marginTop: 13 }]}>{photos.length}/20 uploaded photos · JPEG, PNG or WebP · each under 300 KB</Text>}
    </View>}
    {tab === 'Video' && <View style={section}><View style={{ alignItems: 'center', marginBottom: 16 }}><Heading size={24}>Portfolio video <Text style={{ color: color.orange }}>▶</Text></Heading><Text style={[info, { marginTop: 3 }]}>One dedicated video · exact 16:9 · under 14 MB</Text>{canEdit && <Button outline onPress={onAddVideo} style={{ minHeight: 37, marginTop: 10 }} textStyle={{ fontSize: 12 }}>{video ? 'Replace video' : '+ Add video'}</Button>}</View>
      <View style={{ width: '100%', maxWidth: 820, alignSelf: 'center', padding: narrow ? 7 : 12, backgroundColor: '#f3e6ff', borderRadius: 25, borderWidth: 2, borderColor: '#d5b7fc', shadowColor: color.purple, shadowOpacity: .2, shadowRadius: 17, elevation: 4 }}><View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#20173f', borderRadius: 17, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>{video && Platform.OS === 'web' ? React.createElement('video', { src: video, controls: true, preload: 'metadata', style: { width: '100%', height: '100%', objectFit: 'contain' } }) : <View style={{ alignItems: 'center', padding: 22 }}><View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#7b42f6', alignItems: 'center', justifyContent: 'center', marginBottom: 13 }}><Text style={{ color: '#fff', fontSize: 28, marginLeft: 4 }}>▶</Text></View><Text style={{ fontFamily: 'Nunito', color: '#fff', fontWeight: '900', fontSize: narrow ? 16 : 20 }}>Video showcase</Text><Text style={{ fontFamily: 'Nunito', color: '#cbbce9', fontSize: 12, marginTop: 5, textAlign: 'center' }}>{canEdit ? 'Add your best reel, introduction, or work highlight.' : 'A video showcase can appear here.'}</Text></View>}</View></View>
      {canEdit && video && <View style={{ flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: 11 }}><Pressable accessibilityRole="button" onPress={onRemoveVideo}><Text style={{ fontFamily: 'Nunito', color: color.coral, fontWeight: '900', fontSize: 12 }}>Remove video</Text></Pressable></View>}
    </View>}
    {tab === 'Documents' && <View style={section}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}><View><Heading size={23}>Documents <Text style={{ color: color.purple }}>⌁</Text></Heading><Text style={[info, { marginTop: 3 }]}>PDFs and text documents · 15 MB total</Text></View>{canEdit && <Button outline onPress={onAddDocuments} style={{ minHeight: 37 }} textStyle={{ fontSize: 12 }}>+ Add documents</Button>}</View>
      {documents.length ? <View style={{ gap: 8, marginTop: 14 }}>{documents.map((item, index) => <View key={`${item.uri}-${index}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 13, backgroundColor: '#f8f5fc', padding: 12 }}><Text style={{ fontSize: 22 }}>📄</Text><View style={{ flex: 1 }}>{Platform.OS === 'web' ? React.createElement('a', { href: item.uri, download: item.name, style: { color: color.purple, fontFamily: 'Nunito', fontWeight: '900', fontSize: 13, textDecoration: 'none' } }, item.name) : <Text style={{ fontFamily: 'Nunito', color: color.purple, fontWeight: '900' }}>{item.name}</Text>}<Text style={info}>{(item.size / 1024 / 1024).toFixed(2)} MB</Text></View>{canEdit && <Pressable accessibilityRole="button" accessibilityLabel={`Remove document ${item.name}`} onPress={() => onRemoveDocument(index)}><Text style={{ color: color.coral, fontSize: 21 }}>×</Text></Pressable>}</View>)}</View> : <View style={{ borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: '#ded5ed', padding: 20, marginTop: 14 }}><Text style={[info, { textAlign: 'center' }]}>Project briefs, certificates, and other work files can live here.</Text></View>}
      {canEdit && <Text style={[info, { marginTop: 12 }]}>{(usedBytes / 1024 / 1024).toFixed(2)} / 15 MB used · saved to your profile</Text>}
    </View>}
    {tab === 'Links' && <View style={section}><Heading size={23}>Links <Text style={{ color: color.coral }}>↗</Text></Heading><Text style={[info, { marginTop: 3 }]}>Websites, project pages, Google Drive portfolios and other work.</Text>
      {links.length ? <View style={{ gap: 8, marginTop: 16 }}>{links.map((item, index) => <View key={`${item.url}-${index}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: '#eae2f5', borderRadius: 15, backgroundColor: '#fcfaff', padding: 11 }}><View style={{ width: 35, height: 35, borderRadius: 11, backgroundColor: '#f1e9ff', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: color.purple, fontSize: 18 }}>↗</Text></View><View style={{ flex: 1, minWidth: 0 }}><Pressable accessibilityRole="link" accessibilityLabel={`Open ${item.title}`} onPress={() => Linking.openURL(item.url)}><Text style={{ color: color.purple, fontFamily: 'Nunito', fontWeight: '900' }} numberOfLines={1}>{item.title}</Text></Pressable><Text style={info} numberOfLines={1}>{new URL(item.url).hostname}</Text></View>{canEdit && <Pressable accessibilityRole="button" accessibilityLabel={`Remove link ${item.title}`} onPress={() => saveLink(links.filter((_, position) => position !== index))} disabled={savingLink}><Text style={{ color: color.coral, fontSize: 22 }}>×</Text></Pressable>}</View>)}</View> : <View style={{ padding: 23, backgroundColor: '#f8f5fc', borderRadius: 15, marginTop: 15 }}><Text style={[info, { textAlign: 'center' }]}>No links added yet.</Text></View>}
      {canEdit && <View style={{ marginTop: 17, gap: 8 }}><Text style={[info, { fontWeight: '900' }]}>Add a separate link</Text><Field value={linkTitle} onChangeText={setLinkTitle} placeholder="Link title, e.g. My portfolio" /><Field value={linkUrl} onChangeText={setLinkUrl} placeholder="https://your-portfolio.com" /><Button outline flat disabled={savingLink} onPress={addLink} style={{ alignSelf: 'flex-start' }}>{savingLink ? 'Saving…' : 'Save link'}</Button>{!!linkError && <Text style={{ color: color.coral, fontFamily: 'Nunito', fontSize: 12 }}>{linkError}</Text>}</View>}
    </View>}
  </View>;
}
