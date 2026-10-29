-- Allow the new built-in static and animated frames. Existing RLS still requires
-- a Premium entitlement for every preset outside the five free options.
alter table public.profile_frame_selections
  drop constraint if exists profile_frame_selections_preset_check;
alter table public.profile_frame_selections
  add constraint profile_frame_selections_preset_check
  check (preset in (
    'classic', 'violet', 'sunset', 'royal', 'mint',
    'aurora', 'champagne', 'cosmic', 'flame',
    'pearl', 'sapphire', 'emerald', 'rose-gold',
    'orbit-glow', 'golden-shimmer', 'violet-pulse', 'rainbow-shift', 'star-sparkle'
  ));
