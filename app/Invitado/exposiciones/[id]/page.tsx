"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Clock } from "lucide-react";
import NavbarInvitado from "@/app/components/NavbarInvitado";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type ApiListResponse<T> = {
  ok: boolean;
  data: T[];
  mensaje?: string;
};

// Basado en vw_Exposiciones_Detalles (incluyendo totales)
type ExposicionDetalle = {
  idExposicion: number;
  Exposicion: string;
  tipo: string | null;
  DescripcionExposicion: string | null;
  estado: string | null;
  urls: string | null;

  Sala: string | null;
  capacidad: number | null;
  EstadoSala: string | null;

  Edificio: string | null;
  Sucursal: string | null;

  // Totales de la vista
  TotalObras: number | null;
  ObrasAunExhibidas: number | null;
  UltimaObraExhibida: string | null;
  ListaObrasAunExhibidas: string | null;

  // Si agregaste estas columnas en la vista, las dejamos opcionales:
  FechaInicioExposicion?: string | null;
  FechaFinExposicion?: string | null;
};

// Resultado del SP Obra_Exposicion por exposición
type ObraExpo = {
  IdObra: number;
  Titulo: string;
  Descripcion: string | null;
  AnioCreacion: string | null;
  Dimensiones: string | null;
  urls: string | null;
  fecha_hora_inicio?: string | null;
  fecha_hora_fin?: string | null;
};

