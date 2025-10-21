import { supabase } from '../initSupabase';
import { Database } from '../database.types';

type EstadoPedido = "NUEVO" | "PREPARANDO" | "LISTO" | "ENTREGADO";
type EstadoSupabase = Database['public']['Enums']['STATUS_ORDER'];

// Mapeo entre estados locales y de Supabase
const MAPEO_ESTADOS: Record<EstadoSupabase, EstadoPedido> = {
  'INIT': 'NUEVO',
  'IN_PROGRESS': 'PREPARANDO', 
  'READY': 'LISTO',
  'DELIVERED': 'ENTREGADO',
  'PAYED': 'ENTREGADO'
};

const MAPEO_ESTADOS_INVERSO: Record<EstadoPedido, EstadoSupabase> = {
  'NUEVO': 'INIT',
  'PREPARANDO': 'IN_PROGRESS',
  'LISTO': 'READY', 
  'ENTREGADO': 'DELIVERED'
};

export interface ItemPedido {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  imagen?: string;
}

export interface Pedido {
  id: string;
  estado: EstadoPedido;
  items: ItemPedido[];
  total: number;
  hora: string;
  tipo: "Delivery" | "Recoger";
  nota?: string;
  timestamp: number;
  usuario: {
    nombre: string;
    foto: string;
  };
}

// Obtener todos los pedidos de Supabase
export async function obtenerPedidos(): Promise<Pedido[]> {
  try {
    
    // Obtener órdenes con sus items y productos
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        created_at,
        user_phone,
        item_order (
          quantity,
          products (
            id,
            name,
            price,
            image_url
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo órdenes:', error);
      throw error;
    }

    if (!orders || orders.length === 0) {
      return [];
    }

    // Obtener usuarios para mapear nombres
    const { data: users } = await supabase
      .from('users')
      .select('name, phone');

    const usuariosMap = new Map(users?.map(u => [u.phone, u.name]) || []);

    // Convertir órdenes de Supabase a formato local
    const pedidos: Pedido[] = orders.map(order => {
      const items: ItemPedido[] = order.item_order?.map(item => ({
        id: item.products?.id.toString() || '',
        nombre: item.products?.name || '',
        cantidad: item.quantity,
        precio: item.products?.price || 0,
        imagen: item.products?.image_url
      })).filter(item => item.id && item.nombre) || [];

      const total = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
      const nombreUsuario = usuariosMap.get(order.user_phone) || 'Cliente';
      
      return {
        id: order.id.toString(),
        estado: MAPEO_ESTADOS[order.status],
        items,
        total,
        hora: new Date(order.created_at).toLocaleTimeString('es-MX', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        tipo: "Delivery" as const, // Por defecto
        timestamp: new Date(order.created_at).getTime(),
        usuario: {
          nombre: nombreUsuario,
          foto: `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreUsuario)}&background=random`
        }
      };
    });

    return pedidos;
  } catch (error) {
    console.error('Error en obtenerPedidos:', error);
    throw error;
  }
}

// Actualizar estado de un pedido en Supabase
export async function actualizarEstadoPedido(id: string, nuevoEstado: EstadoPedido): Promise<void> {
  try {
    const estadoSupabase = MAPEO_ESTADOS_INVERSO[nuevoEstado];
    
    const { error } = await supabase
      .from('orders')
      .update({ status: estadoSupabase })
      .eq('id', parseInt(id));

    if (error) {
      console.error('Error actualizando estado:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error en actualizarEstadoPedido:', error);
    throw error;
  }
}

// Crear un nuevo pedido en Supabase
export async function crearPedido(pedido: Omit<Pedido, 'id' | 'timestamp' | 'hora'>): Promise<Pedido> {
  try {
    
    // Crear la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_phone: '0000000000', // Teléfono por defecto
        status: 'INIT'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creando orden:', orderError);
      throw orderError;
    }

    // Crear los items de la orden
    const itemsToInsert = pedido.items.map(item => ({
      order_id: order.id,
      product_id: parseInt(item.id),
      quantity: item.cantidad
    }));

    const { error: itemsError } = await supabase
      .from('item_order')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Error creando items:', itemsError);
      throw itemsError;
    }

    // Retornar el pedido creado
    return {
      ...pedido,
      id: order.id.toString(),
      timestamp: Date.now(),
      hora: new Date().toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  } catch (error) {
    console.error('Error en crearPedido:', error);
    throw error;
  }
}

// Obtener un pedido específico por ID
export async function obtenerPedidoPorId(id: string): Promise<Pedido | null> {
  try {
    
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        created_at,
        user_phone,
        item_order (
          quantity,
          products (
            id,
            name,
            price,
            image_url
          )
        )
      `)
      .eq('id', parseInt(id))
      .single();

    if (error) {
      console.error('Error obteniendo pedido:', error);
      return null;
    }

    if (!order) {
      return null;
    }

    // Obtener usuario
    const { data: user } = await supabase
      .from('users')
      .select('name')
      .eq('phone', order.user_phone)
      .single();

    const items: ItemPedido[] = order.item_order?.map(item => ({
      id: item.products?.id.toString() || '',
      nombre: item.products?.name || '',
      cantidad: item.quantity,
      precio: item.products?.price || 0,
      imagen: item.products?.image_url
    })).filter(item => item.id && item.nombre) || [];

    const total = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    return {
      id: order.id.toString(),
      estado: MAPEO_ESTADOS[order.status],
      items,
      total,
      hora: new Date(order.created_at).toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      tipo: "Delivery" as const,
      timestamp: new Date(order.created_at).getTime(),
      usuario: {
        nombre: user?.name || 'Cliente',
        foto: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Cliente')}&background=random`
      }
    };
  } catch (error) {
    console.error('Error en obtenerPedidoPorId:', error);
    return null;
  }
}
