/**
 * Chat Types
 * Defines chat and conversation related structures
 */

import type { ContactInfo } from './contact.js';

/**
 * Chat information
 */
export interface ChatInfo {
  id: string; // Chat JID (user or group)
  name: string; // Chat name
  isGroup: boolean; // Whether this is a group chat
  isReadOnly?: boolean; // Whether chat is archived/read-only
  isMuted?: boolean; // Whether chat is muted
  unreadCount: number; // Number of unread messages
  lastMessageTime?: number; // Unix timestamp of last message
  lastMessage?: string; // Preview of last message
  participants?: ContactInfo[]; // Participants (for groups)
}

/**
 * Chat update event (new message, status change, etc.)
 */
export interface ChatUpdate {
  chatId: string; // JID of the chat
  type: 'new_message' | 'message_ack' | 'archive_status' | 'mute_status' | 'unread_count';
  data?: unknown; // Update data (depends on type)
  timestamp: number; // Unix timestamp
}
