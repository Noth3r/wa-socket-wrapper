import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { validateSessionId, createValidateSessionConnected } from '../middleware/session-validation.js';
import { sessionManager } from '../services/session-manager.js';
import {
  sendTypingIndicator,
  sendRecordingIndicator,
  clearPresenceState,
  markMessagesAsRead,
  markChatAsUnread,
  archiveChat,
  unarchiveChat,
  pinChat,
  unpinChat,
  muteChat,
  unmuteChat,
  fetchMessages,
  getChatContact,
  deleteChat,
  clearChatMessages,
  getChatLabels,
  modifyChatLabels,
} from '../controllers/chat.controller.js';

const router = Router({ mergeParams: true });
const validateSessionConnected = createValidateSessionConnected(sessionManager);

router.use(validateSessionId);
router.use(validateSessionConnected);

// Presence indicators
router.post('/chats/:chatId/typing', asyncHandler(sendTypingIndicator));
router.post('/chats/:chatId/recording', asyncHandler(sendRecordingIndicator));
router.post('/chats/:chatId/clear-state', asyncHandler(clearPresenceState));

// Mark read/unread
router.post('/chats/:chatId/seen', asyncHandler(markMessagesAsRead));
router.post('/chats/:chatId/mark-unread', asyncHandler(markChatAsUnread));

// Archive/unarchive
router.post('/chats/:chatId/archive', asyncHandler(archiveChat));
router.post('/chats/:chatId/unarchive', asyncHandler(unarchiveChat));

// Pin/unpin
router.post('/chats/:chatId/pin', asyncHandler(pinChat));
router.post('/chats/:chatId/unpin', asyncHandler(unpinChat));

// Mute/unmute
router.post('/chats/:chatId/mute', asyncHandler(muteChat));
router.post('/chats/:chatId/unmute', asyncHandler(unmuteChat));

// Messages
router.get('/chats/:chatId/messages', asyncHandler(fetchMessages));

// Contact
router.get('/chats/:chatId/contact', asyncHandler(getChatContact));

// Delete/Clear
router.delete('/chats/:chatId', asyncHandler(deleteChat));
router.post('/chats/:chatId/clear', asyncHandler(clearChatMessages));

// Labels
router.get('/chats/:chatId/labels', asyncHandler(getChatLabels));
router.post('/chats/:chatId/labels/modify', asyncHandler(modifyChatLabels));

export default router;
