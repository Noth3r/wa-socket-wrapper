/**
 * Media Service
 * Utilities for downloading media from Baileys messages and preparing media for sending
 */

import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import type { proto } from '@whiskeysockets/baileys';
import { ValidationError } from '../utils/errors.js';
import { config } from '../config.js';
import type { ContentType, SendMessageOptions } from '../types/message.js';

/**
 * Media download result
 */
export interface MediaDownloadResult {
  buffer: Buffer;
  mimetype: string;
  filename: string;
}

/**
 * Supported media message types
 */
type MediaMessageType = 'image' | 'video' | 'audio' | 'document' | 'sticker';

/**
 * Media message content (extracted from proto.IWebMessageInfo)
 */
interface MediaMessage {
  mimetype?: string | null;
  url?: string | null;
  fileName?: string | null;
  fileLength?: number | { toNumber?: () => number } | null;
}

/**
 * Map of mimetype to file extension
 */
const MIMETYPE_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/3gpp': '3gp',
  'video/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/ogg; codecs=opus': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/zip': 'zip',
  'text/plain': 'txt',
};

/**
 * Detect media type from message
 */
function detectMediaType(message: proto.IWebMessageInfo): MediaMessageType | null {
  if (!message.message) return null;

  if (message.message.imageMessage) return 'image';
  if (message.message.videoMessage) return 'video';
  if (message.message.audioMessage) return 'audio';
  if (message.message.documentMessage) return 'document';
  if (message.message.stickerMessage) return 'sticker';

  return null;
}

/**
 * Get media message content from proto message
 */
function getMediaMessage(
  message: proto.IWebMessageInfo,
  type: MediaMessageType
): MediaMessage | null {
  if (!message.message) return null;

  switch (type) {
    case 'image':
      return message.message.imageMessage || null;
    case 'video':
      return message.message.videoMessage || null;
    case 'audio':
      return message.message.audioMessage || null;
    case 'document':
      return message.message.documentMessage || null;
    case 'sticker':
      return message.message.stickerMessage || null;
    default:
      return null;
  }
}

/**
 * Generate filename from mimetype
 */
function generateFilename(mimetype: string): string {
  const timestamp = Date.now();
  const ext = MIMETYPE_TO_EXT[mimetype] || 'bin';
  return `media-${timestamp}.${ext}`;
}

/**
 * Convert fileLength to number
 */
function fileLengthToNumber(fileLength: number | { toNumber?: () => number } | null | undefined): number {
  if (!fileLength) return 0;
  if (typeof fileLength === 'number') return fileLength;
  // Handle Long.Long from protobufjs
  if (typeof fileLength === 'object' && 'toNumber' in fileLength && typeof fileLength.toNumber === 'function') {
    return fileLength.toNumber();
  }
  return 0;
}

/**
 * Download media from a Baileys message
 * @param message - Baileys proto.IWebMessageInfo message
 * @returns MediaDownloadResult with buffer, mimetype, and filename
 * @throws ValidationError if message has no media or size exceeds limit
 */
export async function downloadMediaFromMessage(
  message: proto.IWebMessageInfo
): Promise<MediaDownloadResult> {
  const mediaType = detectMediaType(message);

  if (!mediaType) {
    throw new ValidationError('Message does not contain media');
  }

  const mediaMessage = getMediaMessage(message, mediaType);

  if (!mediaMessage) {
    throw new ValidationError('Failed to extract media content from message');
  }

  // Check file size before downloading
  const fileLength = fileLengthToNumber(mediaMessage.fileLength);
  if (fileLength > 0 && fileLength > config.MAX_ATTACHMENT_SIZE) {
    throw new ValidationError(
      `Attachment size exceeds maximum allowed (${config.MAX_ATTACHMENT_SIZE} bytes)`
    );
  }

  // Download media content using Baileys
  const stream = await downloadContentFromMessage(mediaMessage as any, mediaType);

  // Concatenate buffer chunks from AsyncGenerator
  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);

    // Real-time size check during download
    if (buffer.length > config.MAX_ATTACHMENT_SIZE) {
      throw new ValidationError(
        `Attachment size exceeds maximum allowed (${config.MAX_ATTACHMENT_SIZE} bytes)`
      );
    }
  }

  // Extract metadata
  const mimetype = mediaMessage.mimetype || 'application/octet-stream';
  const filename = mediaMessage.fileName || generateFilename(mimetype);

  return {
    buffer,
    mimetype,
    filename,
  };
}

/**
 * Prepare media for sending via Baileys
 * @param content - Media content as base64 string, URL, file path, or Buffer
 * @param contentType - Type of content (image, video, audio, document, sticker)
 * @param options - Optional SendMessageOptions (caption, fileName, mimetype)
 * @returns AnyMessageContent format for Baileys sendMessage
 */
export async function prepareMediaForSending(
  content: string | Buffer,
  contentType: ContentType,
  options?: SendMessageOptions
): Promise<any> {
  // Validate content type
  const validMediaTypes: ContentType[] = ['image', 'video', 'audio', 'document', 'sticker'];
  if (!validMediaTypes.includes(contentType)) {
    throw new ValidationError(`Unsupported content type: ${contentType}`);
  }

  let mediaContent: Buffer | { url: string };

  // Handle different content input formats
  if (Buffer.isBuffer(content)) {
    // Content is already a buffer
    mediaContent = content;
  } else if (typeof content === 'string') {
    if (content.startsWith('data:')) {
      // Base64 data URI
      const base64Data = content.split(',')[1] || content;
      mediaContent = Buffer.from(base64Data, 'base64');
    } else if (content.startsWith('http://') || content.startsWith('https://')) {
      // URL - Baileys will fetch it
      mediaContent = { url: content };
    } else {
      // Assume file path
      mediaContent = { url: `file://${content}` };
    }
  } else {
    throw new ValidationError('Content must be a string (URL/path/base64) or Buffer');
  }

  // Build message content based on type
  const messageContent: any = {
    [contentType]: mediaContent,
  };

  // Add optional fields
  if (options?.caption) {
    messageContent.caption = options.caption;
  }

  if (options?.fileName && contentType === 'document') {
    messageContent.fileName = options.fileName;
  }

  if (options?.mimetype) {
    messageContent.mimetype = options.mimetype;
  }

  return messageContent;
}

/**
 * Extract mimetype from a Baileys message
 * @param message - Baileys proto.IWebMessageInfo message
 * @returns Mimetype string or undefined if no media
 */
export function getMediaMimetype(message: proto.IWebMessageInfo): string | undefined {
  const mediaType = detectMediaType(message);
  if (!mediaType) return undefined;

  const mediaMessage = getMediaMessage(message, mediaType);
  return mediaMessage?.mimetype || undefined;
}

/**
 * Extract or generate filename from a Baileys message
 * @param message - Baileys proto.IWebMessageInfo message
 * @returns Filename string or undefined if no media
 */
export function getMediaFilename(message: proto.IWebMessageInfo): string | undefined {
  const mediaType = detectMediaType(message);
  if (!mediaType) return undefined;

  const mediaMessage = getMediaMessage(message, mediaType);
  if (!mediaMessage) return undefined;

  // Use provided filename or generate one
  if (mediaMessage.fileName) {
    return mediaMessage.fileName;
  }

  const mimetype = mediaMessage.mimetype || 'application/octet-stream';
  return generateFilename(mimetype);
}
