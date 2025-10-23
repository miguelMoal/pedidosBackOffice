import React, { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

type OrderStatus = 'IN_PROGRESS' | 'ON_THE_WAY' | 'DELIVERED';

interface GoogleMapProps {
  orderStatus: OrderStatus;
  restaurantPosition: { lat: number; lng: number };
  destinationPosition: { lat: number; lng: number };
  driverPosition?: { lat: number; lng: number };
  eta?: number;
  className?: string;
}

export default function GoogleMap({
  orderStatus,
  restaurantPosition,
  destinationPosition,
  driverPosition,
  eta = 18,
  className = ''
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);

  useEffect(() => {
    const initMap = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      console.log('apiKey', apiKey);
      
      if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
        console.warn('Google Maps API key not configured');
        return;
      }

      try {
        // Configurar las opciones de la API
        setOptions({
          apiKey: apiKey,
          version: 'weekly'
        });

        // Importar las librerías necesarias
        const { Map } = await importLibrary('maps');
        const { Marker } = await importLibrary('marker');
        const { DirectionsService, DirectionsRenderer } = await importLibrary('routes');
        
        if (mapRef.current) {
          const mapInstance = new Map(mapRef.current, {
            center: restaurantPosition,
            zoom: 13,
            styles: [
              {
                featureType: 'all',
                elementType: 'geometry.fill',
                stylers: [{ weight: '2.00' }]
              },
              {
                featureType: 'all',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#9c9c9c' }]
              },
              {
                featureType: 'all',
                elementType: 'labels.text',
                stylers: [{ visibility: 'on' }]
              },
              {
                featureType: 'landscape',
                elementType: 'all',
                stylers: [{ color: '#f2f2f2' }]
              },
              {
                featureType: 'landscape',
                elementType: 'geometry.fill',
                stylers: [{ color: '#ffffff' }]
              },
              {
                featureType: 'landscape.man_made',
                elementType: 'geometry.fill',
                stylers: [{ color: '#ffffff' }]
              },
              {
                featureType: 'poi',
                elementType: 'all',
                stylers: [{ visibility: 'off' }]
              },
              {
                featureType: 'road',
                elementType: 'all',
                stylers: [{ saturation: -100 }, { lightness: 45 }]
              },
              {
                featureType: 'road',
                elementType: 'geometry.fill',
                stylers: [{ color: '#eeeeee' }]
              },
              {
                featureType: 'road',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#7b7b7b' }]
              },
              {
                featureType: 'road',
                elementType: 'labels.text.stroke',
                stylers: [{ color: '#ffffff' }]
              },
              {
                featureType: 'road.highway',
                elementType: 'all',
                stylers: [{ visibility: 'simplified' }]
              },
              {
                featureType: 'road.arterial',
                elementType: 'labels.icon',
                stylers: [{ visibility: 'off' }]
              },
              {
                featureType: 'transit',
                elementType: 'all',
                stylers: [{ visibility: 'off' }]
              },
              {
                featureType: 'water',
                elementType: 'all',
                stylers: [{ color: '#46bcec' }, { visibility: 'on' }]
              },
              {
                featureType: 'water',
                elementType: 'geometry.fill',
                stylers: [{ color: '#c8d7d4' }]
              },
              {
                featureType: 'water',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#070707' }]
              },
              {
                featureType: 'water',
                elementType: 'labels.text.stroke',
                stylers: [{ color: '#ffffff' }]
              }
            ]
          });

          setMap(mapInstance);
          setDirectionsService(new DirectionsService());
          setDirectionsRenderer(new DirectionsRenderer({
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: '#3b82f6',
              strokeWeight: 4,
              strokeOpacity: 0.8
            }
          }));
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    initMap();
  }, []);

  useEffect(() => {
    const createMarkers = async () => {
      if (!map || !directionsService || !directionsRenderer) return;

      // Import Marker class
      const { Marker } = await importLibrary('marker');
      
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      
      // Create restaurant marker
      const restaurantMarker = new Marker({
        position: restaurantPosition,
        map: map,
        title: 'Restaurante',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#10b981" stroke="white" stroke-width="2"/>
              <path d="M8 12h16v8H8z" fill="white"/>
              <path d="M10 10h12v2H10z" fill="white"/>
              <path d="M12 8h8v2h-8z" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      // Create destination marker
      const destinationMarker = new Marker({
        position: destinationPosition,
        map: map,
        title: 'Tu ubicación',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#3b82f6" stroke="white" stroke-width="2"/>
              <circle cx="16" cy="16" r="6" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      // Create driver marker if on the way
      let driverMarker: any = null;
      if (driverPosition && (orderStatus === 'ON_THE_WAY' || orderStatus === 'DELIVERED')) {
        driverMarker = new Marker({
          position: driverPosition,
          map: map,
          title: 'Repartidor',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#f59e0b" stroke="white" stroke-width="2"/>
                <text x="16" y="20" text-anchor="middle" fill="white" font-size="16">🚚</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32)
          }
        });
      }

      // Set route if on the way
      if (orderStatus === 'ON_THE_WAY' && driverPosition) {
        directionsRenderer.setMap(map);
        directionsService.route({
          origin: driverPosition,
          destination: destinationPosition,
          travelMode: 'DRIVING' as google.maps.TravelMode
        }, (result, status) => {
          if (status === 'OK' && result) {
            directionsRenderer.setDirections(result);
          } else {
            console.warn('Directions API error:', status);
            // Fallback: hide the route renderer if there's an error
            directionsRenderer.setMap(null);
          }
        });
      } else {
        directionsRenderer.setMap(null);
      }

      setMarkers([restaurantMarker, destinationMarker, driverMarker].filter(Boolean));
    };

    createMarkers();
  }, [map, orderStatus, restaurantPosition, destinationPosition, driverPosition, directionsService, directionsRenderer]);

  const apiKey = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const hasApiKey = apiKey && apiKey !== 'YOUR_API_KEY_HERE';

  return (
    <div className={`w-full h-full ${className}`}>
      {!hasApiKey ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🗺️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Mapa Real</h3>
            <p className="text-sm text-gray-600 mb-4">
              Para usar Google Maps, configura tu API key
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left">
              <p className="text-xs text-yellow-800 font-medium mb-1">Configuración necesaria:</p>
              <ol className="text-xs text-yellow-700 space-y-1">
                <li>1. Obtén tu API key en Google Cloud Console</li>
                <li>2. Habilita estas APIs: Maps JavaScript API, Directions API</li>
                <li>3. Crea un archivo .env en la raíz del proyecto</li>
                <li>4. Agrega: VITE_GOOGLE_CLIENT_ID=tu_api_key</li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <div ref={mapRef} className="w-full h-full rounded-lg" />
      )}
    </div>
  );
}
