import { describe, it, expect } from 'vitest';
import {
  createSessionId,
  type SessionId,
  type SessionStatus,
  type SessionInfo,
  type SessionConfig,
  type ContentType,
  type SendMessageRequest,
  type SendMessageOptions,
  type MessageInfo,
  type ChatInfo,
  type ChatUpdate,
  type GroupParticipant,
  type GroupInfo,
  type GroupUpdate,
  type ContactInfo,
  type ContactStatus,
  type WebhookEvent,
  type WebhookPayload,
  type ConnectionUpdateData,
  type MessageUpsertData,
  type PresenceUpdateData,
  type GroupParticipantsUpdateData,
  type ApiResponse,
  type PaginatedResponse,
  isPaginatedResponse,
} from '../src/types/index.js';

describe('Session Types', () => {
  it('creates branded SessionId', () => {
    const id = createSessionId('session-123');
    expect(id).toBe('session-123');
  });

  it('creates valid SessionInfo object', () => {
    const sessionInfo: SessionInfo = {
      id: createSessionId('sess-001'),
      status: 'connected',
      me: {
        id: '1234567890@s.whatsapp.net',
        name: 'Test User',
        number: '1234567890',
      },
    };
    expect(sessionInfo.id).toBe('sess-001');
    expect(sessionInfo.status).toBe('connected');
  });

  it('handles SessionStatus enum values', () => {
    const statuses: SessionStatus[] = [
      'starting',
      'qr_ready',
      'connected',
      'disconnected',
      'terminated',
    ];
    statuses.forEach((status) => {
      const session: SessionInfo = {
        id: createSessionId('test'),
        status,
      };
      expect(session.status).toBe(status);
    });
  });

  it('creates SessionInfo with QR code', () => {
    const session: SessionInfo = {
      id: createSessionId('sess-002'),
      status: 'qr_ready',
      qr: 'data:image/png;base64,iVBORw0KG...',
    };
    expect(session.qr).toBeDefined();
  });

  it('creates SessionConfig with webhook options', () => {
    const config: SessionConfig = {
      webhookUrl: 'https://example.com/webhook',
      webhookEvents: ['messages.upsert', 'connection.update'],
      autoRestart: true,
    };
    expect(config.webhookUrl).toBe('https://example.com/webhook');
    expect(config.webhookEvents).toHaveLength(2);
    expect(config.autoRestart).toBe(true);
  });
});

describe('Message Types', () => {
  it('creates text message request', () => {
    const msg: SendMessageRequest = {
      chatId: '1234567890@s.whatsapp.net',
      contentType: 'text',
      content: { text: 'Hello World' },
    };
    expect(msg.contentType).toBe('text');
  });

  it('handles all ContentType values', () => {
    const types: ContentType[] = [
      'text',
      'image',
      'video',
      'audio',
      'document',
      'location',
      'contact',
      'poll',
      'sticker',
    ];
    types.forEach((type) => {
      const msg: SendMessageRequest = {
        chatId: 'test@s.whatsapp.net',
        contentType: type,
        content: {},
      };
      expect(msg.contentType).toBe(type);
    });
  });

  it('creates message with options', () => {
    const options: SendMessageOptions = {
      quotedMessageId: 'msg-123',
      mentions: ['1234567890@s.whatsapp.net'],
      caption: 'Test image',
      fileName: 'test.pdf',
      mimetype: 'application/pdf',
    };
    expect(options.mentions).toHaveLength(1);
    expect(options.fileName).toBe('test.pdf');
  });

  it('creates MessageInfo for received message', () => {
    const message: MessageInfo = {
      id: 'msg-001',
      chatId: '1234567890@s.whatsapp.net',
      fromId: '9876543210@s.whatsapp.net',
      timestamp: Math.floor(Date.now() / 1000),
      type: 'text',
      body: 'Hello!',
      isFromMe: false,
      hasMedia: false,
      isQuoted: false,
    };
    expect(message.isFromMe).toBe(false);
    expect(message.type).toBe('text');
  });

  it('creates MessageInfo with media', () => {
    const message: MessageInfo = {
      id: 'msg-002',
      chatId: 'group@g.us',
      fromId: '1111111111@s.whatsapp.net',
      timestamp: Math.floor(Date.now() / 1000),
      type: 'image',
      body: 'Check this out',
      media: {
        url: 'https://example.com/image.jpg',
        mimetype: 'image/jpeg',
        size: 1024000,
      },
      hasMedia: true,
      isFromMe: true,
      isQuoted: false,
    };
    expect(message.media?.mimetype).toBe('image/jpeg');
  });

  it('creates MessageInfo with poll', () => {
    const message: MessageInfo = {
      id: 'msg-003',
      chatId: '1234567890@s.whatsapp.net',
      fromId: '9876543210@s.whatsapp.net',
      timestamp: Math.floor(Date.now() / 1000),
      type: 'poll',
      poll: {
        name: 'What is your favorite color?',
        options: [
          { name: 'Red', count: 5 },
          { name: 'Blue', count: 8 },
        ],
      },
      isFromMe: false,
      hasMedia: false,
      isQuoted: false,
    };
    expect(message.poll?.options).toHaveLength(2);
  });
});

