"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Edit, Trash2, ShoppingBag, Search, Upload } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

// ===== TIPOS REALES SEGÚN LOS SP =====
interface Producto {
  idProducto: number;
  nombre: string;
  descripcion: string;
  stock: number;
  precio_venta: number;
  precio_compra: number;
  urlImagen?: string | null;   // <- campo correcto que devuelve SP
}

interface FormProducto {
  idProducto?: number;
  nombre?: string;
  descripcion?: string;
  stock?: number;
  precio_venta?: number;
  precio_compra?: number;
}

// ======================================
export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [backup, setBackup] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalNew, setModalNew] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [form, setForm] = useState<FormProducto>({});
  const [imagen, setImagen] = useState<File | null>(null);

  async function load() {
    const r = await axios.get(`${API}/api/productos`);
    const d: Producto[] = r.data.data || [];
    setProductos(d);
    setBackup(d);
    setLoading(false);
  }

useEffect(() => {
  const fetchProducts = async () => {
    await load();      // ← Next.js permitirá setState aquí sin warnings
  };
  fetchProducts();
}, []);



  function filtrar(t: string) {
    setBusqueda(t);
    const v = t.toLowerCase();
    if (!v) return setProductos(backup);

    setProductos(
      backup.filter(p =>
        p.nombre.toLowerCase().includes(v) ||
        p.descripcion?.toLowerCase().includes(v) ||
        String(p.precio_venta).includes(v)
      )
    );
  }

  // ============= CREAR =============
  async function crearProducto() {
    try {
      const r = await axios.post(`${API}/api/productos`, form);
      const id = r.data.data?.idProducto;

      if (imagen && id) {
        const fd = new FormData();
        fd.append("imagen", imagen);
        await axios.post(`${API}/api/productos/upload-imagen/${id}`, fd);
      }

      setModalNew(false);
      setForm({}); setImagen(null);
      load();
    } catch { alert("Error creando producto"); }
  }

  // ============= EDITAR =============
  function abrirEdicion(p: Producto) {
    setForm({
      idProducto: p.idProducto,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio_venta: p.precio_venta,
      precio_compra: p.precio_compra,
      stock: p.stock
    });
    setImagen(null);
    setModalEdit(true);
  }

  async function guardarEdicion() {
    try {
      await axios.put(`${API}/api/productos`, form);

      if (imagen && form.idProducto) {
        const fd = new FormData();
        fd.append("imagen", imagen);
        await axios.post(`${API}/api/productos/upload-imagen/${form.idProducto}`, fd);
      }

      setModalEdit(false);
      setForm({}); setImagen(null);
      load();
    } catch { alert("Error actualizando"); }
  }

  // ============= ELIMINAR =============
  async function eliminar(id:number){
    if(!confirm("¿Eliminar producto?")) return;

    try{ await axios.delete(`${API}/api/productos/${id}`); load(); }
    catch{ alert("No se puede eliminar por facturas o inventario"); }
  }

  // ===================================== UI =====================================
  return (
    <div className="min-h-screen p-10 bg-[#eaf1ff]">

      <div className="flex justify-between items-center">
        <button onClick={()=>location.href="/panel"}
          className="px-4 py-2 bg-[#6c8ad5] text-white rounded hover:bg-[#435fa7]">
        ← Volver</button>
        <h1 className="text-4xl font-bold flex items-center gap-3 text-[#102142]">
          <ShoppingBag size={38}/> Productos del Museo
        </h1>

        <button onClick={()=>setModalNew(true)}
          className="px-5 py-2 rounded-lg bg-[#caa131] text-white hover:bg-[#b18f28] flex gap-2 items-center">
          <Plus/> Nuevo Producto
        </button>
      </div>

      <div className="flex justify-center mt-8">
        <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-md w-96">
          <Search className="opacity-60"/>
          <input value={busqueda} onChange={e=>filtrar(e.target.value)}
            placeholder="Buscar producto..." className="ml-2 w-full outline-none"/>
        </div>
      </div>

      {loading && <p className="text-center mt-10">Cargando...</p>}

      <div className="grid gap-7 mt-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

        {productos.map(p=>(
          <div key={p.idProducto} className="rounded-xl bg-white shadow p-4">

            <img src={p.urlImagen ? `${API}${p.urlImagen}` : "/no-img.png"}
              className="w-full h-48 object-cover rounded mb-2"/>

            <h2 className="font-bold text-lg">{p.nombre}</h2>
            <p className="text-sm opacity-60">{p.descripcion}</p>

            <p className="mt-2 font-semibold text-[#0f233b]">
              L {p.precio_venta?.toFixed(2)}
            </p>

            <p className="text-xs opacity-60">Stock: {p.stock ?? 0}</p>

            <div className="flex justify-between mt-3">
              <button onClick={()=>abrirEdicion(p)}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded flex gap-1">
                <Edit size={14}/> Editar
              </button>

              <button onClick={()=>eliminar(p.idProducto)}
                className="px-3 py-1 bg-red-600 text-white text-xs rounded flex gap-1">
                <Trash2 size={14}/> Borrar
              </button>
            </div>
          </div>
        ))}

      </div>

      {/* ========= MODALES ========= */}
      {modalNew && (
        <Modal form={form} setForm={setForm} setImagen={setImagen}
               titulo="Nuevo producto" submit={crearProducto} cerrar={()=>setModalNew(false)}/>
      )}

      {modalEdit && (
        <Modal form={form} setForm={setForm} setImagen={setImagen}
               titulo="Editar producto" submit={guardarEdicion} cerrar={()=>setModalEdit(false)}/>
      )}

    </div>
  );
}

