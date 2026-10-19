'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import useSWR from 'swr';
import { api, clearSession, User } from './api';

export function useUser() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<User>('/users/me', (url: string) =>
    api.get(url).then((r) => r.data),
  );

  useEffect(() => {
    // Só desloga quando o token é inválido; se a API estiver acordando, não perde a sessão
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearSession();
      router.replace('/login');
    }
  }, [error, router]);

  return { user: data, isLoading, error, mutate };
}
