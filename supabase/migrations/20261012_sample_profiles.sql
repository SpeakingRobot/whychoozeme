-- Fictional directory entries for UI review. These are never Auth users and cannot receive messages.
create table if not exists public.sample_freelancers (
  id text primary key check (id ~ '^sample-[a-z0-9-]+$'),
  display_name text not null,
  role_title text not null,
  category_slug text not null,
  tags text[] not null default '{}',
  taluka text not null,
  locality text not null,
  latitude double precision not null,
  longitude double precision not null,
  why_me text not null,
  portfolio text[] not null default '{}',
  card_line text not null,
  image_index integer not null check (image_index between 0 and 7),
  rating numeric(2,1) not null,
  review_count integer not null,
  sort_order integer not null
);
alter table public.sample_freelancers enable row level security;
create policy sample_freelancers_read on public.sample_freelancers
  for select to anon, authenticated using (true);
grant select on public.sample_freelancers to anon, authenticated;

insert into public.sample_freelancers
(id,display_name,role_title,category_slug,tags,taluka,locality,latitude,longitude,why_me,portfolio,card_line,image_index,rating,review_count,sort_order)
values
('sample-tanya','Tanya Rodrigues','Photographer','photography',array['wedding','portrait','event photography'],'Tiswadi','Panaji',15.5001,73.8273,
 'I make real moments feel like memories you can hold. From a quiet proposal to a full family celebration, I bring an easygoing presence and a sharp eye for light.',
 array['Wedding stories','Portrait sessions','Brand shoots'],'Your go-to wedding photographer in Goa 🌴',0,4.9,62,1),
('sample-arjun','Arjun Naik','Video Editor','video',array['reels','film','editing'],'Tiswadi','Panaji',15.5030,73.8310,
 'I turn footage into stories people finish watching. Fast cuts, strong rhythm and a style that feels like you.',
 array['Social reels','Event films','Brand edits'],'I make reels that don’t look boring ⚡',1,4.8,48,2),
('sample-meera','Meera K.','Graphic Designer','design',array['branding','logo','illustration'],'Bardez','Mapusa',15.5910,73.8080,
 'I give small brands a big personality with thoughtful visuals that look joyful and work hard.',
 array['Visual identity','Packaging','Social templates'],'Bold designs for bolder brands 💖',2,4.9,37,3),
('sample-ishaan','Ishaan Pereira','Music Teacher','music',array['guitar','lessons','music'],'Bardez','Calangute',15.5437,73.7553,
 'My lessons are built around the songs you love. We learn technique while making music from day one.',
 array['Beginner guitar','Songwriting','Live music'],'Let’s make music a bigger part of your life 🎵',3,4.7,28,4),
('sample-rohan','Rohan Shetty','Event Planner','events',array['party','wedding','events'],'Mormugao','Vasco',15.3959,73.8113,
 'I know the right people, places and little details that make a Goa celebration feel effortless.',
 array['Beach parties','Weddings','Private events'],'From birthdays to beach parties — I got you! 🎉',4,4.8,40,5),
('sample-diya','Diya Sharma','Makeup Artist','makeup',array['bridal','beauty','makeup'],'Salcete','Margao',15.2832,73.9862,
 'I listen first, then create a look that feels completely yours and lasts through every happy moment.',
 array['Bridal makeup','Editorial looks','Events'],'Soft glam, bold you 💗',5,4.9,52,6),
('sample-neel','Neel Coutinho','Guitar Teacher','music',array['guitar','music','performance'],'Ponda','Ponda',15.4025,74.0118,
 'I make guitar practice feel like a jam session. Start with a chord, leave with a song.',
 array['Acoustic lessons','Group sessions','Performance'],'Learn guitar, meet cool people, vibe together 🎵',6,4.6,24,7),
('sample-sara','Sara Khan','Tutor','tutoring',array['math','science','learning'],'Tiswadi','Panaji',15.4898,73.8220,
 'I explain ideas in a way that clicks, build confidence and make every lesson a little less scary.',
 array['Math tutoring','Science tutoring','Study plans'],'Making tough subjects easy (and actually fun!) 📚',7,4.9,31,8)
on conflict (id) do update set
  display_name=excluded.display_name,role_title=excluded.role_title,category_slug=excluded.category_slug,
  tags=excluded.tags,taluka=excluded.taluka,locality=excluded.locality,latitude=excluded.latitude,
  longitude=excluded.longitude,why_me=excluded.why_me,portfolio=excluded.portfolio,card_line=excluded.card_line,
  image_index=excluded.image_index,rating=excluded.rating,review_count=excluded.review_count,sort_order=excluded.sort_order;
