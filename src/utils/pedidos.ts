import { apiCall } from './supabase/client';
import { 
  obtenerPedidos, 
  actualizarEstadoPedido as actualizarEstadoSupabase,
  crearPedido as crearPedidoSupabase,
  obtenerPedidoPorId
} from '../supabase/actions/pedidos';

export type EstadoPedido = 
  | "NUEVO" 
  | "PREPARANDO" 
  | "LISTO" 
  | "EN_CAMINO"
  | "ENTREGADO";

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
  tipo: "caseta" | "gubernamental" | "Delivery";
  tipoEntrega?: "caseta" | "gubernamental";
  direccion?: string;
  vehiculo?: string;
  placas?: string;
  nota?: string;
  timestamp: number;
  usuario: {
    nombre: string;
    foto: string;
    telefono?: string;
  };
  cupon?: {
    codigo: string;
    descuento: number;
  };
  precioEnvio?: number;
}

// Flag para controlar si usar Supabase o localStorage
const USE_SUPABASE = true;

export async function initializePedidos() {
  const ahora = Date.now();
  const pedidosDemo: Pedido[] = [
    {
      id: "Q231",
      estado: "NUEVO",
      items: [
        { id: "p1", nombre: "Hot Dog", cantidad: 2, precio: 60, imagen: "https://images.unsplash.com/photo-1598209570763-cd3013fadf7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400" },
        { id: "p5", nombre: "Flashlyte", cantidad: 1, precio: 35, imagen: "https://images.unsplash.com/photo-1648313021325-d81f28d57824?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400" }
      ],
      subtotal: 155,
      total: 175,
      precioEnvio: 20,
      hora: new Date(ahora - 1 * 60000).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      tipo: "Delivery",
      tipoEntrega: "caseta",
      direccion: "Caseta de peaje km 45, Carretera México-Puebla",
      vehiculo: "Honda Civic",
      placas: "ABC-123",
      timestamp: ahora - 1 * 60000,
      usuario: {
        nombre: "Carlos Ramírez",
        foto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200"
      }
    },
    {
      id: "Q145",
      estado: "NUEVO",
      items: [
        { id: "p3", nombre: "Nachos", cantidad: 1, precio: 55, imagen: "https://images.unsplash.com/photo-1669624272709-c5b91f66b1b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400" },
        { id: "p4", nombre: "Coca-Cola", cantidad: 2, precio: 30, imagen: "https://images.unsplash.com/photo-1594881798661-4c77c99551a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400" }
      ],
      subtotal: 115,
      total: 115,
      hora: new Date(ahora - 2 * 60000).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      tipo: "Delivery",
      tipoEntrega: "gubernamental",
      direccion: "Oficinas Gubernamentales, Av. Reforma 123, Col. Centro, CDMX",
      nota: "Sin cebolla en los nachos por favor",
      timestamp: ahora - 2 * 60000,
      usuario: {
        nombre: "Ana Martínez",
        foto: "https://images.unsplash.com/photo-1557053910-d9eadeed1c58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200"
      }
    },
    {
      id: "Q312",
      estado: "PREPARANDO",
      items: [
        { id: "p2", nombre: "Pizza Slice", cantidad: 3, precio: 50, imagen: "https://images.unsplash.com/photo-1544982503-9f984c14501a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400" },
        { id: "p7", nombre: "Sprite", cantidad: 1, precio: 30, imagen: "https://images.unsplash.com/photo-1570633141712-9c519e90b85c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400" }
      ],
      subtotal: 180,
      total: 200,
      precioEnvio: 20,
      hora: new Date(ahora - 3 * 60000).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      tipo: "Delivery",
      timestamp: ahora - 3 * 60000,
      usuario: {
        nombre: "Luis García",
        foto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200"
      }
    },
    {
      id: "Q089",
      estado: "LISTO",
      items: [
        { id: "p9", nombre: "Papas Fritas", cantidad: 2, precio: 45, imagen: "https://images.unsplash.com/photo-1630431341973-02e1b662ec35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400" },
        { id: "p6", nombre: "Agua", cantidad: 2, precio: 25, imagen: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400" }
      ],
      subtotal: 140,
      total: 140,
      hora: new Date(ahora - 5 * 60000).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      tipo: "Recoger",
      timestamp: ahora - 5 * 60000,
      usuario: {
        nombre: "María López",
        foto: "https://images.unsplash.com/photo-1484863137850-59afcfe05386?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200"
      }
    },
    {
      id: "Q456",
      estado: "NUEVO",
      items: [
        { id: "p1", nombre: "Hot Dog", cantidad: 1, precio: 60, imagen: "https://images.unsplash.com/photo-1598209570763-cd3013fadf7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400" },
        { id: "p8", nombre: "Doritos", cantidad: 2, precio: 28, imagen: "https://images.unsplash.com/photo-1704656296628-794703d8a727?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400" },
        { id: "p4", nombre: "Coca-Cola", cantidad: 1, precio: 30, imagen: "https://images.unsplash.com/photo-1594881798661-4c77c99551a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400" }
      ],
      subtotal: 146,
      total: 156,
      precioEnvio: 20,
      cupon: {
        codigo: "DESCUENTO10",
        descuento: 10
      },
      hora: new Date(ahora - 8 * 60000).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      tipo: "Delivery",
      nota: "Asiento: Sección A, Fila 12",
      timestamp: ahora - 8 * 60000,
      usuario: {
        nombre: "Roberto Sánchez",
        foto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200"
      }
    },
    {
      id: "Q567",
      estado: "PREPARANDO",
      items: [
        { id: "p2", nombre: "Pizza Slice", cantidad: 2, precio: 50, imagen: "https://images.unsplash.com/photo-1544982503-9f984c14501a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400" },
        { id: "p5", nombre: "Flashlyte", cantidad: 2, precio: 35, imagen: "https://images.unsplash.com/photo-1648313021325-d81f28d57824?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400" }
      ],
      subtotal: 170,
      total: 190,
      precioEnvio: 20,
      hora: new Date(ahora - 12 * 60000).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      tipo: "Delivery",
      timestamp: ahora - 12 * 60000,
      usuario: {
        nombre: "Patricia Torres",
        foto: "https://images.unsplash.com/photo-1557053910-d9eadeed1c58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200"
      }
    }
  ];

  if (USE_SUPABASE) {
    try {
      // Intentar inicializar en Supabase
      await apiCall('/inicializar', {
        method: 'POST',
        body: JSON.stringify({ pedidos: pedidosDemo })
      });
      console.log('Pedidos inicializados en Supabase');
    } catch (error) {
      console.error('Error inicializando en Supabase, usando localStorage:', error);
      // Fallback a localStorage
      localStorage.setItem("pedidos", JSON.stringify(pedidosDemo));
      localStorage.setItem("pedidoActual", JSON.stringify(pedidosDemo[0]));
    }
  } else {
    localStorage.setItem("pedidos", JSON.stringify(pedidosDemo));
    localStorage.setItem("pedidoActual", JSON.stringify(pedidosDemo[0]));
  }
}

export function getPedidoActual(): Pedido | null {
  const pedido = localStorage.getItem("pedidoActual");
  return pedido ? JSON.parse(pedido) : null;
}

export function setPedidoActual(pedido: Pedido) {
  localStorage.setItem("pedidoActual", JSON.stringify(pedido));
  
  // También actualizar en la lista de pedidos
  const pedidos = getTodosPedidos();
  const index = pedidos.findIndex(p => p.id === pedido.id);
  if (index >= 0) {
    pedidos[index] = pedido;
  } else {
    pedidos.push(pedido);
  }
  localStorage.setItem("pedidos", JSON.stringify(pedidos));
}

export function getTodosPedidos(): Pedido[] {
  const pedidos = localStorage.getItem("pedidos");
  return pedidos ? JSON.parse(pedidos) : [];
}

export async function getTodosPedidosAsync(businessId?: string): Promise<Pedido[]> {
  if (USE_SUPABASE && businessId) {
    try {
      // Usar las nuevas acciones de Supabase
      const pedidos = await obtenerPedidos(businessId);
      return pedidos;
    } catch (error) {
      console.error('Error obteniendo pedidos de Supabase, usando localStorage:', error);
      return getTodosPedidos();
    }
  }
  return getTodosPedidos();
}

export async function actualizarEstadoPedido(id: string, nuevoEstado: EstadoPedido, businessId?: string) {
  // Si está habilitado Supabase, actualizar primero en Supabase
  if (USE_SUPABASE && businessId) {
    try {
      await actualizarEstadoPedidoAsync(id, nuevoEstado, businessId);
    } catch (error) {
      console.error('Error actualizando estado en Supabase:', error);
      throw error;
    }
  }
  
  // Actualizar localStorage como fallback
  const pedidos = getTodosPedidos();
  const index = pedidos.findIndex(p => p.id === id);
  if (index >= 0) {
    pedidos[index].estado = nuevoEstado;
    localStorage.setItem("pedidos", JSON.stringify(pedidos));
    
    // Si es el pedido actual, también actualizarlo
    const pedidoActual = getPedidoActual();
    if (pedidoActual && pedidoActual.id === id) {
      pedidoActual.estado = nuevoEstado;
      localStorage.setItem("pedidoActual", JSON.stringify(pedidoActual));
    }
    
    // Disparar evento para actualizar contador en tiempo real
    window.dispatchEvent(new CustomEvent('pedidosActualizados'));
  }
}

export async function actualizarEstadoPedidoAsync(id: string, nuevoEstado: EstadoPedido, businessId?: string) {
  if (USE_SUPABASE && businessId) {
    try {
      // Usar las nuevas acciones de Supabase
      await actualizarEstadoSupabase(id, nuevoEstado, businessId);
    } catch (error) {
      console.error('Error actualizando estado en Supabase:', error);
      throw error;
    }
  }
}

export async function guardarPedidosAsync(pedidos: Pedido[]) {
  if (USE_SUPABASE) {
    try {
      await apiCall('/pedidos', {
        method: 'POST',
        body: JSON.stringify({ pedidos })
      });
      localStorage.setItem("pedidos", JSON.stringify(pedidos));
    } catch (error) {
      console.error('Error guardando pedidos en Supabase:', error);
      localStorage.setItem("pedidos", JSON.stringify(pedidos));
      throw error;
    }
  } else {
    localStorage.setItem("pedidos", JSON.stringify(pedidos));
  }
}

export function generarIdPedido(): string {
  const num = Math.floor(Math.random() * 900) + 100;
  return `Q${num}`;
}

export function calcularSubtotal(items: ItemPedido[]): number {
  return items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
}

export function calcularTotal(subtotal: number, cupon?: { descuento: number }, precioEnvio?: number): number {
  let total = subtotal;
  
  // Aplicar descuento del cupón
  if (cupon) {
    total -= cupon.descuento;
  }
  
  // Agregar precio de envío (si no se proporciona, usar 20 como valor por defecto)
  const envio = precioEnvio || 20;
  total += envio;
  
  return Math.max(0, total); // Asegurar que el total no sea negativo
}

export function getEstadoInfo(estado: EstadoPedido): { color: string; texto: string } {
  const estados = {
    NUEVO: { color: "bg-blue-500 text-white", texto: "Nuevo pedido" },
    PREPARANDO: { color: "bg-amber-500 text-white", texto: "Preparando" },
    LISTO: { color: "bg-emerald-500 text-white", texto: "Listo" },
    EN_CAMINO: { color: "bg-purple-500 text-white", texto: "En camino" },
    ENTREGADO: { color: "bg-green-700 text-white", texto: "Entregado" }
  };
  return estados[estado];
}

// Función para crear un nuevo pedido usando Supabase
export async function crearPedidoNuevo(pedido: Omit<Pedido, 'id' | 'timestamp' | 'hora'>, businessId?: string): Promise<Pedido> {
  if (USE_SUPABASE && businessId) {
    try {
      return await crearPedidoSupabase(pedido, businessId);
    } catch (error) {
      console.error('Error creando pedido en Supabase:', error);
      throw error;
    }
  } else {
    // Fallback a localStorage
    const nuevoPedido: Pedido = {
      ...pedido,
      id: generarIdPedido(),
      timestamp: Date.now(),
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    };
    
    const pedidos = getTodosPedidos();
    pedidos.push(nuevoPedido);
    localStorage.setItem("pedidos", JSON.stringify(pedidos));
    
    return nuevoPedido;
  }
}

// Función para obtener un pedido específico
export async function obtenerPedido(id: string, businessId?: string): Promise<Pedido | null> {
  if (USE_SUPABASE && businessId) {
    try {
      return await obtenerPedidoPorId(id, businessId);
    } catch (error) {
      console.error('Error obteniendo pedido de Supabase:', error);
      return null;
    }
  } else {
    const pedidos = getTodosPedidos();
    return pedidos.find(p => p.id === id) || null;
  }
}
