import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Image, Linking, Modal, Platform, Pressable, ScrollView, StatusBar, Text, TextInput, View, useWindowDimensions } from 'react-native';
import brandLogo from './assets/whychoozeme-logo.png';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapCanvas from './src/MapCanvas';
import ChatWorkspace from './src/ChatWorkspace';
import { compressChatImage } from './src/chatImages';
import CarouselRow from './src/CarouselRow';
import HomeHighlights from './src/HomeHighlights';
import LocalCategoryShowcase from './src/LocalCategoryShowcase';
import PresenceStatus from './src/PresenceStatus';
import ResponseBadge from './src/ResponseBadge';
import ProfileWall from './src/ProfileWall';
import ProfileFramePicker from './src/ProfileFramePicker';
import type { ProfileFrameDesign } from './src/ProfileFrame';
import ProfileMedia from './src/ProfileMedia';
import ProfileBackground from './src/ProfileBackground';
import ProfileServices from './src/ProfileServices';
import FlaggedPortfolio from './src/FlaggedPortfolio';
import RichDescriptionEditor from './src/RichDescription';
import { DESCRIPTION_LIMIT } from './src/descriptionFormatting';
import { nextIncompleteStep, setupSteps, stepComplete, type CompletionState, type SetupRole, type SetupStep } from './src/profileCompletion';
import { documentUploadError, hasExactVideoRatio, photoUploadError, videoUploadError } from './src/mediaLimits';
import { ChatIcon, ChevronDown, InfoNavIcon, TabIcon } from './src/icons';
import { Button, color, Field, Heading, Portrait, TinyTag } from './src/UI';
import { categories, Category, ChatMessage, distanceKm, Finder, Freelancer, places, RequestPost, requestMatchesFreelancer, requestReach, talukaCenters, Taluka } from './src/data';
import * as live from './src/liveApi';
import { listPortfolioAssets, PortfolioAsset, removePortfolioAsset, replacePortfolioVideo, updatePortfolioCaption, uploadPortfolioAsset } from './src/portfolioApi';
import { profilePictureError, removeFinderPicture, uploadFinderPicture, uploadProfilePicture } from './src/profilePictureApi';
import { guestProfileVisit } from './src/guestAccess';
import { DesktopCategoryNavigation, MobileCategoryNavigation } from './src/CategoryNavigation';
import AuthPage from './src/AuthPage';
import SoftwarePicker from './src/SoftwarePicker';
import { normalizeLinks, PortfolioLink, publicHttpsUrl, SoftwareSkill } from './src/software';
import { AuthMode, authModeFromUrl, authUrl } from './src/authRoute';
import { publicWhatsapp, whatsappUrl, withoutWhatsapp } from './src/whatsapp';
import PlatformTerms from './src/PlatformTerms';
import ProfileReviews from './src/ProfileReviews';
import NotificationCenter, { type ActivityNotice } from './src/NotificationCenter';
import { ADMIN_PATH } from './src/adminRoute';
import type { ChatInboxEntry } from './src/chatInbox';

