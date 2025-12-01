"use client";

import {
  useEffect,
  useMemo,
  useState,
  FormEvent,
  ChangeEvent,
} from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import NavbarInvitado from "@/app/components/NavbarInvitado";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  Filter,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type ApiListResponse<T> = {
  ok: boolean;
  data: T[];
  mensaje?: string;
};

type ObraRawFromView = {
  idObra_Arte: number;
  titulo: string;
  descripcion?: string | null;
  // en SQL viene como "año_creacion"
  ["año_creacion"]?: number | null;
  anio_creacion?: number | null; // por si luego se renombra
  dimensiones?: string | null;
  urls?: string | null;
  nombre_artista?: string | null;
  biografia?: string | null;
  condicion_vital?: string | null;

  tipo_coleccion?: string | null;
  descripcion_coleccion?: string | null;

  idExposicion?: number | null;
  nombre_exposicion?: string | null;
  tipo_exposicion?: string | null;
  sala_exposicion?: string | null;
  edificio?: string | null;
  sucursal?: string | null;
  fecha_hora_inicio?: string | null;
  fecha_hora_fin?: string | null;
  estado_exhibicion?: string | null;
  tipo_exposicion_actual?: string | null;
};

type Obra = {
  idObra_Arte: number;
  titulo: string;
  descripcion?: string | null;
  anio_creacion?: number | null;
  dimensiones?: string | null;
  urls?: string | null;
  nombre_artista?: string | null;
  tipo_coleccion?: string | null;
  descripcion_coleccion?: string | null;
  estado_exhibicion?: string | null;
  nombre_exposicion?: string | null;
};

