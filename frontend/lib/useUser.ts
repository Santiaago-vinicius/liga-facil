'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { api, clearSession, User } from './api';

export function useUser() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<User>('/users/me', (url: string) =>
    api.get(url).then((r) => r.data),
  );

  useEffect(() => {
    if (error) {
      clearSession();
      router.replace('/login');
    }
  }, [error, router]);

  return { user: data, isLoading, mutate };
}