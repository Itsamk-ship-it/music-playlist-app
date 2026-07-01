import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/errors';

type Source = 'body' | 'query' | 'params';

/**
 * Validates and coerces a request segment against a Zod schema.
 * On success the parsed value replaces req[source].
 */
export const validate =
  (schema: AnyZodObject, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      // query/params are read-only getters in Express 5-ish typings; assign safely
      Object.assign(req[source] as object, parsed);
      (req as unknown as Record<string, unknown>)[`validated_${source}`] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw AppError.badRequest('Validation failed', err.flatten().fieldErrors);
      }
      throw err;
    }
  };
