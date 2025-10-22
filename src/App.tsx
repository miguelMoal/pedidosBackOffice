import image_cbf401e0e450f82b3043656c47686eaa83198a31 from 'figma:asset/cbf401e0e450f82b3043656c47686eaa83198a31.png';
import { useEffect, useState } from "react";
import { Sandwich, Package, ShoppingBag, BarChart3, MapPin, Clock, Store, Car, Home } from "lucide-react";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { Cocina } from "./components/Cocina";
import { Inventarios } from "./components/Inventarios";
import { PedidosBackoffice } from "./components/PedidosBackoffice";
import { Dashboard } from "./components/Dashboard";
import { Seguimiento } from "./components/Seguimiento";
import { initializePedidos } from "./utils/pedidos";
import { obtenerOrdenesPayed } from "./supabase/actions/pedidos";
import { setEstadoCocina } from "./utils/cocina";
import { obtenerTelefonoUsuario } from "./utils/url";
import { Toaster } from "./components/ui/sonner";
import { SupabaseStatus } from "./components/SupabaseStatus";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";

type Vista = "cocina" | "inventarios" | "pedidos" | "dashboard" | "seguimiento";

type EstadoNegocio = "abierto" | "abierto-carro-casa" | "abierto-carro" | "abierto-casa" | "cerrado";