describe('Chat Types', () => {
  it('creates ChatInfo', () => {
    const chat: ChatInfo = {
      id: '1234567890@s.whatsapp.net',
      name: 'John Doe',
      isGroup: false,
      unreadCount: 3,
      lastMessage: 'See you later!',
    };
    expect(chat.isGroup).toBe(false);
    expect(chat.unreadCount).toBe(3);
  });

  it('creates ChatInfo for group', () => {
    const chat: ChatInfo = {
      id: '120363012345678@g.us',
      name: 'Project Team',
      isGroup: true,
      unreadCount: 0,
      isReadOnly: false,
      isMuted: false,
    };
    expect(chat.isGroup).toBe(true);
  });

  it('creates ChatUpdate for new message', () => {
    const update: ChatUpdate = {
      chatId: '1234567890@s.whatsapp.net',
      type: 'new_message',
      timestamp: Date.now(),
    };
    expect(update.type).toBe('new_message');
  });
});

describe('Group Types', () => {
  it('creates GroupParticipant', () => {
    const participant: GroupParticipant = {
      id: '1234567890@s.whatsapp.net',
      name: 'Alice',
      isAdmin: true,
      joinedAt: Math.floor(Date.now() / 1000),
    };
    expect(participant.isAdmin).toBe(true);
  });

  it('creates GroupInfo', () => {
    const group: GroupInfo = {
      id: '120363012345678@g.us',
      name: 'Development Team',
      description: 'For dev discussions',
      participants: [
        {
          id: '1111111111@s.whatsapp.net',
          name: 'Alice',
          isAdmin: true,
        },
        {
          id: '2222222222@s.whatsapp.net',
          name: 'Bob',
          isAdmin: false,
        },
      ],
      owner: '1111111111@s.whatsapp.net',
      createdAt: Math.floor(Date.now() / 1000),
      participantsCount: 2,
      isAnnounceOnly: false,
    };
    expect(group.participantsCount).toBe(2);
    expect(group.participants).toHaveLength(2);
  });

  it('creates GroupUpdate for participant action', () => {
    const update: GroupUpdate = {
      groupId: '120363012345678@g.us',
      action: 'add',
      actor: '1111111111@s.whatsapp.net',
      targets: ['3333333333@s.whatsapp.net'],
      timestamp: Date.now(),
    };
    expect(update.action).toBe('add');
  });
});

describe('Contact Types', () => {
  it('creates ContactInfo', () => {
    const contact: ContactInfo = {
      id: '1234567890@s.whatsapp.net',
      name: 'Jane Doe',
      number: '1234567890',
      status: 'available',
      statusMessage: 'Working',
    };
    expect(contact.status).toBe('available');
  });

  it('handles ContactStatus values', () => {
    const statuses: ContactStatus[] = [
      'available',
      'away',
      'offline',
      'dnd',
      'unavailable',
    ];
    statuses.forEach((status) => {
      const contact: ContactInfo = { id: 'test@s.whatsapp.net', status };
      expect(contact.status).toBe(status);
    });
  });
});

