"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Edit, Trash2, Building2, Search } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

// ─────────── Tipos ───────────
interface Sala {
  idSala: number;
  nombre: string;
  descripcion: string;
  capacidad: string;
  estado: string;
  edificio: string;
  Edificio_idEdificio?: number;
}

interface Edificio {
  idEdificio: number;
  nombre: string;
}

interface FormSala {
  idSala?: number;
  nombre?: string;
  descripcion?: string;
  capacidad?: string;
  estado?: string;
  Edificio_idEdificio?: number;
}

export default function SalasPage() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [backup, setBackup] = useState<Sala[]>([]);
  const [edificios, setEdificios] = useState<Edificio[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalNew, setModalNew] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [form, setForm] = useState<FormSala>({});

  // ─────────── CARGAR DATOS ───────────
  async function load() {
    const s = await axios.get(`${API}/api/salas`);
    setSalas(s.data.data);
    setBackup(s.data.data);

    const e = await axios.get(`${API}/api/edificios`);
    setEdificios(e.data.data);

    setLoading(false);
  }

  useEffect(() => {
    const fetch = async () => {
      await load();
    };
    fetch();
  }, []);

  // ─────────── FILTRAR ───────────
  function filtrar(t: string) {
    setBusqueda(t);
    const v = t.toLowerCase();

    if (!v) return setSalas(backup);

    setSalas(
      backup.filter((s) =>
        s.nombre.toLowerCase().includes(v) ||
        s.descripcion.toLowerCase().includes(v) ||
        s.estado.toLowerCase().includes(v) ||
        s.edificio.toLowerCase().includes(v)
      )
    );
  }

  // ─────────── CREAR ───────────
  async function crear() {
    try {
      await axios.post(`${API}/api/salas`, form);
      setModalNew(false);
      setForm({});
      load();
    } catch {
      alert("Error creando sala");
    }
  }

  // ─────────── EDITAR ───────────
  function abrirEdit(s: Sala) {
    setForm({
      idSala: s.idSala,
      nombre: s.nombre,
      descripcion: s.descripcion,
      capacidad: s.capacidad,
      estado: s.estado,
      Edificio_idEdificio: s.Edificio_idEdificio,
    });
    setModalEdit(true);
  }

  async function guardar() {
    try {
      await axios.put(`${API}/api/salas`, form);
      setModalEdit(false);
      setForm({});
      load();
    } catch {
      alert("Error actualizando sala");
    }
  }

  // ─────────── ELIMINAR ───────────
  async function eliminar(id: number) {
    if (!confirm("¿Eliminar sala?")) return;
    try {
      await axios.delete(`${API}/api/salas/${id}`);
      load();
    } catch {
      alert("No se puede eliminar: tiene exposiciones asociadas.");
    }
  }

  return (
    <div className="min-h-screen p-10 bg-[#dde6f7]">

      {/* TOP */}
      <div className="flex justify-between items-center">
        <button onClick={()=>location.href="/panel"}
          className="px-4 py-2 bg-[#6c8ad5] text-white rounded hover:bg-[#435fa7]">
        ← Volver</button>
        <h1 className="text-4xl font-bold flex items-center gap-3 text-[#1b284b]">
          <Building2 size={36} /> Salas del Museo
        </h1>

        <button
          onClick={() => setModalNew(true)}
          className="px-5 py-2 rounded-lg bg-[#caa131] hover:bg-[#b18f28] text-white flex gap-2 items-center font-semibold"
        >
          <Plus /> Nueva Sala
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="flex justify-center mt-10">
        <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-md w-80">
          <Search className="opacity-60" />
          <input
            value={busqueda}
            onChange={(e) => filtrar(e.target.value)}
            placeholder="Buscar sala, edificio, estado..."
            className="ml-2 outline-none w-full bg-transparent"
          />
        </div>
      </div>

      {/* LISTA */}
      {loading && (
        <p className="mt-10 text-center text-sm text-slate-600">
          Cargando salas...
        </p>
      )}

      <div className="grid gap-7 mt-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {salas.map((s) => (
          <div
            key={s.idSala}
            className="rounded-xl bg-white shadow-lg p-4 border hover:shadow-xl transition"
          >
            <h2 className="font-bold text-lg">{s.nombre}</h2>
            <p className="text-sm opacity-70">{s.descripcion}</p>
            <p className="text-xs mt-1">Capacidad: {s.capacidad}</p>
            <p className="text-xs">Edificio: {s.edificio}</p>
            <p className="text-xs font-semibold">Estado: {s.estado}</p>

            <div className="flex justify-between mt-3">
              <button
                onClick={() => abrirEdit(s)}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded flex gap-1"
              >
                <Edit size={14} /> Editar
              </button>

              <button
                onClick={() => eliminar(s.idSala)}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded flex gap-1"
              >
                <Trash2 size={14} /> Borrar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODALES */}
      {modalNew && (
        <ModalSala
          titulo="Nueva sala"
          submit={crear}
          cerrar={() => setModalNew(false)}
          form={form}
          setForm={setForm}
          edificios={edificios}
        />
      )}

      {modalEdit && (
        <ModalSala
          titulo="Editar sala"
          submit={guardar}
          cerrar={() => setModalEdit(false)}
          form={form}
          setForm={setForm}
          edificios={edificios}
        />
      )}
    </div>
  );
}

// ─────────────────────── MODAL ───────────────────────
function ModalSala({
  titulo,
  submit,
  cerrar,
  form,
  setForm,
  edificios,
}: {
  titulo: string;
  submit: () => void;
  cerrar: () => void;
  form: FormSala;
  setForm: React.Dispatch<React.SetStateAction<FormSala>>;
  edificios: Edificio[];
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-7 w-[430px] shadow-xl">
        <h2 className="text-xl font-bold mb-4">{titulo}</h2>

        <div className="flex flex-col gap-3">
          <input
            className="input"
            placeholder="Nombre"
            value={form.nombre ?? ""}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />

          <input
            className="input"
            placeholder="Descripción"
            value={form.descripcion ?? ""}
            onChange={(e) =>
              setForm({ ...form, descripcion: e.target.value })
            }
          />

          <input
            className="input"
            placeholder="Capacidad"
            value={form.capacidad ?? ""}
            onChange={(e) =>
              setForm({ ...form, capacidad: e.target.value })
            }
          />

          {/* SELECT DINÁMICO EDIFICIOS */}
          <select
            className="input"
            value={form.Edificio_idEdificio ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                Edificio_idEdificio: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
          >
            <option key={0} value="">
              Seleccionar edificio...
            </option>
            {edificios.map((e) => (
              <option key={e.idEdificio} value={e.idEdificio}>
                {e.nombre}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={form.estado ?? ""}
            onChange={(e) =>
              setForm({ ...form, estado: e.target.value })
            }
          >
            <option value="">Estado</option>
            <option value="A">Activa</option>
            <option value="I">Inactiva</option>
          </select>
        </div>

        <button
          onClick={submit}
          className="mt-5 w-full bg-[#caa131] text-white py-2 rounded-lg hover:scale-105 transition"
        >
          Guardar
        </button>
        <button
          onClick={cerrar}
          className="mt-2 w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
