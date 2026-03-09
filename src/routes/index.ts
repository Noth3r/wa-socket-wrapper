import { Router } from 'express';
import healthRoutes from './health.routes.js';
import sessionRoutes from './session.routes.js';
import clientRoutes from './client.routes.js';
import messageRoutes from './message.routes.js';
import chatRoutes from './chat.routes.js';
import groupRoutes from './group.routes.js';
import contactRoutes from './contact.routes.js';
import channelRoutes from './channel.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/sessions', sessionRoutes);
router.use('/sessions/:sessionId/client', clientRoutes);
router.use('/sessions/:sessionId/messages', messageRoutes);
router.use('/sessions/:sessionId/chats', chatRoutes);
router.use('/sessions/:sessionId/groups', groupRoutes);
router.use('/sessions/:sessionId/contacts', contactRoutes);
router.use('/sessions/:sessionId/channels', channelRoutes);

export default router;
