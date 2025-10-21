import { useState, useEffect } from 'react';
import { apiCall } from '../utils/supabase/client';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function useSupabaseConnection() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await apiCall('/health');
        setStatus('connected');
        setLastSync(new Date());
      } catch (error) {
        setStatus('disconnected');
      }
    };

    checkConnection();

    // Verificar cada 30 segundos
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  return { status, lastSync };
}

interface UseSupabaseDataOptions<T> {
  endpoint: string;
  initialData?: T;
  autoFetch?: boolean;
}

export function useSupabaseData<T = any>({
  endpoint,
  initialData,
  autoFetch = true
}: UseSupabaseDataOptions<T>) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setStatus('loading');
    setError(null);

    try {
      const response = await apiCall(endpoint);
      setData(response);
      setStatus('success');
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido');
      setError(error);
      setStatus('error');
      throw error;
    }
  };

  const mutate = async (newData: Partial<T>, method: 'POST' | 'PUT' | 'DELETE' = 'POST') => {
    setStatus('loading');
    setError(null);

    try {
      const response = await apiCall(endpoint, {
        method,
        body: JSON.stringify(newData)
      });
      setData(response);
      setStatus('success');
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido');
      setError(error);
      setStatus('error');
      throw error;
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [endpoint, autoFetch]);

  return {
    data,
    status,
    error,
    isLoading: status === 'loading',
    isError: status === 'error',
    isSuccess: status === 'success',
    refetch: fetchData,
    mutate
  };
}

// Hook específico para pedidos
export function usePedidos() {
  return useSupabaseData({
    endpoint: '/pedidos',
    autoFetch: true
  });
}

// Hook específico para productos
export function useProductos() {
  return useSupabaseData({
    endpoint: '/productos',
    autoFetch: true
  });
}

// Hook específico para estado de cocina
export function useEstadoCocina() {
  const { data, mutate, ...rest } = useSupabaseData<{ abierta: boolean }>({
    endpoint: '/cocina/estado',
    autoFetch: true
  });

  const toggleEstado = async () => {
    if (data) {
      await mutate({ abierta: !data.abierta });
    }
  };

  return {
    abierta: data?.abierta ?? true,
    toggleEstado,
    mutate,
    ...rest
  };
}
