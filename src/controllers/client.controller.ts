import { Request, Response } from 'express';
import { sessionManager } from '../services/session-manager.js';
import { prepareMediaForSending } from '../services/media.js';
import { ValidationError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';
import { normalizeJid } from '../utils/jid.js';

type AnyMap<T = unknown> = Map<string, T>;

function getSessionId(req: Request): string {
  const sessionId = req.params.sessionId;
  if (typeof sessionId !== 'string') {
    throw new ValidationError('Invalid session ID');
  }
  return sessionId;
}

function toArray<T = unknown>(source: unknown): T[] {
  if (!source) return [];
  if (Array.isArray(source)) return source as T[];
  if (source instanceof Map) return [...source.values()] as T[];
  if (typeof source === 'object') return Object.values(source as Record<string, T>);
  return [];
}

function findById<T extends { id?: string }>(source: unknown, id: string): T | undefined {
  if (!source) return undefined;
  if (source instanceof Map) return source.get(id) as T | undefined;
  return toArray<T>(source).find((item) => item?.id === id);
}

function resolveQuotedMessage(store: any, chatId: string, quotedMessageId: string): unknown {
  const messages = store?.messages;
  if (!messages) return undefined;

  const messageCollections: unknown[] = [];
  if (messages instanceof Map) {
    messageCollections.push(messages.get(chatId));
    messageCollections.push(messages.get(normalizeJid(chatId)));
  }

  for (const collection of messageCollections) {
    const items = toArray<any>(collection);
    const found = items.find((msg) => msg?.id === quotedMessageId || msg?.key?.id === quotedMessageId);
    if (found) return found;
  }

  return undefined;
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  const { chatId, contentType, content, options = {} } = req.body;

  if (!chatId || typeof chatId !== 'string') {
    throw new ValidationError('chatId is required');
  }

  if (!contentType || typeof contentType !== 'string') {
    throw new ValidationError('contentType is required');
  }

  const session = sessionManager.getSession(sessionId);
  const sock: any = session.socket;
  const jid = normalizeJid(chatId);

  const sendOptions: Record<string, unknown> = {};
  if (Array.isArray(options.mentions) && options.mentions.length > 0) {
    sendOptions.mentions = options.mentions.map((mention: string) => normalizeJid(mention));
  }

  if (typeof options.quotedMessageId === 'string') {
    const quoted = resolveQuotedMessage(session.store, chatId, options.quotedMessageId);
    if (quoted) {
      sendOptions.quoted = quoted;
    }
  }

  let messageContent: any;

  switch (contentType) {
    case 'text':
      messageContent = { text: String(content ?? '') };
      break;
    case 'image':
    case 'video':
    case 'audio':
    case 'document':
    case 'sticker':
      messageContent = await prepareMediaForSending(content, contentType, options);
      break;
    case 'location': {
      const latitude = content?.degreesLatitude;
      const longitude = content?.degreesLongitude;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new ValidationError('location content must include degreesLatitude and degreesLongitude');
      }
      messageContent = {
        location: {
          degreesLatitude: latitude,
          degreesLongitude: longitude,
        },
      };
      break;
    }
    case 'contact': {
      const displayName = content?.displayName;
      const vcard = content?.vcard ?? content?.contacts?.[0]?.vcard;
      if (typeof displayName !== 'string' || typeof vcard !== 'string') {
        throw new ValidationError('contact content must include displayName and vcard');
      }
      messageContent = {
        contacts: {
          displayName,
          contacts: [{ vcard }],
        },
      };
      break;
    }
    case 'poll': {
      const name = content?.name;
      const values = content?.values;
      const selectableCount = content?.selectableCount ?? 1;
      if (typeof name !== 'string' || !Array.isArray(values)) {
        throw new ValidationError('poll content must include name and values');
      }
      messageContent = {
        poll: {
          name,
          values,
          selectableCount,
        },
      };
      break;
    }
    default:
      throw new ValidationError(`Unsupported content type: ${contentType}`);
  }

  const message = await sock.sendMessage(jid, messageContent, sendOptions);
  sendSuccess(res, message);
}

