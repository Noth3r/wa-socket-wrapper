import type { Chat, ChatUpdate, Contact, WAMessage, WAMessageUpdate, WASocket } from '@whiskeysockets/baileys';
import type { ChatInfo } from '../types/chat.js';
import type { ContactInfo, ContactStatus } from '../types/contact.js';
import type { ContentType, MessageInfo } from '../types/message.js';

type MessagingHistorySetEvent = {
  chats: Chat[];
  contacts: Contact[];
  messages: WAMessage[];
};

type MessagesDeleteEvent =
  | {
      keys: Array<{ remoteJid?: string | null; id?: string | null }>;
    }
  | {
      jid: string;
      all: true;
    };

export type GetMessagesOptions = {
  limit?: number;
  newestFirst?: boolean;
};

const MAX_MESSAGES_PER_CHAT = 100;

export class BaileysStore {
  readonly chats = new Map<string, ChatInfo>();
  readonly contacts = new Map<string, ContactInfo>();
  readonly messages = new Map<string, Map<string, MessageInfo>>();

  bind(socket: WASocket): void {
    socket.ev.on('messaging-history.set', (payload) => {
      this.handleMessagingHistorySet(payload as MessagingHistorySetEvent);
    });

    socket.ev.on('chats.upsert', (payload) => {
      this.handleChatsUpsert(payload as Chat[]);
    });

    socket.ev.on('chats.update', (payload) => {
      this.handleChatsUpdate(payload as ChatUpdate[]);
    });

    socket.ev.on('chats.delete', (payload) => {
      this.handleChatsDelete(payload as string[]);
    });

    socket.ev.on('contacts.upsert', (payload) => {
      this.handleContactsUpsert(payload as Contact[]);
    });

    socket.ev.on('contacts.update', (payload) => {
      this.handleContactsUpdate(payload as Partial<Contact>[]);
    });

    socket.ev.on('messages.upsert', (payload) => {
      const messages = (payload as { messages?: WAMessage[] })?.messages ?? [];
      this.handleMessagesUpsert(messages);
    });

    socket.ev.on('messages.update', (payload) => {
      this.handleMessagesUpdate(payload as WAMessageUpdate[]);
    });

    socket.ev.on('messages.delete', (payload) => {
      this.handleMessagesDelete(payload as MessagesDeleteEvent);
    });
  }

  getChats(): ChatInfo[] {
    return [...this.chats.values()].sort((a, b) => (b.lastMessageTime ?? 0) - (a.lastMessageTime ?? 0));
  }

  getChatById(jid: string): ChatInfo | undefined {
    return this.chats.get(jid);
  }

  getContacts(): ContactInfo[] {
    return [...this.contacts.values()];
  }

  getContactById(jid: string): ContactInfo | undefined {
    return this.contacts.get(jid);
  }

  getMessages(jid: string, options: GetMessagesOptions = {}): MessageInfo[] {
    const collection = this.messages.get(jid);
    if (!collection) {
      return [];
    }

    const newestFirst = options.newestFirst ?? false;
    let result = [...collection.values()];

    if (newestFirst) {
      result = result.reverse();
    }

    if (typeof options.limit === 'number' && options.limit > 0) {
      result = newestFirst ? result.slice(0, options.limit) : result.slice(-options.limit);
    }

    return result;
  }

  getMessageById(jid: string, msgId: string): MessageInfo | undefined {
    return this.messages.get(jid)?.get(msgId);
  }

  clear(): void {
    this.chats.clear();
    this.contacts.clear();
    this.messages.clear();
  }

  private handleMessagingHistorySet(payload: MessagingHistorySetEvent): void {
    this.handleChatsUpsert(payload.chats ?? []);
    this.handleContactsUpsert(payload.contacts ?? []);
    this.handleMessagesUpsert(payload.messages ?? []);
  }

  private handleChatsUpsert(chats: Chat[]): void {
    for (const chat of chats) {
      const normalized = this.normalizeChat(chat);
      if (normalized.id) {
        this.chats.set(normalized.id, normalized);
      }
    }
  }

  private handleChatsUpdate(chats: ChatUpdate[]): void {
    for (const chat of chats) {
      const chatId = chat.id;
      if (!chatId) {
        continue;
      }

      const previous = this.chats.get(chatId);
      const normalized = this.normalizeChat(chat as Chat, previous);
      this.chats.set(chatId, normalized);
    }
  }

  private handleChatsDelete(jids: string[]): void {
    for (const jid of jids) {
      this.chats.delete(jid);
      this.messages.delete(jid);
    }
  }

