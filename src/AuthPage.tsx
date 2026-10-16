import React from 'react';
import { Image, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import brandLogo from '../assets/whychoozeme-logo.png';
import { AuthMode } from './authRoute';
import type { AccountKind } from './liveApi';
import { Taluka, talukaCenters } from './data';
import { Button, color } from './UI';

type Props = {
  mode: AuthMode;
  compact: boolean;
  signedIn: boolean;
  name: string;
  email: string;
  code: string;
  codeSentTo: string;
  taluka: Taluka;
  accountKind: AccountKind | null;
  busy: boolean;
  error: string;
  message: string;
  guestLimit: boolean;
  onName: (value: string) => void;
  onEmail: (value: string) => void;
  onCode: (value: string) => void;
  onTaluka: (value: Taluka) => void;
  onAccountKind: (value: AccountKind) => void;
  onMode: (mode: AuthMode) => void;
  onSubmit: () => void;
  onResend: () => void;
  onChangeEmail: () => void;
  onBack: () => void;
};

const font = 'Nunito' as const;
const fieldStyle = { height: 52, borderWidth: 1, borderColor: '#e6dff0', borderRadius: 15, backgroundColor: '#fff', paddingHorizontal: 16, color: color.ink, fontFamily: font, fontSize: 15 };
const labelStyle = { color: color.ink, fontFamily: font, fontSize: 13, fontWeight: '900' as const, marginBottom: 7 };

export default function AuthPage({ mode, compact, signedIn, name, email, code, codeSentTo, taluka, accountKind, busy, error, message, guestLimit, onName, onEmail, onCode, onTaluka, onAccountKind, onMode, onSubmit, onResend, onChangeEmail, onBack }: Props) {
  const joining = mode === 'join';
  const heading = codeSentTo ? 'Check your email.' : joining ? 'Make room for your next opportunity.' : 'Good to see you again.';
  const description = codeSentTo ? `Enter the 8-digit verification code sent to ${codeSentTo}.` : guestLimit ? 'Sign in to keep exploring local talent and send inquiries.' : joining ? 'Join the local community finding and sharing great work. No password needed.' : 'Sign in with a one-time email code. No password needed.';

  return <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1, backgroundColor: '#fffaf4' }} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: compact ? 16 : 30, paddingVertical: compact ? 16 : 28 }}>
    <View style={{ width: '100%', maxWidth: 1320, alignSelf: 'center', flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: compact ? 19 : 28 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="WhyChoozeMe home" onPress={onBack}>
          <Image source={Platform.OS==='web'?{uri:brandLogo as unknown as string}:brandLogo} resizeMode="contain" accessibilityLabel="WhyChoozeMe logo" style={{ width: compact ? 195 : 238, height: compact ? 41 : 49 }} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onBack} style={{ paddingHorizontal: 15, paddingVertical: 9, borderRadius: 19, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee5ef' }}><Text style={{ fontFamily: font, color: color.purple, fontSize: 12, fontWeight: '900' }}>← Explore</Text></Pressable>
      </View>

      <View style={{ flex: 1, minHeight: compact ? undefined : 590, flexDirection: compact ? 'column' : 'row', borderRadius: compact ? 24 : 34, overflow: 'hidden', borderWidth: 1, borderColor: '#eee4ee', backgroundColor: '#fff', shadowColor: '#76648c', shadowOpacity: .09, shadowRadius: 26, elevation: 3 }}>
        {!compact && <View style={[{ flex: 1, minWidth: 0, padding: 48, justifyContent: 'space-between', backgroundColor: '#f1e8ff', overflow: 'hidden' }, Platform.OS === 'web' ? { backgroundImage: 'radial-gradient(circle at 5% 5%, #ffe3d6 0, transparent 38%), radial-gradient(circle at 88% 80%, #cef2f2 0, transparent 42%), linear-gradient(135deg, #f7efff, #e9e1ff)' } as any : null]}>
          <View><View style={{ alignSelf: 'flex-start', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#dccbff', backgroundColor: 'rgba(255,255,255,.75)' }}><Text style={{ color: color.purple, fontFamily: font, fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>REAL PEOPLE · REAL SKILLS</Text></View>
            <Text style={{ marginTop: 34, color: color.ink, fontFamily: font, fontSize: 43, lineHeight: 51, fontWeight: '900', letterSpacing: -1.7 }}>Great things start with a <Text style={{ color: color.purple }}>hello.</Text></Text>
            <Text style={{ marginTop: 17, color: '#656984', fontFamily: font, fontSize: 16, lineHeight: 25, maxWidth: 410 }}>Meet local talent, share what you need, and turn good conversations into great work.</Text>
          </View>
          <View style={{ gap: 12, maxWidth: 390 }}>
            <View style={{ alignSelf: 'flex-start', transform: [{ rotate: '-4deg' }], borderRadius: 18, backgroundColor: '#fff', paddingHorizontal: 19, paddingVertical: 13, shadowColor: color.purple, shadowOpacity: .1, shadowRadius: 12 }}><Text style={{ color: color.purple, fontFamily: font, fontWeight: '900' }}>“Can you help bring this idea to life?”</Text></View>
            <View style={{ alignSelf: 'flex-end', transform: [{ rotate: '3deg' }], borderRadius: 18, backgroundColor: '#fff', paddingHorizontal: 19, paddingVertical: 13, shadowColor: color.purple, shadowOpacity: .1, shadowRadius: 12 }}><Text style={{ color: '#1d8c72', fontFamily: font, fontWeight: '900' }}>“Absolutely. Let’s make it happen ✦”</Text></View>
            <Text style={{ marginTop: 30, color: '#605887', fontFamily: font, fontSize: 12, fontWeight: '800' }}>Built for skills and stories around Goa.</Text>
          </View>
        </View>}

        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: compact ? 22 : 46, paddingVertical: compact ? 28 : 45, minWidth: 0 }}>
          <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center' }}>
            {!signedIn && !codeSentTo && <View style={{ flexDirection: 'row', backgroundColor: '#f5f0fb', borderRadius: 16, padding: 5, marginBottom: 27 }}>
              {([['signIn', 'Sign in'], ['join', 'Sign up']] as const).map(([next, title]) => <Pressable key={next} accessibilityRole="tab" accessibilityLabel={title} accessibilityState={{ selected: mode === next }} onPress={() => onMode(next)} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: mode === next ? '#fff' : 'transparent', shadowColor: '#493179', shadowOpacity: mode === next ? .08 : 0, shadowRadius: 7 }}><Text style={{ color: mode === next ? color.purple : color.muted, fontFamily: font, fontSize: 14, fontWeight: '900' }}>{title}</Text></Pressable>)}
            </View>}
            <Text style={{ color: color.ink, fontFamily: font, fontWeight: '900', fontSize: compact ? 29 : 34, lineHeight: compact ? 36 : 40, letterSpacing: -1 }}>{signedIn ? 'You’re already signed in.' : heading}</Text>
            <Text style={{ color: color.muted, fontFamily: font, fontSize: 14, lineHeight: 21, marginTop: 9, marginBottom: 24 }}>{signedIn ? 'Your account is ready. Continue exploring local talent.' : description}</Text>

            {signedIn ? <Button onPress={onBack}>Continue to WhyChoozeMe →</Button> : <>
              {joining && !codeSentTo && <View style={{ marginBottom: 18 }}>
                <Text style={labelStyle}>I’m joining as</Text>
                <View style={{ flexDirection: compact ? 'column' : 'row', gap: 9 }}>
                  {([['finder', 'Finder', 'Find local talent and share what you need.', '⌕'], ['freelancer', 'Freelancer', 'Show your work and meet local clients.', '✦']] as const).map(([value, title, detail, icon]) => <Pressable key={value} accessibilityRole="radio" accessibilityLabel={title} accessibilityState={{ selected: accountKind === value }} onPress={() => onAccountKind(value)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, minHeight: 76, borderRadius: 15, borderWidth: 1.5, borderColor: accountKind === value ? color.purple : '#e8e1ee', backgroundColor: accountKind === value ? '#f5efff' : '#fff' }}>
                    <View style={{ width: 33, height: 33, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: accountKind === value ? '#e7d9ff' : '#f5f1f7' }}><Text style={{ color: color.purple, fontSize: 19, fontWeight: '900' }}>{icon}</Text></View>
                    <View style={{ flex: 1 }}><Text style={{ color: color.ink, fontFamily: font, fontWeight: '900', fontSize: 14 }}>{title}</Text><Text style={{ color: color.muted, fontFamily: font, fontSize: 11, lineHeight: 15, marginTop: 2 }}>{detail}</Text></View>
                  </Pressable>)}
                </View>
              </View>}
              {joining && !codeSentTo && <View style={{ marginBottom: 15 }}><Text style={labelStyle}>Your name</Text><TextInput accessibilityLabel="Your name" value={name} onChangeText={onName} placeholder="What should we call you?" placeholderTextColor="#9992a8" autoCapitalize="words" autoComplete="name" style={fieldStyle} /></View>}
              {!codeSentTo ? <View style={{ marginBottom: 15 }}><Text style={labelStyle}>Email address</Text><TextInput accessibilityLabel="Email address" value={email} onChangeText={onEmail} placeholder="you@example.com" placeholderTextColor="#9992a8" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" style={fieldStyle} /></View> : <View style={{ marginBottom: 15 }}><Text style={labelStyle}>Verification code</Text><TextInput accessibilityLabel="Verification code" value={code} onChangeText={value => onCode(value.replace(/\D/g, '').slice(0, 8))} onSubmitEditing={onSubmit} placeholder="8-digit code" placeholderTextColor="#9992a8" keyboardType="number-pad" autoCapitalize="none" autoComplete="one-time-code" maxLength={8} style={[fieldStyle, { textAlign: 'center', letterSpacing: 6, fontSize: 20 }]} /></View>}
              {joining && !codeSentTo && <View style={{ marginBottom: 16 }}><Text style={labelStyle}>Your taluka</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{(Object.keys(talukaCenters) as Taluka[]).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: taluka === value }} onPress={() => onTaluka(value)} style={{ paddingHorizontal: 11, paddingVertical: 7, borderRadius: 15, borderWidth: 1, borderColor: taluka === value ? color.purple : '#e9e4ee', backgroundColor: taluka === value ? '#f2ebff' : '#fff' }}><Text style={{ color: taluka === value ? color.purple : color.muted, fontFamily: font, fontSize: 11, fontWeight: '800' }}>{value}</Text></Pressable>)}</View></View>}
              {!!error && <Text accessibilityRole="alert" style={{ color: '#bd3e4b', fontFamily: font, fontSize: 12, marginBottom: 12 }}>{error}</Text>}
              {!!message && <View style={{ borderRadius: 12, padding: 11, backgroundColor: '#ebfff3', marginBottom: 12 }}><Text style={{ color: '#146d4c', fontFamily: font, fontSize: 12, fontWeight: '800' }}>{message}</Text></View>}
              <Button onPress={onSubmit} disabled={busy} style={{ width: '100%', minHeight: 50 }} textStyle={{ fontSize: 15 }}>{busy ? 'Please wait…' : codeSentTo ? 'Verify code' : joining ? 'Send sign-up code' : 'Send sign-in code'}</Button>
              {codeSentTo ? <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' }}><Pressable accessibilityRole="button" disabled={busy} onPress={onResend} style={{ padding: 13 }}><Text style={{ color: color.purple, fontFamily: font, fontSize: 12, fontWeight: '900' }}>Resend code</Text></Pressable><Pressable accessibilityRole="button" onPress={onChangeEmail} style={{ padding: 13 }}><Text style={{ color: color.muted, fontFamily: font, fontSize: 12, fontWeight: '900' }}>Change email</Text></Pressable></View> : joining && <Pressable accessibilityRole="button" onPress={() => onMode('signIn')} style={{ alignSelf: 'center', padding: 13 }}><Text style={{ color: color.purple, fontFamily: font, fontSize: 12, fontWeight: '900' }}>Already have an account? Sign in →</Text></Pressable>}
            </>}
          </View>
        </View>
      </View>
      <Text style={{ alignSelf: 'center', marginTop: 20, color: '#8b8497', fontFamily: font, fontSize: 11 }}>Real People. Real Skills. Right Near You.</Text>
    </View>
  </ScrollView>;
}
