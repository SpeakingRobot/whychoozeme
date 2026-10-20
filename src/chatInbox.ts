export type InboxMessageRow = {
  id: string;
  finder_id: string;
  freelancer_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type ChatInboxEntry = { lastBody: string; lastAt: number; lastSenderId: string; unread: number };

export function summarizeChatInbox(userId: string, rows: InboxMessageRow[], unreadIds: Set<string>): Record<string, ChatInboxEntry> {
  const result: Record<string, ChatInboxEntry> = {};
  const latestSent: Record<string, string> = {};
  for (const row of rows) {
    if (row.finder_id !== userId && row.freelancer_id !== userId) continue;
    const partnerId = row.finder_id === userId ? row.freelancer_id : row.finder_id;
    const entry = result[partnerId] || { lastBody: '', lastAt: 0, lastSenderId: '', unread: 0 };
    const at = new Date(row.created_at).getTime();
    if (at > entry.lastAt) { entry.lastAt = at; entry.lastBody = row.body; entry.lastSenderId = row.sender_id; }
    if (row.sender_id === userId && row.created_at > (latestSent[partnerId] || '')) latestSent[partnerId] = row.created_at;
    result[partnerId] = entry;
  }
  for (const row of rows) {
    if (!unreadIds.has(row.id) || row.sender_id === userId) continue;
    if (row.finder_id !== userId && row.freelancer_id !== userId) continue;
    const partnerId = row.finder_id === userId ? row.freelancer_id : row.finder_id;
    if (row.created_at > (latestSent[partnerId] || '')) result[partnerId].unread += 1;
  }
  return result;
}
