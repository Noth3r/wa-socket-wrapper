import { describe, expect, it, vi } from 'vitest';
import { BaileysStore } from '../../src/services/store.js';

type EventHandler = (payload: unknown) => void;

function createMockSocket() {
  const handlers = new Map<string, EventHandler[]>();

  return {
    ev: {
      on: vi.fn((event: string, handler: EventHandler) => {
        const existing = handlers.get(event) ?? [];
        existing.push(handler);
        handlers.set(event, existing);
      }),
      emit(event: string, payload: unknown) {
        for (const handler of handlers.get(event) ?? []) {
          handler(payload);
        }
      },
    },
  };
}

function createMessage(index: number, chatId = '123@s.whatsapp.net') {
  return {
    key: {
      id: `msg-${index}`,
      remoteJid: chatId,
      fromMe: false,
      participant: '987@s.whatsapp.net',
    },
    messageTimestamp: 1000 + index,
    message: {
      conversation: `message-${index}`,
    },
  };
}

describe('BaileysStore', () => {
  it('binds all expected Baileys event listeners', () => {
    const store = new BaileysStore();
    const socket = createMockSocket();

    store.bind(socket as any);

    const calls = (socket.ev.on as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const events = calls.map((call) => call[0]);

    expect(events).toEqual([
      'messaging-history.set',
      'chats.upsert',
      'chats.update',
      'chats.delete',
      'contacts.upsert',
      'contacts.update',
      'messages.upsert',
      'messages.update',
      'messages.delete',
    ]);
  });

  it('populates chats, contacts, and messages from messaging-history.set', () => {
    const store = new BaileysStore();
    const socket = createMockSocket();
    store.bind(socket as any);

    socket.ev.emit('messaging-history.set', {
      chats: [
        {
          id: '123@s.whatsapp.net',
          name: 'Alice',
          unreadCount: 2,
          conversationTimestamp: 1710000100,
        },
      ],
      contacts: [
        {
          id: '123@s.whatsapp.net',
          name: 'Alice Contact',
          imgUrl: 'https://cdn.test/alice.jpg',
        },
      ],
      messages: [
        {
          key: {
            id: 'm-1',
            remoteJid: '123@s.whatsapp.net',
            fromMe: false,
            participant: '123@s.whatsapp.net',
          },
          messageTimestamp: 1710000200,
          message: {
            conversation: 'hello',
          },
        },
      ],
    });

    expect(store.getChatById('123@s.whatsapp.net')).toMatchObject({
      id: '123@s.whatsapp.net',
      name: 'Alice',
      unreadCount: 2,
    });
    expect(store.getContactById('123@s.whatsapp.net')).toMatchObject({
      id: '123@s.whatsapp.net',
      name: 'Alice Contact',
      profilePictureUrl: 'https://cdn.test/alice.jpg',
    });
    expect(store.getMessageById('123@s.whatsapp.net', 'm-1')).toMatchObject({
      id: 'm-1',
      chatId: '123@s.whatsapp.net',
      body: 'hello',
      type: 'text',
    });
  });

  it('returns chats sorted by lastMessageTime descending', () => {
    const store = new BaileysStore();
    const socket = createMockSocket();
    store.bind(socket as any);

    socket.ev.emit('chats.upsert', [
      { id: 'a@s.whatsapp.net', name: 'A', unreadCount: 0, conversationTimestamp: 10 },
      { id: 'b@s.whatsapp.net', name: 'B', unreadCount: 0, conversationTimestamp: 30 },
      { id: 'c@s.whatsapp.net', name: 'C', unreadCount: 0, conversationTimestamp: 20 },
    ]);

    const ids = store.getChats().map((chat) => chat.id);
    expect(ids).toEqual(['b@s.whatsapp.net', 'c@s.whatsapp.net', 'a@s.whatsapp.net']);
  });

  it('enforces 100-message FIFO buffer per chat', () => {
    const store = new BaileysStore();
    const socket = createMockSocket();
    store.bind(socket as any);

    for (let i = 1; i <= 120; i += 1) {
      socket.ev.emit('messages.upsert', {
        messages: [createMessage(i)],
        type: 'notify',
      });
    }

    const messages = store.getMessages('123@s.whatsapp.net');
    expect(messages).toHaveLength(100);
    expect(messages[0]?.id).toBe('msg-21');
    expect(messages[99]?.id).toBe('msg-120');
    expect(store.getMessageById('123@s.whatsapp.net', 'msg-1')).toBeUndefined();
  });

  it('supports getMessages options for newestFirst and limit', () => {
    const store = new BaileysStore();
    const socket = createMockSocket();
    store.bind(socket as any);

    for (let i = 1; i <= 5; i += 1) {
      socket.ev.emit('messages.upsert', {
        messages: [createMessage(i)],
        type: 'append',
      });
    }

    const latestTwo = store.getMessages('123@s.whatsapp.net', { newestFirst: true, limit: 2 });
    const oldestTwo = store.getMessages('123@s.whatsapp.net', { newestFirst: false, limit: 2 });

    expect(latestTwo.map((m) => m.id)).toEqual(['msg-5', 'msg-4']);
    expect(oldestTwo.map((m) => m.id)).toEqual(['msg-4', 'msg-5']);
  });

  it('applies message updates to existing message', () => {
    const store = new BaileysStore();
    const socket = createMockSocket();
    store.bind(socket as any);

    socket.ev.emit('messages.upsert', {
      messages: [createMessage(1)],
      type: 'notify',
    });

    socket.ev.emit('messages.update', [
      {
        key: {
          id: 'msg-1',
          remoteJid: '123@s.whatsapp.net',
          fromMe: false,
        },
        update: {
          message: {
            conversation: 'edited-text',
          },
          messageTimestamp: 5000,
        },
      },
    ]);

    expect(store.getMessageById('123@s.whatsapp.net', 'msg-1')).toMatchObject({
      body: 'edited-text',
      timestamp: 5000,
    });
  });

  it('handles message deletions by keys and chat-all delete', () => {
    const store = new BaileysStore();
    const socket = createMockSocket();
    store.bind(socket as any);

    socket.ev.emit('messages.upsert', {
      messages: [createMessage(1), createMessage(2), createMessage(3)],
      type: 'notify',
    });

    socket.ev.emit('messages.delete', {
      keys: [{ remoteJid: '123@s.whatsapp.net', id: 'msg-2' }],
    });
    expect(store.getMessageById('123@s.whatsapp.net', 'msg-2')).toBeUndefined();

    socket.ev.emit('messages.delete', {
      jid: '123@s.whatsapp.net',
      all: true,
    });
    expect(store.getMessages('123@s.whatsapp.net')).toEqual([]);
  });

  it('removes chat and its messages on chats.delete', () => {
    const store = new BaileysStore();
    const socket = createMockSocket();
    store.bind(socket as any);

    socket.ev.emit('chats.upsert', [
      { id: 'delete-me@s.whatsapp.net', name: 'Delete', unreadCount: 0, conversationTimestamp: 1 },
    ]);
    socket.ev.emit('messages.upsert', {
      messages: [createMessage(1, 'delete-me@s.whatsapp.net')],
      type: 'append',
    });

    socket.ev.emit('chats.delete', ['delete-me@s.whatsapp.net']);

    expect(store.getChatById('delete-me@s.whatsapp.net')).toBeUndefined();
    expect(store.getMessages('delete-me@s.whatsapp.net')).toEqual([]);
  });

  it('clear releases all cached maps', () => {
    const store = new BaileysStore();
    const socket = createMockSocket();
    store.bind(socket as any);

    socket.ev.emit('messaging-history.set', {
      chats: [{ id: 'chat@s.whatsapp.net', name: 'Chat', unreadCount: 0 }],
      contacts: [{ id: 'chat@s.whatsapp.net', name: 'Contact' }],
      messages: [createMessage(1)],
    });

    store.clear();

    expect(store.chats.size).toBe(0);
    expect(store.contacts.size).toBe(0);
    expect(store.messages.size).toBe(0);
  });
});
