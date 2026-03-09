/**
 * Barrel export for all type definitions
 * Centralizes type imports for cleaner imports across the application
 */

// Session types
export type { SessionId, SessionStatus, ContactInfo, SessionInfo, SessionConfig } from './session.js';
export { createSessionId } from './session.js';

// Message types
export type { ContentType, SendMessageOptions, SendMessageRequest, MessageInfo } from './message.js';

// Chat types
export type { ChatInfo, ChatUpdate } from './chat.js';

// Group types
export type {
  GroupParticipant,
  GroupUpdateAction,
  GroupInfo,
  GroupUpdate,
} from './group.js';

// Contact types
export type { ContactStatus, ContactInfo as Contact } from './contact.js';

// Webhook types
export type {
  WebhookEvent,
  WebhookPayload,
  ConnectionUpdateData,
  MessageUpsertData,
  PresenceUpdateData,
  GroupParticipantsUpdateData,
} from './webhook.js';

// API response types
export type { ApiResponse, PaginationInfo, PaginatedResponse } from './api.js';
export { isPaginatedResponse } from './api.js';
