import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Freelancer } from './data';
import { demoReviews, ProfileReview } from './portfolio';
import { Button, color, Heading, TinyTag } from './UI';

const label = { color: color.ink, fontFamily: 'Nunito' as const };
const card = { backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, borderRadius: 24 };

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
