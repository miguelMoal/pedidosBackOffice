import React, { useState, useEffect } from "react";
import { Package, Plus, Edit, Trash2, Save, X, CheckCircle, XCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Label } from "./ui/label";
import { productosData } from "../data/productos";
import { getTodosProductosAsync, initializeProductos, crearProductoAsync, actualizarProductoAsync, eliminarProductoAsync } from "../utils/productos";

interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  costo: number;
  imagen: string;
  activo: boolean;
  stock: number;
}

export function Inventarios() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [formData, setFormData] = useState<Partial<Producto>>({});

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        // Intentar cargar desde Supabase
        const productosSupabase = await getTodosProductosAsync();
        
        if (productosSupabase && productosSupabase.length > 0) {
          // Migrar productos antiguos sin categoría
          const productosMigrados = productosSupabase.map((p: any) => ({
            ...p,
            categoria: p.categoria || "Comida"
          }));
          setProductos(productosMigrados);
        } else {
          // Si no hay productos, inicializar con datos demo
          await initializeProductos();
          setProductos(productosData);
        }
      } catch (error) {
        console.error("Error cargando productos:", error);
        // Fallback a localStorage
        const productosGuardados = localStorage.getItem("productos");
        if (productosGuardados) {
          setProductos(JSON.parse(productosGuardados));
        } else {
          setProductos(productosData);
        }
      }
    };
    
    cargarProductos();
  }, []);


  const abrirModalNuevo = () => {
    setProductoEditando(null);
    setFormData({
      nombre: "",
      categoria: "Comida",
      precio: 0,
      costo: 0,
      imagen: "",
      activo: true,
      stock: 0
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (producto: Producto) => {
    setProductoEditando(producto);
    setFormData(producto);
    setModalAbierto(true);
  };

  const guardarProducto = async () => {
    if (!formData.nombre || !formData.precio || !formData.costo) {
      alert("Por favor completa todos los campos");
      return;
    }

    try {
      if (productoEditando) {
        // Editar producto existente
        const productoActualizado: Producto = {
          ...formData as Producto,
          id: productoEditando.id
        };
        
        const productoResultado = await actualizarProductoAsync(productoActualizado);
        
        // Actualizar la lista local
        const productosActualizados = productos.map(p => 
          p.id === productoEditando.id ? productoResultado : p
        );
        setProductos(productosActualizados);
      } else {
        // Crear nuevo producto
        const nuevoProducto = {
          nombre: formData.nombre!,
          categoria: formData.categoria || "Comida",
          precio: formData.precio!,
          costo: formData.costo!,
          imagen: formData.imagen || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
          activo: formData.activo !== undefined ? formData.activo : true,
          stock: formData.stock !== undefined ? formData.stock : 0
        };
        
        const productoResultado = await crearProductoAsync(nuevoProducto);
        
        // Actualizar la lista local
        setProductos([...productos, productoResultado]);
      }
      
      setModalAbierto(false);
    } catch (error) {
      console.error("Error guardando producto:", error);
      alert("Error al guardar el producto. Por favor intenta de nuevo.");
    }
  };

  const eliminarProducto = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      try {
        await eliminarProductoAsync(id);
        const productosActualizados = productos.filter(p => p.id !== id);
        setProductos(productosActualizados);
      } catch (error) {
        console.error("Error eliminando producto:", error);
        alert("Error al eliminar el producto. Por favor intenta de nuevo.");
      }
    }
  };

  const toggleActivo = async (id: string) => {
    try {
      const producto = productos.find(p => p.id === id);
      if (!producto) return;
      
      const productoActualizado = { ...producto, activo: !producto.activo };
      const productoResultado = await actualizarProductoAsync(productoActualizado);
      
      const productosActualizados = productos.map(p =>
        p.id === id ? productoResultado : p
      );
      setProductos(productosActualizados);
    } catch (error) {
      console.error("Error actualizando estado del producto:", error);
      alert("Error al actualizar el estado del producto. Por favor intenta de nuevo.");
    }
  };

  const productosActivos = productos.filter(p => p.activo && p.stock > 0).length;
  const costoInventario = productos.reduce((sum, p) => sum + (p.activo ? p.costo * p.stock : 0), 0);
  const valorInventario = productos.reduce((sum, p) => sum + (p.activo ? p.precio * p.stock : 0), 0);

  const obtenerEstiloStock = (stock: number) => {
    if (stock === 0) return { backgroundColor: '#ef4444', color: 'white' }; // Rojo
    if (stock <= 5) return { backgroundColor: '#f97316', color: 'white' }; // Naranja
    if (stock <= 15) return { backgroundColor: '#eab308', color: 'white' }; // Amarillo
    return { backgroundColor: '#22c55e', color: 'white' }; // Verde
  };
  const totalProductos = productos.length;

  return (
    <div className="space-y-6">
      {/* Header con stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
       

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
             <div>
               <p className="text-sm text-[#64748B]">Productos disponibles</p>
               <p className="text-2xl text-[#1E293B]">{productosActivos}</p>
             </div>
          </div>
        </div>
        

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
             <div>
               <p className="text-sm text-[#64748B]">Costo inventario</p>
               <p className="text-2xl text-[#1E293B]">${costoInventario.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FE7F1E] rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
             <div>
               <p className="text-sm text-[#64748B]">Valor inventario</p>
               <p className="text-2xl text-[#1E293B]">${valorInventario.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Botón nuevo producto */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <h2 className="text-[#1E293B]">Gestión de productos</h2>
         <div className="flex flex-col sm:flex-row gap-3">
           <Button
             onClick={abrirModalNuevo}
             className="bg-[#0C3B2A] hover:bg-[#011d4a] text-white w-full sm:w-auto"
           >
             <Plus className="w-5 h-5 mr-2" />
             Nuevo producto
           </Button>
         </div>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-[#64748B]">Imagen</th>
                <th className="px-6 py-4 text-left text-sm text-[#64748B]">Nombre</th>
                <th className="px-6 py-4 text-left text-sm text-[#64748B]">Categoría</th>
                <th className="px-6 py-4 text-left text-sm text-[#64748B]">Costo</th>
                <th className="px-6 py-4 text-left text-sm text-[#64748B]">Precio</th>
                <th className="px-6 py-4 text-left text-sm text-[#64748B]">Margen</th>
                <th className="px-6 py-4 text-left text-sm text-[#64748B]">Stock</th>
                <th className="px-6 py-4 text-left text-sm text-[#64748B]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productos.map((producto) => {
                const margen = ((producto.precio - producto.costo) / producto.precio * 100).toFixed(0);
                
                return (
                  <tr key={producto.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <img 
                        src={producto.imagen} 
                        alt={producto.nombre}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[#1E293B]">{producto.nombre}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm">
                        {producto.categoria || "Sin categoría"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#64748B]">${producto.costo.toFixed(2)}</td>
                    <td className="px-6 py-4 text-[#1E293B]">${producto.precio.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm text-white ${
                        parseInt(margen) > 50 
                          ? 'bg-gray-500' 
                          : 'bg-gray-600'
                      }`}>
                        {margen}%
                      </span>
                    </td>
                     <td className="px-6 py-4">
                       <Badge 
                         onClick={() => toggleActivo(producto.id)}
                         className="cursor-pointer transition-colors flex items-center gap-1.5 px-3 py-1 rounded-full"
                         style={obtenerEstiloStock(producto.stock)}
                       >
                         <span className="font-semibold">{producto.stock}</span>
                         <span>{producto.stock === 0 ? 'Agotado' : 'Disponible'}</span>
                       </Badge>
                     </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirModalEditar(producto)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => eliminarProducto(producto.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog para crear/editar producto */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {productoEditando ? "Editar producto" : "Nuevo producto"}
            </DialogTitle>
            <DialogDescription>
              {productoEditando 
                ? "Actualiza la información del producto" 
                : "Completa los datos del nuevo producto"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre del producto</Label>
              <Input
                id="nombre"
                value={formData.nombre || ""}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Hot Dog"
              />
            </div>

            <div>
              <Label htmlFor="categoria">Categoría</Label>
              <select
                id="categoria"
                value={formData.categoria || "Comida"}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3B2A]"
              >
                <option value="Comida">Comida</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Snacks">Snacks</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="costo">Costo unitario</Label>
                <Input
                  id="costo"
                  type="number"
                  value={formData.costo || ""}
                  onChange={(e) => setFormData({ ...formData, costo: parseFloat(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="precio">Precio de venta</Label>
                <Input
                  id="precio"
                  type="number"
                  value={formData.precio || ""}
                  onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="imagen">URL de imagen</Label>
              <Input
                id="imagen"
                value={formData.imagen || ""}
                onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center gap-2">
              <Badge 
                onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                className={`cursor-pointer transition-colors text-white flex items-center gap-1.5 ${
                  formData.activo !== false
                    ? 'bg-emerald-500 hover:bg-emerald-600' 
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {formData.activo !== false ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Disponible</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Sin disponibilidad</span>
                  </>
                )}
              </Badge>
              <Label>Estado del producto</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock || ""}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={guardarProducto}
                className="flex-1 bg-[#0C3B2A] hover:bg-[#011d4a] text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
              <Button
                variant="outline"
                onClick={() => setModalAbierto(false)}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}