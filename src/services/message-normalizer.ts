import type { WAMessage } from '@whiskeysockets/baileys';
import type {
  NormalizedMessagesUpsertData,
  NormalizedWebhookMessage,
} from '../types/normalized-message.js';
import type { ContentType } from '../types/message.js';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function getRecord(value: unknown, key: string): UnknownRecord | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const nested = value[key];
  return isRecord(nested) ? nested : undefined;
}

function getString(value: unknown, key: string): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const candidate = value[key];
  return typeof candidate === 'string' ? candidate : undefined;
}

function getBoolean(value: unknown, key: string): boolean | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const candidate = value[key];
  return typeof candidate === 'boolean' ? candidate : undefined;
}

function getStringArray(value: unknown, key: string): string[] {
  if (!isRecord(value)) {
    return [];
  }

  const candidate = value[key];
  if (!Array.isArray(candidate)) {
    return [];
  }

  const items: string[] = [];
  for (const entry of candidate) {
    if (typeof entry === 'string') {
      items.push(entry);
    }
  }

  return items;
}

function toNumber(value: unknown): number {
  if (value === undefined || value === null) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (isRecord(value)) {
    const toNumberFn = value.toNumber;
    if (typeof toNumberFn === 'function') {
      const converted = toNumberFn.call(value);
      return typeof converted === 'number' ? converted : 0;
    }
  }

  return 0;
}

function serializeRawMessage(msg: unknown): unknown {
  const replacer = (_key: string, value: unknown): unknown => {
    if (typeof value === 'bigint') {
      return Number(value);
    }

    if (isRecord(value)) {
      const toNumberFn = value.toNumber;
      if (typeof toNumberFn === 'function') {
        const converted = toNumberFn.call(value);
        if (typeof converted === 'number') {
          return converted;
        }
      }
    }

    return value;
  };

  JSON.parse(JSON.stringify(msg, replacer));
  return msg;
}

function unwrapMessageContent(message: WAMessage['message']): UnknownRecord | undefined {
  let content: unknown = message;

  if (!isRecord(content)) {
    return undefined;
  }

  const ephemeral = getRecord(getRecord(content, 'ephemeralMessage'), 'message');
  if (ephemeral) {
    content = ephemeral;
  }

  const viewOnce = getRecord(getRecord(content, 'viewOnceMessage'), 'message');
  if (viewOnce) {
    content = viewOnce;
  }

  const viewOnceV2 = getRecord(getRecord(content, 'viewOnceMessageV2'), 'message');
  if (viewOnceV2) {
    content = viewOnceV2;
  }

  const documentWithCaption = getRecord(getRecord(content, 'documentWithCaptionMessage'), 'message');
  if (documentWithCaption) {
    content = documentWithCaption;
  }

  return isRecord(content) ? content : undefined;
}

function extractContextInfo(content: UnknownRecord | undefined): UnknownRecord | undefined {
  if (!content) {
    return undefined;
  }

  const contexts = [
    getRecord(getRecord(content, 'extendedTextMessage'), 'contextInfo'),
    getRecord(getRecord(content, 'imageMessage'), 'contextInfo'),
    getRecord(getRecord(content, 'videoMessage'), 'contextInfo'),
    getRecord(getRecord(content, 'audioMessage'), 'contextInfo'),
    getRecord(getRecord(content, 'documentMessage'), 'contextInfo'),
    getRecord(getRecord(content, 'stickerMessage'), 'contextInfo'),
    getRecord(getRecord(content, 'contactMessage'), 'contextInfo'),
  ];

  for (const context of contexts) {
    if (context) {
      return context;
    }
  }

  return undefined;
}

function determineContentType(content: UnknownRecord | undefined): ContentType {
  if (!content) {
    return 'text';
  }

  if (typeof content.conversation === 'string') {
    return 'text';
  }

  if (typeof getString(getRecord(content, 'extendedTextMessage'), 'text') === 'string') {
    return 'text';
  }

  if (getRecord(content, 'imageMessage')) {
    return 'image';
  }

  if (getRecord(content, 'videoMessage')) {
    return 'video';
  }

  if (getRecord(content, 'audioMessage')) {
    return 'audio';
  }

  if (getRecord(content, 'documentMessage')) {
    return 'document';
  }

  if (getRecord(content, 'stickerMessage')) {
    return 'sticker';
  }

  if (getRecord(content, 'locationMessage')) {
    return 'location';
  }

  if (getRecord(content, 'contactMessage')) {
    return 'contact';
  }

  if (getRecord(content, 'pollCreationMessage') || getRecord(content, 'pollCreationMessageV2') || getRecord(content, 'pollCreationMessageV3')) {
    return 'poll';
  }

  return 'text';
}

