import { useState } from "react";
import { Cloud, Database, RefreshCw, TestTube, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { useSupabaseConnection } from "../hooks/useSupabase";
import { testSupabaseIntegration } from "../utils/testSupabase";
import { getTodosPedidosAsync } from "../utils/pedidos";
import { getTodosProductosAsync } from "../utils/productos";
import { getEstadoCocinaAsync } from "../utils/cocina";

export function ConfiguracionSupabase() {
  const { status, lastSync } = useSupabaseConnection();
  const [testRunning, setTestRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  const handleRunTests = async () => {
    setTestRunning(true);
    setTestResults(null);
    
    try {
      const results = await testSupabaseIntegration();
      setTestResults(results);
    } catch (error) {
      console.error("Error ejecutando pruebas:", error);
    } finally {
      setTestRunning(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    
    try {
      console.log("🔄 Sincronizando todos los datos...");
      
      await Promise.all([
        getTodosPedidosAsync(),
        getTodosProductosAsync(),
        getEstadoCocinaAsync()
      ]);
      
      console.log("✅ Sincronización completa");
      window.dispatchEvent(new CustomEvent('pedidosActualizados'));
    } catch (error) {
      console.error("Error sincronizando:", error);
    } finally {
      setSyncing(false);
    }
  };

  const statusConfig = {
    checking: {
      icon: Loader2,
      text: 'Verificando conexión...',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    connected: {
      icon: CheckCircle2,
      text: 'Conectado a Supabase',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    disconnected: {
      icon: XCircle,
      text: 'Desconectado - Modo offline',
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-[#1E293B] mb-2">Configuración de Supabase</h2>
        <p className="text-[#64748B]">Gestiona la integración con la base de datos en la nube</p>
      </div>

      {/* Estado de conexión */}
      <Card className={`p-6 border-2 ${config.borderColor} ${config.bgColor}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <StatusIcon className={`w-6 h-6 ${config.color} ${status === 'checking' ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-lg text-[#1E293B] mb-1">{config.text}</h3>
              {lastSync && (
                <p className="text-sm text-[#64748B]">
                  Última sincronización: {lastSync.toLocaleString('es-MX')}
                </p>
              )}
            </div>
          </div>
          
          <Badge variant={status === 'connected' ? 'default' : 'secondary'}>
            {status === 'connected' ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </Card>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#012B67] rounded-xl flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-[#1E293B] mb-2">Sincronizar datos</h3>
              <p className="text-sm text-[#64748B] mb-4">
                Forzar la sincronización de todos los datos con Supabase
              </p>
              <Button 
                onClick={handleSyncAll} 
                disabled={syncing || status === 'disconnected'}
                className="w-full"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sincronizar ahora
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#FE7F1E] rounded-xl flex items-center justify-center flex-shrink-0">
              <TestTube className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-[#1E293B] mb-2">Ejecutar pruebas</h3>
              <p className="text-sm text-[#64748B] mb-4">
                Verificar que todos los endpoints funcionan correctamente
              </p>
              <Button 
                onClick={handleRunTests} 
                disabled={testRunning || status === 'disconnected'}
                variant="outline"
                className="w-full"
              >
                {testRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Ejecutando...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Ejecutar pruebas
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Resultados de pruebas */}
      {testResults && (
        <Card className="p-6">
          <h3 className="text-[#1E293B] mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Resultados de las pruebas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="text-3xl text-emerald-600 mb-1">{testResults.passed}</div>
              <div className="text-sm text-[#64748B]">Pruebas exitosas</div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-3xl text-red-600 mb-1">{testResults.failed}</div>
              <div className="text-sm text-[#64748B]">Pruebas fallidas</div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-3xl text-blue-600 mb-1">{testResults.total}</div>
              <div className="text-sm text-[#64748B]">Total de pruebas</div>
            </div>
          </div>

          <div className="space-y-2">
            {Object.entries(testResults.results).map(([key, passed]) => (
              <div 
                key={key} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm text-[#1E293B] capitalize">{key}</span>
                {passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Información */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <Cloud className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-[#1E293B] mb-2">Modo Híbrido Offline-First</h3>
            <p className="text-sm text-[#64748B] mb-2">
              Tu aplicación funciona en modo híbrido:
            </p>
            <ul className="text-sm text-[#64748B] space-y-1 list-disc list-inside">
              <li>Los cambios se guardan inmediatamente en localStorage (sin delay)</li>
              <li>Se sincronizan automáticamente con Supabase en segundo plano</li>
              <li>Si Supabase no está disponible, el sistema sigue funcionando normalmente</li>
              <li>Los datos se comparten entre dispositivos cuando están conectados</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
