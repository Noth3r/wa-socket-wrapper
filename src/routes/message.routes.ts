import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { validateSessionId, createValidateSessionConnected } from '../middleware/session-validation.js';
import { sessionManager } from '../services/session-manager.js';
import {
  deleteMessage,
  editMessage,
  reactToMessage,
  forwardMessage,
  starMessage,
  unstarMessage,
  replyToMessage,
  downloadMedia,
  downloadMediaStream,
  getMessageInfo,
  getMessageMentions,
  getQuotedMessage,
  getMessageReactions,
  getPollVotes,
  getMessageContact,
} from '../controllers/message.controller.js';

const router = Router({ mergeParams: true });
const validateSessionConnected = createValidateSessionConnected(sessionManager);

router.use(validateSessionId);
router.use(validateSessionConnected);

router.post('/delete', asyncHandler(deleteMessage));
router.post('/edit', asyncHandler(editMessage));
router.post('/react', asyncHandler(reactToMessage));
router.post('/forward', asyncHandler(forwardMessage));
router.post('/star', asyncHandler(starMessage));
router.post('/unstar', asyncHandler(unstarMessage));
router.post('/reply', asyncHandler(replyToMessage));
router.post('/download-media', asyncHandler(downloadMedia));
router.post('/download-media/stream', asyncHandler(downloadMediaStream));
router.post('/info', asyncHandler(getMessageInfo));
router.post('/mentions', asyncHandler(getMessageMentions));
router.post('/quoted', asyncHandler(getQuotedMessage));
router.post('/reactions', asyncHandler(getMessageReactions));
router.post('/poll-votes', asyncHandler(getPollVotes));
router.post('/contact', asyncHandler(getMessageContact));

export default router;
