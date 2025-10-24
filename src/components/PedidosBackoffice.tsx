import { useEffect, useState } from "react";
import { Search, Eye, Trash2, Download } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { getTodosPedidos, actualizarEstadoPedido, type Pedido, type EstadoPedido, getEstadoInfo } from "../utils/pedidos";
import { obtenerPedidos, actualizarEstadoPedido as actualizarEstadoPedidoSupabase } from "../supabase/actions/pedidos";
import { obtenerBusinessId } from "../utils/url";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export function PedidosBackoffice() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarPedidos = async () => {
    try {
      setCargando(true);
      setError(null);
      
      const businessId = obtenerBusinessId();
      const todosPedidos = await obtenerPedidos(businessId);
      setPedidos(todosPedidos);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
      setError("Error al cargar los pedidos. Usando datos locales como respaldo.");
      
      // Fallback a localStorage
      try {
        const todosPedidos = getTodosPedidos();
        setPedidos(todosPedidos);
      } catch (fallbackError) {
        console.error("Error en fallback:", fallbackError);
        setError("No se pudieron cargar los pedidos.");
      }
    } finally {
      setCargando(false);
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
    const matchBusqueda = p.id.toLowerCase().includes(busqueda.toLowerCase()) ||
                         p.usuario.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = filtroEstado === "todos" || p.estado === filtroEstado;
    return matchBusqueda && matchEstado;
  });

  const abrirDetalle = (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
    setDialogAbierto(true);
  };

  const cambiarEstado = async (id: string, nuevoEstado: EstadoPedido) => {
    try {
      setCargando(true);
      setError(null);
      
      const businessId = obtenerBusinessId();
      await actualizarEstadoPedidoSupabase(id, nuevoEstado, businessId);
      
      // Actualizar estado local inmediatamente
      setPedidos(prev => prev.map(p => 
        p.id === id ? { ...p, estado: nuevoEstado } : p
      ));
      
      if (pedidoSeleccionado && pedidoSeleccionado.id === id) {
        setPedidoSeleccionado({ ...pedidoSeleccionado, estado: nuevoEstado });
      }
      
      // Disparar evento para actualizar otras secciones
      window.dispatchEvent(new CustomEvent('pedidosActualizados'));
    } catch (error) {
      console.error("Error actualizando estado:", error);
      setError("Error al actualizar el estado del pedido. Intentando con datos locales.");
      
      // Fallback a actualización local
      try {
        actualizarEstadoPedido(id, nuevoEstado);
        cargarPedidos();
        if (pedidoSeleccionado && pedidoSeleccionado.id === id) {
          setPedidoSeleccionado({ ...pedidoSeleccionado, estado: nuevoEstado });
        }
      } catch (fallbackError) {
        console.error("Error en fallback de actualización:", fallbackError);
        setError("No se pudo actualizar el estado del pedido.");
      }
    } finally {
      setCargando(false);
    }
  };

  const eliminarPedido = (id: string) => {
    if (confirm("¿Eliminar este pedido?")) {
      const pedidosActualizados = pedidos.filter(p => p.id !== id);
      localStorage.setItem("pedidos", JSON.stringify(pedidosActualizados));
      cargarPedidos();
    }
  };

  const exportarCSV = () => {
    const headers = ["ID", "Cliente", "Total", "Estado", "Tipo", "Fecha", "Hora"];
    const rows = pedidos.map(p => [
      p.id,
      p.usuario.nombre,
      p.total,
      p.estado,
      p.tipo,
      new Date(p.timestamp).toLocaleDateString('es-MX', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }),
      p.hora
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pedidos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalPedidos = pedidos.length;
  const totalVentas = pedidos.reduce((sum, p) => sum + p.total, 0);
  const pedidosNuevos = pedidos.filter(p => p.estado === "NUEVO").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-[#64748B] mb-1">Total pedidos</p>
          <p className="text-2xl text-[#1E293B]">{totalPedidos}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-[#64748B] mb-1">Ventas totales</p>
          <p className="text-2xl text-[#1E293B]">${totalVentas.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-[#64748B] mb-1">Pedidos nuevos</p>
          <p className="text-2xl text-[#1E293B]">{pedidosNuevos}</p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por ID o cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="NUEVO">Nuevo</SelectItem>
              <SelectItem value="PREPARANDO">Preparando</SelectItem>
              <SelectItem value="LISTO">Listo</SelectItem>
              <SelectItem value="EN_CAMINO">En camino</SelectItem>
              <SelectItem value="ENTREGADO">Entregado</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={exportarCSV}
            className="whitespace-nowrap"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Tabla de pedidos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Indicador de carga */}
        {cargando && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-[#0C3B2A] border-t-transparent rounded-full animate-spin" />
              <span className="text-[#64748B]">Cargando pedidos...</span>
            </div>
          </div>
        )}

        {/* Vista de tabla para desktop */}
        {!cargando && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm text-[#64748B]">ID</th>
                  <th className="px-6 py-4 text-left text-sm text-[#64748B]">Cliente</th>
                  <th className="px-6 py-4 text-left text-sm text-[#64748B]">Total</th>
                  <th className="px-6 py-4 text-left text-sm text-[#64748B]">Estado</th>
                  <th className="px-6 py-4 text-left text-sm text-[#64748B]">Tipo</th>
                  <th className="px-6 py-4 text-left text-sm text-[#64748B]">Fecha</th>
                  <th className="px-6 py-4 text-left text-sm text-[#64748B]">Hora</th>
                  <th className="px-6 py-4 text-left text-sm text-[#64748B]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pedidosFiltrados.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[#1E293B]">#{pedido.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={pedido.usuario.foto} 
                          alt={pedido.usuario.nombre}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="text-[#1E293B]">{pedido.usuario.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#FE7F1E]">${pedido.total.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <Badge className={getEstadoInfo(pedido.estado).color}>
                        {getEstadoInfo(pedido.estado).texto}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[#64748B]">{pedido.tipo}</td>
                    <td className="px-6 py-4 text-[#64748B]">
                      {new Date(pedido.timestamp).toLocaleDateString('es-MX', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="px-6 py-4 text-[#64748B]">{pedido.hora}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirDetalle(pedido)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => eliminarPedido(pedido.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Vista de tarjetas para móvil */}
        {!cargando && (
          <div className="md:hidden divide-y divide-gray-100">
          {pedidosFiltrados.map((pedido) => (
            <div key={pedido.id} className="p-4 hover:bg-gray-50 transition-colors">
              {/* Header de la tarjeta */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img 
                    src={pedido.usuario.foto} 
                    alt={pedido.usuario.nombre}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[#1E293B] truncate">{pedido.usuario.nombre}</p>
                    <p className="text-sm text-[#64748B]">#{pedido.id}</p>
                  </div>
                </div>
                <Badge className={getEstadoInfo(pedido.estado).color}>
                  {getEstadoInfo(pedido.estado).texto}
                </Badge>
              </div>

              {/* Detalles del pedido */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-[#64748B] mb-0.5">Total</p>
                  <p className="text-[#FE7F1E]">${pedido.total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-0.5">Tipo</p>
                  <p className="text-[#1E293B]">{pedido.tipo}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-0.5">Fecha</p>
                  <p className="text-[#1E293B]">
                    {new Date(pedido.timestamp).toLocaleDateString('es-MX', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-0.5">Hora</p>
                  <p className="text-[#1E293B]">{pedido.hora}</p>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => abrirDetalle(pedido)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver detalle
                </Button>
                <Button
                  variant="outline"
                  onClick={() => eliminarPedido(pedido.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          </div>
        )}

        {!cargando && pedidosFiltrados.length === 0 && (
          <div className="p-8 text-center text-[#64748B]">
            No se encontraron pedidos
          </div>
        )}
      </div>

      {/* Dialog de detalle */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del pedido #{pedidoSeleccionado?.id}</DialogTitle>
            <DialogDescription>
              Información completa del pedido y gestión de estado
            </DialogDescription>
          </DialogHeader>

          {pedidoSeleccionado && (
            <div className="space-y-4">
              {/* Cliente */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <img 
                  src={pedidoSeleccionado.usuario.foto} 
                  alt={pedidoSeleccionado.usuario.nombre}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-[#1E293B]">{pedidoSeleccionado.usuario.nombre}</h3>
                  <p className="text-sm text-[#64748B]">{pedidoSeleccionado.tipo} • {pedidoSeleccionado.hora}</p>
                </div>
                <Badge className={getEstadoInfo(pedidoSeleccionado.estado).color}>
                  {getEstadoInfo(pedidoSeleccionado.estado).texto}
                </Badge>
              </div>

              {/* Cambiar estado */}
              <div className="p-4 bg-blue-50 rounded-xl">
                <label className="text-sm text-[#64748B] block mb-2">Cambiar estado del pedido</label>
                <div className="flex items-center gap-2">
                  <Select 
                    value={pedidoSeleccionado.estado} 
                    onValueChange={(value) => cambiarEstado(pedidoSeleccionado.id, value as EstadoPedido)}
                    disabled={cargando}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NUEVO">Nuevo</SelectItem>
                      <SelectItem value="PREPARANDO">Preparando</SelectItem>
                      <SelectItem value="LISTO">Listo</SelectItem>
                      <SelectItem value="EN_CAMINO">En camino</SelectItem>
                      <SelectItem value="ENTREGADO">Entregado</SelectItem>
                    </SelectContent>
                  </Select>
                  {cargando && (
                    <div className="w-5 h-5 border-2 border-[#0C3B2A] border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>

              {/* Productos */}
              <div>
                <h4 className="text-[#1E293B] mb-3">Productos</h4>
                <div className="space-y-2">
                  {pedidoSeleccionado.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      {item.imagen && (
                        <img 
                          src={item.imagen} 
                          alt={item.nombre}
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-[#1E293B]">{item.nombre}</p>
                        <p className="text-sm text-[#64748B]">x{item.cantidad}</p>
                      </div>
                      <p className="text-[#FE7F1E]">${(item.precio * item.cantidad).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t flex justify-between items-center">
                  <span className="text-[#1E293B]">Total</span>
                  <span className="text-[#FE7F1E]">${pedidoSeleccionado.total.toFixed(2)}</span>
                </div>
              </div>

              {pedidoSeleccionado.nota && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-sm text-[#64748B] mb-1">Nota:</p>
                  <p className="text-[#1E293B]">{pedidoSeleccionado.nota}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}