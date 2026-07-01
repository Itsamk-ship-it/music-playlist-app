'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { User } from '@/lib/types';
import type { LoginInput, RegisterInput } from '@/lib/schemas';

interface AuthResponse {
  data: { user: User; accessToken: string };
}

export function useAuth() {
  return useAuthStore();
}

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => api.post<AuthResponse>('/auth/login', input, { auth: false }),
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.accessToken);
      qc.invalidateQueries();
      toast.success(`Welcome back, ${res.data.user.name}!`);
      router.push('/dashboard');
    },
    onError: (err: Error) => toast.error(err.message || 'Login failed'),
  });
}

export function useRegister() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (input: RegisterInput) =>
      api.post<AuthResponse>('/auth/register', input, { auth: false }),
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.accessToken);
      toast.success('Account created!');
      router.push('/dashboard');
    },
    onError: (err: Error) => toast.error(err.message || 'Registration failed'),
  });
}

export function useLogout() {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      clear();
      qc.clear();
      toast.success('Signed out');
      router.push('/login');
    },
  });
}
