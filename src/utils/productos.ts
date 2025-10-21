import { apiCall } from './supabase/client';
import { productosData, type Producto } from '../data/productos';

// Flag para controlar si usar Supabase o localStorage
const USE_SUPABASE = true;

export async function initializeProductos() {
  if (USE_SUPABASE) {
    try {
      // Intentar inicializar en Supabase
      await apiCall('/inicializar', {
        method: 'POST',
        body: JSON.stringify({ productos: productosData })
      });
      console.log('Productos inicializados en Supabase');
    } catch (error) {
      console.error('Error inicializando en Supabase, usando localStorage:', error);
      // Fallback a localStorage
      localStorage.setItem("productos", JSON.stringify(productosData));
    }
  } else {
    localStorage.setItem("productos", JSON.stringify(productosData));
  }
}

export function getTodosProductos(): Producto[] {
  const productos = localStorage.getItem("productos");
  return productos ? JSON.parse(productos) : [];
}

export async function getTodosProductosAsync(): Promise<Producto[]> {
  if (USE_SUPABASE) {
    try {
      const response = await apiCall('/productos');
      // Sincronizar con localStorage para fallback
      if (response.productos) {
        localStorage.setItem("productos", JSON.stringify(response.productos));
      }
      return response.productos || [];
    } catch (error) {
      console.error('Error obteniendo productos de Supabase, usando localStorage:', error);
      return getTodosProductos();
    }
  }
  return getTodosProductos();
}

export async function guardarProductosAsync(productos: Producto[]) {
  if (USE_SUPABASE) {
    try {
      await apiCall('/productos', {
        method: 'POST',
        body: JSON.stringify({ productos })
      });
      localStorage.setItem("productos", JSON.stringify(productos));
    } catch (error) {
      console.error('Error guardando productos en Supabase:', error);
      localStorage.setItem("productos", JSON.stringify(productos));
      throw error;
    }
  } else {
    localStorage.setItem("productos", JSON.stringify(productos));
  }
}

export function guardarProductosLocal(productos: Producto[]) {
  localStorage.setItem("productos", JSON.stringify(productos));
  
  // Si está habilitado Supabase, sincronizar en background
  if (USE_SUPABASE) {
    guardarProductosAsync(productos).catch(error => {
      console.error('Error sincronizando productos con Supabase:', error);
    });
  }
}
