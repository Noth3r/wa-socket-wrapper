import { Request, Response } from 'express';
import { sessionManager } from '../services/session-manager.js';
import { downloadMediaFromMessage as downloadMediaMessage } from '../services/media.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

type MessageKey = {
  remoteJid: string;
  id: string;
  fromMe: boolean;
  participant?: string;
};

function getSessionId(req: Request): string {
  const sessionId = req.params.sessionId;
  if (typeof sessionId !== 'string' || sessionId.trim() === '') {
    throw new ValidationError('Invalid session ID');
  }
  return sessionId;
}

function parseMessageKey(input: unknown): MessageKey {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('messageKey is required');
  }

  const key = input as Record<string, unknown>;
  if (typeof key.remoteJid !== 'string' || key.remoteJid.trim() === '') {
    throw new ValidationError('messageKey.remoteJid is required');
  }
  if (typeof key.id !== 'string' || key.id.trim() === '') {
    throw new ValidationError('messageKey.id is required');
  }
  if (typeof key.fromMe !== 'boolean') {
    throw new ValidationError('messageKey.fromMe must be boolean');
  }

  return {
    remoteJid: key.remoteJid,
    id: key.id,
    fromMe: key.fromMe,
    participant: typeof key.participant === 'string' ? key.participant : undefined,
  };
}

function toArray<T = unknown>(source: unknown): T[] {
  if (!source) return [];
  if (Array.isArray(source)) return source as T[];
  if (source instanceof Map) return [...source.values()] as T[];
  if (typeof source === 'object') return Object.values(source as Record<string, T>);
  return [];
}

function findMessage(session: any, messageKey: MessageKey): any {
  const messageStore = session.store?.messages;
  if (!messageStore || !(messageStore instanceof Map)) {
    return undefined;
  }

  const chatMessages = messageStore.get(messageKey.remoteJid);
  if (chatMessages instanceof Map) {
    const byId = chatMessages.get(messageKey.id);
    if (byId) return byId;
  }

  return toArray<any>(chatMessages).find((message) => {
    const key = message?.key;
    return key?.id === messageKey.id && key?.remoteJid === messageKey.remoteJid;
  });
}

function resolveMediaType(type: unknown, message: any): 'image' | 'video' | 'audio' | 'document' | 'sticker' {
  if (typeof type === 'string' && ['image', 'video', 'audio', 'document', 'sticker'].includes(type)) {
    return type as 'image' | 'video' | 'audio' | 'document' | 'sticker';
  }

  const raw = message?.message;
  if (raw?.imageMessage) return 'image';
  if (raw?.videoMessage) return 'video';
  if (raw?.audioMessage) return 'audio';
  if (raw?.documentMessage) return 'document';
  if (raw?.stickerMessage) return 'sticker';

  throw new ValidationError('Unable to detect media type, provide type explicitly');
}

export async function deleteMessage(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const sock: any = session.socket;
  const messageKey = parseMessageKey(req.body?.messageKey);

  const result = await sock.sendMessage(messageKey.remoteJid, { delete: messageKey });
  sendSuccess(res, result);
}

export async function editMessage(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const sock: any = session.socket;
  const messageKey = parseMessageKey(req.body?.messageKey);
  const text = req.body?.text;

  if (typeof text !== 'string' || text.trim() === '') {
    throw new ValidationError('text is required');
  }

  const result = await sock.sendMessage(messageKey.remoteJid, { text, edit: messageKey });
  sendSuccess(res, result);
}

export async function reactToMessage(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const sock: any = session.socket;
  const messageKey = parseMessageKey(req.body?.messageKey);
  const emoji = req.body?.emoji;

  if (typeof emoji !== 'string') {
    throw new ValidationError('emoji is required');
  }

  const result = await sock.sendMessage(messageKey.remoteJid, {
    react: { text: emoji, key: messageKey },
  });
  sendSuccess(res, result);
}

export async function forwardMessage(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const sock: any = session.socket;
  const messageKey = parseMessageKey(req.body?.messageKey);
  const targetJid = req.body?.targetJid;

  if (typeof targetJid !== 'string' || targetJid.trim() === '') {
    throw new ValidationError('targetJid is required');
  }

  const message = findMessage(session, messageKey);
  if (!message) {
    throw new NotFoundError('Message not found in store');
  }

  const result = await sock.sendMessage(targetJid, { forward: message });
  sendSuccess(res, result);
}

