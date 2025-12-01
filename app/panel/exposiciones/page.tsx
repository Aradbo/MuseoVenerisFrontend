"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Edit, Trash2, Search, LayoutDashboard } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

// 🔹 Interface de Exposición
interface Exposicion {
  idExposicion: number;
  nombre: string;
  tipo: string;              // P=permanente, T=temporal
  descripcion?: string;
  Sala_idSala?: number;
  urls?: string;
  estado: string;            // A activa | I inactiva
}

interface FormExpo {
  idExposicion?: number;
  nombre?: string;
  tipo?: string;
  descripcion?: string;
  Sala_idSala?: number;
  urls?: string;
  estado?: string;
}

export default function ExposicionesAdmin() {
  const [expos, setExpos] = useState<Exposicion[]>([]);
  const [backup, setBackup] = useState<Exposicion[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalNew, setModalNew] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [form, setForm] = useState<FormExpo>({});
  const [busqueda, setBusqueda] = useState("");

  // ================= CARGAR TODO =================
  async function loadAll() {
    try {
      const r = await axios.get(`${API}/api/exposiciones`);
      setExpos(r.data.data);
      setBackup(r.data.data);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadAll(); }, []);

  // ================= CREAR =================
  async function crear() {
    try {
      await axios.post(`${API}/api/exposiciones`, form);
      setModalNew(false); setForm({}); loadAll();
    } catch {
      alert("Error creando exposición");
    }
  }

  // ================= EDITAR =================
  function abrirEdit(e: Exposicion) {
    setForm({ ...e });
    setModalEdit(true);
  }

  async function guardar() {
    try {
      await axios.put(`${API}/api/exposiciones`, form);
      setModalEdit(false); setForm({}); loadAll();
    } catch {
      alert("Error actualizando exposición");
    }
  }

  // ================= ELIMINAR =================
  async function eliminar(id: number) {
    if (!confirm("¿Eliminar exposición?")) return;
    try {
      await axios.delete(`${API}/api/exposiciones/${id}`);
      loadAll();
    } catch {
      alert("No se pudo eliminar. Puede tener obras asociadas.");
    }
  }

  // ================= BUSCAR =================
  async function buscar(texto: string) {
    setBusqueda(texto);
    if (!texto.trim()) return loadAll();

    const r = await axios.get(`${API}/api/exposiciones/buscar/texto?texto=${texto}`);
    setExpos(r.data.data);
  }

  return (
    <div className="min-h-screen px-10 py-12 bg-[#dbe4ff]">

      {/* TOP BAR */}
      <div className="flex justify-between items-center">
        <button onClick={()=>location.href="/panel"}
          className="px-4 py-2 bg-[#6c8ad5] text-white rounded hover:bg-[#435fa7]">
        ← Volver</button>

        <h1 className="text-4xl font-extrabold text-[#10204e] flex items-center gap-3">
          <LayoutDashboard size={35}/> Exposiciones
        </h1>

        <button onClick={()=>setModalNew(true)}
          className="px-5 py-2 bg-[#caa131] text-white rounded-lg font-semibold flex gap-1 hover:bg-[#b18d28]">
          <Plus/> Nueva Exposición
        </button>
      </div>

      {/* SEARCH */}
      <div className="flex justify-center mt-10">
        <div className="flex items-center px-4 py-2 bg-white rounded-full shadow-md w-80">
          <Search/><input
            value={busqueda}
            onChange={(e)=>buscar(e.target.value)}
            placeholder="Buscar exposición..."
            className="ml-2 outline-none w-full bg-transparent"/>
        </div>
      </div>

      {/* LOADING */}
      {loading && <p className="text-center mt-16">Cargando exposiciones...</p>}

      {/* LISTA */}
      <div className="grid gap-7 mt-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {expos.map(e=>(
          <div key={e.idExposicion}
            className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition">

            <img src={e.urls ?? "/img/noimg.png"}
                 className="w-full h-52 rounded-md object-cover"/>

            <h2 className="font-bold text-lg mt-2">{e.nombre}</h2>
            <p className="text-sm opacity-70">
              {e.tipo==="P"?"📍 Permanente":"⏳ Temporal"}
            </p>

            <p className="text-xs mt-1">{e.descripcion?.slice(0,90)}...</p>

            <div className="flex justify-between mt-3">
              <button onClick={()=>abrirEdit(e)}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded flex gap-1"><Edit size={14}/>Editar</button>
              <button onClick={()=>eliminar(e.idExposicion)}
                className="text-xs bg-red-600 text-white px-2 py-1 rounded flex gap-1"><Trash2 size={14}/>Borrar</button>
            </div>
          </div>
        ))}
      </div>

      {/* ----------- MODAL CREAR ----------- */}
      {modalNew && <ModalExpo titulo="Nueva Exposición" submit={crear} cerrar={()=>setModalNew(false)} form={form} setForm={setForm}/>}

      {/* ----------- MODAL EDITAR ----------- */}
      {modalEdit && <ModalExpo titulo="Editar Exposición" submit={guardar} cerrar={()=>setModalEdit(false)} form={form} setForm={setForm}/>}

    </div>
  );
}


function ModalExpo({titulo,submit,cerrar,form,setForm}: {
  titulo: string;
  submit: () => void;
  cerrar: () => void;
  form: FormExpo;
  setForm: React.Dispatch<React.SetStateAction<FormExpo>>;}) 
  {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-7 w-[430px] shadow-xl">

        <h2 className="text-xl font-bold mb-4">{titulo}</h2>

        <div className="flex flex-col gap-3">
          
          <input className="input" placeholder="Nombre"
            value={form.nombre ?? ""} onChange={e=>setForm({...form,nombre:e.target.value})}/>

          <select className="input"
            value={form.tipo ?? ""} onChange={e=>setForm({...form,tipo:e.target.value})}>
            <option value="">Tipo exposición</option>
            <option value="P">Permanente</option>
            <option value="T">Temporal</option>
          </select>
          
          <textarea className="input" placeholder="Descripción"
            value={form.descripcion ?? ""} onChange={e=>setForm({...form,descripcion:e.target.value})}/>

          <input className="input" placeholder="URL de imagen"
            value={form.urls ?? ""} onChange={e=>setForm({...form,urls:e.target.value})}/>

          <input className="input" placeholder="ID Sala"
            value={form.Sala_idSala ?? ""} onChange={e=>setForm({...form,Sala_idSala:Number(e.target.value)})}/>

          <select className="input"
            value={form.estado ?? "A"} onChange={e=>setForm({...form,estado:e.target.value})}>
            <option value="A">Activa</option>
            <option value="I">Inactiva</option>
          </select>
        </div>

        <button onClick={submit}
          className="mt-5 w-full bg-[#caa131] text-white py-2 rounded-lg">Guardar</button>
        <button onClick={cerrar}
          className="mt-2 w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-800">Cancelar</button>
      </div>
    </div>
  );
}
