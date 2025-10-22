import { supabase } from '../initSupabase';

type EstadoPedido = "NUEVO" | "PREPARANDO" | "LISTO" | "EN_CAMINO" | "ENTREGADO";
type EstadoSupabase = "INIT" | "IN_PROGRESS" | "READY" | "ON_THE_WAY" | "DELIVERED" | "PAYED";

// Mapeo entre estados locales y de Supabase
const MAPEO_ESTADOS: Record<EstadoSupabase, EstadoPedido> = {
  'INIT': 'NUEVO',
  'IN_PROGRESS': 'PREPARANDO', 
  'READY': 'LISTO',
  'ON_THE_WAY': 'EN_CAMINO',
  'DELIVERED': 'ENTREGADO',
  'PAYED': 'NUEVO'  // PAYED significa que ya pagó pero apenas va a empezar
};

const MAPEO_ESTADOS_INVERSO: Record<EstadoPedido, EstadoSupabase> = {
  'NUEVO': 'PAYED',      // NUEVO se mapea a PAYED (ya pagado, listo para preparar)
  'PREPARANDO': 'IN_PROGRESS',
  'LISTO': 'READY', 
  'EN_CAMINO': 'ON_THE_WAY',
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
  subtotal: number;
  total: number;
  hora: string;
  tipo: "Delivery" | "Recoger";
  tipoEntrega?: "caseta" | "gubernamental";
  direccion?: string;
  vehiculo?: string;
  placas?: string;
  nota?: string;
  timestamp: number;
  usuario: {
    nombre: string;
    foto: string;
    telefono: string;
  };
  cupon?: {
    codigo: string;
    descuento: number;
  };
  precioEnvio?: number;
}

