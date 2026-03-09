import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { validateSessionId, createValidateSessionConnected } from '../middleware/session-validation.js';
import { sessionManager } from '../services/session-manager.js';
import {
  getContactInfo,
  blockContact,
  unblockContact,
  getContactAbout,
  getContactChat,
  getContactProfilePicture,
  getFormattedNumber,
  getContactCountryCode,
  getCommonGroups,
} from '../controllers/contact.controller.js';

const router = Router({ mergeParams: true });
const validateSessionConnected = createValidateSessionConnected(sessionManager);

router.use(validateSessionId);
router.use(validateSessionConnected);

router.post('/info', asyncHandler(getContactInfo));
router.post('/block', asyncHandler(blockContact));
router.post('/unblock', asyncHandler(unblockContact));
router.post('/about', asyncHandler(getContactAbout));
router.post('/chat', asyncHandler(getContactChat));
router.post('/profile-picture', asyncHandler(getContactProfilePicture));
router.post('/formatted-number', asyncHandler(getFormattedNumber));
router.post('/country-code', asyncHandler(getContactCountryCode));
router.post('/common-groups', asyncHandler(getCommonGroups));

export default router;
