import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { validateSessionId, createValidateSessionConnected } from '../middleware/session-validation.js';
import { sessionManager } from '../services/session-manager.js';
import {
  sendMessage,
  getContacts,
  getChats,
  searchChats,
  getChatById,
  getContactById,
  isRegistered,
  getNumberId,
  getProfilePictureUrl,
  setStatus,
  setDisplayName,
  setProfilePicture,
  deleteProfilePicture,
  createGroup,
  presenceAvailable,
  presenceUnavailable,
  searchMessages,
  getBlockedContacts,
  getLabels,
  getLabelById,
  getLabelsForChat,
  getChatsByLabelId,
  modifyLabels,
} from '../controllers/client.controller.js';

const router = Router({ mergeParams: true });
const validateSessionConnected = createValidateSessionConnected(sessionManager);

router.use(validateSessionId);
router.use(validateSessionConnected);

router.post('/send-message', asyncHandler(sendMessage));

router.get('/contacts', asyncHandler(getContacts));
router.get('/chats', asyncHandler(getChats));
router.post('/chats', asyncHandler(searchChats));
router.post('/chat/:chatId', asyncHandler(getChatById));
router.post('/contact/:contactId', asyncHandler(getContactById));

router.post('/is-registered', asyncHandler(isRegistered));
router.post('/number-id', asyncHandler(getNumberId));
router.post('/profile-picture-url', asyncHandler(getProfilePictureUrl));
router.post('/set-status', asyncHandler(setStatus));
router.post('/set-display-name', asyncHandler(setDisplayName));
router.post('/set-profile-picture', asyncHandler(setProfilePicture));
router.delete('/profile-picture', asyncHandler(deleteProfilePicture));
router.post('/create-group', asyncHandler(createGroup));

router.post('/presence/available', asyncHandler(presenceAvailable));
router.post('/presence/unavailable', asyncHandler(presenceUnavailable));

router.post('/search-messages', asyncHandler(searchMessages));
router.get('/blocked-contacts', asyncHandler(getBlockedContacts));
router.get('/labels', asyncHandler(getLabels));
router.post('/labels/:labelId', asyncHandler(getLabelById));
router.post('/labels/chat/:chatId', asyncHandler(getLabelsForChat));
router.post('/labels/:labelId/chats', asyncHandler(getChatsByLabelId));
router.post('/labels/modify', asyncHandler(modifyLabels));

export default router;