export async function getContacts(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const store = session.store as any;
  sendSuccess(res, toArray(store?.contacts));
}

export async function getChats(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const store = session.store as any;
  sendSuccess(res, toArray(store?.chats));
}

export async function searchChats(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const store = session.store as any;
  const chats = toArray<any>(store?.chats);
  const { searchOptions = {} } = req.body;

  const filtered = chats.filter((chat) => {
    if (typeof searchOptions.unread === 'boolean') {
      const isUnread = Number(chat?.unreadCount ?? 0) > 0;
      if (isUnread !== searchOptions.unread) return false;
    }
    if (typeof searchOptions.since === 'number' && Number(chat?.lastMessageTime ?? 0) < searchOptions.since) {
      return false;
    }
    if (typeof searchOptions.isGroup === 'boolean' && Boolean(chat?.isGroup) !== searchOptions.isGroup) {
      return false;
    }
    if (typeof searchOptions.query === 'string' && searchOptions.query.trim() !== '') {
      const q = searchOptions.query.toLowerCase();
      const name = String(chat?.name ?? '').toLowerCase();
      const id = String(chat?.id ?? '').toLowerCase();
      if (!name.includes(q) && !id.includes(q)) return false;
    }
    return true;
  });

  sendSuccess(res, filtered);
}

export async function getChatById(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const store = session.store as any;
  const chatId = decodeURIComponent((req.params.chatId as string) || '');
  const chat = findById(store?.chats, chatId);
  sendSuccess(res, chat ?? null);
}

export async function getContactById(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const store = session.store as any;
  const contactId = decodeURIComponent((req.params.contactId as string) || '');
  const normalized = normalizeJid(contactId);
  const contact = findById(store?.contacts, normalized) ?? findById(store?.contacts, contactId);
  sendSuccess(res, contact ?? null);
}

export async function isRegistered(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const number = req.body?.number;
  if (typeof number !== 'string' || number.trim() === '') {
    throw new ValidationError('number is required');
  }
  const result = await (session.socket as any).onWhatsApp(number);
  sendSuccess(res, result);
}

export async function getNumberId(req: Request, res: Response): Promise<void> {
  const number = req.body?.number;
  if (typeof number !== 'string' || number.trim() === '') {
    throw new ValidationError('number is required');
  }
  sendSuccess(res, { jid: normalizeJid(number) });
}

export async function getProfilePictureUrl(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const contactId = req.body?.contactId;
  if (typeof contactId !== 'string') {
    throw new ValidationError('contactId is required');
  }
  const type = typeof req.body?.type === 'string' ? req.body.type : 'image';
  const result = await (session.socket as any).profilePictureUrl(normalizeJid(contactId), type);
  sendSuccess(res, result ?? null);
}

export async function setStatus(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const status = req.body?.status;
  if (typeof status !== 'string' || status.trim() === '') {
    throw new ValidationError('status is required');
  }
  await (session.socket as any).updateProfileStatus(status);
  sendSuccess(res, { message: 'Status updated' });
}

export async function setDisplayName(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const name = req.body?.name;
  if (typeof name !== 'string' || name.trim() === '') {
    throw new ValidationError('name is required');
  }
  await (session.socket as any).updateProfileName(name);
  sendSuccess(res, { message: 'Display name updated' });
}

export async function setProfilePicture(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const targetJid = req.body?.jid ? normalizeJid(req.body.jid) : undefined;
  const prepared = await prepareMediaForSending(req.body?.content, 'image', req.body?.options);
  await (session.socket as any).updateProfilePicture(targetJid, prepared.image);
  sendSuccess(res, { message: 'Profile picture updated' });
}

export async function deleteProfilePicture(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  await (session.socket as any).removeProfilePicture();
  sendSuccess(res, { message: 'Profile picture removed' });
}

