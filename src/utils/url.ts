// Función para extraer el businessId de la URL
export function obtenerBusinessIdDeURL(): string | null {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const businessId = urlParams.get('businessId');
    return businessId;
  } catch (error) {
    console.error('Error obteniendo businessId de la URL:', error);
    return null;
  }
}

// Función para obtener el businessId con fallback
export function obtenerBusinessId(): string {
  const businessId = obtenerBusinessIdDeURL();
  
  if (!businessId) {
    console.warn('No se encontró businessId en la URL, usando fallback');
    return '1'; // Business ID por defecto
  }
  
  return businessId;
}

// Función para extraer el número de teléfono de la URL (mantener para compatibilidad)
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

// Función para obtener el teléfono con fallback (mantener para compatibilidad)
export function obtenerTelefonoUsuario(): string {
  const phone = obtenerTelefonoDeURL();
  
  if (!phone) {
    console.warn('No se encontró teléfono en la URL, usando fallback');
    return '0000000000'; // Teléfono por defecto
  }
  
  return phone;
}
