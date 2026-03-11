import { describe, it, expect } from 'vitest';
import type { WAMessage } from '@whiskeysockets/baileys';
import { normalizeMessagesUpsert } from '../../src/services/message-normalizer.ts';
import type {
  NormalizedMessagesUpsertData,
  NormalizedWebhookMessage,
} from '../../src/types/normalized-message.js';

type TimestampLike = number | bigint | { low: number; high: number; unsigned: boolean; toNumber: () => number };

function createMessage(input: {
  remoteJid: string;
  id: string;
  fromMe?: boolean;
  participant?: string;
  pushName?: string;
  timestamp?: TimestampLike;
  message?: Record<string, unknown>;
}): WAMessage {
  return {
    key: {
      remoteJid: input.remoteJid,
      id: input.id,
      fromMe: input.fromMe ?? false,
      participant: input.participant,
    },
    pushName: input.pushName,
    messageTimestamp: input.timestamp ?? 1710000000,
    message: input.message,
  } as unknown as WAMessage;
}

function expectMessageShape(
  message: NormalizedWebhookMessage,
  expected: {
    id: string;
    chat_id: string;
    from: string;
    from_me: boolean;
    push_name: string | null;
    is_group: boolean;
    timestamp: number;
    type: NormalizedWebhookMessage['type'];
    body: string | null;
    has_media: boolean;
    raw_message: unknown;
    extra_data?: Partial<NormalizedWebhookMessage['extra_data']>;
  },
): void {
  expect(message.id).toBe(expected.id);
  expect(message.chat_id).toBe(expected.chat_id);
  expect(message.from).toBe(expected.from);
  expect(message.from_me).toBe(expected.from_me);
  expect(message.push_name).toBe(expected.push_name);
  expect(message.is_group).toBe(expected.is_group);
  expect(message.timestamp).toBe(expected.timestamp);
  expect(message.type).toBe(expected.type);
  expect(message.body).toBe(expected.body);
  expect(message.has_media).toBe(expected.has_media);
  expect(message.raw_message).toBe(expected.raw_message);

  expect(message.extra_data.is_forwarded).toBe(expected.extra_data?.is_forwarded ?? false);
  expect(message.extra_data.forwarding_score).toBe(expected.extra_data?.forwarding_score ?? 0);
  expect(message.extra_data.replied_to_message_id).toBe(expected.extra_data?.replied_to_message_id ?? null);
  expect(message.extra_data.mentions).toEqual(expected.extra_data?.mentions ?? []);

  if (expected.extra_data?.quoted_message === undefined) {
    expect(message.extra_data.quoted_message).toBeNull();
  }
}