export default function App() {
  const [vistaActual, setVistaActual] = useState<Vista>("cocina");
  const [estadoNegocio, setEstadoNegocio] = useState<EstadoNegocio>("abierto-carro-casa");
  const [ordenesPendientes, setOrdenesPendientes] = useState<number>(0);

  useEffect(() => {
    const inicializar = async () => {
      try {
        // Inicializar datos de demo al cargar la app
        await initializePedidos();
        
        // Cargar estado del negocio desde localStorage
        const estadoNegocio = localStorage.getItem('estadoNegocio');
        if (estadoNegocio !== null) {
          setEstadoNegocio(estadoNegocio as EstadoNegocio);
        }
      } catch (error) {
        console.error("Error inicializando aplicación:", error);
      }
    };
    
    inicializar();
  }, []);

  useEffect(() => {
    // Contar órdenes con status PAYED desde Supabase
    const calcularPendientes = async () => {
      try {
        const userPhone = obtenerTelefonoUsuario();
        const pendientes = await obtenerOrdenesPayed(userPhone);
        console.log("pendientes", pendientes)
        setOrdenesPendientes(pendientes);
      } catch (error) {
        console.error("Error contando órdenes PAYED desde Supabase:", error);
        // Fallback a localStorage
        try {
          const pedidosData = localStorage.getItem('pedidos');
          if (pedidosData) {
            const pedidos = JSON.parse(pedidosData);
            const pendientes = pedidos.filter((p: any) => 
              p.estado === 'NUEVO'
            ).length;
            setOrdenesPendientes(pendientes);
          }
        } catch (fallbackError) {
          console.error("Error en fallback:", fallbackError);
          setOrdenesPendientes(0);
        }
      }
    };

    calcularPendientes();
    
    // Escuchar evento personalizado cuando cambia el estado de pedidos
    const handlePedidosChange = () => {
      calcularPendientes();
    };
    
    window.addEventListener('pedidosActualizados', handlePedidosChange);
    
    return () => {
      window.removeEventListener('pedidosActualizados', handlePedidosChange);
    };
  }, []);

  const cambiarEstadoNegocio = (nuevoEstado: EstadoNegocio) => {
    setEstadoNegocio(nuevoEstado);
    localStorage.setItem('estadoNegocio', nuevoEstado);
    // Mantener compatibilidad con la función setEstadoCocina
    const estaAbierto = nuevoEstado !== "cerrado";
    setEstadoCocina(estaAbierto);
  };

  const navegacion = [
    { id: "cocina" as Vista, nombre: "Panel de Pedidos", icon: Sandwich },
    { id: "inventarios" as Vista, nombre: "Inventarios", icon: Package },
    { id: "pedidos" as Vista, nombre: "Pedidos", icon: ShoppingBag },
    { id: "dashboard" as Vista, nombre: "Dashboard", icon: BarChart3 },
    { id: "seguimiento" as Vista, nombre: "Seguimiento", icon: MapPin }
  ];

  const opcionesEstado = [
    { 
      valor: "abierto-carro-casa" as EstadoNegocio, 
      etiqueta: "Abierto", 
      iconos: [Car, Home] 
    },
    { 
      valor: "abierto-carro" as EstadoNegocio, 
      etiqueta: "Abierto", 
      iconos: [Car] 
    },
    { 
      valor: "abierto-casa" as EstadoNegocio, 
      etiqueta: "Abierto", 
      iconos: [Home] 
    },
    { 
      valor: "cerrado" as EstadoNegocio, 
      etiqueta: "Cerrado", 
      iconos: [Store] 
    }
  ];
console.log("ordenesPendientes", ordenesPendientes)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación */}
      <div className="bg-white text-[#0C3B2A] sticky top-0 z-20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Header principal con info del negocio */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-8 py-4 lg:py-6 border-b border-gray-200">
            {/* Información del negocio */}
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl overflow-hidden bg-white shadow-sm flex-shrink-0">
                <ImageWithFallback 
                  src={image_cbf401e0e450f82b3043656c47686eaa83198a31}
                  alt="Jaguares de Nayarit Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-[#0C3B2A]">Puesto</h1>
                <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-3 mt-1">
                  <div className="flex items-center gap-1 text-[#1E293B] text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Unidad Deportiva S/N, Santa Teresita, Tepic</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#1E293B] text-sm">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Lun-Dom 10:00 AM - 10:00 PM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Estado de cocina y órdenes pendientes */}
            <div className="flex items-center justify-between lg:justify-end gap-4 lg:gap-6">
              {/* Contador de órdenes pendientes */}
              <div className="flex flex-col items-center bg-gray-100 border border-gray-200 rounded-xl px-5 lg:px-6 py-3">
                <div className={`text-3xl lg:text-4xl ${ordenesPendientes > 0 ? 'text-[#FE7F1E]' : 'text-gray-400'}`}>
                  {ordenesPendientes}
                </div>
                <div className="text-xs lg:text-sm text-[#1E293B] whitespace-nowrap">Órdenes Nuevas</div>
              </div>

              {/* Select de estado del negocio */}
              <Select value={estadoNegocio} onValueChange={cambiarEstadoNegocio}>
                <SelectTrigger className={`px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl flex items-center gap-2 transition-all min-w-[140px] ${
                  estadoNegocio === "cerrado"
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {opcionesEstado.find(op => op.valor === estadoNegocio)?.iconos.map((Icono, index) => (
                        <Icono key={index} className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                      ))}
                      <span className="text-sm lg:text-base">
                        {opcionesEstado.find(op => op.valor === estadoNegocio)?.etiqueta}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {opcionesEstado.map((opcion) => (
                    <SelectItem key={opcion.valor} value={opcion.valor}>
                      <div className="flex items-center gap-2">
                        {opcion.iconos.map((Icono, index) => (
                          <Icono key={index} className="w-4 h-4" />
                        ))}
                        <span>{opcion.etiqueta}</span>
                        {opcion.valor === "abierto-carro-casa" && <span className="text-xs text-gray-500 ml-2">(Caseta + Gubernamental)</span>}
                        {opcion.valor === "abierto-carro" && <span className="text-xs text-gray-500 ml-2">(Solo Caseta)</span>}
                        {opcion.valor === "abierto-casa" && <span className="text-xs text-gray-500 ml-2">(Solo Gubernamental)</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs de navegación */}
          <div className="flex gap-2 overflow-x-auto pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {navegacion.map((nav) => {
              const Icono = nav.icon;
              return (
                <button
                  key={nav.id}
                  onClick={() => setVistaActual(nav.id)}
                  className={`px-4 lg:px-6 py-3 lg:py-4 rounded-t-xl whitespace-nowrap transition-all flex items-center gap-2 border-b-2 flex-shrink-0 ${
                    vistaActual === nav.id
                      ? 'text-[#0C3B2A] border-[#FE7F1E] bg-gray-50'
                      : 'text-gray-600 hover:text-[#0C3B2A] hover:bg-gray-50 border-transparent'
                  }`}
                >
                  <Icono className="w-5 h-5" />
                  <span>{nav.nombre}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {vistaActual === "cocina" && <Cocina />}
        {vistaActual === "inventarios" && <Inventarios />}
        {vistaActual === "pedidos" && <PedidosBackoffice />}
        {vistaActual === "dashboard" && <Dashboard />}
        {vistaActual === "seguimiento" && <Seguimiento />}
      </div>
      
      {/* Toast notifications */}
      <Toaster position="bottom-right" />
      
      {/* Indicador de estado de Supabase */}
      <SupabaseStatus />
    </div>
  );
}