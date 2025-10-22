import { useEffect, useState } from "react";
import { ChefHat, Clock, Eye, CheckCircle2, PlayCircle, Package, Bell, Car } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { getTodosPedidos, getTodosPedidosAsync, actualizarEstadoPedido, getEstadoInfo, type Pedido, type EstadoPedido } from "../utils/pedidos";
import { obtenerTelefonoUsuario } from "../utils/url";
import { supabase } from "../supabase/initSupabase";
import { toast } from "sonner@2.0.3";

type Filtro = "todos" | "NUEVO" | "PREPARANDO" | "LISTO" | "EN_CAMINO" | "ENTREGADO";

export function Cocina() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [pedidoAnimando, setPedidoAnimando] = useState<string | null>(null);
  const [contadorAnimando, setContadorAnimando] = useState<EstadoPedido | null>(null);
  const [mostrarVerificacion, setMostrarVerificacion] = useState(false);
  const [codigoVerificacion, setCodigoVerificacion] = useState("");
  const [pedidoParaEntregar, setPedidoParaEntregar] = useState<Pedido | null>(null);

  const cargarPedidos = async () => {
    try {
      const userPhone = obtenerTelefonoUsuario();
      const todosPedidos = await getTodosPedidosAsync(userPhone);
      setPedidos(todosPedidos);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
      // Fallback a localStorage
      const todosPedidos = getTodosPedidos();
      setPedidos(todosPedidos);
    }
  };

  useEffect(() => {
    cargarPedidos();
    
    // Escuchar evento de actualización de pedidos
    const handlePedidosChange = () => {
      cargarPedidos();
    };
    
    window.addEventListener('pedidosActualizados', handlePedidosChange);

    return () => {
      window.removeEventListener('pedidosActualizados', handlePedidosChange);
    };
  }, []);

  const pedidosFiltrados = pedidos.filter(p => {
    if (filtro === "todos") return true;
    return p.estado === filtro;
  }).sort((a, b) => {
    // Pedidos NUEVOS siempre arriba
    if (a.estado === "NUEVO" && b.estado !== "NUEVO") return -1;
    if (a.estado !== "NUEVO" && b.estado === "NUEVO") return 1;
    return 0;
  });

  const abrirDetalle = (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
    setDialogAbierto(true);
  };

  const cambiarEstadoPedido = async (id: string, nuevoEstado: EstadoPedido) => {
    // Si se intenta marcar como entregado, mostrar modal de verificación
    if (nuevoEstado === "ENTREGADO") {
      const pedido = pedidos.find(p => p.id === id);
      if (pedido) {
        setPedidoParaEntregar(pedido);
        setMostrarVerificacion(true);
        return;
      }
    }

    // Activar animación
    setPedidoAnimando(id);
    
    // Esperar que termine la animación antes de actualizar
    setTimeout(async () => {
      try {
        const userPhone = obtenerTelefonoUsuario();
        await actualizarEstadoPedido(id, nuevoEstado, userPhone);
        await cargarPedidos();
        setPedidoAnimando(null);
      } catch (error) {
        console.error('Error actualizando estado:', error);
        setPedidoAnimando(null);
      }
      
      // Animar el contador del nuevo estado
      setContadorAnimando(nuevoEstado);
      setTimeout(() => setContadorAnimando(null), 1000);
      
      // Mostrar toast de confirmación
      const mensajes: Record<EstadoPedido, string> = {
        NUEVO: "🆕 Nuevo pedido",
        PREPARANDO: "🍳 Pedido en preparación",
        LISTO: "✅ Pedido listo para entregar",
        EN_CAMINO: "🚚 Pedido en camino",
        ENTREGADO: "📦 Pedido entregado"
      };
      
      toast.success(mensajes[nuevoEstado] || "Estado actualizado", {
        description: `Pedido #${id} actualizado correctamente`,
        duration: 3000,
      });
      
      // Actualizar pedido seleccionado si está abierto
      if (pedidoSeleccionado && pedidoSeleccionado.id === id) {
        setPedidoSeleccionado({ ...pedidoSeleccionado, estado: nuevoEstado });
      }
    }, 500);
  };

  const verificarCodigo = async () => {
    console.log("Código ingresado:", codigoVerificacion);
    console.log("Pedido ID:", pedidoParaEntregar?.id);
    
    if (!pedidoParaEntregar || !codigoVerificacion.trim()) {
      toast.error("Por favor ingresa el código de verificación");
      return;
    }

    try {
      // Validar el código contra Supabase
      const userPhone = obtenerTelefonoUsuario();
      const { data: order, error } = await supabase
        .from('orders')
        .select('confirmation_code')
        .eq('id', parseInt(pedidoParaEntregar.id))
        .eq('user_phone', userPhone)
        .single();

      if (error) {
        console.error('Error obteniendo código de confirmación:', error);
        toast.error("Error validando el código", {
          description: "No se pudo verificar el código de confirmación",
          duration: 3000,
        });
        return;
      }

      const codigoCorrecto = order?.confirmation_code === codigoVerificacion.trim();
      console.log("Código en BD:", order?.confirmation_code);
      console.log("Código ingresado:", codigoVerificacion.trim());
      console.log("Código correcto:", codigoCorrecto);
      
      if (codigoCorrecto) {
        // Cerrar modal primero
        setMostrarVerificacion(false);
        setCodigoVerificacion("");
        setPedidoParaEntregar(null);
        
        // Actualizar el estado directamente sin pasar por la validación de ENTREGADO
        try {
          const userPhone = obtenerTelefonoUsuario();
          await actualizarEstadoPedido(pedidoParaEntregar.id, "ENTREGADO", userPhone);
          await cargarPedidos();
          
          // Actualizar pedido seleccionado si está abierto
          if (pedidoSeleccionado && pedidoSeleccionado.id === pedidoParaEntregar.id) {
            setPedidoSeleccionado({ ...pedidoSeleccionado, estado: "ENTREGADO" });
          }
          
          toast.success("Código verificado correctamente", {
            description: "Pedido marcado como entregado",
            duration: 3000,
          });
        } catch (error) {
          console.error('Error actualizando estado:', error);
          toast.error("Error actualizando el pedido", {
            description: "El código fue correcto pero hubo un error al actualizar",
            duration: 3000,
          });
        }
      } else {
        toast.error("Código de verificación inválido", {
          description: "El código ingresado no coincide con el código de confirmación",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error en verificación:', error);
      toast.error("Error validando el código", {
        description: "Ocurrió un error al verificar el código",
        duration: 3000,
      });
    }
  };

  const cancelarVerificacion = () => {
    setMostrarVerificacion(false);
    setCodigoVerificacion("");
    setPedidoParaEntregar(null);
  };

  const obtenerSiguienteEstado = (estadoActual: EstadoPedido): { estado: EstadoPedido; texto: string; icono: any; color: string } | null => {
    const transiciones: Record<EstadoPedido, { estado: EstadoPedido; texto: string; icono: any; color: string } | null> = {
      NUEVO: { estado: "PREPARANDO", texto: "Iniciar preparación", icono: PlayCircle, color: "bg-amber-500 hover:bg-amber-600" },
      PREPARANDO: { estado: "LISTO", texto: "Marcar como listo", icono: CheckCircle2, color: "bg-cyan-500 hover:bg-cyan-600" },
      LISTO: { estado: "EN_CAMINO", texto: "Enviar pedido", icono: Package, color: "bg-purple-500 hover:bg-purple-600" },
      EN_CAMINO: { estado: "ENTREGADO", texto: "Marcar entregado", icono: CheckCircle2, color: "!bg-green-600 hover:!bg-green-700" },
      ENTREGADO: null
    };
    return transiciones[estadoActual];
  };

  const obtenerIconoEstado = (estado: EstadoPedido) => {
    const iconos = {
      NUEVO: Bell,
      PREPARANDO: ChefHat,
      LISTO: CheckCircle2,
      EN_CAMINO: Car,
      ENTREGADO: Package
    };
    return iconos[estado];
  };

  const obtenerColoresEstado = (estado: EstadoPedido) => {
    const colores = {
      NUEVO: {
        icono: 'text-emerald-500',
        badge: 'bg-emerald-500 text-white',
        badgeActivo: 'bg-white/20 text-white',
        animacion: 'animate-badge-pulse-emerald'
      },
      PREPARANDO: {
        icono: 'text-amber-500',
        badge: 'bg-amber-500 text-white',
        badgeActivo: 'bg-white/20 text-white',
        animacion: 'animate-badge-pulse-amber'
      },
      LISTO: {
        icono: 'text-cyan-500',
        badge: 'bg-cyan-500 text-white',
        badgeActivo: 'bg-white/20 text-white',
        animacion: 'animate-badge-pulse-cyan'
      },
      EN_CAMINO: {
        icono: 'text-purple-500',
        badge: 'bg-purple-500 text-white',
        badgeActivo: 'bg-white/20 text-white',
        animacion: 'animate-badge-pulse-purple'
      },
      ENTREGADO: {
        icono: 'text-green-500',
        badge: 'bg-green-500 text-white',
        badgeActivo: 'bg-white/20 text-white',
        animacion: 'animate-badge-pulse-green'
      }
    };
    return colores[estado];
  };

  const contarPorEstado = (estado: EstadoPedido) => {
    return pedidos.filter(p => p.estado === estado).length;
  };

  const filtros: { id: Filtro; label: string; count?: number }[] = [
    { id: "todos", label: "Todos", count: pedidos.length },
    { id: "NUEVO", label: "Nuevos", count: contarPorEstado("NUEVO") },
    { id: "PREPARANDO", label: "Preparando", count: contarPorEstado("PREPARANDO") },
    { id: "LISTO", label: "Listos", count: contarPorEstado("LISTO") },
    { id: "EN_CAMINO", label: "En camino", count: contarPorEstado("EN_CAMINO") },
    { id: "ENTREGADO", label: "Entregados", count: contarPorEstado("ENTREGADO") }
  ];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex gap-2 pb-2 flex-wrap">
            {filtros.map((f) => {
              const IconoFiltro = f.id === "todos" ? null : obtenerIconoEstado(f.id as EstadoPedido);
              const colores = f.id !== "todos" ? obtenerColoresEstado(f.id as EstadoPedido) : null;
              
              return (
                <button
                  key={f.id}
                  onClick={() => setFiltro(f.id)}
                  className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 flex-shrink-0 relative ${
                    filtro === f.id
                      ? 'bg-[#0C3B2A] text-white shadow-md scale-105'
                      : 'bg-gray-100 text-[#64748B] hover:bg-gray-200'
                  }`}
                >
                  {/* Indicador parpadeante para NUEVO */}
                  {f.id === "NUEVO" && f.count && f.count > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full pulse-dot"></div>
                      <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full opacity-50 animate-ping"></div>
                    </div>
                  )}
                  {IconoFiltro && (
                    <IconoFiltro className={`w-4 h-4 ${
                      filtro === f.id ? '' : colores?.icono || ''
                    }`} />
                  )}
                  <span>{f.label}</span>
                  {f.count !== undefined && f.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs transition-all ${
                      filtro === f.id 
                        ? (colores?.badgeActivo || 'bg-white/20')
                        : (colores?.badge || 'bg-gray-200')
                    } ${
                      contadorAnimando === f.id ? (colores?.animacion || '') : ''
                    }`}>
                      {f.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
      </div>

      {/* Lista de pedidos */}
      <div>
        {pedidosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <ChefHat className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-[#64748B]">No hay pedidos en esta categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pedidosFiltrados.map((pedido) => {
              const estadoInfo = getEstadoInfo(pedido.estado);
              const siguienteEstado = obtenerSiguienteEstado(pedido.estado);
              const IconoEstado = obtenerIconoEstado(pedido.estado);
              const estaAnimando = pedidoAnimando === pedido.id;
              
              return (
                <div 
                  key={pedido.id} 
                  className={`bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-gray-100 relative ${
                    estaAnimando ? 'animate-slide-out-up' : 'animate-slide-in'
                  }`}
                >
                  {/* Círculo verde parpadeante para pedidos nuevos */}
                  {pedido.estado === "NUEVO" && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <div className="relative">
                        <div className="w-4 h-4 bg-emerald-500 rounded-full pulse-dot"></div>
                        <div className="absolute inset-0 w-4 h-4 bg-emerald-500 rounded-full opacity-50 animate-ping"></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4 md:p-6">
                    {/* Header con usuario y número de pedido */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 pb-4 border-b border-gray-100">
                      {/* Foto del usuario */}
                      <img 
                        src={pedido.usuario.foto} 
                        alt={pedido.usuario.nombre}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                      />
                      
                      {/* Info del usuario y pedido */}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-[#1E293B] mb-1">{pedido.usuario.nombre}</h2>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="text-[#64748B] text-sm">Pedido #{pedido.id}</span>
                          <Badge variant="outline" className="bg-white border-gray-300 text-gray-600 text-xs">
                            <IconoEstado className="w-3 h-3 mr-1" />
                            {estadoInfo.texto}
                          </Badge>
                        </div>
                      </div>

                      {/* Acciones principales - adaptadas para móvil */}
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          className="hover:bg-gray-50 h-10 sm:h-12 px-3 sm:px-6 flex-1 sm:flex-none text-sm"
                          onClick={() => abrirDetalle(pedido)}
                        >
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                          <span className="hidden sm:inline">Ver detalle</span>
                          <span className="sm:hidden">Ver</span>
                        </Button>

                        {siguienteEstado && (
                          <Button
                            className={`h-10 sm:h-12 px-3 sm:px-6 transition-all flex-1 sm:flex-none text-sm text-white ${siguienteEstado.color} ${
                              estaAnimando ? 'scale-95 opacity-50' : 'hover:scale-105'
                            }`}
                            onClick={() => cambiarEstadoPedido(pedido.id, siguienteEstado.estado)}
                            disabled={estaAnimando}
                          >
                            <siguienteEstado.icono className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                            <span className="hidden sm:inline">{siguienteEstado.texto}</span>
                            <span className="sm:hidden">
                              {siguienteEstado.estado === 'PREPARANDO' && 'Iniciar'}
                              {siguienteEstado.estado === 'LISTO' && 'Listo'}
                              {siguienteEstado.estado === 'EN_CAMINO' && 'Enviar'}
                              {siguienteEstado.estado === 'ENTREGADO' && 'Entregar'}
                            </span>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Detalles del pedido */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-[#64748B] mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{pedido.hora}</span>
                      </div>
                      <span>•</span>
                      <span>{pedido.tipo}</span>
                      <span>•</span>
                      <span className="text-[#FF6B00]">${pedido.total} MXN</span>
                    </div>

                    {/* Vista rápida de items */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {pedido.items.slice(0, 4).map(item => (
                        <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
                          {item.imagen && (
                            <img 
                              src={item.imagen} 
                              alt={item.nombre}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-[#1E293B] truncate">{item.nombre}</p>
                            <p className="text-[10px] sm:text-xs text-[#64748B]">x{item.cantidad}</p>
                          </div>
                        </div>
                      ))}
                      {pedido.items.length > 4 && (
                        <div className="flex items-center justify-center bg-gray-50 rounded-xl p-2">
                          <p className="text-xs sm:text-sm text-[#64748B]">+{pedido.items.length - 4} más</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog de detalle */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del pedido #{pedidoSeleccionado?.id}</DialogTitle>
            <DialogDescription>
              Información completa del pedido y acciones disponibles
            </DialogDescription>
          </DialogHeader>

          {pedidoSeleccionado && (
            <div>
              {/* Info del usuario */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <img 
                  src={pedidoSeleccionado.usuario.foto} 
                  alt={pedidoSeleccionado.usuario.nombre}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
                <div>
                  <h3 className="text-[#1E293B]">{pedidoSeleccionado.usuario.nombre}</h3>
                  <p className="text-sm text-[#64748B]">Cliente</p>
                </div>
              </div>

              {/* Estado actual */}
              <div className={`p-4 ${getEstadoInfo(pedidoSeleccionado.estado).color} rounded-xl mb-4`}>
                <div className="flex items-center gap-3">
                  {(() => {
                    const IconoEstadoDialog = obtenerIconoEstado(pedidoSeleccionado.estado);
                    return <IconoEstadoDialog className="w-8 h-8 text-white" />;
                  })()}
                  <div>
                    <p className="text-sm text-white/80">Estado actual</p>
                    <p className="text-white">{getEstadoInfo(pedidoSeleccionado.estado).texto}</p>
                  </div>
                </div>
              </div>

               {/* Info general */}
               {/* <div className="p-4 bg-gray-50 rounded-xl">
                 <p className="text-sm text-[#64748B] mb-1">Tipo de orden</p>
                 <p className="text-[#1E293B]">{pedidoSeleccionado.tipo}</p>
               </div> */}

               {/* Tipo de entrega y datos específicos */}
               {pedidoSeleccionado.tipoEntrega && (
                 <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4">
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                       <h3 className="text-[#1E293B] font-medium">
                         {pedidoSeleccionado.tipoEntrega === "caseta" ? "Entrega en Caseta" : "Entrega Gubernamental"}
                       </h3>
                     </div>
                     <div className="text-right">
                       <p className="text-sm text-[#64748B]">Hora recibida</p>
                       <p className="text-[#1E293B] font-medium">{pedidoSeleccionado.hora}</p>
                     </div>
                   </div>
                   
                   {pedidoSeleccionado.tipoEntrega === "caseta" ? (
                     <div className="space-y-2">
                       <div>
                         <p className="text-sm text-[#64748B] mb-1">Dirección de entrega</p>
                         <p className="text-[#1E293B] text-sm">{pedidoSeleccionado.direccion}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                         <div>
                           <p className="text-sm text-[#64748B] mb-1">Vehículo</p>
                           <p className="text-[#1E293B] text-sm">{pedidoSeleccionado.vehiculo}</p>
                         </div>
                         <div>
                           <p className="text-sm text-[#64748B] mb-1">Placas</p>
                           <p className="text-[#1E293B] text-sm font-mono">{pedidoSeleccionado.placas}</p>
                         </div>
                       </div>
                     </div>
                   ) : (
                     <div>
                       <p className="text-sm text-[#64748B] mb-1">Dirección de entrega</p>
                       <p className="text-[#1E293B] text-sm">{pedidoSeleccionado.direccion}</p>
                     </div>
                   )}
                 </div>
               )}

              {/* Productos */}
              <div style={{ height: '220px', overflowY: 'auto' }}>
                <h3 className="text-[#1E293B] mb-3">Productos del pedido</h3>
                <div className="space-y-2">
                  {pedidoSeleccionado.items.map((item) => (
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
                      <p className="text-[#FF6B00]">${item.precio * item.cantidad}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[#1E293B]">Subtotal</span>
                    <span className="text-[#1E293B]">${pedidoSeleccionado.subtotal} MXN</span>
                  </div>
                  {pedidoSeleccionado.cupon && (
                    <div className="flex justify-between items-center">
                      <span className="text-green-600">Descuento ({pedidoSeleccionado.cupon.codigo})</span>
                      <span className="text-green-600">-${pedidoSeleccionado.cupon.descuento} MXN</span>
                    </div>
                  )}
                  {pedidoSeleccionado.precioEnvio && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#64748B]">Envío</span>
                      <span className="text-[#64748B]">+${pedidoSeleccionado.precioEnvio} MXN</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-[#1E293B] font-semibold">Total</span>
                    <span className="text-[#FF6B00] font-semibold text-lg">${pedidoSeleccionado.total} MXN</span>
                  </div>
                </div>
              </div>

              {/* Nota del cliente */}
              {pedidoSeleccionado.nota && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-sm text-[#64748B] mb-1">Nota del cliente:</p>
                  <p className="text-[#1E293B]">{pedidoSeleccionado.nota}</p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-3 pt-4">
                {obtenerSiguienteEstado(pedidoSeleccionado.estado) && (
                  <Button
                    className={`flex-1 h-12 ${obtenerSiguienteEstado(pedidoSeleccionado.estado)?.color} text-white`}
                    onClick={() => {
                      const siguiente = obtenerSiguienteEstado(pedidoSeleccionado.estado);
                      if (siguiente) {
                        cambiarEstadoPedido(pedidoSeleccionado.id, siguiente.estado);
                      }
                    }}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    {obtenerSiguienteEstado(pedidoSeleccionado.estado)?.texto}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setDialogAbierto(false)}
                  className="flex-1 h-12"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de verificación de código */}
      <Dialog open={mostrarVerificacion} onOpenChange={setMostrarVerificacion}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Verificación de entrega</DialogTitle>
            <DialogDescription>
              Ingresa el código de verificación para confirmar la entrega del pedido #{pedidoParaEntregar?.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#1E293B] mb-2 block">
                Código de verificación
              </label>
              <Input
                type="text"
                placeholder="Ingresa el código"
                value={codigoVerificacion}
                onChange={(e) => setCodigoVerificacion(e.target.value)}
                className="w-full"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    verificarCodigo();
                  }
                }}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={verificarCodigo}
                disabled={!codigoVerificacion.trim()}
                className={`flex-1 px-4 py-3 rounded-lg text-white font-semibold text-base ${
                  codigoVerificacion.trim() 
                    ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-md' 
                    : 'bg-gray-500 cursor-not-allowed'
                }`}
                style={{
                  backgroundColor: codigoVerificacion.trim() ? '#0C3B2A' : '#6b7280',
                  border: 'none',
                  outline: 'none'
                }}
              >
                {/* <CheckCircle2 className="w-5 h-5 mr-2 inline" /> */}
                Verificar y entregar
              </button>
              <button
                onClick={cancelarVerificacion}
                className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-400 bg-white hover:bg-gray-100 text-gray-800 font-semibold text-base"
                style={{
                  borderColor: '#9ca3af',
                  color: '#1f2937'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}