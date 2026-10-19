import { db } from './liveApi';

export type ServiceListing = {
  id: string;
  freelancer_id: string;
  title: string;
  description: string;
  location: 'remote' | 'hybrid' | 'on_site';
  active: boolean;
  sort_order: number;
};

function client() {
  if (!db) throw new Error('Service listings require the live app.');
  return db;
}

export async function getServices(freelancerId: string): Promise<ServiceListing[]> {
  const { data, error } = await client().from('service_listings')
    .select('id,freelancer_id,title,description,location,active,sort_order')
    .eq('freelancer_id', freelancerId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as ServiceListing[];
}

export async function saveService(ownerId: string, input: { id?: string; title: string; description: string; location: ServiceListing['location']; category: string; sortOrder: number }) {
  const row = {
    ...(input.id ? { id: input.id } : {}),
    freelancer_id: ownerId,
    title: input.title.trim(),
    description: input.description.trim(),
    location: input.location,
    category_slug: input.category,
    sort_order: input.sortOrder,
  };
  const { error } = await client().from('service_listings').upsert(row);
  if (error) throw new Error(error.message);
}

export async function setServiceActive(ownerId: string, id: string, active: boolean) {
  const { error } = await client().from('service_listings').update({ active }).eq('id', id).eq('freelancer_id', ownerId);
  if (error) throw new Error(error.message);
}

export async function reorderServices(ownerId: string, orderedIds: string[]) {
  for (const [sortOrder, id] of orderedIds.entries()) {
    const { error } = await client().from('service_listings').update({ sort_order: sortOrder }).eq('id', id).eq('freelancer_id', ownerId);
    if (error) throw new Error(error.message);
  }
}
