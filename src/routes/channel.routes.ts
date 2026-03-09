import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { validateSessionId, createValidateSessionConnected } from '../middleware/session-validation.js';
import { sessionManager } from '../services/session-manager.js';
import {
  getNewsletterInfo,
  sendMessageToNewsletter,
  fetchNewsletterMessages,
  sendSeenToNewsletter,
  muteNewsletter,
  unmuteNewsletter,
  setNewsletterProfilePicture,
  setNewsletterDescription,
  setNewsletterSubject,
  deleteNewsletter,
  getNewsletterSubscribers,
  setNewsletterReactionSetting,
  inviteToNewsletter,
  acceptNewsletterInvite,
  revokeNewsletterInvite,
  transferNewsletterOwnership,
  demoteNewsletterAdmin,
} from '../controllers/channel.controller.js';

const router = Router({ mergeParams: true });
const validateSessionConnected = createValidateSessionConnected(sessionManager);

router.use(validateSessionId);
router.use(validateSessionConnected);

// Basic operations
router.post('/info', asyncHandler(getNewsletterInfo));
router.post('/send-message', asyncHandler(sendMessageToNewsletter));
router.post('/fetch-messages', asyncHandler(fetchNewsletterMessages));
router.post('/send-seen', asyncHandler(sendSeenToNewsletter));
router.post('/mute', asyncHandler(muteNewsletter));
router.post('/unmute', asyncHandler(unmuteNewsletter));

// Settings operations
router.post('/set-profile-picture', asyncHandler(setNewsletterProfilePicture));
router.post('/set-description', asyncHandler(setNewsletterDescription));
router.post('/set-subject', asyncHandler(setNewsletterSubject));
router.delete('/:channelId', asyncHandler(deleteNewsletter));
router.post('/subscribers', asyncHandler(getNewsletterSubscribers));
router.post('/set-reaction-setting', asyncHandler(setNewsletterReactionSetting));

// Admin operations
router.post('/admin/invite', asyncHandler(inviteToNewsletter));
router.post('/admin/accept-invite', asyncHandler(acceptNewsletterInvite));
router.post('/admin/revoke-invite', asyncHandler(revokeNewsletterInvite));
router.post('/admin/transfer-ownership', asyncHandler(transferNewsletterOwnership));
router.post('/admin/demote', asyncHandler(demoteNewsletterAdmin));

export default router;
