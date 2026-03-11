/**
 * Normalized Webhook Message Types
 * Standardized message format for messages.upsert webhook events
 */

import { ContentType } from './message.js';
import { WAMessage } from '@whiskeysockets/baileys';

/**
 * Extra metadata for normalized messages (forwarding, replies, mentions)
 */
export interface NormalizedExtraData {
  is_forwarded: boolean;
  forwarding_score: number;
  replied_to_message_id: string | null;
  quoted_message: NormalizedWebhookMessage | null;
  mentions: string[];
}

/**
 * Normalized message format for consistent webhook payload structure
 */
export interface NormalizedWebhookMessage {
  id: string;
  chat_id: string;
  from: string;
  from_me: boolean;
  push_name: string | null;
  is_group: boolean;
  timestamp: number;
  type: ContentType;
  body: string | null;
  has_media: boolean;
  extra_data: NormalizedExtraData;
  raw_message: unknown;
}

/**
 * Normalized messages.upsert event data replacing raw MessageUpsertData
 */
export interface NormalizedMessagesUpsertData {
  messages: NormalizedWebhookMessage[];
  type: 'notify' | 'append';
}
