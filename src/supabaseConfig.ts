/** Public project settings only. Never put a service-role key in this app. */
export const supabaseUrl = 'https://aspuzdadkrtwsvihwugv.supabase.co';
export const supabasePublishableKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzcHV6ZGFka3J0d3N2aWh3dWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3OTcxNTQsImV4cCI6MjEwNzM3MzE1NH0.L9YGuUjJFWBetf5zvHbjVEjP2yOD6fgIu2RWNN61Lcc';

// The UI walkthrough is the default while screens and copy are being reviewed.
// Append ?live to the web URL when testing real Supabase account flows.
const livePreview = typeof (globalThis as any).location?.search === 'string' && new URLSearchParams((globalThis as any).location.search).has('live');
export const liveEnabled = Boolean(supabaseUrl && supabasePublishableKey && livePreview);
