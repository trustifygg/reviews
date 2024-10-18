import { Router } from 'express';
import guildRoute from './guild';
import authRoute from './auth';
import dashboardRoute from './dashboard';

const router = Router();

router.use('/guild', guildRoute);
router.use('/auth', authRoute);
router.use('/dashboard', dashboardRoute);

export default router;
