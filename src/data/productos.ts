export const productosData = [
  { 
    id: "1",
    nombre: "Hot Dog", 
    categoria: "Comida",
    costo: 40, 
    precio: 60, 
    imagen: "https://images.unsplash.com/photo-1598209570763-cd3013fadf7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400", 
    activo: true 
  },
  { 
    id: "2",
    nombre: "Flashlyte", 
    categoria: "Bebidas",
    costo: 20, 
    precio: 35, 
    imagen: "https://images.unsplash.com/photo-1648313021325-d81f28d57824?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400", 
    activo: true 
  },
  { 
    id: "3",
    nombre: "Nachos", 
    categoria: "Snacks",
    costo: 50, 
    precio: 80, 
    imagen: "https://images.unsplash.com/photo-1669624272709-c5b91f66b1b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400", 
    activo: true 
  },
  { 
    id: "4",
    nombre: "Pizza Slice", 
    categoria: "Comida",
    costo: 35, 
    precio: 50, 
    imagen: "https://images.unsplash.com/photo-1544982503-9f984c14501a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400", 
    activo: true 
  },
  { 
    id: "5",
    nombre: "Coca-Cola", 
    categoria: "Bebidas",
    costo: 18, 
    precio: 30, 
    imagen: "https://images.unsplash.com/photo-1594881798661-4c77c99551a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400", 
    activo: true 
  },
  { 
    id: "6",
    nombre: "Papas Fritas", 
    categoria: "Snacks",
    costo: 30, 
    precio: 45, 
    imagen: "https://images.unsplash.com/photo-1630431341973-02e1b662ec35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400", 
    activo: true 
  },
  { 
    id: "7",
    nombre: "Doritos", 
    categoria: "Snacks",
    costo: 20, 
    precio: 28, 
    imagen: "https://images.unsplash.com/photo-1704656296628-794703d8a727?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400", 
    activo: false 
  },
  { 
    id: "8",
    nombre: "Sprite", 
    categoria: "Bebidas",
    costo: 18, 
    precio: 30, 
    imagen: "https://images.unsplash.com/photo-1570633141712-9c519e90b85c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400", 
    activo: true 
  },
  { 
    id: "9",
    nombre: "Agua", 
    categoria: "Bebidas",
    costo: 15, 
    precio: 25, 
    imagen: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400", 
    activo: true 
  }
];

export type Producto = {
  id: string;
  nombre: string;
  categoria: string;
  costo: number;
  precio: number;
  imagen: string;
  activo: boolean;
};