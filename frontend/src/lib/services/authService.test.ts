import { persistSession, startGuestSession, saveGuestConversations, getGuestConversations, clearGuestConversations } from './authService';

describe('authService persistSession guest behavior', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does not clear guest keys by default', () => {
    localStorage.setItem('josoor_guest_id', 'guest-123');
    localStorage.setItem('josoor_guest_conversations', JSON.stringify([{ id: -1, messages: [] }]));
    const session = { access_token: 'tok', user: { id: 1 } } as any;
    persistSession(session as any);
    expect(localStorage.getItem('josoor_guest_id')).toBe('guest-123');
    expect(localStorage.getItem('josoor_guest_conversations')).not.toBeNull();
  });

  it('clears guest keys when clearGuest is true', () => {
    localStorage.setItem('josoor_guest_id', 'guest-123');
    localStorage.setItem('josoor_guest_conversations', JSON.stringify([{ id: -1, messages: [] }]));
    const session = { access_token: 'tok', user: { id: 1 } } as any;
    persistSession(session as any, true);
    expect(localStorage.getItem('josoor_guest_id')).toBeNull();
    expect(localStorage.getItem('josoor_guest_conversations')).toBeNull();
  });

  it('clearGuestConversations removes guest keys', () => {
    localStorage.setItem('josoor_guest_id', 'guest-123');
    localStorage.setItem('josoor_guest_conversations', JSON.stringify([{ id: -1, messages: [] }]));
    clearGuestConversations();
    expect(localStorage.getItem('josoor_guest_id')).toBeNull();
    expect(localStorage.getItem('josoor_guest_conversations')).toBeNull();
  });
});
