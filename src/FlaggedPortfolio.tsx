import React from 'react';
import { Image, Text, View } from 'react-native';
import type { PortfolioAsset } from './portfolioApi';
import type { ContentModerationFlag } from './liveApi';
import { color } from './UI';

export default function FlaggedPortfolio({ assets, flags, narrow }: { assets: PortfolioAsset[]; flags: ContentModerationFlag[]; narrow: boolean }) {
  const flagged = flags.filter(flag => flag.target_kind === 'media').map(flag => ({ flag, asset: assets.find(item => item.id === flag.target_id) })).filter(item => !!item.asset);
  if (!flagged.length) return null;
  return <View style={{ borderTopWidth: 1, borderTopColor: color.line, padding: narrow ? 17 : 27, backgroundColor: '#fff' }}>
    <Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900', fontSize: 22, marginBottom: 5 }}>Portfolio items under review</Text>
    <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 12, marginBottom: 15 }}>Only you and the admin team can see these items until the review is resolved.</Text>
    {flagged.map(({ flag, asset }) => <View key={flag.id} nativeID={`flag-media-${asset?.id}`} style={{ borderRadius: 17, borderWidth: 1, borderColor: '#dce6f8', padding: narrow ? 14 : 19, marginBottom: 13, backgroundColor: '#fff' }}>
      <View style={{ flexDirection: narrow ? 'column' : 'row', gap: 19 }}>
        <View style={{ width: narrow ? '100%' : 220, height: narrow ? 180 : 155, borderRadius: 13, overflow: 'hidden', backgroundColor: '#fff0f3', alignItems: 'center', justifyContent: 'center' }}>
          {asset?.kind === 'photo' ? <Image source={{ uri: asset.url }} resizeMode="cover" style={{ width: '100%', height: '100%' }} /> : <Text style={{ color: '#a15671', fontSize: 43 }}>{asset?.kind === 'video' ? '▶' : '▤'}</Text>}
          <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: '#d33c59', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }}><Text style={{ color: '#fff', fontFamily: 'Nunito', fontWeight: '900', fontSize: 11 }}>⚑ Under review</Text></View>
        </View>
        <View style={{ flex: 1 }}><Text style={{ color: color.ink, fontFamily: 'Nunito', fontWeight: '900', fontSize: 19 }}>{asset?.file_name || flag.target_title || 'Portfolio item'}</Text><Text style={{ color: '#6d7b9b', fontFamily: 'Nunito', fontSize: 12, marginTop: 4 }}>{asset?.kind === 'photo' ? 'Photo' : asset?.kind === 'video' ? 'Video' : 'Document'} · Your portfolio</Text>
          <View style={{ backgroundColor: '#fff0f2', borderRadius: 10, padding: 11, marginTop: 16 }}><Text style={{ color: '#bd4059', fontFamily: 'Nunito', fontSize: 12, fontWeight: '900' }}>ⓘ This item is under review following an admin flag.</Text></View>
          <View style={{ borderRadius: 11, borderWidth: 1, borderColor: '#dbe5f7', padding: 12, marginTop: 10, flexDirection: narrow ? 'column' : 'row', gap: narrow ? 7 : 20 }}><View style={{ flex: 1 }}><Text style={{ color: '#7183a3', fontFamily: 'Nunito', fontSize: 10, fontWeight: '900' }}>FLAGGED ON</Text><Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 12, marginTop: 2 }}>{new Date(flag.created_at).toLocaleString()}</Text></View><View style={{ flex: 2 }}><Text style={{ color: '#7183a3', fontFamily: 'Nunito', fontSize: 10, fontWeight: '900' }}>REASON FROM ADMIN</Text><Text style={{ color: '#405d96', fontFamily: 'Nunito', fontSize: 12, marginTop: 2 }}>{flag.reason}</Text></View></View>
        </View>
      </View>
    </View>)}
  </View>;
}
