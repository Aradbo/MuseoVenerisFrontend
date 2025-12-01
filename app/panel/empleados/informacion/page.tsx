"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Search, UserCircle, BadgeInfo, Phone, Briefcase, Clock, Eye } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ================== TIPOS BASADOS EN VW ==================
interface Empleado {
  idEmpleado: number;
  nombre_completo: string;
  correo: string;
  usuario: string;
  telefono_principal: string | null;
  fecha_contratacion: string;
  fecha_nacimiento: string | null;
  edad: number;

  cargo_actual: string | null;
  departamento_actual: string | null;
  departamento_descripcion: string | null;
  meses_en_cargo_actual: number | null;

  cargo_anterior_nombre: string | null;
  departamento_anterior_nombre: string | null;
  fecha_fin_anterior: string | null;
  meses_en_cargo_anterior: number | null;

  años_en_empresa: number | null;
  categoria_antiguedad: string;
}
// ===========================================================

export default function EmpleadosPage(){

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [backup, setBackup] = useState<Empleado[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  const [preview, setPreview] = useState<Empleado|null>(null);

  // ============= LOAD SEGURO (sin error de efecto) ============
  useEffect(() => {
    const fetchData = async () => {
      const r = await axios.get(`${API}/api/vistas/empleados-historial`);
      const data:Empleado[] = r.data.recordset || [];
      setEmpleados(data);
      setBackup(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  // ================= FILTRO =================
  function filtrar(t:string){
    setBusqueda(t);
    const v = t.trim().toLowerCase();
    if(!v) return setEmpleados(backup);

    setEmpleados(
      backup.filter(e => 
        e.nombre_completo.toLowerCase().includes(v) ||
        e.correo?.toLowerCase().includes(v) ||
        e.usuario?.toLowerCase().includes(v) ||
        e.cargo_actual?.toLowerCase().includes(v) ||
        e.departamento_actual?.toLowerCase().includes(v)
      )
    );
  }

  return(
    <div className="min-h-screen px-10 py-12 bg-[#dbe4ff]">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold flex items-center gap-3 text-[#0f1e46]">
          <UserCircle size={38}/> Empleados del Museo
        </h1>
      </div>

      {/* BUSCADOR */}
      <div className="flex justify-center mt-10">
        <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-md w-96">
          <Search className="opacity-60"/> 
          <input
            value={busqueda}
            onChange={e=>filtrar(e.target.value)}
            placeholder="Buscar por nombre, cargo o departamento..."
            className="ml-2 outline-none w-full"
          />
        </div>
      </div>

      {loading && <p className="text-center mt-16 font-semibold text-[#0f1e46]">Cargando información...</p>}

      {/* ---- GRID ---- */}
      <div className="grid gap-7 mt-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {empleados.map(e=>(
          <div key={e.idEmpleado}
            onClick={()=>setPreview(e)}
            className="bg-white p-5 rounded-xl shadow hover:shadow-xl border cursor-pointer transition">

            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg text-[#132f59]">{e.nombre_completo}</h2>

              <span className={`px-2 py-1 text-xs rounded text-white ${
                e.categoria_antiguedad==="NUEVO"     && "bg-green-600" ||
                e.categoria_antiguedad==="ANTIGUO"   && "bg-purple-700" ||
                "bg-blue-600"
              }`}>
                {e.categoria_antiguedad}
              </span>
            </div>

            <p className="text-sm opacity-60">{e.usuario} · {e.correo}</p>

            <div className="mt-3 text-sm">
              <p><Briefcase size={14} className="inline"/> <b>Cargo actual:</b> {e.cargo_actual || "Sin asignación"}</p>
              <p><BadgeInfo size={14} className="inline"/> <b>Departamento:</b> {e.departamento_actual}</p>
              <p><Clock size={14} className="inline"/> <b>Meses en cargo:</b> {e.meses_en_cargo_actual ?? 0}</p>
            </div>

            <button 
              onClick={(ev)=>{ev.stopPropagation(); setPreview(e)}}
              className="mt-3 w-full bg-[#caa131] text-white py-1 rounded flex gap-1 justify-center hover:scale-[1.04] transition">
              <Eye size={15}/> Ver detalles
            </button>

          </div>
        ))}
      </div>

      {/* ─────────── MODAL PREVIEW ─────────── */}
      {preview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-[550px] max-h-[90vh] overflow-y-auto shadow-2xl">

            <h2 className="text-2xl font-extrabold mb-2">{preview.nombre_completo}</h2>
            <hr className="my-3"/>

            <p><b>Correo:</b> {preview.correo}</p>
            <p><b>Usuario:</b> {preview.usuario}</p>
            <p><Phone size={14} className="inline"/> {preview.telefono_principal || "Sin telefono"}</p>
            <p><b>Fecha contratación:</b> {preview.fecha_contratacion?.split("T")[0]}</p>
            <p><b>Años en empresa:</b> {preview.años_en_empresa}</p>

            <hr className="my-3"/>
            <h3 className="font-bold text-lg mb-1">Cargo Actual</h3>
            <p><b>Cargo:</b> {preview.cargo_actual}</p>
            <p><b>Departamento:</b> {preview.departamento_actual}</p>
            <p><b>Meses activo:</b> {preview.meses_en_cargo_actual}</p>

            <hr className="my-3"/>
            <h3 className="font-bold text-lg mb-1">Último cargo anterior</h3>
            <p><b>Cargo:</b> {preview.cargo_anterior_nombre || "N/A"}</p>
            <p><b>Departamento:</b> {preview.departamento_anterior_nombre || "N/A"}</p>
            <p><b>Finalizó:</b> {preview.fecha_fin_anterior?.split("T")[0] || "N/A"}</p>
            <p><b>Meses:</b> {preview.meses_en_cargo_anterior ?? "N/A"}</p>

            <button
              onClick={()=>setPreview(null)}
              className="mt-5 bg-[#caa131] w-full py-2 rounded text-white font-semibold hover:scale-[1.03] transition">
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
