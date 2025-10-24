import React, { useEffect, useState } from 'react';
import { CheckCircle2, Navigation, Store } from 'lucide-react';

type OrderStatus = 'IN_PROGRESS' | 'ON_THE_WAY' | 'DELIVERED';

interface DeliveryMapProps {
  orderStatus: OrderStatus;
  driverPosition?: { x: number; y: number };
  eta?: number;
  onDriverPositionChange?: (position: { x: number; y: number }) => void;
  onEtaChange?: (eta: number) => void;
  className?: string;
  showDriver?: boolean;
  showRoute?: boolean;
  restaurantPosition?: { x: number; y: number };
  destinationPosition?: { x: number; y: number };
}

function DeliveryMap({
  orderStatus,
  driverPosition = { x: 20, y: 70 },
  eta = 18,
  onDriverPositionChange,
  onEtaChange,
  className = '',
  showDriver = true,
  showRoute = true,
  restaurantPosition = { x: 20, y: 70 },
  destinationPosition = { x: 80, y: 20 }
}: DeliveryMapProps) {
  const [deliveryProgress, setDeliveryProgress] = useState(0);
  const [currentDriverPosition, setCurrentDriverPosition] = useState(driverPosition);
  const [currentEta, setCurrentEta] = useState(eta);

  // Animate delivery when ON_THE_WAY
  useEffect(() => {
    if (orderStatus === 'ON_THE_WAY') {
      const interval = setInterval(() => {
        setDeliveryProgress((prev) => {
          if (prev >= 100) {
            return 100;
          }
          return prev + 1;
        });

        setCurrentDriverPosition((prev) => {
          const newPosition = {
            x: Math.min(prev.x + 0.6, destinationPosition.x),
            y: Math.max(prev.y - 0.5, destinationPosition.y)
          };
          
          // Notificar al componente padre del cambio de posición
          if (onDriverPositionChange) {
            onDriverPositionChange(newPosition);
          }
          
          return newPosition;
        });

        setCurrentEta((prev) => {
          const newEta = Math.max(prev - 0.18, 0);
          
          // Notificar al componente padre del cambio de ETA
          if (onEtaChange) {
            onEtaChange(newEta);
          }
          
          return newEta;
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      // Reset position when not ON_THE_WAY
      setDeliveryProgress(0);
      setCurrentDriverPosition(restaurantPosition);
      setCurrentEta(eta);
    }
  }, [orderStatus, destinationPosition, restaurantPosition, eta, onDriverPositionChange, onEtaChange]);

  // Actualizar posición del conductor cuando cambie la prop
  useEffect(() => {
    setCurrentDriverPosition(driverPosition);
  }, [driverPosition]);

  // Actualizar ETA cuando cambie la prop
  useEffect(() => {
    setCurrentEta(eta);
  }, [eta]);

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '300px',
        position: 'relative',
        ...(className ? { className } : {})
      }}
    >
      {/* Map Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(to bottom right, #f3f4f6, #e5e7eb)'
      }}>
        {/* Grid */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.2
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gridTemplateRows: 'repeat(6, 1fr)',
            height: '100%'
          }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ border: '1px solid #9ca3af' }} />
            ))}
          </div>
        </div>

        {/* Streets */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}>
          <div style={{
            position: 'absolute',
            top: '25%',
            left: 0,
            right: 0,
            height: '8px',
            backgroundColor: '#d1d5db'
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '8px',
            backgroundColor: '#d1d5db'
          }} />
          <div style={{
            position: 'absolute',
            top: '75%',
            left: 0,
            right: 0,
            height: '8px',
            backgroundColor: '#d1d5db'
          }} />
          <div style={{
            position: 'absolute',
            left: '25%',
            top: 0,
            bottom: 0,
            width: '8px',
            backgroundColor: '#d1d5db'
          }} />
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: '8px',
            backgroundColor: '#d1d5db'
          }} />
          <div style={{
            position: 'absolute',
            left: '75%',
            top: 0,
            bottom: 0,
            width: '8px',
            backgroundColor: '#d1d5db'
          }} />
        </div>

        {/* Restaurant/Store Location */}
        <div
          style={{
            position: 'absolute',
            left: `${restaurantPosition.x}%`,
            top: `${restaurantPosition.y}%`
          }}
        >
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                backgroundColor: orderStatus === 'IN_PROGRESS' ? '#FFD54F' : '#046741'
              }}
            >
              <Store style={{ width: '28px', height: '28px', color: 'white' }} />
            </div>
            <div style={{
              position: 'absolute',
              bottom: '-28px',
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              backgroundColor: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              fontSize: '12px'
            }}>
              {orderStatus === 'IN_PROGRESS' ? '🍳 Preparando...' : '🏪 Restaurante'}
            </div>
          </div>
        </div>

        {/* Your Location (Destination) */}
        <div
          style={{
            position: 'absolute',
            left: `${destinationPosition.x}%`,
            top: `${destinationPosition.y}%`
          }}
        >
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: orderStatus === 'DELIVERED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(4, 103, 65, 0.2)'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: orderStatus === 'DELIVERED' ? '#22c55e' : '#046741'
              }}>
                {orderStatus === 'DELIVERED' ? (
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: 'white' }} />
                ) : (
                  <Navigation style={{ width: '16px', height: '16px', color: 'white' }} />
                )}
              </div>
            </div>
            <div style={{
              position: 'absolute',
              bottom: '-32px',
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              backgroundColor: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              fontSize: '12px'
            }}>
              {orderStatus === 'DELIVERED' ? '✓ Entregado' : 'Tu ubicación'}
            </div>
          </div>
        </div>

        {/* Driver Position - Only show when ON_THE_WAY or DELIVERED */}
        {showDriver && (orderStatus === 'ON_THE_WAY' || orderStatus === 'DELIVERED') && (
          <>
            <div
              style={{
                position: 'absolute',
                left: orderStatus === 'DELIVERED' ? `${destinationPosition.x}%` : `${currentDriverPosition.x}%`,
                top: orderStatus === 'DELIVERED' ? `${destinationPosition.y}%` : `${currentDriverPosition.y}%`
              }}
            >
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #046741',
                  transform: 'rotate(45deg)'
                }}>
                  <span style={{ fontSize: '20px' }}>🧑</span>
                </div>
              </div>
            </div>

            {/* Route Line */}
            {showRoute && orderStatus === 'ON_THE_WAY' && (
              <svg style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}>
                <path
                  d={`M ${currentDriverPosition.x}% ${currentDriverPosition.y}% Q ${(currentDriverPosition.x + destinationPosition.x) / 2}% ${(currentDriverPosition.y + destinationPosition.y) / 2 - 10}% ${destinationPosition.x}% ${destinationPosition.y}%`}
                  stroke="#046741"
                  strokeWidth="3"
                  strokeDasharray="10,5"
                  fill="none"
                  opacity="0.5"
                />
              </svg>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DeliveryMap;
