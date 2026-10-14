import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StatusBar, Text, TextInput, View, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapCanvas from './src/MapCanvas';
import ChatWorkspace from './src/ChatWorkspace';
import CarouselRow from './src/CarouselRow';
import HomeHighlights from './src/HomeHighlights';
import AvailabilityCalendar from './src/AvailabilityCalendar';
import ProfileWall from './src/ProfileWall';
import ProfileMedia from './src/ProfileMedia';
import { HiringDashboard, HiringProfile } from './src/HiringWorkspace';
import { documentUploadError, hasExactVideoRatio, photoUploadError, videoUploadError } from './src/mediaLimits';
import { DateRange } from './src/booking';
import { ChatIcon, ChevronDown, InfoNavIcon, TabIcon } from './src/icons';
import { Button, color, Field, Heading, Portrait, TinyTag } from './src/UI';
import { categories, Category, ChatMessage, distanceKm, Finder, Freelancer, places, RequestPost, requestMatchesFreelancer, requestReach, talukaCenters, Taluka } from './src/data';
import * as live from './src/liveApi';
import { Inquiry, listInquiries } from './src/inquiryApi';
import { InquiryForm, InquiryInbox } from './src/InquiryWorkspace';
import { listPortfolioAssets, PortfolioAsset, removePortfolioAsset, replacePortfolioVideo, uploadPortfolioAsset } from './src/portfolioApi';
import { addLeaveBlock, LeaveBlock, ownLeaveBlocks, publicBusyDays, removeLeaveBlock } from './src/availabilityApi';
import { guestProfileVisit } from './src/guestAccess';
import { DesktopCategoryNavigation, MobileCategoryNavigation } from './src/CategoryNavigation';

type Page = 'home' | 'search' | 'collection' | 'map' | 'account' | 'profile' | 'requests' | 'admin' | 'chats' | 'finderHub' | 'freelancerHub' | 'inquiries' | 'myPosts' | 'newRequest' | 'hiring';
type Dialog = 'finder' | 'freelancer' | 'request' | 'notifications' | null;
type InfoTopic = 'about' | 'contact' | 'mission';
const infoLinks: { id: InfoTopic; label: string }[] = [{ id: 'about', label: 'Who are we?' }, { id: 'contact', label: 'Contact us' }, { id: 'mission', label: 'Our mission' }];
const infoContent: Record<InfoTopic, { lead: string; detail: string }> = {
  about: { lead: 'A home for local skills and the people who need them.', detail: 'WhyChoozeMe helps you discover freelancers through their work, skills and availability. Send an inquiry when you are ready; a conversation opens after the freelancer accepts it.' },
  contact: { lead: 'We would love to hear from you.', detail: 'Our public contact email will appear here soon. You can keep exploring local talent while we finish setting it up.' },
  mission: { lead: 'Every skill deserves to be seen and valued.', detail: 'We want local creatives to show what they can do, and give finders a clear path from discovering someone to agreeing on a project together.' },
};
const T = ({ children, style, numberOfLines }: { children: React.ReactNode; style?: any; numberOfLines?: number }) => <Text numberOfLines={numberOfLines} style={[{ color: color.ink, fontFamily: 'Nunito', fontSize: 15 }, style]}>{children}</Text>;
const Label = ({ children }: { children: React.ReactNode }) => <T style={{ fontWeight: '900', fontSize: 13, marginBottom: 6 }}>{children}</T>;
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
const finderChatPerson = (id: string, name: string): Freelancer => ({ id, name, role: 'Finder', category: 'other', tags: [], taluka: 'Tiswadi', place: 'Goa', lat: talukaCenters.Tiswadi.lat, lon: talukaCenters.Tiswadi.lon, rating: 0, reviews: 0, distance: '', line: '', why: '', work: [], image: -1 });

function useSaved<TValue>(key: string, initial: TValue): [TValue, (value: TValue | ((previous: TValue) => TValue)) => void] {
  const [state, setState] = useState<TValue>(() => { try { const v = (globalThis as any).localStorage?.getItem(key); return v ? JSON.parse(v) : initial; } catch { return initial; } });
  useEffect(() => { if (Platform.OS !== 'web') AsyncStorage.getItem(key).then(value => { if (value) setState(JSON.parse(value)); }).catch(() => {}); }, [key]);
  const save = useCallback((value: TValue | ((previous: TValue) => TValue)) => setState(previous => { const next = typeof value === 'function' ? (value as (previous: TValue) => TValue)(previous) : value; if (Platform.OS === 'web') { try { (globalThis as any).localStorage?.setItem(key, JSON.stringify(next)); } catch {} } else { AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {}); } return next; }), [key]);
  return [state, save];
}

