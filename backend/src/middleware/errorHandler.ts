import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
}

/**
 * Express error-handling middleware. Captures all unhandled exceptions
 * thrown in routes and responses with formatted JSON structure.
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const errorMessage = err.message || 'An unexpected error occurred on the server.';

  // Structured logs capture routing method, URL path, status, and error stack
  logger.error(
    `[${req.method}] ${req.path} - Code: ${statusCode} - Msg: ${errorMessage} - Stack: ${err.stack || 'No Stack Trace'}`
  );

  res.status(statusCode).json({
    success: false,
    error: {
      message: errorMessage,
      // Provide debugging stack trace to developers in local environment only
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
export default errorHandler;
