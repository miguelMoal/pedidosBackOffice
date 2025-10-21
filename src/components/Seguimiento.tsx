import { useState, useEffect } from "react";
import { Search, MapPin, Clock, User, Package, CheckCircle } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { getTodosPedidos, type Pedido } from "../utils/pedidos";

export function Seguimiento() {
  const [busqueda, setBusqueda] = useState("");
  const [pedidoEncontrado, setPedidoEncontrado] = useState<Pedido | null>(null);
  const [pedidosRecientes, setPedidosRecientes] = useState<Pedido[]>([]);

  useEffect(() => {
    const pedidos = getTodosPedidos();
    // Mostrar los últimos 5 pedidos, ordenados por más recientes
    setPedidosRecientes(pedidos.slice(0, 5));
  }, []);

  const buscarPedido = () => {
    const pedidos = getTodosPedidos();
    const pedido = pedidos.find(p => 
      p.id.toLowerCase() === busqueda.toLowerCase() ||
      p.usuario.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
    setPedidoEncontrado(pedido || null);
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
      ENTREGADO: 3
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
    { id: 3, nombre: "Entregado", descripcion: "Pedido completado", color: "emerald", icon: MapPin }
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
            />
          </div>
          <Button 
            onClick={buscarPedido}
            className="bg-[#012B67] hover:bg-[#011d4a] text-white"
          >
            <Search className="w-5 h-5 mr-2" />
            Buscar
          </Button>
        </div>
      </div>

      {/* Pedidos recientes - Solo mostrar si NO hay búsqueda activa */}
      {!pedidoEncontrado && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#012B67] rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-[#1E293B]">Pedidos recientes</h3>
              <p className="text-sm text-[#64748B]">Haz clic en un pedido para ver su seguimiento</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pedidosRecientes.map((pedido) => (
              <button
                key={pedido.id}
                onClick={() => seleccionarPedido(pedido)}
                className="p-4 bg-gray-100 hover:bg-[#012B67] hover:text-white rounded-xl border border-gray-300 hover:border-[#012B67] transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  <img 
                    src={pedido.usuario.foto} 
                    alt={pedido.usuario.nombre}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-[#012B67] group-hover:text-white group-hover:underline">#{pedido.id}</span>
                      <span className={`w-2 h-2 rounded-full ${
                        pedido.estado === 'NUEVO' ? 'bg-emerald-500' :
                        pedido.estado === 'PREPARANDO' ? 'bg-amber-500' :
                        pedido.estado === 'LISTO' ? 'bg-cyan-500' :
                        'bg-purple-500'
                      }`}></span>
                    </div>
                    <p className="text-[#1E293B] group-hover:text-white truncate">{pedido.usuario.nombre}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-[#64748B] group-hover:text-purple-200">{pedido.hora}</p>
                      <span className="text-xs text-[#FE7F1E] group-hover:text-[#FE7F1E]">${pedido.total}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {pedidosRecientes.length === 0 && (
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