// Obtener todos los pedidos de Supabase para un usuario específico
export async function obtenerPedidos(userPhone: string): Promise<Pedido[]> {
  try {
    
    // Obtener órdenes con sus items y productos del usuario actual
    // Excluir órdenes con status INIT (no pagadas)
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        created_at,
        user_phone,
        price,
        order_type,
        coupon_applied,
        coupons (
          code,
          discount
        ),
        send_price (
          id,
          price
        ),
        item_order (
          quantity,
          products (
            id,
            name,
            price,
            image_url
          )
        ),
        item_booth (
          car_model,
          plates
        ),
        item_gubernamental (
          address,
          building,
          floor
        )
      `)
      .eq('user_phone', userPhone)
      .neq('status', 'INIT')
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

      const subtotal = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
      const nombreUsuario = usuariosMap.get(order.user_phone) || 'Cliente';
      
      // Información del cupón si existe
      const cupon = order.coupon_applied && order.coupons ? {
        codigo: order.coupons.code,
        descuento: order.coupons.discount
      } : undefined;
      
      // Obtener precio de envío específico del pedido
      const precioEnvio = order.send_price?.price || 20; // Fallback a $20 si no hay precio
      
      // Calcular total considerando cupón y envío
      let total = subtotal;
      if (cupon) {
        total -= cupon.descuento;
      }
      // Agregar precio de envío
      total += precioEnvio;
      
      // Determinar tipo de entrega y datos correspondientes
      let tipoEntrega: "caseta" | "gubernamental" | undefined;
      let direccion: string | undefined;
      let vehiculo: string | undefined;
      let placas: string | undefined;
      
      if (order.order_type === 'CASETA' && order.item_booth && order.item_booth.length > 0) {
        tipoEntrega = "caseta";
        const boothData = order.item_booth[0];
        vehiculo = boothData.car_model || undefined;
        placas = boothData.plates || undefined;
        direccion = "Caseta de peaje"; // Dirección genérica para casetas
      } else if (order.order_type === 'GUBERNAMENTAL' && order.item_gubernamental && order.item_gubernamental.length > 0) {
        tipoEntrega = "gubernamental";
        const gubernamentalData = order.item_gubernamental[0];
        direccion = gubernamentalData.address || undefined;
        if (gubernamentalData.building) {
          direccion += `, ${gubernamentalData.building}`;
        }
        if (gubernamentalData.floor) {
          direccion += `, Piso ${gubernamentalData.floor}`;
        }
      }
      
      return {
        id: order.id.toString(),
        estado: MAPEO_ESTADOS[order.status as EstadoSupabase] || 'NUEVO',
        items,
        subtotal,
        total,
        hora: new Date(order.created_at).toLocaleTimeString('es-MX', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        tipo: "Delivery" as const, // Por defecto
        tipoEntrega,
        direccion,
        vehiculo,
        placas,
        timestamp: new Date(order.created_at).getTime(),
        usuario: {
          nombre: nombreUsuario,
          foto: `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreUsuario)}&background=random`,
          telefono: order.user_phone
        },
        cupon,
        precioEnvio
      };
    });

    return pedidos;
  } catch (error) {
    console.error('Error en obtenerPedidos:', error);
    throw error;
  }
}

// Actualizar estado de un pedido en Supabase
export async function actualizarEstadoPedido(id: string, nuevoEstado: EstadoPedido, userPhone: string): Promise<void> {
  try {
    const estadoSupabase = MAPEO_ESTADOS_INVERSO[nuevoEstado];
    
    const { error } = await supabase
      .from('orders')
      .update({ status: estadoSupabase })
      .eq('id', parseInt(id))
      .eq('user_phone', userPhone);

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
export async function crearPedido(pedido: Omit<Pedido, 'id' | 'timestamp' | 'hora'>, userPhone: string): Promise<Pedido> {
  try {
    
    // Crear la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_phone: userPhone,
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

// Obtener solo órdenes con status PAYED para el contador
export async function obtenerOrdenesPayed(userPhone: string): Promise<number> {
  console.log("userPhone", userPhone)
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id')
      .eq('user_phone', userPhone)
      .eq('status', 'PAYED');

    if (error) {
      console.error('Error obteniendo órdenes PAYED:', error);
      throw error;
    }

    return orders?.length || 0;
  } catch (error) {
    console.error('Error en obtenerOrdenesPayed:', error);
    throw error;
  }
}

// Obtener un pedido específico por ID y usuario
export async function obtenerPedidoPorId(id: string, userPhone: string): Promise<Pedido | null> {
  try {
    
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        created_at,
        user_phone,
        price,
        order_type,
        coupon_applied,
        coupons (
          code,
          discount
        ),
        send_price (
          id,
          price
        ),
        item_order (
          quantity,
          products (
            id,
            name,
            price,
            image_url
          )
        ),
        item_booth (
          car_model,
          plates
        ),
        item_gubernamental (
          address,
          building,
          floor
        )
      `)
      .eq('id', parseInt(id))
      .eq('user_phone', userPhone)
      .neq('status', 'INIT')
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

    const subtotal = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    // Información del cupón si existe
    const cupon = order.coupon_applied && order.coupons ? {
      codigo: order.coupons.code,
      descuento: order.coupons.discount
    } : undefined;
    
    // Obtener precio de envío específico del pedido
    const precioEnvio = order.send_price?.price || 20; // Fallback a $20 si no hay precio
    
    // Calcular total considerando cupón y envío
    let total = subtotal;
    if (cupon) {
      total -= cupon.descuento;
    }
    // Agregar precio de envío
    total += precioEnvio;
    
    // Determinar tipo de entrega y datos correspondientes
    let tipoEntrega: "caseta" | "gubernamental" | undefined;
    let direccion: string | undefined;
    let vehiculo: string | undefined;
    let placas: string | undefined;
    
    if (order.order_type === 'CASETA' && order.item_booth && order.item_booth.length > 0) {
      tipoEntrega = "caseta";
      const boothData = order.item_booth[0];
      vehiculo = boothData.car_model || undefined;
      placas = boothData.plates || undefined;
      direccion = "Caseta de peaje"; // Dirección genérica para casetas
    } else if (order.order_type === 'GUBERNAMENTAL' && order.item_gubernamental && order.item_gubernamental.length > 0) {
      tipoEntrega = "gubernamental";
      const gubernamentalData = order.item_gubernamental[0];
      direccion = gubernamentalData.address || undefined;
      if (gubernamentalData.building) {
        direccion += `, ${gubernamentalData.building}`;
      }
      if (gubernamentalData.floor) {
        direccion += `, Piso ${gubernamentalData.floor}`;
      }
    }
    
    return {
      id: order.id.toString(),
      estado: MAPEO_ESTADOS[order.status as EstadoSupabase] || 'NUEVO',
      items,
      subtotal,
      total,
      hora: new Date(order.created_at).toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      tipo: "Delivery" as const,
      tipoEntrega,
      direccion,
      vehiculo,
      placas,
      timestamp: new Date(order.created_at).getTime(),
      usuario: {
        nombre: user?.name || 'Cliente',
        foto: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Cliente')}&background=random`,
        telefono: order.user_phone
      },
      cupon,
      precioEnvio
    };
  } catch (error) {
    console.error('Error en obtenerPedidoPorId:', error);
    return null;
  }
}
