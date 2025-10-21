import { useEffect, useState } from "react";
import { Cloud, CloudOff, Loader2, CheckCircle2 } from "lucide-react";
import { apiCall } from "../utils/supabase/client";
import { Badge } from "./ui/badge";

export function SupabaseStatus() {
  const [estado, setEstado] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState<Date | null>(null);

  useEffect(() => {
    const verificarConexion = async () => {
      try {
        await apiCall('/health');
        setEstado('connected');
        setUltimaSincronizacion(new Date());
      } catch (error) {
        console.error('Error conectando con Supabase:', error);
        setEstado('disconnected');
      }
    };

    // Verificar al montar
    verificarConexion();

    // Verificar cada 30 segundos
    const interval = setInterval(verificarConexion, 30000);

    return () => clearInterval(interval);
  }, []);

  const iconosEstado = {
    checking: <Loader2 className="w-4 h-4 animate-spin" />,
    connected: <CheckCircle2 className="w-4 h-4" />,
    disconnected: <CloudOff className="w-4 h-4" />
  };

  const coloresEstado = {
    checking: 'bg-blue-100 text-blue-700 border-blue-200',
    connected: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    disconnected: 'bg-amber-100 text-amber-700 border-amber-200'
  };

  const textosEstado = {
    checking: 'Verificando...',
    connected: 'Conectado a Supabase',
    disconnected: 'Modo offline'
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg transition-all ${coloresEstado[estado]}`}>
        {iconosEstado[estado]}
        <span className="text-sm">{textosEstado[estado]}</span>
        {estado === 'connected' && ultimaSincronizacion && (
          <span className="text-xs opacity-70">
            ({ultimaSincronizacion.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })})
          </span>
        )}
      </div>
    </div>
  );
}