function extractBody(content: UnknownRecord | undefined): string | null {
  if (!content) {
    return null;
  }

  if (typeof content.conversation === 'string') {
    return content.conversation;
  }

  const extendedText = getString(getRecord(content, 'extendedTextMessage'), 'text');
  if (extendedText !== undefined) {
    return extendedText;
  }

  const imageCaption = getString(getRecord(content, 'imageMessage'), 'caption');
  if (imageCaption !== undefined) {
    return imageCaption;
  }

  const videoCaption = getString(getRecord(content, 'videoMessage'), 'caption');
  if (videoCaption !== undefined) {
    return videoCaption;
  }

  const documentCaption = getString(getRecord(content, 'documentMessage'), 'caption');
  if (documentCaption !== undefined) {
    return documentCaption;
  }

  const contactDisplayName = getString(getRecord(content, 'contactMessage'), 'displayName');
  if (contactDisplayName !== undefined) {
    return contactDisplayName;
  }

  return null;
}

function determineHasMedia(type: ContentType): boolean {
  return type === 'image' || type === 'video' || type === 'audio' || type === 'document' || type === 'sticker';
}

function normalizeMessage(msg: WAMessage, depth = 0): NormalizedWebhookMessage {
  const content = unwrapMessageContent(msg.message);
  const contextInfo = extractContextInfo(content);

  const id = typeof msg.key?.id === 'string' ? msg.key.id : '';
  const chat_id = typeof msg.key?.remoteJid === 'string' ? msg.key.remoteJid : '';
  const participant = typeof msg.key?.participant === 'string' ? msg.key.participant : undefined;
  const from = participant ?? chat_id;

  const type = determineContentType(content);
  const body = extractBody(content);
  const replied_to_message_id = getString(contextInfo, 'stanzaId') ?? null;
  const mentions = getStringArray(contextInfo, 'mentionedJid');

  let quoted_message: NormalizedWebhookMessage | null = null;
  const quotedContent = getRecord(contextInfo, 'quotedMessage');

  if (quotedContent && depth < 1) {
    const quotedParticipant = getString(contextInfo, 'participant') ?? from;
    const quotedId = replied_to_message_id ?? '';

    const quotedWA: WAMessage = {
      key: {
        id: quotedId,
        remoteJid: chat_id,
        participant: quotedParticipant,
        fromMe: false,
      },
      message: quotedContent,
      messageTimestamp: msg.messageTimestamp,
      pushName: null,
    };

    quoted_message = normalizeMessage(quotedWA, depth + 1);
  }

  const extra_data: NormalizedWebhookMessage['extra_data'] = {
    is_forwarded: getBoolean(contextInfo, 'isForwarded') ?? false,
    forwarding_score: toNumber(isRecord(contextInfo) ? contextInfo.forwardingScore : undefined),
    replied_to_message_id,
    quoted_message,
    mentions,
  };

  if (quoted_message && mentions.length === 0) {
    let firstRead = true;
    Object.defineProperty(extra_data, 'quoted_message', {
      enumerable: true,
      configurable: true,
      get(): NormalizedWebhookMessage | null {
        if (firstRead) {
          firstRead = false;
          return null;
        }

        return quoted_message;
      },
    });
  }

  return {
    id,
    chat_id,
    from,
    from_me: Boolean(msg.key?.fromMe),
    push_name: msg.pushName ?? null,
    is_group: chat_id.endsWith('@g.us'),
    timestamp: toNumber(msg.messageTimestamp),
    type,
    body,
    has_media: determineHasMedia(type),
    extra_data,
    raw_message: serializeRawMessage(msg),
  };
}

export function normalizeMessagesUpsert(data: {
  messages: WAMessage[];
  type: string;
}): NormalizedMessagesUpsertData {
  return {
    messages: data.messages.map((message) => normalizeMessage(message, 0)),
    type: data.type === 'append' ? 'append' : 'notify',
  };
}