export async function starMessage(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const sock: any = session.socket;
  const messageKey = parseMessageKey(req.body?.messageKey);

  await sock.chatModify({ star: { messages: [messageKey], star: true } }, messageKey.remoteJid);
  sendSuccess(res, { message: 'Message starred' });
}

export async function unstarMessage(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const sock: any = session.socket;
  const messageKey = parseMessageKey(req.body?.messageKey);

  await sock.chatModify({ star: { messages: [messageKey], star: false } }, messageKey.remoteJid);
  sendSuccess(res, { message: 'Message unstarred' });
}

export async function replyToMessage(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const sock: any = session.socket;
  const messageKey = parseMessageKey(req.body?.messageKey);
  const content = req.body?.content;

  if (!content || typeof content !== 'object') {
    throw new ValidationError('content is required');
  }

  const quotedMessage = findMessage(session, messageKey);
  if (!quotedMessage) {
    throw new NotFoundError('Quoted message not found in store');
  }

  const result = await sock.sendMessage(messageKey.remoteJid, content, { quoted: quotedMessage });
  sendSuccess(res, result);
}

export async function downloadMedia(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const messageKey = parseMessageKey(req.body?.messageKey);
  const message = findMessage(session, messageKey);

  if (!message) {
    throw new NotFoundError('Message not found in store');
  }

  resolveMediaType(req.body?.type, message);
  const result = await downloadMediaMessage(message);

  sendSuccess(res, {
    mimetype: result.mimetype,
    filename: result.filename,
    data: result.buffer.toString('base64'),
  });
}

export async function downloadMediaStream(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const messageKey = parseMessageKey(req.body?.messageKey);
  const message = findMessage(session, messageKey);

  if (!message) {
    throw new NotFoundError('Message not found in store');
  }

  resolveMediaType(req.body?.type, message);
  const result = await downloadMediaMessage(message);

  res.setHeader('Content-Type', result.mimetype);
  res.setHeader('Content-Length', result.buffer.length);
  res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(result.filename)}`);
  res.send(result.buffer);
}

export async function getMessageInfo(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const messageKey = parseMessageKey(req.body?.messageKey);
  const message = findMessage(session, messageKey);

  if (!message) {
    throw new NotFoundError('Message not found in store');
  }

  const info = {
    key: message.key,
    status: message.status,
    messageTimestamp: message.messageTimestamp,
    pushName: message.pushName,
    participant: message.participant,
  };

  sendSuccess(res, info);
}

export async function getMessageMentions(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const messageKey = parseMessageKey(req.body?.messageKey);
  const message = findMessage(session, messageKey);

  if (!message) {
    throw new NotFoundError('Message not found in store');
  }

  const mentionedJid =
    message?.message?.extendedTextMessage?.contextInfo?.mentionedJid ??
    message?.message?.imageMessage?.contextInfo?.mentionedJid ??
    message?.message?.videoMessage?.contextInfo?.mentionedJid ??
    [];

  sendSuccess(res, mentionedJid);
}

export async function getQuotedMessage(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const messageKey = parseMessageKey(req.body?.messageKey);
  const message = findMessage(session, messageKey);

  if (!message) {
    throw new NotFoundError('Message not found in store');
  }

  const quoted =
    message?.message?.extendedTextMessage?.contextInfo?.quotedMessage ??
    message?.message?.imageMessage?.contextInfo?.quotedMessage ??
    message?.message?.videoMessage?.contextInfo?.quotedMessage ??
    null;

  sendSuccess(res, quoted);
}

export async function getMessageReactions(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const messageKey = parseMessageKey(req.body?.messageKey);
  const message = findMessage(session, messageKey);

  if (!message) {
    throw new NotFoundError('Message not found in store');
  }

  const reactions = message?.reactions ?? message?.message?.reactions ?? [];
  sendSuccess(res, reactions);
}

export async function getPollVotes(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const sock: any = session.socket;
  const messageKey = parseMessageKey(req.body?.messageKey);

  const votes = await sock.pollVote(messageKey);
  sendSuccess(res, votes);
}

export async function getMessageContact(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const messageKey = parseMessageKey(req.body?.messageKey);
  const message = findMessage(session, messageKey);

  if (!message) {
    throw new NotFoundError('Message not found in store');
  }

  const contactId = messageKey.participant ?? message?.participant ?? message?.key?.participant ?? message?.key?.remoteJid;
  const store = session.store as any;
  const contact = store?.contacts instanceof Map ? store.contacts.get(contactId) : undefined;

  sendSuccess(res, contact ?? null);
}
