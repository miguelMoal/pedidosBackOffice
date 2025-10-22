import { apiCall } from './supabase/client';
import { productosData, type Producto } from '../data/productos';
import { supabase } from '../supabase/initSupabase';

// Flag para controlar si usar Supabase o localStorage
const USE_SUPABASE = true;

// Función para recalcular el margen basado en precio y costo
function calcularMargen(precio: number, costo: number): string {
  if (precio === 0) return "0.00";
  return ((precio - costo) / precio * 100).toFixed(2);
}

// Mapear producto local a formato Supabase
function mapearProductoLocalASupabase(producto: Producto) {
  return {
    name: producto.nombre,
    price: producto.precio,
    cost: producto.costo,
    margin: calcularMargen(producto.precio, producto.costo), // Calcular margen como porcentaje
    stock: producto.stock,
    image_url: producto.imagen,
    business: 'PUESTO' as const, // Por defecto para el backoffice
    // Nota: Supabase maneja id y created_at automáticamente
  };
}

// Mapear producto de Supabase a formato local
function mapearProductoSupabaseALocal(productoSupabase: any): Producto {
  return {
    id: productoSupabase.id.toString(),
    nombre: productoSupabase.name,
    categoria: "Comida", // Por defecto, ya que Supabase no tiene categoría
    costo: productoSupabase.cost || 0, // Usar el costo de Supabase
    precio: productoSupabase.price,
    imagen: productoSupabase.image_url,
    activo: true, // Por defecto activo
    stock: productoSupabase.stock || 0 // Usar el stock de Supabase
  };
}

export async function initializeProductos() {
  if (USE_SUPABASE) {
    try {
      // Verificar si ya existen productos en Supabase
      const { data: productosExistentes } = await supabase
        .from('products')
        .select('id')
        .eq('business', 'PUESTO')
        .limit(1);

      // Solo inicializar si no hay productos
      if (!productosExistentes || productosExistentes.length === 0) {
        const productosParaInsertar = productosData.map(mapearProductoLocalASupabase);
        
        const { error } = await supabase
          .from('products')
          .insert(productosParaInsertar);

        if (error) {
          console.error('Error insertando productos en Supabase:', error);
          throw error;
        }
        console.log('Productos inicializados en Supabase');
      }
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
      const { data: productosSupabase, error } = await supabase
        .from('products')
        .select('id, name, price, cost, margin, stock, image_url, business, created_at')
        .eq('business', 'PUESTO')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo productos de Supabase:', error);
        throw error;
      }

      // Mapear productos de Supabase a formato local
      const productosLocales = productosSupabase?.map(mapearProductoSupabaseALocal) || [];
      
      // Verificar si hay productos que necesitan actualización de campos faltantes
      const productosParaActualizar = productosLocales.filter(p => 
        p.costo === 0 && p.stock === 0 // Productos que pueden no tener los nuevos campos
      );
      
      if (productosParaActualizar.length > 0) {
        console.log('Sincronizando productos con campos faltantes...');
        // Los productos se actualizarán automáticamente cuando se editen
      }
      
      // Sincronizar con localStorage para fallback
      localStorage.setItem("productos", JSON.stringify(productosLocales));
      
      return productosLocales;
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
      // Obtener productos existentes en Supabase
      const { data: productosExistentes } = await supabase
        .from('products')
        .select('id')
        .eq('business', 'PUESTO');

      const idsExistentes = new Set(productosExistentes?.map(p => p.id) || []);

      // Separar productos en nuevos y actualizados
      const productosNuevos: any[] = [];
      const productosActualizar: any[] = [];

      for (const producto of productos) {
        const productoMapeado = mapearProductoLocalASupabase(producto);
        const idNumerico = parseInt(producto.id);
        
        if (idsExistentes.has(idNumerico)) {
          // Producto existe, actualizar
          productosActualizar.push({
            id: idNumerico,
            ...productoMapeado
          });
        } else {
          // Producto nuevo
          productosNuevos.push(productoMapeado);
        }
      }

      // Insertar productos nuevos
      if (productosNuevos.length > 0) {
        const { error: insertError } = await supabase
          .from('products')
          .insert(productosNuevos);
        
        if (insertError) {
          console.error('Error insertando productos nuevos:', insertError);
          throw insertError;
        }
      }

      // Actualizar productos existentes
      for (const producto of productosActualizar) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: producto.name,
            price: producto.price,
            cost: producto.cost,
            margin: producto.margin,
            stock: producto.stock,
            image_url: producto.image_url
          })
          .eq('id', producto.id);

        if (updateError) {
          console.error('Error actualizando producto:', updateError);
          throw updateError;
        }
      }

      // Sincronizar con localStorage
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

