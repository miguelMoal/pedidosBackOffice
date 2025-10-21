import { apiCall } from './supabase/client';

// Flag para controlar si usar Supabase o localStorage
const USE_SUPABASE = true;

export function getEstadoCocina(): boolean {
  const estado = localStorage.getItem('cocinaAbierta');
  return estado !== null ? JSON.parse(estado) : true;
}

export async function getEstadoCocinaAsync(): Promise<boolean> {
  if (USE_SUPABASE) {
    try {
      const response = await apiCall('/cocina/estado');
      // Sincronizar con localStorage
      localStorage.setItem('cocinaAbierta', JSON.stringify(response.abierta));
      return response.abierta;
    } catch (error) {
      console.error('Error obteniendo estado de cocina de Supabase, usando localStorage:', error);
      return getEstadoCocina();
    }
  }
  return getEstadoCocina();
}

export async function setEstadoCocinaAsync(abierta: boolean) {
  if (USE_SUPABASE) {
    try {
      await apiCall('/cocina/estado', {
        method: 'POST',
        body: JSON.stringify({ abierta })
      });
      localStorage.setItem('cocinaAbierta', JSON.stringify(abierta));
    } catch (error) {
      console.error('Error guardando estado de cocina en Supabase:', error);
      localStorage.setItem('cocinaAbierta', JSON.stringify(abierta));
      throw error;
    }
  } else {
    localStorage.setItem('cocinaAbierta', JSON.stringify(abierta));
  }
}

export function setEstadoCocina(abierta: boolean) {
  localStorage.setItem('cocinaAbierta', JSON.stringify(abierta));
  
  // Si está habilitado Supabase, sincronizar en background
  if (USE_SUPABASE) {
    setEstadoCocinaAsync(abierta).catch(error => {
      console.error('Error sincronizando estado de cocina con Supabase:', error);
    });
  }
}
