import { apiCall } from './supabase/client';

/**
 * Función de prueba para verificar la integración con Supabase
 * Ejecuta una serie de tests para validar que todos los endpoints funcionan
 */
export async function testSupabaseIntegration() {
  console.group('🧪 Iniciando pruebas de Supabase...');
  
  const results = {
    health: false,
    pedidos: false,
    productos: false,
    cocina: false,
    inicializar: false
  };

  try {
    // Test 1: Health Check
    console.log('\n1️⃣ Test: Health Check');
    try {
      const health = await apiCall('/health');
      console.log('✅ Health check exitoso:', health);
      results.health = true;
    } catch (error) {
      console.error('❌ Health check falló:', error);
    }

    // Test 2: Obtener pedidos
    console.log('\n2️⃣ Test: Obtener pedidos');
    try {
      const pedidos = await apiCall('/pedidos');
      console.log('✅ Pedidos obtenidos:', pedidos.pedidos?.length || 0, 'pedidos');
      results.pedidos = true;
    } catch (error) {
      console.error('❌ Error obteniendo pedidos:', error);
    }

    // Test 3: Obtener productos
    console.log('\n3️⃣ Test: Obtener productos');
    try {
      const productos = await apiCall('/productos');
      console.log('✅ Productos obtenidos:', productos.productos?.length || 0, 'productos');
      results.productos = true;
    } catch (error) {
      console.error('❌ Error obteniendo productos:', error);
    }

    // Test 4: Estado de cocina
    console.log('\n4️⃣ Test: Estado de cocina');
    try {
      const estado = await apiCall('/cocina/estado');
      console.log('✅ Estado de cocina:', estado.abierta ? 'Abierta' : 'Cerrada');
      results.cocina = true;
    } catch (error) {
      console.error('❌ Error obteniendo estado de cocina:', error);
    }

    // Test 5: Inicializar datos
    console.log('\n5️⃣ Test: Inicializar datos');
    try {
      const pedidosDemo = [
        {
          id: "TEST001",
          estado: "NUEVO",
          items: [
            { id: "p1", nombre: "Hot Dog Test", cantidad: 1, precio: 60 }
          ],
          total: 60,
          hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          tipo: "Delivery",
          timestamp: Date.now(),
          usuario: {
            nombre: "Usuario Test",
            foto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200"
          }
        }
      ];

      await apiCall('/inicializar', {
        method: 'POST',
        body: JSON.stringify({ pedidos: pedidosDemo })
      });
      console.log('✅ Datos inicializados correctamente');
      results.inicializar = true;
    } catch (error) {
      console.error('❌ Error inicializando datos:', error);
    }

  } catch (error) {
    console.error('❌ Error general en las pruebas:', error);
  }

  // Resumen
  console.log('\n📊 Resumen de pruebas:');
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;

  console.table(results);
  console.log(`\n✅ Pruebas exitosas: ${passedTests}/${totalTests}`);
  console.log(`❌ Pruebas fallidas: ${failedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ¡Todas las pruebas pasaron! La integración con Supabase funciona correctamente.');
  } else {
    console.log('\n⚠️ Algunas pruebas fallaron. Revisa los logs arriba para más detalles.');
  }

  console.groupEnd();

  return {
    passed: passedTests,
    failed: failedTests,
    total: totalTests,
    results
  };
}

/**
 * Ejecutar esta función desde la consola del navegador para probar la integración
 * 
 * Uso:
 * import { testSupabaseIntegration } from './utils/testSupabase';
 * testSupabaseIntegration();
 */
export function runTests() {
  return testSupabaseIntegration();
}

// Hacer disponible en window para pruebas desde consola
if (typeof window !== 'undefined') {
  (window as any).testSupabase = runTests;
}
