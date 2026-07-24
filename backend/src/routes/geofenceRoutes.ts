import { Router } from 'express';
import { listZones, listBreaches } from '../controllers/geofenceController';

const router = Router();

router.get('/', listZones);
router.get('/breaches', listBreaches);

export default router;
