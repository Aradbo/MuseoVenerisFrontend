"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Edit, Trash2, Upload, Search, Palette, Library } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

// ─────────────────────────── Interfaces ───────────────────────────
interface Obra{
  idObra_Arte:number;
  titulo:string;
  descripcion?:string;
  anio_creacion?:string;
  dimensiones?:string;
  urls?:string;
  Artista?:string;
  nombre_coleccion?:string;
  Artista_idArtista?:number
  Coleccion_idColeccion?:number
}
interface Artista{ idArtista:number; nombre:string }
interface Coleccion{ idColeccion:number; tipo:string }

interface FormObra {
  idObra_Arte?: number;
  titulo?: string;
  descripcion?: string;
  dimensiones?: string;
  anio_creacion?: string | null;
  idArtista?: number;
  idColeccion?: number;
  urls?: string;
}

type ModalProps = {
  titulo: string;
  submit: () => void;
  cerrar: () => void;
  form: FormObra;
  setForm: React.Dispatch<React.SetStateAction<FormObra>>;
  artistas: Artista[];
  colecciones: Coleccion[];
};

// ────────────────────────────────────────────────────────────────
export default function ObrasAdminPage(){
  const [obras,setObras]=useState<Obra[]>([]);
  const [backup,setBackup]=useState<Obra[]>([]);
  const [artistas,setArtistas]=useState<Artista[]>([]);
  const [colecciones,setColecciones]=useState<Coleccion[]>([]);
  const [loading,setLoading]=useState(true);

  const [modalNew,setModalNew]=useState(false);
  const [modalEdit,setModalEdit]=useState(false);
  const [form,setForm]=useState<FormObra>({});
  const [editId,setEditId]=useState<number|null>(null);
  const [preview,setPreview]=useState<Obra|null>(null);

  const [busqueda, setBusqueda] = useState("");

  // ─────── Cargar data ───────
  async function loadAll(){
    try{
      const r = await axios.get(`${API}/api/panel/obras`)
      setObras(r.data.data); setBackup(r.data.data)
      const a = await axios.get(`${API}/api/vistas/artistas`)
      const c = await axios.get(`${API}/api/vistas/colecciones`)
      setArtistas(a.data.data); setColecciones(c.data.data)
    }finally{ setLoading(false) }
  }
  useEffect(()=>{ loadAll() },[])

  // ─────── Crear Obra ───────
  async function crearObra(){
    try{
      await axios.post(`${API}/api/panel/obras`, form)
      setModalNew(false); setForm({}); loadAll()
    }catch{ alert("Error guardando obra") }
  }

  // ─────── Editar ───────
  function abrirEdit(o:Obra){
    setEditId(o.idObra_Arte);
    setForm({
      idObra_Arte:o.idObra_Arte,
      titulo:o.titulo,
      descripcion:o.descripcion,
      dimensiones:o.dimensiones,
      anio_creacion:o.anio_creacion?.split("T")[0],
      idArtista:o.Artista_idArtista,
      idColeccion:o.Coleccion_idColeccion,
      urls:o.urls
    });
    setModalEdit(true);
  }
  async function guardarEdicion(){
    try{
      await axios.put(`${API}/api/obras`,form);
      setModalEdit(false); setEditId(null); loadAll()
    }catch{ alert("Error actualizando obra") }
  }

  // ─────── Eliminar ───────
  async function eliminar(id:number){
    if(!confirm("¿Eliminar obra?")) return
    await axios.delete(`${API}/api/obras/${id}`)
    loadAll()
  }

  // ─────── Imagen ───────
  async function subirImagen(id:number,file:File){
    const d=new FormData(); d.append("imagen",file)
    await axios.post(`${API}/api/obras-imagen/subir/${id}`,d)
    loadAll()
  }

  // ─────── Filtros ───────
  // ─────── Buscar solo por texto ───────
function filtrarTexto(val: string) {
  setBusqueda(val);
  const v = val.trim().toLowerCase();

  if (!v) {
    // si está vacío, mostramos todo
    setObras(backup);
    return;
  }

  // filtra por título, descripción, artista o colección
  setObras(
    backup.filter((o) => {
      const titulo = o.titulo?.toLowerCase() || "";
      const desc = o.descripcion?.toLowerCase() || "";
      const artista = o.Artista?.toLowerCase() || "";
      const coleccion = o.nombre_coleccion?.toLowerCase() || "";

      return (
        titulo.includes(v) ||
        desc.includes(v) ||
        artista.includes(v) ||
        coleccion.includes(v)
      );
    })
  );
}


  return(
  <div className="min-h-screen px-10 py-12 bg-[#dbe4ff]">

    {/* TOP */}
    <div className="flex justify-between items-center">
      <button onClick={()=>location.href="/panel"} 
        className="px-4 py-2 rounded-lg bg-[#6c8ad5] text-white hover:bg-[#4b64af] transition">
        ⟵ Volver al panel
      </button>

      <h1 className="text-4xl font-extrabold flex items-center gap-3 text-[#0f1e46]">
        <Palette size={34}/> Obras del Museo
      </h1>

      <button onClick={()=>setModalNew(true)}
        className="px-5 py-2 rounded-lg bg-[#caa131] hover:bg-[#b18f28] text-white flex gap-2 items-center font-semibold">
        <Plus/> Nueva obra
      </button>
    </div>

    {/* FILTROS */}
<div className="flex gap-4 mt-10 justify-center">
  {/* 🔍 Búsqueda general */}
  <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-md w-80">
    <Search className="opacity-60" />
    <input
      value={busqueda}
      onChange={(e) => filtrarTexto(e.target.value)}
      placeholder="Buscar por título, artista o colección..."
      className="ml-2 outline-none w-full bg-transparent"
    />
  </div>
</div>


    {/* ───────────── LOADING ───────────── */}
    {loading && (
      <div className="flex justify-center mt-20">
        <div className="animate-pulse text-[#0f1e46] font-semibold">Cargando obras…</div>
      </div>
    )}

    {/* ───────────── LISTA OBRAS ───────────── */}
    <div className="grid gap-7 mt-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {obras.map(o=>(
        <div key={o.idObra_Arte}
          onClick={()=>setPreview(o)}
          className="rounded-xl bg-white shadow-lg p-4 border hover:shadow-xl transition cursor-pointer">

          <div className="relative h-52 rounded-md overflow-hidden">
            <img src={ o.urls?.startsWith("http") ? o.urls : `${API}${o.urls}` }
                className="w-full h-full object-cover hover:scale-105 transition"/>
            
            <label className="absolute bottom-2 right-2 bg-[#caa131] text-white px-2 py-1 text-xs rounded flex gap-1 cursor-pointer">
              <Upload size={14}/>
              <input type="file" className="hidden"
                     onChange={e=>e.target.files&&subirImagen(o.idObra_Arte,e.target.files[0])}/>
            </label>
          </div>

          <h2 className="font-bold text-lg mt-2">{o.titulo}</h2>
          <p className="text-gray-600 text-sm">{o.Artista} • {o.nombre_coleccion}</p>

          <div className="flex justify-between mt-3">
            <button onClick={(e)=>{e.stopPropagation(); abrirEdit(o)}}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded flex gap-1"><Edit size={14}/> Editar</button>
            <button onClick={(e)=>{e.stopPropagation(); eliminar(o.idObra_Arte)}}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded flex gap-1"><Trash2 size={14}/> Borrar</button>
          </div>
        </div>
      ))}
    </div>

    {/* ─────────────────── Modal Crear ───────────────────*/}
    {modalNew && <Modal titulo="Nueva Obra" submit={crearObra} cerrar={()=>setModalNew(false)} form={form} setForm={setForm} artistas={artistas} colecciones={colecciones}/> }

    {/* ─────────────────── Modal Editar ───────────────────*/}
    {modalEdit && <Modal titulo="Editar Obra" submit={guardarEdicion} cerrar={()=>setModalEdit(false)} form={form} setForm={setForm} artistas={artistas} colecciones={colecciones}/> }


    {/* ───────────── PREVIEW ───────────── */}
    {preview && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-white rounded-xl w-[90%] lg:w-[65%] max-h-[90vh] overflow-hidden shadow-2xl flex">
          
          <img src={preview.urls?.startsWith("http")?preview.urls:`${API}${preview.urls}`}
               className="w-1/2 object-cover"/>

          <div className="p-8 w-1/2 overflow-y-auto">
            <h2 className="text-3xl font-extrabold">{preview.titulo}</h2>
            <p className="italic opacity-60">{preview.Artista}</p>
            <hr className="my-3"/>

            <p><b>Año:</b> {preview.anio_creacion?.split("T")[0]}</p>
            <p><b>Dimensiones:</b> {preview.dimensiones}</p>
            <p><b>Colección:</b> {preview.nombre_coleccion}</p>

            <p className="mt-3 text-justify">{preview.descripcion}</p>

            <button onClick={()=>setPreview(null)}
              className="mt-5 bg-[#caa131] w-full py-2 rounded text-white font-semibold hover:scale-[1.03] transition">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )}

  </div>)
}

