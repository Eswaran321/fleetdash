import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

/**
 * Validator rules for the POST /telemetry API request.
 * Enforces types, values ranges, and formats before ingestion.
 */
export const validateTelemetry = [
  body('vehicleId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('vehicleId must be a non-empty string.'),

  body('gpsString')
    .isString()
    .trim()
    .notEmpty()
    .matches(/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/)
    .withMessage('gpsString must be in the format "latitude,longitude" (decimal numbers).'),

  body('speed')
    .isNumeric()
    .withMessage('speed must be a numeric value (km/h) equal to or greater than 0.')
    .custom((val) => Number(val) >= 0)
    .withMessage('speed cannot be negative.'),

  body('fuel')
    .isNumeric()
    .withMessage('fuel must be a numeric value.')
    .custom((val) => {
      const num = Number(val);
      return num >= 0 && num <= 100;
    })
    .withMessage('fuel percentage must be between 0 and 100.'),

  body('engineTemp')
    .isNumeric()
    .withMessage('engineTemp must be a numeric value.'),

  // Handle validator output and report errors.
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((err: any) => ({
          field: err.path,
          message: err.msg,
        })),
      });
    }
    next();
  },
];
