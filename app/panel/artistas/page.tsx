"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { UserPlus, Edit, Trash2, Search, Paintbrush } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

// ================= INTERFACES =================
interface Artista {
  idArtista: number;
  NombreCompleto: string;
  biografia?: string;
  fecha_nacimiento?: string;
  fecha_difuncion?: string;
  genero?: string;
  correo?: string;
}

interface FormArtista {
  idArtista?: number;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  biografia?: string;
  fecha_nacimiento?: string;
  fecha_difuncion?: string;
  correo?: string;
  genero?: string;
  usuario?: string;
  contrasenia?: string;
}


// ================= COMPONENTE =================
export default function ArtistasAdmin(){
  
  const [artistas,setArtistas]=useState<Artista[]>([]);
  const [backup,setBackup]=useState<Artista[]>([]);
  const [loading,setLoading]=useState(true);

  const [modalNew,setModalNew]=useState(false);
  const [modalEdit,setModalEdit]=useState(false);

  const [form,setForm]=useState<FormArtista>({});
  const [busqueda,setBusqueda]=useState("");


  // =========== CARGAR TODOS ===========
  async function loadAll(){
    try{
      const r= await axios.get(`${API}/api/artistas`);
      setArtistas(r.data.data);
      setBackup(r.data.data);
    }finally{
      setLoading(false);
    }
  }
  useEffect(()=>{ loadAll(); },[]);


  // =========== SEARCH ===========
  async function buscar(text:string){
    setBusqueda(text);
    if(!text.trim()) return loadAll();
    const r= await axios.get(`${API}/api/artistas/buscar/texto?texto=${text}`);
    setArtistas(r.data.data);
  }


  // =========== CREATE ===========
  async function crear(){
    try{
      await axios.post(`${API}/api/artistas`,form);
      setModalNew(false);
      setForm({});
      loadAll();
    }catch{
      alert("Error guardando artista");
    }
  }


  // =========== EDIT ===========
  function abrirEdit(a:Artista){
    const partes=a.NombreCompleto.split(" ");

    setForm({
      idArtista:a.idArtista,
      primer_nombre: partes[0],
      segundo_nombre: partes[1] ?? "",
      primer_apellido: partes[2] ?? "",
      segundo_apellido: partes[3] ?? "",
      biografia:a.biografia ?? "",
      fecha_nacimiento:a.fecha_nacimiento?.split("T")[0] ?? "",
      fecha_difuncion:a.fecha_difuncion?.split("T")[0] ?? "",
      genero:a.genero ?? "",
      correo:a.correo ?? ""
    });

    setModalEdit(true);
  }

  async function guardar(){
   const payload = {
    ...form,
    fecha_nacimiento: form.fecha_nacimiento?.trim() === "" ? null : form.fecha_nacimiento,
    fecha_difuncion: form.fecha_difuncion?.trim() === "" ? null : form.fecha_difuncion
  };

  try{
    await axios.put(`${API}/api/artistas`, payload);
    setModalEdit(false);
    loadAll();
  }catch{
    alert("Error actualizando artista");
  }
  }


  // =========== DELETE ===========
  async function eliminar(id:number){
    if(!confirm("¿Eliminar artista?")) return;
    try{
      await axios.delete(`${API}/api/artistas/${id}`);
      loadAll();
    }catch{
      alert("No se puede eliminar porque tiene obras asociadas.");
    }
  }


  return(
    <div className="min-h-screen px-10 py-12 bg-[#dbe4ff]">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <button onClick={()=>location.href="/panel"}
          className="px-4 py-2 bg-[#6c8ad5] text-white rounded hover:bg-[#435fa7]">← Volver</button>
        <h1 className="text-4xl font-extrabold flex items-center gap-3 text-[#10204e]">
          <Paintbrush size={35}/> Artistas
        </h1>

        <button onClick={()=>setModalNew(true)}
          className="bg-[#caa131] text-white px-5 py-2 rounded-lg flex gap-2">
          <UserPlus size={18}/> Nuevo Artista
        </button>
      </div>


      {/* SEARCH */}
      <div className="flex justify-center mt-8">
        <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-md w-80">
          <Search size={18}/>
          <input 
            value={busqueda}
            onChange={(e)=>buscar(e.target.value)}
            placeholder="Buscar artista..."
            className="ml-2 outline-none w-full bg-transparent"
          />
        </div>
      </div>


      {/* LOADING */}
      {loading && <p className="text-center mt-12">Cargando...</p>}


      {/* LISTA */}
      <div className="grid gap-7 mt-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        
        {artistas.map(a=>(
          <div key={a.idArtista} className="rounded-xl bg-white shadow-lg p-4 hover:shadow-xl transition">

            <h2 className="font-bold text-lg">{a.NombreCompleto}</h2>
            <p className="text-xs opacity-60 mb-2">{a.genero}</p>

            <p className="text-sm line-clamp-3 opacity-80">{a.biografia}</p>

            <div className="flex justify-between mt-4">
              <button onClick={()=>abrirEdit(a)}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded flex gap-1"><Edit size={14}/> Editar</button>

              <button onClick={()=>eliminar(a.idArtista)}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded flex gap-1"><Trash2 size={14}/> Borrar</button>
            </div>
          </div>
        ))}
      </div>


      {/* MODALES */}
      {modalNew && (
        <ModalArtista titulo="Nuevo Artista" submit={crear} cerrar={()=>setModalNew(false)} form={form} setForm={setForm}/>
      )}
      {modalEdit && (
        <ModalArtista titulo="Editar Artista" submit={guardar} cerrar={()=>setModalEdit(false)} form={form} setForm={setForm}/>
      )}

    </div>
  );
}





