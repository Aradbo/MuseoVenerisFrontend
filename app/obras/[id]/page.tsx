"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Palette,
  Ruler,
  User,
  MapPin,
  Clock,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type ApiListResponse<T> = {
  ok: boolean;
  data: T[];
  mensaje?: string;
};

// Coincide con la vista VW_Obras_Arte
type ObraDetalle = {
  idObra_Arte: number;
  titulo: string;
  descripcion: string | null;
  // Año desde la vista (INT)
  año_creacion?: number | null;
  // Por si en algún SP viejo usabas anio_creacion
  anio_creacion?: string | null;

  dimensiones?: string | null;
  urls?: string | null;

  // Artista
  nombre_artista?: string | null;
  biografia?: string | null;
  fecha_difuncion?: string | null;
  condicion_vital?: string | null;

  // Colección
  tipo_coleccion?: string | null;
  descripcion_coleccion?: string | null;

  // Exposición más reciente / actual
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

function getFirstImage(urls: string | null | undefined): string | null {
  if (!urls) return null;
  const parts = urls
    .split(/[;,|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts[0] || null;
}

function formatDateTime(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;

  return d.toLocaleString("es-HN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapEstadoObra(code?: string | null): string {
  if (!code) return "Sin información";
  switch (code.toUpperCase()) {
    case "EN_EXHIBICION":
      return "En exhibición";
    case "ALMACENADA":
      return "En almacén";
    default:
      return code;
  }
}

function mapCondicionVital(code?: string | null): string | null {
  if (!code) return null;
  switch (code.toUpperCase()) {
    case "VIVO":
      return "Artista vivo";
    case "FALLECIDO":
      return "Artista fallecido";
    default:
      return code;
  }
}

function mapTipoExposicionActual(code?: string | null): string | null {
  if (!code) return null;
  switch (code.toUpperCase()) {
    case "EXPOSICION_ACTUAL":
      return "Exposición actual de la obra";
    case "EXPOSICION_PASADA":
      return "Exposición pasada de la obra";
    case "SIN_EXPOSICION":
      return "Actualmente sin exposición asociada";
    default:
      return code;
  }
}

function ObraDetallePagesContent() {

  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [obra, setObra] = useState<ObraDetalle | null>(null);
  const [todasLasObras, setTodasLasObras] = useState<ObraDetalle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || Number.isNaN(id)) return;

    const fetchObra = async () => {
      try {
        // Consumimos la vista VW_Obras_Arte
        const resp = await axios.get<ApiListResponse<ObraDetalle>>(
          `${API_BASE}/api/vistas/obras-arte`
        );
        const all = resp.data?.data ?? [];
        setTodasLasObras(all);

        const found = all.find((o) => o.idObra_Arte === id) || null;
        setObra(found);
      } catch (error) {
        console.error("Error cargando obra desde VW_Obras_Arte", error);
        setObra(null);
        setTodasLasObras([]);
      } finally {
        setLoading(false);
      }
    };

    fetchObra();
  }, [id]);

  // Otras obras de la misma colección
  const otrasMismaColeccion = useMemo(() => {
    if (!obra?.tipo_coleccion || !todasLasObras.length) return [];
    return todasLasObras
      .filter(
        (o) =>
          o.idObra_Arte !== obra.idObra_Arte &&
          o.tipo_coleccion === obra.tipo_coleccion
      )
      .slice(0, 4);
  }, [obra, todasLasObras]);

  // Más obras del mismo artista
  const otrasMismoArtista = useMemo(() => {
    if (!obra?.nombre_artista || !todasLasObras.length) return [];
    return todasLasObras
      .filter(
        (o) =>
          o.idObra_Arte !== obra.idObra_Arte &&
          o.nombre_artista === obra.nombre_artista
      )
      .slice(0, 4);
  }, [obra, todasLasObras]);

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4 bg-gradient-to-b from-[#EFF6FF] to-[#DBEAFE]">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-32 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-slate-200 aspect-square rounded-2xl" />
              <div className="space-y-4">
                <div className="h-12 bg-slate-200 rounded w-3/4" />
                <div className="h-6 bg-slate-200 rounded w-1/2" />
                <div className="h-32 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="min-h-screen py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-[#0F172A] mb-4">
            Obra no encontrada
          </h1>
          <button
            onClick={() => router.push("/obras")}
            className="inline-flex items-center px-4 py-2 rounded-full bg-[#CBA135] text-white text-sm hover:bg-[#B8942F]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  const img = getFirstImage(obra.urls);
  const year =
    typeof obra.año_creacion === "number"
      ? obra.año_creacion
      : obra.anio_creacion
      ? new Date(obra.anio_creacion).getFullYear()
      : undefined;

  const estadoObra = mapEstadoObra(obra.estado_exhibicion);
  const condicionVital = mapCondicionVital(obra.condicion_vital);
  const tipoExpoActualLabel = mapTipoExposicionActual(
    obra.tipo_exposicion_actual
  );

  const fechaInicioStr = formatDateTime(obra.fecha_hora_inicio);
  const fechaFinStr = formatDateTime(obra.fecha_hora_fin);

  const hayExpo =
    obra.nombre_exposicion ||
    obra.sala_exposicion ||
    obra.edificio ||
    obra.sucursal ||
    fechaInicioStr ||
    fechaFinStr;

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-b from-[#F9FAFB] via-[#EFF6FF] to-white">
      <div className="max-w-6xl mx-auto">
        {/* Botón volver */}
        <button
          onClick={() => router.push("/obras")}
          className="mb-8 inline-flex items-center text-[#0F172A] hover:text-black text-sm bg-white border border-slate-200 rounded-full px-4 py-1.5 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al catálogo
        </button>

        {/* Bloque principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Imagen */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-3xl shadow-[0_20px_40px_rgba(15,23,42,0.25)] bg-slate-100 border border-slate-200">
              {img ? (
                <img
                  src={img}
                  alt={obra.titulo}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#DBEAFE] via-[#E0F2FE] to-[#F9FAFB]">
                  <span className="text-8xl text-[#1D4ED8] opacity-30">
                    🎨
                  </span>
                </div>
              )}

              {/* Badges sobre la imagen */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {obra.tipo_coleccion && (
                  <span className="px-3 py-1 rounded-full bg-white/80 border border-[#CBA135]/60 text-[11px] uppercase tracking-wide text-[#0F172A] font-semibold">
                    {obra.tipo_coleccion}
                  </span>
                )}
                {obra.estado_exhibicion && (
                  <span className="px-3 py-1 rounded-full bg-[#DBEAFE] border border-[#1D4ED8]/30 text-[11px] text-[#1D4ED8] font-medium">
                    {estadoObra}
                  </span>
                )}
              </div>
            </div>

            {/* Info breve de colección */}
            {obra.descripcion_coleccion && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 shadow-sm">
                <p className="font-semibold text-[#0F172A] mb-1">
                  Sobre la colección
                </p>
                <p className="leading-relaxed">
                  {obra.descripcion_coleccion}
                </p>
              </div>
            )}
          </div>

          {/* Información */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-[#0F172A] mb-3 leading-tight">
                {obra.titulo}
              </h1>
              {obra.nombre_artista && (
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                  <span className="inline-flex items-center gap-2">
                    <User className="w-4 h-4 text-[#CBA135]" />
                    <span className="font-semibold">
                      {obra.nombre_artista}
                    </span>
                  </span>
                  {condicionVital && (
                    <span className="px-3 py-1 rounded-full bg-[#EFF6FF] border border-slate-200 text-xs text-slate-700">
                      {condicionVital}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Ficha técnica */}
            <div className="bg-white rounded-2xl p-6 space-y-4 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#CBA135]" />
                Ficha técnica
              </h2>

              {year && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#1D4ED8] shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Año de creación</p>
                    <p className="text-lg font-semibold text-[#0F172A]">
                      {year}
                    </p>
                  </div>
                </div>
              )}

              {obra.dimensiones && (
                <div className="flex items-center gap-3">
                  <Ruler className="w-5 h-5 text-[#1D4ED8] shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Dimensiones</p>
                    <p className="text-lg font-semibold text-[#0F172A]">
                      {obra.dimensiones}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-1">
                  Estado de la obra
                </p>
                <span className="inline-flex mt-1 items-center px-4 py-1.5 rounded-full border border-slate-200 bg-[#F9FAFB] text-xs font-semibold text-slate-800">
                  {estadoObra}
                </span>
              </div>
            </div>

            {/* Biografía breve del artista */}
            {obra.biografia && (
              <div className="bg-[#EFF6FF] rounded-2xl p-5 border border-[#DBEAFE]">
                <h2 className="text-lg font-semibold text-[#0F172A] mb-2">
                  Sobre el artista
                </h2>
                <p className="text-sm text-slate-700 leading-relaxed line-clamp-4">
                  {obra.biografia}
                </p>
              </div>
            )}

            {/* Información de exposición actual/pasada */}
            {hayExpo && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h2 className="text-lg font-semibold text-[#0F172A] mb-4">
                  Relación con exposiciones
                </h2>

                {obra.nombre_exposicion ? (
                  <div className="space-y-3 text-sm text-slate-700">
                    <p className="text-base font-semibold text-[#0F172A]">
                      {obra.nombre_exposicion}
                    </p>
                    {tipoExpoActualLabel && (
                      <p className="text-xs text-[#1D4ED8]">
                        {tipoExpoActualLabel}
                      </p>
                    )}

                    {(fechaInicioStr || fechaFinStr) && (
                      <div className="flex items-start gap-3">
                        <Clock className="w-4 h-4 text-[#CBA135] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">
                            Período de exhibición
                          </p>
                          <p>
                            {fechaInicioStr}
                            {fechaFinStr ? ` – ${fechaFinStr}` : ""}
                          </p>
                        </div>
                      </div>
                    )}

                    {(obra.sala_exposicion ||
                      obra.edificio ||
                      obra.sucursal) && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-[#1D4ED8] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">
                            Ubicación
                          </p>
                          <p className="font-medium text-[#0F172A]">
                            {obra.sala_exposicion && (
                              <span>{obra.sala_exposicion}</span>
                            )}
                            {obra.edificio && (
                              <span>
                                {obra.sala_exposicion ? " · " : ""}
                                {obra.edificio}
                              </span>
                            )}
                            {obra.sucursal && (
                              <span>
                                {obra.sala_exposicion || obra.edificio
                                  ? " · "
                                  : ""}
                                {obra.sucursal}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {obra.tipo_exposicion && (
                      <p className="text-xs text-slate-500">
                        Tipo de exposición:{" "}
                        <span className="font-semibold text-[#0F172A]">
                          {obra.tipo_exposicion}
                        </span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">
                    Esta obra no tiene una exposición asociada registrada
                    actualmente, pero forma parte del acervo del Museo Veneris.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Descripción de la obra */}
        {obra.descripcion && (
          <div className="max-w-4xl mb-10">
            <h2 className="text-2xl font-semibold text-[#0F172A] mb-3">
              Descripción de la obra
            </h2>
            <p className="text-slate-700 leading-relaxed">
              {obra.descripcion}
            </p>
          </div>
        )}

        {/* Otras obras de la misma colección */}
        {otrasMismaColeccion.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[#0F172A] mb-3">
              Otras obras de la misma colección
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {otrasMismaColeccion.map((o) => {
                const imgO = getFirstImage(o.urls);
                return (
                  <button
                    key={o.idObra_Arte}
                    onClick={() => router.push(`/obras/${o.idObra_Arte}`)}
                    className="text-left bg-white rounded-2xl border border-slate-200 hover:border-[#CBA135] hover:shadow-md transition overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[3/4] bg-slate-100 overflow-hidden">
                      {imgO ? (
                        <img
                          src={imgO}
                          alt={o.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#DBEAFE] to-[#E5E7EB]">
                          <span className="text-4xl text-[#1D4ED8] opacity-30">
                            🎨
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col gap-1">
                      <p className="text-sm font-semibold text-[#0F172A] line-clamp-2">
                        {o.titulo}
                      </p>
                      {o.nombre_artista && (
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {o.nombre_artista}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Más obras del mismo artista */}
        {otrasMismoArtista.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[#0F172A] mb-3">
              Más obras de {obra.nombre_artista}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {otrasMismoArtista.map((o) => {
                const imgO = getFirstImage(o.urls);
                return (
                  <button
                    key={o.idObra_Arte}
                    onClick={() => router.push(`/obras/${o.idObra_Arte}`)}
                    className="text-left bg-white rounded-2xl border border-slate-200 hover:border-[#CBA135] hover:shadow-md transition overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[3/4] bg-slate-100 overflow-hidden">
                      {imgO ? (
                        <img
                          src={imgO}
                          alt={o.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#DBEAFE] to-[#E5E7EB]">
                          <span className="text-4xl text-[#1D4ED8] opacity-30">
                            🎨
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col gap-1">
                      <p className="text-sm font-semibold text-[#0F172A] line-clamp-2">
                        {o.titulo}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

import { Suspense } from "react";

export default function ObraDetallePages() {
  return (
    <Suspense fallback={<p className="text-center py-20 text-sm">Cargando obra...</p>}>
      <ObraDetallePagesContent />
    </Suspense>
  );
}
