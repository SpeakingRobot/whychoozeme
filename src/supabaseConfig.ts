/** Public project settings only. Never put a service-role key in this app. */
import { isAdminRoute } from './adminRoute';
export const supabaseUrl = 'https://aspuzdadkrtwsvihwugv.supabase.co';
export const supabasePublishableKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzcHV6ZGFka3J0d3N2aWh3dWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3OTcxNTQsImV4cCI6MjEwNzM3MzE1NH0.L9YGuUjJFWBetf5zvHbjVEjP2yOD6fgIu2RWNN61Lcc';

// The browser reads the linked project by default. ?demo retains the local walkthrough.
const browserSearch = typeof (globalThis as any).location?.search === 'string' ? (globalThis as any).location.search : null;
const localDemo = browserSearch !== null && new URLSearchParams(browserSearch).has('demo');
export const liveEnabled = Boolean(supabaseUrl && supabasePublishableKey && (isAdminRoute || (browserSearch !== null && !localDemo)));
