"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import NavbarInvitado from "@/app/components/NavbarInvitado";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Filter,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type ApiListResponse<T> = {
  ok: boolean;
  data: T[];
  mensaje?: string;
};

type Exposicion = {
  idExposicion: number;
  Exposicion?: string | null;           // e.nombre
  descripcion?: string | null;
  DescripcionExposicion?: string | null;
  estado?: string | null;
  urls?: string | null;
  tipo?: string | null;

  Sala?: string | null;
  Edificio?: string | null;
  Sucursal?: string | null;

  // Nuevos campos de la vista
  FechaInicioExposicion?: string | null;
  FechaFinExposicion?: string | null;
  TotalObras?: number | null;
  ObrasAunExhibidas?: number | null;
  UltimaObraExhibida?: string | null;
  ListaObrasAunExhibidas?: string | null;
};


type Orden = "relevancia" | "recientes" | "antiguas" | "titulo";

// Helpers
function getFirstImage(urls: string | null | undefined): string | null {
  if (!urls) return null;
  const parts = urls
    .split(/[;,|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts[0] || null;
}


function parseFecha(valor?: string | null): Date | null {
  if (!valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getTipoLabel(tipo?: string | null): string {
  const t = (tipo ?? "").toUpperCase().trim();
  if (t === "P") return "Presencial";
  if (t === "V") return "Virtual";
  // Por si luego tienes otros tipos (T = temporal, PERM, etc.)
  if (!t) return "Sin tipo";
  return tipo ?? "Otro";
}

function getRangoFechas(expo: Exposicion): { inicio: Date | null; fin: Date | null } {
  const inicio = parseFecha(expo.FechaInicioExposicion ?? null);
  const fin = parseFecha(expo.FechaFinExposicion ?? null);
  return { inicio, fin };
}

function obtenerAnioExpo(expo: Exposicion): number | null {
  const { inicio } = getRangoFechas(expo);
  if (!inicio) return null;
  return inicio.getFullYear();
}

function calcularEstado(expo: Exposicion): "activa" | "finalizada" | "proxima" | "otro" {
  const ahora = new Date();
  const { inicio, fin } = getRangoFechas(expo);

  // 1) Si tenemos rango real desde Obra_Exposicion
  if (inicio && inicio > ahora) return "proxima";
  if (fin && fin < ahora) return "finalizada";
  if (inicio && inicio <= ahora && (!fin || fin >= ahora)) return "activa";

  // 2) Respaldo usando texto de estado si no hay fechas
  const raw = (expo.estado || "").toLowerCase().trim();
  if (raw.startsWith("a")) return "activa";

  return "otro";
}



function normalizarEstado(raw?: string | null): "activa" | "finalizada" | "proxima" | "otro" {
  if (!raw) return "otro";
  const e = raw.toLowerCase().trim();

  if (e.startsWith("a")) return "activa"; // Activa / Active / etc.
  if (e.includes("final") || e.includes("cerr")) return "finalizada";
  if (e.includes("próx") || e.includes("prox") || e.includes("futuro")) return "proxima";

  return "otro";
}

function obtenerAnio(fecha?: string | null): number | null {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;
  return d.getFullYear();
}

export default function ExposicionesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [exposiciones, setExposiciones] = useState<Exposicion[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros / UI
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("search") ?? ""
  );
  const [estadoFiltro, setEstadoFiltro] = useState<"todas" | "activa" | "finalizada" | "proxima">(
    "todas"
  );
  const [tipoFiltro, setTipoFiltro] = useState<string>("todas");
  const [anioMin, setAnioMin] = useState<string>("");
  const [anioMax, setAnioMax] = useState<string>("");
  const [orden, setOrden] = useState<Orden>("relevancia");
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(true);

  useEffect(() => {
    const fetchExpos = async () => {
      try {
        const resp = await axios.get<ApiListResponse<Exposicion>>(
          `${API_BASE}/api/vistas/exposiciones-detalles`
        );
        setExposiciones(resp.data?.data ?? []);
      } catch (error) {
        console.error("Error cargando exposiciones", error);
        setExposiciones([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExpos();
  }, []);

  // Tipos dinámicos para el select "Tipo de exposición"
  const tiposDisponibles = useMemo(() => {
    const setTipos = new Set<string>();
    exposiciones.forEach((e) => {
      const t = (e.tipo ?? "").trim();
      if (t) setTipos.add(t);
    });
    return Array.from(setTipos).sort((a, b) => a.localeCompare(b));
  }, [exposiciones]);

  // Aplicar filtros, búsqueda y orden
  const exposFiltradas = useMemo(() => {
  let resultado = [...exposiciones];

  const q = searchQuery.trim().toLowerCase();
  const minYear = anioMin ? Number(anioMin) : null;
  const maxYear = anioMax ? Number(anioMax) : null;

  resultado = resultado.filter((expo) => {
    const nombre = (expo.Exposicion ?? "").toLowerCase();
    const desc = (expo.descripcion ?? expo.DescripcionExposicion ?? "").toLowerCase();
    const sala = (expo.Sala ?? "").toLowerCase();
    const edificio = (expo.Edificio ?? "").toLowerCase();
    const sucursal = (expo.Sucursal ?? "").toLowerCase();
    const tipo = (expo.tipo ?? "").toLowerCase();

    // 1. Filtro de texto
    const coincideTexto =
      !q ||
      nombre.includes(q) ||
      desc.includes(q) ||
      sala.includes(q) ||
      edificio.includes(q) ||
      sucursal.includes(q) ||
      tipo.includes(q);

    if (!coincideTexto) return false;

    // 2. Filtro por estado (usando fechas reales)
    const estLogico = calcularEstado(expo);
    if (estadoFiltro !== "todas" && estLogico !== estadoFiltro) return false;

    // 3. Filtro por tipo
    if (tipoFiltro !== "todas" && tipo !== tipoFiltro.toLowerCase()) return false;

    // 4. Filtro por año (usamos FechaInicioExposicion)
    const anio = obtenerAnioExpo(expo);
    if (minYear && anio && anio < minYear) return false;
    if (maxYear && anio && anio > maxYear) return false;

    return true;
  });


    // Orden
   resultado.sort((a, b) => {
  const ya = obtenerAnioExpo(a) ?? 0;
  const yb = obtenerAnioExpo(b) ?? 0;

  if (orden === "titulo") {
    const na = (a.Exposicion ?? "").toLowerCase();
    const nb = (b.Exposicion ?? "").toLowerCase();
    return na.localeCompare(nb);
  }

  if (orden === "recientes") {
    return yb - ya; // más nueva primero
  }

  if (orden === "antiguas") {
    return ya - yb; // más vieja primero
  }

  // === RELEVANCIA (puedes dejar la que ya tenías, adaptada a obtenerAnioExpo) ===
  const ahora = new Date();

  const score = (e: Exposicion): number => {
    let s = 0;
    const estLogico = calcularEstado(e);
    const anio = obtenerAnioExpo(e);

    if (estLogico === "activa") s += 100;
    if (estLogico === "proxima") s += 70;

    if (q) {
      const nombre = (e.Exposicion ?? "").toLowerCase();
      const desc = (e.descripcion ?? e.DescripcionExposicion ?? "").toLowerCase();
      const tipo = (e.tipo ?? "").toLowerCase();
      const sala = (e.Sala ?? "").toLowerCase();
      const edificio = (e.Edificio ?? "").toLowerCase();
      const sucursal = (e.Sucursal ?? "").toLowerCase();

      if (nombre.includes(q)) s += 40;
      if (desc.includes(q)) s += 20;
      if (tipo.includes(q)) s += 15;
      if (sala.includes(q) || edificio.includes(q) || sucursal.includes(q)) s += 10;
    }

    const { inicio } = getRangoFechas(e);
    if (inicio) {
      const diffDias = Math.abs(
        (inicio.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)
      );
      s += Math.max(0, 50 - diffDias); // 0–50 según cercanía
    }

    if (anio) s += anio / 1000;

    return s;
  };

  const sa = score(a);
  const sb = score(b);
  if (sb !== sa) return sb - sa;
  return yb - ya;
});


    return resultado;
  }, [exposiciones, searchQuery, estadoFiltro, tipoFiltro, anioMin, anioMax, orden]);

  const totalExpos = exposiciones.length;
  const totalMostradas = exposFiltradas.length;

  // Handlers
  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
  }

  function limpiarFiltros() {
    setSearchQuery("");
    setEstadoFiltro("todas");
    setTipoFiltro("todas");
    setAnioMin("");
    setAnioMax("");
    setOrden("relevancia");
  }

  return (
      <div className="min-h-screen bg-white">
      <NavbarInvitado />
      <section className="pt-10 pb-6 px-4 border-b border-slate-100 bg-gradient-to-b from-[#F4F7FF] to-white">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🗓️</span>
              <h1 className="text-3xl md:text-4xl font-bold text-[#111827]">
                Exposiciones
              </h1>
            </div>
            <p className="text-slate-600 max-w-2xl">
              Explora las exposiciones del Museo Veneris, filtra por estado,
              tipo y fechas, y descubre qué puedes visitar hoy o planear para
              más adelante.
            </p>
            {totalExpos > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                Actualmente tenemos <span className="font-semibold">{totalExpos}</span>{" "}
                exposiciones registradas.
              </p>
            )}
          </div>

          {/* Buscador */}
          <form
            onSubmit={handleSearchSubmit}
            className="w-full md:w-[360px] mt-2 md:mt-0"
          >
            <div className="flex gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-[#4C7DFF]/60">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, descripción, sala..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-0 focus:outline-none text-sm text-slate-800"
              />
            </div>
          </form>
        </div>
      </section>

      {/* Filtros */}
      <section className="px-4 py-6 bg-[#F7FAFF] border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <SlidersHorizontal className="w-4 h-4 text-[#CBA135]" />
              <span>Filtros para refinar tu búsqueda</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={limpiarFiltros}
                className="inline-flex items-center gap-1 text-xs md:text-sm px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
              >
                <X className="w-3 h-3" />
                Limpiar filtros
              </button>

              <button
                type="button"
                onClick={() => setMostrarFiltrosAvanzados((v) => !v)}
                className="inline-flex items-center gap-1 text-xs md:text-sm px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
              >
                <Filter className="w-3 h-3" />
                {mostrarFiltrosAvanzados ? "Ocultar" : "Mostrar"} filtros
              </button>
            </div>
          </div>

          {mostrarFiltrosAvanzados && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              {/* Estado */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  Estado
                </label>
                <div className="relative">
                  <select
                    value={estadoFiltro}
                    onChange={(e) =>
                      setEstadoFiltro(e.target.value as typeof estadoFiltro)
                    }
                    className="w-full appearance-none rounded-full border border-slate-200 bg-white px-4 py-2 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C7DFF]/50"
                  >
                    <option value="todas">Todas las exposiciones</option>
                    <option value="activa">Activas</option>
                    <option value="proxima">Próximas</option>
                    <option value="finalizada">Finalizadas</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Tipo */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  Tipo de exposición
                </label>
                <div className="relative">
                  <select
                    value={tipoFiltro}
                    onChange={(e) => setTipoFiltro(e.target.value)}
                    className="w-full appearance-none rounded-full border border-slate-200 bg-white px-4 py-2 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C7DFF]/50"
                >
                <option value="todas">Todos los tipos</option>
                {tiposDisponibles.map((t) => (
                    <option key={t} value={t}>
                        {getTipoLabel(t)}
                    </option>
                 ))}
                </select>

                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Año mínimo */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  Año de inicio (mín.)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Ej. 2020"
                  value={anioMin}
                  onChange={(e) => setAnioMin(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C7DFF]/50"
                />
              </div>

              {/* Año máximo */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  Año de inicio (máx.)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Ej. 2025"
                  value={anioMax}
                  onChange={(e) => setAnioMax(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C7DFF]/50"
                />
              </div>
            </div>
          )}

          {/* Orden */}
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
            <span className="text-slate-500 flex items-center gap-1">
              <ChevronRight className="w-3 h-3" />
              Ordenar resultados
            </span>

            <button
              type="button"
              onClick={() => setOrden("relevancia")}
              className={`px-3 py-1.5 rounded-full border text-xs md:text-sm ${
                orden === "relevancia"
                  ? "bg-[#CBA135] text-white border-[#CBA135]"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Relevancia
            </button>
            <button
              type="button"
              onClick={() => setOrden("recientes")}
              className={`px-3 py-1.5 rounded-full border text-xs md:text-sm ${
                orden === "recientes"
                  ? "bg-[#4C7DFF] text-white border-[#4C7DFF]"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Más recientes
            </button>
            <button
              type="button"
              onClick={() => setOrden("antiguas")}
              className={`px-3 py-1.5 rounded-full border text-xs md:text-sm ${
                orden === "antiguas"
                  ? "bg-[#E5EDFF] text-[#1D4ED8] border-[#C7D2FE]"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Más antiguas
            </button>
            <button
              type="button"
              onClick={() => setOrden("titulo")}
              className={`px-3 py-1.5 rounded-full border text-xs md:text-sm ${
                orden === "titulo"
                  ? "bg-[#F3F4FF] text-[#4338CA] border-[#C7D2FE]"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Título A–Z
            </button>
          </div>
        </div>
      </section>

      {/* Resultados */}
      <section className="px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4 text-xs md:text-sm text-slate-500">
            <p>
              Mostrando{" "}
              <span className="font-semibold text-slate-700">
                {totalMostradas}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-slate-700">
                {totalExpos}
              </span>{" "}
              exposiciones.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-slate-200 aspect-[4/3] rounded-t-2xl" />
                  <div className="bg-slate-100 p-4 rounded-b-2xl space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : totalMostradas === 0 ? (
            <div className="text-center py-16 bg-[#F9FAFB] rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-600 mb-2">
                No encontramos exposiciones que coincidan con tu búsqueda.
              </p>
              <p className="text-slate-400 text-sm">
                Prueba ajustando los filtros o usa términos más generales.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exposFiltradas.map((expo) => {
                const img = getFirstImage(expo.urls);
                const nombre = expo.nombre ?? expo.Exposicion ?? "Exposición";
                const descripcion =
                  expo.descripcion ??
                  expo.DescripcionExposicion ??
                  "Sin descripción disponible";
                const sala = expo.sala ?? expo.Sala;
                const edificio = expo.edificio ?? expo.Edificio;
                const sucursal = expo.sucursal ?? expo.Sucursal;
                const fi = expo.fecha_inicio
                  ? new Date(expo.fecha_inicio).toLocaleDateString()
                  : null;
                const ff = expo.fecha_fin
                  ? new Date(expo.fecha_fin).toLocaleDateString()
                  : null;
                const estNorm = normalizarEstado(expo.estado);

                let badgeColor =
                  "bg-slate-100 text-slate-600 border-slate-200";
                let badgeLabel = expo.estado || "Sin información";

                if (estNorm === "activa") {
                  badgeColor =
                    "bg-emerald-50 text-emerald-700 border-emerald-200";
                  badgeLabel = "Activa";
                } else if (estNorm === "proxima") {
                  badgeColor = "bg-sky-50 text-sky-700 border-sky-200";
                  badgeLabel = "Próxima";
                } else if (estNorm === "finalizada") {
                  badgeColor = "bg-slate-100 text-slate-600 border-slate-200";
                  badgeLabel = "Finalizada";
                }

                return (
                  <Link
                    key={expo.idExposicion}
                    href={`/Invitado/exposiciones/${expo.idExposicion}`}
                    className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 overflow-hidden flex flex-col transition-all duration-200"
                  >
                    <div className="bg-slate-100 aspect-[4/3] overflow-hidden">
                      {img ? (
                        <img
                          src={img}
                          alt={nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F4F7FF] via-[#E5EDFF] to-[#FDF7E3]">
                          <span className="text-6xl opacity-40">🖼️</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold text-[#111827] group-hover:text-[#CBA135] transition-colors leading-snug">
                          {nombre}
                        </h3>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold border ${badgeColor}`}
                        >
                          {badgeLabel}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 line-clamp-2">
                        {descripcion}
                      </p>

                      <div className="flex flex-wrap gap-2 text-xs mt-1">
                        {(fi || ff) && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-50 text-slate-600">
                            <Calendar className="w-3 h-3" />
                            {fi}
                            {ff && ` – ${ff}`}
                          </span>
                        )}
                        {(sala || edificio || sucursal) && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E5EDFF] text-[#1D4ED8]">
                            <MapPin className="w-3 h-3" />
                            {sala && <span>{sala}</span>}
                            {edificio && (
                              <span>{sala ? " · " : ""}{edificio}</span>
                            )}
                            {sucursal && (
                              <span>
                                {sala || edificio ? " · " : ""}
                                {sucursal}
                              </span>
                            )}
                          </span>
                        )}
                        {expo.tipo && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FEF3C7] text-[#92400E] text-[11px] font-semibold">
                            {getTipoLabel(expo.tipo)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
