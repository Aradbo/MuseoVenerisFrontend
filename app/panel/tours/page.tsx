"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Edit, Trash2, Ticket, Search, User, CalendarClock } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ─────────── Tipos ───────────
interface Tour {
  idTour: number;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: string;            // P = Programado, R = Realizado, C = Cancelado
  capacidad: number;
  IdEmpleado: number;
  NombreEmpleado: string;
}

interface FormTour {
  idTour?: number;
  fecha_hora_inicio?: string;
  fecha_hora_fin?: string;
  estado?: string;
  capacidad?: number;
  Empleado_idEmpleado?: number;
}

// Formatea date SQL/ISO a value para <input type="datetime-local">
function toInputDateTime(value?: string): string {
  if (!value) return "";
  // Ej: "2025-11-30T10:30:00.000Z" -> "2025-11-30T10:30"
  return value.slice(0, 16);
}

function formatFechaBonita(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("es-HN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [backup, setBackup] = useState<Tour[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalNew, setModalNew] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [form, setForm] = useState<FormTour>({ estado: "P" });

  // ─────────── CARGAR DATOS ───────────
  async function load() {
    const r = await axios.get(`${API}/api/tours`);
    const data: Tour[] = r.data.data || [];
    setTours(data);
    setBackup(data);
    setLoading(false);
  }

  useEffect(() => {
    const fetchData = async () => {
      await load();
    };
    fetchData();
  }, []);

  // ─────────── FILTRO ───────────
  function filtrar(t: string) {
    setBusqueda(t);
    const v = t.toLowerCase();

    if (!v) {
      setTours(backup);
      return;
    }

    setTours(
      backup.filter((tour) => {
        const emp = tour.NombreEmpleado?.toLowerCase() ?? "";
        const estado = tour.estado?.toLowerCase() ?? "";
        const cap = String(tour.capacidad ?? "").toLowerCase();
        const fechaIni = formatFechaBonita(tour.fecha_hora_inicio).toLowerCase();

        return (
          emp.includes(v) ||
          estado.includes(v) ||
          cap.includes(v) ||
          fechaIni.includes(v)
        );
      })
    );
  }

  // ─────────── CREAR ───────────
  async function crearTour() {
    try {
      const payload = {
      fecha_hora_inicio: form.fecha_hora_inicio?.replace("T", " ") + ":00",
      fecha_hora_fin: form.fecha_hora_fin?.replace("T", " ") + ":00",
      estado: form.estado ?? "P",
      capacidad: form.capacidad ?? 0,
      Empleado_idEmpleado: form.Empleado_idEmpleado,
    };


      await axios.post(`${API}/api/tours`, payload);
      setModalNew(false);
      setForm({ estado: "P" });
      load();
    } catch {
      alert("Error creando tour. Verifica que no se traslape con otro y que los datos estén completos.");
    }
  }

  // ─────────── EDITAR ───────────
  function abrirEdit(t: Tour) {
    setForm({
      idTour: t.idTour,
      fecha_hora_inicio: toInputDateTime(t.fecha_hora_inicio),
      fecha_hora_fin: toInputDateTime(t.fecha_hora_fin),
      estado: t.estado,
      capacidad: t.capacidad,
      Empleado_idEmpleado: t.IdEmpleado,
    });
    setModalEdit(true);
  }

  async function guardarEdicion() {
    if (!form.idTour) {
      alert("No se encontró el ID del tour a editar.");
      return;
    }

    try {
      const payload = {
      fecha_hora_inicio: form.fecha_hora_inicio?.replace("T", " ") + ":00",
      fecha_hora_fin: form.fecha_hora_fin?.replace("T", " ") + ":00",
      estado: form.estado ?? "P",
      capacidad: form.capacidad ?? 0,
      Empleado_idEmpleado: form.Empleado_idEmpleado,
    };



      await axios.put(`${API}/api/tours/${form.idTour}`, payload);
      setModalEdit(false);
      setForm({ estado: "P" });
      load();
    } catch {
      alert("Error actualizando tour. Revisa que no se traslape con otro y que los datos estén correctos.");
    }
  }

  // ─────────── ELIMINAR ───────────
  async function eliminar(id: number) {
    if (!confirm("¿Eliminar tour?")) return;

    try {
      await axios.delete(`${API}/api/tours/${id}`);
      load();
    } catch {
      alert("No se puede eliminar el tour porque está asignado a una factura.");
    }
  }

  return (
    <div className="min-h-screen p-10 bg-[#e0edff]">
      {/* TOP */}
      <div className="flex justify-between items-center">
        <button onClick={()=>location.href="/panel"}
          className="px-4 py-2 bg-[#6c8ad5] text-white rounded hover:bg-[#435fa7]">
        ← Volver</button>
        <h1 className="text-4xl font-bold flex items-center gap-3 text-[#132349]">
          <Ticket size={34} /> Tours del Museo
        </h1>

        <button
          onClick={() => {
            setForm({ estado: "P" });
            setModalNew(true);
          }}
          className="px-5 py-2 rounded-lg bg-[#caa131] hover:bg-[#b18f28] text-white flex gap-2 items-center font-semibold"
        >
          <Plus /> Nuevo Tour
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="flex justify-center mt-10">
        <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-md w-96">
          <Search className="opacity-60" />
          <input
            value={busqueda}
            onChange={(e) => filtrar(e.target.value)}
            placeholder="Buscar por empleado, estado, fecha o capacidad..."
            className="ml-2 outline-none w-full bg-transparent"
          />
        </div>
      </div>

      {loading && (
        <p className="mt-10 text-center text-sm text-slate-600">
          Cargando tours...
        </p>
      )}

      {/* LISTA DE TOURS */}
      <div className="grid gap-7 mt-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {tours.map((t) => (
          <div
            key={t.idTour}
            className="rounded-xl bg-white shadow-lg p-4 border hover:shadow-xl transition"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <CalendarClock size={18} /> Tour #{t.idTour}
              </h2>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  t.estado === "P"
                    ? "bg-blue-100 text-blue-700"
                    : t.estado === "R"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {t.estado === "P"
                  ? "Programado"
                  : t.estado === "R"
                  ? "Realizado"
                  : "Cancelado"}
              </span>
            </div>

            <p className="text-xs text-slate-600">
              <b>Inicio:</b> {formatFechaBonita(t.fecha_hora_inicio)}
            </p>
            <p className="text-xs text-slate-600">
              <b>Fin:</b> {formatFechaBonita(t.fecha_hora_fin)}
            </p>

            <p className="text-xs mt-2 flex items-center gap-1">
              <User size={14} className="opacity-70" />{" "}
              <span className="font-medium">{t.NombreEmpleado}</span> (ID{" "}
              {t.IdEmpleado})
            </p>

            <p className="text-xs mt-1">
              <b>Capacidad:</b> {t.capacidad} personas
            </p>

            <div className="flex justify-between mt-3">
              <button
                onClick={() => abrirEdit(t)}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded flex gap-1"
              >
                <Edit size={14} /> Editar
              </button>

              <button
                onClick={() => eliminar(t.idTour)}
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
        <ModalTour
          titulo="Nuevo Tour"
          submit={crearTour}
          cerrar={() => setModalNew(false)}
          form={form}
          setForm={setForm}
        />
      )}

      {modalEdit && (
        <ModalTour
          titulo="Editar Tour"
          submit={guardarEdicion}
          cerrar={() => setModalEdit(false)}
          form={form}
          setForm={setForm}
        />
      )}
    </div>
  );
}

