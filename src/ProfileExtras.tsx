import React from 'react';
import { Image, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Freelancer } from './data';
import { demoPortfolio, demoReviews, ProfileReview } from './portfolio';
import { Button, color, Heading, TinyTag } from './UI';

const label = { color: color.ink, fontFamily: 'Nunito' as const };
const card = { backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, borderRadius: 24 };

type PortfolioProps = {
  profile: Freelancer;
  narrow: boolean;
  canEdit: boolean;
  photos: string[];
  video: string | null;
  onAddPhotos: () => void;
  onAddVideo: () => void;
  onRemovePhoto: (index: number) => void;
  onRemoveVideo: () => void;
};

export function ProfilePortfolio({ profile, narrow, canEdit, photos, video, onAddPhotos, onAddVideo, onRemovePhoto, onRemoveVideo }: PortfolioProps) {
  const samples = demoPortfolio[profile.id] || [];
  const gallery = [
    ...samples.map(item => ({ source: Platform.OS === 'web' ? { uri: item.source as unknown as string } : item.source, label: item.label, sample: true, index: -1 })),
    ...photos.map((uri, index) => ({ source: { uri }, label: `Your photo ${index + 1}`, sample: false, index })),
  ];
  return <View style={{ flex: 2, ...card, padding: narrow ? 17 : 24 }}>
    <View style={{ flexDirection: narrow ? 'column' : 'row', justifyContent: 'space-between', alignItems: narrow ? 'flex-start' : 'center', gap: 10 }}>
      <View><Heading size={24}>The work ✨</Heading><Text style={[label, { color: color.muted, marginTop: 4, fontSize: 14 }]}>A closer look at what {profile.name.split(' ')[0]} creates.</Text></View>
      {canEdit && <Button outline onPress={onAddPhotos} disabled={photos.length >= 20} style={{ minHeight: 38 }} textStyle={{ fontSize: 12 }}>+ Add photos</Button>}
    </View>
    {gallery.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11, marginTop: 18 }}>
      {gallery.map((item, i) => <View key={`${item.label}-${i}`} style={{ width: narrow ? '100%' : '48%', minWidth: narrow ? 0 : 190, flexGrow: 1, height: narrow ? 190 : 210, borderRadius: 17, overflow: 'hidden', backgroundColor: '#f2eafa' }}>
        <Image source={item.source} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: 'rgba(12,10,38,.68)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ fontFamily: 'Nunito', color: '#fff', fontWeight: '900', fontSize: 12 }}>{item.label}{item.sample ? ' · Sample' : ''}</Text>{canEdit && !item.sample && <Pressable accessibilityRole="button" accessibilityLabel={`Remove photo ${item.index + 1}`} onPress={() => onRemovePhoto(item.index)}><Text style={{ color: '#fff', fontSize: 20, lineHeight: 22 }}>×</Text></Pressable>}</View>
      </View>)}
    </View> : <View style={{ padding: 26, borderRadius: 17, backgroundColor: '#f7f0ff', marginTop: 17 }}><Text style={[label, { color: color.muted }]}>Portfolio photos will appear here.</Text></View>}
    {!!profile.work.length && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 16 }}>{profile.work.map(item => <View key={item} style={{ backgroundColor: '#f4edff', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 13 }}><Text style={[label, { color: color.purple, fontSize: 12, fontWeight: '900' }]}>✦ {item}</Text></View>)}</View>}
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25, marginBottom: 10, gap: 8 }}><View><Text style={[label, { fontSize: 17, fontWeight: '900' }]}>Video showcase</Text><Text style={[label, { fontSize: 12, color: color.muted }]}>One video · 16:9 · up to 14 MB</Text></View>{canEdit && <Button outline onPress={onAddVideo} style={{ minHeight: 37 }} textStyle={{ fontSize: 12 }}>{video ? 'Replace video' : '+ Add video'}</Button>}</View>
    <View style={{ width: '100%', maxWidth: 540, alignSelf: 'center', aspectRatio: 16 / 9, backgroundColor: '#211945', borderRadius: 17, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {video && Platform.OS === 'web' ? React.createElement('video', { src: video, controls: true, preload: 'metadata', style: { width: '100%', height: '100%', aspectRatio: '16 / 9', objectFit: 'contain' } }) : <><Text style={{ fontSize: 31, color: '#fff' }}>▶</Text><Text style={{ fontFamily: 'Nunito', color: '#e9dfff', fontWeight: '900', fontSize: 13, marginTop: 8 }}>{canEdit ? 'Add a short video of your work' : 'Video showcase coming soon'}</Text></>}
    </View>
    {canEdit && <View style={{ marginTop: 12 }}><Text style={[label, { color: color.muted, fontSize: 12 }]}>{photos.length}/20 uploaded photos · JPEG, PNG or WebP · each under 300 KB</Text>{video && <Pressable accessibilityRole="button" onPress={onRemoveVideo} style={{ alignSelf: 'flex-start', marginTop: 8 }}><Text style={[label, { color: color.coral, fontSize: 12, fontWeight: '900' }]}>Remove video</Text></Pressable>}<Text style={[label, { color: color.muted, fontSize: 11, marginTop: 5 }]}>Preview uploads last until this page is refreshed.</Text></View>}
  </View>;
}

type ReviewsProps = {
  profile: Freelancer;
  userReviews: ProfileReview[];
  canReview: boolean;
  draft: string;
  rating: number;
  onDraft: (value: string) => void;
  onRating: (value: number) => void;
  onSubmit: () => void;
  onRemove: (id: string) => void;
};

export function ProfileReviews({ profile, userReviews, canReview, draft, rating, onDraft, onRating, onSubmit, onRemove }: ReviewsProps) {
  const reviews = [...userReviews.filter(item => item.freelancerId === profile.id).reverse(), ...demoReviews.filter(item => item.freelancerId === profile.id)];
  const userForProfile = userReviews.filter(item => item.freelancerId === profile.id);
  const count = profile.reviews + userForProfile.length;
  const average = count ? (profile.rating * profile.reviews + userForProfile.reduce((sum, item) => sum + item.rating, 0)) / count : 0;
  return <View style={{ ...card, padding: 24, marginTop: 20 }}>
    <Heading size={25}>Reviews & kind words <Text style={{ color: color.coral }}>✦</Text></Heading>
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 14, marginBottom: 18 }}><View style={{ backgroundColor: '#fff4dd', borderRadius: 15, paddingHorizontal: 14, paddingVertical: 10 }}><Text style={[label, { color: '#8e5100', fontSize: 23, fontWeight: '900' }]}>★ {average ? average.toFixed(1) : 'New'}</Text></View><Text style={[label, { color: color.muted, fontSize: 14 }]}>{count ? `${count} reviews` : 'Be the first to review'}{profile.demo ? ' · Preview profile' : ''}</Text></View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11 }}>{reviews.map(item => <View key={item.id} style={{ flex: 1, minWidth: 235, borderRadius: 17, backgroundColor: '#fbf8ff', borderWidth: 1, borderColor: '#eee5f8', padding: 16 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}><Text style={[label, { fontWeight: '900', fontSize: 14 }]}>{item.author}</Text><Text style={[label, { color: '#ed9e20', fontSize: 14 }]}>{'★'.repeat(item.rating)}</Text></View><Text style={[label, { color: color.ink, lineHeight: 20, marginTop: 9, fontSize: 13 }]}>{item.body}</Text><View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}><Text style={[label, { color: color.muted, fontSize: 11 }]}>{item.date}{item.demo ? ' · Sample review' : ''}</Text>{!item.demo && <Pressable accessibilityRole="button" accessibilityLabel="Remove your review" onPress={() => onRemove(item.id)}><Text style={[label, { color: color.coral, fontSize: 11, fontWeight: '900' }]}>Remove</Text></Pressable>}</View></View>)}</View>
    {canReview && <View style={{ marginTop: 22, borderTopWidth: 1, borderTopColor: color.line, paddingTop: 18 }}><TinyTag style={{ alignSelf: 'flex-start', marginBottom: 10 }}>SHARE YOUR EXPERIENCE</TinyTag><View style={{ flexDirection: 'row', gap: 5, marginBottom: 12 }}>{[1, 2, 3, 4, 5].map(value => <Pressable accessibilityRole="button" accessibilityLabel={`Rate ${value} stars`} key={value} onPress={() => onRating(value)} style={{ padding: 3 }}><Text style={{ fontSize: 27, color: value <= rating ? '#ffab22' : '#d8d3de' }}>★</Text></Pressable>)}</View><TextInput accessibilityLabel="Write a review" value={draft} onChangeText={onDraft} placeholder="How was it working together?" placeholderTextColor="#9b97a7" multiline style={{ minHeight: 84, borderWidth: 1, borderColor: color.line, borderRadius: 15, padding: 13, fontFamily: 'Nunito', color: color.ink, textAlignVertical: 'top' }} /><Button onPress={onSubmit} style={{ alignSelf: 'flex-start', marginTop: 11 }}>Post review</Button><Text style={[label, { color: color.muted, fontSize: 11, marginTop: 7 }]}>Walkthrough reviews are saved on this device.</Text></View>}
  </View>;
}
