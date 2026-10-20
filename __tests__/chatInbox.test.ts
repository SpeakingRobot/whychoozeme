import { summarizeChatInbox } from '../src/chatInbox';

test('groups unread messages by the other person and keeps the newest preview', () => {
  const rows = [
    { id: '1', finder_id: 'me', freelancer_id: 'ana', sender_id: 'ana', body: 'First', created_at: '2026-10-19T10:00:00Z' },
    { id: '2', finder_id: 'me', freelancer_id: 'ana', sender_id: 'ana', body: 'Latest', created_at: '2026-10-19T10:02:00Z' },
    { id: '3', finder_id: 'tom', freelancer_id: 'me', sender_id: 'tom', body: 'Hello', created_at: '2026-10-19T10:01:00Z' },
    { id: '4', finder_id: 'other', freelancer_id: 'someone', sender_id: 'other', body: 'Private', created_at: '2026-10-19T10:03:00Z' },
  ];
  const result = summarizeChatInbox('me', rows, new Set(['1', '2', '3', '4']));
  expect(result.ana).toMatchObject({ lastBody: 'Latest', unread: 2 });
  expect(result.tom).toMatchObject({ lastBody: 'Hello', unread: 1 });
  expect(result.someone).toBeUndefined();
});

test('counts only incoming messages after the latest reply', () => {
  const rows = [
    { id: 'old', finder_id: 'me', freelancer_id: 'ana', sender_id: 'ana', body: 'Earlier message', created_at: '2026-10-19T10:00:00Z' },
    { id: 'reply', finder_id: 'me', freelancer_id: 'ana', sender_id: 'me', body: 'I replied', created_at: '2026-10-19T10:01:00Z' },
    { id: 'new', finder_id: 'me', freelancer_id: 'ana', sender_id: 'ana', body: 'New message', created_at: '2026-10-19T10:02:00Z' },
  ];
  const result = summarizeChatInbox('me', rows, new Set(['old', 'reply', 'new']));
  expect(result.ana).toMatchObject({ lastBody: 'New message', lastSenderId: 'ana', unread: 1 });
  expect(summarizeChatInbox('ana', rows, new Set(['old', 'reply', 'new'])).me).toMatchObject({ unread: 0 });
});

test('a sent message never makes its own chat unread', () => {
  const rows = [
    { id: 'incoming', finder_id: 'me', freelancer_id: 'ana', sender_id: 'ana', body: 'Hello', created_at: '2026-10-19T10:00:00Z' },
    { id: 'outgoing', finder_id: 'me', freelancer_id: 'ana', sender_id: 'me', body: 'check', created_at: '2026-10-19T10:01:00Z' },
  ];
  expect(summarizeChatInbox('me', rows, new Set(['incoming', 'outgoing'])).ana).toMatchObject({ lastBody: 'check', lastSenderId: 'me', unread: 0 });
});
