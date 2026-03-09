import { Request, Response } from 'express';
import { sessionManager } from '../services/session-manager.js';
import { prepareMediaForSending } from '../services/media.js';
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

function getGroupJid(req: Request): string {
  const groupId = decodeURIComponent((req.params.groupId as string) || '').trim();
  if (!groupId) {
    throw new ValidationError('groupId is required');
  }

  if (groupId.includes('@')) {
    return groupId;
  }

  return `${groupId}@g.us`;
}

function getParticipants(input: unknown): string[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new ValidationError('participants array is required');
  }

  const participants = input
    .filter((item): item is string => typeof item === 'string' && item.trim() !== '')
    .map((participant) => normalizeJid(participant));

  if (participants.length === 0) {
    throw new ValidationError('participants array is required');
  }

  return participants;
}

function getInviteCode(req: Request): string {
  const code = req.body?.code;
  if (typeof code !== 'string' || code.trim() === '') {
    throw new ValidationError('code is required');
  }
  return code.trim();
}

export async function getGroupMetadata(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const result = await (session.socket as any).groupMetadata(getGroupJid(req));
  sendSuccess(res, result);
}

export async function addParticipants(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const result = await (session.socket as any).groupParticipantsUpdate(
    getGroupJid(req),
    getParticipants(req.body?.participants),
    'add'
  );
  sendSuccess(res, result);
}

export async function removeParticipants(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const result = await (session.socket as any).groupParticipantsUpdate(
    getGroupJid(req),
    getParticipants(req.body?.participants),
    'remove'
  );
  sendSuccess(res, result);
}

export async function promoteParticipants(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const result = await (session.socket as any).groupParticipantsUpdate(
    getGroupJid(req),
    getParticipants(req.body?.participants),
    'promote'
  );
  sendSuccess(res, result);
}

export async function demoteParticipants(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const result = await (session.socket as any).groupParticipantsUpdate(
    getGroupJid(req),
    getParticipants(req.body?.participants),
    'demote'
  );
  sendSuccess(res, result);
}

export async function getInviteCodeForGroup(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const inviteCode = await (session.socket as any).groupInviteCode(getGroupJid(req));
  sendSuccess(res, { inviteCode });
}

export async function revokeInvite(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const result = await (session.socket as any).groupRevokeInvite(getGroupJid(req));
  sendSuccess(res, result);
}

export async function leaveGroup(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  await (session.socket as any).groupLeave(getGroupJid(req));
  sendSuccess(res, { message: 'Left group' });
}

export async function updateGroupSubject(req: Request, res: Response): Promise<void> {
  const subject = req.body?.subject;
  if (typeof subject !== 'string' || subject.trim() === '') {
    throw new ValidationError('subject is required');
  }

  const session = sessionManager.getSession(getSessionId(req));
  await (session.socket as any).groupUpdateSubject(getGroupJid(req), subject);
  sendSuccess(res, { message: 'Group subject updated' });
}

export async function updateGroupDescription(req: Request, res: Response): Promise<void> {
  const description = req.body?.description;
  if (typeof description !== 'string') {
    throw new ValidationError('description is required');
  }

  const session = sessionManager.getSession(getSessionId(req));
  await (session.socket as any).groupUpdateDescription(getGroupJid(req), description);
  sendSuccess(res, { message: 'Group description updated' });
}

export async function updateGroupPicture(req: Request, res: Response): Promise<void> {
  const prepared = await prepareMediaForSending(req.body?.content, 'image', req.body?.options);
  if (!prepared?.image) {
    throw new ValidationError('Invalid picture content');
  }

  const session = sessionManager.getSession(getSessionId(req));
  await (session.socket as any).updateProfilePicture(getGroupJid(req), prepared.image);
  sendSuccess(res, { message: 'Group picture updated' });
}

export async function deleteGroupPicture(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  await (session.socket as any).removeProfilePicture(getGroupJid(req));
  sendSuccess(res, { message: 'Group picture removed' });
}

export async function setMessagesAdminsOnly(req: Request, res: Response): Promise<void> {
  const enabled = typeof req.body?.enabled === 'boolean' ? req.body.enabled : true;
  const mode = enabled ? 'announcement' : 'not_announcement';

  const session = sessionManager.getSession(getSessionId(req));
  await (session.socket as any).groupSettingUpdate(getGroupJid(req), mode);
  sendSuccess(res, { message: 'Group messaging setting updated', mode });
}

export async function setInfoAdminsOnly(req: Request, res: Response): Promise<void> {
  const enabled = typeof req.body?.enabled === 'boolean' ? req.body.enabled : true;
  const mode = enabled ? 'locked' : 'unlocked';

  const session = sessionManager.getSession(getSessionId(req));
  await (session.socket as any).groupSettingUpdate(getGroupJid(req), mode);
  sendSuccess(res, { message: 'Group info setting updated', mode });
}

export async function getMembershipRequests(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const result = await (session.socket as any).groupRequestParticipantsList(getGroupJid(req));
  sendSuccess(res, result);
}

export async function approveMembershipRequests(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const result = await (session.socket as any).groupRequestParticipantsUpdate(
    getGroupJid(req),
    getParticipants(req.body?.participants),
    'approve'
  );
  sendSuccess(res, result);
}

export async function rejectMembershipRequests(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const result = await (session.socket as any).groupRequestParticipantsUpdate(
    getGroupJid(req),
    getParticipants(req.body?.participants),
    'reject'
  );
  sendSuccess(res, result);
}

export async function acceptInvite(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const result = await (session.socket as any).groupAcceptInvite(getInviteCode(req));
  sendSuccess(res, result);
}

export async function getInviteInfo(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const result = await (session.socket as any).groupGetInviteInfo(getInviteCode(req));
  sendSuccess(res, result);
}

export async function listAllGroups(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const result = await (session.socket as any).groupFetchAllParticipating();
  sendSuccess(res, result);
}
