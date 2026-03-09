/**
 * Group Types
 * Defines group chat related structures
 */

import type { ContactInfo } from './contact.js';

/**
 * Participant in a group chat
 */
export interface GroupParticipant extends ContactInfo {
  isAdmin?: boolean; // Whether participant is a group admin
  isSuperAdmin?: boolean; // Whether participant is a group super admin
  joinedAt?: number; // Unix timestamp when joined
}

/**
 * Group update action type
 */
export type GroupUpdateAction =
  | 'add'
  | 'remove'
  | 'promote'
  | 'demote'
  | 'leave'
  | 'subject'
  | 'description'
  | 'picture'
  | 'announce'
  | 'restrict';

/**
 * Group information
 */
export interface GroupInfo {
  id: string; // Group JID
  name: string; // Group name/subject
  description?: string; // Group description
  participants: GroupParticipant[]; // List of participants
  owner: string; // JID of group creator
  createdAt: number; // Unix timestamp of group creation
  participantsCount: number; // Total number of participants
  isAnnounceOnly?: boolean; // Whether only admins can post
  isRestricted?: boolean; // Whether only admins can add members
  icon?: string; // Group profile picture URL
}

/**
 * Group update event
 */
export interface GroupUpdate {
  groupId: string; // Group JID
  action: GroupUpdateAction; // Type of update
  actor?: string; // JID of user performing action
  targets?: string[]; // JIDs affected by action
  reason?: string; // Additional context (e.g., new subject name)
  timestamp: number; // Unix timestamp of update
}