  private handleContactsUpsert(contacts: Contact[]): void {
    for (const contact of contacts) {
      const normalized = this.normalizeContact(contact);
      if (normalized.id) {
        this.contacts.set(normalized.id, normalized);
      }
    }
  }

  private handleContactsUpdate(contacts: Partial<Contact>[]): void {
    for (const contact of contacts) {
      const contactId = contact.id;
      if (!contactId) {
        continue;
      }

      const previous = this.contacts.get(contactId);
      const normalized = this.normalizeContact(contact as Contact, previous);
      this.contacts.set(contactId, normalized);
    }
  }

  private handleMessagesUpsert(messages: WAMessage[]): void {
    for (const message of messages) {
      const normalized = this.normalizeMessage(message);
      if (!normalized || !normalized.chatId || !normalized.id) {
        continue;
      }

      const chatId = normalized.chatId;
      const perChat = this.messages.get(chatId) ?? new Map<string, MessageInfo>();

      if (perChat.has(normalized.id)) {
        perChat.delete(normalized.id);
      }

      perChat.set(normalized.id, normalized);

      while (perChat.size > MAX_MESSAGES_PER_CHAT) {
        const oldestId = perChat.keys().next().value as string | undefined;
        if (!oldestId) {
          break;
        }

        perChat.delete(oldestId);
      }

      this.messages.set(chatId, perChat);
      this.mergeMessageIntoChat(normalized);
    }
  }

  private handleMessagesUpdate(updates: WAMessageUpdate[]): void {
    for (const updateEntry of updates) {
      const chatId = updateEntry.key?.remoteJid;
      const messageId = updateEntry.key?.id;
      if (!chatId || !messageId) {
        continue;
      }

      const existing = this.messages.get(chatId)?.get(messageId);
      const normalized = this.normalizeMessage(
        {
          key: updateEntry.key,
          ...updateEntry.update,
        } as WAMessage,
        existing,
      );

      if (!normalized) {
        continue;
      }

      const perChat = this.messages.get(chatId) ?? new Map<string, MessageInfo>();
      perChat.set(messageId, normalized);
      this.messages.set(chatId, perChat);
      this.mergeMessageIntoChat(normalized);
    }
  }

  private handleMessagesDelete(payload: MessagesDeleteEvent): void {
    if ('jid' in payload && payload.all) {
      this.messages.delete(payload.jid);
      return;
    }

    if (!('keys' in payload)) {
      return;
    }

    for (const key of payload.keys) {
      const chatId = key.remoteJid;
      const messageId = key.id;
      if (!chatId || !messageId) {
        continue;
      }

      const perChat = this.messages.get(chatId);
      if (!perChat) {
        continue;
      }

      perChat.delete(messageId);
      if (perChat.size === 0) {
        this.messages.delete(chatId);
      }
    }
  }

  private mergeMessageIntoChat(message: MessageInfo): void {
    const existingChat = this.chats.get(message.chatId);

    const merged: ChatInfo = {
      id: message.chatId,
      name: existingChat?.name ?? message.chatId,
      isGroup: existingChat?.isGroup ?? message.chatId.endsWith('@g.us'),
      unreadCount: existingChat?.unreadCount ?? 0,
      isReadOnly: existingChat?.isReadOnly,
      isMuted: existingChat?.isMuted,
      participants: existingChat?.participants,
      lastMessageTime: Math.max(existingChat?.lastMessageTime ?? 0, message.timestamp),
      lastMessage: message.body ?? existingChat?.lastMessage,
    };

    this.chats.set(message.chatId, merged);
  }

  private normalizeChat(chat: Chat, previous?: ChatInfo): ChatInfo {
    const id = chat.id ?? previous?.id ?? '';
    const isGroup = id.endsWith('@g.us');
    const messageTimestamp = this.toNumber(chat.conversationTimestamp) || this.toNumber(chat.lastMessageRecvTimestamp);

    return {
      id,
      name: chat.name ?? (chat as { subject?: string }).subject ?? previous?.name ?? id,
      isGroup,
      isReadOnly: this.asBoolean((chat as { readOnly?: boolean }).readOnly, previous?.isReadOnly),
      isMuted: this.asBoolean((chat as { muteEndTime?: number | null }).muteEndTime != null, previous?.isMuted),
      unreadCount: this.toNumber(chat.unreadCount) || previous?.unreadCount || 0,
      lastMessageTime: messageTimestamp || previous?.lastMessageTime,
      lastMessage: this.extractMessagePreview((chat as { lastMessage?: WAMessage }).lastMessage) ?? previous?.lastMessage,
      participants: previous?.participants,
    };
  }

