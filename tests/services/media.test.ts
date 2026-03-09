import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  downloadMediaFromMessage,
  prepareMediaForSending,
  getMediaMimetype,
  getMediaFilename,
} from '../../src/services/media.js';
import type { ContentType } from '../../src/types/message.js';

// Mock the Baileys downloadContentFromMessage function
vi.mock('@whiskeysockets/baileys', () => ({
  downloadContentFromMessage: vi.fn(),
  proto: {},
}));

import { downloadContentFromMessage } from '@whiskeysockets/baileys';

describe('Media Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('downloadMediaFromMessage', () => {
    it('should download image message and return buffer with metadata', async () => {
      // Mock the AsyncGenerator that Baileys returns
      const mockBuffer = Buffer.from('fake-image-data');
      async function* mockGenerator() {
        yield mockBuffer;
      }
      vi.mocked(downloadContentFromMessage).mockResolvedValue(mockGenerator() as any);

      const mockMessage = {
        key: { id: 'msg1' },
        message: {
          imageMessage: {
            mimetype: 'image/jpeg',
            url: 'https://example.com/image.jpg',
            mediaKey: Buffer.from('key'),
          },
        },
      };

      const result = await downloadMediaFromMessage(mockMessage as any);

      expect(result).toHaveProperty('buffer');
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBe(mockBuffer.length);
      expect(result.mimetype).toBe('image/jpeg');
      expect(result.filename).toMatch(/\.(jpg|jpeg)$/);
    });

    it('should download video message', async () => {
      const mockBuffer = Buffer.from('fake-video-data');
      async function* mockGenerator() {
        yield mockBuffer;
      }
      vi.mocked(downloadContentFromMessage).mockResolvedValue(mockGenerator() as any);

      const mockMessage = {
        key: { id: 'msg2' },
        message: {
          videoMessage: {
            mimetype: 'video/mp4',
            url: 'https://example.com/video.mp4',
            mediaKey: Buffer.from('key'),
          },
        },
      };

      const result = await downloadMediaFromMessage(mockMessage as any);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.mimetype).toBe('video/mp4');
    });

    it('should download audio message', async () => {
      const mockBuffer = Buffer.from('fake-audio-data');
      async function* mockGenerator() {
        yield mockBuffer;
      }
      vi.mocked(downloadContentFromMessage).mockResolvedValue(mockGenerator() as any);

      const mockMessage = {
        key: { id: 'msg3' },
        message: {
          audioMessage: {
            mimetype: 'audio/ogg; codecs=opus',
            url: 'https://example.com/audio.ogg',
            mediaKey: Buffer.from('key'),
          },
        },
      };

      const result = await downloadMediaFromMessage(mockMessage as any);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.mimetype).toBe('audio/ogg; codecs=opus');
    });

    it('should download document message with filename', async () => {
      const mockBuffer = Buffer.from('fake-pdf-data');
      async function* mockGenerator() {
        yield mockBuffer;
      }
      vi.mocked(downloadContentFromMessage).mockResolvedValue(mockGenerator() as any);

      const mockMessage = {
        key: { id: 'msg4' },
        message: {
          documentMessage: {
            mimetype: 'application/pdf',
            fileName: 'report.pdf',
            url: 'https://example.com/document.pdf',
            mediaKey: Buffer.from('key'),
          },
        },
      };

      const result = await downloadMediaFromMessage(mockMessage as any);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.mimetype).toBe('application/pdf');
      expect(result.filename).toBe('report.pdf');
    });

    it('should download sticker message', async () => {
      const mockBuffer = Buffer.from('fake-sticker-data');
      async function* mockGenerator() {
        yield mockBuffer;
      }
      vi.mocked(downloadContentFromMessage).mockResolvedValue(mockGenerator() as any);

      const mockMessage = {
        key: { id: 'msg5' },
        message: {
          stickerMessage: {
            mimetype: 'image/webp',
            url: 'https://example.com/sticker.webp',
            mediaKey: Buffer.from('key'),
          },
        },
      };

      const result = await downloadMediaFromMessage(mockMessage as any);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.mimetype).toBe('image/webp');
    });

    it('should enforce max attachment size limit', async () => {
      const mockMessage = {
        key: { id: 'msg6' },
        message: {
          imageMessage: {
            mimetype: 'image/jpeg',
            fileLength: 20 * 1024 * 1024, // 20MB
            url: 'https://example.com/large.jpg',
          },
        },
      };

      await expect(downloadMediaFromMessage(mockMessage as any)).rejects.toThrow(
        'Attachment size exceeds maximum allowed'
      );
    });

    it('should throw error for message without media', async () => {
      const mockMessage = {
        key: { id: 'msg7' },
        message: {
          conversation: 'Hello',
        },
      };

      await expect(downloadMediaFromMessage(mockMessage as any)).rejects.toThrow(
        'Message does not contain media'
      );
    });

    it('should generate filename when not provided', async () => {
      const mockBuffer = Buffer.from('fake-png-data');
      async function* mockGenerator() {
        yield mockBuffer;
      }
      vi.mocked(downloadContentFromMessage).mockResolvedValue(mockGenerator() as any);

      const mockMessage = {
        key: { id: 'msg8' },
        message: {
          imageMessage: {
            mimetype: 'image/png',
            url: 'https://example.com/image',
            mediaKey: Buffer.from('key'),
          },
        },
      };

      const result = await downloadMediaFromMessage(mockMessage as any);

      expect(result.filename).toMatch(/^media-\d+\.png$/);
    });

    it('should enforce size limit during download', async () => {
      // Mock a large download that exceeds limit
      const largeChunk = Buffer.alloc(11 * 1024 * 1024); // 11MB
      async function* mockGenerator() {
        yield largeChunk;
      }
      vi.mocked(downloadContentFromMessage).mockResolvedValue(mockGenerator() as any);

      const mockMessage = {
        key: { id: 'msg9' },
        message: {
          imageMessage: {
            mimetype: 'image/jpeg',
            url: 'https://example.com/large.jpg',
            mediaKey: Buffer.from('key'),
          },
        },
      };

      await expect(downloadMediaFromMessage(mockMessage as any)).rejects.toThrow(
        'Attachment size exceeds maximum allowed'
      );
    });
  });

  describe('prepareMediaForSending', () => {
    it('should convert base64 string to buffer for image', async () => {
      const base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const contentType: ContentType = 'image';

      const result = await prepareMediaForSending(base64, contentType);

      expect(result).toHaveProperty('image');
      expect(result.image).toBeInstanceOf(Buffer);
    });

    it('should handle URL for image', async () => {
      const url = 'https://example.com/image.jpg';
      const contentType: ContentType = 'image';

      const result = await prepareMediaForSending(url, contentType);

      expect(result).toHaveProperty('image');
      expect(result.image).toEqual({ url });
    });

    it('should handle file path for video', async () => {
      const filePath = './media/video.mp4';
      const contentType: ContentType = 'video';

      const result = await prepareMediaForSending(filePath, contentType);

      expect(result).toHaveProperty('video');
      expect(result.video).toEqual({ url: `file://${filePath}` });
    });

    it('should include caption when provided', async () => {
      const url = 'https://example.com/image.jpg';
      const contentType: ContentType = 'image';
      const options = { caption: 'Test caption' };

      const result = await prepareMediaForSending(url, contentType, options);

      expect(result.caption).toBe('Test caption');
    });

    it('should handle base64 for video', async () => {
      const base64 = 'data:video/mp4;base64,AAAAIGZ0eXBpc29t';
      const contentType: ContentType = 'video';

      const result = await prepareMediaForSending(base64, contentType);

      expect(result).toHaveProperty('video');
      expect(result.video).toBeInstanceOf(Buffer);
    });

    it('should handle base64 for audio', async () => {
      const base64 = 'data:audio/ogg;base64,T2dnUw==';
      const contentType: ContentType = 'audio';

      const result = await prepareMediaForSending(base64, contentType);

      expect(result).toHaveProperty('audio');
      expect(result.audio).toBeInstanceOf(Buffer);
    });

    it('should handle document with fileName and mimetype', async () => {
      const url = 'https://example.com/document.pdf';
      const contentType: ContentType = 'document';
      const options = { fileName: 'report.pdf', mimetype: 'application/pdf' };

      const result = await prepareMediaForSending(url, contentType, options);

      expect(result).toHaveProperty('document');
      expect(result.fileName).toBe('report.pdf');
      expect(result.mimetype).toBe('application/pdf');
    });

    it('should handle sticker from base64', async () => {
      const base64 = 'data:image/webp;base64,UklGRg==';
      const contentType: ContentType = 'sticker';

      const result = await prepareMediaForSending(base64, contentType);

      expect(result).toHaveProperty('sticker');
      expect(result.sticker).toBeInstanceOf(Buffer);
    });

    it('should throw error for unsupported content type', async () => {
      const url = 'https://example.com/file';
      const contentType = 'unsupported' as ContentType;

      await expect(prepareMediaForSending(url, contentType)).rejects.toThrow(
        'Unsupported content type'
      );
    });

    it('should handle buffer input directly', async () => {
      const buffer = Buffer.from('test data');
      const contentType: ContentType = 'image';

      const result = await prepareMediaForSending(buffer, contentType);

      expect(result).toHaveProperty('image');
      expect(result.image).toBe(buffer);
    });
  });

  describe('getMediaMimetype', () => {
    it('should extract mimetype from image message', () => {
      const message = {
        message: {
          imageMessage: {
            mimetype: 'image/jpeg',
          },
        },
      };

      const mimetype = getMediaMimetype(message as any);

      expect(mimetype).toBe('image/jpeg');
    });

    it('should extract mimetype from video message', () => {
      const message = {
        message: {
          videoMessage: {
            mimetype: 'video/mp4',
          },
        },
      };

      const mimetype = getMediaMimetype(message as any);

      expect(mimetype).toBe('video/mp4');
    });

    it('should extract mimetype from document message', () => {
      const message = {
        message: {
          documentMessage: {
            mimetype: 'application/pdf',
          },
        },
      };

      const mimetype = getMediaMimetype(message as any);

      expect(mimetype).toBe('application/pdf');
    });

    it('should return undefined for text message', () => {
      const message = {
        message: {
          conversation: 'Hello',
        },
      };

      const mimetype = getMediaMimetype(message as any);

      expect(mimetype).toBeUndefined();
    });
  });

  describe('getMediaFilename', () => {
    it('should extract filename from document message', () => {
      const message = {
        message: {
          documentMessage: {
            fileName: 'report.pdf',
            mimetype: 'application/pdf',
          },
        },
      };

      const filename = getMediaFilename(message as any);

      expect(filename).toBe('report.pdf');
    });

    it('should generate filename for image without filename', () => {
      const message = {
        key: { id: 'msg123' },
        message: {
          imageMessage: {
            mimetype: 'image/jpeg',
          },
        },
      };

      const filename = getMediaFilename(message as any);

      expect(filename).toMatch(/^media-\d+\.jpg$/);
    });

    it('should generate filename for video without filename', () => {
      const message = {
        key: { id: 'msg456' },
        message: {
          videoMessage: {
            mimetype: 'video/mp4',
          },
        },
      };

      const filename = getMediaFilename(message as any);

      expect(filename).toMatch(/^media-\d+\.mp4$/);
    });

    it('should generate filename for audio without filename', () => {
      const message = {
        key: { id: 'msg789' },
        message: {
          audioMessage: {
            mimetype: 'audio/ogg',
          },
        },
      };

      const filename = getMediaFilename(message as any);

      expect(filename).toMatch(/^media-\d+\.ogg$/);
    });

    it('should return undefined for text message', () => {
      const message = {
        message: {
          conversation: 'Hello',
        },
      };

      const filename = getMediaFilename(message as any);

      expect(filename).toBeUndefined();
    });
  });
});
