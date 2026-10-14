export const pricingModels = [
  'hourly', 'fixed', 'daily', 'session', 'milestone', 'weekly', 'monthly',
  'recurring', 'dedicated', 'deliverable', 'unit', 'package', 'subscription',
  'commission', 'performance', 'value', 'standby', 'hybrid',
] as const;
export type PricingModel = typeof pricingModels[number];
export type AvailabilityMode = 'exclusive' | 'appointment' | 'capacity' | 'queue' | 'recurring';
export const pricingModelRegistry: Record<PricingModel,{ availability: AvailabilityMode; priceInputs: string[]; completion: string; requiredAgreementTerms: string[] }> = {
  hourly: { availability:'capacity', priceInputs:['rateMinor','weeklyHourCap','totalCapMinor'], completion:'Approved eligible time entries', requiredAgreementTerms:['timesheet review','spending authorization'] },
  fixed: { availability:'capacity', priceInputs:['rateMinor'], completion:'Accepted agreed scope', requiredAgreementTerms:['scope','acceptance criteria'] },
  daily: { availability:'exclusive', priceInputs:['rateMinor','quantity'], completion:'Agreed work days completed', requiredAgreementTerms:['scheduled days','travel and overtime'] },
  session: { availability:'appointment', priceInputs:['rateMinor','quantity'], completion:'Agreed session completed', requiredAgreementTerms:['session duration','rescheduling'] },
  milestone: { availability:'capacity', priceInputs:['milestones'], completion:'Each milestone accepted', requiredAgreementTerms:['milestones','acceptance criteria'] },
  weekly: { availability:'capacity', priceInputs:['rateMinor','quantity'], completion:'Agreed weekly period completed', requiredAgreementTerms:['weekly scope','billing period'] },
  monthly: { availability:'recurring', priceInputs:['rateMinor','quantity'], completion:'Monthly period or allowance completed', requiredAgreementTerms:['allowance','renewal'] },
  recurring: { availability:'recurring', priceInputs:['rateMinor','quantity'], completion:'Scheduled occurrences completed', requiredAgreementTerms:['schedule','exceptions'] },
  dedicated: { availability:'exclusive', priceInputs:['rateMinor','quantity'], completion:'Dedicated period completed', requiredAgreementTerms:['exclusivity','scheduled windows'] },
  deliverable: { availability:'queue', priceInputs:['rateMinor','quantity'], completion:'Deliverables accepted', requiredAgreementTerms:['deliverable specification','revisions'] },
  unit: { availability:'queue', priceInputs:['rateMinor','quantity'], completion:'Units accepted', requiredAgreementTerms:['unit definition','quality criteria'] },
  package: { availability:'queue', priceInputs:['rateMinor'], completion:'Package deliverables accepted', requiredAgreementTerms:['tier contents','revisions'] },
  subscription: { availability:'recurring', priceInputs:['rateMinor','quantity'], completion:'Billing period and allowance reconciled', requiredAgreementTerms:['request allowance','renewal'] },
  commission: { availability:'capacity', priceInputs:['commissionPercent','conditionalBasis'], completion:'Verified commission trigger', requiredAgreementTerms:['attribution','trigger','calculation'] },
  performance: { availability:'capacity', priceInputs:['conditionalBasis'], completion:'Verified performance trigger', requiredAgreementTerms:['metric','evidence','calculation'] },
  value: { availability:'capacity', priceInputs:['conditionalBasis'], completion:'Agreed value trigger', requiredAgreementTerms:['valuation basis','evidence'] },
  standby: { availability:'recurring', priceInputs:['rateMinor','quantity'], completion:'Standby period completed', requiredAgreementTerms:['response time','availability window'] },
  hybrid: { availability:'capacity', priceInputs:['conditionalBasis'], completion:'Each component accepted', requiredAgreementTerms:['component models','calculation','precedence'] },
};

export type MoneyTerms = {
  model: PricingModel;
  currency: string;
  rateMinor?: number;
  quantity?: number;
  estimatedHours?: number;
  weeklyHourCap?: number;
  totalCapMinor?: number;
  commissionPercent?: number;
  conditionalBasis?: string;
  paymentSchedule?: string;
};