type Page = 'home' | 'auth' | 'search' | 'collection' | 'map' | 'account' | 'profile' | 'requests' | 'admin' | 'chats' | 'finderHub' | 'freelancerHub' | 'myPosts' | 'newRequest';
type Dialog = 'finder' | 'freelancer' | 'whatsapp' | 'request' | 'notifications' | 'setup' | 'safety' | null;
const setupLabels: Record<SetupStep, string> = { role: 'Choose how you use WhyChoozeMe', finder: 'Finder details', freelancer: 'Freelancer profile, photo and description' };
type InfoTopic = 'about' | 'contact' | 'mission';
const infoLinks: { id: InfoTopic; label: string }[] = [{ id: 'about', label: 'Who are we?' }, { id: 'contact', label: 'Contact us' }, { id: 'mission', label: 'Our mission' }];
const infoContent: Record<InfoTopic, { lead: string; detail: string }> = {
  about: { lead: 'A home for local skills and the people who need them.', detail: 'WhyChoozeMe helps you discover freelancers through their profiles, portfolios and reviews. Message a freelancer here or use the WhatsApp link they choose to publish.' },
  contact: { lead: 'We would love to hear from you.', detail: 'Our public contact email will appear here soon. You can keep exploring local talent while we finish setting it up.' },
  mission: { lead: 'Every skill deserves to be seen and valued.', detail: 'We help local creatives show their work and help Finders make a direct connection. The people involved arrange any work and payment themselves.' },
};
const T = ({ children, style, numberOfLines, ellipsizeMode }: { children: React.ReactNode; style?: any; numberOfLines?: number; ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip' }) => <Text numberOfLines={numberOfLines} ellipsizeMode={ellipsizeMode} style={[{ color: color.ink, fontFamily: 'Nunito', fontSize: 15 }, style]}>{children}</Text>;
const Label = ({ children }: { children: React.ReactNode }) => <T style={{ fontWeight: '900', fontSize: 13, marginBottom: 6 }}>{children}</T>;
const UnreadChatBadge = ({ count }: { count: number }) => count > 0 ? <View style={{ position: 'absolute', top: 0, right: 0, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 10, backgroundColor: color.coral, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontFamily: 'Nunito', fontWeight: '900', fontSize: 10 }}>{count > 99 ? '99+' : count}</Text></View> : null;
const CategoryIcon = ({ icon }: { icon: string }) => <View style={{ width: 20, height: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><Text style={{ fontSize: 16, lineHeight: 20, textAlign: 'center', textAlignVertical: 'center', transform: [{ translateY: -2 }] }}>{icon}</Text></View>;
function PopularSkillChip({ item, selected, onSelect }: { item: Category; selected: boolean; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onSelect} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} onFocus={() => setHovered(true)} onBlur={() => setHovered(false)} style={[{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: selected ? '#f0e7ff' : '#fff', borderRadius: 20, paddingHorizontal: 11, minHeight: 36, borderWidth: 1.5, borderColor: hovered ? color.purple : selected ? '#d8c3ff' : '#eee7e9', shadowColor: color.purple, shadowOpacity: hovered ? .16 : 0, shadowRadius: hovered ? 11 : 0, elevation: hovered ? 3 : 0, transform: [{ scale: hovered ? 1.06 : 1 }] }, Platform.OS === 'web' ? { cursor: 'pointer', transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease' } as any : null]}><CategoryIcon icon={item.icon} /><T style={{ color: selected || hovered ? color.purple : color.ink, fontSize: 12, fontWeight: '900' }}>{item.label}</T></Pressable>;
}
const PopularSkillChips = ({ items, selected, onSelect }: { items: Category[]; selected: string; onSelect: (item: Category) => void }) => <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>{items.map(item => <PopularSkillChip key={item.id} item={item} selected={selected === item.id} onSelect={() => onSelect(item)} />)}</View>;
function HeroWhisper({ children, style, delay = 0, tint = '#713af0', tilt = 0 }: { children: string; style: any; delay?: number; tint?: string; tilt?: number }) {
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<any>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ pointerId: number; x: number; y: number; startX: number; startY: number; lastX: number; lastY: number; lastTime: number; vx: number; vy: number } | null>(null);
  const frameRef = useRef<number | null>(null);
  const moveTo = (x: number, y: number) => { offsetRef.current = { x, y }; setOffset({ x, y }); };
  const bounds = () => {
    const node = bubbleRef.current as HTMLElement | null;
    if (!node?.parentElement) return { minX: -180, maxX: 180, minY: -100, maxY: 100 };
    const rect = node.getBoundingClientRect();
    const parent = node.parentElement.getBoundingClientRect();
    const current = offsetRef.current;
    return { minX: current.x + parent.left + 10 - rect.left, maxX: current.x + parent.right - 10 - rect.right, minY: current.y + parent.top + 10 - rect.top, maxY: current.y + parent.bottom - 10 - rect.bottom };
  };
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
  const stopMotion = () => { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); frameRef.current = null; };
  useEffect(() => () => { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); }, []);
  const onPointerDown = (event: any) => {
    if (Platform.OS !== 'web' || event.button !== 0) return;
    stopMotion();
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const now = performance.now();
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, startX: offsetRef.current.x, startY: offsetRef.current.y, lastX: event.clientX, lastY: event.clientY, lastTime: now, vx: 0, vy: 0 };
    setDragging(true);
  };
  const onPointerMove = (event: any) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const limits = bounds();
    moveTo(clamp(drag.startX + event.clientX - drag.x, limits.minX, limits.maxX), clamp(drag.startY + event.clientY - drag.y, limits.minY, limits.maxY));
    const now = performance.now();
    const elapsed = Math.max(1, now - drag.lastTime);
    drag.vx = (event.clientX - drag.lastX) / elapsed;
    drag.vy = (event.clientY - drag.lastY) / elapsed;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastTime = now;
  };
  const onPointerEnd = (event: any, toss: boolean) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (!toss) return;
    const limits = bounds();
    const start = offsetRef.current;
    const target = { x: clamp(start.x + drag.vx * 135, limits.minX, limits.maxX), y: clamp(start.y + drag.vy * 135 + 14, limits.minY, limits.maxY) };
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { moveTo(target.x, target.y); return; }
    const started = performance.now();
    const animate = (now: number) => {
      const t = Math.min(1, (now - started) / 560);
      const settled = 1 - Math.exp(-7 * t) * Math.cos(9 * t);
      moveTo(clamp(start.x + (target.x - start.x) * settled, limits.minX, limits.maxX), clamp(start.y + (target.y - start.y) * settled, limits.minY, limits.maxY));
      frameRef.current = t < 1 ? requestAnimationFrame(animate) : null;
    };
    frameRef.current = requestAnimationFrame(animate);
  };
  return <Pressable ref={bubbleRef} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} {...({ onPointerDown, onPointerMove, onPointerUp: (event: any) => onPointerEnd(event, true), onPointerCancel: (event: any) => onPointerEnd(event, false) } as any)} style={[{ position: 'absolute', zIndex: hovered || dragging ? 5 : 2, transform: [{ rotate: `${tilt}deg` }, { translateX: offset.x + (hovered && !dragging ? (tilt < 0 ? -8 : 8) : 0) }, { translateY: offset.y + (hovered && !dragging ? -5 : 0) }] }, style, Platform.OS === 'web' ? { cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none', userSelect: 'none', transition: dragging || frameRef.current !== null ? 'none' : 'transform 240ms cubic-bezier(.2,.85,.2,1)' } as any : null]}><View style={[{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: hovered || dragging ? '#d8c5ff' : 'rgba(255,255,255,.85)', backgroundColor: hovered || dragging ? 'rgba(255,255,255,.91)' : 'rgba(255,255,255,.65)', shadowColor: tint, shadowOpacity: hovered || dragging ? .2 : .09, shadowRadius: hovered || dragging ? 17 : 12 }, Platform.OS === 'web' ? { animation: dragging ? 'none' : `wcm-hero-float 6s ease-in-out ${delay}s infinite`, transition: 'border-color 230ms ease, background-color 230ms ease, box-shadow 230ms ease' } as any : null]}><T style={{ color: tint, fontSize: 12, fontWeight: '900' }}>{children}</T></View></Pressable>;
}
const AccountChevron = ({ open }: { open: boolean }) => <View style={{ width: 23, height: 23, borderRadius: 12, backgroundColor: open ? '#e9dcff' : '#f4eeff', alignItems: 'center', justifyContent: 'center' }}><ChevronDown size={15} color={color.purple} open={open} /></View>;
function HeaderInfoLink({ id, label, onPress }: { id: InfoTopic; label: string; onPress: () => void }) {
  const [hovered, setHovered] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={[{ minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 9, borderRadius: 12, backgroundColor: hovered ? '#f3edff' : 'transparent', transform: [{ translateY: hovered ? -1 : 0 }] }, Platform.OS === 'web' ? { cursor: 'pointer', transition: 'background-color 160ms ease, transform 160ms ease' } as any : null]}><InfoNavIcon name={id} size={16} color={color.purple} /><T style={{ fontSize: 12, fontWeight: '900', color: hovered ? color.purple : color.ink }}>{label}</T></Pressable>;
}
const finderChatPerson = (id: string, name: string, imageUrl?: string): Freelancer => ({ id, name, role: 'Finder', category: 'other', tags: [], taluka: 'Tiswadi', place: 'Goa', lat: talukaCenters.Tiswadi.lat, lon: talukaCenters.Tiswadi.lon, rating: 0, reviews: 0, distance: '', line: '', why: '', work: [], image: -1, imageUrl });

function useSaved<TValue>(key: string, initial: TValue): [TValue, (value: TValue | ((previous: TValue) => TValue)) => void] {
  const [state, setState] = useState<TValue>(() => { try { const v = (globalThis as any).localStorage?.getItem(key); return v ? JSON.parse(v) : initial; } catch { return initial; } });
  useEffect(() => { if (Platform.OS !== 'web') AsyncStorage.getItem(key).then(value => { if (value) setState(JSON.parse(value)); }).catch(() => {}); }, [key]);
  const save = useCallback((value: TValue | ((previous: TValue) => TValue)) => setState(previous => { const next = typeof value === 'function' ? (value as (previous: TValue) => TValue)(previous) : value; if (Platform.OS === 'web') { try { (globalThis as any).localStorage?.setItem(key, JSON.stringify(next)); } catch {} } else { AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {}); } return next; }), [key]);
  return [state, save];
}

function ProfileCard({ person, width, favorite, onFavorite, onOpen, onChat }: { person: Freelancer; width: number; favorite: boolean; onFavorite: () => void; onOpen: () => void; onChat: () => void; }) {
  const [hovered, setHovered] = useState(false);
  const whatsapp = publicWhatsapp(person.links, person.publicWhatsappUrl);
  return <Pressable accessibilityRole={Platform.OS === 'web' ? undefined : 'button'} accessibilityLabel={`Open ${person.name}'s profile`} onPress={onOpen} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={({ pressed }) => [{ width, backgroundColor: '#fff', borderRadius: 19, padding: 8, borderWidth: 1, borderColor: hovered ? '#d8c6fb' : '#f1ebea', shadowColor: hovered ? '#7655c7' : '#d8cbc3', shadowOpacity: hovered ? .18 : .08, shadowRadius: hovered ? 15 : 7, elevation: hovered ? 5 : 1, transform: [{ translateY: hovered ? -4 : pressed ? -1 : 0 }] }, Platform.OS === 'web' ? { transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease', cursor: 'pointer' } as any : null]}>
    <View><Portrait index={person.image} imageUrl={person.imageUrl} name={person.name} height={Math.max(155, width * .61)} radius={13} /><Pressable accessibilityLabel={favorite ? `Remove ${person.name} from saved` : `Save ${person.name}`} onPress={event => { event.stopPropagation?.(); onFavorite(); }} style={{ position: 'absolute', right: 9, top: 7, width: 30, height: 30, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.82)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 22, color: favorite ? color.coral : '#777' }}>{favorite ? '♥' : '♡'}</Text></Pressable>{whatsapp && <Pressable accessibilityRole="link" accessibilityLabel={`Open ${person.name}'s WhatsApp`} onPress={event => { event.stopPropagation?.(); void Linking.openURL(whatsapp); }} style={{ position: 'absolute', left: 9, bottom: 9, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 15, backgroundColor: '#eafff2', borderWidth: 1, borderColor: '#94e4b3' }}><T style={{ color: '#087a4c', fontSize: 11, fontWeight: '900' }}>WhatsApp ↗</T></Pressable>}</View>
    <View style={{ paddingHorizontal: 7, paddingTop: 7, flex: 1 }}><T style={{ fontSize: 16, fontWeight: '900' }}>{person.name}{person.premium && <Text style={{ color: '#a26800', fontSize: 11 }}>  ★ Premium</Text>}</T><View style={{ alignSelf: 'flex-start', marginTop: 4, backgroundColor: '#fff1d9', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}><T style={{ color: '#865018', fontSize: 12, fontWeight: '900' }}>✦ {person.role}</T></View><View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 }}><T style={{ fontSize: 14 }}>{person.reviews ? <><Text style={{ color: '#ffad24' }}>★</Text> <Text style={{ fontWeight: '900' }}>{person.rating.toFixed(1)}</Text> <Text style={{ color: '#85869f' }}>({person.reviews})</Text></> : <Text style={{ color: color.purple, fontWeight: '900' }}>New</Text>}</T><T style={{ fontSize: 12, color: '#888ba1' }}>⌖ {person.distance}</T></View><View style={{ height: 37, marginTop: 7, paddingTop: 2, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 7 }}><PresenceStatus person={person} /><ResponseBadge person={person} side /></View><T style={{ fontSize: 14, height: 47, marginTop: 7, lineHeight: 19, overflow: 'hidden' }} numberOfLines={2} ellipsizeMode="tail">{person.line}</T><View style={{ flexDirection: 'row', gap: 7, marginTop: 8, marginBottom: 5 }}><Pressable accessibilityRole="button" accessibilityLabel={`View ${person.name}'s profile`} onPress={event => { event.stopPropagation?.(); onOpen(); }} style={{ flex: 1, minHeight: 39, borderRadius: 22, backgroundColor: color.purple, alignItems: 'center', justifyContent: 'center' }}><T style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>View profile</T></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Message ${person.name}`} onPress={event => { event.stopPropagation?.(); onChat(); }} style={{ minWidth: 68, paddingHorizontal: 8, height: 39, borderWidth: 1, borderColor: '#dcdde2', borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}><T style={{ color: color.purple, fontWeight: '900', fontSize: 12 }}>Message</T></Pressable></View></View>
  </Pressable>;
}
function ActionTile({ icon, title, detail, onPress, tone = '#efe8ff', wide = false }: { icon: string; title: string; detail: string; onPress: () => void; tone?: string; wide?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return <Pressable accessibilityRole="button" onPress={onPress} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={{ flexGrow: 1, flexBasis: wide ? 420 : 295, minWidth: 230, minHeight: 174, borderRadius: 19, backgroundColor: '#fff', borderWidth: 1, borderColor: hovered ? '#b8cfff' : '#d9e7ff', padding: 21, justifyContent: 'space-between', shadowColor: '#335eaa', shadowOpacity: hovered ? .13 : .05, shadowRadius: hovered ? 15 : 8, elevation: hovered ? 3 : 1, transform: [{ translateY: hovered ? -3 : 0 }], ...(Platform.OS === 'web' ? { transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease', cursor: 'pointer' } as any : {}) }}><View style={{ width: 55, height: 55, borderRadius: 16, backgroundColor: tone, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 27 }}>{icon}</Text></View><View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}><View style={{ flex: 1 }}><T style={{ fontSize: 17, fontWeight: '900' }}>{title}</T><T style={{ color: '#60759b', fontSize: 13, marginTop: 5, lineHeight: 19 }}>{detail}</T></View><T style={{ color: '#6784b5', fontSize: 24 }}>›</T></View></Pressable>;
}
function CompletionRing({ percent }: { percent: number }) {
  return <View style={{ width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee7ff', ...(Platform.OS === 'web' ? { backgroundImage: `conic-gradient(#6c37f4 ${percent}%, #eee7ff ${percent}% 100%)` } as any : { borderWidth: 8, borderColor: percent === 100 ? '#6c37f4' : '#c7b2fa' }) }}><View style={{ width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}><T style={{ fontSize: 23, fontWeight: '900', color: '#122657' }}>{percent}%</T></View></View>;
}
function DirectoryLoading({ place }: { place: string }) {
  return <View accessibilityLabel="Loading creatives" style={{ maxWidth: 1540, width: '100%', alignSelf: 'center', padding: 32, marginTop: 14, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', gap: 10 }}><ActivityIndicator color={color.purple} /><T style={{ color: color.muted, fontSize: 13 }}>Finding creatives {place === 'Goa' ? 'in Goa' : `near ${place}`}…</T></View>;
}
function Overlay({ visible, title, onClose, children, width = 560 }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}><View style={{ flex: 1, backgroundColor: 'rgba(15,13,43,.48)', alignItems: 'center', justifyContent: 'center', padding: 16 }}><View style={{ backgroundColor: '#fffaf7', borderRadius: 25, width: '100%', maxWidth: width, maxHeight: '93%', overflow: 'hidden', shadowColor: '#191043', shadowOpacity: .24, shadowRadius: 20 }}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 19, paddingBottom: 14 }}><Heading size={23}>{title}</Heading><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0e8f5', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: color.ink, fontSize: 22 }}>×</Text></Pressable></View><ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 25 }}>{children}</ScrollView></View></View></Modal>;
}

export default function App() {
  const { width: screenWidth } = useWindowDimensions();
  const compact = screenWidth < 680, tablet = screenWidth >= 680 && screenWidth < 1100, narrow = screenWidth < 560, pagePadding = narrow ? 14 : 24;
  const [page, setPage] = useState<Page>(() => Platform.OS === 'web' && globalThis.location.pathname === '/auth' ? 'auth' : 'home');
  const authReturnPage = useRef<Page>('home');
  const authOpenedInApp = useRef(false);
  const [detailReturnPage, setDetailReturnPage] = useState<Page>('home');
  const [collection, setCollection] = useState<{ title: string; category: string }>({ title: 'All creatives', category: 'all' });
  const [chatReturnPage, setChatReturnPage] = useState<Page>('home');
  const scrollRef = useRef<ScrollView>(null);
  const avatarMenuRef = useRef<View>(null);
  const mobilePlaceMenuRef = useRef<View>(null);
  const desktopPlaceMenuRef = useRef<View>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [menu, setMenu] = useState<'place' | 'avatar' | 'sort' | null>(null);
  const [profile, setProfile] = useState<Freelancer | null>(null);
  const [pendingScrollTarget, setPendingScrollTarget] = useState<{ id: string; page: Page; profileId?: string } | null>(null);
  useEffect(() => {
    if (!pendingScrollTarget || Platform.OS !== 'web') return;
    if (page !== pendingScrollTarget.page || (pendingScrollTarget.profileId && profile?.id !== pendingScrollTarget.profileId)) return;
    let reviewSectionShown = false;
    const scrollToTarget = () => {
      const target = document.getElementById(pendingScrollTarget.id);
      if (!target) {
        if (!reviewSectionShown && pendingScrollTarget.id.startsWith('review-')) {
          const section = document.getElementById('profile-reviews');
          if (section) { section.scrollIntoView({ behavior: 'smooth', block: 'center' }); reviewSectionShown = true; }
        }
        return false;
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setPendingScrollTarget(null);
      return true;
    };
    if (scrollToTarget()) return;
    const observer = new MutationObserver(() => { if (scrollToTarget()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    const timeout = setTimeout(() => { observer.disconnect(); setPendingScrollTarget(current => current === pendingScrollTarget ? null : current); }, 6000);
    return () => { observer.disconnect(); clearTimeout(timeout); };
  }, [pendingScrollTarget, page, profile?.id]);
  useEffect(() => {
    if (!menu || Platform.OS !== 'web') return;
    const closeOutside = (event: PointerEvent) => {
      const root = menu === 'avatar' ? avatarMenuRef.current : compact ? mobilePlaceMenuRef.current : desktopPlaceMenuRef.current;
      if (!(root as unknown as HTMLElement | null)?.contains(event.target as Node)) setMenu(null);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [menu, compact]);
  const [mapShortcutHovered, setMapShortcutHovered] = useState(false);
  const [heroSearchFocused, setHeroSearchFocused] = useState(false);
  const [place, setPlace] = useState('Goa'), [radius, setRadius] = useState('Local');
  const [category, setCategory] = useState('all'), [searchDraft, setSearchDraft] = useState(''), [search, setSearch] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState<'Nearby' | 'Top rated' | 'Most reviewed'>('Nearby');
  useLayoutEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [page, profile?.id]);
  const [chatPairs, setChatPairs] = useState<Awaited<ReturnType<typeof live.getChatPartners>>>([]);
  const [finder, setFinder] = useState<Finder | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [accountKind, setAccountKind] = useState<live.AccountKind | null>(null);
  const [signedInRole, setSignedInRole] = useState<live.AccountKind | null>(null);
  const [accountDisplayName, setAccountDisplayName] = useState('');
  const [setupRole, setSetupRole] = useState<SetupRole | null>(null);
  const [setupStep, setSetupStep] = useState<SetupStep>('role');
  const [accountLoaded, setAccountLoaded] = useState(false);
  const [setupReturn, setSetupReturn] = useState(false);
  const [setupLoadError, setSetupLoadError] = useState('');
  const setupPrompted = useRef<Set<string>>(new Set());
  const [authReady, setAuthReady] = useState(false);
  const [guestLimitPrompt, setGuestLimitPrompt] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [infoDialog, setInfoDialog] = useState<InfoTopic | null>(null);
  const [legalOpen, setLegalOpen] = useState(false);
  const [livePeople, setLivePeople] = useState<Freelancer[]>([]);
  const [peopleLoaded, setPeopleLoaded] = useState(false);
  const [peopleLoadError, setPeopleLoadError] = useState('');
  const [catalog, setCatalog] = useState<Category[]>(categories);
  const [authMode, setAuthMode] = useState<AuthMode>(() => Platform.OS === 'web' ? authModeFromUrl(globalThis.location.pathname, globalThis.location.search) : 'signIn');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [codeSentTo, setCodeSentTo] = useState('');
  const [applications, setApplications] = useState<Record<string, any[]>>({});
  const [applyDraft, setApplyDraft] = useState<Record<string, string>>({});
  const [remoteNotices, setRemoteNotices] = useState<ActivityNotice[]>([]);
  const [unreadNotices, setUnreadNotices] = useState(0);
  const [profileStats, setProfileStats] = useState({ profileViews: 0, saves: 0 });
  const [showProfileActivity, setShowProfileActivity] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0);
  const [chatInbox, setChatInbox] = useState<Record<string, ChatInboxEntry>>({});
  const [chatFileBusy, setChatFileBusy] = useState(false);
  const chatInboxGeneration = useRef(0);
  const chatLoadGeneration = useRef(0);
  const [admin, setAdmin] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [chatRoute, setChatRoute] = useState<{ finderId: string; freelancerId: string } | null>(null);
  const [pendingContact, setPendingContact] = useState<Freelancer | null>(null);
  const [pendingSafety, setPendingSafety] = useState<Freelancer | null>(null);
  const [guestFavorites, setGuestFavorites] = useSaved<string[]>('wcm-favorites', []);
  const [accountFavorites, setAccountFavorites] = useState<string[]>([]);
  const favorites = userId ? accountFavorites : guestFavorites;
  const [guestViewedProfileIds, setGuestViewedProfileIds] = useSaved<string[]>('wcm-guest-profile-views', []);
  const [requests, setRequests] = useState<RequestPost[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [portfolioAssets, setPortfolioAssets] = useState<Record<string, PortfolioAsset[]>>({});
  const [profileFrames, setProfileFrames] = useState<ProfileFrameDesign[]>([]);
  const [contentFlags, setContentFlags] = useState<live.ContentModerationFlag[]>([]);
  const [blockedFreelancers, setBlockedFreelancers] = useState<string[]>([]);
  const [safetyTarget, setSafetyTarget] = useState<Freelancer | null>(null);
  const [safetyReason, setSafetyReason] = useState('');
  const [safetyBusy, setSafetyBusy] = useState(false);
  const [ownProfile, setOwnProfile] = useState<Freelancer | null>(null);
  const [spaceView, setSpaceView] = useState<'finder' | 'freelancer' | null>(null);
  const hasOwnProfile = !!userId && ownProfile?.id === userId;
  const preferredSpaceView = spaceView || (signedInRole === 'freelancer' || (!signedInRole && ownProfile) ? 'freelancer' : 'finder');
  const finderSpace = (!!finder && (!ownProfile || preferredSpaceView === 'finder')) || (!ownProfile && (signedInRole || setupRole) === 'finder');
  const completionState: CompletionState = useMemo(() => ({ role: setupRole, finder: !!finder, freelancer: !!ownProfile,
    photo: !!ownProfile?.imageUrl, description: !!ownProfile?.description?.trim() }), [setupRole, finder, ownProfile]);
  const completionSteps = setupSteps(completionState);
  const completedSteps = completionSteps.filter(step => stepComplete(step, completionState)).length;
  const accountChecklist = finderSpace ? [
    { label: 'Finder name', done: !!finder?.name },
    { label: 'Your area', done: !!finder?.taluka },
  ] : ownProfile ? [
    { label: 'Profile photo added', done: !!ownProfile.imageUrl },
    { label: 'Basic information', done: !!(ownProfile.name && ownProfile.role && ownProfile.why) },
    { label: 'Skills & expertise', done: !!(ownProfile.category && (ownProfile.description || ownProfile.tags.length)) },
    { label: 'Add portfolio (optional)', done: !!(ownProfile.work.length || ownProfile.links?.length) },
  ] : [{ label: 'Choose how you use WhyChoozeMe', done: false }];
  const accountPercent = Math.round(accountChecklist.filter(item => item.done).length / accountChecklist.length * 100);
  const [finderName, setFinderName] = useState(''), [finderEmail, setFinderEmail] = useState(''), [finderTaluka, setFinderTaluka] = useState<Taluka>('Tiswadi');
  const [finderImageFile, setFinderImageFile] = useState<File | null>(null);
  const [finderImagePreview, setFinderImagePreview] = useState('');
  const [formName, setFormName] = useState(''), [formRole, setFormRole] = useState(''), [formCategory, setFormCategory] = useState('photography'), [customCategory, setCustomCategory] = useState(''), [formWhy, setFormWhy] = useState(''), [formDescription, setFormDescription] = useState(''), [formSoftware, setFormSoftware] = useState<SoftwareSkill[]>([]), [formLinksText, setFormLinksText] = useState(''), [formImage, setFormImage] = useState(''), [formWork, setFormWork] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState('');
  const [requestTitle, setRequestTitle] = useState(''), [requestDetails, setRequestDetails] = useState(''), [requestCategory, setRequestCategory] = useState('design');
  const [chatPerson, setChatPerson] = useState<Freelancer | null>(null), [chatDraft, setChatDraft] = useState(''), [notice, setNotice] = useState(''), [formError, setFormError] = useState('');
  useEffect(() => { setFormError(''); }, [dialog]);
  useEffect(() => { if (!formImageFile || Platform.OS !== 'web') { setFormImagePreview(''); return; } const url = URL.createObjectURL(formImageFile); setFormImagePreview(url); return () => URL.revokeObjectURL(url); }, [formImageFile]);
  useEffect(() => { if (!finderImageFile || Platform.OS !== 'web') { setFinderImagePreview(''); return; } const url = URL.createObjectURL(finderImageFile); setFinderImagePreview(url); return () => URL.revokeObjectURL(url); }, [finderImageFile]);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onPopState = (event: PopStateEvent) => {
      const snapshot = event.state?.wcm;
      if (snapshot?.page === 'profile') setProfile(snapshot.profile || null);
      if (snapshot?.collection) setCollection(snapshot.collection);
      if (snapshot?.chatPerson !== undefined) setChatPerson(snapshot.chatPerson);
      if (snapshot?.chatRoute !== undefined) setChatRoute(snapshot.chatRoute);
      if (snapshot?.page === 'auth' || globalThis.location.pathname === '/auth') {
        setAuthMode(authModeFromUrl(globalThis.location.pathname, globalThis.location.search));
        setPage('auth');
      } else setPage(snapshot?.page || 'home');
    };
    globalThis.addEventListener('popstate', onPopState);
    return () => globalThis.removeEventListener('popstate', onPopState);
  }, []);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const key = [page, page === 'profile' ? profile?.id : '', page === 'collection' ? collection.category : '', page === 'chats' ? chatPerson?.id : ''].join(':');
    const snapshot = { key, page, profile: page === 'profile' ? profile : null, collection, chatPerson: page === 'chats' ? chatPerson : null, chatRoute: page === 'chats' ? chatRoute : null };
    const url = page === 'auth' ? authUrl(authMode) : '/';
    if (globalThis.history.state?.wcm?.key === key || !globalThis.history.state?.wcm) globalThis.history.replaceState({ wcm: snapshot }, '', url);
    else globalThis.history.pushState({ wcm: snapshot }, '', url);
  }, [page, profile, collection, chatPerson, chatRoute, authMode]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 6000); return () => clearTimeout(timer); }, [notice]);
  const refreshPeople = useCallback(async () => { try { setLivePeople(await live.getFreelancers()); setPeopleLoadError(''); } catch (error) { setPeopleLoadError((error as Error).message); setNotice((error as Error).message); } finally { setPeopleLoaded(true); } }, []);
  const refreshAccount = useCallback(async (id: string) => {
    try {
      setAccountLoaded(false);
      const people = await live.getFreelancers(); setLivePeople(people); setPeopleLoadError(''); setPeopleLoaded(true); setOwnProfile(people.find(person => person.id === id) || null);
      const auth = await live.account();
      const meta = auth.user?.user_metadata;
      setAccountDisplayName(meta?.display_name || auth.user?.email?.split('@')[0] || 'Member');
      setSignedInRole(meta?.account_type === 'freelancer' ? 'freelancer' : meta?.account_type === 'finder' ? 'finder' : null);
      const result = await live.getFinder(id);
      setSetupRole(current => current || (meta?.account_type === 'freelancer' ? 'freelancer' : meta?.account_type === 'finder' ? 'finder' : people.some(person => person.id === id) ? 'freelancer' : result ? 'finder' : null));
      if (result) { setFinder({ name: result.display_name, email: auth.user?.email || '', taluka: result.taluka, avatarPath: result.avatar_path || undefined, imageUrl: live.finderAvatarUrl(result.avatar_path) }); }
      else {
        if (meta?.display_name && meta?.taluka && meta?.account_type !== 'freelancer') {
          await live.saveFinder(id, meta.display_name, meta.taluka);
          setFinder({ name: meta.display_name, email: auth.user?.email || '', taluka: meta.taluka });
        } else if (meta?.account_type === 'freelancer') {
          setFinder(null);
          if (meta.taluka) setFinderTaluka(meta.taluka);
        }
      }
      if (meta?.display_name) setFormName(current => current || meta.display_name);
      setSetupLoadError('');
      const posts = await live.getRequests(id); setRequests(posts);
      const groups = await Promise.all(posts.map(async post => [post.id, await live.getApplications(post.id)] as const));
      setApplications(Object.fromEntries(groups));
      setRemoteNotices(await live.getNotifications());
      setUnreadNotices(await live.getUnreadNotificationCount());
      setBlockedFreelancers(await live.getBlockedFreelancers().catch(() => []));
      setAccountFavorites(await live.getSavedProfiles());
      if (people.some(person => person.id === id)) setProfileStats(await live.getMyProfileStats());
      setChatPairs(await live.getChatPartners(id));
      const inboxGeneration = ++chatInboxGeneration.current;
      await live.getChatInbox(id).then(inbox => { if (inboxGeneration === chatInboxGeneration.current) { setChatInbox(inbox); setUnreadChats(Object.values(inbox).reduce((total, entry) => total + entry.unread, 0)); } }).catch(() => { if (inboxGeneration === chatInboxGeneration.current) { setChatInbox({}); setUnreadChats(0); } });
      const hasAdmin = await live.isAdmin(id); setAdmin(hasAdmin); if (hasAdmin) setSuggestions(await live.getCategorySuggestions());
    } catch (error) { setNotice((error as Error).message); setSetupLoadError((error as Error).message); }
    finally { setAccountLoaded(true); }
  }, [setFinder, setOwnProfile, setRequests]);
  const refreshChatPairs = useCallback(async () => { if (!userId) return; try { setChatPairs(await live.getChatPartners(userId)); } catch (error) { setNotice((error as Error).message); } }, [userId]);
  const refreshChatInbox = useCallback(async () => { if (!userId) return; const generation = ++chatInboxGeneration.current; try { const inbox = await live.getChatInbox(userId); if (generation === chatInboxGeneration.current) { setChatInbox(inbox); setUnreadChats(Object.values(inbox).reduce((total, entry) => total + entry.unread, 0)); } } catch (error) { setNotice((error as Error).message); } }, [userId]);
  const loadChat = useCallback(async (person: Freelancer) => {
    if (!userId || !chatRoute) return;
    const generation = ++chatLoadGeneration.current;
    try {
      const rows = await live.getMessages(chatRoute.finderId, chatRoute.freelancerId);
      if (generation !== chatLoadGeneration.current) return;
      const displayRows = rows.map((row: any) => ({ id: row.id, freelancerId: person.id, body: row.body, from: row.sender_id === chatRoute.finderId ? 'finder' as const : 'freelancer' as const, time: new Date(row.created_at).getTime() }));
      // Fetch attachment metadata before showing message rows so images never flash as filenames.
      try {
        const attachments = await live.getChatAttachments(rows.map((row: any) => row.id));
        if (generation === chatLoadGeneration.current) setMessages(displayRows.map(row => ({ ...row, attachment: attachments[row.id] })));
      } catch (error) {
        if (generation === chatLoadGeneration.current) setMessages(displayRows);
        setNotice((error as Error).message);
      }
      try {
        await live.markChatRead(chatRoute.finderId, chatRoute.freelancerId, rows.filter((row: any) => row.sender_id !== userId).map((row: any) => row.id));
        await refreshChatInbox();
      } catch (error) { setNotice(`Could not mark chat as read: ${(error as Error).message}`); }
    } catch (error) { setNotice((error as Error).message); }
  }, [userId, chatRoute, refreshChatInbox]);
  useEffect(() => { let active = true; live.account().then(({ user }) => { if (active) setUserId(user?.email_confirmed_at ? user.id : null); }).catch(error => setNotice(error.message)).finally(() => { if (active) setAuthReady(true); }); refreshPeople(); live.getCategories().then(setCatalog).catch(error => setNotice(error.message)); live.getProfileFrames().then(setProfileFrames).catch(() => {}); const subscription = live.db?.auth.onAuthStateChange((_event, session) => { setUserId(session?.user?.email_confirmed_at ? session.user.id : null); }); return () => { active = false; subscription?.data.subscription.unsubscribe(); }; }, [refreshPeople]);
  useEffect(() => { if (!userId) { chatLoadGeneration.current += 1; setFinder(null); setFinderImageFile(null); setSignedInRole(null); setAccountDisplayName(''); setSetupRole(null); setAccountLoaded(false); setChatPairs([]); setRequests([]); setRemoteNotices([]); setUnreadNotices(0); setUnreadChats(0); setChatInbox({}); setAccountFavorites([]); setBlockedFreelancers([]); setProfileStats({ profileViews: 0, saves: 0 }); setShowProfileActivity(false); setSpaceView(null); setAdmin(false); setOwnProfile(null); setMessages([]); setPortfolioAssets({}); return; } setSpaceView(null); refreshAccount(userId); }, [userId, refreshAccount]);
  useEffect(() => {
    if (!userId || !accountLoaded || setupLoadError || setupPrompted.current.has(userId)) return;
    setupPrompted.current.add(userId);
    const missing = nextIncompleteStep(completionState);
    if (missing) { setSetupStep(missing); setDialog(current => current || 'setup'); }
  }, [userId, accountLoaded, setupLoadError, completionState]);
  useEffect(() => { const timer = setInterval(refreshPeople, 60_000); return () => clearInterval(timer); }, [refreshPeople]);
  useEffect(() => { if (page === 'account' && hasOwnProfile) void live.getMyProfileStats().then(setProfileStats).catch(() => {}); }, [page, hasOwnProfile]);
  useEffect(() => {
    if (!userId || ownProfile?.id !== userId) return;
    let active = true;
    const pulse = async () => {
      if (!active || (Platform.OS === 'web' ? document.visibilityState !== 'visible' : AppState.currentState !== 'active')) return;
      try { await live.markFreelancerActive(userId); if (active) await refreshPeople(); } catch { /* Presence is optional until its migration is applied. */ }
    };
    pulse();
    const timer = setInterval(pulse, 60_000);
    if (Platform.OS === 'web') document.addEventListener('visibilitychange', pulse);
    const appState = Platform.OS === 'web' ? null : AppState.addEventListener('change', state => { if (state === 'active') pulse(); });
    return () => { active = false; clearInterval(timer); if (Platform.OS === 'web') document.removeEventListener('visibilitychange', pulse); appState?.remove(); };
  }, [userId, ownProfile?.id, refreshPeople]);
  useEffect(() => { if (!userId || !live.db) return; const channel = live.db.channel(`user-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => { live.getNotifications().then(setRemoteNotices).catch(() => {}); live.getUnreadNotificationCount().then(setUnreadNotices).catch(() => {}); if (hasOwnProfile) void live.getMyProfileStats().then(setProfileStats).catch(() => {}); if (chatPerson && chatRoute) void loadChat(chatPerson); else void refreshChatInbox(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => { refreshAccount(userId); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => { if (chatPerson && chatRoute) void loadChat(chatPerson); else void refreshChatInbox(); void refreshChatPairs(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_attachments' }, () => { if (chatPerson && chatRoute) void loadChat(chatPerson); })
    .subscribe(); return () => { live.db?.removeChannel(channel); }; }, [userId, chatPerson, chatRoute, hasOwnProfile, refreshAccount, refreshChatPairs, refreshChatInbox, loadChat]);
  useEffect(() => { if (chatPerson) loadChat(chatPerson); }, [chatPerson, loadChat]);
  const profileId = profile?.id, profileIsSample = !!profile?.demo;
  useEffect(() => { if (!profileId || profileIsSample) return; let active = true; listPortfolioAssets(profileId).then(items => { if (active) setPortfolioAssets(previous => ({ ...previous, [profileId]: items })); }).catch(error => setNotice(error.message)); return () => { active = false; }; }, [profileId, profileIsSample]);
  useEffect(() => { if (!userId) { setContentFlags([]); return; } let active = true; live.getMyContentFlags(userId).then(items => { if (active) setContentFlags(items); }).catch(error => setNotice(error.message)); return () => { active = false; }; }, [userId, profileId]);
  const allPeople = livePeople;
  const displayedRequests = requests;
  const finderPosts = displayedRequests.filter(post => post.finderId === userId);
  const messageKey = (person: Freelancer) => person.id;
  const chatPeople = [...new Map(chatPairs.map(item => {
    const id = item.id;
    const actual = allPeople.find(person => person.id === id);
    return [id, actual || finderChatPerson(id, item.finderName, item.finderImageUrl)];
  })).values()].sort((a, b) => (chatInbox[b.id]?.lastAt || 0) - (chatInbox[a.id]?.lastAt || 0));
  const activeChatId = chatRoute && userId ? chatRoute.finderId === userId ? chatRoute.freelancerId : chatRoute.finderId : null;
  const activeChatPerson = activeChatId
    ? allPeople.find(person => person.id === activeChatId) || (chatPerson?.id === activeChatId ? chatPerson : null) || chatPeople.find(person => person.id === activeChatId) || null
    : null;
  const displayMessages = messages;
  const center = place !== 'Goa' ? talukaCenters[place as Taluka] : null;
  const visiblePeople = useMemo(() => { const term = search.trim().toLowerCase(); let list = allPeople.filter(person => { const cat = category === 'all' || person.category === category || (category === 'other' && !catalog.some(item => item.id === person.category)); const text = !term || [person.name, person.role, person.place, person.category, ...person.tags].join(' ').toLowerCase().includes(term); const km = center ? distanceKm(center, person) : 0; const local = !center || radius === 'All Goa' || (radius === 'Local' ? person.taluka === place : km <= (radius === '10 km' ? 10 : 25)); return cat && text && local; }); if (sort === 'Top rated') list = list.sort((a, b) => b.rating - a.rating); else if (sort === 'Most reviewed') list = list.sort((a, b) => b.reviews - a.reviews); else if (center) list = list.sort((a, b) => distanceKm(center, a) - distanceKm(center, b)); return center ? list.map(person => ({ ...person, distance: `${distanceKm(center, person).toFixed(1)} km` })) : list; }, [allPeople, catalog, category, center, search, place, radius, sort]);
  const mapPeople = useMemo(() => allPeople.filter(person => !center || radius === 'All Goa' || (radius === 'Local' ? person.taluka === place : distanceKm(center, person) <= (radius === '10 km' ? 10 : 25))), [allPeople, center, place, radius]);
  const searchPeople = savedOnly ? visiblePeople.filter(person => favorites.includes(person.id)) : visiblePeople;
  const expandedPeople = visiblePeople;
  const expandedSearchPeople = searchPeople;
  const contentWidth = Math.min(screenWidth, 1540) - pagePadding * 2;
  const columns = contentWidth >= 1400 ? 5 : contentWidth >= 1080 ? 4 : contentWidth >= 760 ? 3 : contentWidth >= 500 ? 2 : 1;
  const visibleColumns = Math.min(columns, Math.max(1, expandedPeople.length));
  // Leave room for the browser scrollbar, which useWindowDimensions includes on web.
  const cardWidth = Math.min(360, Math.floor((contentWidth - (visibleColumns - 1) * 13 - 18) / visibleColumns));
  const mobileCardWidth = Math.min(contentWidth, 480);
  const carouselCardWidth = Math.min(compact ? 270 : 278, Math.max(230, contentWidth - 8));
  const carouselViewportWidth = compact ? Math.min(screenWidth, 540) - pagePadding * 2 : contentWidth;
  const homePeople = allPeople.filter(person => !center || radius === 'All Goa' || (radius === 'Local' ? person.taluka === place : distanceKm(center, person) <= (radius === '10 km' ? 10 : 25)));
  const categoryPopularity = new Map<string, number>();
  homePeople.forEach(person => categoryPopularity.set(person.category, (categoryPopularity.get(person.category) || 0) + 1));
  const popularOrder = ['photography', 'design', 'video', 'events', 'music'];
  const popularCategories = catalog.filter(item => item.id !== 'all' && item.id !== 'other')
    .sort((a, b) => (categoryPopularity.get(b.id) || 0) - (categoryPopularity.get(a.id) || 0)
      || (popularOrder.indexOf(a.id) < 0 ? 99 : popularOrder.indexOf(a.id)) - (popularOrder.indexOf(b.id) < 0 ? 99 : popularOrder.indexOf(b.id)))
    .slice(0, 4);
  const carouselGroups = [
    { title: 'Freelancers near you', detail: 'A little bit of everything, right around you.', category: 'all', people: homePeople },
    { title: 'Video editors', detail: 'Reels, films and edits with personality.', category: 'video', people: homePeople.filter(person => person.category === 'video') },
    { title: 'Event planners', detail: 'People who make good times happen.', category: 'events', people: homePeople.filter(person => person.category === 'events') },
    { title: 'Music teachers', detail: 'Find your rhythm with a local teacher.', category: 'music', people: homePeople.filter(person => person.category === 'music') },
  ];
  const openAuth = (mode: AuthMode, limit = false) => {
    if (page !== 'auth') authReturnPage.current = page;
    authOpenedInApp.current = true;
    setAccountKind(null);
    setGuestLimitPrompt(limit); setFormError(''); setAuthMessage(''); setEmailCode(''); setCodeSentTo(''); setAuthMode(mode); setDialog(null); setMenu(null); setPage('auth');
  };
  const switchAuthMode = (mode: AuthMode) => {
    setAuthMode(mode); setFormError(''); setAuthMessage(''); setEmailCode(''); setCodeSentTo('');
    if (Platform.OS === 'web') globalThis.history.replaceState(globalThis.history.state, '', authUrl(mode));
  };
  const leaveAuth = () => {
    setGuestLimitPrompt(false); setFormError(''); setAuthMessage(''); setEmailCode(''); setCodeSentTo('');
    if (Platform.OS === 'web' && globalThis.location.pathname === '/auth' && authOpenedInApp.current) { authOpenedInApp.current = false; globalThis.history.back(); return; }
    setPage(authReturnPage.current === 'auth' ? 'home' : authReturnPage.current);
    if (Platform.OS === 'web' && globalThis.location.pathname === '/auth') globalThis.history.replaceState({ wcm: { key: 'home:::', page: 'home' } }, '', '/');
  };
  const openCollection = (title: string, selectedCategory: string) => { setCollection({ title, category: selectedCategory }); setCategory(selectedCategory); setSearch(''); setSearchDraft(''); setPage('collection'); setMenu(null); };
  const openHighlightedCategory = (item: Category) => { if (compact) { setCategory(item.id); setSavedOnly(false); setSearch(''); setSearchDraft(''); setPage('search'); } else openCollection(item.label, item.id); };
  const openProfile = (person: Freelancer) => {
    if (!userId && authReady) {
      const visit = guestProfileVisit(Array.isArray(guestViewedProfileIds) ? guestViewedProfileIds : [], person.id);
      if (!visit.allowed) { openAuth('signIn', true); return; }
      setGuestViewedProfileIds(visit.viewed);
    }
    if (page !== 'profile') setDetailReturnPage(page);
    setProfile(person); setPage('profile'); setMenu(null);
    if (userId && !person.demo && person.id !== userId) void live.recordProfileView(person.id).catch(() => {});
  };
  const openContact = (person: Freelancer) => { if (!userId) { openAuth('signIn'); return; } if (person.demo) { setNotice('This sample profile is not accepting messages.'); return; } if (person.id === userId) { setNotice('This is your own profile.'); return; } if (blockedFreelancers.includes(person.id)) { setNotice('Unblock this freelancer before starting a chat.'); return; } if (!finder) { setPendingContact(person); setFinderName(ownProfile?.name || finderName); setFinderTaluka(ownProfile?.taluka || finderTaluka); setDialog('finder'); setNotice('Add your Finder details to start a conversation.'); return; } setChatRoute({ finderId: userId, freelancerId: person.id }); setChatReturnPage(page); setChatPerson(person); setPage('chats'); setMenu(null); };
  const selectChat = (person: Freelancer) => { const pair = chatPairs.find(item => item.id === person.id); const route = pair ? { finderId: pair.finderId, freelancerId: pair.freelancerId } : chatRoute?.freelancerId === person.id ? chatRoute : null; if (!route) return; const unread = chatInbox[person.id]?.unread || 0; if (unread) { chatInboxGeneration.current += 1; setChatInbox(previous => ({ ...previous, [person.id]: { ...previous[person.id], unread: 0 } })); setUnreadChats(previous => Math.max(0, previous - unread)); } setChatRoute(route); setChatPerson(person); };
  const toggleFavorite = (id: string) => {
    if (!userId) { setGuestFavorites(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]); return; }
    if (allPeople.find(person => person.id === id)?.demo) { setNotice('Sample profiles cannot receive saves.'); return; }
    if (id === userId) { setNotice('This is your own profile.'); return; }
    const saved = !accountFavorites.includes(id);
    setAccountFavorites(previous => saved ? [...previous, id] : previous.filter(value => value !== id));
    void live.setProfileSaved(userId, id, saved).catch(error => {
      setAccountFavorites(previous => saved ? previous.filter(value => value !== id) : [...previous, id]);
      setNotice((error as Error).message);
    });
  };
  const goHome = () => { setPage('home'); setProfile(null); setMenu(null); setCategory('all'); setSearch(''); setSearchDraft(''); };
  const openAdminConsole = () => { setMenu(null); if (Platform.OS === 'web') globalThis.location.assign(ADMIN_PATH); else setPage('admin'); };
  const goBackFromProfile = () => { setPage(detailReturnPage); setProfile(null); setMenu(null); };
  const goMobileTab = (next: Page) => { if (next === 'search') setSavedOnly(false); setPage(next); setProfile(null); setMenu(null); };
  const enterFinder = () => { if (!userId) { openAuth('join'); setAccountKind('finder'); } else { setFinderName(finder?.name || ownProfile?.name || finderName); setFinderTaluka(finder?.taluka || ownProfile?.taluka || finderTaluka); setFinderImageFile(null); setDialog('finder'); setMenu(null); } };
  const saveFinderProfile = async () => {
    if (!userId) return;
    if (finderName.trim().length < 2) { setFormError('Enter your name.'); return; }
    try {
      await live.saveFinder(userId, finderName.trim(), finderTaluka);
      const auth = await live.account();
      setFinder({ name: finderName.trim(), email: auth.user?.email || '', taluka: finderTaluka, avatarPath: finder?.avatarPath, imageUrl: finder?.imageUrl });
      const avatarPath = finderImageFile ? await uploadFinderPicture(userId, finderImageFile, finder?.avatarPath) : finder?.avatarPath;
      setFinder({ name: finderName.trim(), email: auth.user?.email || '', taluka: finderTaluka, avatarPath, imageUrl: live.finderAvatarUrl(avatarPath) });
      setFinderImageFile(null); setPlace(finderTaluka);
      if (pendingSafety) { setSafetyTarget(pendingSafety); setPendingSafety(null); setSafetyReason(''); setFormError(''); setDialog('safety'); }
      else if (pendingContact) { setChatRoute({ finderId: userId, freelancerId: pendingContact.id }); setChatReturnPage(page); setChatPerson(pendingContact); setPendingContact(null); setPage('chats'); setDialog(null); }
      else if (setupReturn) { setSetupReturn(false); setDialog('setup'); }
      else setDialog(null);
      setNotice('Finder profile saved.');
    } catch (error) { setFormError((error as Error).message); }
  };
  const deleteFinderPhoto = async () => {
    if (!userId || !finder?.avatarPath) return;
    try { await removeFinderPicture(userId, finder.avatarPath); setFinder(current => current ? { ...current, avatarPath: undefined, imageUrl: undefined } : current); setFinderImageFile(null); setNotice('Finder photo removed.'); }
    catch (error) { setFormError((error as Error).message); }
  };
  const openInfo = (topic: InfoTopic) => { setMobileMenuOpen(false); setMenu(null); setInfoDialog(topic); };
  const enterFreelancer = () => { if (!userId) { openAuth('join'); setAccountKind('freelancer'); } else { if (ownProfile) { openProfile(ownProfile); } else setDialog('freelancer'); } setMenu(null); };
  const editFreelancerProfile = () => {
    if (!userId) { openAuth('join'); setAccountKind('freelancer'); return; }
    if (ownProfile) {
      setFormName(ownProfile.name); setFormRole(ownProfile.role); setFormCategory(ownProfile.category);
      setFormWhy(ownProfile.why); setFormDescription(ownProfile.description || ''); setFormSoftware(ownProfile.software || []);
      setFormLinksText(withoutWhatsapp(ownProfile.links).map(link => `${link.title} | ${link.url}`).join('\n'));
      setFormWhatsapp(publicWhatsapp(ownProfile.links)?.replace('https://wa.me/', '') || '');
      setFormImage(ownProfile.imageUrl || ''); setFormWork(ownProfile.work.join(', '));
    }
    setFormImageFile(null); setDialog('freelancer'); setMenu(null);
  };
  const openSafety = (person: Freelancer) => {
    if (!userId) { openAuth('signIn'); return; }
    if (person.demo || person.id === userId) return;
    if (!finder) { setPendingSafety(person); setFinderName(ownProfile?.name || finderName); setFinderTaluka(ownProfile?.taluka || finderTaluka); setFormError(''); setDialog('finder'); setNotice('Add your Finder details to report or block this freelancer.'); return; }
    setSafetyTarget(person); setSafetyReason(''); setFormError(''); setDialog('safety');
  };
  const submitSafety = async (action: 'report' | 'block' | 'reportBlock' | 'unblock') => {
    if (!userId || !safetyTarget || safetyBusy) return;
    const reporting = action === 'report' || action === 'reportBlock';
    if (reporting && safetyReason.trim().length < 10) { setFormError('Describe the concern in at least 10 characters.'); return; }
    setSafetyBusy(true); setFormError('');
    try {
      if (reporting) await live.reportFreelancer(userId, safetyTarget.id, safetyReason);
      if (action !== 'report') {
        const blocked = action !== 'unblock';
        await live.setFreelancerBlocked(userId, safetyTarget.id, blocked);
        setBlockedFreelancers(previous => blocked ? [...new Set([...previous, safetyTarget.id])] : previous.filter(id => id !== safetyTarget.id));
      }
      setNotice(action === 'reportBlock' ? 'Report sent to admins. This freelancer is blocked.' : action === 'report' ? 'Report sent to admins.' : action === 'block' ? 'Freelancer blocked. New messages are paused.' : 'Freelancer unblocked.');
      setDialog(null); setSafetyTarget(null);
    } catch (error) { setFormError((error as Error).message); }
    finally { setSafetyBusy(false); }
  };
  const openWhatsappPrompt = () => { if (!ownProfile || !userId) return; setFormWhatsapp(publicWhatsapp(ownProfile.links, ownProfile.publicWhatsappUrl)?.replace('https://wa.me/', '') || ''); setFormError(''); setDialog('whatsapp'); };
  const startSetup = (role: SetupRole | null = setupRole) => {
    if (!userId) { openAuth('join'); return; }
    const state = { ...completionState, role };
    setSetupRole(role); setSetupStep(nextIncompleteStep(state) || setupSteps(state)[0]); setSetupReturn(false); setDialog('setup'); setMenu(null);
  };
  const editSetupProfile = () => {
    setSetupReturn(true);
    if (setupStep === 'finder') { setFinderName(finder?.name || ownProfile?.name || finderName); setFinderTaluka(finder?.taluka || ownProfile?.taluka || finderTaluka); setDialog('finder'); }
    if (setupStep === 'freelancer') {
      if (ownProfile) { setFormName(ownProfile.name); setFormRole(ownProfile.role); setFormCategory(ownProfile.category); setFormWhy(ownProfile.why); setFormDescription(ownProfile.description || ''); setFormSoftware(ownProfile.software || []); setFormLinksText(withoutWhatsapp(ownProfile.links).map(link => `${link.title} | ${link.url}`).join('\n')); setFormWhatsapp(publicWhatsapp(ownProfile.links)?.replace('https://wa.me/', '') || ''); setFormImage(ownProfile.imageUrl || ''); setFormWork(ownProfile.work.join(', ')); }
      setFormImageFile(null); setDialog('freelancer');
    }
  };
  const openChats = () => { if (!userId) { openAuth('signIn'); return; } if (page !== 'chats') setChatReturnPage(page); setChatPerson(null); setChatRoute(null); void refreshChatPairs(); void refreshChatInbox(); setPage('chats'); setMenu(null); };
  const openNotificationChat = async (pair: { finder_id: string; freelancer_id: string }) => {
    if (!userId || ![pair.finder_id, pair.freelancer_id].includes(userId)) { setNotice('This conversation is unavailable.'); return; }
    const otherId = pair.finder_id === userId ? pair.freelancer_id : pair.finder_id;
    let partners = chatPairs;
    try { partners = await live.getChatPartners(userId); setChatPairs(partners); }
    catch (error) { setNotice(`Could not refresh conversations: ${(error as Error).message}`); }
    const finderPartner = partners.find(value => value.id === otherId);
    const partner = allPeople.find(value => value.id === otherId) || finderChatPerson(otherId, finderPartner?.finderName || 'Finder', finderPartner?.finderImageUrl);
    if (page !== 'chats') setChatReturnPage(page);
    setChatRoute({ finderId: pair.finder_id, freelancerId: pair.freelancer_id });
    setChatPerson(partner);
    setPage('chats');
  };
  const openNotifications = () => { setMenu(null); setDialog('notifications'); };
  const markAllNoticesRead = () => {
    setRemoteNotices(previous => previous.map(item => ({ ...item, seen_at: item.seen_at || new Date().toISOString() })));
    setUnreadNotices(0);
    void live.markNotificationsRead().catch(error => setNotice((error as Error).message));
  };
  const openNotice = (item: ActivityNotice) => {
    if (!item.seen_at) {
      setRemoteNotices(previous => previous.map(value => value.id === item.id ? { ...value, seen_at: new Date().toISOString() } : value));
      setUnreadNotices(previous => Math.max(0, previous - 1));
      void live.markNotificationRead(item.id).catch(error => setNotice((error as Error).message));
    }
    setDialog(null);
    if ((item.kind === 'message' || item.kind === 'inquiry') && item.related_id && userId) {
      void (async () => {
        try {
          const pair = item.kind === 'message' ? await live.getMessageParticipants(item.related_id!) : await live.getInquiryParticipants(item.related_id!);
          if (!pair) { setNotice('This conversation is no longer available.'); return; }
          await openNotificationChat(pair);
        } catch (error) { setNotice(`Could not open this conversation: ${(error as Error).message}`); }
      })();
      return;
    }
    if ((item.kind === 'application' || item.kind === 'requirement') && item.related_id && userId) {
      const requestId = item.related_id;
      void (async () => {
        try {
          const posts = await live.getRequests(userId);
          if (!posts.some(post => post.id === requestId)) { setNotice('This requirement is no longer available.'); return; }
          setRequests(posts);
          if (item.kind === 'application') void live.getApplications(requestId)
            .then(approaches => setApplications(previous => ({ ...previous, [requestId]: approaches })))
            .catch(error => setNotice(`Could not refresh approaches: ${(error as Error).message}`));
          const destination = item.kind === 'application' ? 'myPosts' : 'requests';
          if (item.kind === 'requirement') setSpaceView('freelancer');
          setPendingScrollTarget({ id: `request-${requestId}`, page: destination });
          setPage(destination);
        } catch (error) { setNotice(`Could not open this requirement: ${(error as Error).message}`); }
      })();
      return;
    }
    if (item.kind === 'admin_flag' && userId) {
      void live.getMyContentFlags(userId).then(flags => {
        setContentFlags(flags);
        const flagged = flags.find(flag => flag.id === item.related_id);
        if (flagged?.target_kind === 'request' && flagged.target_id) {
          setPendingScrollTarget({ id: `request-${flagged.target_id}`, page: 'myPosts' }); setPage('myPosts');
        } else if (ownProfile) {
          setPendingScrollTarget({ id: flagged?.target_kind === 'media' ? `flag-media-${flagged.target_id}` : flagged?.target_kind === 'service' ? `flag-service-${flagged.target_id}` : 'flag-account', page: 'profile', profileId: ownProfile.id });
          openProfile(ownProfile);
        } else { setPendingScrollTarget({ id: 'account-flags', page: 'account' }); setPage('account'); }
      }).catch(error => setNotice(error.message));
      return;
    }
    if (item.kind === 'profile_save') {
      if (!ownProfile) { setNotice('Your Freelancer profile is no longer available.'); return; }
      setSpaceView('freelancer'); setShowProfileActivity(true);
      setPendingScrollTarget({ id: 'profile-activity', page: 'account' }); setPage('account'); return;
    }
    if (item.kind === 'review') {
      if (!ownProfile) { setNotice('Your Freelancer profile is no longer available.'); return; }
      setSpaceView('freelancer'); setPendingScrollTarget({ id: 'profile-reviews', page: 'profile', profileId: ownProfile.id }); openProfile(ownProfile);
    }
  };
  const closeChats = () => { setPage(chatReturnPage === 'chats' ? 'home' : chatReturnPage); setChatPerson(null); };
  const openNewRequest = () => { if (!userId) { openAuth('signIn'); return; } if (!finder) { setFinderName(ownProfile?.name || finderName); setFinderTaluka(ownProfile?.taluka || finderTaluka); } setDialog(finder ? 'request' : 'finder'); setMenu(null); };
  const registerFinder = async () => {
    if (authBusy) return;
    setFormError(''); setAuthMessage('');
    if (!codeSentTo && !/^\S+@\S+\.\S+$/.test(finderEmail.trim())) { setFormError('Enter a valid email address.'); return; }
    if (!codeSentTo && authMode === 'join' && finderName.trim().length < 2) { setFormError('Enter your name to create an account.'); return; }
    if (!codeSentTo && authMode === 'join' && !accountKind) { setFormError('Choose Finder or Freelancer to create an account.'); return; }
    if (codeSentTo && !/^\d{8}$/.test(emailCode.trim())) { setFormError('Enter the 8-digit code from your email.'); return; }
    setAuthBusy(true);
    try {
      if (codeSentTo) {
        const user = await live.verifyEmailCode(codeSentTo, emailCode.trim());
        setUserId(user.id); leaveAuth();
        const role = user.user_metadata?.account_type;
        setNotice(role === 'freelancer' ? 'Welcome, Freelancer! Your email is verified.' : role === 'finder' ? 'Welcome, Finder! Your email is verified.' : 'Your email is verified. Welcome!');
      } else {
        const email = finderEmail.trim().toLowerCase();
        await live.sendEmailCode(email, authMode === 'join' && accountKind ? { name: finderName.trim(), taluka: finderTaluka, accountKind } : undefined);
        setCodeSentTo(email); setEmailCode('');
        setAuthMessage('Check your inbox for the verification code. Access begins after you enter it.');
      }
    } catch (error) { setFormError((error as Error).message); }
    finally { setAuthBusy(false); }
  };
  const resendEmailCode = async () => {
    if (!codeSentTo || authBusy) return;
    setAuthBusy(true); setFormError(''); setAuthMessage('');
    try {
      await live.sendEmailCode(codeSentTo, authMode === 'join' && accountKind ? { name: finderName.trim(), taluka: finderTaluka, accountKind } : undefined);
      setAuthMessage('A fresh code is on its way.');
    } catch (error) { setFormError((error as Error).message); }
    finally { setAuthBusy(false); }
  };
  const signOut = async () => { try { await live.signOut(); setupPrompted.current.clear(); setUserId(null); setAdmin(false); setSuggestions([]); setMessages([]); setChatPairs([]); setChatPerson(null); setChatRoute(null); setPendingContact(null); setPendingSafety(null); setSafetyTarget(null); setOwnProfile(null); setFinderName(''); setFinderEmail(''); setFinderImageFile(null); setFormName(''); setFormRole(''); setFormWhy(''); setFormWork(''); setFormImageFile(null); setFormImage(''); setFormDescription(''); setFormSoftware([]); setFormLinksText(''); setFormWhatsapp(''); setPortfolioAssets({}); setPage('home'); setNotice('Signed out.'); } catch (error) { setNotice((error as Error).message); } };
  const createFreelancer = async () => { if (!userId) { setDialog('finder'); return; } if (!formName.trim() || !formRole.trim() || formWhy.trim().length < 10 || (formCategory === 'other' && !customCategory.trim())) { setFormError('Complete your name, role, category and Why Choose Me statement (at least 10 characters).'); return; } if (formDescription.length > DESCRIPTION_LIMIT) { setFormError(`Keep the description under ${DESCRIPTION_LIMIT.toLocaleString()} characters.`); return; } if (!formImageFile && formImage.trim() && !publicHttpsUrl(formImage.trim())) { setFormError('Use a public HTTPS image URL.'); return; } const linkLines = formLinksText.split('\n').map(line => line.trim()).filter(Boolean); if (linkLines.length > (formWhatsapp.trim() ? 29 : 30)) { setFormError('Add up to 30 links total, including WhatsApp.'); return; } const links: PortfolioLink[] = []; for (const line of linkLines) { const [title, rawUrl] = line.includes('|') ? line.split('|', 2).map(part => part.trim()) : ['', line]; const url = publicHttpsUrl(rawUrl); if (!url) { setFormError(`Use a public HTTPS URL for: ${line.slice(0, 80)}`); return; } links.push({ title: (title || new URL(url).hostname).slice(0, 100), url }); } const contactLink = formWhatsapp.trim() ? whatsappUrl(formWhatsapp) : null; if (formWhatsapp.trim() && !contactLink) { setFormError('Enter a WhatsApp number with country code, such as +91 98765 43210.'); return; } if (contactLink) links.unshift({ title: 'WhatsApp', url: contactLink }); const newCategory = formCategory === 'other' ? customCategory.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) : formCategory; if (newCategory.length < 2) { setFormError('Use at least two Latin letters or digits for the new category.'); return; } const taluka = finder?.taluka || ownProfile?.taluka || finderTaluka; const person: Freelancer = { id: userId, name: formName.trim(), role: formRole.trim(), category: newCategory, tags: [newCategory, formRole.trim().toLowerCase(), ...(formCategory === 'other' ? [customCategory.trim().toLowerCase()] : [])], taluka, place: ownProfile?.place || taluka, lat: talukaCenters[taluka].lat, lon: talukaCenters[taluka].lon, rating: ownProfile?.rating || 0, reviews: ownProfile?.reviews || 0, distance: 'New', line: formWhy.trim().slice(0, 85), why: formWhy.trim(), description: formDescription.trim(), software: formSoftware, links: normalizeLinks(links), work: formWork.split(',').map(value => value.trim()).filter(Boolean).slice(0, 8), image: ownProfile?.image ?? -1, imageUrl: formImageFile ? ownProfile?.imageUrl : formImage.trim() || undefined, framePreset: ownProfile?.framePreset, frameCustomId: ownProfile?.frameCustomId, frameOverlayUrl: ownProfile?.frameOverlayUrl };
    let detailsSaved = false;
    try {
      await live.saveFreelancer(userId, person);
      detailsSaved = true;
      if (formImageFile) person.imageUrl = await uploadProfilePicture(userId, formImageFile, ownProfile?.imageUrl);
      if (formCategory === 'other') await live.suggestCategory(userId, customCategory.trim());
      await refreshPeople();
    } catch (error) { if (detailsSaved) setOwnProfile(person); setFormError(`${detailsSaved ? 'Profile details saved, but another step failed' : 'Profile could not be saved'}: ${(error as Error).message}`); return; }
    setFormImageFile(null); setFormImage(person.imageUrl || ''); setOwnProfile(person); setNotice('Freelancer profile saved.');
    if (setupReturn) { setSetupReturn(false); setDialog('setup'); }
    else { setDialog(!ownProfile && !contactLink ? 'whatsapp' : null); openProfile(person); }
  };
  const saveWhatsapp = async () => {
    if (!userId || !ownProfile) return;
    const url = whatsappUrl(formWhatsapp);
    if (!url) { setFormError('Enter a WhatsApp number with country code, such as +91 98765 43210.'); return; }
    const links = [{ title: 'WhatsApp', url }, ...withoutWhatsapp(ownProfile.links)];
    if (links.length > 30) { setFormError('Remove a portfolio link before adding WhatsApp.'); return; }
    try {
      await live.savePortfolioLinks(userId, links);
      setOwnProfile(current => current ? { ...current, links } : current);
      setLivePeople(current => current.map(person => person.id === userId ? { ...person, links } : person));
      setProfile(current => current?.id === userId ? { ...current, links } : current);
      setDialog(null); setFormError(''); setNotice('Your WhatsApp button is now visible on your public profile.');
    } catch (error) { setFormError((error as Error).message); }
  };
  const postRequest = async () => { if (!finder || !userId) { setDialog('finder'); return; } if (requestTitle.trim().length < 4 || requestDetails.trim().length < 10) { setFormError('Add a title and a description of at least 10 characters.'); return; }
    try { await live.createRequest(userId, requestTitle.trim(), requestDetails.trim(), requestCategory, finder.taluka); setRequests(await live.getRequests(userId)); } catch (error) { setFormError((error as Error).message); return; }
    setRequestTitle(''); setRequestDetails(''); setDialog(null); setPage('myPosts'); setNotice('Requirement posted.'); };
  const sendMessage = async () => {
    if (!userId || !chatPerson || !chatDraft.trim() || !chatRoute) return;
    try { await live.createMessage(chatRoute.finderId, chatRoute.freelancerId, userId, chatDraft.trim()); }
    catch (error) { setNotice(`Could not send message: ${(error as Error).message}`); return; }
    setChatDraft('');
    await loadChat(chatPerson);
    await refreshChatPairs();
  };
  const attachChatFile = () => {
    if (Platform.OS !== 'web' || !userId || !chatRoute || !chatPerson || chatFileBusy) return;
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp';
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return;
      setChatFileBusy(true);
      try { if (!live.chatFileTypes.includes(file.type)) throw new Error('Attach a PDF, JPEG, PNG or WebP file.'); const upload = await compressChatImage(file); const problem = live.chatFileError(upload); if (problem) throw new Error(problem); await live.sendChatAttachment(chatRoute.finderId, chatRoute.freelancerId, userId, upload); await loadChat(chatPerson); await refreshChatPairs(); }
      catch (error) { setNotice((error as Error).message); }
      finally { setChatFileBusy(false); }
    };
    input.click();
  };
  const refreshPortfolio = async (id: string) => {
    const items = await listPortfolioAssets(id);
    setPortfolioAssets(previous => ({ ...previous, [id]: items }));
  };
  const pickProfilePhoto = () => {
    if (Platform.OS !== 'web') { setFormError('Photo upload is currently available in the web app.'); return; }
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = () => { const file = input.files?.[0]; if (!file) return; const error = profilePictureError(file); if (error) { setFormError(error); return; } setFormImageFile(file); setFormError(''); };
    input.click();
  };
  const pickFinderPhoto = () => {
    if (Platform.OS !== 'web') { setFormError('Photo upload is currently available in the web app.'); return; }
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = () => { const file = input.files?.[0]; if (!file) return; const error = profilePictureError(file); if (error) { setFormError(error); return; } setFinderImageFile(file); setFormError(''); };
    input.click();
  };
  const pickPortfolio = (kind: 'photo' | 'video' | 'document') => {
    if (Platform.OS !== 'web' || !profile || profile.id !== userId) return;
    const id = profile.id;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = kind === 'photo' ? 'image/jpeg,image/png,image/webp' : kind === 'video' ? 'video/mp4,video/webm' : '.pdf,.txt,.doc,.docx,.rtf,.odt,.md,.csv';
    input.multiple = kind !== 'video';
    input.style.display = 'none'; document.body.appendChild(input);
    input.addEventListener('cancel', () => input.remove(), { once: true });
    input.onchange = async () => {
      const files = Array.from(input.files || []); input.remove();
      if (!files.length) return;
      try {
        const current = [...(portfolioAssets[id] || [])];
        const validation = kind === 'photo' ? photoUploadError(files, current.filter(item => item.kind === 'photo').length)
          : kind === 'video' ? videoUploadError(files[0])
          : documentUploadError(files, current.filter(item => item.kind === 'document').reduce((sum, item) => sum + item.size_bytes, 0));
        if (validation) throw new Error(validation);
        if (kind === 'video') {
          const file = files[0];
          const probe = document.createElement('video');
          const objectUrl = URL.createObjectURL(file);
          try {
            await new Promise<void>((resolve, reject) => {
              probe.onloadedmetadata = () => hasExactVideoRatio(probe.videoWidth, probe.videoHeight) ? resolve() : reject(new Error('The video must use an exact 16:9 ratio.'));
              probe.onerror = () => reject(new Error('Could not read the video.'));
              probe.src = objectUrl;
            });
          } finally { URL.revokeObjectURL(objectUrl); }
          const old = current.find(item => item.kind === 'video');
          await replacePortfolioVideo(id, file, old);
        } else {
          for (const file of files) current.push(await uploadPortfolioAsset(id, kind, file, current));
        }
        await refreshPortfolio(id);
        setNotice(kind === 'video' ? 'Portfolio video saved.' : `${files.length} ${kind === 'photo' ? 'photo' : 'document'}${files.length === 1 ? '' : 's'} saved.`);
      } catch (error) { setNotice((error as Error).message); await refreshPortfolio(id).catch(() => {}); }
    };
    input.click();
  };
  const removePortfolio = async (kind: 'photo' | 'video' | 'document', index: number) => {
    if (!profile || profile.id !== userId) return;
    const asset = (portfolioAssets[profile.id] || []).filter(item => item.kind === kind && item.moderation_status !== 'under_review')[index];
    if (!asset) return;
    try { await removePortfolioAsset(asset); await refreshPortfolio(profile.id); setNotice('Portfolio item removed.'); }
    catch (error) { setNotice((error as Error).message); }
  };
  const apply = async (post: RequestPost) => { if (!userId || !ownProfile) return; const note = (applyDraft[post.id] || '').trim(); if (note.length < 5) { setNotice('Write a short approach message first.'); return; } try { await live.applyToRequest(post.id, userId, note); setApplications(previous => ({ ...previous, [post.id]: [...(previous[post.id] || []), { freelancer_id: userId, note, status: 'new' }] })); setApplyDraft(previous => ({ ...previous, [post.id]: '' })); setNotice('Approach sent to the Finder.'); } catch (error) { setNotice((error as Error).message); } };
  const reviewApplication = async (postId: string, id: string, status: 'shortlisted' | 'declined') => { try { await live.setApplicationStatus(id, status); setApplications(previous => ({ ...previous, [postId]: (previous[postId] || []).map(row => row.id === id ? { ...row, status } : row) })); } catch (error) { setNotice((error as Error).message); } };
  const reviewSuggestion = async (id: string, name: string, approve: boolean) => { try { await live.reviewCategory(id, name, approve); setSuggestions(previous => previous.filter(item => item.id !== id)); if (approve) setCatalog(await live.getCategories()); setNotice(approve ? 'Category added to the directory.' : 'Suggestion declined.'); } catch (error) { setNotice((error as Error).message); } };
  const menuMotion = Platform.OS === 'web' ? { animation: 'wcm-menu-in 180ms cubic-bezier(.2,.8,.2,1)' } as any : {};
  const canEditPortfolio = !!profile && profile.id === userId && !profile.demo;
  const visiblePortfolioAssets = (profile ? portfolioAssets[profile.id] || [] : []).filter(item => item.moderation_status !== 'under_review');
  const currentProfile = allPeople.find(person => person.id === profile?.id) || profile;
  const profileReviewCount = currentProfile?.reviews || 0;
  const profileRating = currentProfile?.rating || 0;
  const needsWhatsapp = !!ownProfile && !publicWhatsapp(ownProfile.links, ownProfile.publicWhatsappUrl);

  const mobileLocationPicker = <View ref={mobilePlaceMenuRef} style={{ position: 'relative', zIndex: 20 }}><Pressable accessibilityRole="button" accessibilityLabel={`Choose location, currently ${place}`} accessibilityState={{ expanded: menu === 'place' }} onPress={() => setMenu(menu === 'place' ? null : 'place')} style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, minHeight: 38, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, paddingHorizontal: 13 }}><Text style={{ color: color.coral, fontSize: 14 }}>●</Text><T style={{ fontWeight: '900', fontSize: 13 }}>{place}</T><ChevronDown size={15} color={color.ink} open={menu === 'place'} /></Pressable>{menu === 'place' && <View style={[{ position: 'absolute', top: 42, left: 0, width: 190, maxHeight: 300, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, shadowColor: '#222', shadowOpacity: .18, shadowRadius: 10, elevation: 6, zIndex: 40, overflow: 'hidden' }, menuMotion]}><ScrollView showsVerticalScrollIndicator={false}>{places.map(value => <Pressable key={value} accessibilityRole="button" onPress={() => { setPlace(value); setRadius('Local'); setMenu(null); }} style={{ minHeight: 41, justifyContent: 'center', paddingHorizontal: 16, backgroundColor: value === place ? '#f4ebff' : '#fff' }}><T style={{ fontSize: 14, fontWeight: value === place ? '900' : '500' }}>{value}</T></Pressable>)}</ScrollView></View>}</View>;
  const heroMessages: { text: string; style: any; tilt: number; tint: string; delay: number }[] = screenWidth >= 1250 ? [
    { text: 'Do you design?', style: { top: 43, left: '4%' }, tilt: -7, tint: '#713af0', delay: -1.3 },
    { text: 'Need a logo?', style: { top: 27, left: '23%' }, tilt: 6, tint: '#a45f54', delay: -4.1 },
    { text: 'Got a big idea?', style: { top: 7, left: '40%' }, tilt: -5, tint: '#5b71ad', delay: -2.6 },
    { text: 'I can make that ✦', style: { top: 31, right: '26%' }, tilt: 7, tint: '#7851ba', delay: -4.8 },
    { text: 'I make ideas real', style: { top: 47, right: '4%' }, tilt: 7, tint: '#d25d48', delay: -3.7 },
    { text: "I'm free this weekend!", style: { top: 156, left: '6%' }, tilt: -4, tint: '#9452a8', delay: -2.5 },
    { text: "Let's plan a shoot", style: { top: 142, left: '25%' }, tilt: 9, tint: '#53828e', delay: -1.4 },
    { text: "Let's build together", style: { top: 146, right: '24%' }, tilt: -6, tint: '#b87531', delay: -3 },
    { text: 'I teach guitar 🎵', style: { top: 161, right: '6%' }, tilt: -8, tint: '#8760b1', delay: -1.8 },
    { text: 'Portfolio ready ✦', style: { bottom: 151, left: '12%' }, tilt: 8, tint: '#ba6046', delay: -4.7 },
    { text: 'I can help with that', style: { bottom: 153, right: '11%' }, tilt: -6, tint: '#5b71ad', delay: -5.4 },
    { text: 'Can you edit my reel?', style: { bottom: 29, left: '4%' }, tilt: -5, tint: '#7b54ae', delay: -3.2 },
    { text: 'Need a photographer?', style: { bottom: 19, left: '22%' }, tilt: 8, tint: '#4c77a5', delay: -2.2 },
    { text: "Let's make a deal →", style: { bottom: 25, right: '24%' }, tilt: -6, tint: '#7851ba', delay: -4.6 },
    { text: 'Music for your event?', style: { bottom: 31, right: '4%' }, tilt: 6, tint: '#567b7c', delay: -2.1 },
    { text: 'Ready to collaborate?', style: { top: 236, left: '2%' }, tilt: -9, tint: '#a65383', delay: -2.8 },
    { text: "I'm available Friday", style: { top: 239, right: '2%' }, tilt: 5, tint: '#567b7c', delay: -5.1 },
  ] : tablet ? [
    { text: 'Do you design?', style: { top: 21, left: '3%' }, tilt: -7, tint: '#713af0', delay: -1.3 },
    { text: 'I make ideas real', style: { top: 22, right: '3%' }, tilt: 7, tint: '#d25d48', delay: -3.7 },
    { text: 'Need a logo?', style: { top: 132, left: '3%' }, tilt: 6, tint: '#a45f54', delay: -4.1 },
    { text: 'I teach guitar 🎵', style: { top: 134, right: '3%' }, tilt: -8, tint: '#8760b1', delay: -1.8 },
    { text: 'Need a photographer?', style: { bottom: 19, left: '3%' }, tilt: 8, tint: '#4c77a5', delay: -2.2 },
    { text: "Let's make a deal →", style: { bottom: 20, right: '3%' }, tilt: -6, tint: '#7851ba', delay: -4.6 },
  ] : [
    { text: 'Do you design?', style: { top: 23, left: '3%' }, tilt: -7, tint: '#713af0', delay: -1.3 },
    { text: 'Need a logo?', style: { top: 19, left: '35%' }, tilt: 6, tint: '#a45f54', delay: -4.1 },
    { text: 'I make ideas real', style: { top: 24, right: '3%' }, tilt: 7, tint: '#d25d48', delay: -3.7 },
    { text: "I'm free this weekend!", style: { top: 137, left: '4%' }, tilt: -4, tint: '#9452a8', delay: -2.5 },
    { text: 'I teach guitar 🎵', style: { top: 141, right: '4%' }, tilt: -8, tint: '#8760b1', delay: -1.8 },
    { text: 'Need a photographer?', style: { bottom: 26, left: '4%' }, tilt: 8, tint: '#4c77a5', delay: -2.2 },
    { text: "Let's make a deal →", style: { bottom: 21, left: '39%' }, tilt: -6, tint: '#7851ba', delay: -4.6 },
    { text: 'Need a tutor?', style: { bottom: 28, right: '4%' }, tilt: 6, tint: '#567b7c', delay: -2.1 },
  ];
  const mobileTabs = [{ id: 'home', label: 'People', icon: 'people' }, { id: 'search', label: 'Search', icon: 'search' }, { id: 'map', label: 'Map', icon: 'map' }, { id: 'account', label: 'My space', icon: 'profile' }] as const;
  const activeMobileTab = page === 'profile' ? detailReturnPage : page === 'collection' ? 'home' : ['requests', 'admin', 'finderHub', 'freelancerHub', 'myPosts', 'newRequest', 'chats'].includes(page) ? 'account' : page;
  const desktopMenuKeys = ['creative', 'lifestyle', 'learning', 'more'];
  const primaryMenuCount = tablet ? 0 : screenWidth >= 1250 ? 4 : 3;
  const primaryMenuKeys = desktopMenuKeys.slice(0, primaryMenuCount);
  const secondaryMenuKeys = desktopMenuKeys.slice(primaryMenuCount);
  const desktopNavigation = { categories: catalog, onCategory: openHighlightedCategory, selectedCategory: page === 'search' || page === 'collection' ? category : undefined };

  if (page === 'auth') return <View style={{ flex: 1, height: Platform.OS === 'web' ? '100vh' as any : undefined, paddingTop: Platform.OS === 'ios' ? 26 : 0 }}><StatusBar barStyle="dark-content" backgroundColor="#fffaf4" /><AuthPage mode={authMode} compact={compact} signedIn={authReady && !!userId} name={finderName} email={finderEmail} code={emailCode} codeSentTo={codeSentTo} taluka={finderTaluka} accountKind={accountKind} busy={authBusy} error={formError} message={authMessage} guestLimit={guestLimitPrompt} onName={setFinderName} onEmail={setFinderEmail} onCode={setEmailCode} onTaluka={setFinderTaluka} onAccountKind={setAccountKind} onMode={switchAuthMode} onSubmit={registerFinder} onResend={resendEmailCode} onChangeEmail={() => { setCodeSentTo(''); setEmailCode(''); setAuthMessage(''); setFormError(''); }} onBack={leaveAuth} /></View>;

  return <View style={{ flex: 1, height: Platform.OS === 'web' ? '100vh' as any : undefined, overflow: 'hidden', backgroundColor: '#fffaf3', paddingTop: Platform.OS === 'ios' ? 26 : 0 }}><StatusBar barStyle="dark-content" backgroundColor="#fff" /><ScrollView ref={scrollRef} style={{ flex: 1, minHeight: 0 }} contentContainerStyle={{ minHeight: '100%' }}>
    {/* HEADER */}
    {compact && page !== 'chats' && <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: color.line, zIndex: 10, paddingHorizontal: pagePadding, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open navigation menu" onPress={() => setMobileMenuOpen(true)} style={{ minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 9 }}><Text style={{ fontSize: 25, color: color.purple }}>☰</Text><T style={{ color: color.purple, fontWeight: '900', fontSize: 15 }}>Menu</T></Pressable>
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>{userId ? <><Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={openNotifications} style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 21 }}>🔔</Text>{unreadNotices > 0 && <View style={{ position: 'absolute', top: 4, right: 5, width: 7, height: 7, borderRadius: 4, backgroundColor: color.coral }} />}</Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Open chats${unreadChats ? `, ${unreadChats} unread messages` : ''}`} onPress={openChats} style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}><ChatIcon color={color.ink} size={23} /><UnreadChatBadge count={unreadChats} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Your account" onPress={() => goMobileTab('account')} style={{ minHeight: 38, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 19, backgroundColor: '#f3edff' }}><T style={{ color: color.purple, fontWeight: '900', fontSize: 13 }}>Account</T></Pressable></> : authReady ? <><Pressable accessibilityRole="button" accessibilityLabel="Sign in" onPress={() => openAuth('signIn')} style={{ minHeight: 38, justifyContent: 'center', paddingHorizontal: 8 }}><T style={{ color: color.purple, fontWeight: '900', fontSize: 13 }}>Sign in</T></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Sign up" onPress={() => openAuth('join')} style={{ minHeight: 38, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 19, backgroundColor: color.purple }}><T style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>Sign up</T></Pressable></> : null}</View>
    </View>}
    {!compact && page !== 'chats' && <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3eff0', zIndex: 10 }}><View style={{ position: 'relative', zIndex: 40, width: '100%', maxWidth: 1540, alignSelf: 'center', minHeight: 82, paddingHorizontal: pagePadding, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="WhyChoozeMe home" onPress={goHome} style={{ flexShrink: 0 }}><Image source={Platform.OS==='web'?{uri:brandLogo as unknown as string}:brandLogo} resizeMode="contain" accessibilityLabel="WhyChoozeMe logo" style={{ width: 245, height: 50 }} /></Pressable>
      {primaryMenuKeys.length > 0 && <DesktopCategoryNavigation {...desktopNavigation} visibleKeys={primaryMenuKeys} inline />}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <View ref={desktopPlaceMenuRef} style={{ position: 'relative' }}><Pressable accessibilityRole="button" accessibilityLabel={`Choose location, currently ${place}`} accessibilityState={{ expanded: menu === 'place' }} onPress={() => setMenu(menu === 'place' ? null : 'place')} style={{ borderRadius: 25, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f2eff0', paddingHorizontal: 16, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#ded1cd', shadowOpacity: .13, shadowRadius: 7 }}><Text style={{ color: color.coral, fontSize: 18 }}>●</Text><T style={{ fontWeight: '900', fontSize: 14 }}>{place}</T><ChevronDown size={17} color={color.ink} open={menu === 'place'} /></Pressable>{menu === 'place' && <View style={[{ position: 'absolute', top: 48, left: 0, width: 190, maxHeight: 310, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, shadowColor: '#222', shadowOpacity: .18, shadowRadius: 10, elevation: 6, zIndex: 50, overflow: 'hidden' }, menuMotion]}><ScrollView showsVerticalScrollIndicator={false}>{places.map(value => <Pressable accessibilityRole="button" key={value} onPress={() => { setPlace(value); setRadius('Local'); setMenu(null); setPage('home'); }} style={{ minHeight: 41, justifyContent: 'center', paddingHorizontal: 16, backgroundColor: value === place ? '#f4ebff' : '#fff' }}><T style={{ fontSize: 14, fontWeight: value === place ? '900' : '500' }}>{value}</T></Pressable>)}</ScrollView></View>}</View>
        {userId && <><Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={openNotifications} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 21 }}>🔔</Text>{unreadNotices > 0 && <View style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 5, backgroundColor: color.coral }} />}</Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Open chats${unreadChats ? `, ${unreadChats} unread messages` : ''}`} onPress={openChats} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}><ChatIcon color={color.ink} size={24} /><UnreadChatBadge count={unreadChats} /></Pressable></>}
        {userId ? <View ref={avatarMenuRef} style={{ position: 'relative' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Account menu" accessibilityState={{ expanded: menu === 'avatar' }} onPress={() => setMenu(menu === 'avatar' ? null : 'avatar')} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 3 }}><View style={{ width: 40, height: 40, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7d5cf', overflow: 'hidden' }}>{finder?.imageUrl || ownProfile?.imageUrl ? <Image source={{ uri: finder?.imageUrl || ownProfile?.imageUrl }} style={{ width: 40, height: 40, borderRadius: 24 }} /> : <Text style={{ fontSize: 21 }}>{(finder?.name || ownProfile?.name || accountDisplayName || '👩🏻').slice(0, 1).toUpperCase()}</Text>}</View><T style={{ fontSize: 13, fontWeight: '900' }}>{finder?.name || ownProfile?.name || accountDisplayName || 'Hi, there!'}</T><AccountChevron open={menu === 'avatar'} /></Pressable>
          {menu === 'avatar' && <View style={[{ position: 'absolute', top: 51, right: 0, width: 248, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, padding: 8, shadowColor: '#221344', shadowOpacity: .19, shadowRadius: 18, elevation: 7, zIndex: 50 }, menuMotion]}>
            <View style={{ paddingHorizontal: 11, paddingVertical: 9, marginBottom: 3, borderRadius: 13, backgroundColor: '#f8f3ff' }}><T style={{ color: color.purple, fontSize: 11, fontWeight: '900', letterSpacing: .7 }}>YOUR ACCOUNT</T><T style={{ color: color.muted, fontSize: 12, marginTop: 2 }}>{finder?.name || ownProfile?.name || accountDisplayName || 'Signed in'}</T></View>
            {[
              ['My space', () => setPage('account')],
              ['Finder account', enterFinder], ['Freelancer profile', enterFreelancer],
              ['Chats', openChats],
              ['My requirements', () => setPage('myPosts')], ['Browse requirements', () => setPage('requests')],
              ...(admin ? [['Admin console', openAdminConsole]] : []),
              ['Sign out', signOut],
            ].map(([label, action]: any) => {
              const active = label === 'My space' && page === 'account' || label === 'Freelancer profile' && page === 'profile' && profile?.id === userId || label === 'My requirements' && page === 'myPosts' || label === 'Browse requirements' && page === 'requests' || label === 'Admin console' && page === 'admin' || label === 'Finder account' && dialog === 'finder';
              return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} key={label} onPress={() => { setMenu(null); action(); }} style={{ minHeight: 43, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 12, backgroundColor: active ? '#f0e7ff' : 'transparent' }}><T style={{ fontSize: 14, fontWeight: active ? '900' : '700', color: active ? color.purple : color.ink }}>{label}{active ? '  ✓' : ''}</T></Pressable>;
            })}
          </View>}
        </View> : authReady ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Pressable accessibilityRole="button" accessibilityLabel="Sign in" onPress={() => openAuth('signIn')} style={{ minHeight: 42, justifyContent: 'center', paddingHorizontal: 13, borderRadius: 22, borderWidth: 1, borderColor: '#e4d7f8', backgroundColor: '#fff' }}><T style={{ color: color.purple, fontSize: 13, fontWeight: '900' }}>Sign in</T></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Sign up" onPress={() => openAuth('join')} style={{ minHeight: 42, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 22, backgroundColor: color.purple }}><T style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>Sign up</T></Pressable></View> : null}
      </View>
    </View>{secondaryMenuKeys.length > 0 && <DesktopCategoryNavigation {...desktopNavigation} visibleKeys={secondaryMenuKeys} dense={tablet} />}</View>}
    {page === 'home' && compact && <View style={{ paddingHorizontal: pagePadding, paddingTop: 20, paddingBottom: 30, width: '100%', maxWidth: 540, alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>{mobileLocationPicker}<T style={{ color: color.muted, fontSize: 12 }}>{peopleLoaded ? `${homePeople.length} creatives` : 'Loading creatives…'}</T></View>
      <Heading size={32} style={{ marginTop: 19, lineHeight: 38 }}>Meet local <Text style={{ color: color.purple }}>talent</Text><Text style={{ color: color.orange }}> ✦</Text></Heading>
      <T style={{ color: color.muted, marginTop: 5, marginBottom: 21, fontSize: 15 }}>Explore Goa talent, portfolios and local skills.</T>
      <Pressable accessibilityRole="button" accessibilityLabel="Search freelancers" onPress={() => goMobileTab('search')} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 52, backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, borderRadius: 17, paddingHorizontal: 16 }}><TabIcon name="search" color={color.purple} size={20} /><T style={{ color: '#89869b', fontSize: 14 }}>Search skills, names, or categories</T></Pressable>
      <PopularSkillChips items={popularCategories.slice(0, 4)} selected={category} onSelect={openHighlightedCategory} />
      <Pressable accessibilityRole="button" accessibilityLabel="Explore all on map" onPress={() => goMobileTab('map')} style={{ alignSelf: 'flex-end', marginTop: 13 }}><T style={{ color: color.purple, fontSize: 13, fontWeight: '900' }}>Explore the map →</T></Pressable>
      {!peopleLoaded && <DirectoryLoading place={place} />}
      {peopleLoaded && carouselGroups.map((group, index) => <React.Fragment key={group.category}><CarouselRow title={group.title} detail={group.detail} people={group.people} width={carouselViewportWidth} cardWidth={carouselCardWidth} onMore={() => { setCategory(group.category); setSavedOnly(false); setSearch(''); setSearchDraft(''); setPage('search'); }} renderCard={(person) => <ProfileCard person={person} width={carouselCardWidth} favorite={favorites.includes(person.id)} onFavorite={() => toggleFavorite(person.id)} onOpen={() => openProfile(person)} onChat={() => openContact(person)} />} /><HomeHighlights kind={(['standout','hiring','categories','discover'] as const)[index]} compact people={index === 3 ? allPeople : homePeople} requests={displayedRequests} categories={catalog} onProfile={openProfile} onCategory={openHighlightedCategory} onRequests={() => setPage('requests')} /></React.Fragment>)}
      {peopleLoaded && !allPeople.length && <View style={{ padding: 26, backgroundColor: '#fff', borderRadius: 18, alignItems: 'center', gap: 12 }}><T style={{ color: color.muted, textAlign: 'center' }}>{peopleLoadError ? 'Could not load creatives. Please try again.' : 'Freelancer profiles will appear here soon.'}</T>{!!peopleLoadError && <Button onPress={() => void refreshPeople()}>Try again</Button>}</View>}
    </View>}
    {page === 'search' && compact && <View style={{ paddingHorizontal: pagePadding, paddingTop: 20, paddingBottom: 30, width: '100%', maxWidth: 540, alignSelf: 'center' }}>
      <View style={{ zIndex: 20 }}>{mobileLocationPicker}</View><Heading size={30} style={{ marginTop: 19 }}>Find your person<Text style={{ color: color.coral }}> ✦</Text></Heading><T style={{ color: color.muted, marginTop: 4, marginBottom: 17 }}>Explore skills and creatives near you.</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, borderRadius: 17, paddingHorizontal: 14, minHeight: 54 }}><TabIcon name="search" color={color.purple} size={21} /><TextInput accessibilityLabel="Search freelancers" autoCapitalize="none" value={searchDraft} onChangeText={value => { setSearchDraft(value); setSearch(value); }} placeholder="Try photographer, editor, designer..." placeholderTextColor="#9693ab" style={{ flex: 1, fontFamily: 'Nunito', fontSize: 14, color: color.ink, outlineStyle: 'none' } as any} />{!!searchDraft && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => { setSearchDraft(''); setSearch(''); }}><T style={{ color: color.muted, fontSize: 22 }}>×</T></Pressable>}</View>
      {savedOnly && <Pressable accessibilityRole="button" onPress={() => setSavedOnly(false)} style={{ alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, backgroundColor: '#eee4ff' }}><T style={{ color: color.purple, fontSize: 12, fontWeight: '900' }}>♥ Saved creatives  ×</T></Pressable>}
      <PopularSkillChips items={popularCategories.slice(0, 4)} selected={category} onSelect={item => setCategory(item.id)} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 19, marginTop: 11 }}><Pressable accessibilityRole="button" onPress={() => setCategory('all')}><T style={{ color: color.purple, fontSize: 12, fontWeight: '900' }}>All creatives</T></Pressable><Pressable accessibilityRole="button" onPress={() => setMobileMenuOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><T style={{ color: color.purple, fontSize: 12, fontWeight: '900' }}>More skills</T><ChevronDown size={13} color={color.purple} /></Pressable></View>
      {place !== 'Goa' && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 13, marginHorizontal: -pagePadding }} contentContainerStyle={{ gap: 7, paddingHorizontal: pagePadding }}>{['Local', '10 km', '25 km', 'All Goa'].map(value => <Pressable key={value} onPress={() => setRadius(value)} style={{ borderRadius: 15, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: radius === value ? '#eee4ff' : '#fff', borderWidth: 1, borderColor: radius === value ? '#d8c3ff' : color.line }}><T style={{ fontSize: 12, fontWeight: '900', color: radius === value ? color.purple : color.muted }}>{value}</T></Pressable>)}</ScrollView>}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 13 }}><Heading size={21}>{searchPeople.length} {searchPeople.length === 1 ? 'result' : 'results'}</Heading><Pressable accessibilityRole="button" accessibilityLabel={`Sort by ${sort}`} onPress={() => setSort(sort === 'Nearby' ? 'Top rated' : sort === 'Top rated' ? 'Most reviewed' : 'Nearby')}><T style={{ color: color.purple, fontSize: 12, fontWeight: '900' }}>{sort} ↕</T></Pressable></View>
      <View style={{ alignItems: 'center', gap: 12 }}>{expandedSearchPeople.map((person, index) => <ProfileCard key={`${person.id}-${index}`} person={person} width={mobileCardWidth} favorite={favorites.includes(person.id)} onFavorite={() => toggleFavorite(person.id)} onOpen={() => openProfile(person)} onChat={() => openContact(person)} />)}</View>
      {!searchPeople.length && <View style={{ padding: 28, backgroundColor: '#fff', borderRadius: 18, alignItems: 'center' }}><Heading size={20}>{savedOnly ? 'No saved creatives yet' : 'No matches yet'}</Heading><T style={{ color: color.muted, textAlign: 'center', marginTop: 5 }}>{savedOnly ? 'Tap the heart on a creative’s card to save them here.' : 'Try a different skill or widen the search area.'}</T><Button outline onPress={() => { setSearchDraft(''); setSearch(''); setCategory('all'); setRadius('All Goa'); setSavedOnly(false); }} style={{ marginTop: 14 }}>Show all creatives</Button></View>}
    </View>}
    {page === 'home' && !compact && <>
      <View style={{ paddingHorizontal: pagePadding, paddingTop: 22, paddingBottom: 17 }}>
        <View style={[{ maxWidth: 1540, width: '100%', alignSelf: 'center', position: 'relative', overflow: 'hidden', borderRadius: 31, borderWidth: 1, borderColor: '#eadffd', backgroundColor: '#f7f0ff', shadowColor: '#9781d9', shadowOpacity: .12, shadowRadius: 24, elevation: 3 }, Platform.OS === 'web' ? { backgroundImage: 'radial-gradient(circle at 7% 18%, rgba(255,131,106,.30) 0, transparent 27%), radial-gradient(circle at 92% 18%, rgba(145,110,255,.35) 0, transparent 29%), radial-gradient(circle at 72% 95%, rgba(99,217,224,.32) 0, transparent 30%), linear-gradient(120deg, #fffaf5 0%, #f7f1ff 49%, #fff9ef 100%)', backgroundSize: '145% 145%', animation: 'wcm-hero-drift 18s ease-in-out infinite' } as any : null]}>
          {heroMessages.map(message => <HeroWhisper key={message.text} style={message.style} tilt={message.tilt} tint={message.tint} delay={message.delay}>{message.text}</HeroWhisper>)}
          <View pointerEvents="box-none" style={{ width: '100%', maxWidth: 940, alignSelf: 'center', alignItems: 'center', paddingHorizontal: screenWidth < 1100 ? 22 : 40, paddingTop: tablet ? 56 : screenWidth < 1100 ? 65 : 47, paddingBottom: tablet ? 60 : screenWidth < 1100 ? 72 : 43, zIndex: 1 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,.80)', borderWidth: 1, borderColor: '#eadffd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 15 }}><T style={{ fontSize: 11, fontWeight: '900', letterSpacing: .3 }}><Text style={{ color: color.purple }}>Real people</Text><Text style={{ color: color.orange }}> ✦ </Text><Text style={{ color: color.coral }}>Real skills</Text><Text style={{ color: color.purple }}> ✦ </Text><Text style={{ color: '#5c72ab' }}>Right near you</Text></T></View>
            <Text accessibilityRole="header" style={[{ fontFamily: 'Nunito', color: color.ink, fontSize: tablet && screenWidth < 780 ? 36 : screenWidth < 1100 ? 43 : 56, fontWeight: '900', lineHeight: tablet && screenWidth < 780 ? 42 : screenWidth < 1100 ? 49 : 63, letterSpacing: -2.2, textAlign: 'center' }, Platform.OS === 'web' ? { animation: 'wcm-hero-breathe 7s ease-in-out infinite' } as any : null]}><Text style={{ color: color.purple }}>Find </Text>amazing <Text style={{ color: color.orange }}>freelancers</Text>{'\n'}<Text style={{ color: color.coral }}>near you</Text><Text style={[{ color: color.purple }, Platform.OS === 'web' ? { display: 'inline-block', animation: 'wcm-hero-star 5.5s ease-in-out infinite' } as any : null]}> ✦</Text></Text>
            <View style={[{ width: '100%', maxWidth: 840, marginTop: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 34, borderWidth: 1.5, borderColor: heroSearchFocused ? color.purple : '#eee4f4', minHeight: 68, paddingHorizontal: 17, shadowColor: '#9a79c6', shadowOpacity: heroSearchFocused ? .3 : .17, shadowRadius: heroSearchFocused ? 23 : 18, elevation: heroSearchFocused ? 6 : 3, zIndex: 3, transform: [{ scale: heroSearchFocused ? 1.025 : 1 }] }, Platform.OS === 'web' ? { transition: 'transform 230ms cubic-bezier(.2,.8,.2,1), border-color 230ms ease, box-shadow 230ms ease' } as any : null]}><TabIcon name="search" color={color.purple} size={22} /><TextInput onFocus={() => setHeroSearchFocused(true)} onBlur={() => setHeroSearchFocused(false)} value={searchDraft} onChangeText={setSearchDraft} onSubmitEditing={() => { setCategory('all'); setCollection({ title: 'Search results', category: 'all' }); setSearch(searchDraft); setPage('collection'); }} placeholder="Find a photographer, editor, designer..." placeholderTextColor="#9693ab" style={{ flex: 1, marginLeft: 12, fontFamily: 'Nunito', fontSize: 15, color: color.ink, outlineStyle: 'none' } as any} /><Button onPress={() => { setCategory('all'); setCollection({ title: 'Search results', category: 'all' }); setSearch(searchDraft); setPage('collection'); }} style={{ minWidth: 118, height: 48 }}>Search</Button></View>
            <View style={{ width: '100%', maxWidth: 840, zIndex: 3 }}><PopularSkillChips items={popularCategories} selected={category} onSelect={openHighlightedCategory} /></View>
          </View>
        </View>
      </View>
      {peopleLoaded ? <LocalCategoryShowcase people={mapPeople} categories={catalog} onCategory={openHighlightedCategory} /> : <DirectoryLoading place={place} />}
      <View style={{ maxWidth: 1540, width: '100%', alignSelf: 'center', paddingHorizontal: pagePadding, paddingTop: 5, paddingBottom: 64 }}>
        {peopleLoaded && carouselGroups.map((group, index) => <React.Fragment key={group.category}><CarouselRow title={group.title} detail={group.detail} people={group.people} width={carouselViewportWidth} cardWidth={carouselCardWidth} onMore={() => openCollection(group.title, group.category)} renderCard={(person) => <ProfileCard person={person} width={carouselCardWidth} favorite={favorites.includes(person.id)} onFavorite={() => toggleFavorite(person.id)} onOpen={() => openProfile(person)} onChat={() => openContact(person)} />} /><HomeHighlights kind={(['standout','hiring','categories','discover'] as const)[index]} compact={false} people={index === 3 ? allPeople : homePeople} requests={displayedRequests} categories={catalog} onProfile={openProfile} onCategory={openHighlightedCategory} onRequests={() => setPage('requests')} /></React.Fragment>)}
        {peopleLoaded && !homePeople.length && <View style={{ padding: 34, borderRadius: 20, backgroundColor: '#fff', marginTop: 24 }}><Heading size={22}>{peopleLoadError ? 'Could not load creatives' : 'No nearby creatives yet'}</Heading><T style={{ color: color.muted, marginTop: 6 }}>{peopleLoadError ? 'Please try loading the directory again.' : 'Try a wider location radius or explore all Goa.'}</T><Button onPress={() => peopleLoadError ? void refreshPeople() : setRadius('All Goa')} style={{ alignSelf: 'flex-start', marginTop: 13 }}>{peopleLoadError ? 'Try again' : 'Show all Goa'}</Button></View>}
      </View>
    </>}
    {page === 'collection' && <View style={{ width: '100%', maxWidth: 1540, alignSelf: 'center', paddingHorizontal: pagePadding, paddingTop: 25, paddingBottom: 65 }}>
      <Pressable accessibilityRole="button" onPress={goHome}><T style={{ color: color.purple, fontWeight: '900' }}>← Back to home</T></Pressable>
      <View style={{ flexDirection: compact ? 'column' : 'row', justifyContent: 'space-between', alignItems: compact ? 'flex-start' : 'center', marginTop: 18, marginBottom: 18, gap: 10 }}><View><Heading size={compact ? 29 : 35}>{collection.title} <Text style={{ color: color.orange }}>✦</Text></Heading><T style={{ color: color.muted, marginTop: 4 }}>{visiblePeople.length} {visiblePeople.length === 1 ? 'creative' : 'creatives'} {place === 'Goa' ? 'in Goa' : 'near ' + place}</T></View><Pressable accessibilityRole="button" accessibilityLabel={'Sort by ' + sort} onPress={() => setSort(sort === 'Nearby' ? 'Top rated' : sort === 'Top rated' ? 'Most reviewed' : 'Nearby')} style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, borderRadius: 14, padding: 11 }}><T style={{ fontSize: 12 }}>Sort by <Text style={{ fontWeight: '900' }}>{sort} ↕</Text></T></Pressable></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 13 }}>{expandedPeople.map((person, index) => <ProfileCard key={person.id + '-' + index} person={person} width={cardWidth} favorite={favorites.includes(person.id)} onFavorite={() => toggleFavorite(person.id)} onOpen={() => openProfile(person)} onChat={() => openContact(person)} />)}</View>
      {!visiblePeople.length && <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 29 }}><Heading size={21}>No matches yet</Heading><T style={{ color: color.muted, marginTop: 6 }}>Try another specialty or a wider location.</T><Button onPress={() => openCollection('All creatives', 'all')} style={{ alignSelf: 'flex-start', marginTop: 13 }}>See all creatives</Button></View>}
    </View>}
    {page === 'map' && <View style={{ width: '100%', maxWidth: 1500, alignSelf: 'center', paddingHorizontal: pagePadding, paddingTop: compact ? 20 : 25, paddingBottom: 60 }}>{!compact && <Pressable onPress={goHome}><T style={{ color: color.purple, fontWeight: '900' }}>← Back to freelancers</T></Pressable>}{compact && <View style={{ zIndex: 20 }}>{mobileLocationPicker}</View>}<View style={{ marginTop: 15, marginBottom: 15 }}><Heading size={compact ? 27 : 30}>Creatives around {place} 📍</Heading><T style={{ color: color.muted, marginTop: 4 }}>{'Tap a pin to view a profile.'}</T></View><ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8 }}>{['Local', '10 km', '25 km', 'All Goa'].map(value => <Pressable key={value} onPress={() => setRadius(value)} style={{ paddingHorizontal: 17, paddingVertical: 9, borderRadius: 18, backgroundColor: radius === value ? color.purple : '#fff', borderWidth: 1, borderColor: radius === value ? color.purple : color.line }}><T style={{ color: radius === value ? '#fff' : color.ink, fontSize: 13, fontWeight: '900' }}>{value}</T></Pressable>)}</ScrollView><MapCanvas people={mapPeople} compact={compact} place={place} radius={radius} onSelect={openProfile} /><View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 13 }}><Text style={{ color: color.purple }}>●</Text><T style={{ fontSize: 13, color: color.muted }}>{mapPeople.length} creatives · Locations are approximate</T></View></View>}
    {page === 'chats' && userId && <ChatWorkspace viewerId={userId} compact={compact} people={activeChatPerson && !chatPeople.some(person => person.id === activeChatPerson.id) ? [activeChatPerson, ...chatPeople] : chatPeople} selected={activeChatPerson} messages={displayMessages} inbox={chatInbox} unreadTotal={unreadChats} draft={chatDraft} role={chatRoute?.freelancerId === userId ? 'freelancer' : 'finder'} messageKey={messageKey} onSelect={selectChat} onBack={() => { setChatRoute(null); setChatPerson(null); }} onClose={closeChats} onWhatsappSetup={needsWhatsapp ? openWhatsappPrompt : undefined} blocked={!!chatRoute && blockedFreelancers.includes(chatRoute.freelancerId)} onSafety={openSafety} onDraft={setChatDraft} onSend={sendMessage} onAttach={attachChatFile} attaching={chatFileBusy} />}
    {page === 'account' && <View style={{ width: '100%', maxWidth: 1230, alignSelf: 'center', paddingHorizontal: pagePadding, paddingTop: 29, paddingBottom: 60 }}>
      <Heading size={compact ? 29 : 34}>My space<Text style={{ color: color.coral }}> ✦</Text></Heading><T style={{ color: '#6880a8', marginTop: 5, marginBottom: 22 }}>Manage your profile, requirements and conversations.</T>
      {!!finder && !!ownProfile && <View style={{ flexDirection: 'row', gap: 9, marginBottom: 17 }}><Button outline={!finderSpace} flat onPress={() => { setSpaceView('finder'); setShowProfileActivity(false); }} style={{ minHeight: 38 }}>Finder space</Button><Button outline={finderSpace} flat onPress={() => { setSpaceView('freelancer'); setShowProfileActivity(false); }} style={{ minHeight: 38 }}>Freelancer space</Button></View>}
      <Pressable accessibilityRole="button" accessibilityLabel={finderSpace ? 'Edit Finder details' : 'Open your profile'} onPress={() => finderSpace ? enterFinder() : ownProfile ? openProfile(ownProfile) : startSetup()} style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#d5e2ff', borderRadius: 19, padding: compact ? 17 : 23, marginBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 17, shadowColor: '#5b6fb0', shadowOpacity: .04, shadowRadius: 12 }}><View style={{ width: 69, height: 69, borderRadius: 35, backgroundColor: '#f3e5ff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{(finderSpace ? finder?.imageUrl : ownProfile?.imageUrl) ? <Image source={{ uri: (finderSpace ? finder?.imageUrl : ownProfile?.imageUrl)! }} style={{ width: 69, height: 69, borderRadius: 35 }} /> : <TabIcon name="profile" color={color.purple} size={30} />}</View><View style={{ flex: 1 }}><T style={{ fontSize: 20, fontWeight: '900' }}>{finderSpace ? finder?.name || accountDisplayName || 'Finder' : ownProfile?.name || finder?.name || accountDisplayName || 'Visitor'}</T><T style={{ color: '#6880a8', fontSize: 13, marginTop: 3 }}>{userId ? `Signed in as ${finder && ownProfile ? 'Finder & Freelancer' : ownProfile ? 'Freelancer' : finder ? 'Finder' : (signedInRole || setupRole) === 'freelancer' ? 'Freelancer (setup pending)' : (signedInRole || setupRole) === 'finder' ? 'Finder (setup pending)' : 'a member'}${admin ? ' · Admin' : ''} · Goa` : 'Sign in to connect'}</T></View><T style={{ color: '#7690bd', fontSize: 28 }}>›</T></Pressable>
      {!userId && <Button onPress={enterFinder} style={{ marginBottom: 16 }}>Create an account or sign in</Button>}
      {userId && <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#cfe0ff', borderRadius: 21, padding: compact ? 18 : 26, marginBottom: 18, flexDirection: compact ? 'column' : 'row', alignItems: compact ? 'stretch' : 'center', gap: compact ? 18 : 28, shadowColor: '#6b56c6', shadowOpacity: .05, shadowRadius: 14 }}>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}><CompletionRing percent={accountPercent} /></View>
        <View style={{ flex: 1 }}><Heading size={22}>{accountPercent === 100 ? 'Your Profile Is Complete! ✦' : 'Complete your account ✦'}</Heading><T style={{ color: '#6880a8', marginTop: 5, lineHeight: 21 }}>{finderSpace ? accountPercent === 100 ? 'Your Finder details are ready. Keep your name and area up to date.' : 'Add your name and area so freelancers know who is contacting them.' : accountPercent === 100 ? 'Your profile is ready. Keep your information and portfolio up to date.' : 'A complete profile helps people find you and connect with confidence.'}</T><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 16 }}><Button onPress={() => finderSpace ? enterFinder() : accountPercent === 100 && ownProfile ? openProfile(ownProfile) : ownProfile ? editFreelancerProfile() : startSetup()} style={{ minHeight: 40 }}>{finderSpace ? finder ? 'Edit Finder details' : 'Finish Finder details' : accountPercent === 100 && ownProfile ? 'Preview profile' : 'Finish profile'}</Button></View>{!finderSpace && !ownProfile && <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}><Button outline={setupRole !== 'finder'} flat onPress={() => setSetupRole('finder')} style={{ minHeight: 33 }}>Finder</Button><Button outline={setupRole !== 'freelancer'} flat onPress={() => setSetupRole('freelancer')} style={{ minHeight: 33 }}>Freelancer</Button></View>}</View>
        <View style={{ flex: compact ? undefined : 1, borderLeftWidth: compact ? 0 : 1, borderTopWidth: compact ? 1 : 0, borderColor: '#e9edf7', paddingLeft: compact ? 0 : 25, paddingTop: compact ? 14 : 0, gap: 9 }}>{accountChecklist.map(item => <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ width: 19, height: 19, borderRadius: 10, backgroundColor: item.done ? '#12ab76' : '#fff', borderWidth: item.done ? 0 : 2, borderColor: '#8da3ca', alignItems: 'center', justifyContent: 'center' }}><T style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>{item.done ? '✓' : ''}</T></View><T style={{ color: '#536c94', fontSize: 13 }}>{item.label}</T></View>)}{!!setupLoadError && <T style={{ color: color.coral, fontSize: 12 }}>{setupLoadError}</T>}</View>
      </View>}
      {!finderSpace && needsWhatsapp && <View style={{ backgroundColor: '#edfbf5', borderWidth: 1, borderColor: '#b6ecd4', borderRadius: 19, padding: compact ? 17 : 21, marginBottom: 18, flexDirection: compact ? 'column' : 'row', alignItems: compact ? 'flex-start' : 'center', gap: 16 }}><View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#24c778', alignItems: 'center', justifyContent: 'center' }}><T style={{ color: '#fff', fontSize: 30 }}>◉</T></View><View style={{ flex: 1 }}><T style={{ color: '#0a5640', fontSize: 17, fontWeight: '900' }}>Let clients reach you on WhatsApp</T><T style={{ color: '#4d7d6b', fontSize: 13, marginTop: 3 }}>Add a number to show a WhatsApp button on your profile and in chats.</T></View><Button outline flat onPress={openWhatsappPrompt}>Add WhatsApp number →</Button></View>}
      {!!contentFlags.length && <View nativeID="account-flags" style={{ backgroundColor: '#fff4f6', borderWidth: 1, borderColor: '#f2cbd4', borderRadius: 18, padding: 17, marginBottom: 18 }}><T style={{ color: '#a32f4d', fontSize: 16, fontWeight: '900' }}>{contentFlags.some(flag => flag.target_kind === 'account') ? 'Your account is under review' : 'Content under review'}</T><T style={{ color: '#79495a', fontSize: 12, marginTop: 4 }}>Review the flagged items and the admin’s reason below. Flagged listings stay off public pages until the review is resolved; an account flag alone does not suspend your account.</T>{contentFlags.map(flag => <T key={flag.id} style={{ color: '#79495a', fontSize: 12, marginTop: 9 }}>• {flag.target_kind === 'account' ? 'Account' : flag.target_title || flag.target_kind}: {flag.reason}</T>)}</View>}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        <ActionTile icon="📄" title={finderSpace ? 'Your request activity' : 'Your profile activity'} detail={finderSpace ? 'See your requirements and the freelancers who approached them.' : 'See profile views and people who saved you.'} tone="#e4f2ff" onPress={() => { setShowProfileActivity(true); setPendingScrollTarget({ id: finderSpace ? 'request-activity' : 'profile-activity', page: 'account' }); }} />
        <ActionTile icon="📋" title="My requirements" detail="Follow your posted requirements and responses." tone="#f0e8ff" onPress={() => setPage('myPosts')} />
        {!finderSpace && <ActionTile icon="✦" title={ownProfile ? 'Edit freelancer profile' : 'Create a freelancer profile'} detail="Share your skills, story and portfolio." tone="#ddf8ed" onPress={editFreelancerProfile} />}
        <ActionTile icon="✎" title="Post a requirement" detail="Tell us what you need and connect with local talent." tone="#fff0e5" onPress={openNewRequest} />
        <ActionTile icon="◉" title={finderSpace ? 'My Finder details' : ownProfile ? 'My freelancer profile' : 'Create a Finder profile'} detail={finderSpace ? 'Update the name and area shown when you contact freelancers.' : 'See what other people can learn about you.'} tone="#e5f7f8" onPress={() => finderSpace ? enterFinder() : ownProfile ? openProfile(ownProfile) : enterFinder()} />
        <ActionTile icon="⌕" title={finderSpace ? 'Browse creatives' : 'Browse requirements'} detail={finderSpace ? 'Find freelancers whose skills match your needs.' : 'Find projects that match your skills.'} tone="#eee7ff" onPress={() => finderSpace ? goHome() : setPage('requests')} />
        {finderSpace && <ActionTile icon="✦" title="Create a freelancer profile" detail="Offer your own skills alongside your Finder account." tone="#ddf8ed" onPress={editFreelancerProfile} />}
        <ActionTile icon="☏" title="Chats" detail="Message people you have connected with." tone="#ffe8f1" wide onPress={openChats} />
        <ActionTile icon="♥" title="Saved creatives" detail="People you want to revisit." tone="#ffe5e9" wide onPress={() => { setCategory('all'); setSearch(''); setSearchDraft(''); setSavedOnly(true); setRadius('All Goa'); setPage('search'); }} />
        {admin && <ActionTile icon="⚑" title="Admin console" detail="Manage users, listings and moderation." tone="#e6edff" wide onPress={openAdminConsole} />}
      </View>
      {showProfileActivity && (finderSpace ? <View nativeID="request-activity" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#d9e7ff', borderRadius: 19, padding: 21, marginTop: 16 }}><Heading size={19}>Your request activity</Heading><T style={{ color: color.muted, fontSize: 12, marginTop: 3 }}>See how freelancers are responding to your requirements.</T><View style={{ flexDirection: 'row', gap: 12, marginTop: 13 }}><View style={{ flex: 1, borderRadius: 14, backgroundColor: '#f4efff', padding: 14 }}><T style={{ color: color.purple, fontSize: 24, fontWeight: '900' }}>{finderPosts.length}</T><T style={{ color: color.muted, fontSize: 12, fontWeight: '900' }}>Requirements posted</T></View><View style={{ flex: 1, borderRadius: 14, backgroundColor: '#fff0f3', padding: 14 }}><T style={{ color: color.coral, fontSize: 24, fontWeight: '900' }}>{finderPosts.reduce((total, post) => total + (applications[post.id] || []).length, 0)}</T><T style={{ color: color.muted, fontSize: 12, fontWeight: '900' }}>Freelancer approaches</T></View></View></View> : <View nativeID="profile-activity" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#d9e7ff', borderRadius: 19, padding: 21, marginTop: 16 }}><Heading size={19}>Your profile activity</Heading><T style={{ color: color.muted, fontSize: 12, marginTop: 3 }}>Signed-in visitors are counted once per day.</T><View style={{ flexDirection: 'row', gap: 12, marginTop: 13 }}><View style={{ flex: 1, borderRadius: 14, backgroundColor: '#f4efff', padding: 14 }}><T style={{ color: color.purple, fontSize: 24, fontWeight: '900' }}>{profileStats.profileViews}</T><T style={{ color: color.muted, fontSize: 12, fontWeight: '900' }}>Profile views</T></View><View style={{ flex: 1, borderRadius: 14, backgroundColor: '#fff0f3', padding: 14 }}><T style={{ color: color.coral, fontSize: 24, fontWeight: '900' }}>{profileStats.saves}</T><T style={{ color: color.muted, fontSize: 12, fontWeight: '900' }}>People who saved you</T></View></View></View>)}
      {userId && <Pressable accessibilityRole="button" onPress={signOut} style={{ paddingVertical: 20, alignItems: 'center' }}><T style={{ color: color.muted, fontWeight: '900' }}>Sign out</T></Pressable>}
    </View>}
    {page === 'myPosts' && <View style={{ width: '100%', maxWidth: 1050, alignSelf: 'center', paddingHorizontal: pagePadding, paddingTop: 29, paddingBottom: 60 }}><Pressable onPress={() => setPage('account')}><T style={{ color: color.purple, fontWeight: '900' }}>← My space</T></Pressable><View style={{ flexDirection: compact ? 'column' : 'row', justifyContent: 'space-between', alignItems: compact ? 'flex-start' : 'center', gap: 13, marginTop: 17, marginBottom: 20 }}><View><Heading size={30}>My requirements 📋</Heading><T style={{ color: color.muted, marginTop: 4 }}>See your posts and the freelancers who approached you.</T></View><Button onPress={openNewRequest}>Post a requirement</Button></View>{finderPosts.map(post => <View key={post.id} nativeID={`request-${post.id}`} style={{ backgroundColor: '#fff', borderRadius: 20, padding: 21, marginBottom: 12, borderWidth: 1, borderColor: color.line }}><TinyTag style={{ alignSelf: 'flex-start', marginBottom: 11 }}>YOUR POST</TinyTag>{post.moderationStatus === 'under_review' && <View style={{ backgroundColor: '#fff0f3', borderWidth: 1, borderColor: '#f5cbd6', borderRadius: 12, padding: 12, marginBottom: 12 }}><T style={{ color: '#b63756', fontWeight: '900' }}>Under review</T><T style={{ color: '#89546a', fontSize: 12, marginTop: 3 }}>This requirement is hidden from public listings while the admin reviews it.</T>{contentFlags.filter(flag => flag.target_kind === 'request' && flag.target_id === post.id).map(flag => <T key={flag.id} style={{ color: '#89546a', fontSize: 12, marginTop: 4 }}>Reason: {flag.reason} · {new Date(flag.created_at).toLocaleDateString()}</T>)}</View>}<Heading size={21}>{post.title}</Heading><T style={{ color: color.muted, marginTop: 5 }}>{post.taluka} · {catalog.find(item => item.id === post.category)?.label || post.category}</T><T style={{ marginTop: 11 }}>{post.details}</T><T style={{ color: color.purple, marginTop: 16, fontWeight: '900', fontSize: 15 }}>Approached freelancers ({(applications[post.id] || []).length})</T>{(applications[post.id] || []).length === 0 && <T style={{ color: color.muted, marginTop: 5 }}>Matching freelancers will appear here when they approach you.</T>}{(applications[post.id] || []).map(item => { const person = allPeople.find(value => value.id === item.freelancer_id); const connected = chatPairs.some(row => row.finderId === userId && row.freelancerId === item.freelancer_id); return <View key={item.id} style={{ marginTop: 9, padding: 12, backgroundColor: '#fbf9ff', borderWidth: 1, borderColor: '#e9e1f4', borderRadius: 16 }}><View style={{ flexDirection: 'row', gap: 11, alignItems: 'center' }}>{person && <View style={{ width: 58 }}><Portrait index={person.image} imageUrl={person.imageUrl} name={person.name} height={58} radius={12} /></View>}<View style={{ flex: 1 }}><T style={{ fontWeight: '900' }}>{person?.name || 'Freelancer'}</T><T style={{ color: color.muted, fontSize: 12 }}>{person ? `${person.role} · ${person.taluka}` : 'Approached your request'}</T></View><T style={{ color: connected ? '#26846c' : color.purple, fontSize: 12, fontWeight: '900' }}>{connected ? 'Connected' : item.status === 'declined' ? 'Declined' : 'Approached'}</T></View><T style={{ marginTop: 8 }} numberOfLines={3}>{item.note}</T>{person && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 11 }}><Button outline flat onPress={() => openProfile(person)} style={{ minHeight: 38 }}>View profile</Button>{item.status !== 'declined' && <Button flat onPress={() => openContact(person)} style={{ minHeight: 38 }}>{connected ? 'Open chat →' : 'Connect →'}</Button>}</View>}</View>; })}</View>)}</View>}
    {page === 'profile' && profile && <View style={{ width: '100%', maxWidth: 1260, alignSelf: 'center', paddingHorizontal: pagePadding, paddingTop: 24, paddingBottom: 65 }}>
      <Pressable accessibilityRole="button" onPress={goBackFromProfile}><T style={{ color: color.purple, fontWeight: '900' }}>← Back to {detailReturnPage === 'map' ? 'map' : detailReturnPage === 'search' ? 'search' : detailReturnPage === 'collection' ? collection.title.toLowerCase() : 'freelancers'}</T></Pressable>
      <View style={{ marginTop: 18, borderRadius: 28, backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, overflow: 'hidden' }}>
      <ProfileWall profile={allPeople.find(person => person.id === profile.id) || profile} compact={compact} narrow={narrow} rating={profileRating} reviewCount={profileReviewCount} saved={favorites.includes(profile.id)} onChat={() => openContact(profile)} onSave={() => toggleFavorite(profile.id)} onMap={() => { setPage('map'); setRadius('All Goa'); }} onSafety={userId && userId !== profile.id && !profile.demo ? () => openSafety(profile) : undefined} blocked={blockedFreelancers.includes(profile.id)} />
      {canEditPortfolio && contentFlags.some(flag => flag.target_kind === 'account') && <View nativeID="flag-account" style={{ marginHorizontal: narrow ? 18 : 32, marginBottom: 20, padding: 16, borderRadius: 14, backgroundColor: '#fff0f3', borderWidth: 1, borderColor: '#f4cbd6' }}><T style={{ color: '#a32f4d', fontWeight: '900' }}>Your account is under review</T>{contentFlags.filter(flag => flag.target_kind === 'account').map(flag => <T key={flag.id} style={{ color: '#79495a', fontSize: 12, marginTop: 6 }}>Reason: {flag.reason}</T>)}</View>}
      {canEditPortfolio && <View style={{ paddingHorizontal: narrow ? 18 : 32, paddingBottom: 22 }}><ProfileFramePicker person={allPeople.find(person => person.id === profile.id) || profile} designs={profileFrames} onChoose={async (preset, customId) => { if (!userId) throw new Error('Sign in to choose a frame.'); await live.saveProfileFrame(userId, preset, customId); const frameOverlayUrl = profileFrames.find(frame => frame.id === customId)?.url; const applyFrame = (person: Freelancer) => ({ ...person, framePreset: preset, frameCustomId: customId || undefined, frameOverlayUrl }); setProfile(current => current?.id === userId ? applyFrame(current) : current); setOwnProfile(current => current?.id === userId ? applyFrame(current) : current); setLivePeople(current => current.map(person => person.id === userId ? applyFrame(person) : person)); }} /></View>}
      <ProfileServices key={`services-${profile.id}`} profile={profile} isOwner={canEditPortfolio} narrow={narrow} flags={contentFlags} />
      {canEditPortfolio && <FlaggedPortfolio assets={portfolioAssets[profile.id] || []} flags={contentFlags} narrow={narrow} />}
      <ProfileMedia key={profile.id} profile={{ ...profile, links: withoutWhatsapp(profile.links) }} narrow={narrow} canEdit={canEditPortfolio}
        photos={visiblePortfolioAssets.filter(item => item.kind === 'photo').map(item => ({ id: item.id, url: item.url, caption: item.caption || '' }))}
        video={visiblePortfolioAssets.filter(item => item.kind === 'video').map(item => ({ id: item.id, url: item.url, caption: item.caption || '' }))[0] || null}
        documents={visiblePortfolioAssets.filter(item => item.kind === 'document').map(item => ({ id: item.id, name: item.file_name, size: item.size_bytes, uri: item.url, caption: item.caption || '' }))}
        onAddPhotos={() => pickPortfolio('photo')} onAddVideo={() => pickPortfolio('video')} onAddDocuments={() => pickPortfolio('document')}
        onRemovePhoto={index => removePortfolio('photo', index)} onRemoveVideo={() => removePortfolio('video', 0)} onRemoveDocument={index => removePortfolio('document', index)}
        onSaveCaption={async (id, caption) => { const asset = visiblePortfolioAssets.find(item => item.id === id); if (!asset || asset.freelancer_id !== userId) throw new Error('Only the owner can edit a caption.'); await updatePortfolioCaption(asset, caption); setPortfolioAssets(previous => ({ ...previous, [profile.id]: (previous[profile.id] || []).map(item => item.id === id ? { ...item, caption: caption.trim() } : item) })); }}
        onSaveLinks={async links => { if (!userId || userId !== profile.id) throw new Error('Sign in as the profile owner to edit links.'); if (publicWhatsapp(profile.links) && links.length > 29) throw new Error('Keep up to 29 portfolio links while WhatsApp is displayed.'); const savedLinks = [...(publicWhatsapp(profile.links) ? [{ title: 'WhatsApp', url: publicWhatsapp(profile.links)! }] : []), ...withoutWhatsapp(links)]; await live.savePortfolioLinks(userId, savedLinks); setProfile(current => current?.id === profile.id ? { ...current, links: savedLinks } : current); setOwnProfile(current => current?.id === profile.id ? { ...current, links: savedLinks } : current); setLivePeople(current => current.map(person => person.id === profile.id ? { ...person, links: savedLinks } : person)); }} />
      </View>
      <ProfileBackground key={`background-${profile.id}`} profile={profile} canEdit={canEditPortfolio} onSave={async (certifications, experience) => { if (!userId || profile.id !== userId) throw new Error('Only the profile owner can edit these details.'); await live.saveProfessionalBackground(userId, certifications, experience); const changes = { certifications, experience }; setProfile(current => current?.id === userId ? { ...current, ...changes } : current); setOwnProfile(current => current?.id === userId ? { ...current, ...changes } : current); setLivePeople(current => current.map(person => person.id === userId ? { ...person, ...changes } : person)); }} />
      <View nativeID="profile-reviews"><ProfileReviews key={`reviews-${profile.id}`} profile={profile} userId={finder ? userId : null} onChanged={refreshPeople} /></View>
      {canEditPortfolio && <Button outline onPress={() => { setFormName(profile.name); setFormRole(profile.role); setFormCategory(profile.category); setFormWhy(profile.why); setFormDescription(profile.description || ''); setFormSoftware(profile.software || []); setFormLinksText(withoutWhatsapp(profile.links).map(link => `${link.title} | ${link.url}`).join('\n')); setFormWhatsapp(publicWhatsapp(profile.links)?.replace('https://wa.me/', '') || ''); setFormImage(profile.imageUrl || ''); setFormImageFile(null); setFormWork(profile.work.join(', ')); setDialog('freelancer'); }} style={{ alignSelf: 'flex-start', marginTop: 15 }}>Edit profile details</Button>}
      <View style={{ marginTop: 44 }}><Heading size={25}>More people you might like <Text style={{ color: color.coral }}>✦</Text></Heading><T style={{ color: color.muted, marginTop: 4, marginBottom: 15 }}>Related to your searches and interests in Goa.</T><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 13 }}>{allPeople.filter(person => person.id !== profile.id).slice(0, 4).map(person => <ProfileCard key={person.id} person={person} width={285} favorite={favorites.includes(person.id)} onFavorite={() => toggleFavorite(person.id)} onOpen={() => openProfile(person)} onChat={() => openContact(person)} />)}</ScrollView></View>
    </View>}
    {page === 'requests' && <View style={{ width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: pagePadding, paddingTop: 25, paddingBottom: 60 }}>
      <Pressable onPress={goHome}><T style={{ color: color.purple, fontWeight: '900' }}>← Back to freelancers</T></Pressable>
      <View style={{ flexDirection: narrow ? 'column' : 'row', justifyContent: 'space-between', alignItems: narrow ? 'flex-start' : 'center', gap: 13, marginTop: 17, marginBottom: 20 }}><View><Heading size={30}>Requests around you 📣</Heading><T style={{ color: color.muted, marginTop: 4 }}>Local freelancers see matching requests first. Reach expands over three days.</T></View><Button onPress={openNewRequest}>Post a request →</Button></View>
      {displayedRequests.length ? displayedRequests.map(post => <View key={post.id} nativeID={`request-${post.id}`} style={{ backgroundColor: '#fff', borderRadius: 20, padding: 21, marginBottom: 12, borderWidth: 1, borderColor: color.line }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><Heading size={21}>{post.title}</Heading><TinyTag>{requestReach(post)}</TinyTag></View>
        <T style={{ color: color.muted, marginTop: 5 }}>{catalog.find(item => item.id === post.category)?.label || post.category} · {post.taluka} · Posted by {post.finder}</T>
        <T style={{ marginTop: 12, lineHeight: 22 }}>{post.details}</T>
        {post.finderId === userId ? <View style={{ marginTop: 17 }}>
          <T style={{ color: color.purple, fontWeight: '900', fontSize: 16 }}>Approached freelancers ({(applications[post.id] || []).length})</T>
          {(applications[post.id] || []).length === 0 && <T style={{ color: color.muted, marginTop: 7 }}>Matching local freelancers can approach you here. Their profiles will appear below.</T>}
          {(applications[post.id] || []).map(item => { const person = allPeople.find(value => value.id === item.freelancer_id); const connected = chatPairs.some(row => row.finderId === userId && row.freelancerId === item.freelancer_id); return <View key={item.id} style={{ backgroundColor: '#fbf9ff', borderColor: '#e9e1f4', borderWidth: 1, borderRadius: 17, padding: narrow ? 12 : 15, marginTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {person && <View style={{ width: 66, height: 66, borderRadius: 13, overflow: 'hidden' }}><Portrait index={person.image} imageUrl={person.imageUrl} name={person.name} height={66} radius={13} /></View>}
              <View style={{ flex: 1, minWidth: 0 }}><T style={{ fontWeight: '900', fontSize: 17 }} numberOfLines={1}>{person?.name || 'Freelancer'}</T><T style={{ color: color.muted, fontSize: 13, marginTop: 2 }} numberOfLines={1}>{person ? `${person.role} · ${person.taluka}` : 'Approached your request'}</T><T style={{ color: item.status === 'declined' ? color.muted : '#26846c', fontSize: 12, fontWeight: '900', marginTop: 3 }}>{connected ? 'Connected' : item.status === 'declined' ? 'Declined' : 'Ready to connect'}</T></View>
            </View>
            <T style={{ marginTop: 11, lineHeight: 20 }} numberOfLines={3}>{item.note}</T>
            {person && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 }}><Button outline flat onPress={() => openProfile(person)} style={{ minHeight: 38 }}>View profile</Button>{item.status !== 'declined' && <Button flat onPress={() => openContact(person)} style={{ minHeight: 38 }}>{connected ? 'Open chat →' : 'Connect →'}</Button>}{item.status === 'new' && <Button outline flat onPress={() => reviewApplication(post.id, item.id, 'declined')} style={{ minHeight: 38, borderColor: '#e7dce8' }} textStyle={{ color: color.muted }}>Decline</Button>}</View>}
          </View>; })}
        </View> : ownProfile && post.finderId !== userId && requestMatchesFreelancer(post, ownProfile) ? (applications[post.id] || []).some(item => item.freelancer_id === userId) ? <View style={{ alignSelf: 'flex-start', marginTop: 16, backgroundColor: '#edfbf3', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9 }}><T style={{ color: '#167a55', fontWeight: '900', fontSize: 13 }}>✓ Approach sent to this Finder</T></View> : <View style={{ marginTop: 16 }}><Field value={applyDraft[post.id] || ''} onChangeText={value => setApplyDraft(previous => ({ ...previous, [post.id]: value }))} placeholder="Tell the Finder why you're a good match" multiline /><Button onPress={() => apply(post)} style={{ marginTop: 9, alignSelf: 'flex-start' }}>Approach this Finder →</Button></View> :
        <T style={{ color: color.purple, fontSize: 12, marginTop: 12, fontWeight: '900' }}>{`Matching freelancers in ${post.taluka} see this first. Reach widens each day.`}</T>}
      </View>) : <View style={{ alignItems: 'center', borderRadius: 24, backgroundColor: '#fff', padding: 48 }}><Text style={{ fontSize: 38 }}>📝</Text><Heading size={22}>{ownProfile ? 'No matching requests yet' : 'Tell local talent what you need'}</Heading><T style={{ color: color.muted, textAlign: 'center', marginTop: 6 }}>A clear brief posted 3–4 days ahead gives more nearby creatives time to respond.</T><Button onPress={openNewRequest} style={{ marginTop: 18 }}>Post your first request</Button></View>}
    </View>}
    {page === 'admin' && admin && <View style={{ width: '100%', maxWidth: 950, alignSelf: 'center', paddingHorizontal: pagePadding, paddingTop: 25, paddingBottom: 60 }}>
      <Pressable onPress={goHome}><T style={{ color: color.purple, fontWeight: '900' }}>← Back to freelancers</T></Pressable>
      <Heading size={30} style={{ marginTop: 20, marginBottom: 5 }}>Category review ✨</Heading>
      <T style={{ color: color.muted, marginBottom: 20 }}>Approve new talents so other people can discover them from the category list.</T>
      {suggestions.length ? suggestions.map(item => <View key={item.id} style={{ backgroundColor: '#fff', borderColor: color.line, borderWidth: 1, borderRadius: 18, padding: 18, marginBottom: 9 }}>
        <T style={{ fontWeight: '900', fontSize: 18 }}>{item.proposed_name}</T><T style={{ color: color.muted, fontSize: 12, marginTop: 4 }}>{new Date(item.created_at).toLocaleDateString()}</T>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 13 }}><Button onPress={() => reviewSuggestion(item.id, item.proposed_name, true)}>Approve</Button><Button outline onPress={() => reviewSuggestion(item.id, item.proposed_name, false)}>Decline</Button></View>
      </View>) : <T style={{ color: color.muted }}>No pending categories.</T>}
    </View>}
    {page !== 'chats' && <View style={{ marginTop: 'auto', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: color.line, paddingHorizontal: pagePadding, paddingVertical: 22 }}><View style={{ maxWidth: 1540, width: '100%', alignSelf: 'center', flexDirection: compact ? 'column' : 'row', alignItems: compact ? 'flex-start' : 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}><Image source={Platform.OS==='web'?{uri:brandLogo as unknown as string}:brandLogo} resizeMode="contain" accessibilityLabel="WhyChoozeMe logo" style={{ width: 205, height: 43 }} /><View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 3 }}>{infoLinks.map(item => <HeaderInfoLink key={item.id} id={item.id} label={item.label} onPress={() => openInfo(item.id)} />)}<Pressable accessibilityRole="button" accessibilityLabel="Terms and privacy" onPress={() => setLegalOpen(true)} style={{ paddingHorizontal: 10, paddingVertical: 9 }}><T style={{ color: color.purple, fontSize: 12, fontWeight: '900' }}>Terms & privacy</T></Pressable></View><T style={{ color: color.muted, fontSize: 12 }}>Made for local talent in Goa ✺</T></View></View>}
    </ScrollView>
    <MobileCategoryNavigation visible={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} categories={catalog} selectedCategory={page === 'search' || page === 'collection' ? category : undefined} onCategory={openHighlightedCategory} onAll={() => { setCategory('all'); setSavedOnly(false); setSearch(''); setSearchDraft(''); setPage('search'); }} onMap={() => setPage('map')} onRequests={() => setPage('requests')} />
    {compact && page !== 'chats' && <View style={{ backgroundColor: '#fffaf3', paddingHorizontal: 11, paddingTop: 7, paddingBottom: Platform.OS === 'ios' ? 16 : 9 }}><View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#eae3f1', borderRadius: 26, flexDirection: 'row', paddingHorizontal: 5, paddingVertical: 5, shadowColor: '#3e246e', shadowOpacity: .14, shadowRadius: 16, elevation: 7 }}>{mobileTabs.map(tab => { const selected = activeMobileTab === tab.id; return <Pressable key={tab.id} accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{ selected }} onPress={() => goMobileTab(tab.id)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 56, gap: 2, borderRadius: 20, backgroundColor: selected ? '#faf6ff' : 'transparent' }}><View style={{ minWidth: 44, height: 31, borderRadius: 17, backgroundColor: selected ? '#e9dcff' : 'transparent', alignItems: 'center', justifyContent: 'center', transform: [{ translateY: selected ? -1 : 0 }] }}><TabIcon name={tab.icon} color={selected ? color.purple : '#8e8ca0'} /></View><T style={{ color: selected ? color.purple : '#77758b', fontSize: 11, fontWeight: selected ? '900' : '700' }}>{tab.label}</T></Pressable>; })}</View></View>}
    {!compact && page !== 'map' && page !== 'chats' && <View style={{ position: 'absolute', right: 22, bottom: 20, alignItems: 'flex-end', gap: 8, zIndex: 15 }}>
      {mapShortcutHovered && <View pointerEvents="none" style={[{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e7dcff', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 8, shadowColor: '#241644', shadowOpacity: .12, shadowRadius: 9, elevation: 3 }, menuMotion]}><T style={{ color: color.purple, fontSize: 12, fontWeight: '900' }}>Find local talent across Goa ✦</T></View>}
      <Pressable accessibilityRole="button" accessibilityLabel="Explore freelancers on map" onHoverIn={() => setMapShortcutHovered(true)} onHoverOut={() => setMapShortcutHovered(false)} onFocus={() => setMapShortcutHovered(true)} onBlur={() => setMapShortcutHovered(false)} onPress={() => { setMapShortcutHovered(false); setMenu(null); setProfile(null); setPage('map'); }} style={({ pressed }) => [{ height: tablet ? 52 : 62, borderRadius: 32, backgroundColor: color.purple, borderWidth: 1, borderColor: '#a678ff', flexDirection: 'row', alignItems: 'center', paddingLeft: tablet ? 6 : 7, paddingRight: tablet ? 13 : 17, gap: tablet ? 7 : 10, shadowColor: color.purple, shadowOpacity: mapShortcutHovered ? .3 : .21, shadowRadius: mapShortcutHovered ? 16 : 11, elevation: mapShortcutHovered ? 7 : 4, transform: [{ scale: pressed ? .97 : mapShortcutHovered ? 1.035 : 1 }] }, Platform.OS === 'web' ? { cursor: 'pointer', backgroundImage: 'linear-gradient(120deg,#8651fa,#6734e8)', transition: 'transform 190ms ease, box-shadow 190ms ease' } as any : null]}><View style={{ width: tablet ? 38 : 46, height: tablet ? 38 : 46, borderRadius: 24, backgroundColor: 'rgba(255,255,255,.2)', alignItems: 'center', justifyContent: 'center' }}><TabIcon name="map" color="#fff" size={tablet ? 21 : 25} /></View><View><T style={{ color: '#fff', fontSize: tablet ? 13 : 14, fontWeight: '900', lineHeight: 18 }}>{tablet ? 'Map' : 'Explore map'}</T>{!tablet && <T style={{ color: '#ede3ff', fontSize: 10, fontWeight: '800', lineHeight: 14 }}>See people nearby</T>}</View></Pressable>
    </View>}
    {!!notice && <Pressable onPress={() => setNotice('')} style={{ position: 'absolute', alignSelf: 'center', bottom: compact ? 80 : 25, left: 15, right: compact ? 15 : 85, backgroundColor: '#1f1942', paddingHorizontal: 17, paddingVertical: 11, borderRadius: 14, maxWidth: 470, zIndex: 30 }}><Text style={{ color: '#fff', fontFamily: 'Nunito', fontSize: 13 }}>{notice}  ×</Text></Pressable>}
    <Overlay visible={!!infoDialog} title={infoLinks.find(item => item.id === infoDialog)?.label || ''} onClose={() => setInfoDialog(null)} width={560}>
      {infoDialog && <View style={{ paddingBottom: 8 }}><View style={{ width: 52, height: 52, borderRadius: 17, backgroundColor: '#f2eaff', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><InfoNavIcon name={infoDialog} size={27} color={color.purple} /></View><Heading size={21} style={{ marginBottom: 9 }}>{infoContent[infoDialog].lead}</Heading><T style={{ color: color.muted, lineHeight: 23 }}>{infoContent[infoDialog].detail}</T></View>}
    </Overlay>
    <Overlay visible={legalOpen} title="Terms & privacy" onClose={() => setLegalOpen(false)} width={720}><PlatformTerms /></Overlay>
    <Overlay visible={dialog === 'setup' && !!userId} title="Complete your account ✦" onClose={() => setDialog(null)} width={660}>
      <T style={{ color: color.muted, marginBottom: 12 }}>Step {Math.max(1, completionSteps.indexOf(setupStep) + 1)} of {completionSteps.length} · {completedSteps} completed</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>{completionSteps.map((step, index) => <Pressable key={step} accessibilityRole="button" accessibilityLabel={`Step ${index + 1}: ${setupLabels[step]}`} onPress={() => setSetupStep(step)} style={{ paddingHorizontal: 11, paddingVertical: 7, borderRadius: 15, backgroundColor: step === setupStep ? color.purple : stepComplete(step, completionState) ? '#e8fbef' : '#f4effa' }}><T style={{ color: step === setupStep ? '#fff' : stepComplete(step, completionState) ? '#087a4c' : color.muted, fontSize: 12, fontWeight: '900' }}>{index + 1}. {setupLabels[step]}{stepComplete(step, completionState) ? ' ✓' : ''}</T></Pressable>)}</View>
      {setupStep === 'role' && <><Heading size={20}>What brings you here?</Heading><T style={{ color: color.muted, marginTop: 5 }}>You can add the other role later from My space. One account can have both profiles.</T><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 16 }}><Button outline onPress={() => { setSetupRole('finder'); setSetupStep('finder'); }}>I need to find talent →</Button><Button outline onPress={() => { setSetupRole('freelancer'); setSetupStep('freelancer'); }}>I offer a skill →</Button></View></>}
      {setupStep === 'finder' && <><Heading size={20}>Finder details</Heading><T style={{ color: color.muted, marginTop: 5 }}>Add your name and area so freelancers know who is sending a request.</T><T style={{ color: finder ? '#087a4c' : color.coral, marginTop: 14, fontWeight: '900' }}>{finder ? `✓ Saved as ${finder.name}` : '○ Finder profile still needed'}</T><Button onPress={editSetupProfile} style={{ alignSelf: 'flex-start', marginTop: 15 }}>{finder ? 'Review Finder details' : 'Add Finder details'} →</Button><Button outline onPress={() => { setDialog(null); setPage('account'); }} style={{ alignSelf: 'flex-start', marginTop: 10 }}>Finish setup →</Button></>}
      {setupStep === 'freelancer' && <><Heading size={20}>Your public work profile</Heading><T style={{ color: color.muted, marginTop: 5 }}>Add your name, role, photo, a short introduction and a description of your work. You can add software and portfolio links in the same form.</T><View style={{ marginTop: 13, gap: 5 }}><T>{ownProfile ? '✓ Profile created' : '○ Profile needed'}</T><T>{ownProfile?.imageUrl ? '✓ Profile photo added' : '○ Profile photo missing'}</T><T>{ownProfile?.description?.trim() ? '✓ Work description added' : '○ Work description missing'}</T></View><Button onPress={editSetupProfile} style={{ alignSelf: 'flex-start', marginTop: 15 }}>{ownProfile ? 'Edit work profile' : 'Create work profile'} →</Button><Button outline onPress={() => { setDialog(null); setPage('account'); }} style={{ alignSelf: 'flex-start', marginTop: 10 }}>Finish setup →</Button></>}
    </Overlay>
    <Overlay visible={dialog === 'whatsapp'} title="Add your WhatsApp number" onClose={() => setDialog(null)} width={500}>
      <T style={{ color: color.muted, lineHeight: 21, marginBottom: 16 }}>Clients will see a WhatsApp button on your public profile and in their chat with you. Your number becomes public only when you save it here.</T>
      <Label>WhatsApp number with country code</Label><Field value={formWhatsapp} onChangeText={setFormWhatsapp} placeholder="+91 98765 43210" keyboardType="phone-pad" />
      {!!formError && <T style={{ color: color.coral, marginTop: 9 }}>{formError}</T>}
      <View style={{ flexDirection: 'row', gap: 9, marginTop: 17 }}><Button onPress={() => void saveWhatsapp()}>Save public number</Button><Button outline flat onPress={() => setDialog(null)}>Maybe later</Button></View>
    </Overlay>
    <Overlay visible={dialog === 'finder'} title="Your Finder profile" onClose={() => { setSetupReturn(false); setPendingContact(null); setPendingSafety(null); setDialog(null); }}>
      <T style={{ color: color.muted, marginBottom: 17 }}>A Finder profile lets you post requirements and connect with freelancers. You can keep your Freelancer profile too.</T>
      <Label>Your name</Label><Field value={finderName} onChangeText={setFinderName} placeholder="Your full name" />
      <View style={{ height: 13 }} /><Label>Profile photo (optional)</Label><View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 11 }}>{!!(finderImagePreview || finder?.imageUrl) && <Image source={{ uri: finderImagePreview || finder?.imageUrl }} style={{ width: 64, height: 64, borderRadius: 32 }} />}<Button outline onPress={pickFinderPhoto}>{finderImageFile ? 'Change selected photo' : finder?.imageUrl ? 'Change photo' : 'Upload a photo'}</Button>{!!finder?.avatarPath && !finderImageFile && <Button outline flat onPress={() => void deleteFinderPhoto()}>Remove photo</Button>}</View><T style={{ color: color.muted, fontSize: 12, marginTop: 5 }}>JPEG, PNG or WebP under 2 MB. Your photo appears in My Space, conversations, and beside public reviews you write.</T>
      <View style={{ height: 13 }} /><Label>Your taluka</Label><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{(Object.keys(talukaCenters) as Taluka[]).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: finderTaluka === value }} onPress={() => setFinderTaluka(value)} style={{ paddingHorizontal: 11, paddingVertical: 7, borderRadius: 15, backgroundColor: finderTaluka === value ? '#eee3ff' : '#f6f2f9' }}><T style={{ color: finderTaluka === value ? color.purple : color.muted, fontSize: 12, fontWeight: '900' }}>{value}</T></Pressable>)}</View>
      {!!formError && <T style={{ color: color.coral, fontSize: 12, marginTop: 10 }}>{formError}</T>}
      <Button onPress={() => void saveFinderProfile()} style={{ marginTop: 16 }}>{finder ? 'Save Finder profile' : 'Create Finder profile'}</Button>
    </Overlay>
    <Overlay visible={dialog === 'freelancer'} title={ownProfile ? 'Edit your profile ✦' : 'Show your talent 🌟'} onClose={() => { setFormImageFile(null); setSetupReturn(false); setDialog(null); }} width={680}><T style={{ color: color.muted, marginBottom: 16 }}>Tell people what you do, what tools you use, and where to see more work.</T><Label>Your name</Label><Field value={formName} onChangeText={setFormName} placeholder="Your full name" /><View style={{ height: 11 }} /><Label>Your role</Label><Field value={formRole} onChangeText={setFormRole} placeholder="e.g. Graphic designer" /><View style={{ height: 11 }} /><Label>Category</Label><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 8 }}>{catalog.filter(item => item.id !== 'all').map(item => <Pressable key={item.id} onPress={() => setFormCategory(item.id)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: formCategory === item.id ? color.purple : '#f4eff8' }}><T style={{ fontSize: 12, color: formCategory === item.id ? '#fff' : color.ink }}>{item.icon} {item.label}</T></Pressable>)}</ScrollView>{formCategory === 'other' && <><Field value={customCategory} onChangeText={setCustomCategory} placeholder="Name your skill or category" /><T style={{ color: color.muted, fontSize: 12, marginTop: 5 }}>New names go into a pending category list for review.</T></>}<View style={{ height: 11 }} /><Label>Profile photo</Label><View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" }}>{!!(formImagePreview || formImage) && <Image source={{ uri: formImagePreview || formImage }} style={{ width: 62, height: 62, borderRadius: 16 }} />}<Button outline onPress={pickProfilePhoto}>{formImageFile ? "Change selected photo" : "Upload a photo"}</Button></View>{!!formImageFile && <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 }}><T style={{ color: color.purple, fontSize: 12 }}>{formImageFile.name} · ready to save</T><Pressable accessibilityRole="button" onPress={() => setFormImageFile(null)}><T style={{ color: color.coral, fontWeight: "900", fontSize: 12 }}>Remove</T></Pressable></View>}<T style={{ color: color.muted, fontSize: 12, marginTop: 5 }}>JPEG, PNG or WebP under 2 MB. Your photo appears square on your profile.</T><Field value={formImage} onChangeText={setFormImage} placeholder="Or paste a public HTTPS photo URL" style={{ marginTop: 9 }} /><View style={{ height: 11 }} /><Label>Portfolio highlights</Label><Field value={formWork} onChangeText={setFormWork} placeholder="e.g. Wedding shoots, portraits, brand work" /><T style={{ color: color.muted, fontSize: 12, marginTop: 4, marginBottom: 11 }}>Separate highlights with commas.</T><Label>Why choose you?</Label><Field value={formWhy} onChangeText={setFormWhy} placeholder="A short introduction visitors see first" multiline /><View style={{ height: 13 }} /><Label>Description</Label><RichDescriptionEditor value={formDescription} onChange={setFormDescription} /><T style={{ color: color.muted, fontSize: 12, marginTop: 4 }}>This appears in the Description tab under The work on your profile.</T><View style={{ height: 17 }} /><Label>Software and tools you know</Label><SoftwarePicker value={formSoftware} onChange={setFormSoftware} /><View style={{ height: 17 }} /><Label>WhatsApp number (optional · public)</Label><Field value={formWhatsapp} onChangeText={setFormWhatsapp} placeholder="+91 98765 43210" keyboardType="phone-pad" /><T style={{ color: color.muted, fontSize: 12, marginTop: 4 }}>Include your country code. Saving this makes your WhatsApp number visible to everyone viewing your profile and opens WhatsApp outside WhyChoozeMe.</T><View style={{ height: 17 }} /><Label>Portfolio links</Label><Field value={formLinksText} onChangeText={setFormLinksText} placeholder={'My website | https://example.com\nWork on Drive | https://drive.google.com/...'} multiline style={{ minHeight: 95 }} /><T style={{ color: color.muted, fontSize: 12, marginTop: 4 }}>One link per line. Use “Title | https://link” or paste just the URL. You can also add links later in The work → Links.</T>{!!formError && <T style={{ color: color.coral, fontSize: 13, marginTop: 8 }}>{formError}</T>}<Button onPress={createFreelancer} style={{ marginTop: 17 }}>{ownProfile ? 'Save profile' : 'Create my profile'}</Button><T style={{ color: color.muted, fontSize: 12, marginTop: 11, textAlign: 'center' }}>Your profile is saved to your account.</T></Overlay>
    <Overlay visible={dialog === 'request'} title="Post a local request 📣" onClose={() => setDialog(null)}><T style={{ color: color.muted, marginBottom: 16 }}>People in your taluka see it first. Reach widens to all Goa over three days.</T><Label>What do you need?</Label><Field value={requestTitle} onChangeText={setRequestTitle} placeholder="e.g. Graphic designer for my café" /><View style={{ height: 11 }} /><Label>Category</Label><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 8 }}>{catalog.filter(item => item.id !== 'all').map(item => <Pressable key={item.id} onPress={() => setRequestCategory(item.id)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: requestCategory === item.id ? color.purple : '#f4eff8' }}><T style={{ fontSize: 12, color: requestCategory === item.id ? '#fff' : color.ink }}>{item.icon} {item.label}</T></Pressable>)}</ScrollView><View style={{ height: 11 }} /><Label>Tell them about the work</Label><Field value={requestDetails} onChangeText={setRequestDetails} placeholder="Timeline, budget, style and what a great result looks like..." multiline /><T style={{ color: color.muted, fontSize: 12, marginTop: 10 }}>Tip: post 3–4 days before you need someone for the best local reach.</T>{!!formError && <T style={{ color: color.coral, fontSize: 13, marginTop: 8 }}>{formError}</T>}<Button onPress={postRequest} style={{ marginTop: 17 }}>Post request</Button></Overlay>
    <Overlay visible={dialog === 'safety'} title={safetyTarget ? `Report or block ${safetyTarget.name}` : 'Report or block'} onClose={() => setDialog(null)} width={540}>
      <T style={{ color: color.muted, marginBottom: 14 }}>Reports go privately to the admin team. Blocking stops new messages between you and this freelancer. You can unblock later.</T>
      <Label>Reason for reporting</Label>
      <Field value={safetyReason} onChangeText={setSafetyReason} placeholder="Describe what happened (at least 10 characters)" multiline style={{ minHeight: 100 }} />
      {!!formError && <T style={{ color: color.coral, fontSize: 12, marginTop: 8 }}>{formError}</T>}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 17 }}>
        <Button disabled={safetyBusy} onPress={() => void submitSafety('report')}>Send report</Button>
        {safetyTarget && !blockedFreelancers.includes(safetyTarget.id) && <><Button outline disabled={safetyBusy} onPress={() => void submitSafety('block')}>Block</Button><Button outline disabled={safetyBusy} onPress={() => void submitSafety('reportBlock')}>Report and block</Button></>}
        {safetyTarget && blockedFreelancers.includes(safetyTarget.id) && <Button outline disabled={safetyBusy} onPress={() => void submitSafety('unblock')}>Unblock</Button>}
      </View>
    </Overlay>
    <Overlay visible={dialog === 'notifications'} title="Notifications" onClose={() => setDialog(null)} width={580}>
      <NotificationCenter notices={remoteNotices} unreadChats={unreadChats} onOpen={openNotice} onChats={() => { setDialog(null); openChats(); }} onMarkAllRead={markAllNoticesRead} />
    </Overlay>
  </View>;
}