export async function createGroup(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const name = req.body?.name;
  const participants = req.body?.participants;
  if (typeof name !== 'string' || !Array.isArray(participants)) {
    throw new ValidationError('name and participants are required');
  }
  const result = await (session.socket as any).groupCreate(
    name,
    participants.map((participant: string) => normalizeJid(participant))
  );
  sendSuccess(res, result);
}

export async function presenceAvailable(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  await (session.socket as any).sendPresenceUpdate('available');
  sendSuccess(res, { message: 'Presence updated to available' });
}

export async function presenceUnavailable(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  await (session.socket as any).sendPresenceUpdate('unavailable');
  sendSuccess(res, { message: 'Presence updated to unavailable' });
}

export async function searchMessages(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const store = session.store as any;
  const messageStore = store?.messages;
  const { query = '', chatId } = req.body;

  const allMessages: any[] = [];
  if (messageStore instanceof Map) {
    for (const [storeChatId, chatMessages] of messageStore.entries() as IterableIterator<[string, AnyMap | unknown[]]>) {
      if (chatId && storeChatId !== chatId && storeChatId !== normalizeJid(chatId)) continue;
      allMessages.push(...toArray(chatMessages));
    }
  }

  const q = String(query).toLowerCase();
  const filtered = q
    ? allMessages.filter((msg) => String(msg?.text ?? msg?.body ?? '').toLowerCase().includes(q))
    : allMessages;

  sendSuccess(res, filtered);
}

export async function getBlockedContacts(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const store = session.store as any;
  const blocked = store?.blockedContacts ?? store?.blocklist ?? [];
  sendSuccess(res, toArray(blocked));
}

export async function getLabels(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const store = session.store as any;
  sendSuccess(res, toArray(store?.labels));
}

export async function getLabelById(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const store = session.store as any;
  const labelId = decodeURIComponent((req.params.labelId as string) || '');
  const label = findById(store?.labels, labelId);
  sendSuccess(res, label ?? null);
}

export async function getLabelsForChat(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const store = session.store as any;
  const chatId = decodeURIComponent((req.params.chatId as string) || '');
  const labelAssociations: Map<string, Set<string>> = store?.labelAssociations ?? new Map();
  const labels = toArray<any>(store?.labels);

  const chatLabelIds = labelAssociations.get(chatId) ?? labelAssociations.get(normalizeJid(chatId)) ?? new Set<string>();
  const chatLabels = labels.filter((label) => chatLabelIds.has(label?.id));
  sendSuccess(res, chatLabels);
}

export async function getChatsByLabelId(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const store = session.store as any;
  const labelId = decodeURIComponent((req.params.labelId as string) || '');
  const chats = toArray<any>(store?.chats);
  const labelAssociations: Map<string, Set<string>> = store?.labelAssociations ?? new Map();

  const labeledChats = chats.filter((chat) => {
    const set = labelAssociations.get(chat?.id) ?? new Set<string>();
    return set.has(labelId);
  });

  sendSuccess(res, labeledChats);
}

export async function modifyLabels(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const store = session.store as any;
  const { chatId, labelIds, action } = req.body;

  if (typeof chatId !== 'string' || !Array.isArray(labelIds) || !['add', 'remove'].includes(action)) {
    throw new ValidationError('chatId, labelIds, and action(add|remove) are required');
  }

  if (!store.labelAssociations) {
    store.labelAssociations = new Map();
  }

  const associations: Map<string, Set<string>> = store.labelAssociations;
  const normalizedChatId = normalizeJid(chatId);
  const labelSet = associations.get(normalizedChatId) ?? new Set<string>();

  for (const labelId of labelIds) {
    if (action === 'add') labelSet.add(String(labelId));
    if (action === 'remove') labelSet.delete(String(labelId));
  }

  associations.set(normalizedChatId, labelSet);
  sendSuccess(res, { chatId: normalizedChatId, labels: [...labelSet] });
}
