import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, PanResponder, Platform, Pressable, Text, View } from 'react-native';
import { distanceKm, Freelancer, talukaCenters, Taluka } from './data';
import { Portrait } from './UI';

const PURPLE = '#713af0';
const INK = '#10163a';
const TILE = 256;
const GOA = { lat: 15.44, lon: 73.91 };

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
  compact: boolean;
  onSelect: (person: Freelancer) => void;
  onLocked: () => void;
};

export default function MapCanvas({ people, signedIn, place, radius, compact, onSelect, onLocked }: Props) {
  const [size, setSize] = useState({ width: 900, height: compact ? 430 : 500 });
  const [zoomDelta, setZoomDelta] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const baseZoom = place === 'Goa' || radius === 'All Goa' ? 9 : radius === 'Local' ? 11 : 10;
  const zoom = Math.max(7, Math.min(14, baseZoom + zoomDelta));
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const dragStart = useRef({ x: 0, y: 0 });
  const pinchDistance = useRef<number | null>(null);
  const mapRef = useRef<View>(null);
  zoomRef.current = zoom;
  panRef.current = pan;

  useEffect(() => { setZoomDelta(0); setPan({ x: 0, y: 0 }); }, [place, radius]);
  const changeZoom = useCallback((step: number) => {
    const current = zoomRef.current;
    const next = Math.max(7, Math.min(14, current + step));
    if (next === current) return;
    zoomRef.current = next;
    setZoomDelta(next - baseZoom);
    setPan(previous => {
      const scaled = { x: previous.x * 2 ** (next - current), y: previous.y * 2 ** (next - current) };
      panRef.current = scaled;
      return scaled;
    });
  }, [baseZoom]);
  useEffect(() => {
    if (Platform.OS !== 'web' || !mapRef.current) return;
    const element = mapRef.current as unknown as HTMLElement;
    const wheel = (event: WheelEvent) => { event.preventDefault(); event.stopPropagation(); changeZoom(event.deltaY > 0 ? -1 : 1); };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [changeZoom]);
  const gestures = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => gesture.numberActiveTouches > 1 || Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
    onPanResponderGrant: () => { dragStart.current = panRef.current; setDragging(true); },
    onPanResponderMove: (event, gesture) => {
      const touches = event.nativeEvent.touches;
      if (touches?.length >= 2) {
        const distance = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
        if (pinchDistance.current !== null && distance > pinchDistance.current * 1.35) { changeZoom(1); pinchDistance.current = distance; }
        else if (pinchDistance.current !== null && distance < pinchDistance.current * .74) { changeZoom(-1); pinchDistance.current = distance; }
        else if (pinchDistance.current === null) pinchDistance.current = distance;
        return;
      }
      pinchDistance.current = null;
      const moved = { x: dragStart.current.x + gesture.dx, y: dragStart.current.y + gesture.dy };
      panRef.current = moved;
      setPan(moved);
    },
    onPanResponderRelease: () => { pinchDistance.current = null; setDragging(false); },
    onPanResponderTerminate: () => { pinchDistance.current = null; setDragging(false); },
    onPanResponderTerminationRequest: () => true,
  }), [changeZoom]);

  const center = place === 'Goa' || radius === 'All Goa' ? GOA : talukaCenters[place as Taluka] || GOA;
  const centerPoint = point(center.lat, center.lon, zoom);
  const mapX = centerPoint.x - pan.x;
  const mapY = centerPoint.y - pan.y;
  const tiles = useMemo(() => {
    const startX = Math.floor((mapX - size.width / 2) / TILE);
    const endX = Math.floor((mapX + size.width / 2) / TILE);
    const startY = Math.floor((mapY - size.height / 2) / TILE);
    const endY = Math.floor((mapY + size.height / 2) / TILE);
    const result: { x: number; y: number; left: number; top: number }[] = [];
    for (let x = startX; x <= endX; x++) for (let y = startY; y <= endY; y++) {
      if (x >= 0 && y >= 0 && x < 2 ** zoom && y < 2 ** zoom) result.push({ x, y, left: x * TILE - mapX + size.width / 2, top: y * TILE - mapY + size.height / 2 });
    }
    return result;
  }, [mapX, mapY, size.width, size.height, zoom]);
  const selected = place === 'Goa' || radius === 'All Goa' ? people : [...people].sort((a, b) => distanceKm(center, a) - distanceKm(center, b));
  const occupied: { x: number; y: number }[] = [];
  const markers = selected.map((person, index) => {
    const location = point(person.lat, person.lon, zoom);
    const original = { x: location.x - mapX + size.width / 2, y: location.y - mapY + size.height / 2 };
    if (original.x < -30 || original.y < -30 || original.x > size.width + 30 || original.y > size.height + 30) return null;
    let position = original;
    for (const distance of [0, 46, 86, 126]) {
      const options = distance ? Array.from({ length: 12 }, (_, angle) => ({ x: original.x + Math.cos(angle * Math.PI / 6) * distance, y: original.y + Math.sin(angle * Math.PI / 6) * distance })) : [original];
      const free = options.find(item => item.x > 24 && item.x < size.width - 24 && item.y > 50 && item.y < size.height - 28 && occupied.every(other => Math.hypot(item.x - other.x, item.y - other.y) > 45));
      if (free) { position = free; break; }
    }
    occupied.push(position);
    return { person, index, position };
  }).filter((item): item is { person: Freelancer; index: number; position: { x: number; y: number } } => !!item);
  const circleKm = radius === 'Local' ? 5 : radius === '10 km' ? 10 : 25;
  const circlePixels = circleKm / (40075 * Math.cos(center.lat * Math.PI / 180)) * TILE * 2 ** zoom;

  return <View ref={mapRef} onLayout={event => { const { width, height } = event.nativeEvent.layout; if (width !== size.width || height !== size.height) setSize({ width, height }); }} {...gestures.panHandlers} style={[{ height: compact ? 430 : 500, borderRadius: 27, overflow: 'hidden', backgroundColor: '#cbe8e2', position: 'relative', borderWidth: 1, borderColor: '#d9ddeb' }, Platform.OS === 'web' ? { cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none', touchAction: 'none' } as any : null]}>
    {tiles.map(tile => <Image key={`${zoom}-${tile.x}-${tile.y}`} source={{ uri: `https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png` }} style={{ width: TILE, height: TILE, position: 'absolute', left: tile.left, top: tile.top, pointerEvents: 'none' } as any} />)}
    {place !== 'Goa' && radius !== 'All Goa' && <View pointerEvents="none" style={{ position: 'absolute', left: size.width / 2 + pan.x - circlePixels, top: size.height / 2 + pan.y - circlePixels, width: circlePixels * 2, height: circlePixels * 2, borderRadius: circlePixels, borderWidth: 2, borderColor: PURPLE, backgroundColor: 'rgba(113,58,240,0.08)' }} />}
    {markers.map(({ person, index, position }) => {
      const locked = !signedIn && index > 1;
      return <Pressable accessibilityRole="button" accessibilityLabel={locked ? `Locked profile: ${person.name}` : `Open ${person.name}'s profile`} onPress={() => locked ? onLocked() : onSelect(person)} key={person.id} style={{ position: 'absolute', left: position.x - 22, top: position.y - 44, alignItems: 'center' }}>
        <View style={{ width: 46, height: 46, borderRadius: 25, borderWidth: 3, borderColor: '#fff', backgroundColor: locked ? '#5b5673' : PURPLE, alignItems: 'center', justifyContent: 'center', shadowColor: '#321891', shadowOpacity: .3, shadowRadius: 9, elevation: 5, overflow: 'hidden' }}>{locked ? <Text style={{ fontSize: 20, color: '#fff' }}>🔒</Text> : <Portrait index={person.image} imageUrl={person.imageUrl} name={person.name} height={40} radius={20} />}</View>
        <View style={{ width: 13, height: 13, backgroundColor: locked ? '#5b5673' : PURPLE, transform: [{ rotate: '45deg' }], marginTop: -7, borderRightWidth: 2, borderBottomWidth: 2, borderColor: '#fff' }} />
      </Pressable>;
    })}
    <View pointerEvents="none" style={{ position: 'absolute', left: 13, top: 13, maxWidth: compact ? 165 : 240, backgroundColor: 'rgba(255,255,255,.95)', borderRadius: 15, paddingHorizontal: 12, paddingVertical: 9, shadowColor: '#212043', shadowOpacity: .1, shadowRadius: 7 }}><Text style={{ fontFamily: 'Nunito', fontWeight: '900', color: INK, fontSize: 12 }}>{compact ? 'Drag to explore · Pinch to zoom' : 'Drag to explore · Scroll to zoom'}</Text><Text style={{ fontFamily: 'Nunito', color: '#72768d', fontSize: 11, marginTop: 1 }}>{markers.length} creatives visible</Text></View>
    <View style={{ position: 'absolute', right: 13, top: 13, gap: 7 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" onPress={() => changeZoom(1)} style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#212043', shadowOpacity: .13, shadowRadius: 7 }}><Text style={{ fontSize: 25, color: INK, lineHeight: 31 }}>+</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Zoom out" onPress={() => changeZoom(-1)} style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#212043', shadowOpacity: .13, shadowRadius: 7 }}><Text style={{ fontSize: 25, color: INK, lineHeight: 31 }}>−</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Recenter map" onPress={() => { setPan({ x: 0, y: 0 }); setZoomDelta(0); }} style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#212043', shadowOpacity: .13, shadowRadius: 7 }}><Text style={{ fontSize: 19, color: PURPLE }}>⌖</Text></Pressable>
    </View>
    <View pointerEvents="none" style={{ position: 'absolute', left: 12, bottom: 10, backgroundColor: 'rgba(255,255,255,.92)', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 4 }}><Text style={{ fontSize: 10, color: '#34304d' }}>© OpenStreetMap contributors</Text></View>
  </View>;
}