function getFirstImage(urls: string | null | undefined): string | null {
  if (!urls) return null;
  const parts = urls
    .split(/[;,|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts[0] || null;
}

function formatDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString();
}

function formatDateTime(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return null;
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function ExposicionDetallePageContent() {

  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [expo, setExpo] = useState<ExposicionDetalle | null>(null);
  const [obrasExpo, setObrasExpo] = useState<ObraExpo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || Number.isNaN(id)) return;

    const fetchAll = async () => {
      try {
        const [expoResp, obrasResp] = await Promise.all([
          axios.get<ApiListResponse<ExposicionDetalle>>(
            `${API_BASE}/api/vistas/exposiciones-detalles`
          ),
          axios.get<ApiListResponse<ObraExpo>>(
            `${API_BASE}/api/obra-exposicion/exposicion/${id}`
          ),
        ]);

        const listExpo = expoResp.data?.data ?? [];
        const found = listExpo.find((e) => e.idExposicion === id) ?? null;
        setExpo(found);

        setObrasExpo(obrasResp.data?.data ?? []);
      } catch (error) {
        console.error("Error cargando exposición", error);
        setExpo(null);
        setObrasExpo([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  // Horario general calculado a partir de las obras
  const horarioGeneral = useMemo(() => {
    if (!obrasExpo.length) {
      return { inicio: null as string | null, fin: null as string | null };
    }

    const inicios: Date[] = [];
    const fines: Date[] = [];

    for (const o of obrasExpo) {
      if (o.fecha_hora_inicio) {
        const d = new Date(o.fecha_hora_inicio);
        if (!Number.isNaN(d.getTime())) inicios.push(d);
      }
      if (o.fecha_hora_fin) {
        const d = new Date(o.fecha_hora_fin);
        if (!Number.isNaN(d.getTime())) fines.push(d);
      }
    }

    if (!inicios.length && !fines.length) {
      return { inicio: null as string | null, fin: null as string | null };
    }

    const minInicio =
      inicios.length > 0
        ? new Date(Math.min(...inicios.map((d) => d.getTime())))
        : null;
    const maxFin =
      fines.length > 0
        ? new Date(Math.max(...fines.map((d) => d.getTime())))
        : null;

    return {
      inicio: minInicio ? formatDateTime(minInicio) : null,
      fin: maxFin ? formatDateTime(maxFin) : null,
    };
  }, [obrasExpo]);

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4 bg-gradient-to-b from-[#F1F5F9] to-[#DBEAFE]">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-32 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-slate-200 aspect-[4/3] rounded-2xl" />
              <div className="space-y-4">
                <div className="h-10 bg-slate-200 rounded w-3/4" />
                <div className="h-6 bg-slate-200 rounded w-1/2" />
                <div className="h-32 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!expo) {
    return (
      <div className="min-h-screen py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Exposición no encontrada
          </h1>
          <button
            onClick={() => router.push("/invitado/exposiciones")}
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#CBA135] text-white text-sm hover:bg-[#B8942F] transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a exposiciones
          </button>
        </div>
      </div>
    );
  }


  const esVirtual = (expo.tipo ?? "").toUpperCase().startsWith("V");

// Si la URL no parece imagen, la tratamos como posible tour
const rawUrl = expo.urls ?? null;
const isImageUrl =
  rawUrl &&
  /\.(jpg|jpeg|png|webp|gif)$/i.test(rawUrl.split("?")[0] || "");

const tourUrl = esVirtual && rawUrl && !isImageUrl ? rawUrl : null;


  const img = getFirstImage(expo.urls);
  const nombre = expo.Exposicion || "Exposición";
  const descripcion =
    expo.DescripcionExposicion || "Sin descripción disponible.";

  const sala = expo.Sala;
  const edificio = expo.Edificio;
  const sucursal = expo.Sucursal;

  const fechaInicioVista = expo.FechaInicioExposicion
    ? formatDateTime(expo.FechaInicioExposicion)
    : null;
  const fechaFinVista = expo.FechaFinExposicion
    ? formatDateTime(expo.FechaFinExposicion)
    : null;

  const estadoRaw = (expo.estado || "").toUpperCase();
  let estadoLabel = "Sin información";
  let estadoClass =
    "bg-slate-100 text-slate-700 border border-slate-200";

  if (estadoRaw.startsWith("A")) {
    estadoLabel = "Activa";
    estadoClass = "bg-emerald-50 text-emerald-700 border border-emerald-200";
  } else if (estadoRaw.startsWith("I")) {
    estadoLabel = "Inactiva";
    estadoClass = "bg-rose-50 text-rose-700 border border-rose-200";
  }

  return (
  <div className="min-h-screen bg-white">
    <NavbarInvitado />
    <div className="pt-20">
    <div className="min-h-screen py-10 px-4 bg-gradient-to-b from-[#F9FAFB] via-[#EFF6FF] to-[#FFFFFF]">
      <div className="max-w-6xl mx-auto">
        {/* Botón volver */}
        <button
          onClick={() => router.push("/Invitado/exposiciones")}
          className="mb-8 inline-flex items-center text-[#1E293B] hover:text-[#0F172A] text-sm bg-white/70 backdrop-blur border border-slate-200 rounded-full px-4 py-1.5 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a exposiciones
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Imagen */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl bg-slate-100 border border-slate-200">
              {img ? (
                <img
                  src={img}
                  alt={nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#DBEAFE] via-[#E0F2FE] to-[#F9FAFB]">
                  <span className="text-7xl text-[#1E3A8A] opacity-30">
                    🖼️
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
            </div>

            {/* Pills debajo de la imagen */}
            <div className="flex flex-wrap gap-2 text-xs">
              {expo.tipo && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#1D4ED8]/10 text-[#1D4ED8] font-semibold">
                  {expo.tipo === "P"
                    ? "Presencial"
                    : expo.tipo === "V"
                    ? "Virtual"
                    : expo.tipo}
                </span>
              )}
              {sala && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700">
                  Sala: <span className="ml-1 font-medium">{sala}</span>
                </span>
              )}
              {edificio && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700">
                  Edificio:{" "}
                  <span className="ml-1 font-medium">{edificio}</span>
                </span>
              )}
              {sucursal && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700">
                  Sede:{" "}
                  <span className="ml-1 font-medium">{sucursal}</span>
                </span>
              )}
            </div>
          </div>

          {/* Información */}
          <div className="space-y-6">
            {/* Encabezado */}
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-[#0F172A] leading-tight">
                {nombre}
              </h1>
              <div className="flex flex-wrap gap-3 items-center text-xs">
                <span
                  className={
                    estadoClass +
                    " px-3 py-1 rounded-full flex items-center gap-1"
                  }
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-current/60" />
                  {estadoLabel}
                </span>
                {expo.tipo && (
                  <span className="px-3 py-1 rounded-full border border-slate-200 bg-white text-slate-700">
                    Tipo:{" "}
                    <span className="font-semibold">
                      {expo.tipo === "P"
                        ? "Presencial"
                        : expo.tipo === "V"
                        ? "Virtual"
                        : expo.tipo}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Tarjeta de detalles (fechas, horario, ubicación) */}
            <div className="bg-white/90 rounded-2xl p-6 shadow-md border border-slate-100 space-y-5">
              <h2 className="text-base font-semibold text-[#0F172A] mb-1">
                Detalles de la exposición
              </h2>

              <div className="space-y-3">
                {/* Fechas generales de la vista o, si no existen, de horarioGeneral */}
                {(fechaInicioVista || fechaFinVista || horarioGeneral.inicio) && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Calendar className="w-5 h-5 text-[#1D4ED8]" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Fechas del evento</p>
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {fechaInicioVista ||
                          horarioGeneral.inicio ||
                          "Sin fecha de inicio"}
                        {fechaFinVista
                          ? ` – ${fechaFinVista}`
                          : horarioGeneral.fin
                          ? ` – ${horarioGeneral.fin}`
                          : ""}
                      </p>
                    </div>
                  </div>
                )}

                {/* Horario general calculado por las obras */}
                {(horarioGeneral.inicio || horarioGeneral.fin) && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Clock className="w-5 h-5 text-[#1D4ED8]" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">
                        Horario general de exhibición
                      </p>
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {horarioGeneral.inicio && (
                          <>
                            Desde{" "}
                            <span className="font-bold">
                              {horarioGeneral.inicio}
                            </span>
                          </>
                        )}
                        {horarioGeneral.fin ? (
                          <>
                            {" "}
                            hasta{" "}
                            <span className="font-bold">
                              {horarioGeneral.fin}
                            </span>
                          </>
                        ) : (
                          horarioGeneral.inicio && (
                            <span className="ml-1 text-emerald-600">
                              (actualmente en exhibición)
                            </span>
                          )
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Calculado a partir de las obras asignadas a esta
                        exposición.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Ubicación */}
              {(sala || edificio || sucursal) && (
                <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                  <div className="mt-0.5">
                    <MapPin className="w-5 h-5 text-[#1D4ED8]" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Ubicación</p>
                    <div className="text-sm text-[#0F172A] font-medium space-y-0.5">
                      {sala && <p>Sala {sala}</p>}
                      {edificio && <p>{edificio}</p>}
                      {sucursal && (
                        <p className="text-slate-600 text-xs">
                          Sede: {sucursal}
                        </p>
                      )}
                    </div>
                    {expo.capacidad && (
                      <p className="text-[11px] text-slate-500 mt-2">
                        Capacidad aproximada:{" "}
                        <span className="font-semibold text-slate-800">
                          {expo.capacidad} visitantes
                        </span>
                        .
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 🔹 RESUMEN DE OBRAS (TOTALES DE LA VISTA) */}
            {(expo.TotalObras ||
              expo.ObrasAunExhibidas ||
              expo.ListaObrasAunExhibidas) && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-3">
                <h2 className="text-lg font-semibold text-[#0F172A]">
                  Obras en esta exposición
                </h2>

                <div className="flex flex-wrap gap-6 text-sm text-slate-700">
                  {typeof expo.TotalObras === "number" && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Total programadas
                      </p>
                      <p className="font-semibold text-slate-900">
                        {expo.TotalObras}
                      </p>
                    </div>
                  )}
                  {typeof expo.ObrasAunExhibidas === "number" && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Actualmente en sala
                      </p>
                      <p className="font-semibold text-slate-900">
                        {expo.ObrasAunExhibidas}
                      </p>
                    </div>
                  )}
                </div>

                {expo.ListaObrasAunExhibidas && (
                  <div className="pt-3 border-t border-slate-100 text-sm text-slate-700">
                    <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                      Obras actualmente exhibidas
                    </p>
                    <p>{expo.ListaObrasAunExhibidas}</p>
                  </div>
                )}
              </div>
            )}


            {esVirtual && (
    <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-slate-700 space-y-2">
      <p className="font-semibold text-[#0F172A]">
        Esta es una exposición virtual ✨
      </p>
      <p>
        El recorrido se realiza en línea a través de la plataforma del Museo
        Veneris. Ideal para visitantes que desean explorar la colección desde
        cualquier lugar.
      </p>

      {tourUrl ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-slate-500">
            Enlace del tour (restringido)
          </span>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-500 cursor-not-allowed"
          >
            {/* iconito de candado */}
            {/* <Lock className="w-4 h-4" /> si lo importas */}
            Acceso disponible al adquirir el pase virtual
          </button>
          <p className="text-[11px] text-slate-400">
            La URL real se gestiona en el módulo de ventas / tours y se
            mostrará solo a usuarios autorizados.
          </p>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Esta exposición aún no tiene configurado el enlace del tour virtual.
        </p>
      )}
    </div>
  )}

            

            {/* Descripción */}
            <div>
              <h2 className="text-lg font-semibold text-[#0F172A] mb-2">
                Descripción
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                {descripcion}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
}
import { Suspense } from "react";

export default function ExposicionDetallePage() {
  return (
    <Suspense fallback={<p className="text-center py-20">Cargando exposición...</p>}>
      <ExposicionDetallePageContent />
    </Suspense>
  );
}