describe('Webhook Types', () => {
  it('creates webhook payload for connection update', () => {
    const payload: WebhookPayload<ConnectionUpdateData> = {
      sessionId: 'sess-001',
      event: 'connection.update',
      data: {
        connection: 'open',
        isNewLogin: false,
      },
      timestamp: Date.now(),
    };
    expect(payload.event).toBe('connection.update');
    expect(payload.data.connection).toBe('open');
  });

  it('creates webhook payload for message upsert', () => {
    const payload: WebhookPayload<MessageUpsertData> = {
      sessionId: 'sess-001',
      event: 'messages.upsert',
      data: {
        messages: [
          {
            key: {
              remoteJid: '1234567890@s.whatsapp.net',
              id: 'msg-123',
              fromMe: false,
            },
            message: {
              conversation: 'Hello!',
            },
            messageTimestamp: Math.floor(Date.now() / 1000),
          },
        ],
        type: 'notify',
      },
      timestamp: Date.now(),
    };
    expect(payload.event).toBe('messages.upsert');
    expect(payload.data.messages).toHaveLength(1);
  });

  it('creates webhook payload for presence update', () => {
    const payload: WebhookPayload<PresenceUpdateData> = {
      sessionId: 'sess-001',
      event: 'presence.update',
      data: {
        id: '1234567890@s.whatsapp.net',
        presences: {
          'user@s.whatsapp.net': 'available',
        },
      },
      timestamp: Date.now(),
    };
    expect(payload.event).toBe('presence.update');
  });

  it('creates webhook payload for group participants update', () => {
    const payload: WebhookPayload<GroupParticipantsUpdateData> = {
      sessionId: 'sess-001',
      event: 'group-participants.update',
      data: {
        id: '120363012345678@g.us',
        participants: ['1234567890@s.whatsapp.net'],
        action: 'add',
      },
      timestamp: Date.now(),
    };
    expect(payload.event).toBe('group-participants.update');
  });

  it('handles all WebhookEvent types', () => {
    const events: WebhookEvent[] = [
      'connection.update',
      'qr',
      'auth.update',
      'creds.update',
      'messages.upsert',
      'messages.update',
      'messages.delete',
      'messages.reaction',
      'chats.upsert',
      'chats.update',
      'chats.delete',
      'chats.set',
      'contacts.upsert',
      'contacts.update',
      'contacts.set',
      'groups.update',
      'group-participants.update',
      'presence.update',
      'status.set',
      'blocklist.update',
      'call',
      'labels.association',
      'labels.edit',
    ];
    expect(events).toHaveLength(23);
    events.forEach((event) => {
      const payload: WebhookPayload = {
        sessionId: 'test',
        event,
        data: {},
        timestamp: Date.now(),
      };
      expect(payload.event).toBe(event);
    });
  });
});

describe('API Response Types', () => {
  it('creates success ApiResponse', () => {
    const response: ApiResponse<string> = {
      success: true,
      data: 'Operation successful',
    };
    expect(response.success).toBe(true);
    expect(response.data).toBe('Operation successful');
  });

  it('creates error ApiResponse', () => {
    const response: ApiResponse = {
      success: false,
      error: 'Something went wrong',
    };
    expect(response.success).toBe(false);
    expect(response.error).toBe('Something went wrong');
  });

  it('creates PaginatedResponse', () => {
    const response: PaginatedResponse<string[]> = {
      success: true,
      data: ['item1', 'item2', 'item3'],
      pagination: {
        offset: 0,
        limit: 10,
        total: 3,
      },
    };
    expect(response.success).toBe(true);
    expect(response.data).toHaveLength(3);
    expect(response.pagination.total).toBe(3);
  });

  it('type guard isPaginatedResponse works', () => {
    const paginated: PaginatedResponse<number[]> = {
      success: true,
      data: [1, 2, 3],
      pagination: { offset: 0, limit: 10, total: 3 },
    };
    expect(isPaginatedResponse(paginated)).toBe(true);

    const notPaginated: ApiResponse<number[]> = {
      success: true,
      data: [1, 2, 3],
    };
    expect(isPaginatedResponse(notPaginated)).toBe(false);
  });

  it('handles generic ApiResponse with complex types', () => {
    interface User {
      id: string;
      name: string;
    }
    const response: ApiResponse<User> = {
      success: true,
      data: { id: '123', name: 'John' },
    };
    expect(response.data?.id).toBe('123');
  });
});

describe('Type Conformance', () => {
  it('all ContactInfo instances have required id field', () => {
    const contacts: ContactInfo[] = [
      { id: '1111111111@s.whatsapp.net', name: 'Alice' },
      { id: '2222222222@s.whatsapp.net' },
      { id: '3333333333@s.whatsapp.net', number: '3333333333', status: 'available' },
    ];
    contacts.forEach((c) => {
      expect(c.id).toBeDefined();
    });
  });

  it('MessageInfo correctly types optional fields', () => {
    const minimal: MessageInfo = {
      id: 'msg-1',
      chatId: 'chat-1',
      fromId: 'user-1',
      timestamp: 0,
      type: 'text',
      isFromMe: false,
      hasMedia: false,
      isQuoted: false,
    };
    expect(minimal.body).toBeUndefined();
    expect(minimal.media).toBeUndefined();

    const full: MessageInfo = {
      ...minimal,
      body: 'Text content',
      media: { url: 'http://example.com/file' },
    };
    expect(full.body).toBe('Text content');
    expect(full.media?.url).toBe('http://example.com/file');
  });

  it('SessionInfo status is discriminated correctly', () => {
    const qrSession: SessionInfo = {
      id: createSessionId('s1'),
      status: 'qr_ready',
      qr: 'data:...',
    };
    expect(qrSession.status).toBe('qr_ready');

    const connectedSession: SessionInfo = {
      id: createSessionId('s2'),
      status: 'connected',
      me: { id: '1111111111@s.whatsapp.net' },
    };
    expect(connectedSession.status).toBe('connected');
  });
});
