/**
 * JID (Jabber ID) utilities for WhatsApp Web interactions
 * JID format: phone@s.whatsapp.net (users), group@g.us (groups), newsletter@newsletter
 */

/**
 * Normalize a JID or phone number to standard format
 * Handles phone numbers, groups, and newsletters
 * @param input Phone number or JID
 * @returns Normalized JID
 */
export function normalizeJid(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input: JID must be a non-empty string');
  }

  const trimmedInput = input.trim();

  // If already a valid JID, return as-is
  if (trimmedInput.includes('@')) {
    return trimmedInput;
  }

  // Extract phone number (remove +, spaces, dashes, parentheses)
  const phoneNumber = trimmedInput
    .replace(/[+\s\-()]/g, '')
    .replace(/\D/g, (match, offset) => (offset === 0 ? match : ''));

  // Validate phone number
  if (!phoneNumber || phoneNumber.length < 10) {
    throw new Error(
      `Invalid phone number: ${input} (must contain at least 10 digits)`
    );
  }

  // Convert to WhatsApp user JID format
  return `${phoneNumber}@s.whatsapp.net`;
}

/**
 * Check if a JID is a group JID
 * @param jid JID to check
 * @returns True if JID is a group
 */
export function isGroupJid(jid: string): boolean {
  if (!jid || typeof jid !== 'string') {
    return false;
  }
  return jid.endsWith('@g.us');
}

/**
 * Check if a JID is a newsletter JID
 * @param jid JID to check
 * @returns True if JID is a newsletter
 */
export function isNewsletterJid(jid: string): boolean {
  if (!jid || typeof jid !== 'string') {
    return false;
  }
  return jid.endsWith('@newsletter');
}

/**
 * Extract phone number from a JID
 * @param jid JID to extract from
 * @returns Phone number without formatting
 */
export function extractPhoneNumber(jid: string): string {
  if (!jid || typeof jid !== 'string') {
    throw new Error('Invalid JID: must be a non-empty string');
  }

  // Extract the part before @
  const phoneMatch = jid.split('@')[0];

  if (!phoneMatch) {
    throw new Error(`Invalid JID format: ${jid}`);
  }

  return phoneMatch;
}
