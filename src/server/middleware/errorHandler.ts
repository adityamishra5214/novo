import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public code: 'VALIDATION_ERROR' | 'FORBIDDEN' | 'UNAUTHENTICATED' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_ERROR',
    message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.requestId || `req_${Date.now()}`;

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        requestId,
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    });
    return;
  }

  console.error(`[${requestId}] Unhandled Exception:`, err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal error occurred.',
      requestId,
    },
  });
}
