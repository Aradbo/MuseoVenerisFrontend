"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Edit, Trash2, Search, Users } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

// ================== TIPOS ==================
interface Visitante {
  idVisitante: number;
  Persona_idPersona: number;
  NombreCompleto: string;
  correo: string;
  usuario: string;
}

interface FormVisitante {
  idVisitante?: number;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  correo?: string;
  usuario?: string;
  contrasenia?: string;
  fecha_nacimiento?: string | null;
  genero?: string;
}

// ============================================
export default function VisitantesPage() {
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [backup, setBackup] = useState<Visitante[]>([]);
  const [busqueda, setBusqueda] = useState("");

  const [loading, setLoading] = useState(true);
  const [modalEdit, setModalEdit] = useState(false);
  const [form, setForm] = useState<FormVisitante>({});

  async function load() {
    const r = await axios.get(`${API}/api/visitantes`);
    setVisitantes(r.data.data); 
    setBackup(r.data.data);
    setLoading(false);
  }

useEffect(() => {
  const fetchData = async () => await load();
  fetchData();
}, []);


  // ================= BUSCADOR =================
  function filtrar(t: string) {
    setBusqueda(t);
    const v = t.toLowerCase();
    if (!v.trim()) return setVisitantes(backup);

    setVisitantes(
      backup.filter(x =>
        x.NombreCompleto.toLowerCase().includes(v) ||
        x.correo.toLowerCase().includes(v) ||
        x.usuario.toLowerCase().includes(v)
      )
    );
  }

  // ================= EDITAR =================
  async function abrirEdicion(v: Visitante) {
    const res = await axios.get(`${API}/api/visitantes/${v.idVisitante}`);
    const p = res.data.data;

    setForm({
      idVisitante: v.idVisitante,
      primer_nombre: p.primer_nombre,
      segundo_nombre: p.segundo_nombre,
      primer_apellido: p.primer_apellido,
      segundo_apellido: p.segundo_apellido,
      correo: p.correo,
      usuario: p.usuario,
      genero: p.genero,
      fecha_nacimiento: p.fecha_nacimiento?.split("T")[0] ?? ""
    });

    setModalEdit(true);
  }

  async function guardarEdicion() {
    try {
      await axios.put(`${API}/api/visitantes`, form);
      setModalEdit(false);
      setForm({});
      load();
    } catch { alert("Error guardando cambios"); }
  }

  // ================= ELIMINAR =================
  async function eliminar(id:number){
    if(!confirm("¿Eliminar visitante?")) return;
    try{
      await axios.delete(`${API}/api/visitantes/${id}`);
      load();
    }catch{
      alert("No se puede eliminar, tiene facturas registradas.");
    }
  }

  // ================= UI =================
  return (
    <div className="min-h-screen p-10 bg-[#dbe4ff]">
      
      <div className="flex justify-between items-center">
        <button onClick={()=>location.href="/panel"}
          className="px-4 py-2 bg-[#6c8ad5] text-white rounded hover:bg-[#435fa7]">
        ← Volver</button>
        <h1 className="text-4xl font-bold flex items-center gap-3 text-[#102142]">
          <Users size={38}/> Visitantes Registrados
        </h1>
      </div>

      {/* 🔍 Buscador */}
      <div className="flex justify-center mt-8">
        <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-md w-96">
          <Search className="opacity-60"/>
          <input value={busqueda} 
            onChange={e=>filtrar(e.target.value)}
            placeholder="Buscar por nombre, correo, usuario..."
            className="ml-2 w-full outline-none"/>
        </div>
      </div>

      {loading && <p className="mt-10 text-center">Cargando...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 mt-12">
        
        { visitantes.map(v => (
          <div key={v.idVisitante} className="bg-white shadow rounded-xl p-5">

            <h2 className="text-lg font-bold">{v.NombreCompleto}</h2>
            <p className="text-sm opacity-70">{v.correo}</p>
            <p className="text-sm opacity-70">Usuario: {v.usuario}</p>

            <div className="flex justify-between mt-3">
              <button onClick={()=>abrirEdicion(v)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs flex gap-1">
                <Edit size={14}/> Editar
              </button>

              <button onClick={()=>eliminar(v.idVisitante)}
                className="px-3 py-1 bg-red-600 text-white rounded text-xs flex gap-1">
                <Trash2 size={14}/> Borrar
              </button>
            </div>

          </div>
        )) }

      </div>

      {modalEdit && (
        <ModalEdit form={form} setForm={setForm}
          cerrar={()=>setModalEdit(false)}
          guardar={guardarEdicion}/>
      )}

    </div>
  );
}

// ================= MODAL EDITAR =================
interface ModalEditProps {
  form: FormVisitante;
  setForm: React.Dispatch<React.SetStateAction<FormVisitante>>;
  cerrar: () => void;
  guardar: () => void;
}

function ModalEdit({ form, setForm, cerrar, guardar }: ModalEditProps)
{
  return(
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-[450px] shadow-xl">

        <h2 className="text-xl font-bold mb-4">Editar Visitante</h2>

        <div className="flex flex-col gap-2">
          <input className="input" placeholder="Primer nombre"
           value={form.primer_nombre ?? ""}
           onChange={e=>setForm({...form,primer_nombre:e.target.value})}/>

          <input className="input" placeholder="Segundo nombre"
           value={form.segundo_nombre ?? ""}
           onChange={e=>setForm({...form,segundo_nombre:e.target.value})}/>

          <input className="input" placeholder="Primer apellido"
           value={form.primer_apellido ?? ""}
           onChange={e=>setForm({...form,primer_apellido:e.target.value})}/>

          <input className="input" placeholder="Segundo apellido"
           value={form.segundo_apellido ?? ""}
           onChange={e=>setForm({...form,segundo_apellido:e.target.value})}/>

          <input className="input" placeholder="Correo"
           value={form.correo ?? ""}
           onChange={e=>setForm({...form,correo:e.target.value})}/>

          <input className="input" placeholder="Usuario"
           value={form.usuario ?? ""}
           onChange={e=>setForm({...form,usuario:e.target.value})}/>

          <input type="date" className="input"
           value={form.fecha_nacimiento ?? ""}
           onChange={e=>setForm({...form,fecha_nacimiento:e.target.value})}/>
        </div>

        <button onClick={guardar}
          className="mt-4 w-full bg-[#caa131] text-white py-2 rounded-lg">
          Guardar
        </button>

        <button onClick={cerrar}
          className="mt-2 w-full bg-gray-600 text-white py-2 rounded-lg">
          Cancelar
        </button>

      </div>
    </div>
  )
}
