import { Response } from 'express';

/** Standard success envelope. */
export function ok<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ data });
}

/** Paginated success envelope. */
export function okPage<T>(res: Response, data: T[], meta: unknown): void {
  res.status(200).json({ data, meta });
}
