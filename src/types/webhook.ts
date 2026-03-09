/**
 * Webhook Types
 * Defines webhook event types and payload structure
 */

/**
 * Supported webhook event types (23 from Baileys)
 * Maps to BaileysEventMap from the underlying library
 */
export type WebhookEvent =
  // Session events
  | 'connection.update'
  | 'qr'
  | 'auth.update'
  | 'creds.update'
  // Message events
  | 'messages.upsert'
  | 'messages.update'
  | 'messages.delete'
  | 'messages.reaction'
  // Chat events
  | 'chats.upsert'
  | 'chats.update'
  | 'chats.delete'
  | 'chats.set'
  // Contact events
  | 'contacts.upsert'
  | 'contacts.update'
  | 'contacts.set'
  // Group events
  | 'groups.update'
  | 'group-participants.update'
  // Presence/Status events
  | 'presence.update'
  | 'status.set'
  // Blocklist events
  | 'blocklist.update'
  // Call events
  | 'call'
  // Media/Label events
  | 'labels.association'
  | 'labels.edit';

/**
 * Generic webhook payload wrapper
 * All webhook events follow this structure
 */
export interface WebhookPayload<T = unknown> {
  sessionId: string; // Session identifier this event came from
  event: WebhookEvent; // Event type name
  data: T; // Event-specific data
  timestamp: number; // Unix timestamp in milliseconds
}

/**
 * Connection update event data
 */
export interface ConnectionUpdateData {
  connection?: 'open' | 'close' | 'connecting';
  lastDisconnect?: {
    error?: {
      output?: {
        statusCode?: number;
        payload?: unknown;
      };
    };
    date: number;
  };
  isNewLogin?: boolean;
  qr?: string;
  receivedPendingNotifications?: boolean;
}

/**
 * Message upsert event data (new or updated message)
 */
export interface MessageUpsertData {
  messages: Array<{
    key: {
      remoteJid: string;
      id: string;
      fromMe?: boolean;
    };
    message?: {
      conversation?: string;
      imageMessage?: { caption?: string };
      videoMessage?: { caption?: string };
      documentMessage?: { fileName?: string };
      stickerMessage?: unknown;
      contactMessage?: unknown;
      locationMessage?: unknown;
    };
    messageTimestamp?: number;
    pushName?: string;
  }>;
  type: 'notify' | 'append';
}

/**
 * Presence update event data
 */
export interface PresenceUpdateData {
  id: string; // JID
  presences: {
    [key: string]: 'unavailable' | 'available' | 'composing' | 'recording';
  };
}

/**
 * Group participants update event data
 */
export interface GroupParticipantsUpdateData {
  id: string; // Group JID
  participants: string[]; // JIDs of affected participants
  action: 'add' | 'remove' | 'promote' | 'demote';
}
