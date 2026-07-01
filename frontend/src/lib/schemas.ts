import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(80),
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers and underscores only'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const playlistSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  description: z.string().max(1000).optional(),
  coverUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  isPublic: z.boolean().default(false),
});
export type PlaylistInput = z.infer<typeof playlistSchema>;

export const profileSchema = z.object({
  name: z.string().min(1).max(80),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  favoriteGenre: z.string().max(50).optional(),
  isPublic: z.boolean(),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string().min(1, 'Required'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const commentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(1000),
});
export type CommentInput = z.infer<typeof commentSchema>;
