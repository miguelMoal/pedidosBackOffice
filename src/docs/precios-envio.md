# Sistema de Precios de Envío

## Descripción

El sistema ahora obtiene el precio de envío específico de cada pedido desde la tabla `send_price` de Supabase a través de la relación con la tabla `orders`.

## Estructura de las tablas

### Tabla `orders`

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_phone VARCHAR NOT NULL,
  status STATUS_ORDER NOT NULL,
  price INTEGER REFERENCES send_price(id), -- ID del precio de envío
  coupon_applied INTEGER REFERENCES coupons(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla `send_price`

```sql
CREATE TABLE send_price (
  id SERIAL PRIMARY KEY,
  price DECIMAL, -- Precio de envío en pesos mexicanos
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Ejemplo de datos

```sql
-- Insertar precios de envío
INSERT INTO send_price (price) VALUES (25.00);
INSERT INTO send_price (price) VALUES (30.00);
INSERT INTO send_price (price) VALUES (15.00);

-- Crear pedidos con precios específicos
INSERT INTO orders (user_phone, status, price) VALUES ('+1234567890', 'PAYED', 1);
INSERT INTO orders (user_phone, status, price) VALUES ('+1234567890', 'PAYED', 2);
```

## Funcionalidades implementadas

### 1. Consulta con relaciones

- Cada pedido obtiene su precio de envío específico desde `send_price`
- La consulta incluye la relación `orders.send_price`
- Fallback a $20 MXN si no hay precio asignado

### 2. Integración en pedidos

- Los pedidos muestran el precio de envío real asignado
- El cálculo del total incluye el precio de envío específico del pedido
- Compatible con cupones y descuentos

### 3. Flexibilidad por pedido

- Cada pedido puede tener un precio de envío diferente
- Permite promociones o descuentos de envío específicos
- Facilita la gestión de precios dinámicos

## Manejo de errores

- Si un pedido no tiene precio de envío asignado, se usa $20 MXN como valor por defecto
- Los errores se registran en la consola pero no interrumpen la funcionalidad
- La consulta es robusta ante datos faltantes

## Configuración

Para cambiar el precio de envío de un pedido específico:

```sql
-- Actualizar el precio de envío existente
UPDATE send_price SET price = 30.00 WHERE id = 1;

-- O asignar un nuevo precio a un pedido
UPDATE orders SET price = 2 WHERE id = 123;
```

## Ventajas del nuevo sistema

- ✅ **Precios específicos por pedido**: Cada pedido puede tener su propio precio de envío
- ✅ **Flexibilidad**: Permite promociones y descuentos de envío
- ✅ **Trazabilidad**: Se puede rastrear qué precio se aplicó a cada pedido
- ✅ **Escalabilidad**: Fácil de extender para diferentes tipos de envío