/*──────────────────────────── MODAL ───────────────────────────*/
function Modal({ titulo, submit, cerrar, form, setForm, artistas, colecciones }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-7 w-[430px] shadow-xl animate-[fadeIn_.3s]">

        <h2 className="text-xl font-bold mb-4">{titulo}</h2>

        <div className="flex flex-col gap-3">

          <input
            placeholder="Título"
            value={form.titulo ?? ""}
            onChange={e => setForm({ ...form, titulo: e.target.value })}
            className="input"
          />

          <textarea
            placeholder="Descripción"
            value={form.descripcion ?? ""}
            onChange={e => setForm({ ...form, descripcion: e.target.value })}
            className="input"
          />

          <input
            type="date"
            value={form.anio_creacion ?? ""}
            onChange={e => setForm({ ...form, anio_creacion: e.target.value })}
            className="input"
          />

          <input
            placeholder="Dimensiones"
            value={form.dimensiones ?? ""}
            onChange={e => setForm({ ...form, dimensiones: e.target.value })}
            className="input"
          />

          <select
            value={form.idArtista ?? ""}
            onChange={e => setForm({ ...form, idArtista: Number(e.target.value) })}
            className="input"
          >
            <option value="">--Seleccione Artista--</option>
            {artistas.map(a =>
              <option key={a.idArtista} value={a.idArtista}>{a.nombre}</option>
            )}
          </select>

          <select
            value={form.idColeccion ?? ""}
            onChange={e => setForm({ ...form, idColeccion: Number(e.target.value) })}
            className="input"
          >
            <option value="">--Seleccione Colección--</option>
            {colecciones.map(c =>
              <option key={c.idColeccion} value={c.idColeccion}>{c.tipo}</option>
            )}
          </select>

          <input
            placeholder="URL Imagen"
            value={form.urls ?? ""}
            onChange={e => setForm({ ...form, urls: e.target.value })}
            className="input"
          />
        </div>

        <button onClick={submit}
          className="mt-5 w-full bg-[#caa131] text-white font-semibold py-2 rounded-lg hover:scale-[1.03] transition">
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
