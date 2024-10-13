import { Router } from 'express';
import guildRoute from './guild/index';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.use('/guild', guildRoute);
router.use('/auth', authMiddleware);

export default router;