function ProfileCard({ person, width, favorite, onFavorite, onOpen, onChat, chatReady }: { person: Freelancer; width: number; favorite: boolean; onFavorite: () => void; onOpen: () => void; onChat: () => void; chatReady: boolean }) {
  const [hovered, setHovered] = useState(false);
  return <Pressable accessibilityRole={Platform.OS === 'web' ? undefined : 'button'} accessibilityLabel={`Open ${person.name}'s profile`} onPress={onOpen} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={({ pressed }) => [{ width, backgroundColor: '#fff', borderRadius: 19, padding: 8, borderWidth: 1, borderColor: hovered ? '#d8c6fb' : '#f1ebea', shadowColor: hovered ? '#7655c7' : '#d8cbc3', shadowOpacity: hovered ? .18 : .08, shadowRadius: hovered ? 15 : 7, elevation: hovered ? 5 : 1, transform: [{ translateY: hovered ? -4 : pressed ? -1 : 0 }] }, Platform.OS === 'web' ? { transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease', cursor: 'pointer' } as any : null]}>
    <View><Portrait index={person.image} imageUrl={person.imageUrl} name={person.name} height={Math.max(155, width * .61)} radius={13} /><Pressable accessibilityLabel={favorite ? `Remove ${person.name} from saved` : `Save ${person.name}`} onPress={event => { event.stopPropagation?.(); onFavorite(); }} style={{ position: 'absolute', right: 9, top: 7, width: 30, height: 30, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.82)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 22, color: favorite ? color.coral : '#777' }}>{favorite ? '♥' : '♡'}</Text></Pressable>{person.online && !person.demo && <View style={{ position: 'absolute', left: 10, bottom: 8, backgroundColor: '#dcffe9', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2 }}><T style={{ color: '#168654', fontSize: 12, fontWeight: '900' }}>Online</T></View>}</View>
    <View style={{ paddingHorizontal: 7, paddingTop: 7, flex: 1 }}><T style={{ fontSize: 16, fontWeight: '900' }}>{person.name}{person.premium && <Text style={{ color: '#a26800', fontSize: 11 }}>  ★ Premium</Text>}</T><View style={{ alignSelf: 'flex-start', marginTop: 4, backgroundColor: '#fff1d9', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}><T style={{ color: '#865018', fontSize: 12, fontWeight: '900' }}>✦ {person.role}</T></View><View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 }}><T style={{ fontSize: 14 }}>{person.reviews ? <><Text style={{ color: '#ffad24' }}>★</Text> <Text style={{ fontWeight: '900' }}>{person.rating.toFixed(1)}</Text> <Text style={{ color: '#85869f' }}>({person.reviews})</Text></> : <Text style={{ color: color.purple, fontWeight: '900' }}>New</Text>}</T><T style={{ fontSize: 12, color: '#888ba1' }}>⌖ {person.distance}</T></View><T style={{ fontSize: 14, minHeight: 47, marginTop: 7, lineHeight: 19 }} numberOfLines={2}>{person.line}</T><View style={{ flexDirection: 'row', gap: 7, marginTop: 8, marginBottom: 5 }}><Button onPress={onOpen} style={{ flex: 1, minHeight: 39 }} textStyle={{ fontSize: 13 }}>View profile</Button><Pressable accessibilityRole="button" accessibilityLabel={`${chatReady ? 'Chat' : 'Inquire'} with ${person.name}`} onPress={event => { event.stopPropagation?.(); onChat(); }} style={{ minWidth: 68, paddingHorizontal: 8, height: 39, borderWidth: 1, borderColor: '#dcdde2', borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}><T style={{ color: color.purple, fontWeight: '900', fontSize: 12 }}>{chatReady ? 'Chat' : 'Inquire'}</T></Pressable></View></View>
  </Pressable>;
}
function ActionTile({ icon, title, detail, onPress }: { icon: string; title: string; detail: string; onPress: () => void }) {
  const [hovered, setHovered] = useState(false);
  return <Pressable accessibilityRole="button" onPress={onPress} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={{ flex: 1, minWidth: 220, minHeight: 150, borderRadius: 21, backgroundColor: '#fff', borderWidth: 1, borderColor: hovered ? '#d6c3f9' : color.line, padding: 20, justifyContent: 'space-between', shadowColor: color.purple, shadowOpacity: hovered ? .12 : .04, shadowRadius: hovered ? 13 : 5, elevation: hovered ? 3 : 0, transform: [{ translateY: hovered ? -3 : 0 }], ...(Platform.OS === 'web' ? { transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease', cursor: 'pointer' } as any : {}) }}><Text style={{ fontSize: 25 }}>{icon}</Text><View><T style={{ fontSize: 18, fontWeight: '900' }}>{title} <Text style={{ color: color.purple }}>→</Text></T><T style={{ color: color.muted, fontSize: 13, marginTop: 4 }}>{detail}</T></View></Pressable>;
}
function Overlay({ visible, title, onClose, children, width = 560 }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}><View style={{ flex: 1, backgroundColor: 'rgba(15,13,43,.48)', alignItems: 'center', justifyContent: 'center', padding: 16 }}><View style={{ backgroundColor: '#fffaf7', borderRadius: 25, width: '100%', maxWidth: width, maxHeight: '93%', overflow: 'hidden', shadowColor: '#191043', shadowOpacity: .24, shadowRadius: 20 }}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 19, paddingBottom: 14 }}><Heading size={23}>{title}</Heading><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0e8f5', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: color.ink, fontSize: 22 }}>×</Text></Pressable></View><ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 25 }}>{children}</ScrollView></View></View></Modal>;
}

export default function App() {
  const { width: screenWidth } = useWindowDimensions();
  const compact = screenWidth < 900, narrow = screenWidth < 560, pagePadding = narrow ? 14 : 24;
  const [page, setPage] = useState<Page>('home');
  const [detailReturnPage, setDetailReturnPage] = useState<Page>('home');
  const [collection, setCollection] = useState<{ title: string; category: string }>({ title: 'All creatives', category: 'all' });
  const [chatReturnPage, setChatReturnPage] = useState<Page>('home');
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [page]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [menu, setMenu] = useState<'place' | 'avatar' | 'sort' | null>(null);
  const [mapShortcutHovered, setMapShortcutHovered] = useState(false);
  const [heroSearchFocused, setHeroSearchFocused] = useState(false);
  const [place, setPlace] = useState('Goa'), [radius, setRadius] = useState('Local');
  const [category, setCategory] = useState('all'), [searchDraft, setSearchDraft] = useState(''), [search, setSearch] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState<'Nearby' | 'Top rated' | 'Most reviewed'>('Nearby');
  const [profile, setProfile] = useState<Freelancer | null>(null);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [inquiryPerson, setInquiryPerson] = useState<Freelancer | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [finder, setFinder] = useState<Finder | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [guestLimitPrompt, setGuestLimitPrompt] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [infoDialog, setInfoDialog] = useState<InfoTopic | null>(null);
  const [livePeople, setLivePeople] = useState<Freelancer[]>([]);
  const [catalog, setCatalog] = useState<Category[]>(categories);
  const [authMode, setAuthMode] = useState<'join' | 'signIn' | 'reset' | 'recovery'>('join');
  const [password, setPassword] = useState('');
  const [applications, setApplications] = useState<Record<string, any[]>>({});
  const [applyDraft, setApplyDraft] = useState<Record<string, string>>({});
  const [remoteNotices, setRemoteNotices] = useState<any[]>([]);
  const [admin, setAdmin] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [chatRoute, setChatRoute] = useState<{ finderId: string; freelancerId: string } | null>(null);
  const [favorites, setFavorites] = useSaved<string[]>('wcm-favorites', []);
  const [guestViewedProfileIds, setGuestViewedProfileIds] = useSaved<string[]>('wcm-guest-profile-views', []);
  const [requests, setRequests] = useState<RequestPost[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [portfolioAssets, setPortfolioAssets] = useState<Record<string, PortfolioAsset[]>>({});
  const [busyDays, setBusyDays] = useState<Record<string, DateRange[]>>({});
  const [ownBlocks, setOwnBlocks] = useState<LeaveBlock[]>([]);
  const [ownProfile, setOwnProfile] = useState<Freelancer | null>(null);
  const [finderName, setFinderName] = useState(''), [finderEmail, setFinderEmail] = useState(''), [finderTaluka, setFinderTaluka] = useState<Taluka>('Tiswadi');
  const [formName, setFormName] = useState(''), [formRole, setFormRole] = useState(''), [formCategory, setFormCategory] = useState('photography'), [customCategory, setCustomCategory] = useState(''), [formWhy, setFormWhy] = useState(''), [formImage, setFormImage] = useState(''), [formWork, setFormWork] = useState('');
  const [requestTitle, setRequestTitle] = useState(''), [requestDetails, setRequestDetails] = useState(''), [requestCategory, setRequestCategory] = useState('design');
  const [chatPerson, setChatPerson] = useState<Freelancer | null>(null), [chatDraft, setChatDraft] = useState(''), [notice, setNotice] = useState(''), [formError, setFormError] = useState('');
  useEffect(() => { setFormError(''); }, [dialog]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 6000); return () => clearTimeout(timer); }, [notice]);
  const refreshPeople = useCallback(async () => { try { setLivePeople(await live.getFreelancers()); } catch (error) { setNotice((error as Error).message); } }, []);
  const refreshAccount = useCallback(async (id: string) => {
    try {
      const people = await live.getFreelancers(); setLivePeople(people); setOwnProfile(people.find(person => person.id === id) || null);
      const result = await live.getFinder(id);
      if (result) { const auth = await live.account(); setFinder({ name: result.display_name, email: auth.user?.email || '', taluka: result.taluka }); setPlace(result.taluka); }
      else {
        const auth = await live.account(); const meta = auth.user?.user_metadata;
        if (meta?.display_name && meta?.taluka) {
          await live.saveFinder(id, meta.display_name, meta.taluka);
          setFinder({ name: meta.display_name, email: auth.user?.email || '', taluka: meta.taluka }); setPlace(meta.taluka);
        }
      }
      const posts = await live.getRequests(id); setRequests(posts);
      const mine = posts.filter(post => post.finderId === id);
      const groups = await Promise.all(mine.map(async post => [post.id, await live.getApplications(post.id)] as const));
      setApplications(Object.fromEntries(groups));
      setRemoteNotices(await live.getNotifications());
      const hasAdmin = await live.isAdmin(id); setAdmin(hasAdmin); if (hasAdmin) setSuggestions(await live.getCategorySuggestions());
    } catch (error) { setNotice((error as Error).message); }
  }, [setFinder, setOwnProfile, setRequests]);
  const refreshInquiries = useCallback(async () => { if (!userId) return; try { setInquiries(await listInquiries()); } catch (error) { setNotice((error as Error).message); } }, [userId]);
  const loadChat = useCallback(async (person: Freelancer) => { if (!userId || !chatRoute) return; try { const rows = await live.getMessages(chatRoute.finderId, chatRoute.freelancerId); setMessages(rows.map((row: any) => ({ id: row.id, freelancerId: person.id, body: row.body, from: row.sender_id === chatRoute.finderId ? 'finder' : 'freelancer', time: new Date(row.created_at).getTime() }))); } catch (error) { setNotice((error as Error).message); } }, [userId, chatRoute]);
  useEffect(() => { let active = true; live.account().then(({ user }) => { if (active) setUserId(user?.id || null); }).catch(error => setNotice(error.message)).finally(() => { if (active) setAuthReady(true); }); refreshPeople(); live.getCategories().then(setCatalog).catch(error => setNotice(error.message)); const subscription = live.db?.auth.onAuthStateChange((event, session) => { setUserId(session?.user?.id || null); if (event === 'PASSWORD_RECOVERY') { setAuthMode('recovery'); setDialog('finder'); } }); return () => { active = false; subscription?.data.subscription.unsubscribe(); }; }, [refreshPeople]);
  useEffect(() => { if (!userId) { setFinder(null); setInquiries([]); setRequests([]); setRemoteNotices([]); setAdmin(false); setOwnProfile(null); setMessages([]); setPortfolioAssets({}); return; } refreshAccount(userId); refreshInquiries(); }, [userId, refreshAccount, refreshInquiries]);
  useEffect(() => { if (!userId || !live.db) return; const channel = live.db.channel(`user-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => { live.getNotifications().then(setRemoteNotices).catch(() => {}); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => { refreshAccount(userId); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => { if (chatPerson) loadChat(chatPerson); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'freelancer_inquiries' }, refreshInquiries)
    .subscribe(); return () => { live.db?.removeChannel(channel); }; }, [userId, chatPerson, chatRoute, refreshAccount, refreshInquiries, loadChat]);
  useEffect(() => { if (chatPerson) loadChat(chatPerson); }, [chatPerson, loadChat]);
  const refreshAvailability = useCallback(async (id: string) => { const [busy, blocks] = await Promise.all([publicBusyDays(id), id === userId ? ownLeaveBlocks(id) : Promise.resolve([])]); setBusyDays(previous => ({ ...previous, [id]: busy })); setOwnBlocks(blocks); }, [userId]);
  const profileId = profile?.id, profileIsSample = !!profile?.demo;
  useEffect(() => { if (!profileId || profileIsSample) return; let active = true; listPortfolioAssets(profileId).then(items => { if (active) setPortfolioAssets(previous => ({ ...previous, [profileId]: items })); }).catch(error => setNotice(error.message)); refreshAvailability(profileId).catch(error => setNotice(error.message)); return () => { active = false; }; }, [profileId, profileIsSample, refreshAvailability]);
  const allPeople = livePeople;
  const displayedRequests = requests;
  const finderPosts = displayedRequests.filter(post => post.finderId === userId);
  const approvedPairs = inquiries.filter(item => item.status === 'approved');
  const canChatWith = (person: Freelancer) => approvedPairs.some(item => item.freelancer_id === person.id && item.finder_id === userId);
  const messageKey = (person: Freelancer) => person.id;
  const chatPeople = [...new Map(approvedPairs.map(item => {
    const isFinder = item.finder_id === userId;
    const id = isFinder ? item.freelancer_id : item.finder_id;
    const actual = allPeople.find(person => person.id === id);
    return [id, actual || finderChatPerson(id, item.finder_name)];
  })).values()];
  const displayMessages = messages;
  const center = place !== 'Goa' ? talukaCenters[place as Taluka] : null;
  const visiblePeople = useMemo(() => { const term = search.trim().toLowerCase(); let list = allPeople.filter(person => { const cat = category === 'all' || person.category === category || (category === 'other' && !catalog.some(item => item.id === person.category)); const text = !term || [person.name, person.role, person.place, person.category, ...person.tags].join(' ').toLowerCase().includes(term); const km = center ? distanceKm(center, person) : 0; const local = !center || radius === 'All Goa' || (radius === 'Local' ? person.taluka === place : km <= (radius === '10 km' ? 10 : 25)); return cat && text && local; }); if (sort === 'Top rated') list = list.sort((a, b) => b.rating - a.rating); else if (sort === 'Most reviewed') list = list.sort((a, b) => b.reviews - a.reviews); else if (center) list = list.sort((a, b) => distanceKm(center, a) - distanceKm(center, b)); return center ? list.map(person => ({ ...person, distance: `${distanceKm(center, person).toFixed(1)} km` })) : list; }, [allPeople, catalog, category, center, search, place, radius, sort]);
  const mapPeople = useMemo(() => allPeople.filter(person => !center || radius === 'All Goa' || (radius === 'Local' ? person.taluka === place : distanceKm(center, person) <= (radius === '10 km' ? 10 : 25))), [allPeople, center, place, radius]);
  const searchPeople = savedOnly ? visiblePeople.filter(person => favorites.includes(person.id)) : visiblePeople;
  const expandedPeople = visiblePeople;
  const expandedSearchPeople = searchPeople;
  const contentWidth = Math.min(screenWidth - pagePadding * 2, 1540), columns = contentWidth >= 1320 ? 5 : contentWidth >= 1000 ? 4 : contentWidth >= 700 ? 3 : contentWidth >= 480 ? 2 : 1, cardWidth = Math.floor((contentWidth - (columns - 1) * 13 - 2) / columns);
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
  const openCollection = (title: string, selectedCategory: string) => { setCollection({ title, category: selectedCategory }); setCategory(selectedCategory); setSearch(''); setSearchDraft(''); setPage('collection'); setMenu(null); };
  const openHighlightedCategory = (item: Category) => { if (compact) { setCategory(item.id); setSavedOnly(false); setSearch(''); setSearchDraft(''); setPage('search'); } else openCollection(item.label, item.id); };
  const openProfile = (person: Freelancer) => {
    if (!userId && authReady) {
      const visit = guestProfileVisit(Array.isArray(guestViewedProfileIds) ? guestViewedProfileIds : [], person.id);
      if (!visit.allowed) { setGuestLimitPrompt(true); setAuthMode('signIn'); setDialog('finder'); return; }
      setGuestViewedProfileIds(visit.viewed);
    }
    if (page !== 'profile') setDetailReturnPage(page);
    setProfile(person); setAvailabilityOpen(false); setPage('profile'); setMenu(null);
  };
  const openApprovedChat = (item: Inquiry) => { const isFinder = item.finder_id === userId; const id = isFinder ? item.freelancer_id : item.finder_id; const person = allPeople.find(entry => entry.id === id) || finderChatPerson(id, item.finder_name); setChatRoute({ finderId: item.finder_id, freelancerId: item.freelancer_id }); setChatReturnPage(page); setChatPerson(person); setPage('chats'); setMenu(null); };
  const openContact = (person: Freelancer) => { const item = approvedPairs.find(row => (row.finder_id === userId && row.freelancer_id === person.id) || (row.freelancer_id === userId && row.finder_id === person.id)); if (item) openApprovedChat(item); else setNotice('Chat opens after the freelancer approves an inquiry.'); };
  const openInquire = (person: Freelancer) => { if (!userId) { setGuestLimitPrompt(false); setAuthMode('signIn'); setDialog('finder'); return; } if (person.demo) { setNotice('This profile is not accepting inquiries yet.'); return; } if (!finder) { setDialog('finder'); return; } if (person.id === userId) { setNotice('This is your own profile.'); return; } const pending = inquiries.find(item => item.finder_id === userId && item.freelancer_id === person.id && item.status === 'pending'); if (pending) { setPage('inquiries'); return; } setInquiryPerson(person); };
  const selectChat = (person: Freelancer) => { const item = approvedPairs.find(row => (row.finder_id === userId && row.freelancer_id === person.id) || (row.freelancer_id === userId && row.finder_id === person.id)); if (!item) return; setChatRoute({ finderId: item.finder_id, freelancerId: item.freelancer_id }); setChatPerson(person); };
  const toggleFavorite = (id: string) => setFavorites(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]);
  const goHome = () => { setPage('home'); setProfile(null); setMenu(null); setCategory('all'); setSearch(''); setSearchDraft(''); };
  const goBackFromProfile = () => { setAvailabilityOpen(false); setPage(detailReturnPage); setProfile(null); setMenu(null); };
  const goMobileTab = (next: Page) => { if (next === 'search') setSavedOnly(false); setPage(next); setProfile(null); setMenu(null); };
  const enterFinder = () => { setGuestLimitPrompt(false); setDialog('finder'); setMenu(null); };
  const openAuth = (mode: 'signIn' | 'join') => { setGuestLimitPrompt(false); setFormError(''); setAuthMode(mode); setDialog('finder'); setMenu(null); };
  const openInfo = (topic: InfoTopic) => { setMobileMenuOpen(false); setMenu(null); setInfoDialog(topic); };
  const enterFreelancer = () => { if (!userId) { setDialog('finder'); setAuthMode('signIn'); } else { if (ownProfile) { openProfile(ownProfile); } else setDialog('freelancer'); } setMenu(null); };
  const openChats = () => { if (!userId) { setAuthMode('signIn'); setDialog('finder'); return; } if (page !== 'chats') setChatReturnPage(page); setChatPerson(null); setChatRoute(null); refreshInquiries(); setPage('chats'); setMenu(null); };
  const closeChats = () => { setPage(chatReturnPage === 'chats' ? 'home' : chatReturnPage); setChatPerson(null); };
  const openNewRequest = () => { setDialog(finder ? 'request' : 'finder'); setMenu(null); };
  const registerFinder = async () => { if (authMode === 'recovery') { if (password.length < 8) { setFormError('Use at least 8 characters.'); return; } try { await live.updatePassword(password); setPassword(''); setAuthMode('signIn'); setDialog(null); setNotice('Password updated.'); } catch (error) { setFormError((error as Error).message); } return; }
    if (!/^\S+@\S+\.\S+$/.test(finderEmail.trim()) || (authMode === 'join' && (finderName.trim().length < 2 || password.length < 8)) || (authMode === 'signIn' && !password)) { setFormError('Add a valid email, a name for joining, and a password of at least 8 characters for new accounts.'); return; }
    try { if (authMode === 'reset') { await live.sendPasswordReset(finderEmail.trim()); setNotice('If this email has an account, a reset link is on its way.'); setAuthMode('signIn'); }
      else if (authMode === 'signIn') { const result = await live.signIn(finderEmail.trim(), password); setUserId(result.user.id); setNotice('Signed in.'); }
      else { const active = await live.signUpFinder(finderEmail.trim(), password, finderName.trim(), finderTaluka); if (active) { const auth = await live.account(); setUserId(auth.user?.id || null); setNotice('Finder profile created.'); } else setNotice('Check your email to confirm your account, then sign in.'); } setPassword(''); setDialog(null); } catch (error) { setFormError((error as Error).message); } };
  const signOut = async () => { try { await live.signOut(); setUserId(null); setAdmin(false); setSuggestions([]); setMessages([]); setInquiries([]); setChatPerson(null); setChatRoute(null); setOwnProfile(null); setPortfolioAssets({}); setPage('home'); setNotice('Signed out.'); } catch (error) { setNotice((error as Error).message); } };
  const createFreelancer = async () => { if (!userId) { setDialog('finder'); return; } if (!formName.trim() || !formRole.trim() || formWhy.trim().length < 10 || (formCategory === 'other' && !customCategory.trim())) { setFormError('Complete your name, role, category and Why Choose Me statement (at least 10 characters).'); return; } if (formImage.trim() && !/^https:\/\/.+/.test(formImage.trim())) { setFormError('Use an HTTPS image URL.'); return; } const newCategory = formCategory === 'other' ? customCategory.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) : formCategory; if (newCategory.length < 2) { setFormError('Use at least two Latin letters or digits for the new category.'); return; } const taluka = finder?.taluka || 'Tiswadi'; const person: Freelancer = { id: userId, name: formName.trim(), role: formRole.trim(), category: newCategory, tags: [newCategory, formRole.trim().toLowerCase(), ...(formCategory === 'other' ? [customCategory.trim().toLowerCase()] : [])], taluka, place: taluka, lat: talukaCenters[taluka].lat, lon: talukaCenters[taluka].lon, rating: 0, reviews: 0, distance: 'New', line: formWhy.trim().slice(0, 85), why: formWhy.trim(), work: formWork.split(',').map(value => value.trim()).filter(Boolean).slice(0, 8), image: -1, imageUrl: formImage.trim() || undefined };
    try { await live.saveFreelancer(userId, person); if (formCategory === 'other') await live.suggestCategory(userId, customCategory.trim()); await refreshPeople(); } catch (error) { setFormError((error as Error).message); return; }
    setOwnProfile(person); setNotice('Freelancer profile saved.'); setDialog(null); openProfile(person); };
  const postRequest = async () => { if (!finder || !userId) { setDialog('finder'); return; } if (requestTitle.trim().length < 4 || requestDetails.trim().length < 10) { setFormError('Add a title and a description of at least 10 characters.'); return; }
    try { await live.createRequest(userId, requestTitle.trim(), requestDetails.trim(), requestCategory, finder.taluka); setRequests(await live.getRequests(userId)); } catch (error) { setFormError((error as Error).message); return; }
    setRequestTitle(''); setRequestDetails(''); setDialog(null); setPage('myPosts'); setNotice('Requirement posted.'); };
  const sendMessage = async () => { if (!userId || !chatPerson || !chatDraft.trim() || !chatRoute) return; if (!approvedPairs.some(item => item.finder_id === chatRoute.finderId && item.freelancer_id === chatRoute.freelancerId)) return; try { await live.createMessage(chatRoute.finderId, chatRoute.freelancerId, userId, chatDraft.trim()); await loadChat(chatPerson); setChatDraft(''); } catch (error) { setNotice((error as Error).message); } };
  const shareContact = async () => { if (!userId || !chatRoute || chatRoute.freelancerId !== userId || !chatPerson) return; try { const details = await live.getContact(userId); const auth = await live.account(); const lines = [details?.email || auth.user?.email, details?.phone && `Phone: ${details.phone}`, details?.whatsapp && `WhatsApp: ${details.whatsapp}`].filter(Boolean); if (!lines.length) { setNotice('Add contact details to your work settings first.'); return; } await live.createMessage(chatRoute.finderId, userId, userId, `My contact details: ${lines.join(' · ')}`); await loadChat(chatPerson); } catch (error) { setNotice((error as Error).message); } };
  const refreshPortfolio = async (id: string) => {
    const items = await listPortfolioAssets(id);
    setPortfolioAssets(previous => ({ ...previous, [id]: items }));
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
    const asset = (portfolioAssets[profile.id] || []).filter(item => item.kind === kind)[index];
    if (!asset) return;
    try { await removePortfolioAsset(asset); await refreshPortfolio(profile.id); setNotice('Portfolio item removed.'); }
    catch (error) { setNotice((error as Error).message); }
  };
  const blockDates = async (range: DateRange) => {
    if (!profile || profile.id !== userId) return;
    try { await addLeaveBlock(profile.id, range); await refreshAvailability(profile.id); setAvailabilityOpen(false); setNotice('Busy dates saved.'); }
    catch (error) { setNotice((error as Error).message); }
  };
  const apply = async (post: RequestPost) => { if (!userId || !ownProfile) return; const note = (applyDraft[post.id] || '').trim(); if (note.length < 5) { setNotice('Write a short application message first.'); return; } try { await live.applyToRequest(post.id, userId, note); setApplyDraft(previous => ({ ...previous, [post.id]: '' })); setNotice('Application sent to the Finder.'); } catch (error) { setNotice((error as Error).message); } };
  const reviewApplication = async (postId: string, id: string, status: 'shortlisted' | 'declined') => { try { await live.setApplicationStatus(id, status); setApplications(previous => ({ ...previous, [postId]: (previous[postId] || []).map(row => row.id === id ? { ...row, status } : row) })); } catch (error) { setNotice((error as Error).message); } };
  const reviewSuggestion = async (id: string, name: string, approve: boolean) => { try { await live.reviewCategory(id, name, approve); setSuggestions(previous => previous.filter(item => item.id !== id)); if (approve) setCatalog(await live.getCategories()); setNotice(approve ? 'Category added to the directory.' : 'Suggestion declined.'); } catch (error) { setNotice((error as Error).message); } };
  const menuMotion = Platform.OS === 'web' ? { animation: 'wcm-menu-in 180ms cubic-bezier(.2,.8,.2,1)' } as any : {};
  const canEditPortfolio = !!profile && profile.id === userId && !profile.demo;
  const profileReviewCount = profile?.reviews || 0;
  const profileRating = profile?.rating || 0;
  const profileBusy = profile ? busyDays[profile.id] || [] : [];

  const mobileLocationPicker = <View style={{ position: 'relative', zIndex: 20 }}><Pressable accessibilityRole="button" accessibilityLabel={`Choose location, currently ${place}`} accessibilityState={{ expanded: menu === 'place' }} onPress={() => setMenu(menu === 'place' ? null : 'place')} style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, minHeight: 38, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, paddingHorizontal: 13 }}><Text style={{ color: color.coral, fontSize: 14 }}>●</Text><T style={{ fontWeight: '900', fontSize: 13 }}>{place}</T><ChevronDown size={15} color={color.ink} open={menu === 'place'} /></Pressable>{menu === 'place' && <View style={[{ position: 'absolute', top: 42, left: 0, width: 190, maxHeight: 300, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, shadowColor: '#222', shadowOpacity: .18, shadowRadius: 10, elevation: 6, zIndex: 40, overflow: 'hidden' }, menuMotion]}><ScrollView showsVerticalScrollIndicator={false}>{places.map(value => <Pressable key={value} accessibilityRole="button" onPress={() => { setPlace(value); setRadius('Local'); setMenu(null); }} style={{ minHeight: 41, justifyContent: 'center', paddingHorizontal: 16, backgroundColor: value === place ? '#f4ebff' : '#fff' }}><T style={{ fontSize: 14, fontWeight: value === place ? '900' : '500' }}>{value}</T></Pressable>)}</ScrollView></View>}</View>;
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
  const mobileTabs = [{ id: 'home', label: 'People', icon: 'people' }, { id: 'search', label: 'Search', icon: 'search' }, { id: 'map', label: 'Map', icon: 'map' }, { id: 'account', label: 'Profile', icon: 'profile' }] as const;
  const activeMobileTab = page === 'profile' ? detailReturnPage : page === 'collection' ? 'home' : ['requests', 'admin', 'finderHub', 'freelancerHub', 'inquiries', 'myPosts', 'newRequest', 'chats', 'hiring'].includes(page) ? 'account' : page;

  return <View style={{ flex: 1, height: Platform.OS === 'web' ? '100vh' as any : undefined, overflow: 'hidden', backgroundColor: '#fffaf3', paddingTop: Platform.OS === 'ios' ? 26 : 0 }}><StatusBar barStyle="dark-content" backgroundColor="#fff" /><ScrollView ref={scrollRef} style={{ flex: 1, minHeight: 0 }} contentContainerStyle={{ minHeight: '100%' }}>
    {/* HEADER */}
    {compact && <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: color.line, zIndex: 10, paddingHorizontal: pagePadding, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open navigation menu" onPress={() => setMobileMenuOpen(true)} style={{ minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 9 }}><Text style={{ fontSize: 25, color: color.purple }}>☰</Text><T style={{ color: color.purple, fontWeight: '900', fontSize: 15 }}>Menu</T></Pressable>
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>{userId ? <><Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={() => setDialog('notifications')} style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 21 }}>🔔</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Open chats" onPress={openChats} style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}><ChatIcon color={page === 'chats' ? color.purple : color.ink} size={23} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Your account" onPress={() => goMobileTab('account')} style={{ minHeight: 38, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 19, backgroundColor: '#f3edff' }}><T style={{ color: color.purple, fontWeight: '900', fontSize: 13 }}>Account</T></Pressable></> : authReady ? <><Pressable accessibilityRole="button" accessibilityLabel="Sign in" onPress={() => openAuth('signIn')} style={{ minHeight: 38, justifyContent: 'center', paddingHorizontal: 8 }}><T style={{ color: color.purple, fontWeight: '900', fontSize: 13 }}>Sign in</T></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Sign up" onPress={() => openAuth('join')} style={{ minHeight: 38, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 19, backgroundColor: color.purple }}><T style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>Sign up</T></Pressable></> : null}</View>
    </View>}
    {!compact && <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3eff0', zIndex: 10 }}><View style={{ position: 'relative', zIndex: 40, width: '100%', maxWidth: 1540, alignSelf: 'center', minHeight: narrow ? 102 : 82, paddingHorizontal: pagePadding, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: narrow ? 'wrap' : 'nowrap', gap: 9 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="WhyChoozeMe home" onPress={goHome} style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}><Text style={{ fontSize: 31 }}>🖐️</Text><View><Text style={{ fontFamily: 'Nunito', fontWeight: '900', fontSize: 27, letterSpacing: -1.6, color: '#332384' }}>WhyChooze<Text style={{ color: color.coral }}>Me</Text></Text><Text style={{ fontFamily: 'Nunito', color: '#555372', fontSize: 10, marginTop: -3, textAlign: 'center' }}>Real People. Real Skills. Right Near You.</Text></View></Pressable>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: screenWidth < 1100 ? 1 : 9 }}>{infoLinks.map(item => <HeaderInfoLink key={item.id} id={item.id} label={item.label} onPress={() => openInfo(item.id)} />)}</View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <View style={{ position: 'relative' }}><Pressable accessibilityRole="button" accessibilityLabel={`Choose location, currently ${place}`} accessibilityState={{ expanded: menu === 'place' }} onPress={() => setMenu(menu === 'place' ? null : 'place')} style={{ borderRadius: 25, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f2eff0', paddingHorizontal: 16, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#ded1cd', shadowOpacity: .13, shadowRadius: 7 }}><Text style={{ color: color.coral, fontSize: 18 }}>●</Text><T style={{ fontWeight: '900', fontSize: 14 }}>{place}</T><ChevronDown size={17} color={color.ink} open={menu === 'place'} /></Pressable>{menu === 'place' && <View style={[{ position: 'absolute', top: 48, left: 0, width: 190, maxHeight: 310, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, shadowColor: '#222', shadowOpacity: .18, shadowRadius: 10, elevation: 6, zIndex: 50, overflow: 'hidden' }, menuMotion]}><ScrollView showsVerticalScrollIndicator={false}>{places.map(value => <Pressable accessibilityRole="button" key={value} onPress={() => { setPlace(value); setRadius('Local'); setMenu(null); setPage('home'); }} style={{ minHeight: 41, justifyContent: 'center', paddingHorizontal: 16, backgroundColor: value === place ? '#f4ebff' : '#fff' }}><T style={{ fontSize: 14, fontWeight: value === place ? '900' : '500' }}>{value}</T></Pressable>)}</ScrollView></View>}</View>
        {userId && <><Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={() => { setMenu(null); setDialog('notifications'); }} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 21 }}>🔔</Text><View style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 5, backgroundColor: color.coral }} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Open chats" onPress={openChats} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: page === 'chats' ? '#f1e8ff' : 'transparent' }}><ChatIcon color={page === 'chats' ? color.purple : color.ink} size={24} /></Pressable></>}
        {userId ? <View style={{ position: 'relative' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Account menu" accessibilityState={{ expanded: menu === 'avatar' }} onPress={() => setMenu(menu === 'avatar' ? null : 'avatar')} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 3 }}><View style={{ width: 40, height: 40, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7d5cf' }}><Text style={{ fontSize: 21 }}>{(finder?.name || ownProfile?.name || '👩🏻').slice(0, 1).toUpperCase()}</Text></View><T style={{ fontSize: 13, fontWeight: '900' }}>{finder?.name || ownProfile?.name || 'Hi, there!'}</T><AccountChevron open={menu === 'avatar'} /></Pressable>
          {menu === 'avatar' && <View style={[{ position: 'absolute', top: 51, right: 0, width: 248, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, padding: 8, shadowColor: '#221344', shadowOpacity: .19, shadowRadius: 18, elevation: 7, zIndex: 50 }, menuMotion]}>
            <View style={{ paddingHorizontal: 11, paddingVertical: 9, marginBottom: 3, borderRadius: 13, backgroundColor: '#f8f3ff' }}><T style={{ color: color.purple, fontSize: 11, fontWeight: '900', letterSpacing: .7 }}>YOUR ACCOUNT</T><T style={{ color: color.muted, fontSize: 12, marginTop: 2 }}>{finder?.name || ownProfile?.name || 'Signed in'}</T></View>
            {[
              ['Finder account', enterFinder], ['Freelancer profile', enterFreelancer],
              ['Chats', openChats], ['Hiring & agreements', () => setPage('hiring')],
              ['My requirements', () => setPage('myPosts')], ['Browse requirements', () => setPage('requests')],
              ['Inquiries', () => { refreshInquiries(); setPage('inquiries'); }],
              ['Sign out', signOut],
            ].map(([label, action]: any) => <Pressable accessibilityRole="button" key={label} onPress={() => { setMenu(null); action(); }} style={{ minHeight: 43, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 12 }}><T style={{ fontSize: 14, fontWeight: '700' }}>{label}</T></Pressable>)}
          </View>}
        </View> : authReady ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Pressable accessibilityRole="button" accessibilityLabel="Sign in" onPress={() => openAuth('signIn')} style={{ minHeight: 42, justifyContent: 'center', paddingHorizontal: 13, borderRadius: 22, borderWidth: 1, borderColor: '#e4d7f8', backgroundColor: '#fff' }}><T style={{ color: color.purple, fontSize: 13, fontWeight: '900' }}>Sign in</T></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Sign up" onPress={() => openAuth('join')} style={{ minHeight: 42, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 22, backgroundColor: color.purple }}><T style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>Sign up</T></Pressable></View> : null}
      </View>
    </View><DesktopCategoryNavigation categories={catalog} onCategory={openHighlightedCategory} onAll={() => openCollection('All creatives', 'all')} onMap={() => setPage('map')} onRequests={() => setPage('requests')} /></View>}
    {page === 'home' && compact && <View style={{ paddingHorizontal: pagePadding, paddingTop: 20, paddingBottom: 30, width: '100%', maxWidth: 540, alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>{mobileLocationPicker}<T style={{ color: color.muted, fontSize: 12 }}>{allPeople.length} creatives</T></View>
      <Heading size={32} style={{ marginTop: 19, lineHeight: 38 }}>Meet local <Text style={{ color: color.purple }}>talent</Text><Text style={{ color: color.orange }}> ✦</Text></Heading>
      <T style={{ color: color.muted, marginTop: 5, marginBottom: 21, fontSize: 15 }}>Explore Goa talent, portfolios and local skills.</T>
      <Pressable accessibilityRole="button" accessibilityLabel="Search freelancers" onPress={() => goMobileTab('search')} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 52, backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, borderRadius: 17, paddingHorizontal: 16 }}><TabIcon name="search" color={color.purple} size={20} /><T style={{ color: '#89869b', fontSize: 14 }}>Search skills, names, or categories</T></Pressable>
      <PopularSkillChips items={popularCategories.slice(0, 4)} selected={category} onSelect={openHighlightedCategory} />
      <Pressable accessibilityRole="button" accessibilityLabel="Explore all on map" onPress={() => goMobileTab('map')} style={{ alignSelf: 'flex-end', marginTop: 13 }}><T style={{ color: color.purple, fontSize: 13, fontWeight: '900' }}>Explore the map →</T></Pressable>
      {carouselGroups.map((group, index) => <React.Fragment key={group.category}><CarouselRow title={group.title} detail={group.detail} people={group.people} width={carouselViewportWidth} cardWidth={carouselCardWidth} onMore={() => { setCategory(group.category); setSavedOnly(false); setSearch(''); setSearchDraft(''); setPage('search'); }} renderCard={(person) => <ProfileCard person={person} width={carouselCardWidth} favorite={favorites.includes(person.id)} onFavorite={() => toggleFavorite(person.id)} onOpen={() => openProfile(person)} onChat={() => canChatWith(person) ? openContact(person) : openInquire(person)} chatReady={canChatWith(person)} />} /><HomeHighlights kind={(['standout','hiring','categories','discover'] as const)[index]} compact people={homePeople} requests={displayedRequests} categories={catalog} onProfile={openProfile} onCategory={openHighlightedCategory} onRequests={() => setPage('requests')} /></React.Fragment>)}
      {!allPeople.length && <View style={{ padding: 26, backgroundColor: '#fff', borderRadius: 18 }}><T style={{ color: color.muted, textAlign: 'center' }}>Freelancer profiles will appear here soon.</T></View>}
    </View>}
    {page === 'search' && compact && <View style={{ paddingHorizontal: pagePadding, paddingTop: 20, paddingBottom: 30, width: '100%', maxWidth: 540, alignSelf: 'center' }}>
      <View style={{ zIndex: 20 }}>{mobileLocationPicker}</View><Heading size={30} style={{ marginTop: 19 }}>Find your person<Text style={{ color: color.coral }}> ✦</Text></Heading><T style={{ color: color.muted, marginTop: 4, marginBottom: 17 }}>Explore skills and creatives near you.</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, borderRadius: 17, paddingHorizontal: 14, minHeight: 54 }}><TabIcon name="search" color={color.purple} size={21} /><TextInput accessibilityLabel="Search freelancers" autoCapitalize="none" value={searchDraft} onChangeText={value => { setSearchDraft(value); setSearch(value); }} placeholder="Try photographer, editor, designer..." placeholderTextColor="#9693ab" style={{ flex: 1, fontFamily: 'Nunito', fontSize: 14, color: color.ink, outlineStyle: 'none' } as any} />{!!searchDraft && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => { setSearchDraft(''); setSearch(''); }}><T style={{ color: color.muted, fontSize: 22 }}>×</T></Pressable>}</View>
      {savedOnly && <Pressable accessibilityRole="button" onPress={() => setSavedOnly(false)} style={{ alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, backgroundColor: '#eee4ff' }}><T style={{ color: color.purple, fontSize: 12, fontWeight: '900' }}>♥ Saved creatives  ×</T></Pressable>}
      <PopularSkillChips items={popularCategories.slice(0, 4)} selected={category} onSelect={item => setCategory(item.id)} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 19, marginTop: 11 }}><Pressable accessibilityRole="button" onPress={() => setCategory('all')}><T style={{ color: color.purple, fontSize: 12, fontWeight: '900' }}>All creatives</T></Pressable><Pressable accessibilityRole="button" onPress={() => setMobileMenuOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><T style={{ color: color.purple, fontSize: 12, fontWeight: '900' }}>More skills</T><ChevronDown size={13} color={color.purple} /></Pressable></View>
      {place !== 'Goa' && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 13, marginHorizontal: -pagePadding }} contentContainerStyle={{ gap: 7, paddingHorizontal: pagePadding }}>{['Local', '10 km', '25 km', 'All Goa'].map(value => <Pressable key={value} onPress={() => setRadius(value)} style={{ borderRadius: 15, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: radius === value ? '#eee4ff' : '#fff', borderWidth: 1, borderColor: radius === value ? '#d8c3ff' : color.line }}><T style={{ fontSize: 12, fontWeight: '900', color: radius === value ? color.purple : color.muted }}>{value}</T></Pressable>)}</ScrollView>}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 13 }}><Heading size={21}>{searchPeople.length} {searchPeople.length === 1 ? 'result' : 'results'}</Heading><Pressable accessibilityRole="button" accessibilityLabel={`Sort by ${sort}`} onPress={() => setSort(sort === 'Nearby' ? 'Top rated' : sort === 'Top rated' ? 'Most reviewed' : 'Nearby')}><T style={{ color: color.purple, fontSize: 12, fontWeight: '900' }}>{sort} ↕</T></Pressable></View>
      <View style={{ alignItems: 'center', gap: 12 }}>{expandedSearchPeople.map((person, index) => <ProfileCard key={`${person.id}-${index}`} person={person} width={mobileCardWidth} favorite={favorites.includes(person.id)} onFavorite={() => toggleFavorite(person.id)} onOpen={() => openProfile(person)} onChat={() => canChatWith(person) ? openContact(person) : openInquire(person)} chatReady={canChatWith(person)} />)}</View>
      {!searchPeople.length && <View style={{ padding: 28, backgroundColor: '#fff', borderRadius: 18, alignItems: 'center' }}><Heading size={20}>{savedOnly ? 'No saved creatives yet' : 'No matches yet'}</Heading><T style={{ color: color.muted, textAlign: 'center', marginTop: 5 }}>{savedOnly ? 'Tap the heart on a creative’s card to save them here.' : 'Try a different skill or widen the search area.'}</T><Button outline onPress={() => { setSearchDraft(''); setSearch(''); setCategory('all'); setRadius('All Goa'); setSavedOnly(false); }} style={{ marginTop: 14 }}>Show all creatives</Button></View>}
    </View>}
    {page === 'home' && !compact && <>
      <View style={{ paddingHorizontal: pagePadding, paddingTop: 22, paddingBottom: 17 }}>
        <View style={[{ maxWidth: 1540, width: '100%', alignSelf: 'center', position: 'relative', overflow: 'hidden', borderRadius: 31, borderWidth: 1, borderColor: '#eadffd', backgroundColor: '#f7f0ff', shadowColor: '#9781d9', shadowOpacity: .12, shadowRadius: 24, elevation: 3 }, Platform.OS === 'web' ? { backgroundImage: 'radial-gradient(circle at 7% 18%, rgba(255,131,106,.30) 0, transparent 27%), radial-gradient(circle at 92% 18%, rgba(145,110,255,.35) 0, transparent 29%), radial-gradient(circle at 72% 95%, rgba(99,217,224,.32) 0, transparent 30%), linear-gradient(120deg, #fffaf5 0%, #f7f1ff 49%, #fff9ef 100%)', backgroundSize: '145% 145%', animation: 'wcm-hero-drift 18s ease-in-out infinite' } as any : null]}>
          {heroMessages.map(message => <HeroWhisper key={message.text} style={message.style} tilt={message.tilt} tint={message.tint} delay={message.delay}>{message.text}</HeroWhisper>)}
          <View pointerEvents="box-none" style={{ width: '100%', maxWidth: 940, alignSelf: 'center', alignItems: 'center', paddingHorizontal: screenWidth < 1100 ? 22 : 40, paddingTop: screenWidth < 1100 ? 65 : 47, paddingBottom: screenWidth < 1100 ? 72 : 43, zIndex: 1 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,.80)', borderWidth: 1, borderColor: '#eadffd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 15 }}><T style={{ fontSize: 11, fontWeight: '900', letterSpacing: .3 }}><Text style={{ color: color.purple }}>Real people</Text><Text style={{ color: color.orange }}> ✦ </Text><Text style={{ color: color.coral }}>Real skills</Text><Text style={{ color: color.purple }}> ✦ </Text><Text style={{ color: '#5c72ab' }}>Right near you</Text></T></View>
            <Text accessibilityRole="header" style={[{ fontFamily: 'Nunito', color: color.ink, fontSize: screenWidth < 1100 ? 43 : 56, fontWeight: '900', lineHeight: screenWidth < 1100 ? 49 : 63, letterSpacing: -2.2, textAlign: 'center' }, Platform.OS === 'web' ? { animation: 'wcm-hero-breathe 7s ease-in-out infinite' } as any : null]}><Text style={{ color: color.purple }}>Find </Text>amazing <Text style={{ color: color.orange }}>freelancers</Text>{'\n'}<Text style={{ color: color.coral }}>near you</Text><Text style={[{ color: color.purple }, Platform.OS === 'web' ? { display: 'inline-block', animation: 'wcm-hero-star 5.5s ease-in-out infinite' } as any : null]}> ✦</Text></Text>
            <View style={[{ width: '100%', maxWidth: 840, marginTop: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 34, borderWidth: 1.5, borderColor: heroSearchFocused ? color.purple : '#eee4f4', minHeight: 68, paddingHorizontal: 17, shadowColor: '#9a79c6', shadowOpacity: heroSearchFocused ? .3 : .17, shadowRadius: heroSearchFocused ? 23 : 18, elevation: heroSearchFocused ? 6 : 3, zIndex: 3, transform: [{ scale: heroSearchFocused ? 1.025 : 1 }] }, Platform.OS === 'web' ? { transition: 'transform 230ms cubic-bezier(.2,.8,.2,1), border-color 230ms ease, box-shadow 230ms ease' } as any : null]}><TabIcon name="search" color={color.purple} size={22} /><TextInput onFocus={() => setHeroSearchFocused(true)} onBlur={() => setHeroSearchFocused(false)} value={searchDraft} onChangeText={setSearchDraft} onSubmitEditing={() => { setCategory('all'); setCollection({ title: 'Search results', category: 'all' }); setSearch(searchDraft); setPage('collection'); }} placeholder="Find a photographer, editor, designer..." placeholderTextColor="#9693ab" style={{ flex: 1, marginLeft: 12, fontFamily: 'Nunito', fontSize: 15, color: color.ink, outlineStyle: 'none' } as any} /><Button onPress={() => { setCategory('all'); setCollection({ title: 'Search results', category: 'all' }); setSearch(searchDraft); setPage('collection'); }} style={{ minWidth: 118, height: 48 }}>Search</Button></View>
            <View style={{ width: '100%', maxWidth: 840, zIndex: 3 }}><PopularSkillChips items={popularCategories} selected={category} onSelect={openHighlightedCategory} /></View>
          </View>
        </View>
      </View>
      <View style={{ maxWidth: 1540, width: '100%', alignSelf: 'center', paddingHorizontal: pagePadding, paddingTop: 5, paddingBottom: 64 }}>
        {carouselGroups.map((group, index) => <React.Fragment key={group.category}><CarouselRow title={group.title} detail={group.detail} people={group.people} width={carouselViewportWidth} cardWidth={carouselCardWidth} onMore={() => openCollection(group.title, group.category)} renderCard={(person) => <ProfileCard person={person} width={carouselCardWidth} favorite={favorites.includes(person.id)} onFavorite={() => toggleFavorite(person.id)} onOpen={() => openProfile(person)} onChat={() => canChatWith(person) ? openContact(person) : openInquire(person)} chatReady={canChatWith(person)} />} /><HomeHighlights kind={(['standout','hiring','categories','discover'] as const)[index]} compact={false} people={homePeople} requests={displayedRequests} categories={catalog} onProfile={openProfile} onCategory={openHighlightedCategory} onRequests={() => setPage('requests')} /></React.Fragment>)}
        {!homePeople.length && <View style={{ padding: 34, borderRadius: 20, backgroundColor: '#fff', marginTop: 24 }}><Heading size={22}>No nearby creatives yet</Heading><T style={{ color: color.muted, marginTop: 6 }}>Try a wider location radius or explore all Goa.</T><Button onPress={() => setRadius('All Goa')} style={{ alignSelf: 'flex-start', marginTop: 13 }}>Show all Goa</Button></View>}
      </View>
    </>}
    {page === 'collection' && <View style={{ width: '100%', maxWidth: 1540, alignSelf: 'center', paddingHorizontal: pagePadding, paddingTop: 25, paddingBottom: 65 }}>
      <Pressable accessibilityRole="button" onPress={goHome}><T style={{ color: color.purple, fontWeight: '900' }}>← Back to home</T></Pressable>
      <View style={{ flexDirection: compact ? 'column' : 'row', justifyContent: 'space-between', alignItems: compact ? 'flex-start' : 'center', marginTop: 18, marginBottom: 18, gap: 10 }}><View><Heading size={compact ? 29 : 35}>{collection.title} <Text style={{ color: color.orange }}>✦</Text></Heading><T style={{ color: color.muted, marginTop: 4 }}>{visiblePeople.length} {visiblePeople.length === 1 ? 'creative' : 'creatives'} {place === 'Goa' ? 'in Goa' : 'near ' + place}</T></View><Pressable accessibilityRole="button" accessibilityLabel={'Sort by ' + sort} onPress={() => setSort(sort === 'Nearby' ? 'Top rated' : sort === 'Top rated' ? 'Most reviewed' : 'Nearby')} style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, borderRadius: 14, padding: 11 }}><T style={{ fontSize: 12 }}>Sort by <Text style={{ fontWeight: '900' }}>{sort} ↕</Text></T></Pressable></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 13 }}>{expandedPeople.map((person, index) => <ProfileCard key={person.id + '-' + index} person={person} width={cardWidth} favorite={favorites.includes(person.id)} onFavorite={() => toggleFavorite(person.id)} onOpen={() => openProfile(person)} onChat={() => canChatWith(person) ? openContact(person) : openInquire(person)} chatReady={canChatWith(person)} />)}</View>
      {!visiblePeople.length && <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 29 }}><Heading size={21}>No matches yet</Heading><T style={{ color: color.muted, marginTop: 6 }}>Try another specialty or a wider location.</T><Button onPress={() => openCollection('All creatives', 'all')} style={{ alignSelf: 'flex-start', marginTop: 13 }}>See all creatives</Button></View>}
    </View>}
    {page === 'map' && <View style={{ width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: pagePadding, paddingTop: compact ? 20 : 25, paddingBottom: 60 }}>{!compact && <Pressable onPress={goHome}><T style={{ color: color.purple, fontWeight: '900' }}>← Back to freelancers</T></Pressable>}{compact && <View style={{ zIndex: 20 }}>{mobileLocationPicker}</View>}<View style={{ marginTop: 15, marginBottom: 15 }}><Heading size={compact ? 27 : 30}>Creatives around {place} 📍</Heading><T style={{ color: color.muted, marginTop: 4 }}>{'Tap a pin to view a profile.'}</T></View><ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8 }}>{['Local', '10 km', '25 km', 'All Goa'].map(value => <Pressable key={value} onPress={() => setRadius(value)} style={{ paddingHorizontal: 17, paddingVertical: 9, borderRadius: 18, backgroundColor: radius === value ? color.purple : '#fff', borderWidth: 1, borderColor: radius === value ? color.purple : color.line }}><T style={{ color: radius === value ? '#fff' : color.ink, fontSize: 13, fontWeight: '900' }}>{value}</T></Pressable>)}</ScrollView><MapCanvas people={mapPeople} compact={compact} place={place} radius={radius} onSelect={openProfile} /><View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 13 }}><Text style={{ color: color.purple }}>●</Text><T style={{ fontSize: 13, color: color.muted }}>{mapPeople.length} creatives · Locations are approximate</T></View></View>}
    {page === 'chats' && userId && <ChatWorkspace compact={compact} people={chatPerson && !chatPeople.some(person => person.id === chatPerson.id) ? [chatPerson, ...chatPeople] : chatPeople} selected={chatPerson} messages={displayMessages} draft={chatDraft} role={chatRoute?.freelancerId === userId ? 'freelancer' : 'finder'} canShareContact={!!chatRoute && chatRoute.freelancerId === userId} onShareContact={shareContact} messageKey={messageKey} onSelect={selectChat} onBack={() => setChatPerson(null)} onClose={closeChats} onDraft={setChatDraft} onSend={sendMessage} />}
    {page === 'account' && <View style={{ width: '100%', maxWidth: 1050, alignSelf: 'center', paddingHorizontal: pagePadding, paddingTop: 29, paddingBottom: 60 }}>
      <Heading size={30}>Your space<Text style={{ color: color.coral }}> ✦</Text></Heading><T style={{ color: color.muted, marginTop: 5, marginBottom: 20 }}>Manage inquiries, chats and agreements in one place.</T>
      <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, borderRadius: 22, padding: 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center', gap: 14 }}><View style={{ width: 54, height: 54, borderRadius: 28, backgroundColor: '#f3e5ff', alignItems: 'center', justifyContent: 'center' }}><TabIcon name="profile" color={color.purple} size={28} /></View><View style={{ flex: 1 }}><T style={{ fontSize: 19, fontWeight: '900' }}>{finder?.name || ownProfile?.name || 'Visitor'}</T><T style={{ color: color.muted, fontSize: 13, marginTop: 2 }}>{userId ? 'Signed in · Goa' : 'Sign in to connect'}</T></View></View>
      {!userId && <Button onPress={enterFinder} style={{ marginBottom: 16 }}>Create an account or sign in</Button>}
      <View style={{ gap: 10 }}>
        {userId && <ActionTile icon="📥" title="Inquiries" detail="Review what you sent and respond to new briefs." onPress={() => { refreshInquiries(); setPage('inquiries'); }} />}
        {userId && <ActionTile icon="📋" title="My requirements" detail="Review your posts and responses." onPress={() => setPage('myPosts')} />}
        <ActionTile icon="✍️" title="Post a requirement" detail="Tell local creatives what you need." onPress={openNewRequest} />
        <ActionTile icon="🌟" title={ownProfile ? 'My freelancer profile' : 'Create a freelancer profile'} detail="Showcase your work and manage your availability." onPress={enterFreelancer} />
        <ActionTile icon="📋" title="Browse requirements" detail="Find briefs that match your skills." onPress={() => setPage('requests')} />
        {userId && <ActionTile icon="💬" title="Chats" detail="Continue your conversations after inquiry approval." onPress={openChats} />}
        <ActionTile icon="✍️" title="Hiring & agreements" detail="Review offers, contracts and disputes." onPress={() => setPage('hiring')} />
        <ActionTile icon="♥" title="Saved creatives" detail="People you want to revisit." onPress={() => { setCategory('all'); setSearch(''); setSearchDraft(''); setSavedOnly(true); setRadius('All Goa'); setPage('search'); }} />
      </View>
      {userId && <Pressable accessibilityRole="button" onPress={signOut} style={{ paddingVertical: 20, alignItems: 'center' }}><T style={{ color: color.muted, fontWeight: '900' }}>Sign out</T></Pressable>}
    </View>}
    {page === 'hiring' && <HiringDashboard userId={userId} freelancerId={ownProfile?.id || null} />}
    {page === 'myPosts' && <View style={{ width: '100%', maxWidth: 1050, alignSelf: 'center', paddingHorizontal: pagePadding, paddingTop: 29, paddingBottom: 60 }}><Pressable onPress={() => setPage('account')}><T style={{ color: color.purple, fontWeight: '900' }}>← Your space</T></Pressable><View style={{ flexDirection: compact ? 'column' : 'row', justifyContent: 'space-between', alignItems: compact ? 'flex-start' : 'center', gap: 13, marginTop: 17, marginBottom: 20 }}><View><Heading size={30}>My requirements 📋</Heading><T style={{ color: color.muted, marginTop: 4 }}>Track the work you’ve shared with local creatives.</T></View><Button onPress={openNewRequest}>Post a requirement</Button></View>{finderPosts.map(post => <View key={post.id} style={{ backgroundColor: '#fff', borderRadius: 20, padding: 21, marginBottom: 12, borderWidth: 1, borderColor: color.line }}><TinyTag style={{ alignSelf: 'flex-start', marginBottom: 11 }}>YOUR POST</TinyTag><Heading size={21}>{post.title}</Heading><T style={{ color: color.muted, marginTop: 5 }}>{post.taluka} · {catalog.find(item => item.id === post.category)?.label || post.category}</T><T style={{ marginTop: 11 }}>{post.details}</T><T style={{ color: color.purple, marginTop: 13, fontWeight: '900', fontSize: 13 }}>Applications appear here when freelancers respond.</T></View>)}</View>}
    {page === 'inquiries' && userId && <InquiryInbox items={inquiries} ownId={userId} onRefresh={refreshInquiries} onChat={openApprovedChat} />}
    {page === 'profile' && profile && <View style={{ width: '100%', maxWidth: 1260, alignSelf: 'center', paddingHorizontal: pagePadding, paddingTop: 24, paddingBottom: 65 }}>
      <Pressable accessibilityRole="button" onPress={goBackFromProfile}><T style={{ color: color.purple, fontWeight: '900' }}>← Back to {detailReturnPage === 'map' ? 'map' : detailReturnPage === 'search' ? 'search' : detailReturnPage === 'collection' ? collection.title.toLowerCase() : 'freelancers'}</T></Pressable>
      <View style={{ marginTop: 18, borderRadius: 28, backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, overflow: 'hidden' }}>
      <ProfileWall profile={profile} compact={compact} narrow={narrow} rating={profileRating} reviewCount={profileReviewCount} saved={favorites.includes(profile.id)} onChat={() => canChatWith(profile) ? openContact(profile) : openInquire(profile)} chatReady={canChatWith(profile)} onSave={() => toggleFavorite(profile.id)} onMap={() => { setPage('map'); setRadius('All Goa'); }} onAvailability={() => setAvailabilityOpen(true)} />
      <ProfileMedia profile={profile} narrow={narrow} canEdit={canEditPortfolio} photos={(portfolioAssets[profile.id] || []).filter(item => item.kind === 'photo').map(item => item.url)} video={(portfolioAssets[profile.id] || []).find(item => item.kind === 'video')?.url || null} documents={(portfolioAssets[profile.id] || []).filter(item => item.kind === 'document').map(item => ({ name: item.file_name, size: item.size_bytes, uri: item.url }))} onAddPhotos={() => pickPortfolio('photo')} onAddVideo={() => pickPortfolio('video')} onAddDocuments={() => pickPortfolio('document')} onRemovePhoto={index => removePortfolio('photo', index)} onRemoveVideo={() => removePortfolio('video', 0)} onRemoveDocument={index => removePortfolio('document', index)} />
      </View>
      {!profile.demo && <HiringProfile key={`hiring-${profile.id}`} freelancerId={profile.id} category={profile.category} name={profile.name} userId={userId} finderId={finder ? userId : null} isOwner={profile.id === userId} isDemo={false} canNegotiate={approvedPairs.some(item => item.finder_id === userId && item.freelancer_id === profile.id)} />}
      {canEditPortfolio && <Button outline onPress={() => { setFormName(profile.name); setFormRole(profile.role); setFormCategory(profile.category); setFormWhy(profile.why); setFormImage(profile.imageUrl || ''); setFormWork(profile.work.join(', ')); setDialog('freelancer'); }} style={{ alignSelf: 'flex-start', marginTop: 15 }}>Edit profile details</Button>}
      {canEditPortfolio && ownBlocks.map(item => <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff0ef', borderRadius: 13, padding: 12, marginTop: 7 }}><T style={{ fontSize: 12 }}>Busy: {item.start} – {item.end}</T><Pressable accessibilityRole="button" accessibilityLabel={`Remove busy dates ${item.start} to ${item.end}`} onPress={async () => { try { await removeLeaveBlock(item.id); await refreshAvailability(profile.id); } catch (error) { setNotice((error as Error).message); } }}><T style={{ color: color.coral, fontWeight: '900', fontSize: 12 }}>Remove</T></Pressable></View>)}
      <View style={{ marginTop: 44 }}><Heading size={25}>More people you might like <Text style={{ color: color.coral }}>✦</Text></Heading><T style={{ color: color.muted, marginTop: 4, marginBottom: 15 }}>Related to your searches and interests in Goa.</T><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 13 }}>{allPeople.filter(person => person.id !== profile.id).slice(0, 4).map(person => <ProfileCard key={person.id} person={person} width={245} favorite={favorites.includes(person.id)} onFavorite={() => toggleFavorite(person.id)} onOpen={() => openProfile(person)} onChat={() => canChatWith(person) ? openContact(person) : openInquire(person)} chatReady={canChatWith(person)} />)}</ScrollView></View>
    </View>}
    <Overlay visible={!!inquiryPerson} title="Project inquiry" onClose={() => setInquiryPerson(null)} width={700}>
      {inquiryPerson && userId && <InquiryForm person={inquiryPerson} finderId={userId} onClose={() => setInquiryPerson(null)} onSent={failed => { setInquiryPerson(null); refreshInquiries(); setNotice(failed.length ? `Inquiry sent, but these images did not attach: ${failed.join(', ')}` : 'Inquiry sent. The freelancer will review it before chat opens.'); setPage('inquiries'); }} />}
    </Overlay>
    <Overlay visible={availabilityOpen && page === 'profile' && !!profile} title="See availability" onClose={() => setAvailabilityOpen(false)} width={900}>
      {profile && <AvailabilityCalendar key={profile.id} name={profile.name.split(' ')[0]} busy={profileBusy} owner={canEditPortfolio} example={!!profile.demo} readOnly={!canEditPortfolio} onBlock={blockDates} onRequest={() => { setAvailabilityOpen(false); openInquire(profile); }} />}
    </Overlay>
    {page === 'requests' && <View style={{ width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: pagePadding, paddingTop: 25, paddingBottom: 60 }}>
      <Pressable onPress={goHome}><T style={{ color: color.purple, fontWeight: '900' }}>← Back to freelancers</T></Pressable>
      <View style={{ flexDirection: narrow ? 'column' : 'row', justifyContent: 'space-between', alignItems: narrow ? 'flex-start' : 'center', gap: 13, marginTop: 17, marginBottom: 20 }}><View><Heading size={30}>Requests around you 📣</Heading><T style={{ color: color.muted, marginTop: 4 }}>Local freelancers see matching requests first. Reach expands over three days.</T></View><Button onPress={openNewRequest}>Post a request →</Button></View>
      {displayedRequests.length ? displayedRequests.map(post => <View key={post.id} style={{ backgroundColor: '#fff', borderRadius: 20, padding: 21, marginBottom: 12, borderWidth: 1, borderColor: color.line }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><Heading size={21}>{post.title}</Heading><TinyTag>{requestReach(post)}</TinyTag></View>
        <T style={{ color: color.muted, marginTop: 5 }}>{catalog.find(item => item.id === post.category)?.label || post.category} · {post.taluka} · Posted by {post.finder}</T>
        <T style={{ marginTop: 12, lineHeight: 22 }}>{post.details}</T>
        {post.finderId === userId ? <View style={{ marginTop: 16 }}><T style={{ color: color.purple, fontWeight: '900' }}>Applicants ({(applications[post.id] || []).length})</T>
          {(applications[post.id] || []).map(item => { const person = allPeople.find(value => value.id === item.freelancer_id); return <View key={item.id} style={{ backgroundColor: '#f8f3fd', borderRadius: 14, padding: 12, marginTop: 8 }}>
            <Pressable onPress={() => person && openProfile(person)}><T style={{ fontWeight: '900' }}>{person?.name || 'Freelancer'} →</T></Pressable><T style={{ marginTop: 5 }}>{item.note}</T><T style={{ color: color.muted, fontSize: 12, marginTop: 3 }}>Status: {item.status}</T>
            {item.status === 'new' && <View style={{ flexDirection: 'row', gap: 7, marginTop: 9 }}><Button onPress={() => reviewApplication(post.id, item.id, 'shortlisted')}>Shortlist</Button><Button outline onPress={() => reviewApplication(post.id, item.id, 'declined')}>Decline</Button></View>}</View>; })}
        </View> : ownProfile && post.finderId !== userId && requestMatchesFreelancer(post, ownProfile) ? <View style={{ marginTop: 16 }}><Field value={applyDraft[post.id] || ''} onChangeText={value => setApplyDraft(previous => ({ ...previous, [post.id]: value }))} placeholder="Tell the Finder why you're a good match" multiline /><Button onPress={() => apply(post)} style={{ marginTop: 9, alignSelf: 'flex-start' }}>Apply to request →</Button></View> :
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
    {!compact && <View style={{ marginTop: 'auto', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: color.line, paddingHorizontal: pagePadding, paddingVertical: 23 }}><View style={{ maxWidth: 1540, width: '100%', alignSelf: 'center', flexDirection: narrow ? 'column' : 'row', justifyContent: 'space-between', gap: 7 }}><T style={{ fontWeight: '900', color: '#332384' }}>WhyChooze<Text style={{ color: color.coral }}>Me</Text> <Text style={{ fontWeight: '500', color: color.muted }}>· Real People. Real Skills. Right Near You.</Text></T><T style={{ color: color.muted, fontSize: 12 }}>Made for local talent in Goa ✺</T></View></View>}
    </ScrollView>
    <MobileCategoryNavigation visible={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} categories={catalog} onCategory={openHighlightedCategory} onAll={() => { setCategory('all'); setSavedOnly(false); setSearch(''); setSearchDraft(''); setPage('search'); }} onMap={() => setPage('map')} onRequests={() => setPage('requests')} onInfo={openInfo} />
    {compact && <View style={{ backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: color.line, flexDirection: 'row', paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 14 : 8, shadowColor: '#211847', shadowOpacity: .08, shadowRadius: 9, elevation: 8 }}>{mobileTabs.map(tab => { const selected = activeMobileTab === tab.id; return <Pressable key={tab.id} accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{ selected }} onPress={() => goMobileTab(tab.id)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 56, gap: 3 }}><View style={{ minWidth: 50, height: 29, borderRadius: 16, backgroundColor: selected ? '#f0e7ff' : 'transparent', alignItems: 'center', justifyContent: 'center' }}><TabIcon name={tab.icon} color={selected ? color.purple : '#8e8ca0'} /></View><T style={{ color: selected ? color.purple : '#77758b', fontSize: 11, fontWeight: selected ? '900' : '700' }}>{tab.label}</T></Pressable>; })}</View>}
    {!compact && <View style={{ position: 'absolute', right: 22, bottom: 20, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 15 }}>
      {mapShortcutHovered && <View pointerEvents="none" style={[{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e7dcff', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 8, shadowColor: '#241644', shadowOpacity: .14, shadowRadius: 10, elevation: 4 }, menuMotion]}><T style={{ color: color.purple, fontSize: 12, fontWeight: '900' }}>Explore freelancers on map</T></View>}
      <Pressable accessibilityRole="button" accessibilityLabel="Explore freelancers on map" onHoverIn={() => setMapShortcutHovered(true)} onHoverOut={() => setMapShortcutHovered(false)} onFocus={() => setMapShortcutHovered(true)} onBlur={() => setMapShortcutHovered(false)} onPress={() => { setMapShortcutHovered(false); setMenu(null); setProfile(null); setPage('map'); }} style={({ pressed }) => [{ width: 54, height: 54, borderRadius: 28, backgroundColor: color.purple, alignItems: 'center', justifyContent: 'center', shadowColor: color.purple, shadowOpacity: mapShortcutHovered ? .42 : .3, shadowRadius: mapShortcutHovered ? 17 : 12, elevation: mapShortcutHovered ? 8 : 5, transform: [{ scale: pressed ? .95 : mapShortcutHovered ? 1.07 : 1 }] }, Platform.OS === 'web' ? { cursor: 'pointer', transition: 'transform 170ms ease, box-shadow 170ms ease' } as any : null]}><TabIcon name="map" color="#fff" size={27} /></Pressable>
    </View>}
    {!!notice && <Pressable onPress={() => setNotice('')} style={{ position: 'absolute', alignSelf: 'center', bottom: compact ? 80 : 25, left: 15, right: compact ? 15 : 85, backgroundColor: '#1f1942', paddingHorizontal: 17, paddingVertical: 11, borderRadius: 14, maxWidth: 470, zIndex: 30 }}><Text style={{ color: '#fff', fontFamily: 'Nunito', fontSize: 13 }}>{notice}  ×</Text></Pressable>}
    <Overlay visible={!!infoDialog} title={infoLinks.find(item => item.id === infoDialog)?.label || ''} onClose={() => setInfoDialog(null)} width={560}>
      {infoDialog && <View style={{ paddingBottom: 8 }}><View style={{ width: 52, height: 52, borderRadius: 17, backgroundColor: '#f2eaff', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><InfoNavIcon name={infoDialog} size={27} color={color.purple} /></View><Heading size={21} style={{ marginBottom: 9 }}>{infoContent[infoDialog].lead}</Heading><T style={{ color: color.muted, lineHeight: 23 }}>{infoContent[infoDialog].detail}</T></View>}
    </Overlay>
    <Overlay visible={dialog === 'finder'} title={authMode === 'recovery' ? 'Set a new password' : authMode === 'reset' ? 'Reset password' : finder ? 'Your Finder profile' : guestLimitPrompt ? 'Keep exploring ✦' : authMode === 'join' ? 'Become a Finder ✨' : 'Welcome back ✨'} onClose={() => { setDialog(null); setGuestLimitPrompt(false); }}>
      {authMode === 'recovery' ? <><T style={{ color: color.muted, marginBottom: 18 }}>Enter a new password for your account.</T><Label>New password</Label><Field value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry /><Button onPress={registerFinder} style={{ marginTop: 14 }}>Save new password</Button></> :
      finder ? <><T style={{ color: color.muted, marginBottom: 17 }}>Your account details.</T><Label>Name</Label><T>{finder.name}</T><View style={{ height: 13 }} /><Label>Email</Label><T>{finder.email}</T></> :
      <><T style={{ color: color.muted, marginBottom: 18 }}>{authMode === 'reset' ? 'We will email a password reset link if the account exists.' : guestLimitPrompt ? 'You have explored three profiles. Sign in or create an account to view more profiles and send inquiries.' : 'Sign in or create an account to connect with local freelancers.'}</T>
      {authMode === 'join' && <><Label>Your name</Label><Field value={finderName} onChangeText={setFinderName} placeholder="What should we call you?" /><View style={{ height: 13 }} /></>}
      <Label>Email address</Label><Field value={finderEmail} onChangeText={setFinderEmail} placeholder="you@example.com" keyboardType="email-address" />
      {authMode !== 'reset' && <><View style={{ height: 13 }} /><Label>Password</Label><Field value={password} onChangeText={setPassword} placeholder={authMode === 'join' ? 'At least 8 characters' : 'Your password'} secureTextEntry /></>}
      {authMode === 'join' && <><View style={{ height: 13 }} /><Label>Your taluka</Label><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingBottom: 8 }}>{(Object.keys(talukaCenters) as Taluka[]).map(value => <Pressable key={value} onPress={() => setFinderTaluka(value)} style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 17, backgroundColor: finderTaluka === value ? color.purple : '#f4eff8' }}><T style={{ color: finderTaluka === value ? '#fff' : color.ink, fontSize: 13 }}>{value}</T></Pressable>)}</ScrollView></>}
      {!!formError && <T style={{ color: color.coral, fontSize: 13, marginTop: 8 }}>{formError}</T>}
      <Button onPress={registerFinder} style={{ marginTop: 14 }}>{authMode === 'reset' ? 'Send reset link' : authMode === 'join' ? 'Create Finder profile' : 'Sign in'}</Button>
      <Pressable onPress={() => { setAuthMode(authMode === 'join' ? 'signIn' : 'join'); setFormError(''); }} style={{ alignItems: 'center', padding: 13 }}><T style={{ color: color.purple, fontWeight: '900' }}>{authMode === 'join' ? 'Already have an account? Sign in' : 'New here? Create an account'}</T></Pressable>
      {authMode === 'signIn' && <Pressable onPress={() => { setAuthMode('reset'); setFormError(''); }} style={{ alignItems: 'center', padding: 8 }}><T style={{ color: color.purple, fontWeight: '900' }}>Forgot password?</T></Pressable>}</>}
    </Overlay>
    <Overlay visible={dialog === 'freelancer'} title="Show your talent 🌟" onClose={() => setDialog(null)}><T style={{ color: color.muted, marginBottom: 16 }}>Create a profile with your own “Why Choose Me” introduction.</T><Label>Your name</Label><Field value={formName} onChangeText={setFormName} placeholder="Your full name" /><View style={{ height: 11 }} /><Label>Your role</Label><Field value={formRole} onChangeText={setFormRole} placeholder="e.g. Graphic designer" /><View style={{ height: 11 }} /><Label>Category</Label><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 8 }}>{catalog.filter(item => item.id !== 'all').map(item => <Pressable key={item.id} onPress={() => setFormCategory(item.id)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: formCategory === item.id ? color.purple : '#f4eff8' }}><T style={{ fontSize: 12, color: formCategory === item.id ? '#fff' : color.ink }}>{item.icon} {item.label}</T></Pressable>)}</ScrollView>{formCategory === 'other' && <><Field value={customCategory} onChangeText={setCustomCategory} placeholder="Name your skill or category" /><T style={{ color: color.muted, fontSize: 12, marginTop: 5 }}>New names go into a pending category list for review.</T></>}<View style={{ height: 11 }} /><Label>Profile photo URL (optional)</Label><Field value={formImage} onChangeText={setFormImage} placeholder="https://your-site.com/photo.jpg" /><View style={{ height: 11 }} /><Label>Portfolio highlights</Label><Field value={formWork} onChangeText={setFormWork} placeholder="e.g. Wedding shoots, portraits, brand work" /><T style={{ color: color.muted, fontSize: 12, marginTop: 4, marginBottom: 11 }}>Separate highlights with commas.</T><Label>Why choose you?</Label><Field value={formWhy} onChangeText={setFormWhy} placeholder="Tell people what makes your work special" multiline />{!!formError && <T style={{ color: color.coral, fontSize: 13, marginTop: 8 }}>{formError}</T>}<Button onPress={createFreelancer} style={{ marginTop: 17 }}>Create my profile</Button><T style={{ color: color.muted, fontSize: 12, marginTop: 11, textAlign: 'center' }}>Your profile is saved to your account.</T></Overlay>
    <Overlay visible={dialog === 'request'} title="Post a local request 📣" onClose={() => setDialog(null)}><T style={{ color: color.muted, marginBottom: 16 }}>People in your taluka see it first. Reach widens to all Goa over three days.</T><Label>What do you need?</Label><Field value={requestTitle} onChangeText={setRequestTitle} placeholder="e.g. Graphic designer for my café" /><View style={{ height: 11 }} /><Label>Category</Label><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 8 }}>{catalog.filter(item => item.id !== 'all').map(item => <Pressable key={item.id} onPress={() => setRequestCategory(item.id)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: requestCategory === item.id ? color.purple : '#f4eff8' }}><T style={{ fontSize: 12, color: requestCategory === item.id ? '#fff' : color.ink }}>{item.icon} {item.label}</T></Pressable>)}</ScrollView><View style={{ height: 11 }} /><Label>Tell them about the work</Label><Field value={requestDetails} onChangeText={setRequestDetails} placeholder="Timeline, budget, style and what a great result looks like..." multiline /><T style={{ color: color.muted, fontSize: 12, marginTop: 10 }}>Tip: post 3–4 days before you need someone for the best local reach.</T>{!!formError && <T style={{ color: color.coral, fontSize: 13, marginTop: 8 }}>{formError}</T>}<Button onPress={postRequest} style={{ marginTop: 17 }}>Post request</Button></Overlay>
    <Overlay visible={dialog === 'notifications'} title="Notifications 🔔" onClose={() => setDialog(null)}>
      <T style={{ color: color.muted, marginBottom: 15 }}>The latest from your Goa talent search.</T>
      {remoteNotices.length ? remoteNotices.map(item => <View key={item.id} style={{ padding: 13, backgroundColor: '#f8f3fd', borderRadius: 14, marginBottom: 8 }}><T style={{ fontWeight: '900' }}>{item.title}</T><T style={{ color: color.muted, fontSize: 12 }}>{new Date(item.created_at).toLocaleString()}</T></View>) : <T style={{ color: color.muted }}>Nothing new yet.</T>}
    </Overlay>
  </View>;
}