// ─────────────────────── MODAL ───────────────────────
function ModalTour({
  titulo,
  submit,
  cerrar,
  form,
  setForm,
}: {
  titulo: string;
  submit: () => void;
  cerrar: () => void;
  form: FormTour;
  setForm: React.Dispatch<React.SetStateAction<FormTour>>;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-7 w-[460px] shadow-xl">
        <h2 className="text-xl font-bold mb-4">{titulo}</h2>

        <div className="flex flex-col gap-3">
          <label className="text-xs font-medium text-slate-600">
            Fecha y hora de inicio
          </label>
          <input
            type="datetime-local"
            className="input"
            value={form.fecha_hora_inicio ?? ""}
            onChange={(e) =>
              setForm({ ...form, fecha_hora_inicio: e.target.value })
            }
          />

          <label className="text-xs font-medium text-slate-600">
            Fecha y hora de fin
          </label>
          <input
            type="datetime-local"
            className="input"
            value={form.fecha_hora_fin ?? ""}
            onChange={(e) =>
              setForm({ ...form, fecha_hora_fin: e.target.value })
            }
          />

          <label className="text-xs font-medium text-slate-600">
            Capacidad (personas)
          </label>
          <input
            type="number"
            min={1}
            className="input"
            value={form.capacidad ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                capacidad: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />

          <label className="text-xs font-medium text-slate-600">
            ID Empleado responsable
          </label>
          <input
            type="number"
            className="input"
            value={form.Empleado_idEmpleado ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                Empleado_idEmpleado: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
          />

          <label className="text-xs font-medium text-slate-600">
            Estado del tour
          </label>
          <select
            className="input"
            value={form.estado ?? "P"}
            onChange={(e) => setForm({ ...form, estado: e.target.value })}
          >
            <option value="P">Programado (P)</option>
            <option value="R">Realizado (R)</option>
            <option value="C">Cancelado (C)</option>
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
