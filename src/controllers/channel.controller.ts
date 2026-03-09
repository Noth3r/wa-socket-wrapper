import { Request, Response } from 'express';
import { sessionManager } from '../services/session-manager.js';
import { prepareMediaForSending } from '../services/media.js';
import { ValidationError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';
import { isNewsletterJid } from '../utils/jid.js';

function getSessionId(req: Request): string {
  const sessionId = req.params.sessionId;
  if (typeof sessionId !== 'string') {
    throw new ValidationError('Invalid session ID');
  }
  return sessionId;
}

function getChannelJid(req: Request): string {
  const channelId = decodeURIComponent((req.params.channelId as string) || '').trim();
  if (!channelId) {
    throw new ValidationError('channelId is required');
  }

  if (channelId.includes('@')) {
    return channelId;
  }

  return `${channelId}@newsletter`;
}

function getNewsletterJidFromBody(req: Request): string {
  const jid = req.body?.jid;
  if (typeof jid !== 'string' || jid.trim() === '') {
    throw new ValidationError('jid is required');
  }
  const normalizedJid = jid.trim();
  if (!isNewsletterJid(normalizedJid)) {
    throw new ValidationError('jid must be a newsletter JID (ending with @newsletter)');
  }
  return normalizedJid;
}

function validateNewsletterMethod(socket: any, methodName: string): void {
  if (typeof socket[methodName] !== 'function') {
    throw new ValidationError(`Newsletter method '${methodName}' is not available in this Baileys version`);
  }
}

// Basic operations
export async function getNewsletterInfo(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  validateNewsletterMethod(session.socket, 'newsletterMetadata');

  const { type, key } = req.body;
  
  if (!type || !key) {
    throw new ValidationError('type and key are required');
  }

  if (type !== 'jid' && type !== 'invite') {
    throw new ValidationError('type must be either "jid" or "invite"');
  }

  const result = await (session.socket as any).newsletterMetadata(type, key);
  sendSuccess(res, result);
}

export async function sendMessageToNewsletter(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const jid = getNewsletterJidFromBody(req);
  const { content } = req.body;

  if (!content) {
    throw new ValidationError('content is required');
  }

  const result = await (session.socket as any).sendMessage(jid, content);
  sendSuccess(res, result);
}

export async function fetchNewsletterMessages(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  validateNewsletterMethod(session.socket, 'newsletterFetchMessages');

  const jid = getNewsletterJidFromBody(req);
  const count = typeof req.body?.count === 'number' ? req.body.count : 10;
  const since = typeof req.body?.since === 'number' ? req.body.since : 0;
  const after = typeof req.body?.after === 'number' ? req.body.after : 0;

  const result = await (session.socket as any).newsletterFetchMessages(jid, count, since, after);
  sendSuccess(res, result);
}

export async function sendSeenToNewsletter(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const { keys } = req.body;

  if (!Array.isArray(keys) || keys.length === 0) {
    throw new ValidationError('keys array is required');
  }

  await (session.socket as any).readMessages(keys);
  sendSuccess(res, { message: 'Messages marked as read' });
}

export async function muteNewsletter(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  validateNewsletterMethod(session.socket, 'newsletterMute');

  const jid = getNewsletterJidFromBody(req);
  const result = await (session.socket as any).newsletterMute(jid);
  sendSuccess(res, result);
}

export async function unmuteNewsletter(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  validateNewsletterMethod(session.socket, 'newsletterUnmute');

  const jid = getNewsletterJidFromBody(req);
  const result = await (session.socket as any).newsletterUnmute(jid);
  sendSuccess(res, result);
}

// Settings operations
export async function setNewsletterProfilePicture(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  validateNewsletterMethod(session.socket, 'newsletterUpdatePicture');

  const jid = getNewsletterJidFromBody(req);
  const prepared = await prepareMediaForSending(req.body?.content, 'image', req.body?.options);
  
  if (!prepared?.image) {
    throw new ValidationError('Invalid picture content');
  }

  await (session.socket as any).newsletterUpdatePicture(jid, prepared.image);
  sendSuccess(res, { message: 'Newsletter picture updated' });
}

export async function setNewsletterDescription(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  validateNewsletterMethod(session.socket, 'newsletterUpdateDescription');

  const jid = getNewsletterJidFromBody(req);
  const description = req.body?.description;
  
  if (typeof description !== 'string') {
    throw new ValidationError('description is required');
  }

  await (session.socket as any).newsletterUpdateDescription(jid, description);
  sendSuccess(res, { message: 'Newsletter description updated' });
}

export async function setNewsletterSubject(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  validateNewsletterMethod(session.socket, 'newsletterUpdateName');

  const jid = getNewsletterJidFromBody(req);
  const name = req.body?.name;
  
  if (typeof name !== 'string' || name.trim() === '') {
    throw new ValidationError('name is required');
  }

  await (session.socket as any).newsletterUpdateName(jid, name);
  sendSuccess(res, { message: 'Newsletter name updated' });
}

export async function deleteNewsletter(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  validateNewsletterMethod(session.socket, 'newsletterDelete');

  const jid = getChannelJid(req);
  await (session.socket as any).newsletterDelete(jid);
  sendSuccess(res, { message: 'Newsletter deleted' });
}

export async function getNewsletterSubscribers(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  validateNewsletterMethod(session.socket, 'newsletterSubscribers');

  const jid = getNewsletterJidFromBody(req);
  const result = await (session.socket as any).newsletterSubscribers(jid);
  sendSuccess(res, result);
}

export async function setNewsletterReactionSetting(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  
  // Check if newsletterReactionMode exists
  if (typeof (session.socket as any).newsletterReactionMode !== 'function') {
    res.status(501).json({
      success: false,
      error: 'newsletterReactionMode is not supported in this Baileys version',
    });
    return;
  }

  const jid = getNewsletterJidFromBody(req);
  const mode = req.body?.mode;
  
  if (typeof mode !== 'string' || mode.trim() === '') {
    throw new ValidationError('mode is required');
  }

  await (session.socket as any).newsletterReactionMode(jid, mode);
  sendSuccess(res, { message: 'Newsletter reaction setting updated' });
}

// Admin operations - these may not be available in all Baileys versions
export async function inviteToNewsletter(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));

  // Check if method exists
  if (typeof (session.socket as any).newsletterInvite !== 'function') {
    res.status(501).json({
      success: false,
      error: 'Newsletter invite functionality is not supported in this Baileys version',
    });
    return;
  }

  const jid = getNewsletterJidFromBody(req);
  const participants = req.body?.participants;
  
  if (!Array.isArray(participants) || participants.length === 0) {
    throw new ValidationError('participants array is required');
  }

  const result = await (session.socket as any).newsletterInvite(jid, participants);
  sendSuccess(res, result);
}