// ================== MODAL ==================
// ================== MODAL ==================
interface ModalProps {
  titulo: string;
  submit: () => void;
  cerrar: () => void;
  form: FormProducto;
  setForm: React.Dispatch<React.SetStateAction<FormProducto>>;
  setImagen: React.Dispatch<React.SetStateAction<File | null>>;
}

function Modal({ titulo, submit, cerrar, form, setForm, setImagen }: ModalProps) {

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[450px] shadow-xl">

        <h2 className="text-xl font-bold mb-4">{titulo}</h2>

        <div className="flex flex-col gap-3">

          <input className="input" placeholder="Nombre"
            value={form.nombre ?? ""} 
            onChange={e => setForm({ ...form, nombre: e.target.value })}/>

          <textarea className="input" placeholder="Descripción"
            value={form.descripcion ?? ""} 
            onChange={e => setForm({ ...form, descripcion: e.target.value })}/>

          {/* PRECIO VENTA */}
          <label className="font-medium text-sm mt-1">Precio Venta L.</label>
          <input type="number" className="input"
            placeholder="Ej: 350"
            value={form.precio_venta ?? ""}
            min={0}
            onChange={e=>setForm({ ...form, precio_venta:Number(e.target.value) })}
          />

           <label className="font-medium text-sm">Precio Compra L.</label>
          <input type="number" className="input"
            placeholder="Costo real del producto"
            value={form.precio_compra ?? ""}
            min={0}
            onChange={e=>setForm({ ...form, precio_compra:Number(e.target.value) })}
          />

          <label className="font-medium text-sm">Stock disponible</label>
          <input type="number" className="input"
            placeholder="Cantidad en inventario"
            value={form.stock ?? ""}
            min={0}
            onChange={e=>setForm({ ...form, stock:Number(e.target.value) })}
          />

          {/* IMAGEN */}
          <label className="font-medium text-sm">Seleccionar imagen</label>
          <input type="file"
            className="input"
            onChange={e => setImagen(e.target.files ? e.target.files[0] : null)}
          />
        </div>

        <button onClick={submit}
          className="mt-4 w-full bg-[#caa131] text-white py-2 rounded-lg hover:scale-105 transition">
          Guardar
        </button>

        <button onClick={cerrar}
          className="mt-2 w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-800 transition">
          Cancelar
        </button>
      </div>
    </div>
  );
}
