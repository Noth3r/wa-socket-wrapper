/**
 * Message Types
 * Defines message content types and sending/receiving structures
 */

/**
 * Supported content types for sending and receiving messages
 */
export type ContentType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'location'
  | 'contact'
  | 'poll'
  | 'sticker';

/**
 * Options for sending a message
 */
export interface SendMessageOptions {
  quotedMessageId?: string; // Message ID to quote/reply to
  mentions?: string[]; // JIDs of users to mention (@user)
  mentionAll?: boolean; // When true, @all mention -- overrides individual mentions
  caption?: string; // Caption for media messages
  fileName?: string; // Custom filename for document messages
  mimetype?: string; // MIME type for document/media messages
}

/**
 * Request to send a message
 */
export interface SendMessageRequest {
  chatId: string; // JID of the chat (user or group)
  contentType: ContentType; // Type of content being sent
  content: unknown; // Content payload (format depends on contentType)
  options?: SendMessageOptions; // Additional message options
}

/**
 * Normalized message information for API responses
 */
export interface MessageInfo {
  id: string; // Message ID (server assigned)
  chatId: string; // JID of the chat this message belongs to
  fromId: string; // JID of the sender
  toId?: string; // JID of the recipient (for direct messages)
  timestamp: number; // Unix timestamp in seconds
  type: ContentType; // Message content type
  body?: string; // Text content or caption
  media?: {
    url?: string; // URL to download media
    mimetype?: string;
    filename?: string;
    size?: number; // File size in bytes
  };
  isFromMe: boolean; // Whether message was sent by the authenticated user
  hasMedia: boolean; // Whether message contains media attachment
  isQuoted: boolean; // Whether message is a reply/quote
  quotedMessageId?: string; // ID of quoted message
  mentions?: string[]; // JIDs of mentioned users
  poll?: {
    name: string; // Poll question
    options: Array<{ name: string; count: number }>;
    selectableOptionsCount?: number;
  };
}
