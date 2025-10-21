import { apiCall } from './supabase/client';

export type EstadoPedido = 
  | "NUEVO" 
  | "PREPARANDO" 
  | "LISTO" 
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
      total: 155,
      hora: new Date(ahora - 1 * 60000).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      tipo: "Delivery",
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
      total: 115,
      hora: new Date(ahora - 2 * 60000).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      tipo: "Recoger",
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
      total: 180,
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
      total: 146,
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
      total: 170,
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

export async function getTodosPedidosAsync(): Promise<Pedido[]> {
  if (USE_SUPABASE) {
    try {
      const response = await apiCall('/pedidos');
      return response.pedidos || [];
    } catch (error) {
      console.error('Error obteniendo pedidos de Supabase, usando localStorage:', error);
      return getTodosPedidos();
    }
  }
  return getTodosPedidos();
}

export function actualizarEstadoPedido(id: string, nuevoEstado: EstadoPedido) {
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
    
    // Si está habilitado Supabase, sincronizar
    if (USE_SUPABASE) {
      actualizarEstadoPedidoAsync(id, nuevoEstado).catch(error => {
        console.error('Error sincronizando con Supabase:', error);
      });
    }
    
    // Disparar evento para actualizar contador en tiempo real
    window.dispatchEvent(new CustomEvent('pedidosActualizados'));
  }
}

export async function actualizarEstadoPedidoAsync(id: string, nuevoEstado: EstadoPedido) {
  if (USE_SUPABASE) {
    try {
      await apiCall(`/pedidos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ estado: nuevoEstado })
      });
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

export function calcularTotal(items: ItemPedido[]): number {
  return items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
}

export function getEstadoInfo(estado: EstadoPedido): { color: string; texto: string } {
  const estados = {
    NUEVO: { color: "bg-blue-500 text-white", texto: "Nuevo pedido" },
    PREPARANDO: { color: "bg-amber-500 text-white", texto: "Preparando" },
    LISTO: { color: "bg-emerald-500 text-white", texto: "Listo" },
    ENTREGADO: { color: "bg-green-700 text-white", texto: "Entregado" }
  };
  return estados[estado];
}
