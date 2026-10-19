export type InboxMessageRow = {
  id: string;
  finder_id: string;
  freelancer_id: string;
  body: string;
  created_at: string;
};

export type ChatInboxEntry = { lastBody: string; lastAt: number; unread: number };

export function summarizeChatInbox(userId: string, rows: InboxMessageRow[], unreadIds: Set<string>): Record<string, ChatInboxEntry> {
  const result: Record<string, ChatInboxEntry> = {};
  for (const row of rows) {
    if (row.finder_id !== userId && row.freelancer_id !== userId) continue;
    const partnerId = row.finder_id === userId ? row.freelancer_id : row.finder_id;
    const entry = result[partnerId] || { lastBody: '', lastAt: 0, unread: 0 };
    const at = new Date(row.created_at).getTime();
    if (at > entry.lastAt) { entry.lastAt = at; entry.lastBody = row.body; }
    if (unreadIds.has(row.id)) entry.unread += 1;
    result[partnerId] = entry;
  }
  return result;
}
