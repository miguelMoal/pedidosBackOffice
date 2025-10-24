import { useState, useEffect } from "react";
import { Search, MapPin, Clock, Package, CheckCircle } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { getTodosPedidos, type Pedido } from "../utils/pedidos";
import { obtenerPedidos, obtenerPedidoPorId } from "../supabase/actions/pedidos";
import { obtenerBusinessId } from "../utils/url";

export function Seguimiento() {
  const [busqueda, setBusqueda] = useState("");
  const [pedidoEncontrado, setPedidoEncontrado] = useState<Pedido | null>(null);
  const [pedidosRecientes, setPedidosRecientes] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarPedidos = async () => {
      try {
        setCargando(true);
        setError(null);
        
        const businessId = obtenerBusinessId();
        const pedidos = await obtenerPedidos(businessId);
        
        // Filtrar pedidos: excluir solo ENTREGADO (DELIVERED)
        // PAYED se mapea a NUEVO pero debe mostrarse en seguimiento
        const pedidosFiltrados = pedidos.filter(pedido => 
          pedido.estado !== 'ENTREGADO'
        );
        
        // Mostrar todos los pedidos filtrados
        setPedidosRecientes(pedidosFiltrados);
      } catch (err) {
        console.error("Error cargando pedidos:", err);
        setError("Error al cargar los pedidos. Usando datos locales como respaldo.");
        
        // Fallback a datos locales
        try {
          const pedidos = getTodosPedidos();
          // Filtrar pedidos: excluir solo ENTREGADO (DELIVERED)
          // PAYED se mapea a NUEVO pero debe mostrarse en seguimiento
          const pedidosFiltrados = pedidos.filter(pedido => 
            pedido.estado !== 'ENTREGADO'
          );
          setPedidosRecientes(pedidosFiltrados);
        } catch (fallbackError) {
          console.error("Error en fallback:", fallbackError);
          setError("No se pudieron cargar los pedidos.");
        }
      } finally {
        setCargando(false);
      }
    };
    
    cargarPedidos();
  }, []);

  const buscarPedido = async () => {
    if (!busqueda.trim()) return;
    
    try {
      setCargando(true);
      setError(null);
      
      const businessId = obtenerBusinessId();
      
      // Primero intentar buscar por ID en Supabase
      const pedido = await obtenerPedidoPorId(busqueda.trim(), businessId);
      
      if (pedido && pedido.estado !== 'ENTREGADO') {
        setPedidoEncontrado(pedido);
      } else {
        // Si no se encuentra por ID, buscar en la lista local por nombre
        const pedidos = getTodosPedidos();
        const pedidoLocal = pedidos.find(p => 
          p.usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
          p.estado !== 'ENTREGADO'
        );
        setPedidoEncontrado(pedidoLocal || null);
      }
    } catch (err) {
      console.error("Error buscando pedido:", err);
      setError("Error al buscar el pedido. Intentando con datos locales.");
      
      // Fallback a búsqueda local
      try {
        const pedidos = getTodosPedidos();
        const pedido = pedidos.find(p => 
          (p.id.toLowerCase() === busqueda.toLowerCase() ||
          p.usuario.nombre.toLowerCase().includes(busqueda.toLowerCase())) &&
          p.estado !== 'ENTREGADO'
        );
        setPedidoEncontrado(pedido || null);
      } catch (fallbackError) {
        console.error("Error en fallback de búsqueda:", fallbackError);
        setError("No se pudo realizar la búsqueda.");
      }
    } finally {
      setCargando(false);
    }
  };

  const seleccionarPedido = (pedido: Pedido) => {
    setPedidoEncontrado(pedido);
    setBusqueda(pedido.id);
  };

  const obtenerPasoActual = (estado: string): number => {
    const pasos: Record<string, number> = {
      NUEVO: 0,
      PREPARANDO: 1,
      LISTO: 2,
      EN_CAMINO: 3,
      ENTREGADO: 4
    };
    return pasos[estado] || 0;
  };

  const obtenerEstiloEstado = (colorId: string, completado: boolean, activo: boolean) => {
    const colores: Record<string, { circulo: string; anillo: string; fondo: string; borde: string; texto: string }> = {
      gray: {
        circulo: 'bg-gray-500',
        anillo: 'ring-gray-100',
        fondo: 'bg-gray-50',
        borde: 'border-gray-200',
        texto: 'text-gray-500'
      },
      amber: {
        circulo: 'bg-amber-500',
        anillo: 'ring-amber-100',
        fondo: 'bg-amber-50',
        borde: 'border-amber-200',
        texto: 'text-amber-500'
      },
      blue: {
        circulo: 'bg-blue-500',
        anillo: 'ring-blue-100',
        fondo: 'bg-blue-50',
        borde: 'border-blue-200',
        texto: 'text-blue-500'
      },
      emerald: {
        circulo: 'bg-emerald-500',
        anillo: 'ring-emerald-100',
        fondo: 'bg-emerald-50',
        borde: 'border-emerald-200',
        texto: 'text-emerald-500'
      },
      purple: {
        circulo: 'bg-purple-500',
        anillo: 'ring-purple-100',
        fondo: 'bg-purple-50',
        borde: 'border-purple-200',
        texto: 'text-purple-500'
      }
    };

    const color = colores[colorId] || colores.gray;

    if (!completado) {
      return {
        circulo: 'bg-gray-200',
        contenedor: 'bg-gray-50 opacity-50',
        check: ''
      };
    }

    if (activo) {
      return {
        circulo: `${color.circulo} ring-4 ${color.anillo} scale-110`,
        contenedor: `${color.fondo} border-2 ${color.borde}`,
        check: color.texto
      };
    }

    return {
      circulo: color.circulo,
      contenedor: 'bg-gray-50',
      check: color.texto
    };
  };

  const estados = [
    { id: 0, nombre: "Recibido", descripcion: "Pedido confirmado", color: "gray", icon: Package },
    { id: 1, nombre: "En preparación", descripcion: "Cocinando tu pedido", color: "amber", icon: Clock },
    { id: 2, nombre: "Listo", descripcion: "Pedido listo para entregar", color: "blue", icon: CheckCircle },
    { id: 3, nombre: "En camino", descripcion: "Pedido en camino", color: "purple", icon: MapPin },
    { id: 4, nombre: "Entregado", descripcion: "Pedido completado", color: "emerald", icon: CheckCircle }
  ];

  return (
    <div className="space-y-6">
      {/* Buscador */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-[#1E293B] mb-4">Buscar pedido</h2>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por ID de pedido o nombre de cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && buscarPedido()}
              className="pl-10"
              disabled={cargando}
            />
          </div>
          <Button 
            onClick={buscarPedido}
            disabled={cargando || !busqueda.trim()}
            className="bg-[#0C3B2A] hover:bg-[#011d4a] text-white disabled:opacity-50"
          >
            {cargando ? (
              <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-5 h-5 mr-2" />
            )}
            {cargando ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
        
        {/* Mensaje de error */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Pedidos recientes - Solo mostrar si NO hay búsqueda activa */}
      {!pedidoEncontrado && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#0C3B2A] rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-[#1E293B]">Pedidos activos</h3>
              <p className="text-sm text-[#64748B]">Haz clic en un pedido para ver su seguimiento</p>
            </div>
          </div>

          {/* Indicador de carga */}
          {cargando && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-[#0C3B2A] border-t-transparent rounded-full animate-spin" />
                <span className="text-[#64748B]">Cargando pedidos...</span>
              </div>
            </div>
          )}

          {!cargando && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pedidosRecientes.map((pedido) => (
              <button
                key={pedido.id}
                onClick={() => seleccionarPedido(pedido)}
                className="p-4 bg-gray-100 hover:bg-[#0C3B2A] hover:text-white rounded-xl border border-gray-300 hover:border-[#0C3B2A] transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  <img 
                    src={pedido.usuario.foto} 
                    alt={pedido.usuario.nombre}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-[#0C3B2A] group-hover:text-white group-hover:underline">#{pedido.id}</span>
                      <span className={`w-2 h-2 rounded-full ${
                        pedido.estado === 'NUEVO' ? 'bg-emerald-500' :
                        pedido.estado === 'PREPARANDO' ? 'bg-amber-500' :
                        pedido.estado === 'LISTO' ? 'bg-cyan-500' :
                        pedido.estado === 'EN_CAMINO' ? 'bg-purple-500' :
                        'bg-emerald-500'
                      }`}></span>
                    </div>
                    <p className="text-[#1E293B] group-hover:text-white truncate">{pedido.usuario.nombre}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-[#64748B] group-hover:text-purple-200">{pedido.hora}</p>
                      <span className="text-xs text-[#FE7F1E] group-hover:text-[#FE7F1E]">${pedido.total}</span>
                    </div>
                    <p className="text-xs text-[#64748B] group-hover:text-purple-200 mt-1">{pedido.usuario.telefono}</p>
                  </div>
                </div>
              </button>
              ))}
            </div>
          )}

          {!cargando && pedidosRecientes.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-[#64748B]">No hay pedidos disponibles</p>
            </div>
          )}
        </div>
      )}

      {/* Resultado de búsqueda */}
      {pedidoEncontrado ? (
        <div className="space-y-6">
          {/* Botón para volver a la lista */}
          <Button
            variant="outline"
            onClick={() => {
              setPedidoEncontrado(null);
              setBusqueda("");
            }}
            className="mb-2"
          >
            ← Volver a pedidos recientes
          </Button>

          {/* Card resumen del pedido */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Info del cliente */}
              <div className="flex items-center gap-4">
                <img 
                  src={pedidoEncontrado.usuario.foto} 
                  alt={pedidoEncontrado.usuario.nombre}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
                <div>
                  <p className="text-sm text-[#64748B]">Cliente</p>
                  <h3 className="text-[#1E293B]">{pedidoEncontrado.usuario.nombre}</h3>
                  <p className="text-sm text-[#64748B]">Pedido #{pedidoEncontrado.id}</p>
                  <p className="text-sm text-[#64748B]">{pedidoEncontrado.usuario.telefono}</p>
                </div>
              </div>

              {/* Datos del pedido */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-[#64748B]">Total</p>
                  <p className="text-[#FE7F1E]">${pedidoEncontrado.total}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-[#64748B]">Hora</p>
                  <p className="text-[#1E293B]">{pedidoEncontrado.hora}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-[#64748B]">Tipo</p>
                  <p className="text-[#1E293B]">{pedidoEncontrado.tipo}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-[#64748B]">Items</p>
                  <p className="text-[#1E293B]">{pedidoEncontrado.items.length} productos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline de seguimiento */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-[#1E293B] mb-6">Estado del pedido</h3>

            <div className="relative">
              {/* Línea vertical */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              <div className="space-y-8">
                {estados.map((estado) => {
                  const pasoActual = obtenerPasoActual(pedidoEncontrado.estado);
                  const completado = estado.id <= pasoActual;
                  const activo = estado.id === pasoActual;
                  const Icono = estado.icon;
                  const estilos = obtenerEstiloEstado(estado.color, completado, activo);

                  return (
                    <div key={estado.id} className="relative flex items-start gap-4">
                      {/* Círculo del estado */}
                      <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        estilos.circulo
                      }`}>
                        <Icono className={`w-6 h-6 ${completado ? 'text-white' : 'text-gray-400'}`} />
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 pt-2">
                        <div className={`p-4 rounded-xl transition-all ${
                          estilos.contenedor
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`${completado ? 'text-[#1E293B]' : 'text-[#64748B]'}`}>
                              {estado.nombre}
                            </h4>
                            {completado && (
                              <CheckCircle className={`w-5 h-5 ${estilos.check}`} />
                            )}
                          </div>
                          <p className="text-sm text-[#64748B]">{estado.descripcion}</p>
                          {activo && (
                            <div className="mt-2 flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                              <span className="text-emerald-600">Estado actual</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Productos del pedido */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-[#1E293B] mb-4">Productos del pedido</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pedidoEncontrado.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  {item.imagen && (
                    <img 
                      src={item.imagen} 
                      alt={item.nombre}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-[#1E293B]">{item.nombre}</p>
                    <p className="text-sm text-[#64748B]">Cantidad: {item.cantidad}</p>
                  </div>
                  <p className="text-[#FE7F1E]">${item.precio * item.cantidad}</p>
                </div>
              ))}
            </div>
          </div>

          {pedidoEncontrado.nota && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-[#64748B] mb-1">Nota del pedido:</p>
              <p className="text-[#1E293B]">{pedidoEncontrado.nota}</p>
            </div>
          )}
        </div>
      ) : busqueda && !pedidoEncontrado ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-[#1E293B] mb-2">No se encontró el pedido</h3>
          <p className="text-[#64748B]">Verifica el ID o el nombre del cliente e intenta nuevamente</p>
        </div>
      ) : null}
    </div>
  );
}