// Función para extraer el número de teléfono de la URL
export function obtenerTelefonoDeURL(): string | null {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const phone = urlParams.get('phone');
    return phone;
  } catch (error) {
    console.error('Error obteniendo teléfono de la URL:', error);
    return null;
  }
}

// Función para obtener el teléfono con fallback
export function obtenerTelefonoUsuario(): string {
  const phone = obtenerTelefonoDeURL();
  
  if (!phone) {
    console.warn('No se encontró teléfono en la URL, usando fallback');
    return '0000000000'; // Teléfono por defecto
  }
  
  return phone;
}
