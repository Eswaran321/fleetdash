import { Router } from 'express';
import { getFleetStats } from '../controllers/analyticsController';

const router = Router();

router.get('/stats', getFleetStats);

export default router;