  private normalizeContact(contact: Contact, previous?: ContactInfo): ContactInfo {
    const id = contact.id ?? previous?.id ?? '';
    const status = this.normalizeContactStatus((contact as { status?: string }).status);

    return {
      id,
      name: contact.name ?? contact.notify ?? contact.verifiedName ?? previous?.name,
      number: this.extractNumberFromJid(contact.phoneNumber ?? id) ?? previous?.number,
      shortName: contact.notify ?? previous?.shortName,
      status,
      statusMessage: contact.status ?? previous?.statusMessage,
      isBusiness: this.asBoolean((contact as { isBusiness?: boolean }).isBusiness, previous?.isBusiness),
      isEnterprise: this.asBoolean((contact as { isEnterprise?: boolean }).isEnterprise, previous?.isEnterprise),
      profilePictureUrl: typeof contact.imgUrl === 'string' ? contact.imgUrl : previous?.profilePictureUrl,
      lastSeen: previous?.lastSeen,
    };
  }

  private normalizeMessage(message: WAMessage, previous?: MessageInfo): MessageInfo | undefined {
    const id = message.key?.id ?? previous?.id;
    const chatId = message.key?.remoteJid ?? previous?.chatId;

    if (!id || !chatId) {
      return undefined;
    }

    const content = this.unwrapMessageContent(message.message);
    const parsedContent = this.parseMessageContent(content, previous);
    const contextInfo = this.extractContextInfo(content);

    return {
      id,
      chatId,
      fromId: message.key?.participant ?? previous?.fromId ?? chatId,
      toId: previous?.toId,
      timestamp: this.toNumber(message.messageTimestamp) || previous?.timestamp || 0,
      type: parsedContent.type,
      body: parsedContent.body,
      media: parsedContent.media,
      isFromMe: Boolean(message.key?.fromMe ?? previous?.isFromMe),
      hasMedia: parsedContent.hasMedia,
      isQuoted: Boolean(contextInfo?.stanzaId ?? previous?.isQuoted),
      quotedMessageId: contextInfo?.stanzaId ?? previous?.quotedMessageId,
      mentions: contextInfo?.mentionedJid?.length ? [...contextInfo.mentionedJid] : previous?.mentions,
      poll: parsedContent.poll,
    };
  }

  private parseMessageContent(
    content: Record<string, unknown> | undefined,
    previous?: MessageInfo,
  ): {
    type: ContentType;
    body?: string;
    hasMedia: boolean;
    media?: MessageInfo['media'];
    poll?: MessageInfo['poll'];
  } {
    if (!content) {
      return {
        type: previous?.type ?? 'text',
        body: previous?.body,
        hasMedia: previous?.hasMedia ?? false,
        media: previous?.media,
        poll: previous?.poll,
      };
    }

    if (typeof content.conversation === 'string') {
      return { type: 'text', body: content.conversation, hasMedia: false };
    }

    const extendedText = content.extendedTextMessage as { text?: string } | undefined;
    if (typeof extendedText?.text === 'string') {
      return { type: 'text', body: extendedText.text, hasMedia: false };
    }

    const image = content.imageMessage as MediaContent | undefined;
    if (image) {
      return {
        type: 'image',
        body: image.caption,
        hasMedia: true,
        media: this.mapMediaInfo(image),
      };
    }

    const video = content.videoMessage as MediaContent | undefined;
    if (video) {
      return {
        type: 'video',
        body: video.caption,
        hasMedia: true,
        media: this.mapMediaInfo(video),
      };
    }

    const audio = content.audioMessage as MediaContent | undefined;
    if (audio) {
      return {
        type: 'audio',
        hasMedia: true,
        media: this.mapMediaInfo(audio),
      };
    }

    const document = content.documentMessage as MediaContent | undefined;
    if (document) {
      return {
        type: 'document',
        body: document.caption,
        hasMedia: true,
        media: this.mapMediaInfo(document),
      };
    }

    const sticker = content.stickerMessage as MediaContent | undefined;
    if (sticker) {
      return {
        type: 'sticker',
        hasMedia: true,
        media: this.mapMediaInfo(sticker),
      };
    }

    const location = content.locationMessage as { name?: string; address?: string } | undefined;
    if (location) {
      return {
        type: 'location',
        body: location.name ?? location.address,
        hasMedia: false,
      };
    }

    const contacts = content.contactMessage as { displayName?: string } | undefined;
    if (contacts) {
      return {
        type: 'contact',
        body: contacts.displayName,
        hasMedia: false,
      };
    }

    const poll =
      (content.pollCreationMessage as PollContent | undefined) ??
      (content.pollCreationMessageV2 as PollContent | undefined) ??
      (content.pollCreationMessageV3 as PollContent | undefined);

    if (poll) {
      return {
        type: 'poll',
        body: poll.name,
        hasMedia: false,
        poll: {
          name: poll.name ?? '',
          options: (poll.options ?? []).map((option) => ({ name: option.optionName ?? '', count: 0 })),
          selectableOptionsCount: poll.selectableOptionsCount,
        },
      };
    }

    return {
      type: previous?.type ?? 'text',
      body: previous?.body,
      hasMedia: previous?.hasMedia ?? false,
      media: previous?.media,
      poll: previous?.poll,
    };
  }

