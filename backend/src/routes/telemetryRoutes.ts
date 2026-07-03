import { Router } from 'express';
import { ingestTelemetry } from '../controllers/telemetryController';
import { validateTelemetry } from '../middleware/validator';

const router = Router();

// Route for telemetry ingestion. Validates schema before executing the controller.
router.post('/', validateTelemetry, ingestTelemetry);

export default router;
