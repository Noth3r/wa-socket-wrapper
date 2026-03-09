/**
 * Session Types
 * Defines WhatsApp session lifecycle and configuration
 */

/**
 * Branded type for Session ID to prevent raw string misuse
 */
export type SessionId = string & { readonly __brand: 'SessionId' };

/**
 * Create a branded SessionId from a string
 */
export function createSessionId(id: string): SessionId {
  return id as SessionId;
}

/**
 * Session status enum as string literal union
 * Represents the lifecycle of a WhatsApp session
 */
export type SessionStatus = 'starting' | 'qr_ready' | 'connected' | 'disconnected' | 'terminated';

/**
 * Contact information for authenticated user
 */
export interface ContactInfo {
  id: string;
  name?: string;
  number?: string;
  shortName?: string;
  isBusiness?: boolean;
  isEnterprise?: boolean;
}

/**
 * Session information with current state
 */
export interface SessionInfo {
  id: SessionId;
  status: SessionStatus;
  qr?: string; // QR code data URL (present when status === 'qr_ready')
  me?: ContactInfo; // Current user info (present when status === 'connected')
}

/**
 * Session configuration options
 */
export interface SessionConfig {
  webhookUrl?: string; // Base URL for webhook delivery
  webhookEvents?: string[]; // List of event types to forward via webhook
  autoRestart?: boolean; // Auto-restart session on disconnect
}
