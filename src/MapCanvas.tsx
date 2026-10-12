import React, { useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { distanceKm, Freelancer, talukaCenters, Taluka } from './data';
import { Portrait } from './UI';

const PURPLE = '#713af0';
const INK = '#10163a';
const TILE = 256;

function point(lat: number, lon: number, zoom: number) {
  const scale = TILE * 2 ** zoom;
  const sin = Math.sin(lat * Math.PI / 180);
  return { x: ((lon + 180) / 360) * scale, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale };
}

type Props = {
  people: Freelancer[];
  signedIn: boolean;
  place: string;
  radius: string;
  onSelect: (person: Freelancer) => void;
  onLocked: () => void;
};

export default function MapCanvas({ people, signedIn, place, radius, onSelect, onLocked }: Props) {
  const [size, setSize] = useState({ width: 900, height: 470 });
  const [zoomDelta, setZoomDelta] = useState(0);
  const center = place === 'Goa' ? { lat: 15.44, lon: 73.91 } : talukaCenters[place as Taluka] || { lat: 15.44, lon: 73.91 };
  const zoom = Math.max(8, Math.min(13, (place === 'Goa' || radius === 'All Goa' ? 9 : radius === 'Local' ? 11 : 10) + zoomDelta));
  const centerPoint = point(center.lat, center.lon, zoom);
  const tiles = useMemo(() => {
    const startX = Math.floor((centerPoint.x - size.width / 2) / TILE);
    const endX = Math.floor((centerPoint.x + size.width / 2) / TILE);
    const startY = Math.floor((centerPoint.y - size.height / 2) / TILE);
    const endY = Math.floor((centerPoint.y + size.height / 2) / TILE);
    const result: { x: number; y: number; left: number; top: number }[] = [];
    for (let x = startX; x <= endX; x++) for (let y = startY; y <= endY; y++) {
      result.push({ x, y, left: x * TILE - centerPoint.x + size.width / 2, top: y * TILE - centerPoint.y + size.height / 2 });
    }
    return result;
  }, [centerPoint.x, centerPoint.y, size.width, size.height]);
  const selected = place === 'Goa' ? people : [...people].sort((a, b) => distanceKm(center, a) - distanceKm(center, b));

  return <View onLayout={event => setSize(event.nativeEvent.layout)} style={{ height: 470, minHeight: 380, borderRadius: 28, overflow: 'hidden', backgroundColor: '#cbe8e2', position: 'relative' }}>
    {tiles.map(tile => <Image key={`${zoom}-${tile.x}-${tile.y}`} source={{ uri: `https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png` }} style={{ width: TILE, height: TILE, position: 'absolute', left: tile.left, top: tile.top }} />)}
    {place !== 'Goa' && radius !== 'All Goa' && <View pointerEvents="none" style={{ position: 'absolute', left: size.width / 2 - (radius === 'Local' ? 72 : radius === '10 km' ? 110 : 170), top: size.height / 2 - (radius === 'Local' ? 72 : radius === '10 km' ? 110 : 170), width: (radius === 'Local' ? 72 : radius === '10 km' ? 110 : 170) * 2, height: (radius === 'Local' ? 72 : radius === '10 km' ? 110 : 170) * 2, borderRadius: 500, borderWidth: 2, borderColor: PURPLE, backgroundColor: 'rgba(113,58,240,0.09)' }} />}
    {selected.map((person, index) => {
      const p = point(person.lat, person.lon, zoom);
      const x = p.x - centerPoint.x + size.width / 2;
      const y = p.y - centerPoint.y + size.height / 2;
      if (x < -30 || y < -30 || x > size.width + 30 || y > size.height + 30) return null;
      const locked = !signedIn && index > 1;
      return <Pressable accessibilityLabel={locked ? `Locked profile: ${person.name}` : `Open ${person.name}'s profile`} onPress={() => locked ? onLocked() : onSelect(person)} key={person.id} style={{ position: 'absolute', left: x - 21, top: y - 44, alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 25, borderWidth: 3, borderColor: '#fff', backgroundColor: locked ? '#5b5673' : PURPLE, alignItems: 'center', justifyContent: 'center', shadowColor: '#321891', shadowOpacity: .25, shadowRadius: 8, elevation: 4, overflow: 'hidden' }}>{locked ? <Text style={{ fontSize: 20, color: '#fff' }}>🔒</Text> : <Portrait index={person.image} imageUrl={person.imageUrl} name={person.name} height={38} radius={19} />}</View>
        <View style={{ width: 13, height: 13, backgroundColor: locked ? '#5b5673' : PURPLE, transform: [{ rotate: '45deg' }], marginTop: -7, borderRightWidth: 2, borderBottomWidth: 2, borderColor: '#fff' }} />
      </Pressable>;
    })}
    <View style={{ position: 'absolute', right: 16, top: 16, gap: 8 }}>
      <Pressable onPress={() => setZoomDelta(value => Math.min(value + 1, 3))} style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 24, color: INK }}>+</Text></Pressable>
      <Pressable onPress={() => setZoomDelta(value => Math.max(value - 1, -1))} style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 24, color: INK }}>−</Text></Pressable>
    </View>
    <View style={{ position: 'absolute', left: 12, bottom: 10, backgroundColor: 'rgba(255,255,255,.9)', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 3 }}><Text style={{ fontSize: 10, color: '#34304d' }}>© OpenStreetMap contributors</Text></View>
  </View>;
}
