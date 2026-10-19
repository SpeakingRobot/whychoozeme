import React from 'react';
import { Text, View } from 'react-native';
import { color, Heading } from './UI';

const sections = [
  ['What WhyChoozeMe provides', 'WhyChoozeMe is a directory and introduction service. Finders can browse public Freelancer profiles, portfolios and reviews, post requirements, receive approaches, and exchange messages with Freelancers. A Freelancer may choose to show a WhatsApp number on a public profile.'],
  ['Work happens between members', 'WhyChoozeMe does not create or sign agreements for members, process or hold payments, manage project delivery, track working time, or decide disputes. Finders and Freelancers decide for themselves whether to work together and are responsible for agreeing on scope, price, timing, payment, taxes and any written contract outside the site. A site message or requirement post is not a platform-approved agreement.'],
  ['Profiles and contact', 'Members must provide information they have the right to share and must not impersonate others or post unlawful, misleading or abusive content. Portfolios and reviews are supplied by members or reviewers; members should check claims before committing to work. A WhatsApp number added to the public profile is visible to all profile visitors and opens an external service. Members can remove that number by editing their profile. WhatsApp has its own terms and privacy practices.'],
  ['Safety and moderation', 'Do not send spam, harassment, fraudulent offers, or requests for unlawful work. Use the available report or contact channel to raise a concern. WhyChoozeMe may review reported public content and restrict accounts or remove listings under its moderation rules. These measures do not guarantee a transaction or a member’s conduct.'],
  ['Your content and data', 'Members keep ownership of their profile and portfolio content, and allow WhyChoozeMe to display it for discovery. Account email and private chat content are used to operate the service; public profiles, requirement posts and any WhatsApp number deliberately published can be seen by others. Do not put sensitive information in public fields. Existing agreement records from earlier site versions are retained separately while their handling is reviewed; this version does not offer new agreement workflows.'],
  ['Important limits', 'WhyChoozeMe does not verify every identity, credential, review, portfolio item or payment promise. The service may be interrupted. Nothing here removes rights or protections that applicable law does not permit us to remove. These terms may be updated with notice when the service changes.'],
] as const;

export default function PlatformTerms() {
  return <View style={{ gap: 18, paddingBottom: 8 }}>
    <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 12 }}>Version 1 · 19 October 2026</Text>
    <Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 15, lineHeight: 23 }}>Please read how direct connections work before sharing your contact details or arranging a project.</Text>
    {sections.map(([title, body]) => <View key={title} style={{ borderTopWidth: 1, borderTopColor: color.line, paddingTop: 15 }}><Heading size={17}>{title}</Heading><Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 14, lineHeight: 22, marginTop: 7 }}>{body}</Text></View>)}
  </View>;
}
