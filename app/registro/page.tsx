// app/registro/page.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

type OpcionLugar = {
  id: number;
  descripcion: string;
};

export default function RegistroVisitantePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const correoParam = searchParams.get("correo") || "";

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [usuario, setUsuario] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [genero, setGenero] = useState<"M" | "F" | "O" | "">("");
  const [correo] = useState(correoParam);

  // Lugar
  const [paises, setPaises] = useState<OpcionLugar[]>([]);
  const [provincias, setProvincias] = useState<OpcionLugar[]>([]);
  const [ciudades, setCiudades] = useState<OpcionLugar[]>([]);

  const [idPais, setIdPais] = useState<number | "">("");
  const [idProvincia, setIdProvincia] = useState<number | "">("");
  const [idCiudad, setIdCiudad] = useState<number | "">("");

  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Cargar países al montar
  // -----------------------------
  useEffect(() => {
    const cargarPaises = async () => {
      try {
        const resp = await axios.get<OpcionLugar[]>(
          "http://localhost:3000/api/lugares/paises"
        );

        // El backend devuelve { idPais, descripcion }
        const data = resp.data.map((p: any) => ({
          id: p.idPais,
          descripcion: p.descripcion,
        }));

        setPaises(data);

        // Opcional: dejar Honduras seleccionado automáticamente (idLugar = 9)
        const honduras = data.find((p) => p.descripcion === "Honduras" || p.id === 9);
        if (honduras) {
          setIdPais(honduras.id);
        }
      } catch (e) {
        console.error("Error cargando países", e);
      }
    };

    cargarPaises();
  }, []);

  // -----------------------------
  // Cuando cambia país -> cargar provincias
  // -----------------------------
  useEffect(() => {
    const cargarProvincias = async () => {
      if (!idPais) {
        setProvincias([]);
        setIdProvincia("");
        setCiudades([]);
        setIdCiudad("");
        return;
      }

      try {
        const resp = await axios.get<OpcionLugar[]>(
          `http://localhost:3000/api/lugares/provincias/${idPais}`
        );

        const data = resp.data.map((p: any) => ({
          id: p.idProvincia,
          descripcion: p.descripcion,
        }));

        setProvincias(data);
        setIdProvincia(""); // obligar a que el user escoja
        setCiudades([]);
        setIdCiudad("");
      } catch (e) {
        console.error("Error cargando provincias", e);
      }
    };

    cargarProvincias();
  }, [idPais]);

  // -----------------------------
  // Cuando cambia provincia -> cargar ciudades
  // -----------------------------
  useEffect(() => {
    const cargarCiudades = async () => {
      if (!idProvincia) {
        setCiudades([]);
        setIdCiudad("");
        return;
      }

      try {
        const resp = await axios.get<OpcionLugar[]>(
          `http://localhost:3000/api/lugares/ciudades/${idProvincia}`
        );

        const data = resp.data.map((c: any) => ({
          id: c.idCiudad,
          descripcion: c.descripcion,
        }));

        setCiudades(data);
        setIdCiudad("");
      } catch (e) {
        console.error("Error cargando ciudades", e);
      }
    };

    cargarCiudades();
  }, [idProvincia]);

  // -----------------------------
  // Utilidad: partir el nombre completo
  // -----------------------------
  function splitNombreCompleto(full: string) {
    const partes = full.trim().split(/\s+/);
    if (partes.length === 0) {
      return {
        primer_nombre: "",
        segundo_nombre: null as string | null,
        primer_apellido: "",
        segundo_apellido: null as string | null,
      };
    }

    const primer_nombre = partes[0] || "";
    let segundo_nombre: string | null = null;
    let primer_apellido = "";
    let segundo_apellido: string | null = null;

    if (partes.length === 2) {
      primer_apellido = partes[1];
    } else if (partes.length === 3) {
      segundo_nombre = partes[1];
      primer_apellido = partes[2];
    } else {
      // 4+ palabras: tomamos 2 nombres y 2 apellidos
      segundo_nombre = partes[1];
      primer_apellido = partes[partes.length - 2];
      segundo_apellido = partes[partes.length - 1];
    }

    return { primer_nombre, segundo_nombre, primer_apellido, segundo_apellido };
  }

  // -----------------------------
  // SUBMIT REGISTRO
  // -----------------------------
  async function handleRegistro(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOkMsg("");
    setLoading(true);

    try {
      const {
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
      } = splitNombreCompleto(nombreCompleto);

      if (!primer_nombre || !primer_apellido) {
        setError("Por favor escribe al menos nombre y primer apellido.");
        setLoading(false);
        return;
      }

      if (!genero) {
        setError("Selecciona el género.");
        setLoading(false);
        return;
      }

      if (!fechaNacimiento) {
        setError("Selecciona la fecha de nacimiento.");
        setLoading(false);
        return;
      }

      if (!idPais || !idProvincia || !idCiudad) {
        setError("Selecciona país, provincia y ciudad.");
        setLoading(false);
        return;
      }

      const payload = {
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        correo,
        fecha_nacimiento: fechaNacimiento,
        genero,
        usuario,
        contrasenia,
        telefono,
        idPais: Number(idPais),
        idProvincia: Number(idProvincia),
        idCiudad: Number(idCiudad),
        referencia: "Registro vía web (Museo Veneris)",
      };

      const resp = await axios.post(
        "http://localhost:3000/api/auth/registroVisitante",
        payload
      );

      const data = resp.data;

      if (!data.ok) {
        setError(data.mensaje || "No se pudo completar el registro.");
      } else {
        setOkMsg("Registro completado. Ahora puedes iniciar sesión.");
        // redirigir al login después de unos segundos
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch (err: any) {
      console.error("Error registro:", err);
      setError(
        err?.response?.data?.mensaje ||
          "Error inesperado al registrar visitante."
      );
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f0ff] to-[#ffffff]">
      <div className="w-full max-w-xl bg-white/80 rounded-3xl shadow-[0_18px_50px_rgba(15,23,42,0.22)] border border-white/60 backdrop-blur-2xl p-8 md:p-10">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-2">
          Registro de Visitante
        </h1>
        <p className="text-sm text-slate-500 text-center mb-6">
          Completa tus datos para disfrutar del Museo Veneris.
        </p>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {okMsg && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
            {okMsg}
          </div>
        )}

        <form onSubmit={handleRegistro} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre completo
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#e0b251] focus:border-[#e0b251] bg-white"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              placeholder="Ej. Arleth Adyani Chevez Bonilla"
              required
            />
          </div>

          {/* Teléfono y usuario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Teléfono
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#e0b251] focus:border-[#e0b251] bg-white"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Usuario
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#e0b251] focus:border-[#e0b251] bg-white"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Contraseña y fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#e0b251] focus:border-[#e0b251] bg-white"
                value={contrasenia}
                onChange={(e) => setContrasenia(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#e0b251] focus:border-[#e0b251] bg-white"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Género */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Género
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#e0b251] focus:border-[#e0b251] bg-white"
              value={genero}
              onChange={(e) => setGenero(e.target.value as any)}
              required
            >
              <option value="">Selecciona una opción</option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
              <option value="O">Otro / Prefiero no decirlo</option>
            </select>
          </div>

          {/* País / Provincia / Ciudad */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                País
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#e0b251] focus:border-[#e0b251] bg-white"
                value={idPais === "" ? "" : String(idPais)}
                onChange={(e) =>
                  setIdPais(e.target.value ? Number(e.target.value) : "")
                }
              >
                <option value="">Selecciona</option>
                {paises.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.descripcion}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Provincia
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#e0b251] focus:border-[#e0b251] bg-white"
                value={idProvincia === "" ? "" : String(idProvincia)}
                onChange={(e) =>
                  setIdProvincia(e.target.value ? Number(e.target.value) : "")
                }
                disabled={!idPais}
              >
                <option value="">Selecciona</option>
                {provincias.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.descripcion}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ciudad
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#e0b251] focus:border-[#e0b251] bg-white"
                value={idCiudad === "" ? "" : String(idCiudad)}
                onChange={(e) =>
                  setIdCiudad(e.target.value ? Number(e.target.value) : "")
                }
                disabled={!idProvincia}
              >
                <option value="">Selecciona</option>
                {ciudades.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.descripcion}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Correo (solo lectura) */}
          <div>
            <span className="block text-sm font-medium text-slate-700 mb-1">
              Correo
            </span>
            <div className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 text-slate-600">
              {correo || "Sin correo"}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Este es el correo que usaste con Google.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-[#f0b400] hover:bg-[#ffcc33] text-gray-900 font-semibold py-2.5 text-sm shadow-md shadow-yellow-500/30 disabled:opacity-70 disabled:cursor-not-allowed transition"
          >
            {loading ? "Registrando..." : "Registrarme"}
          </button>
        </form>
      </div>
    </div>
  );
}
