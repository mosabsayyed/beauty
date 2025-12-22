import { chatService } from './chatService';

describe('chatService.getConversations', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ conversations: [] }) })) as unknown as typeof fetch;
    // Ensure no token stored by default for clarity
    try { localStorage.removeItem('josoor_token'); } catch (e) {}
  });

  afterEach(() => {
    global.fetch = originalFetch;
    try { localStorage.removeItem('josoor_token'); } catch (e) {}
  });

  it('does not include user_id when called without args', async () => {
    await chatService.getConversations();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(typeof calledUrl).toBe('string');
    expect(calledUrl.includes('user_id=')).toBe(false);
  });

  it('includes user_id when provided explicitly', async () => {
    await chatService.getConversations(1, 50);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(typeof calledUrl).toBe('string');
    expect(calledUrl.includes('user_id=1')).toBe(true);
  });

  it('does not add Authorization header when token is not set', async () => {
    // Remove token to simulate guest/no-auth state
    try { localStorage.removeItem('josoor_token'); } catch (e) {}
    await chatService.sendMessage({ query: 'Hello', conversation_id: undefined });
    expect((global.fetch as jest.Mock).mock.calls[0][1]).toBeDefined();
    const options = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(options.headers).toBeDefined();
    expect(options.headers['Authorization']).toBeUndefined();
  });

  it('includes Authorization header when token exists', async () => {
    try { localStorage.setItem('josoor_token', 'test-token'); } catch (e) {}
    await chatService.sendMessage({ query: 'Hello again', conversation_id: undefined });
    const options = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(options.headers['Authorization']).toBe('Bearer test-token');
  });
});
