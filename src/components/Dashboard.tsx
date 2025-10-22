import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Calendar, MapPin, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ventasData } from "../data/ventas";
import { obtenerPedidos } from "../supabase/actions/pedidos";
import { obtenerTelefonoUsuario } from "../utils/url";

export function Dashboard() {
  const [ventas, setVentas] = useState(ventasData);
  const [, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topProductos = ventas.porProducto.slice(0, 5);
  const bottomProductos = ventas.porProducto.slice(-5).reverse();
  const topZonas = ventas.porZona.slice(0, 5);

  const procesarDatosVentas = (pedidosData: any[]) => {
    // Agrupar por día
    const ventasPorDia = pedidosData.reduce((acc, pedido) => {
      const fecha = new Date(pedido.timestamp).toISOString().split('T')[0];
      if (!acc[fecha]) {
        acc[fecha] = { fecha, total: 0 };
      }
      acc[fecha].total += pedido.total;
      return acc;
    }, {} as Record<string, { fecha: string; total: number }>);

    // Agrupar por producto
    const ventasPorProducto = pedidosData.reduce((acc, pedido) => {
      pedido.items.forEach((item: any) => {
        const key = item.nombre;
        if (!acc[key]) {
          acc[key] = { nombre: item.nombre, cantidad: 0, total: 0 };
        }
        acc[key].cantidad += item.cantidad;
        acc[key].total += item.precio * item.cantidad;
      });
      return acc;
    }, {} as Record<string, { nombre: string; cantidad: number; total: number }>);

    // Agrupar por zona (usando tipo de entrega como zona)
    const ventasPorZona = pedidosData.reduce((acc, pedido) => {
      const zona = pedido.tipoEntrega || 'Delivery';
      if (!acc[zona]) {
        acc[zona] = { zona, ventas: 0, total: 0 };
      }
      acc[zona].ventas += 1;
      acc[zona].total += pedido.total;
      return acc;
    }, {} as Record<string, { zona: string; ventas: number; total: number }>);

    return {
      porDia: Object.values(ventasPorDia).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
      porProducto: Object.values(ventasPorProducto).sort((a, b) => b.cantidad - a.cantidad),
      porZona: Object.values(ventasPorZona).sort((a, b) => b.total - a.total)
    };
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);
      
      const userPhone = obtenerTelefonoUsuario();
      const pedidosData = await obtenerPedidos(userPhone);
      setPedidos(pedidosData);
      
      // Procesar datos de ventas desde pedidos reales
      const ventasProcesadas = procesarDatosVentas(pedidosData);
      setVentas(ventasProcesadas);
    } catch (err) {
      console.error("Error cargando datos del dashboard:", err);
      setError("Error al cargar los datos. Usando datos de ejemplo.");
      // Mantener datos estáticos como fallback
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const totalVentas = ventas.porDia.reduce((sum, d) => sum + d.total, 0);
  const promedioVentas = Math.round(totalVentas / ventas.porDia.length);

  return (
    <div className="space-y-6">
      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Indicador de carga */}
      {cargando && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-[#012B67] border-t-transparent rounded-full animate-spin" />
            <span className="text-[#64748B]">Cargando datos del dashboard...</span>
          </div>
        </div>
      )}

      {/* Stats principales */}
      {!cargando && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Total ventas</p>
              <p className="text-2xl text-[#1E293B]">${totalVentas.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#012B67] rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Promedio diario</p>
              <p className="text-2xl text-[#1E293B]">${promedioVentas.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FE7F1E] rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Productos vendidos</p>
              <p className="text-2xl text-[#1E293B]">{ventas.porProducto.reduce((sum, p) => sum + p.cantidad, 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Zonas activas</p>
              <p className="text-2xl text-[#1E293B]">{ventas.porZona.length}</p>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Gráfica de ventas por día */}
      {!cargando && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#012B67] rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-[#1E293B]">Ventas por día</h3>
            <p className="text-sm text-[#64748B]">Últimos 8 días</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ventas.porDia}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="fecha" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
              stroke="#64748B"
            />
            <YAxis stroke="#64748B" />
            <Tooltip 
              formatter={(value: number) => [`$${value}`, 'Total']}
              labelFormatter={(label) => new Date(label).toLocaleDateString('es-MX', { weekday: 'long', month: 'short', day: 'numeric' })}
            />
            <Bar dataKey="total" fill="#012B67" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      )}

      {!cargando && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productos más vendidos */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-[#1E293B]">Productos más vendidos</h3>
              <p className="text-sm text-[#64748B]">Top 5 por cantidad</p>
            </div>
          </div>

          <div className="space-y-3">
            {topProductos.map((producto, index) => (
              <div key={producto.nombre} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-[#1E293B]">{producto.nombre}</p>
                  <p className="text-sm text-[#64748B]">{producto.cantidad} unidades vendidas</p>
                </div>
                <p className="text-emerald-600">${producto.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Productos menos vendidos */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-[#1E293B]">Productos menos vendidos</h3>
              <p className="text-sm text-[#64748B]">Bottom 5 por cantidad</p>
            </div>
          </div>

          <div className="space-y-3">
            {bottomProductos.map((producto, index) => (
              <div key={producto.nombre} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-[#1E293B]">{producto.nombre}</p>
                  <p className="text-sm text-[#64748B]">{producto.cantidad} unidades vendidas</p>
                </div>
                <p className="text-amber-600">${producto.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

      {/* Zonas con más ventas */}
      {!cargando && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-[#1E293B]">Zonas con más ventas</h3>
            <p className="text-sm text-[#64748B]">Ranking por ubicación</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {topZonas.map((zona, index) => (
            <div key={zona.zona} className="p-4 bg-purple-500 rounded-xl border border-purple-600">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-white text-purple-600 rounded-full flex items-center justify-center text-sm">
                  {index + 1}
                </div>
                <p className="text-sm text-purple-100">#{index + 1}</p>
              </div>
              <p className="text-white mb-1">{zona.zona}</p>
              <p className="text-sm text-purple-100">{zona.ventas} pedidos</p>
              <p className="text-white">${zona.total.toLocaleString()}</p>
            </div>
          ))}
        </div>
        </div>
      )}
    </div>
  );
}