  private unwrapMessageContent(input: unknown): Record<string, unknown> | undefined {
    if (!input || typeof input !== 'object') {
      return undefined;
    }

    const message = input as Record<string, unknown>;

    const ephemeral = message.ephemeralMessage as { message?: unknown } | undefined;
    if (ephemeral?.message) {
      return this.unwrapMessageContent(ephemeral.message);
    }

    const viewOnce = message.viewOnceMessage as { message?: unknown } | undefined;
    if (viewOnce?.message) {
      return this.unwrapMessageContent(viewOnce.message);
    }

    const viewOnceV2 = message.viewOnceMessageV2 as { message?: unknown } | undefined;
    if (viewOnceV2?.message) {
      return this.unwrapMessageContent(viewOnceV2.message);
    }

    const documentWithCaption = message.documentWithCaptionMessage as { message?: unknown } | undefined;
    if (documentWithCaption?.message) {
      return this.unwrapMessageContent(documentWithCaption.message);
    }

    return message;
  }

  private extractContextInfo(content: Record<string, unknown> | undefined):
    | {
        stanzaId?: string;
        mentionedJid?: string[];
      }
    | undefined {
    if (!content) {
      return undefined;
    }

    const contexts: unknown[] = [
      (content.extendedTextMessage as { contextInfo?: unknown } | undefined)?.contextInfo,
      (content.imageMessage as { contextInfo?: unknown } | undefined)?.contextInfo,
      (content.videoMessage as { contextInfo?: unknown } | undefined)?.contextInfo,
      (content.audioMessage as { contextInfo?: unknown } | undefined)?.contextInfo,
      (content.documentMessage as { contextInfo?: unknown } | undefined)?.contextInfo,
      (content.stickerMessage as { contextInfo?: unknown } | undefined)?.contextInfo,
      (content.contactMessage as { contextInfo?: unknown } | undefined)?.contextInfo,
    ];

    for (const context of contexts) {
      if (context && typeof context === 'object') {
        return context as { stanzaId?: string; mentionedJid?: string[] };
      }
    }

    return undefined;
  }

  private extractMessagePreview(message?: WAMessage): string | undefined {
    if (!message) {
      return undefined;
    }

    const content = this.unwrapMessageContent(message.message);
    return this.parseMessageContent(content).body;
  }

  private mapMediaInfo(content: MediaContent): MessageInfo['media'] {
    return {
      url: content.url ?? content.directPath,
      mimetype: content.mimetype,
      filename: content.fileName,
      size: this.toNumber(content.fileLength),
    };
  }

  private normalizeContactStatus(status?: string): ContactStatus | undefined {
    if (!status) {
      return undefined;
    }

    const normalized = status.toLowerCase();
    if (normalized === 'available' || normalized === 'away' || normalized === 'offline' || normalized === 'dnd') {
      return normalized;
    }

    return 'unavailable';
  }

  private extractNumberFromJid(jid?: string): string | undefined {
    if (!jid) {
      return undefined;
    }

    const [number] = jid.split('@');
    return number || undefined;
  }

  private asBoolean(value: boolean | undefined, fallback: boolean | undefined): boolean | undefined {
    if (typeof value === 'boolean') {
      return value;
    }

    return fallback;
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'bigint') {
      return Number(value);
    }

    if (typeof value === 'object' && value !== null && 'toNumber' in value && typeof value.toNumber === 'function') {
      return value.toNumber();
    }

    return 0;
  }
}

type MediaContent = {
  caption?: string;
  mimetype?: string;
  fileName?: string;
  fileLength?: unknown;
  url?: string;
  directPath?: string;
};

type PollContent = {
  name?: string;
  selectableOptionsCount?: number;
  options?: Array<{ optionName?: string }>;
};
