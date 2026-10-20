import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Freelancer } from './data';
import * as live from './liveApi';
import { Button, color, Heading } from './UI';

export default function ProfileReviews({ profile, userId, onChanged }: { profile: Freelancer; userId: string | null; onChanged: () => Promise<void> }) {
  const [reviews, setReviews] = useState<live.FreelancerReview[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile.demo) return;
    let active = true;
    Promise.all([live.getFreelancerReviews(profile.id), userId && userId !== profile.id ? live.canReviewFreelancer(userId, profile.id) : Promise.resolve(false)])
      .then(([items, allowed]) => { if (!active) return; setReviews(items); setCanReview(allowed); const mine = items.find(item => item.finder_id === userId); setRating(mine?.rating || 5); setBody(''); setEditing(!mine); })
      .catch(problem => { if (active) setError((problem as Error).message); });
    return () => { active = false; };
  }, [profile.id, profile.demo, userId]);

  const save = async () => {
    if (!userId || !canReview || busy) return;
    if (body.trim().length < 20 || body.trim().length > 800) { setError('Write 20–800 characters about your experience.'); return; }
    setBusy(true); setError('');
    try {
      await live.saveFreelancerReview(userId, profile.id, rating, body.trim());
      setReviews(await live.getFreelancerReviews(profile.id));
      setBody(''); setEditing(false);
      await onChanged();
    } catch (problem) { setError((problem as Error).message); }
    finally { setBusy(false); }
  };

  return <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, borderRadius: 24, padding: 22, marginTop: 18 }}>
    <Heading size={23}>Community reviews ✦</Heading>
    <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 13, marginTop: 5 }}>Feedback from Finders. WhyChoozeMe does not verify completed work.</Text>
    {profile.demo ? <Text style={{ color: color.muted, fontFamily: 'Nunito', marginTop: 15 }}>This example profile has illustrative ratings.</Text> : <>
      {reviews.length ? reviews.map(item => <View key={item.finder_id} style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: color.line }}><Text style={{ color: '#bd820c', fontSize: 17 }}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</Text><Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 14, lineHeight: 21, marginTop: 5 }}>{item.body}</Text><Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 12, marginTop: 5 }}>Finder · {new Date(item.created_at).toLocaleDateString()}</Text></View>) : <Text style={{ color: color.muted, fontFamily: 'Nunito', marginTop: 15 }}>No community reviews yet.</Text>}
      {canReview && !editing && reviews.some(item => item.finder_id === userId) && <Button outline onPress={() => { const mine = reviews.find(item => item.finder_id === userId); setRating(mine?.rating || 5); setBody(mine?.body || ''); setEditing(true); }} style={{ alignSelf: 'flex-start', marginTop: 16 }}>Edit your review</Button>}
      {canReview && editing && <View style={{ marginTop: 20, backgroundColor: '#faf6ff', borderRadius: 17, padding: 16 }}><Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900' }}>{reviews.some(item => item.finder_id === userId) ? 'Update your review' : 'Leave a review'}</Text><View style={{ flexDirection: 'row', gap: 6, marginTop: 9 }}>{[1, 2, 3, 4, 5].map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${value} stars`} accessibilityState={{ selected: rating === value }} onPress={() => setRating(value)}><Text style={{ color: value <= rating ? '#d49b12' : '#c5c0cf', fontSize: 29 }}>{value <= rating ? '★' : '☆'}</Text></Pressable>)}</View><TextInput accessibilityLabel="Your review" value={body} onChangeText={setBody} maxLength={800} multiline placeholder="Share your experience with this freelancer" placeholderTextColor="#8e8ca0" style={{ backgroundColor: '#fff', borderColor: color.line, borderWidth: 1, borderRadius: 12, minHeight: 90, padding: 11, marginTop: 10, fontFamily: 'Nunito', color: color.ink, textAlignVertical: 'top' }} /><View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}><Button onPress={save} disabled={busy} style={{ alignSelf: 'flex-start' }}>{busy ? 'Saving…' : 'Save review'}</Button>{reviews.some(item => item.finder_id === userId) && <Button outline onPress={() => { setBody(''); setEditing(false); }}>Cancel</Button>}</View></View>}
      {!!userId && userId !== profile.id && !canReview && !error && <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 12, marginTop: 14 }}>Send a message through WhyChoozeMe before leaving feedback.</Text>}
      {!!error && <Text style={{ color: color.coral, fontFamily: 'Nunito', fontSize: 12, marginTop: 9 }}>{error}</Text>}
    </>}
  </View>;
}
