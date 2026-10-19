import { summarizeChatInbox } from '../src/chatInbox';

test('groups unread messages by the other person and keeps the newest preview', () => {
  const rows = [
    { id: '1', finder_id: 'me', freelancer_id: 'ana', body: 'First', created_at: '2026-10-19T10:00:00Z' },
    { id: '2', finder_id: 'me', freelancer_id: 'ana', body: 'Latest', created_at: '2026-10-19T10:02:00Z' },
    { id: '3', finder_id: 'tom', freelancer_id: 'me', body: 'Hello', created_at: '2026-10-19T10:01:00Z' },
    { id: '4', finder_id: 'other', freelancer_id: 'someone', body: 'Private', created_at: '2026-10-19T10:03:00Z' },
  ];
  const result = summarizeChatInbox('me', rows, new Set(['1', '2', '3', '4']));
  expect(result.ana).toMatchObject({ lastBody: 'Latest', unread: 2 });
  expect(result.tom).toMatchObject({ lastBody: 'Hello', unread: 1 });
  expect(result.someone).toBeUndefined();
});
