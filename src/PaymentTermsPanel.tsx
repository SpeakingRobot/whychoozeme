import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { PricingRow, ServiceRow } from './hiringApi';
import { estimatePrice, pricingModelRegistry, PricingModel } from './hiring';
import { Button, color, Heading } from './UI';

const placeLabel: Record<string, string> = { remote: 'Remote', hybrid: 'Hybrid', on_site: 'On-site' };
const availabilityLabel: Record<string, string> = { appointment: 'By appointment', capacity: 'Based on capacity', exclusive: 'Reserved time', queue: 'Project queue', recurring: 'Recurring schedule' };
const modelLabel = (model: string) => model === 'hourly' ? 'Hourly' : model === 'milestone' ? 'Milestones' : model.replaceAll('_', ' ').replace(/^./, letter => letter.toUpperCase());
const money = (minor: number, currency: string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(minor / 100);

export function billingExplanation(option: PricingRow): string {
  const rate = option.rate_minor == null ? 'The amount is agreed in the proposal.' : `Indicative starting price: ${money(option.rate_minor, option.currency)}.`;
  if (option.model === 'hourly') return `${rate} Approved hours are billed at the agreed hourly rate, within the weekly hours and total spending cap written in the agreement.`;
  if (option.model === 'milestone') return `${rate} Each project stage needs its own deliverable, acceptance criteria and payment amount in the agreement. A stage is payable only after it is accepted.`;
  if (option.model === 'fixed') return `${rate} One agreed fee covers the exact scope and deliverables written in the agreement.`;
  const model = pricingModelRegistry[option.model as PricingModel];
  const estimate = model && estimatePrice({ model: option.model as PricingModel, currency: option.currency, rateMinor: option.rate_minor ?? undefined });
  return `${rate} ${estimate?.explanation || 'The calculation is agreed in the proposal.'} ${model ? `Completion: ${model.completion.toLowerCase()}.` : ''}`;
}

export default function PaymentTermsPanel({ services, prices, isOwner, canNegotiate, onContact, onChoose, renderOwnerActions }: {
  services: ServiceRow[];
  prices: PricingRow[];
  isOwner: boolean;
  canNegotiate: boolean;
  onContact: () => void;
  onChoose: (service: ServiceRow, option: PricingRow) => void;
  renderOwnerActions: (service: ServiceRow) => React.ReactNode;
}) {
  const [open, setOpen] = useState(isOwner);
  const active = services.filter(service => service.active || isOwner);
  if (!active.length) return null;
  const locations = [...new Set(active.map(service => placeLabel[service.location] || service.location))];
  const modes = [...new Set(active.map(service => availabilityLabel[service.availability_mode] || service.availability_mode))];
  return <View style={{ borderWidth: 1, borderColor: '#e8ddfb', borderRadius: 20, backgroundColor: '#fff', padding: 18, marginTop: 15 }}>
    <View style={{ alignItems: 'center', gap: 12 }}>
      <View style={{ alignSelf: 'stretch' }}><Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>WORK ARRANGEMENT</Text><Heading size={19} style={{ marginTop: 3 }}>Appointment availability</Heading><Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 13, fontWeight: '900', marginTop: 4 }}>{modes.join(' · ')}  •  {locations.join(' / ')}</Text></View>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel="Payment terms" onPress={() => setOpen(value => !value)} style={{ alignSelf: 'center', borderRadius: 15, borderWidth: 1, borderColor: '#d9c7fa', backgroundColor: open ? '#efe5ff' : '#f8f4ff', paddingHorizontal: 20, paddingVertical: 11 }}><Text style={{ color: color.purple, fontFamily: 'Nunito', fontWeight: '900', fontSize: 13 }}>Payment terms {open ? '↑' : '↓'}</Text></Pressable>
    </View>
    {open && <View style={{ marginTop: 17, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee8f5', gap: 13 }}>
      <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 12, lineHeight: 18 }}>These are available ways to price the work. The exact scope, rates and payment schedule are agreed in chat and then recorded in an offer both people approve.</Text>
      {active.map(service => <View key={service.id} style={{ borderRadius: 15, backgroundColor: '#faf8ff', padding: 14 }}>
        <Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 14, fontWeight: '900' }}>{service.title}</Text>
        <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 11, marginTop: 3 }}>{availabilityLabel[service.availability_mode] || service.availability_mode} · {placeLabel[service.location] || service.location}</Text>
        {prices.filter(option => option.service_id === service.id).map(option => <View key={option.id} style={{ marginTop: 11, borderTopWidth: 1, borderTopColor: '#eae3f5', paddingTop: 10 }}><Text style={{ color: color.purple, fontFamily: 'Nunito', fontSize: 13, fontWeight: '900' }}>{modelLabel(option.model)}</Text><Text style={{ color: color.ink, fontFamily: 'Nunito', fontSize: 12, lineHeight: 18, marginTop: 3 }}>{billingExplanation(option)}</Text>{canNegotiate && <Button outline flat onPress={() => onChoose(service, option)} style={{ alignSelf: 'flex-start', minHeight: 34, marginTop: 9, paddingHorizontal: 12 }} textStyle={{ fontSize: 11 }}>Draft these terms →</Button>}</View>)}
        {!prices.some(option => option.service_id === service.id) && <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 12, marginTop: 8 }}>Pricing will be agreed in a proposal.</Text>}
        {isOwner && renderOwnerActions(service)}
      </View>)}
      {!isOwner && <Button flat onPress={onContact} style={{ alignSelf: 'flex-start', minHeight: 40 }} textStyle={{ fontSize: 12 }}>{canNegotiate ? 'Continue the conversation →' : 'Inquire to discuss terms →'}</Button>}
      <Text style={{ color: color.muted, fontFamily: 'Nunito', fontSize: 11 }}>A profile description does not set the bill. Only accepted agreement terms govern billing.</Text>
    </View>}
  </View>;
}