export type PriceEstimate = { kind: 'fixed' | 'estimated' | 'cap' | 'recurring' | 'conditional'; amountMinor?: number; explanation: string };
export function estimatePrice(terms: MoneyTerms): PriceEstimate {
  const { model, rateMinor, quantity, estimatedHours, totalCapMinor } = terms;
  if (['commission', 'performance', 'value', 'hybrid'].includes(model))
    return { kind: 'conditional', explanation: 'Payment depends on the explicitly agreed trigger and calculation.' };
  if (model === 'hourly') return { kind: totalCapMinor ? 'cap' : 'estimated', amountMinor: totalCapMinor ?? (rateMinor && estimatedHours ? rateMinor * estimatedHours : undefined), explanation: totalCapMinor ? 'Maximum authorized spend; only approved eligible hours are payable.' : 'Estimate only; eligible approved hours determine the invoice.' };
  if (['weekly', 'monthly', 'subscription', 'recurring', 'standby'].includes(model))
    return { kind: 'recurring', amountMinor: rateMinor, explanation: 'Charge per agreed billing period, subject to the written allowance and terms.' };
  if (['daily', 'session', 'deliverable', 'unit'].includes(model))
    return { kind: 'estimated', amountMinor: rateMinor && quantity ? rateMinor * quantity : undefined, explanation: 'Rate multiplied by agreed units; changes require approval.' };
  return { kind: 'fixed', amountMinor: rateMinor, explanation: 'Fixed agreed amount for the defined scope.' };
}

export type ProposalTerms = MoneyTerms & {
  title: string;
  scope: string;
  deliverables: string[];
  startAt?: string;
  endAt?: string;
  timezone: string;
  location: 'remote' | 'on_site' | 'hybrid';
  availabilityMode: AvailabilityMode;
  weeklyEffortHours?: number;
  revisions?: number;
  milestones?: { title: string; amountMinor?: number; dueAt?: string; acceptanceCriteria: string }[];
  specialConditions?: string;
};

export function validateTerms(t: ProposalTerms): string[] {
  const errors: string[] = [];
  if (t.title.trim().length < 4) errors.push('Add a project title.');
  if (t.scope.trim().length < 10) errors.push('Describe the work in at least 10 characters.');
  if (!/^[A-Z]{3}$/.test(t.currency)) errors.push('Use a three-letter currency code.');
  if (!t.timezone) errors.push('Choose a timezone.');
  if (t.startAt && t.endAt && Date.parse(t.startAt) >= Date.parse(t.endAt)) errors.push('The end must follow the start.');
  if (['exclusive', 'appointment'].includes(t.availabilityMode) && (!t.startAt || !t.endAt)) errors.push('Reserved work requires exact start and end times.');
  if (t.model === 'hourly' && (!t.rateMinor || !t.totalCapMinor || !t.weeklyHourCap)) errors.push('Hourly work needs a rate, weekly hour cap, and total budget cap.');
  if (['commission', 'performance', 'value', 'hybrid'].includes(t.model) && !t.conditionalBasis?.trim()) errors.push('Describe the payment trigger and calculation.');
  if (t.rateMinor !== undefined && (!Number.isSafeInteger(t.rateMinor) || t.rateMinor < 0)) errors.push('Enter a valid nonnegative rate.');
  return errors;
}

export function weeklyCapacityRemaining(capacity: number, allocations: number[]): number {
  return Math.max(0, capacity - allocations.reduce((sum, hours) => sum + hours, 0));
}
export function billableMinor(rateMinor: number, approvedMinutes: number, capMinor: number): number {
  return Math.min(capMinor, Math.floor(rateMinor * approvedMinutes / 60));
}
export function intervalsOverlap(a: { startAt: string; endAt: string }, b: { startAt: string; endAt: string }): boolean {
  return Date.parse(a.startAt) < Date.parse(b.endAt) && Date.parse(b.startAt) < Date.parse(a.endAt);
}