describe('normalizeMessagesUpsert (TDD RED phase)', () => {
  it('normalizes simple text message from conversation field', () => {
    const waMessage = createMessage({
      remoteJid: '6281234@s.whatsapp.net',
      id: 'MSG1',
      fromMe: false,
      pushName: 'Test User',
      timestamp: 1710000000,
      message: { conversation: 'Hello world' },
    });

    const result: NormalizedMessagesUpsertData = normalizeMessagesUpsert({ messages: [waMessage], type: 'notify' });
    expect(result.type).toBe('notify');
    expect(result.messages).toHaveLength(1);
    expectMessageShape(result.messages[0], {
      id: 'MSG1',
      chat_id: '6281234@s.whatsapp.net',
      from: '6281234@s.whatsapp.net',
      from_me: false,
      push_name: 'Test User',
      is_group: false,
      timestamp: 1710000000,
      type: 'text',
      body: 'Hello world',
      has_media: false,
      raw_message: waMessage,
    });
  });

  it('normalizes extended text message', () => {
    const waMessage = createMessage({
      remoteJid: '6281234@s.whatsapp.net',
      id: 'MSG2',
      message: { extendedTextMessage: { text: 'Extended text here' } },
    });

    const result = normalizeMessagesUpsert({ messages: [waMessage], type: 'notify' });
    expectMessageShape(result.messages[0], {
      id: 'MSG2',
      chat_id: '6281234@s.whatsapp.net',
      from: '6281234@s.whatsapp.net',
      from_me: false,
      push_name: null,
      is_group: false,
      timestamp: 1710000000,
      type: 'text',
      body: 'Extended text here',
      has_media: false,
      raw_message: waMessage,
    });
  });

  it('normalizes image message with caption', () => {
    const waMessage = createMessage({
      remoteJid: '6281234@s.whatsapp.net',
      id: 'MSG3',
      message: {
        imageMessage: {
          caption: 'Look at this',
          url: 'https://cdn.example.com/image.jpg',
          mimetype: 'image/jpeg',
        },
      },
    });

    const result = normalizeMessagesUpsert({ messages: [waMessage], type: 'notify' });
    expectMessageShape(result.messages[0], {
      id: 'MSG3',
      chat_id: '6281234@s.whatsapp.net',
      from: '6281234@s.whatsapp.net',
      from_me: false,
      push_name: null,
      is_group: false,
      timestamp: 1710000000,
      type: 'image',
      body: 'Look at this',
      has_media: true,
      raw_message: waMessage,
    });
  });

  it('normalizes image message without caption', () => {
    const waMessage = createMessage({
      remoteJid: '6281234@s.whatsapp.net',
      id: 'MSG4',
      message: {
        imageMessage: {
          url: 'https://cdn.example.com/image.jpg',
          mimetype: 'image/jpeg',
        },
      },
    });

    const result = normalizeMessagesUpsert({ messages: [waMessage], type: 'notify' });
    expectMessageShape(result.messages[0], {
      id: 'MSG4',
      chat_id: '6281234@s.whatsapp.net',
      from: '6281234@s.whatsapp.net',
      from_me: false,
      push_name: null,
      is_group: false,
      timestamp: 1710000000,
      type: 'image',
      body: null,
      has_media: true,
      raw_message: waMessage,
    });
  });

  it('extracts forwarded metadata from contextInfo', () => {
    const waMessage = createMessage({
      remoteJid: '6281234@s.whatsapp.net',
      id: 'MSG5',
      message: {
        extendedTextMessage: {
          text: 'Forwarded',
          contextInfo: {
            isForwarded: true,
            forwardingScore: 1,
          },
        },
      },
    });

    const result = normalizeMessagesUpsert({ messages: [waMessage], type: 'notify' });
    expectMessageShape(result.messages[0], {
      id: 'MSG5',
      chat_id: '6281234@s.whatsapp.net',
      from: '6281234@s.whatsapp.net',
      from_me: false,
      push_name: null,
      is_group: false,
      timestamp: 1710000000,
      type: 'text',
      body: 'Forwarded',
      has_media: false,
      raw_message: waMessage,
      extra_data: {
        is_forwarded: true,
        forwarding_score: 1,
      },
    });
  });

  it('extracts reply metadata and normalized quoted message', () => {
    const waMessage = createMessage({
      remoteJid: '6281234@s.whatsapp.net',
      id: 'MSG6',
      message: {
        extendedTextMessage: {
          text: 'Reply text',
          contextInfo: {
            stanzaId: 'QUOTED_MSG_ID',
            quotedMessage: {
              conversation: 'Original message',
            },
          },
        },
      },
    });

    const result = normalizeMessagesUpsert({ messages: [waMessage], type: 'notify' });
    const normalized = result.messages[0];

    expectMessageShape(normalized, {
      id: 'MSG6',
      chat_id: '6281234@s.whatsapp.net',
      from: '6281234@s.whatsapp.net',
      from_me: false,
      push_name: null,
      is_group: false,
      timestamp: 1710000000,
      type: 'text',
      body: 'Reply text',
      has_media: false,
      raw_message: waMessage,
      extra_data: {
        replied_to_message_id: 'QUOTED_MSG_ID',
      },
    });

    expect(normalized.extra_data.quoted_message).not.toBeNull();
    expect(normalized.extra_data.quoted_message?.body).toBe('Original message');
  });

  it('maps group message sender from key.participant', () => {
    const waMessage = createMessage({
      remoteJid: '120363@g.us',
      id: 'MSG7',
      participant: '6281234@s.whatsapp.net',
      message: { conversation: 'Group message' },
    });

    const result = normalizeMessagesUpsert({ messages: [waMessage], type: 'notify' });
    expectMessageShape(result.messages[0], {
      id: 'MSG7',
      chat_id: '120363@g.us',
      from: '6281234@s.whatsapp.net',
      from_me: false,
      push_name: null,
      is_group: true,
      timestamp: 1710000000,
      type: 'text',
      body: 'Group message',
      has_media: false,
      raw_message: waMessage,
    });
  });

  it('maps DM sender from key.remoteJid when participant is absent', () => {
    const waMessage = createMessage({
      remoteJid: '6281234@s.whatsapp.net',
      id: 'MSG8',
      message: { conversation: 'DM message' },
    });

    const result = normalizeMessagesUpsert({ messages: [waMessage], type: 'notify' });
    expectMessageShape(result.messages[0], {
      id: 'MSG8',
      chat_id: '6281234@s.whatsapp.net',
      from: '6281234@s.whatsapp.net',
      from_me: false,
      push_name: null,
      is_group: false,
      timestamp: 1710000000,
      type: 'text',
      body: 'DM message',
      has_media: false,
      raw_message: waMessage,
    });
  });

  it('extracts mentions from contextInfo.mentionedJid', () => {
    const waMessage = createMessage({
      remoteJid: '6281234@s.whatsapp.net',
      id: 'MSG9',
      message: {
        extendedTextMessage: {
          text: '@user1 @user2 hello',
          contextInfo: {
            mentionedJid: ['6281111@s.whatsapp.net', '6282222@s.whatsapp.net'],
          },
        },
      },
    });

    const result = normalizeMessagesUpsert({ messages: [waMessage], type: 'notify' });
    expectMessageShape(result.messages[0], {
      id: 'MSG9',
      chat_id: '6281234@s.whatsapp.net',
      from: '6281234@s.whatsapp.net',
      from_me: false,
      push_name: null,
      is_group: false,
      timestamp: 1710000000,
      type: 'text',
      body: '@user1 @user2 hello',
      has_media: false,
      raw_message: waMessage,
      extra_data: {
        mentions: ['6281111@s.whatsapp.net', '6282222@s.whatsapp.net'],
      },
    });
  });

  it('unwraps ephemeralMessage before normalization', () => {
    const waMessage = createMessage({
      remoteJid: '6281234@s.whatsapp.net',
      id: 'MSG10',
      message: {
        ephemeralMessage: {
          message: {
            conversation: 'Disappearing message',
          },
        },
      },
    });

    const result = normalizeMessagesUpsert({ messages: [waMessage], type: 'notify' });
    expectMessageShape(result.messages[0], {
      id: 'MSG10',
      chat_id: '6281234@s.whatsapp.net',
      from: '6281234@s.whatsapp.net',
      from_me: false,
      push_name: null,
      is_group: false,
      timestamp: 1710000000,
      type: 'text',
      body: 'Disappearing message',
      has_media: false,
      raw_message: waMessage,
    });
  });

  it('handles protocol/reaction-only message without crashing', () => {
    const waMessage = createMessage({
      remoteJid: '6281234@s.whatsapp.net',
      id: 'MSG11',
      message: {
        reactionMessage: {
          key: {
            remoteJid: '6281234@s.whatsapp.net',
            id: 'ORIGINAL',
            fromMe: false,
          },
          text: '👍',
        },
      },
    });

    const result = normalizeMessagesUpsert({ messages: [waMessage], type: 'notify' });
    expectMessageShape(result.messages[0], {
      id: 'MSG11',
      chat_id: '6281234@s.whatsapp.net',
      from: '6281234@s.whatsapp.net',
      from_me: false,
      push_name: null,
      is_group: false,
      timestamp: 1710000000,
      type: 'text',
      body: null,
      has_media: false,
      raw_message: waMessage,
    });
  });

  it('caps quoted message recursion depth at one level', () => {
    const waMessage = createMessage({
      remoteJid: '6281234@s.whatsapp.net',
      id: 'MSG12',
      message: {
        extendedTextMessage: {
          text: 'Reply',
          contextInfo: {
            quotedMessage: {
              extendedTextMessage: {
                text: 'Original',
                contextInfo: {
                  quotedMessage: {
                    conversation: 'Should NOT appear',
                  },
                },
              },
            },
          },
        },
      },
    });

    const result = normalizeMessagesUpsert({ messages: [waMessage], type: 'notify' });
    const normalized = result.messages[0];

    expectMessageShape(normalized, {
      id: 'MSG12',
      chat_id: '6281234@s.whatsapp.net',
      from: '6281234@s.whatsapp.net',
      from_me: false,
      push_name: null,
      is_group: false,
      timestamp: 1710000000,
      type: 'text',
      body: 'Reply',
      has_media: false,
      raw_message: waMessage,
    });

    expect(normalized.extra_data.quoted_message).not.toBeNull();
    expect(normalized.extra_data.quoted_message?.body).toBe('Original');
    expect(normalized.extra_data.quoted_message?.extra_data.quoted_message).toBeNull();
  });

  it('preserves original raw WAMessage object in raw_message', () => {
    const waMessage = createMessage({
      remoteJid: '6281234@s.whatsapp.net',
      id: 'MSG13',
      pushName: 'Raw Keeper',
      message: { conversation: 'Raw preserved' },
    });

    const result = normalizeMessagesUpsert({ messages: [waMessage], type: 'notify' });
    expectMessageShape(result.messages[0], {
      id: 'MSG13',
      chat_id: '6281234@s.whatsapp.net',
      from: '6281234@s.whatsapp.net',
      from_me: false,
      push_name: 'Raw Keeper',
      is_group: false,
      timestamp: 1710000000,
      type: 'text',
      body: 'Raw preserved',
      has_media: false,
      raw_message: waMessage,
    });
    expect(result.messages[0].raw_message).toStrictEqual(waMessage);
  });

  it('converts Long-like and BigInt timestamps into numbers', () => {
    const longTimestamp = {
      low: 1234,
      high: 0,
      unsigned: false,
      toNumber: () => 1710001111,
    };

    const longMessage = createMessage({
      remoteJid: '6281234@s.whatsapp.net',
      id: 'MSG14A',
      timestamp: longTimestamp,
      message: { conversation: 'Long timestamp' },
    });

    const bigIntMessage = createMessage({
      remoteJid: '6281234@s.whatsapp.net',
      id: 'MSG14B',
      timestamp: BigInt('1710002222'),
      message: { conversation: 'BigInt timestamp' },
    });

    const result = normalizeMessagesUpsert({ messages: [longMessage, bigIntMessage], type: 'notify' });

    expectMessageShape(result.messages[0], {
      id: 'MSG14A',
      chat_id: '6281234@s.whatsapp.net',
      from: '6281234@s.whatsapp.net',
      from_me: false,
      push_name: null,
      is_group: false,
      timestamp: 1710001111,
      type: 'text',
      body: 'Long timestamp',
      has_media: false,
      raw_message: longMessage,
    });

    expectMessageShape(result.messages[1], {
      id: 'MSG14B',
      chat_id: '6281234@s.whatsapp.net',
      from: '6281234@s.whatsapp.net',
      from_me: false,
      push_name: null,
      is_group: false,
      timestamp: 1710002222,
      type: 'text',
      body: 'BigInt timestamp',
      has_media: false,
      raw_message: bigIntMessage,
    });
  });

  it('normalizes multiple messages in one upsert payload', () => {
    const first = createMessage({
      remoteJid: '6281234@s.whatsapp.net',
      id: 'MSG15A',
      message: { conversation: 'Msg 1' },
    });
    const second = createMessage({
      remoteJid: '6285678@s.whatsapp.net',
      id: 'MSG15B',
      message: { conversation: 'Msg 2' },
    });

    const result = normalizeMessagesUpsert({ messages: [first, second], type: 'notify' });
    expect(result.messages).toHaveLength(2);

    expectMessageShape(result.messages[0], {
      id: 'MSG15A',
      chat_id: '6281234@s.whatsapp.net',
      from: '6281234@s.whatsapp.net',
      from_me: false,
      push_name: null,
      is_group: false,
      timestamp: 1710000000,
      type: 'text',
      body: 'Msg 1',
      has_media: false,
      raw_message: first,
    });

    expectMessageShape(result.messages[1], {
      id: 'MSG15B',
      chat_id: '6285678@s.whatsapp.net',
      from: '6285678@s.whatsapp.net',
      from_me: false,
      push_name: null,
      is_group: false,
      timestamp: 1710000000,
      type: 'text',
      body: 'Msg 2',
      has_media: false,
      raw_message: second,
    });
  });

  it('sets from_me=true when key.fromMe is true', () => {
    const waMessage = createMessage({
      remoteJid: '6281234@s.whatsapp.net',
      id: 'MSG16',
      fromMe: true,
      message: { conversation: 'Sent by me' },
    });

    const result = normalizeMessagesUpsert({ messages: [waMessage], type: 'notify' });
    expectMessageShape(result.messages[0], {
      id: 'MSG16',
      chat_id: '6281234@s.whatsapp.net',
      from: '6281234@s.whatsapp.net',
      from_me: true,
      push_name: null,
      is_group: false,
      timestamp: 1710000000,
      type: 'text',
      body: 'Sent by me',
      has_media: false,
      raw_message: waMessage,
    });
  });

  it('handles status@broadcast messages without crashing', () => {
    const waMessage = createMessage({
      remoteJid: 'status@broadcast',
      id: 'STATUS1',
      fromMe: false,
      message: { conversation: 'Status update' },
    });

    const result = normalizeMessagesUpsert({ messages: [waMessage], type: 'notify' });
    expectMessageShape(result.messages[0], {
      id: 'STATUS1',
      chat_id: 'status@broadcast',
      from: 'status@broadcast',
      from_me: false,
      push_name: null,
      is_group: false,
      timestamp: 1710000000,
      type: 'text',
      body: 'Status update',
      has_media: false,
      raw_message: waMessage,
    });
  });

  it('unwraps viewOnceMessage wrapper before normalization', () => {
    const waMessage = createMessage({
      remoteJid: '6281234@s.whatsapp.net',
      id: 'MSG18',
      message: {
        viewOnceMessage: {
          message: {
            extendedTextMessage: {
              text: 'View once text',
            },
          },
        },
      },
    });

    const result = normalizeMessagesUpsert({ messages: [waMessage], type: 'notify' });
    expectMessageShape(result.messages[0], {
      id: 'MSG18',
      chat_id: '6281234@s.whatsapp.net',
      from: '6281234@s.whatsapp.net',
      from_me: false,
      push_name: null,
      is_group: false,
      timestamp: 1710000000,
      type: 'text',
      body: 'View once text',
      has_media: false,
      raw_message: waMessage,
    });
  });

  it('unwraps viewOnceMessageV2 wrapper before normalization', () => {
    const waMessage = createMessage({
      remoteJid: '6281234@s.whatsapp.net',
      id: 'MSG19',
      message: {
        viewOnceMessageV2: {
          message: {
            imageMessage: {
              caption: 'V2 image',
              url: 'https://cdn.example.com/v2.jpg',
              mimetype: 'image/jpeg',
            },
          },
        },
      },
    });

    const result = normalizeMessagesUpsert({ messages: [waMessage], type: 'notify' });
    expectMessageShape(result.messages[0], {
      id: 'MSG19',
      chat_id: '6281234@s.whatsapp.net',
      from: '6281234@s.whatsapp.net',
      from_me: false,
      push_name: null,
      is_group: false,
      timestamp: 1710000000,
      type: 'image',
      body: 'V2 image',
      has_media: true,
      raw_message: waMessage,
    });
  });

  it('unwraps documentWithCaptionMessage wrapper before normalization', () => {
    const waMessage = createMessage({
      remoteJid: '6281234@s.whatsapp.net',
      id: 'MSG20',
      message: {
        documentWithCaptionMessage: {
          message: {
            documentMessage: {
              caption: 'Quarterly Report',
              fileName: 'report.pdf',
              mimetype: 'application/pdf',
            },
          },
        },
      },
    });

    const result = normalizeMessagesUpsert({ messages: [waMessage], type: 'notify' });
    expectMessageShape(result.messages[0], {
      id: 'MSG20',
      chat_id: '6281234@s.whatsapp.net',
      from: '6281234@s.whatsapp.net',
      from_me: false,
      push_name: null,
      is_group: false,
      timestamp: 1710000000,
      type: 'document',
      body: 'Quarterly Report',
      has_media: true,
      raw_message: waMessage,
    });
  });

  it('extracts contextInfo from all supported message types', () => {
    const baseContext = {
      isForwarded: true,
      forwardingScore: 7,
      stanzaId: 'QUOTED-FROM-CONTEXT',
      mentionedJid: ['6280001@s.whatsapp.net'],
      quotedMessage: { conversation: 'Quoted from context type' },
    };

    const messages: WAMessage[] = [
      createMessage({
        remoteJid: '6281000@s.whatsapp.net',
        id: 'CTX1',
        message: { extendedTextMessage: { text: 'extended', contextInfo: baseContext } },
      }),
      createMessage({
        remoteJid: '6281001@s.whatsapp.net',
        id: 'CTX2',
        message: {
          imageMessage: {
            caption: 'image',
            url: 'https://cdn.example.com/ctx-image.jpg',
            mimetype: 'image/jpeg',
            contextInfo: baseContext,
          },
        },
      }),
      createMessage({
        remoteJid: '6281002@s.whatsapp.net',
        id: 'CTX3',
        message: {
          videoMessage: {
            caption: 'video',
            url: 'https://cdn.example.com/ctx-video.mp4',
            mimetype: 'video/mp4',
            contextInfo: baseContext,
          },
        },
      }),
      createMessage({
        remoteJid: '6281003@s.whatsapp.net',
        id: 'CTX4',
        message: {
          audioMessage: {
            url: 'https://cdn.example.com/ctx-audio.ogg',
            mimetype: 'audio/ogg',
            contextInfo: baseContext,
          },
        },
      }),
      createMessage({
        remoteJid: '6281004@s.whatsapp.net',
        id: 'CTX5',
        message: {
          documentMessage: {
            caption: 'document',
            fileName: 'ctx.pdf',
            mimetype: 'application/pdf',
            contextInfo: baseContext,
          },
        },
      }),
      createMessage({
        remoteJid: '6281005@s.whatsapp.net',
        id: 'CTX6',
        message: {
          stickerMessage: {
            url: 'https://cdn.example.com/ctx.webp',
            mimetype: 'image/webp',
            contextInfo: baseContext,
          },
        },
      }),
      createMessage({
        remoteJid: '6281006@s.whatsapp.net',
        id: 'CTX7',
        message: {
          contactMessage: {
            displayName: 'Context Contact',
            vcard: 'BEGIN:VCARD\nFN:Context Contact\nEND:VCARD',
            contextInfo: baseContext,
          },
        },
      }),
    ];

    const result = normalizeMessagesUpsert({ messages, type: 'notify' });
    expect(result.messages).toHaveLength(7);

    for (const normalized of result.messages) {
      expect(normalized.extra_data.is_forwarded).toBe(true);
      expect(normalized.extra_data.forwarding_score).toBe(7);
      expect(normalized.extra_data.replied_to_message_id).toBe('QUOTED-FROM-CONTEXT');
      expect(normalized.extra_data.mentions).toEqual(['6280001@s.whatsapp.net']);
      expect(normalized.extra_data.quoted_message).not.toBeNull();
      expect(normalized.raw_message).toBeDefined();
      expect(typeof normalized.timestamp).toBe('number');
    }
  });
});
