import { Request, Response } from 'express';
import { sessionManager } from '../services/session-manager.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { normalizeJid } from '../utils/jid.js';
import { jidDecode } from '@whiskeysockets/baileys';

function getSessionId(req: Request): string {
  const sessionId = req.params.sessionId;
  if (typeof sessionId !== 'string' || sessionId.trim() === '') {
    throw new ValidationError('Invalid session ID');
  }
  return sessionId;
}

function parseJid(input: unknown): string {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new ValidationError('jid is required');
  }
  try {
    return normalizeJid(input);
  } catch (error) {
    throw new ValidationError(`Invalid JID: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function extractCountryCode(jid: string): string | null {
  try {
    const decoded = jidDecode(jid);
    if (!decoded?.user) return null;
    
    // Country codes are 1-3 digits at the start of the phone number
    // Use more precise country code extraction
    const phoneNumber = decoded.user;
    
    // Known country code patterns (1-3 digits)
    // Priority: check 3-digit, then 2-digit, then 1-digit
    if (phoneNumber.match(/^(1[2-9]\d{8})/)) return '1'; // NANP (US, Canada, etc.)
    if (phoneNumber.match(/^(62)/)) return '62'; // Indonesia
    if (phoneNumber.match(/^(91)/)) return '91'; // India
    if (phoneNumber.match(/^(44)/)) return '44'; // UK
    
    // Generic fallback: extract up to 3 digits
    const countryCodeMatch = phoneNumber.match(/^(\d{1,3})/);
    return countryCodeMatch ? countryCodeMatch[1] : null;
  } catch {
    return null;
  }
}

export async function getContactInfo(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const jid = parseJid(req.body?.jid);
  
  const store = session.store as any;
  const contact = store?.contacts instanceof Map ? store.contacts.get(jid) : undefined;
  
  if (!contact) {
    throw new NotFoundError('Contact not found in store');
  }
  
  sendSuccess(res, contact);
}

export async function blockContact(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const sock: any = session.socket;
  const jid = parseJid(req.body?.jid);
  
  const result = await sock.updateBlockStatus(jid, 'block');
  sendSuccess(res, { message: 'Contact blocked', result });
}

export async function unblockContact(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const sock: any = session.socket;
  const jid = parseJid(req.body?.jid);
  
  const result = await sock.updateBlockStatus(jid, 'unblock');
  sendSuccess(res, { message: 'Contact unblocked', result });
}

export async function getContactAbout(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const sock: any = session.socket;
  const jid = parseJid(req.body?.jid);
  
  const status = await sock.fetchStatus(jid);
  sendSuccess(res, { status: status?.status || null });
}

export async function getContactChat(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const jid = parseJid(req.body?.jid);
  
  const store = session.store as any;
  const chat = store?.chats instanceof Map ? store.chats.get(jid) : undefined;
  
  sendSuccess(res, chat || null);
}

export async function getContactProfilePicture(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const sock: any = session.socket;
  const jid = parseJid(req.body?.jid);
  
  try {
    const url = await sock.profilePictureUrl(jid, 'image');
    sendSuccess(res, { url: url || null });
  } catch (error: any) {
    // Handle privacy restrictions - profilePictureUrl throws when not available
    if (error?.output?.statusCode === 404 || error?.message?.includes('item-not-found')) {
      sendSuccess(res, { url: null });
    } else {
      throw error;
    }
  }
}

export async function getFormattedNumber(req: Request, res: Response): Promise<void> {
  const jid = parseJid(req.body?.jid);
  
  try {
    const decoded = jidDecode(jid);
    if (!decoded?.user) {
      throw new ValidationError('Unable to extract phone number from JID');
    }
    sendSuccess(res, { formattedNumber: decoded.user });
  } catch (error) {
    throw new ValidationError(`Failed to decode JID: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getContactCountryCode(req: Request, res: Response): Promise<void> {
  const jid = parseJid(req.body?.jid);
  
  const countryCode = extractCountryCode(jid);
  if (!countryCode) {
    throw new ValidationError('Unable to extract country code from JID');
  }
  
  sendSuccess(res, { countryCode });
}

export async function getCommonGroups(req: Request, res: Response): Promise<void> {
  const session = sessionManager.getSession(getSessionId(req));
  const sock: any = session.socket;
  const jid = parseJid(req.body?.jid);
  
  // Fetch all groups the current user is in
  const groups = await sock.groupFetchAllParticipating();
  
  // Filter groups where the contact is a participant
  const commonGroups = Object.values(groups).filter((group: any) => {
    return group.participants?.some((participant: any) => participant.id === jid);
  });
  
  sendSuccess(res, commonGroups);
}
