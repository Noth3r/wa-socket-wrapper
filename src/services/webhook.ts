import axios, { AxiosError } from 'axios';
import { config } from '../config.js';
import { createLogger } from '../logger.js';
import type { WebhookEvent } from '../types/webhook.js';
import type { SessionConfig } from '../types/session.js';

const logger = createLogger('WebhookDispatcher');

/**
 * WebhookDispatcher - Sends webhook notifications for WhatsApp events
 * 
 * Features:
 * - Respects config.enableWebhook and config.disabledCallbacks filters
 * - Supports per-session webhook URLs with fallback to base URL
 * - Includes x-api-key header if configured
 * - Fire-and-forget delivery with retry logic
 * - Proper logging of delivery success/failure
 */
export class WebhookDispatcher {
  /**
   * Dispatch a webhook event
   * 
   * @param sessionId - Session identifier
   * @param event - Webhook event type
   * @param data - Event-specific data
   * @param sessionConfig - Optional per-session configuration
   */
  async dispatch(
    sessionId: string,
    event: WebhookEvent,
    data: unknown,
    sessionConfig?: SessionConfig
  ): Promise<void> {
    // Check if webhooks are enabled globally
    if (!config.ENABLE_WEBHOOK) {
      logger.debug({ sessionId, event }, 'Webhook dispatch skipped: webhooks disabled');
      return;
    }

    // Check if this event type is disabled
    if (config.DISABLED_CALLBACKS.has(event)) {
      logger.debug({ sessionId, event }, 'Webhook dispatch skipped: event disabled in callbacks');
      return;
    }

    // Check if session has a webhookEvents filter and this event is not in it
    if (sessionConfig?.webhookEvents?.length && !sessionConfig.webhookEvents.includes(event)) {
      logger.debug({ sessionId, event }, 'Webhook dispatch skipped: event not in session webhookEvents filter');
      return;
    }

    // Determine webhook URL (prefer session-specific over base)
    const webhookUrl = sessionConfig?.webhookUrl || config.BASE_WEBHOOK_URL;
    
    if (!webhookUrl) {
      logger.warn({ sessionId, event }, 'Webhook dispatch skipped: no webhook URL configured');
      return;
    }

    // Build payload (using ISO string for timestamp as per wwebjs-api pattern)
    const payload = {
      sessionId,
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.API_KEY) {
      headers['x-api-key'] = config.API_KEY;
    }

    // Fire-and-forget dispatch with retry
    this.sendWithRetry(webhookUrl, payload, headers, sessionId, event).catch((error) => {
      logger.error(
        { sessionId, event, error: error.message },
        'Webhook delivery failed after retry'
      );
    });
  }

  /**
   * Send webhook with retry logic
   * 
   * @param url - Webhook URL
   * @param payload - Webhook payload
   * @param headers - Request headers
   * @param sessionId - Session ID for logging
   * @param event - Event type for logging
   */
  private async sendWithRetry(
    url: string,
    payload: Record<string, unknown>,
    headers: Record<string, string>,
    sessionId: string,
    event: WebhookEvent
  ): Promise<void> {
    const maxAttempts = 2; // Initial attempt + 1 retry
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await axios.post(url, payload, {
          timeout: 5000,
          headers,
        });

        logger.info(
          { sessionId, event, url, attempt },
          'Webhook delivered successfully'
        );
        return;
      } catch (error) {
        lastError = error as Error;
        
        const errorMessage = error instanceof AxiosError 
          ? error.message 
          : String(error);

        if (attempt < maxAttempts) {
          logger.warn(
            { sessionId, event, url, attempt, error: errorMessage },
            'Webhook delivery failed, retrying...'
          );
        } else {
          logger.error(
            { sessionId, event, url, attempt, error: errorMessage },
            'Webhook delivery failed after all retries'
          );
        }
      }
    }

    // Re-throw the last error so the caller's .catch() can handle it
    throw lastError;
  }
}

/**
 * Singleton instance of WebhookDispatcher
 */
export const webhookDispatcher = new WebhookDispatcher();

export default webhookDispatcher;