// Crear un nuevo producto en Supabase
export async function crearProductoAsync(producto: Omit<Producto, 'id'>): Promise<Producto> {
  if (USE_SUPABASE) {
    try {
      const productoMapeado = mapearProductoLocalASupabase(producto as Producto);
      
      const { data: nuevoProducto, error } = await supabase
        .from('products')
        .insert(productoMapeado)
        .select()
        .single();

      if (error) {
        console.error('Error creando producto en Supabase:', error);
        throw error;
      }

      // Mapear de vuelta a formato local
      const productoLocal = mapearProductoSupabaseALocal(nuevoProducto);
      
      // Actualizar localStorage
      const productosActuales = getTodosProductos();
      productosActuales.push(productoLocal);
      localStorage.setItem("productos", JSON.stringify(productosActuales));
      
      return productoLocal;
    } catch (error) {
      console.error('Error creando producto:', error);
      throw error;
    }
  } else {
    // Fallback a localStorage
    const nuevoProducto: Producto = {
      ...producto,
      id: `p${Date.now()}`
    };
    const productosActuales = getTodosProductos();
    productosActuales.push(nuevoProducto);
    localStorage.setItem("productos", JSON.stringify(productosActuales));
    return nuevoProducto;
  }
}

// Actualizar un producto en Supabase
export async function actualizarProductoAsync(producto: Producto): Promise<Producto> {
  if (USE_SUPABASE) {
    try {
      const productoMapeado = mapearProductoLocalASupabase(producto);
      const idNumerico = parseInt(producto.id);
      
      const { data: productoActualizado, error } = await supabase
        .from('products')
        .update({
          name: productoMapeado.name,
          price: productoMapeado.price,
          cost: productoMapeado.cost,
          margin: productoMapeado.margin,
          stock: productoMapeado.stock,
          image_url: productoMapeado.image_url
        })
        .eq('id', idNumerico)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando producto en Supabase:', error);
        throw error;
      }

      // Mapear de vuelta a formato local
      const productoLocal = mapearProductoSupabaseALocal(productoActualizado);
      
      // Actualizar localStorage
      const productosActuales = getTodosProductos();
      const index = productosActuales.findIndex(p => p.id === producto.id);
      if (index !== -1) {
        productosActuales[index] = productoLocal;
        localStorage.setItem("productos", JSON.stringify(productosActuales));
      }
      
      return productoLocal;
    } catch (error) {
      console.error('Error actualizando producto:', error);
      throw error;
    }
  } else {
    // Fallback a localStorage
    const productosActuales = getTodosProductos();
    const index = productosActuales.findIndex(p => p.id === producto.id);
    if (index !== -1) {
      productosActuales[index] = producto;
      localStorage.setItem("productos", JSON.stringify(productosActuales));
    }
    return producto;
  }
}

// Eliminar un producto de Supabase
export async function eliminarProductoAsync(id: string): Promise<void> {
  if (USE_SUPABASE) {
    try {
      const idNumerico = parseInt(id);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', idNumerico);

      if (error) {
        console.error('Error eliminando producto de Supabase:', error);
        throw error;
      }

      // Actualizar localStorage
      const productosActuales = getTodosProductos();
      const productosFiltrados = productosActuales.filter(p => p.id !== id);
      localStorage.setItem("productos", JSON.stringify(productosFiltrados));
    } catch (error) {
      console.error('Error eliminando producto:', error);
      throw error;
    }
  } else {
    // Fallback a localStorage
    const productosActuales = getTodosProductos();
    const productosFiltrados = productosActuales.filter(p => p.id !== id);
    localStorage.setItem("productos", JSON.stringify(productosFiltrados));
  }
}