/* ======================= MODAL ======================= */
function ModalArtista({
  titulo,submit,cerrar,form,setForm
}:{
  titulo:string;
  submit:()=>void;
  cerrar:()=>void;
  form:FormArtista;
  setForm: React.Dispatch<React.SetStateAction<FormArtista>>;
}){

  return(
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-7 w-[460px] space-y-3">

        <h2 className="font-bold text-xl">{titulo}</h2>

        <div className="grid grid-cols-2 gap-2">
          <input className="input" placeholder="Primer Nombre" value={form.primer_nombre ?? ""} onChange={e=>setForm(f=>({...f,primer_nombre:e.target.value}))}/>
          <input className="input" placeholder="Segundo Nombre" value={form.segundo_nombre ?? ""} onChange={e=>setForm(f=>({...f,segundo_nombre:e.target.value}))}/>
          <input className="input" placeholder="Primer Apellido" value={form.primer_apellido ?? ""} onChange={e=>setForm(f=>({...f,primer_apellido:e.target.value}))}/>
          <input className="input" placeholder="Segundo Apellido" value={form.segundo_apellido ?? ""} onChange={e=>setForm(f=>({...f,segundo_apellido:e.target.value}))}/>
        </div>

        <textarea className="input" placeholder="Biografía" value={form.biografia ?? ""} onChange={e=>setForm(f=>({...f,biografia:e.target.value}))}/>

        <div className="grid grid-cols-2 gap-2">
          <input type="date"
  value={form.fecha_nacimiento ?? ""}
  onChange={e=>setForm({...form,fecha_nacimiento:e.target.value})}
/>
          <input type="date"
  value={form.fecha_difuncion ?? ""}
  onChange={e=>setForm({...form,fecha_difuncion:e.target.value})}
/>
        </div>

        <input className="input" placeholder="Correo" value={form.correo ?? ""}onChange={e=>setForm(f=>({...f,correo:e.target.value}))}/>

        <select className="input" value={form.genero ?? ""} onChange={e=>setForm(f=>({...f,genero:e.target.value}))}>
          <option value="">Género</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
          <option value="O">Otro</option>
        </select>

        <input className="input" placeholder="Usuario" value={form.usuario ?? ""}onChange={e=>setForm(f=>({...f,usuario:e.target.value}))}/>
        <input className="input" placeholder="Contraseña" type="password" value={form.contrasenia ?? ""}onChange={e=>setForm(f=>({...f,contrasenia:e.target.value}))}/>

        <button onClick={submit} className="w-full bg-[#caa131] py-2 text-white rounded-lg">Guardar</button>
        <button onClick={cerrar} className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-800">Cancelar</button>

      </div>
    </div>
  );
}