function getFirstImage(urls: string | null | undefined): string | null {
  if (!urls) return null;
  const parts = urls
    .split(/[;,|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts[0] || null;
}

function ObrasPageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [coleccionSeleccionada, setColeccionSeleccionada] = useState(
    "Todas las colecciones"
  );
  const [estadoSeleccionado, setEstadoSeleccionado] =
    useState("todas"); // todas | en_exhibicion | pasada | sin_expo
  const [anioMin, setAnioMin] = useState<string>("");
  const [anioMax, setAnioMax] = useState<string>("");

  // orden
  const [orden, setOrden] = useState<
    "relevancia" | "recientes" | "antiguas" | "titulo"
  >("relevancia");

  // ================== CARGA DE DATOS ==================
  useEffect(() => {
    const fetchObras = async () => {
      try {
        const resp = await axios.get<ApiListResponse<ObraRawFromView>>(
          `${API_BASE}/api/vistas/obras-arte`
        );
        const raw = resp.data?.data ?? [];

        const normalizadas: Obra[] = raw.map((item) => ({
          idObra_Arte: item.idObra_Arte,
          titulo: item.titulo,
          descripcion: item.descripcion ?? null,
          anio_creacion:
            item.anio_creacion ??
            item["año_creacion"] ??
            null,
          dimensiones: item.dimensiones ?? null,
          urls: item.urls ?? null,
          nombre_artista: item.nombre_artista ?? null,
          tipo_coleccion: item.tipo_coleccion ?? null,
          descripcion_coleccion: item.descripcion_coleccion ?? null,
          estado_exhibicion: item.estado_exhibicion ?? null,
          nombre_exposicion: item.nombre_exposicion ?? null,
        }));

        setObras(normalizadas);

        // si viene ?search= en la URL, lo usamos
        const q = searchParams.get("search");
        if (q) setSearchQuery(q);

        // rango sugerido de años (no obligatorio)
        const years = normalizadas
          .map((o) => o.anio_creacion)
          .filter((y): y is number => typeof y === "number");
        if (years.length) {
          const min = Math.min(...years);
          const max = Math.max(...years);
          // sólo los seteamos si el usuario no escribió nada
          setAnioMin((prev) => (prev ? prev : String(min)));
          setAnioMax((prev) => (prev ? prev : String(max)));
        }
      } catch (error) {
        console.error("Error cargando obras", error);
        setObras([]);
      } finally {
        setLoading(false);
      }
    };

    fetchObras();
  }, [searchParams]);

  // ================== OPCIONES DE COLECCIÓN ==================
  const coleccionesDisponibles = useMemo(() => {
    const s = new Set<string>();
    obras.forEach((o) => {
      const label =
        (o.tipo_coleccion || o.descripcion_coleccion || "").trim();
      if (label) s.add(label);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [obras]);

  // ================== APLICAR FILTROS ==================
  const obrasFiltradasOrdenadas = useMemo(() => {
    let resultado = [...obras];

    // texto libre
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      resultado = resultado.filter((o) => {
        const campos = [
          o.titulo,
          o.descripcion,
          o.nombre_artista,
          o.nombre_exposicion,
          o.tipo_coleccion,
          o.descripcion_coleccion,
        ]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase());
        return campos.some((c) => c.includes(q));
      });
    }

    // colección
    if (
      coleccionSeleccionada &&
      coleccionSeleccionada !== "Todas las colecciones"
    ) {
      resultado = resultado.filter((o) => {
        const label =
          (o.tipo_coleccion || o.descripcion_coleccion || "").trim();
        return label === coleccionSeleccionada;
      });
    }

    // estado de exhibición
    if (estadoSeleccionado !== "todas") {
      resultado = resultado.filter((o) => {
        const estado = (o.estado_exhibicion || "").toUpperCase();
        if (estadoSeleccionado === "en_exhibicion") {
          return estado === "EN_EXHIBICION";
        }
        if (estadoSeleccionado === "pasada") {
          return estado === "ALMACENADA";
        }
        if (estadoSeleccionado === "sin_expo") {
          return !estado;
        }
        return true;
      });
    }

    // rango de años
    const minYear = parseInt(anioMin, 10);
    const maxYear = parseInt(anioMax, 10);

    if (!Number.isNaN(minYear)) {
      resultado = resultado.filter((o) => {
        if (o.anio_creacion == null) return true;
        return o.anio_creacion >= minYear;
      });
    }

    if (!Number.isNaN(maxYear)) {
      resultado = resultado.filter((o) => {
        if (o.anio_creacion == null) return true;
        return o.anio_creacion <= maxYear;
      });
    }

    // orden
    resultado.sort((a, b) => {
  if (orden === "titulo") {
    return a.titulo.localeCompare(b.titulo);
  }

  const ya = a.anio_creacion ?? 0;
  const yb = b.anio_creacion ?? 0;

  if (orden === "recientes") {
    return yb - ya; // año más grande primero
  }

  if (orden === "antiguas") {
    return ya - yb; // año más pequeño primero
  }

  // ===== ORDEN POR RELEVANCIA =====
  const q = searchQuery.trim().toLowerCase();

  const score = (o: Obra): number => {
    let s = 0;

    // 1. Estado de exhibición
    if (o.estado_exhibicion === "EN_EXHIBICION") s += 100;

    // 2. Coincidencia con la búsqueda de texto
    if (q) {
      const titulo = o.titulo.toLowerCase();
      const desc = (o.descripcion || "").toLowerCase();
      const artista = (o.nombre_artista || "").toLowerCase();
      const coleccion = (
        o.tipo_coleccion ||
        o.descripcion_coleccion ||
        ""
      ).toLowerCase();

      if (titulo.includes(q)) s += 40;
      if (artista.includes(q)) s += 25;
      if (coleccion.includes(q)) s += 15;
      if (desc.includes(q)) s += 10;
    }

    // 3. Si está asociada a una exposición
    if (o.nombre_exposicion) s += 10;

    // 4. Año como pequeño factor de desempate
    if (o.anio_creacion) s += o.anio_creacion / 1000;

    return s;
  };

  const sa = score(a);
  const sb = score(b);

  // primero mayor relevancia; si empatan, dejamos más recientes primero
  if (sb !== sa) {
    return sb - sa;
  }
  return (b.anio_creacion ?? 0) - (a.anio_creacion ?? 0);
});


    return resultado;
  }, [
    obras,
    searchQuery,
    coleccionSeleccionada,
    estadoSeleccionado,
    anioMin,
    anioMax,
    orden,
  ]);

  // ================== HANDLERS ==================
  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
  }

  function handleAnioChange(
    setter: (v: string) => void
  ): (e: ChangeEvent<HTMLInputElement>) => void {
    return (e) => {
      const value = e.target.value.replace(/[^\d]/g, "");
      setter(value);
    };
  }

  function limpiarFiltros() {
    setSearchQuery("");
    setColeccionSeleccionada("Todas las colecciones");
    setEstadoSeleccionado("todas");
    setAnioMin("");
    setAnioMax("");
    setOrden("relevancia");
  }

  // ================== RENDER ==================
  return (
      <div className="min-h-screen bg-white">
      <NavbarInvitado />

      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* HEADER */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🎨</span>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0F172A]">
              Colección de obras
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl">
            Explora las obras del Museo Veneris, filtra por colección,
            estado o año, y encuentra piezas de tus artistas favoritos.
          </p>
        </section>

        {/* BUSCADOR + FILTROS */}
        <section className="mb-6">
          <div className="flex flex-col gap-4">
            {/* Buscador principal */}
            <form onSubmit={handleSearchSubmit}>
              <div className="flex items-center gap-2 bg-[#F3F7FF] border border-[#D0E2FF] rounded-full px-4 py-2 shadow-sm">
                <Search className="w-5 h-5 text-[#4B6DD8]" />
                <input
                  type="text"
                  placeholder="Buscar por título, artista o descripción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm md:text-base text-[#0F172A]"
                />
              </div>
            </form>

            {/* Panel filtros */}
            <div className="bg-[#F8FAFF] border border-[#E2ECFF] rounded-3xl p-4 md:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#4B6DD8]" />
                  <span className="font-semibold text-[#0F172A] text-sm md:text-base">
                    Filtros para refinar tu búsqueda
                  </span>
                </div>
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="inline-flex items-center gap-1 text-xs md:text-sm px-3 py-1 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#EFF6FF] text-[#1D4ED8]"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  Limpiar filtros
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Colección */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">
                    Colección
                  </label>
                  <select
                    value={coleccionSeleccionada}
                    onChange={(e) =>
                      setColeccionSeleccionada(e.target.value)
                    }
                    className="w-full text-sm rounded-full border border-[#E5E7EB] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4B6DD8]/40"
                  >
                    <option>Todas las colecciones</option>
                    {coleccionesDisponibles.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Estado */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">
                    Estado de exhibición
                  </label>
                  <select
                    value={estadoSeleccionado}
                    onChange={(e) =>
                      setEstadoSeleccionado(e.target.value)
                    }
                    className="w-full text-sm rounded-full border border-[#E5E7EB] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4B6DD8]/40"
                  >
                    <option value="todas">Todas</option>
                    <option value="en_exhibicion">En exhibición</option>
                    <option value="pasada">Exposición pasada</option>
                    <option value="sin_expo">Sin exposición</option>
                  </select>
                </div>

                {/* Año mínimo */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">
                    Año mínimo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 1900"
                    value={anioMin}
                    onChange={handleAnioChange(setAnioMin)}
                    className="w-full text-sm rounded-full border border-[#E5E7EB] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4B6DD8]/40"
                  />
                </div>

                {/* Año máximo */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">
                    Año máximo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 2024"
                    value={anioMax}
                    onChange={handleAnioChange(setAnioMax)}
                    className="w-full text-sm rounded-full border border-[#E5E7EB] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4B6DD8]/40"
                  />
                </div>
              </div>

              {/* Orden */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs md:text-sm">
                <span className="text-gray-500 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-[#FACC15]" />
                  Ordenar resultados
                </span>
                <button
                  type="button"
                  onClick={() => setOrden("relevancia")}
                  className={`px-3 py-1 rounded-full border text-xs md:text-sm ${
                    orden === "relevancia"
                      ? "bg-[#FACC15] border-[#FACC15] text-[#0F172A]"
                      : "bg-white border-[#E5E7EB] text-gray-700 hover:bg-[#EFF6FF]"
                  }`}
                >
                  Relevancia
                </button>
                <button
                  type="button"
                  onClick={() => setOrden("recientes")}
                  className={`px-3 py-1 rounded-full border text-xs md:text-sm ${
                    orden === "recientes"
                      ? "bg-[#DBEAFE] border-[#4B6DD8] text-[#1D4ED8]"
                      : "bg-white border-[#E5E7EB] text-gray-700 hover:bg-[#EFF6FF]"
                  }`}
                >
                  Más recientes
                </button>
                <button
                  type="button"
                  onClick={() => setOrden("antiguas")}
                  className={`px-3 py-1 rounded-full border text-xs md:text-sm ${
                    orden === "antiguas"
                      ? "bg-[#DBEAFE] border-[#4B6DD8] text-[#1D4ED8]"
                      : "bg-white border-[#E5E7EB] text-gray-700 hover:bg-[#EFF6FF]"
                  }`}
                >
                  Más antiguas
                </button>
                <button
                  type="button"
                  onClick={() => setOrden("titulo")}
                  className={`px-3 py-1 rounded-full border text-xs md:text-sm ${
                    orden === "titulo"
                      ? "bg-[#DBEAFE] border-[#4B6DD8] text-[#1D4ED8]"
                      : "bg-white border-[#E5E7EB] text-gray-700 hover:bg-[#EFF6FF]"
                  }`}
                >
                  Título A–Z
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CONTADOR */}
        <p className="text-xs md:text-sm text-gray-500 mb-4">
          Mostrando{" "}
          <span className="font-semibold text-[#111827]">
            {obrasFiltradasOrdenadas.length}
          </span>{" "}
          obras.
        </p>

        {/* LISTA DE OBRAS */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-[3/4] rounded-2xl mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : obrasFiltradasOrdenadas.length === 0 ? (
          <div className="py-16 text-center bg-[#F9FAFB] rounded-2xl border border-dashed border-[#E5E7EB]">
            <p className="text-gray-500">
              No encontramos obras con los filtros seleccionados. Prueba
              ajustando tu búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {obrasFiltradasOrdenadas.map((obra) => {
              const img = getFirstImage(obra.urls);
              const year = obra.anio_creacion ?? undefined;
              const coleccionLabel =
                obra.tipo_coleccion || obra.descripcion_coleccion || "";

              return (
                <Link
                  key={obra.idObra_Arte}
                  href={`/Invitado/obras/${obra.idObra_Arte}`}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition overflow-hidden border border-[#E5E7EB] flex flex-col"
                >
                  <div className="bg-slate-50 aspect-[3/4] overflow-hidden">
                    {img ? (
                      <img
                        src={img}
                        alt={obra.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F9F6F1] via-[#E5E7EB] to-[#DBEAFE]">
                        <span className="text-5xl text-[#CBA135] opacity-40">
                          🎨
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    <h3 className="text-lg font-semibold text-[#111827] group-hover:text-[#CBA135] transition-colors line-clamp-2">
                      {obra.titulo}
                    </h3>
                    {obra.nombre_artista && (
                      <p className="text-sm text-gray-600">
                        {obra.nombre_artista}
                      </p>
                    )}
                    {obra.descripcion && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {obra.descripcion}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      {year && (
                        <span className="px-3 py-1 rounded-full bg-[#F3F4F6] text-gray-600">
                          Año {year}
                        </span>
                      )}
                      {coleccionLabel && (
                        <span className="px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4338CA]">
                          {coleccionLabel}
                        </span>
                      )}
                      {obra.estado_exhibicion === "EN_EXHIBICION" && (
                        <span className="px-3 py-1 rounded-full bg-[#DCFCE7] text-[#15803D]">
                          En exhibición
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}


import { Suspense } from "react";

export default function ObrasPage() {
  return (
    <Suspense fallback={<p className="text-center py-10">Cargando obras...</p>}>
      <ObrasPageComponent />
    </Suspense>
  );
}
