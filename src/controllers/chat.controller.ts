import { Request, Response } from 'express';
import { sessionManager } from '../services/session-manager.js';
import { ValidationError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';
import { normalizeJid } from '../utils/jid.js';

function getSessionId(req: Request): string {
  const sessionId = req.params.sessionId;
  if (typeof sessionId !== 'string') {
    throw new ValidationError('Invalid session ID');
  }
  return sessionId;
}

function getChatId(req: Request): string {
  const chatId = decodeURIComponent((req.params.chatId as string) || '');
  if (!chatId || typeof chatId !== 'string') {
    throw new ValidationError('Invalid chat ID');
  }
  return chatId;
}

function toArray<T = unknown>(source: unknown): T[] {
  if (!source) return [];
  if (Array.isArray(source)) return source as T[];
  if (source instanceof Map) return [...source.values()] as T[];
  if (typeof source === 'object') return Object.values(source as Record<string, T>);
  return [];
}

/**
 * POST /sessions/:sessionId/chats/:chatId/typing
 * Send typing indicator
 */
export async function sendTypingIndicator(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  const chatId = getChatId(req);
  const session = sessionManager.getSession(sessionId);
  const jid = normalizeJid(chatId);

  await (session.socket as any).sendPresenceUpdate('composing', jid);
  sendSuccess(res, { message: 'Typing indicator sent', chatId: jid });
}

/**
 * POST /sessions/:sessionId/chats/:chatId/recording
 * Send recording indicator
 */
export async function sendRecordingIndicator(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  const chatId = getChatId(req);
  const session = sessionManager.getSession(sessionId);
  const jid = normalizeJid(chatId);

  await (session.socket as any).sendPresenceUpdate('recording', jid);
  sendSuccess(res, { message: 'Recording indicator sent', chatId: jid });
}

/**
 * POST /sessions/:sessionId/chats/:chatId/clear-state
 * Clear typing/recording state
 */
export async function clearPresenceState(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  const chatId = getChatId(req);
  const session = sessionManager.getSession(sessionId);
  const jid = normalizeJid(chatId);

  await (session.socket as any).sendPresenceUpdate('paused', jid);
  sendSuccess(res, { message: 'Presence state cleared', chatId: jid });
}

/**
 * POST /sessions/:sessionId/chats/:chatId/seen
 * Mark messages as read
 */
export async function markMessagesAsRead(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  const chatId = getChatId(req);
  const session = sessionManager.getSession(sessionId);
  const { messageIds } = req.body;

  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    throw new ValidationError('messageIds array is required');
  }

  const jid = normalizeJid(chatId);
  const messageKeys = messageIds.map((id: string) => ({
    remoteJid: jid,
    id,
    fromMe: false,
  }));

  await (session.socket as any).readMessages(messageKeys);
  sendSuccess(res, { message: 'Messages marked as read', count: messageIds.length });
}

/**
 * POST /sessions/:sessionId/chats/:chatId/mark-unread
 * Mark chat as unread
 */
export async function markChatAsUnread(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  const chatId = getChatId(req);
  const session = sessionManager.getSession(sessionId);
  const jid = normalizeJid(chatId);

  await (session.socket as any).chatModify({ markRead: false }, jid);
  sendSuccess(res, { message: 'Chat marked as unread', chatId: jid });
}

/**
 * POST /sessions/:sessionId/chats/:chatId/archive
 * Archive chat
 */
export async function archiveChat(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  const chatId = getChatId(req);
  const session = sessionManager.getSession(sessionId);
  const jid = normalizeJid(chatId);

  await (session.socket as any).chatModify({ archive: true }, jid);
  sendSuccess(res, { message: 'Chat archived', chatId: jid });
}

/**
 * POST /sessions/:sessionId/chats/:chatId/unarchive
 * Unarchive chat
 */
export async function unarchiveChat(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  const chatId = getChatId(req);
  const session = sessionManager.getSession(sessionId);
  const jid = normalizeJid(chatId);

  await (session.socket as any).chatModify({ archive: false }, jid);
  sendSuccess(res, { message: 'Chat unarchived', chatId: jid });
}

/**
 * POST /sessions/:sessionId/chats/:chatId/pin
 * Pin chat
 */
export async function pinChat(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  const chatId = getChatId(req);
  const session = sessionManager.getSession(sessionId);
  const jid = normalizeJid(chatId);

  await (session.socket as any).chatModify({ pin: true }, jid);
  sendSuccess(res, { message: 'Chat pinned', chatId: jid });
}

/**
 * POST /sessions/:sessionId/chats/:chatId/unpin
 * Unpin chat
 */
export async function unpinChat(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  const chatId = getChatId(req);
  const session = sessionManager.getSession(sessionId);
  const jid = normalizeJid(chatId);

  await (session.socket as any).chatModify({ pin: false }, jid);
  sendSuccess(res, { message: 'Chat unpinned', chatId: jid });
}

/**
 * POST /sessions/:sessionId/chats/:chatId/mute
 * Mute chat
 */