export async function acceptNewsletterInvite(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));

  if (typeof (session.socket as any).newsletterAcceptInvite !== 'function') {
    res.status(501).json({
      success: false,
      error: 'Newsletter accept invite functionality is not supported in this Baileys version',
    });
    return;
  }

  const code = req.body?.code;
  
  if (typeof code !== 'string' || code.trim() === '') {
    throw new ValidationError('code is required');
  }

  const result = await (session.socket as any).newsletterAcceptInvite(code.trim());
  sendSuccess(res, result);
}

export async function revokeNewsletterInvite(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));

  if (typeof (session.socket as any).newsletterRevokeInvite !== 'function') {
    res.status(501).json({
      success: false,
      error: 'Newsletter revoke invite functionality is not supported in this Baileys version',
    });
    return;
  }

  const jid = getNewsletterJidFromBody(req);
  const result = await (session.socket as any).newsletterRevokeInvite(jid);
  sendSuccess(res, result);
}

export async function transferNewsletterOwnership(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  validateNewsletterMethod(session.socket, 'newsletterChangeOwner');

  const jid = getNewsletterJidFromBody(req);
  const newOwnerJid = req.body?.newOwnerJid;
  
  if (typeof newOwnerJid !== 'string' || newOwnerJid.trim() === '') {
    throw new ValidationError('newOwnerJid is required');
  }

  await (session.socket as any).newsletterChangeOwner(jid, newOwnerJid.trim());
  sendSuccess(res, { message: 'Newsletter ownership transferred' });
}

export async function demoteNewsletterAdmin(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  validateNewsletterMethod(session.socket, 'newsletterDemote');

  const jid = getNewsletterJidFromBody(req);
  const userJid = req.body?.userJid;
  
  if (typeof userJid !== 'string' || userJid.trim() === '') {
    throw new ValidationError('userJid is required');
  }

  await (session.socket as any).newsletterDemote(jid, userJid.trim());
  sendSuccess(res, { message: 'Admin demoted' });
}
