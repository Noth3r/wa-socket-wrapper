/**
 * Contact Types
 * Defines contact/user related structures
 */

/**
 * Contact status in WhatsApp
 */
export type ContactStatus = 'available' | 'away' | 'offline' | 'dnd' | 'unavailable';

/**
 * Contact/User information
 */
export interface ContactInfo {
  id: string; // Contact JID or phone number
  name?: string; // Full name
  number?: string; // Phone number (without country code)
  shortName?: string; // Short/nickname
  status?: ContactStatus; // Current availability status
  statusMessage?: string; // Status/about message
  isBusiness?: boolean; // Whether contact is a business account
  isEnterprise?: boolean; // Whether contact is an enterprise account
  profilePictureUrl?: string; // URL to profile picture
  lastSeen?: number; // Unix timestamp of last activity
}
