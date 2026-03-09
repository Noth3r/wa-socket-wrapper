import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { validateSessionId, createValidateSessionConnected } from '../middleware/session-validation.js';
import { sessionManager } from '../services/session-manager.js';
import {
  getGroupMetadata,
  addParticipants,
  removeParticipants,
  promoteParticipants,
  demoteParticipants,
  getInviteCodeForGroup,
  revokeInvite,
  leaveGroup,
  updateGroupSubject,
  updateGroupDescription,
  updateGroupPicture,
  deleteGroupPicture,
  setMessagesAdminsOnly,
  setInfoAdminsOnly,
  getMembershipRequests,
  approveMembershipRequests,
  rejectMembershipRequests,
  acceptInvite,
  getInviteInfo,
  listAllGroups,
} from '../controllers/group.controller.js';

const router = Router({ mergeParams: true });
const validateSessionConnected = createValidateSessionConnected(sessionManager);

router.use(validateSessionId);
router.use(validateSessionConnected);

router.post('/accept-invite', asyncHandler(acceptInvite));
router.post('/invite-info', asyncHandler(getInviteInfo));
router.get('/', asyncHandler(listAllGroups));

router.get('/:groupId', asyncHandler(getGroupMetadata));

router.post('/:groupId/participants/add', asyncHandler(addParticipants));
router.post('/:groupId/participants/remove', asyncHandler(removeParticipants));
router.post('/:groupId/participants/promote', asyncHandler(promoteParticipants));
router.post('/:groupId/participants/demote', asyncHandler(demoteParticipants));

router.get('/:groupId/invite-code', asyncHandler(getInviteCodeForGroup));
router.post('/:groupId/revoke-invite', asyncHandler(revokeInvite));
router.post('/:groupId/leave', asyncHandler(leaveGroup));

router.put('/:groupId/subject', asyncHandler(updateGroupSubject));
router.put('/:groupId/description', asyncHandler(updateGroupDescription));
router.put('/:groupId/picture', asyncHandler(updateGroupPicture));
router.delete('/:groupId/picture', asyncHandler(deleteGroupPicture));

router.put('/:groupId/settings/messages-admins-only', asyncHandler(setMessagesAdminsOnly));
router.put('/:groupId/settings/info-admins-only', asyncHandler(setInfoAdminsOnly));

router.get('/:groupId/membership-requests', asyncHandler(getMembershipRequests));
router.post('/:groupId/membership-requests/approve', asyncHandler(approveMembershipRequests));
router.post('/:groupId/membership-requests/reject', asyncHandler(rejectMembershipRequests));

export default router;