export async function muteChat(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  const chatId = getChatId(req);
  const session = sessionManager.getSession(sessionId);
  const { duration } = req.body;

  if (typeof duration !== 'number' || duration < 0) {
    throw new ValidationError('duration (number in milliseconds) is required');
  }

  const jid = normalizeJid(chatId);
  await (session.socket as any).chatModify({ mute: duration }, jid);
  sendSuccess(res, { message: 'Chat muted', chatId: jid, duration });
}

/**
 * POST /sessions/:sessionId/chats/:chatId/unmute
 * Unmute chat
 */
export async function unmuteChat(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  const chatId = getChatId(req);
  const session = sessionManager.getSession(sessionId);
  const jid = normalizeJid(chatId);

  await (session.socket as any).chatModify({ mute: null }, jid);
  sendSuccess(res, { message: 'Chat unmuted', chatId: jid });
}

/**
 * GET /sessions/:sessionId/chats/:chatId/messages
 * Fetch messages with pagination
 */
export async function fetchMessages(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  const chatId = getChatId(req);
  const session = sessionManager.getSession(sessionId);
  const store = session.store as any;
  const jid = normalizeJid(chatId);

  const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 50;
  const offset = typeof req.query.offset === 'string' ? parseInt(req.query.offset, 10) : 0;

  const messageStore = store?.messages;
  let messages: any[] = [];

  if (messageStore instanceof Map) {
    const chatMessages = messageStore.get(chatId) ?? messageStore.get(jid);
    messages = toArray(chatMessages);
  }

  const paginated = messages.slice(offset, offset + limit);
  sendSuccess(res, {
    chatId: jid,
    messages: paginated,
    total: messages.length,
    limit,
    offset,
  });
}

/**
 * GET /sessions/:sessionId/chats/:chatId/contact
 * Get contact information for chat
 */
export async function getChatContact(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  const chatId = getChatId(req);
  const session = sessionManager.getSession(sessionId);
  const store = session.store as any;
  const jid = normalizeJid(chatId);

  const contacts = store?.contacts;
  let contact: any = null;

  if (contacts instanceof Map) {
    contact = contacts.get(chatId) ?? contacts.get(jid);
  }

  sendSuccess(res, contact ?? null);
}

/**
 * DELETE /sessions/:sessionId/chats/:chatId
 * Delete chat
 */
export async function deleteChat(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  const chatId = getChatId(req);
  const session = sessionManager.getSession(sessionId);
  const jid = normalizeJid(chatId);

  await (session.socket as any).chatModify({ delete: true }, jid);
  sendSuccess(res, { message: 'Chat deleted', chatId: jid });
}

/**
 * POST /sessions/:sessionId/chats/:chatId/clear
 * Clear chat messages
 */
export async function clearChatMessages(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  const chatId = getChatId(req);
  const session = sessionManager.getSession(sessionId);
  const { messages } = req.body;

  const jid = normalizeJid(chatId);
  let clearPayload: any = { clear: { messages: [] } };

  // If messages array provided, use it; otherwise clear all
  if (Array.isArray(messages) && messages.length > 0) {
    clearPayload.clear.messages = messages.map((msg: any) => ({
      id: msg.id,
      fromMe: msg.fromMe ?? false,
      timestamp: msg.timestamp ?? Date.now(),
    }));
  }

  await (session.socket as any).chatModify(clearPayload, jid);
  sendSuccess(res, { message: 'Chat messages cleared', chatId: jid });
}

/**
 * GET /sessions/:sessionId/chats/:chatId/labels
 * Get labels for chat
 */
export async function getChatLabels(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  const chatId = getChatId(req);
  const session = sessionManager.getSession(sessionId);
  const store = session.store as any;
  const jid = normalizeJid(chatId);

  const labelAssociations: Map<string, Set<string>> = store?.labelAssociations ?? new Map();
  const labels = toArray<any>(store?.labels);

  const chatLabelIds = labelAssociations.get(chatId) ?? labelAssociations.get(jid) ?? new Set<string>();
  const chatLabels = labels.filter((label) => chatLabelIds.has(label?.id));

  sendSuccess(res, chatLabels);
}

/**
 * POST /sessions/:sessionId/chats/:chatId/labels/modify
 * Modify chat labels
 */
export async function modifyChatLabels(req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  const chatId = getChatId(req);
  const session = sessionManager.getSession(sessionId);
  const store = session.store as any;
  const { labelIds, action } = req.body;

  if (!Array.isArray(labelIds) || !['add', 'remove'].includes(action)) {
    throw new ValidationError('labelIds and action(add|remove) are required');
  }

  const jid = normalizeJid(chatId);

  if (!store.labelAssociations) {
    store.labelAssociations = new Map();
  }

  const associations: Map<string, Set<string>> = store.labelAssociations;
  const labelSet = associations.get(jid) ?? new Set<string>();

  for (const labelId of labelIds) {
    if (action === 'add') labelSet.add(String(labelId));
    if (action === 'remove') labelSet.delete(String(labelId));
  }

  associations.set(jid, labelSet);
  sendSuccess(res, { chatId: jid, labels: [...labelSet] });
}
